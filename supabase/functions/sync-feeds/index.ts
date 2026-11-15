// Pulls each family's calendar feeds (Canvas, Veracross, any .ics link) into
// the tracker. Runs hourly from pg_cron, or on demand from the Settings screen.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { addDays, categoryFor, looksLikeTest, mondayOf, parseIcs, todayLocal } from './ical.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const WEEKS_AHEAD = 4

// Only fetch real calendar hosts over https; never internal addresses.
function safeFeedUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim().replace(/^webcal:/i, 'https:'))
    if (u.protocol !== 'https:') return null
    const h = u.hostname.toLowerCase()
    if (h === 'localhost' || /^[\d.]+$/.test(h) || h.includes(':') || !h.includes('.')) return null
    if (/\.(local|internal|lan)$/.test(h)) return null
    return u.toString()
  } catch {
    return null
  }
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'follow' })
  if (!res.ok) throw new Error(`Feed returned ${res.status}`)
  const text = await res.text()
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Not a calendar feed')
  return text
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  // Who is asking? The scheduler (shared secret, all families) or a signed-in
  // parent (their own family only).
  let familyFilter: string | null = null
  const cronSecret = req.headers.get('x-sync-secret')
  if (cronSecret) {
    const { data: ok } = await admin.rpc('verify_sync_secret', { p_secret: cronSecret })
    if (ok !== true) return json({ error: 'Not authorized' }, 401)
  } else {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return json({ error: 'Not authorized' }, 401)
    const { data: member } = await admin
      .from('family_members').select('family_id').eq('user_id', userData.user.id).limit(1).maybeSingle()
    if (!member) return json({ error: 'No family' }, 403)
    familyFilter = member.family_id
  }

  let feedQuery = admin.from('feeds').select('*').eq('enabled', true)
  if (familyFilter) feedQuery = feedQuery.eq('family_id', familyFilter)
  const { data: feeds, error: feedsErr } = await feedQuery
  if (feedsErr) return json({ error: feedsErr.message }, 500)

  const today = todayLocal()
  const windowStart = mondayOf(today)
  const windowEnd = addDays(windowStart, WEEKS_AHEAD * 7 - 1)
  const results = []

  for (const feed of feeds || []) {
    const result = { feed: feed.label, added: 0, updated: 0, removed: 0, error: null as string | null }
    try {
      const url = safeFeedUrl(feed.url)
      if (!url) throw new Error('Feed link must be an https or webcal address')
      const items = parseIcs(await fetchText(url)).filter((i) => i.date >= windowStart && i.date <= windowEnd)

      // Make sure a week row exists for every week we are about to write into.
      const weekIds = new Map<string, string>()
      for (const monday of [...new Set(items.map((i) => mondayOf(i.date)))].sort()) {
        const { data: week, error } = await admin.rpc('ensure_week', { p_family: feed.family_id, p_start: monday })
        if (error) throw new Error(`Week ${monday}: ${error.message}`)
        weekIds.set(monday, week.id)
      }

      const { data: existing, error: exErr } = await admin
        .from('entries').select('id, source_uid, date, content, category, is_test, week_id, due_at, source_url')
        .eq('feed_id', feed.id).gte('date', windowStart)
      if (exErr) throw new Error(exErr.message)
      const byUid = new Map((existing || []).map((e) => [e.source_uid, e]))

      const seen = new Set<string>()
      const inserts = []
      for (const item of items) {
        if (seen.has(item.uid)) continue
        seen.add(item.uid)
        const fields = {
          week_id: weekIds.get(mondayOf(item.date))!,
          date: item.date,
          category: feed.kind === 'canvas'
            ? categoryFor(item.course, feed.default_category || 'other')
            : (feed.default_category || 'other'),
          content: item.title,
          is_test: looksLikeTest(item.title),
          due_at: item.dueAt,
          source_url: item.url,
        }
        const prior = byUid.get(item.uid)
        if (!prior) {
          inserts.push({
            ...fields, family_id: feed.family_id, person: feed.person,
            source: feed.kind, feed_id: feed.id, source_uid: item.uid, sort_order: 100,
          })
        } else if (
          prior.date !== fields.date || prior.content !== fields.content || prior.category !== fields.category ||
          prior.is_test !== fields.is_test || prior.week_id !== fields.week_id || prior.source_url !== fields.source_url
        ) {
          // Never touches is_complete: a checked-off item stays checked off.
          const { error } = await admin.from('entries').update(fields).eq('id', prior.id)
          if (error) throw new Error(error.message)
          result.updated++
        }
      }
      if (inserts.length) {
        const { error } = await admin.from('entries').insert(inserts)
        if (error) throw new Error(error.message)
        result.added = inserts.length
      }

      // Items the teacher removed or moved out of range: drop them, but only
      // from today forward so history is never rewritten.
      const gone = (existing || []).filter((e) => !seen.has(e.source_uid) && e.date >= today).map((e) => e.id)
      if (gone.length) {
        const { error } = await admin.from('entries').delete().in('id', gone)
        if (error) throw new Error(error.message)
        result.removed = gone.length
      }
    } catch (err) {
      result.error = String((err as Error)?.message || err).slice(0, 300)
    }
    await admin.from('feeds').update({
      last_synced_at: new Date().toISOString(),
      last_status: result.error ? `Failed: ${result.error}` : 'ok',
      ...(result.error ? {} : { last_ok_at: new Date().toISOString() }),
    }).eq('id', feed.id)
    results.push(result)
  }

  return json({ ok: true, feeds: results })
})
