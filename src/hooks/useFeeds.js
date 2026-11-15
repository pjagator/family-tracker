import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const SYNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-feeds`

// Calendar feeds (Canvas, Veracross, any .ics link) that fill the week in
// automatically. The hourly sync runs on the server; this hook only manages
// the list and offers a "sync now".
export function useFeeds(familyId) {
  const [feeds, setFeeds] = useState([])
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    if (!familyId) return
    const { data, error } = await supabase
      .from('feeds')
      .select('id, person, label, kind, default_category, enabled, last_synced_at, last_ok_at, last_status')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true })
    if (error) console.error('Failed to load feeds:', error)
    else setFeeds(data || [])
  }, [familyId])

  useEffect(() => { load() }, [load])

  const syncNow = async () => {
    setSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      // Direct fetch rather than supabase.functions.invoke (see CLAUDE.md).
      const res = await fetch(SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: '{}',
      })
      const body = await res.json().catch(() => ({}))
      await load()
      if (!res.ok) return { error: { message: body.error || `Sync failed (${res.status})` } }
      return { error: null, results: body.feeds || [] }
    } catch (err) {
      return { error: { message: err?.message || 'Sync failed' } }
    } finally {
      setSyncing(false)
    }
  }

  const add = async (feed) => {
    const { error } = await supabase.from('feeds').insert({ ...feed, family_id: familyId })
    if (error) return { error }
    await load()
    return syncNow()
  }

  const remove = async (id) => {
    const { error } = await supabase.from('feeds').delete().eq('id', id)
    if (error) return { error }
    await load()
    return { error: null }
  }

  return { feeds, syncing, add, remove, syncNow, reload: load }
}
