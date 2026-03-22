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

// Get weekday dates (Mon-Fri) from a full 7-day dates array
function weekdays(dates) {
  return dates.slice(0, 5)
}

// Fill day numbers forward from a starting point, skipping no-school days
function fillForward(startNum, dates, startIndex, noSchool) {
  const result = {}
  let current = startNum
  for (let i = startIndex; i < dates.length; i++) {
    const date = dates[i]
    if (noSchool.has(date)) continue // skip no-school days
    current = i === startIndex ? startNum : nextDayNum(current)
    // Wait, need to handle first iteration correctly
    // On the startIndex itself, use startNum directly
    result[date] = current
  }
  return result
}

// Recalculate all day numbers for weekdays given a manual edit at editDate
// Preserve everything before editDate, recalculate editDate and forward
function recalcFromEdit(editDate, editNum, wkDays, noSchool) {
  const result = {}
  const editIdx = wkDays.indexOf(editDate)
  if (editIdx === -1) return result

  // Set the edited day
  if (!noSchool.has(editDate)) {
    result[editDate] = editNum
  }

  // Fill forward from the day after editDate
  let lastNum = editNum
  for (let i = editIdx + 1; i < wkDays.length; i++) {
    if (noSchool.has(wkDays[i])) continue
    lastNum = nextDayNum(lastNum)
    result[wkDays[i]] = lastNum
  }

  return result
}

