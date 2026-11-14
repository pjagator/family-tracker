import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/cache'
import { useResume } from './useResume'

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Local-time date string (YYYY-MM-DD). toISOString() is UTC, which rolls to
// tomorrow after 8pm Eastern and broke "today" logic in the evening.
function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function nextDayNum(dn) {
  return (dn % 8) + 1
}

function weekdays(dates) {
  return dates.slice(0, 5)
}

// Recalc day numbers from editDate forward, skipping global no-school only
function recalcForward(editDate, editNum, wkDays, globalNoSchool) {
  const result = {}
  const editIdx = wkDays.indexOf(editDate)
  if (editIdx === -1) return result

  if (!globalNoSchool.has(editDate)) {
    result[editDate] = editNum
  }

  let lastNum = editNum
  for (let i = editIdx + 1; i < wkDays.length; i++) {
    if (globalNoSchool.has(wkDays[i])) continue
    lastNum = nextDayNum(lastNum)
    result[wkDays[i]] = lastNum
  }
  return result
}

// Auto-fill a full week from a starting number, skipping global no-school
function autoFillWeek(startNum, wkDays, globalNoSchool) {
  const result = {}
  let current = startNum
  let first = true
  for (const date of wkDays) {
    if (globalNoSchool.has(date)) continue
    if (first) {
      result[date] = current
      first = false
    } else {
      current = nextDayNum(current)
      result[date] = current
    }
  }
  return result
}

// Find the last school day's day number
function getLastDayNum(dayNumbers, wkDays, globalNoSchool) {
  for (let i = wkDays.length - 1; i >= 0; i--) {
    if (globalNoSchool.has(wkDays[i])) continue
    if (dayNumbers[wkDays[i]]) return dayNumbers[wkDays[i]]
  }
  return null
}

// Which recurring items should be added to this week. `fromDate` limits fill to
// today onward for weeks that already exist; `taken` holds person|category|date
// keys that already have an entry.
function buildRecurringEntries(recurring, dates, { familyId, weekId, fromDate, taken }) {
  const out = []
  for (const item of recurring) {
    const effectiveStart = item.start_date || (item.created_at ? item.created_at.split('T')[0] : '2000-01-01')
    const effectiveEnd = item.end_date || '9999-12-31'
    const matchDate = dates.find(d =>
      new Date(d + 'T00:00:00').getDay() === item.day_of_week
      && (!fromDate || d >= fromDate)
      && d >= effectiveStart
      && d <= effectiveEnd
    )
    if (!matchDate) continue
    const key = `${item.person}|${item.category}|${matchDate}`
    if (taken.has(key)) continue
    taken.add(key)
    out.push({
      family_id: familyId,
      week_id: weekId,
      date: matchDate,
      person: item.person,
      category: item.category,
      content: item.content,
    })
  }
  return out
}

// Fetch the week row. Tolerates duplicates (oldest row wins) instead of
// failing, which is what .single() did when two phones created the same week.
async function fetchWeek(familyId, startDate) {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('family_id', familyId)
    .eq('start_date', startDate)
    .order('id', { ascending: true })
    .limit(1)
  return { week: data?.[0] || null, error }
}

