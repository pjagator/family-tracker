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

// Given previous week's day_numbers, compute next week's auto-incremented values
function autoIncrementDayNumbers(prevDayNumbers, prevWeekDates, newWeekDates) {
  if (!prevDayNumbers || !prevWeekDates?.length) return {}

  // Find the last assigned day number from previous week (scan Fri->Mon)
  let lastDayNum = null
  for (let i = 4; i >= 0; i--) {
    const dn = prevDayNumbers[prevWeekDates[i]]
    if (dn) { lastDayNum = dn; break }
  }
  if (!lastDayNum) return {}

  // Auto-assign Mon-Fri of new week, cycling 1-8
  const result = {}
  let current = lastDayNum
  for (let i = 0; i < 5; i++) {
    current = (current % 8) + 1
    result[newWeekDates[i]] = current
  }
  return result
}

export function useWeek(familyId) {
  const [week, setWeek] = useState(null)
  const [weekDates, setWeekDates] = useState([])
  const [dayNumbers, setDayNumbersState] = useState({})
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
      // Not found -- look up previous week to auto-increment day numbers
      const prevMonday = addDays(monday, -7)
      const prevStartDate = formatDate(prevMonday)
      const { data: prevWeek } = await supabase
        .from('weeks')
        .select('day_numbers, start_date')
        .eq('family_id', familyId)
        .eq('start_date', prevStartDate)
        .single()

      let autoDayNumbers = {}
      if (prevWeek?.day_numbers) {
        const prevDates = []
        for (let i = 0; i < 7; i++) {
          prevDates.push(formatDate(addDays(prevMonday, i)))
        }
        autoDayNumbers = autoIncrementDayNumbers(prevWeek.day_numbers, prevDates, dates)
      }

      const { data: created, error: createErr } = await supabase
        .from('weeks')
        .insert({
          family_id: familyId,
          start_date: startDate,
          end_date: endDate,
          day_numbers: autoDayNumbers,
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
    setLoading(false)
  }, [familyId])

  useEffect(() => {
    loadOrCreateWeek(currentMonday)
  }, [currentMonday, loadOrCreateWeek])

  const setDayNumber = async (date, num) => {
    const updated = { ...dayNumbers, [date]: num || null }
    // Remove null entries
    if (!num) delete updated[date]

    setDayNumbersState(updated)

    const { error } = await supabase
      .from('weeks')
      .update({ day_numbers: updated })
      .eq('id', week.id)

    if (error) console.error('Failed to update day number:', error)
  }

  const goToPrevWeek = () => setCurrentMonday(prev => addDays(prev, -7))
  const goToNextWeek = () => setCurrentMonday(prev => addDays(prev, 7))
  const goToToday = () => setCurrentMonday(getMonday(new Date()))

  return { week, weekDates, dayNumbers, loading, goToPrevWeek, goToNextWeek, goToToday, setDayNumber }
}
