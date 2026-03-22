import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d) {
  return d.toISOString().split('T')[0]
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

export function useWeek(familyId) {
  const [week, setWeek] = useState(null)
  const [weekDates, setWeekDates] = useState([])
  const [dayNumbers, setDayNumbersState] = useState({})
  const [globalNoSchool, setGlobalNoSchoolState] = useState([])
  const [personNoSchool, setPersonNoSchoolState] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))

  const loadOrCreateWeek = useCallback(async (monday) => {
    if (!familyId) return
    setLoading(true)

    const startDate = formatDate(monday)
    const endDate = formatDate(addDays(monday, 6))

    const dates = []
    for (let i = 0; i < 7; i++) {
      dates.push(formatDate(addDays(monday, i)))
    }

    let { data, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('family_id', familyId)
      .eq('start_date', startDate)
      .single()

    if (error && error.code === 'PGRST116') {
      // Carry over from previous week
      const prevMonday = addDays(monday, -7)
      const prevStartDate = formatDate(prevMonday)
      const { data: prevWeek } = await supabase
        .from('weeks')
        .select('day_numbers, global_no_school, start_date')
        .eq('family_id', familyId)
        .eq('start_date', prevStartDate)
        .single()

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
        console.error('Failed to create week:', createErr)
        setLoading(false)
        return
      }
      data = created

      // Auto-populate from recurring activities
      const { data: recurring } = await supabase
        .from('recurring')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true)

      if (recurring?.length) {
        const autoEntries = []
        for (const item of recurring) {
          // Find the date in this week that matches the day_of_week
          const matchDate = dates.find(d => new Date(d + 'T00:00:00').getDay() === item.day_of_week)
          if (matchDate) {
            autoEntries.push({
              family_id: familyId,
              week_id: data.id,
              date: matchDate,
              person: item.person,
              category: item.category,
              content: item.content,
            })
          }
        }
        if (autoEntries.length) {
          const { error: entryErr } = await supabase.from('entries').insert(autoEntries)
          if (entryErr) console.error('Failed to auto-populate recurring:', entryErr)
        }
      }
    } else if (error) {
      console.error('Failed to load week:', error)
      setLoading(false)
      return
    }

    setWeek(data)
    setWeekDates(dates)
    setDayNumbersState(data.day_numbers || {})
    setGlobalNoSchoolState(data.global_no_school || [])
    setPersonNoSchoolState(data.person_no_school || {})
    setLoading(false)
  }, [familyId])

  useEffect(() => {
    loadOrCreateWeek(currentMonday)
  }, [currentMonday, loadOrCreateWeek])

  const persistWeek = async (updates) => {
    const { error } = await supabase
      .from('weeks')
      .update(updates)
      .eq('id', week.id)
    if (error) console.error('Failed to update week:', error)
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
    week, weekDates, dayNumbers, globalNoSchool, personNoSchool, loading,
    goToPrevWeek, goToNextWeek, goToToday,
    setDayNumber, toggleGlobalNoSchool, togglePersonNoSchool,
  }
}
