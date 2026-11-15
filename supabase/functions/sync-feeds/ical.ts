// Calendar-feed parsing, kept free of Deno APIs so it can be unit-tested anywhere.

export type FeedItem = {
  uid: string
  date: string // local YYYY-MM-DD in the school's time zone
  dueAt: string | null // ISO timestamp when the feed gave a time
  title: string
  course: string | null
  url: string | null
}

const SCHOOL_TZ = 'America/New_York'

function unescapeText(s: string): string {
  return s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').replace(/\s+/g, ' ').trim()
}

function localDate(d: Date): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHOOL_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

// DTSTART comes as a bare date, a UTC datetime (trailing Z), or a local datetime.
function parseStart(params: string, value: string): { date: string; dueAt: string | null } | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, hh, mm, ss, z] = m
  if (!hh) return { date: `${y}-${mo}-${d}`, dueAt: null }
  if (z) {
    const dt = new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss))
    return { date: localDate(dt), dueAt: dt.toISOString() }
  }
  // Local ("floating" or TZID) time: the calendar date is already the local date.
  void params
  return { date: `${y}-${mo}-${d}`, dueAt: null }
}

export function parseIcs(text: string): FeedItem[] {
  // Long lines are folded with a leading space or tab on the continuation.
  const unfolded = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '')
  const items: FeedItem[] = []
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const body = block.split('END:VEVENT')[0]
    const props: Record<string, { params: string; value: string }> = {}
    for (const line of body.split('\n')) {
      const m = line.match(/^([A-Z-]+)((?:;[^:]*)?):(.*)$/)
      if (m && !(m[1] in props)) props[m[1]] = { params: m[2], value: m[3] }
    }
    if (!props.UID || !props.DTSTART || !props.SUMMARY) continue
    const start = parseStart(props.DTSTART.params, props.DTSTART.value.trim())
    if (!start) continue

    let title = unescapeText(props.SUMMARY.value)
    let course: string | null = null
    // Canvas appends the course in square brackets.
    const bracket = title.match(/\s*\[([^\]]+)\]\s*$/)
    if (bracket) {
      course = bracket[1].trim()
      title = title.slice(0, bracket.index).trim()
    }
    // ...and sometimes the section in parentheses, e.g. "(SCIENCE-7-8 - Kummerer - MS Semester 1)".
    title = title.replace(/\s*\([^()]* - [^()]*\)\s*$/, '').trim()
    if (!title) continue

    const rawUrl = props.URL ? props.URL.value.trim() : ''
    items.push({
      uid: props.UID.value.trim(),
      date: start.date,
      dueAt: start.dueAt,
      title: title.slice(0, 300),
      course,
      url: /^https:\/\//.test(rawUrl) ? rawUrl.slice(0, 500) : null,
    })
  }
  return items
}

// Course name -> tracker row. Order matters: first match wins.
const COURSE_RULES: Array<[RegExp, string]> = [
  [/algebra|math|geometry/i, 'math'],
  [/social stud|history|civics|geography/i, 'ss'],
  [/language arts|\bela\b|english|literature|reading|writing/i, 'ela'],
  [/latin|spanish|french|world language/i, 'spanish'],
  [/religion|theology/i, 'religion'],
  [/science/i, 'science'],
]

export function categoryFor(course: string | null, fallback: string): string {
  if (course) {
    for (const [re, cat] of COURSE_RULES) if (re.test(course)) return cat
  }
  return fallback
}

// Over-flagging is deliberate: missing a test is the worst failure mode.
export function looksLikeTest(title: string): boolean {
  return /\b(test|quiz|exam|midterm|final|assessment|quick check|qc)\b/i.test(title)
}

export function mondayOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dow = dt.getUTCDay() // 0 Sun .. 6 Sat
  dt.setUTCDate(dt.getUTCDate() - (dow === 0 ? 6 : dow - 1))
  return dt.toISOString().slice(0, 10)
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return dt.toISOString().slice(0, 10)
}

export function todayLocal(now = new Date()): string {
  return localDate(now)
}