// Auto-fill a full week from a starting number (for new weeks / carry-over)
function autoFillWeek(startNum, wkDays, noSchool) {
  const result = {}
  let current = startNum
  let first = true
  for (const date of wkDays) {
    if (noSchool.has(date)) continue
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

// Find the last school day's day number from a week
function getLastDayNum(dayNumbers, wkDays, noSchool) {
  for (let i = wkDays.length - 1; i >= 0; i--) {
    if (noSchool.has(wkDays[i])) continue
    if (dayNumbers[wkDays[i]]) return dayNumbers[wkDays[i]]
  }
  return null
}

export function useWeek(familyId) {
  const [week, setWeek] = useState(null)
  const [weekDates, setWeekDates] = useState([])
  const [dayNumbers, setDayNumbersState] = useState({})
  const [noSchoolDays, setNoSchoolDaysState] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))

  const loadOrCreateWeek = useCallback(async (monday) => {
    if (!familyId) return
    setLoading(true)

    const startDate = formatDate(monday)
    const endDate = formatDate(addDays(monday, 6))

    // Build dates array
    const dates = []
    for (let i = 0; i < 7; i++) {
      dates.push(formatDate(addDays(monday, i)))
    }

    // Try to load existing week
    let { data, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('family_id', familyId)
      .eq('start_date', startDate)
      .single()

    if (error && error.code === 'PGRST116') {
      // Not found -- look up previous week to carry over day numbers
      const prevMonday = addDays(monday, -7)
      const prevStartDate = formatDate(prevMonday)
      const { data: prevWeek } = await supabase
        .from('weeks')
        .select('day_numbers, no_school_days, start_date')
        .eq('family_id', familyId)
        .eq('start_date', prevStartDate)
        .single()

      let autoDayNumbers = {}
      if (prevWeek?.day_numbers) {
        const prevDates = []
        for (let i = 0; i < 7; i++) {
          prevDates.push(formatDate(addDays(prevMonday, i)))
        }
        const prevNoSchool = new Set(prevWeek.no_school_days || [])
        const lastNum = getLastDayNum(prevWeek.day_numbers, weekdays(prevDates), prevNoSchool)
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
          no_school_days: [],
        })
        .select()
        .single()

      if (createErr) {
        console.error('Failed to create week:', createErr)
        setLoading(false)
        return
      }
      data = created
    } else if (error) {
      console.error('Failed to load week:', error)
      setLoading(false)
      return
    }

    setWeek(data)
    setWeekDates(dates)
    setDayNumbersState(data.day_numbers || {})
    setNoSchoolDaysState(data.no_school_days || [])
    setLoading(false)
  }, [familyId])

  useEffect(() => {
    loadOrCreateWeek(currentMonday)
  }, [currentMonday, loadOrCreateWeek])

  // Save both day_numbers and no_school_days to DB
  const persistWeek = async (newDayNumbers, newNoSchool) => {
    const { error } = await supabase
      .from('weeks')
      .update({ day_numbers: newDayNumbers, no_school_days: newNoSchool })
      .eq('id', week.id)
    if (error) console.error('Failed to update week:', error)
  }

  const setDayNumber = async (date, num) => {
    const wkDays = weekdays(weekDates)
    const noSchool = new Set(noSchoolDays)

    // Preserve days before the edited date
    const editIdx = wkDays.indexOf(date)
    const preserved = {}
    for (let i = 0; i < editIdx; i++) {
      if (dayNumbers[wkDays[i]]) preserved[wkDays[i]] = dayNumbers[wkDays[i]]
    }

    if (num === null) {
      // Clearing: remove this date's number and recalc forward from previous
      const updated = { ...preserved }
      // Find the day number right before this date
      let prevNum = null
      for (let i = editIdx - 1; i >= 0; i--) {
        if (!noSchool.has(wkDays[i]) && preserved[wkDays[i]]) {
          prevNum = preserved[wkDays[i]]
          break
        }
      }
      if (prevNum) {
        const forwardFill = recalcFromEdit(wkDays[editIdx + 1], nextDayNum(prevNum), wkDays.slice(editIdx + 1), noSchool)
        // Remap keys since recalcFromEdit uses the slice
        for (let i = editIdx + 1; i < wkDays.length; i++) {
          if (noSchool.has(wkDays[i])) continue
          if (forwardFill[wkDays[i]]) updated[wkDays[i]] = forwardFill[wkDays[i]]
        }
      }
      setDayNumbersState(updated)
      await persistWeek(updated, noSchoolDays)
    } else {
      // Setting a number: recalc this date and everything after
      const forward = recalcFromEdit(date, num, wkDays, noSchool)
      const updated = { ...preserved, ...forward }
      setDayNumbersState(updated)
      await persistWeek(updated, noSchoolDays)
    }
  }

  const toggleNoSchool = async (date) => {
    const wkDays = weekdays(weekDates)
    const isCurrentlyNoSchool = noSchoolDays.includes(date)
    let newNoSchool

    if (isCurrentlyNoSchool) {
      // Remove from no-school
      newNoSchool = noSchoolDays.filter(d => d !== date)
    } else {
      // Add to no-school
      newNoSchool = [...noSchoolDays, date]
    }

    const noSchoolSet = new Set(newNoSchool)

    // Find the first school day with a day number before or at this date to recalc from
    const dateIdx = wkDays.indexOf(date)
    let anchorNum = null
    let anchorIdx = -1
    for (let i = dateIdx - 1; i >= 0; i--) {
      if (!noSchoolSet.has(wkDays[i]) && dayNumbers[wkDays[i]]) {
        anchorNum = dayNumbers[wkDays[i]]
        anchorIdx = i
        break
      }
    }

    // Rebuild day numbers: preserve everything before anchor, recalc from anchor forward
    const updated = {}

    if (anchorIdx >= 0) {
      // Preserve up to and including anchor
      for (let i = 0; i <= anchorIdx; i++) {
        if (dayNumbers[wkDays[i]] && !noSchoolSet.has(wkDays[i])) {
          updated[wkDays[i]] = dayNumbers[wkDays[i]]
        }
      }
      // Fill forward from anchor
      let current = anchorNum
      for (let i = anchorIdx + 1; i < wkDays.length; i++) {
        if (noSchoolSet.has(wkDays[i])) continue
        current = nextDayNum(current)
        updated[wkDays[i]] = current
      }
    } else if (dateIdx === 0 || !Object.keys(dayNumbers).length) {
      // No anchor found and editing first day or empty -- check if there's a number after
      for (let i = 0; i < wkDays.length; i++) {
        if (noSchoolSet.has(wkDays[i])) continue
        if (dayNumbers[wkDays[i]]) {
          // Found a number after, use it as anchor
          updated[wkDays[i]] = dayNumbers[wkDays[i]]
          let current = dayNumbers[wkDays[i]]
          for (let j = i + 1; j < wkDays.length; j++) {
            if (noSchoolSet.has(wkDays[j])) continue
            current = nextDayNum(current)
            updated[wkDays[j]] = current
          }
          break
        }
      }
    }

    setNoSchoolDaysState(newNoSchool)
    setDayNumbersState(updated)
    await persistWeek(updated, newNoSchool)
  }

  const goToPrevWeek = () => setCurrentMonday(prev => addDays(prev, -7))
  const goToNextWeek = () => setCurrentMonday(prev => addDays(prev, 7))
  const goToToday = () => setCurrentMonday(getMonday(new Date()))

  return {
    week, weekDates, dayNumbers, noSchoolDays, loading,
    goToPrevWeek, goToNextWeek, goToToday,
    setDayNumber, toggleNoSchool,
  }
}
