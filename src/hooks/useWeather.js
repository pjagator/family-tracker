import { useState, useEffect } from 'react'

const TAMPA_LAT = 27.9506
const TAMPA_LNG = -82.4572

export function useWeather(weekDates) {
  const [weather, setWeather] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!weekDates?.length) return

    const startDate = weekDates[0]
    const endDate = weekDates[6]
    const cacheKey = `weather_${startDate}`

    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        // Cache valid for 1 hour for current/future weeks, forever for past
        const now = Date.now()
        const weekEnd = new Date(endDate + 'T23:59:59').getTime()
        if (weekEnd < now || (now - parsed.fetched_at < 3600000)) {
          setWeather(parsed.data)
          return
        }
      } catch (e) { /* ignore bad cache */ }
    }

    setLoading(true)
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${TAMPA_LAT}&longitude=${TAMPA_LNG}&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&timezone=America/New_York&start_date=${startDate}&end_date=${endDate}`
    )
      .then(res => res.json())
      .then(data => {
        if (!data.daily?.time) return
        const result = {}
        data.daily.time.forEach((date, i) => {
          result[date] = {
            high: Math.round(data.daily.temperature_2m_max[i]),
            low: Math.round(data.daily.temperature_2m_min[i]),
            code: data.daily.weather_code?.[i],
          }
        })
        setWeather(result)
        localStorage.setItem(cacheKey, JSON.stringify({ fetched_at: Date.now(), data: result }))
      })
      .catch(err => console.error('Weather fetch failed:', err))
      .finally(() => setLoading(false))
  }, [weekDates?.[0]])

  return { weather, loading }
}