export function useWeek(familyId) {
  const [week, setWeek] = useState(null)
  const [weekDates, setWeekDates] = useState([])
  const [dayNumbers, setDayNumbersState] = useState({})
  const [globalNoSchool, setGlobalNoSchoolState] = useState([])
  const [personNoSchool, setPersonNoSchoolState] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))
  const requestRef = useRef(0)

  const loadOrCreateWeek = useCallback(async (monday, { silent = false } = {}) => {
    if (!familyId) return
    const requestId = ++requestRef.current
    const isCurrent = () => requestId === requestRef.current

    const startDate = formatDate(monday)
    const endDate = formatDate(addDays(monday, 6))
    const dates = []
    for (let i = 0; i < 7; i++) {
      dates.push(formatDate(addDays(monday, i)))
    }

    const apply = (data) => {
      setWeek(data)
      setWeekDates(dates)
      setDayNumbersState(data.day_numbers || {})
      setGlobalNoSchoolState(data.global_no_school || [])
      setPersonNoSchoolState(data.person_no_school || {})
      setError(null)
      setLoading(false)
    }

    // Paint the saved copy first; refresh from the server underneath.
    const cacheKey = `week_${familyId}_${startDate}`
    const cached = cacheGet(cacheKey)
    if (!silent) {
      if (cached) apply(cached)
      else setLoading(true)
    }

    const fail = (err, what) => {
      console.error(what, err)
      if (!isCurrent()) return
      // Keep whatever is on screen if we have it; otherwise surface the error
      // so the UI can offer a retry instead of a blank page.
      if (!cached && !silent) {
        setWeek(null)
        setWeekDates(dates)
        setError(err)
      }
      setLoading(false)
    }

    let { week: data, error: loadErr } = await fetchWeek(familyId, startDate)
    if (loadErr) return fail(loadErr, 'Failed to load week:')
    if (!isCurrent()) return

    const today = formatDate(new Date())
    let isNewWeek = false

    if (!data) {
      // Carry day numbers over from the previous week
      const prevMonday = addDays(monday, -7)
      const { week: prevWeek } = await fetchWeek(familyId, formatDate(prevMonday))

      let autoDayNumbers = {}
      if (prevWeek?.day_numbers) {
        const prevDates = []
        for (let i = 0; i < 7; i++) {
          prevDates.push(formatDate(addDays(prevMonday, i)))
        }
        const prevGlobal = new Set(prevWeek.global_no_school || [])
        const lastNum = getLastDayNum(prevWeek.day_numbers, weekdays(prevDates), prevGlobal)
        if (lastNum) {
          autoDayNumbers = autoFillWeek(nextDayNum(lastNum), weekdays(dates), new Set())
        }
      }

      const { data: created, error: createErr } = await supabase
        .from('weeks')
        .insert({
          family_id: familyId,
          start_date: startDate,
          end_date: endDate,
          day_numbers: autoDayNumbers,
          global_no_school: [],
          person_no_school: {},
        })
        .select()
        .single()

      if (createErr) {
        // Most likely the other parent's phone created it a moment ago.
        const retry = await fetchWeek(familyId, startDate)
        if (!retry.week) return fail(createErr, 'Failed to create week:')
        data = retry.week
      } else {
        data = created
        isNewWeek = true
      }
    }

    // Auto-populate recurring activities. New weeks get the whole week; existing
    // weeks only today onward; past weeks never gain entries, so skip the queries.
    if (isNewWeek || dates[6] >= today) {
      const { data: recurring } = await supabase
        .from('recurring')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)

      if (recurring?.length) {
        const { data: existingEntries, error: existingErr } = await supabase
          .from('entries')
          .select('person, category, date')
          .eq('week_id', data.id)

        // If we cannot see what is already there, do not add anything: adding
        // blind is how duplicate recurring entries appear.
        if (!existingErr) {
          const taken = new Set(
            (existingEntries || []).map(e => `${e.person}|${e.category}|${e.date}`)
          )
          const autoEntries = buildRecurringEntries(recurring, dates, {
            familyId,
            weekId: data.id,
            fromDate: isNewWeek ? null : today,
            taken,
          })
          if (autoEntries.length) {
            const { error: entryErr } = await supabase.from('entries').insert(autoEntries)
            if (entryErr) console.error('Failed to auto-populate recurring:', entryErr)
          }
        }
      }
    }

    cacheSet(cacheKey, data)
    if (!isCurrent()) return
    apply(data)
  }, [familyId])

  useEffect(() => {
    loadOrCreateWeek(currentMonday)
  }, [currentMonday, loadOrCreateWeek])

  // Coming back to the app: refresh quietly, and if the phone sat on what was
  // "this week" across a Sunday night, roll forward to the real current week.
  const lastTodayRef = useRef(formatDate(new Date()))
  useResume(() => {
    const today = formatDate(new Date())
    const dayChanged = today !== lastTodayRef.current
    lastTodayRef.current = today
    const realMonday = getMonday(new Date())
    if (dayChanged && formatDate(realMonday) !== formatDate(currentMonday)
        && formatDate(addDays(currentMonday, 7)) === formatDate(realMonday)) {
      setCurrentMonday(realMonday)
    } else {
      loadOrCreateWeek(currentMonday, { silent: true })
    }
  })

  const reload = () => loadOrCreateWeek(currentMonday)

  const persistWeek = async (updates) => {
    const { error } = await supabase
      .from('weeks')
      .update(updates)
      .eq('id', week.id)
    if (error) console.error('Failed to update week:', error)
    else {
      const merged = { ...week, ...updates }
      setWeek(merged)
      cacheSet(`week_${familyId}_${week.start_date}`, merged)
    }
    return { error }
  }

  // Set a day number and recalc forward (only global no-school skips count)
  const setDayNumber = async (date, num) => {
    const wkDays = weekdays(weekDates)
    const globalSet = new Set(globalNoSchool)
    const editIdx = wkDays.indexOf(date)

    // Preserve days before the edited date
    const preserved = {}
    for (let i = 0; i < editIdx; i++) {
      if (dayNumbers[wkDays[i]] && !globalSet.has(wkDays[i])) {
        preserved[wkDays[i]] = dayNumbers[wkDays[i]]
      }
    }

    if (num === null) {
      const updated = { ...preserved }
      let prevNum = null
      for (let i = editIdx - 1; i >= 0; i--) {
        if (!globalSet.has(wkDays[i]) && preserved[wkDays[i]]) {
          prevNum = preserved[wkDays[i]]
          break
        }
      }
      if (prevNum && editIdx + 1 < wkDays.length) {
        const forward = recalcForward(wkDays[editIdx + 1], nextDayNum(prevNum), wkDays, globalSet)
        Object.assign(updated, forward)
      }
      setDayNumbersState(updated)
      await persistWeek({ day_numbers: updated })
    } else {
      const forward = recalcForward(date, num, wkDays, globalSet)
      const updated = { ...preserved, ...forward }
      setDayNumbersState(updated)
      await persistWeek({ day_numbers: updated })
    }
  }

  // Toggle global no-school for a date (affects day number count)
  const toggleGlobalNoSchool = async (date) => {
    const wkDays = weekdays(weekDates)
    const isCurrently = globalNoSchool.includes(date)
    const newGlobal = isCurrently
      ? globalNoSchool.filter(d => d !== date)
      : [...globalNoSchool, date]
    const globalSet = new Set(newGlobal)

    // Recalc day numbers: find first anchor before or at this date
    const dateIdx = wkDays.indexOf(date)
    let anchorNum = null
    let anchorIdx = -1
    for (let i = 0; i < wkDays.length; i++) {
      if (globalSet.has(wkDays[i])) continue
      if (dayNumbers[wkDays[i]] && i <= dateIdx) {
        // Use the latest anchor at or before dateIdx
        anchorNum = dayNumbers[wkDays[i]]
        anchorIdx = i
      }
    }
    // If no anchor before, look for first anchor after
    if (anchorIdx === -1) {
      for (let i = 0; i < wkDays.length; i++) {
        if (globalSet.has(wkDays[i])) continue
        if (dayNumbers[wkDays[i]]) {
          anchorNum = dayNumbers[wkDays[i]]
          anchorIdx = i
          break
        }
      }
    }

    let updated = {}
    if (anchorIdx >= 0) {
      // Preserve everything up to anchor, then fill forward
      for (let i = 0; i < anchorIdx; i++) {
        if (dayNumbers[wkDays[i]] && !globalSet.has(wkDays[i])) {
          updated[wkDays[i]] = dayNumbers[wkDays[i]]
        }
      }
      const forward = recalcForward(wkDays[anchorIdx], anchorNum, wkDays, globalSet)
      Object.assign(updated, forward)
    }

    setGlobalNoSchoolState(newGlobal)
    setDayNumbersState(updated)
    await persistWeek({ global_no_school: newGlobal, day_numbers: updated })
  }

  // Toggle per-person no-school for a specific person+date
  const togglePersonNoSchool = async (person, date) => {
    const current = personNoSchool[person] || []
    const isCurrently = current.includes(date)
    const updated = {
      ...personNoSchool,
      [person]: isCurrently
        ? current.filter(d => d !== date)
        : [...current, date],
    }
    setPersonNoSchoolState(updated)
    await persistWeek({ person_no_school: updated })
  }

  const goToPrevWeek = () => setCurrentMonday(prev => addDays(prev, -7))
  const goToNextWeek = () => setCurrentMonday(prev => addDays(prev, 7))
  const goToToday = () => setCurrentMonday(getMonday(new Date()))

  return {
    week, weekDates, dayNumbers, globalNoSchool, personNoSchool, loading, error, reload,
    goToPrevWeek, goToNextWeek, goToToday,
    setDayNumber, toggleGlobalNoSchool, togglePersonNoSchool,
  }
}
