import { useState, useEffect, useCallback } from 'react'

export function useMobileView(weekDates) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
  )
  const [startIdx, setStartIdx] = useState(0)

  // Listen for viewport changes
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Auto-center on today when week changes
  useEffect(() => {
    if (!weekDates.length) return
    const today = new Date().toISOString().split('T')[0]
    const todayIdx = weekDates.indexOf(today)
    if (todayIdx >= 0) {
      // Center today in the 3-day window
      setStartIdx(Math.max(0, Math.min(todayIdx - 1, 4)))
    } else {
      setStartIdx(0)
    }
  }, [weekDates[0]])

  const visibleDates = isMobile ? weekDates.slice(startIdx, startIdx + 3) : weekDates

  const canSlideLeft = startIdx > 0
  const canSlideRight = startIdx < 4

  const slideLeft = useCallback(() => {
    setStartIdx(prev => Math.max(0, prev - 1))
  }, [])

  const slideRight = useCallback(() => {
    setStartIdx(prev => Math.min(4, prev + 1))
  }, [])

  return {
    isMobile,
    visibleDates,
    startIdx,
    canSlideLeft,
    canSlideRight,
    slideLeft,
    slideRight,
  }
}
