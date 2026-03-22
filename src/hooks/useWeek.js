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

export function useWeek(userId) {
  const [week, setWeek] = useState(null)
  const [weekDates, setWeekDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))

  const loadOrCreateWeek = useCallback(async (monday) => {
    if (!userId) return
    setLoading(true)

    const startDate = formatDate(monday)
    const endDate = formatDate(addDays(monday, 6))

    // Try to load existing week
    let { data, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('user_id', userId)
      .eq('start_date', startDate)
      .single()

    if (error && error.code === 'PGRST116') {
      // Not found, create it
      const { data: created, error: createErr } = await supabase
        .from('weeks')
        .insert({ user_id: userId, start_date: startDate, end_date: endDate })
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

    // Build array of 7 dates (Mon-Sun)
    const dates = []
    for (let i = 0; i < 7; i++) {
      dates.push(formatDate(addDays(monday, i)))
    }
    setWeekDates(dates)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadOrCreateWeek(currentMonday)
  }, [currentMonday, loadOrCreateWeek])

  const goToPrevWeek = () => setCurrentMonday(prev => addDays(prev, -7))
  const goToNextWeek = () => setCurrentMonday(prev => addDays(prev, 7))
  const goToToday = () => setCurrentMonday(getMonday(new Date()))

  return { week, weekDates, loading, goToPrevWeek, goToNextWeek, goToToday }
}
