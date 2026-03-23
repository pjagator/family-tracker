// src/hooks/useSwipeDismiss.js
import { useRef, useCallback } from 'react'

export function useSwipeDismiss({ onDismiss, threshold = 0.3 }) {
  const sheetRef = useRef(null)
  const startY = useRef(null)
  const currentY = useRef(0)
  const isDragging = useRef(false)

  const onTouchStart = useCallback((e) => {
    startY.current = e.touches[0].clientY
    isDragging.current = false
  }, [])

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy < 0) return // only allow downward drag
    // Only activate swipe when sheet is scrolled to top (avoid conflict with scroll)
    if (sheetRef.current && sheetRef.current.scrollTop > 0 && !isDragging.current) return

    isDragging.current = true
    currentY.current = dy
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`
      sheetRef.current.style.transition = 'none'
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (startY.current === null) return
    startY.current = null

    if (!isDragging.current) return

    const el = sheetRef.current
    if (!el) return
    const sheetHeight = el.offsetHeight
    const pct = currentY.current / sheetHeight

    if (pct > threshold) {
      // Dismiss: animate off screen
      el.style.transition = 'transform 250ms ease-in'
      el.style.transform = `translateY(100%)`
      setTimeout(() => {
        el.style.transform = ''
        el.style.transition = ''
        onDismiss()
      }, 250)
    } else {
      // Snap back
      el.style.transition = 'transform 200ms ease-out'
      el.style.transform = 'translateY(0)'
      setTimeout(() => {
        el.style.transition = ''
      }, 200)
    }
    currentY.current = 0
    isDragging.current = false
  }, [onDismiss, threshold])

  return { sheetRef, onTouchStart, onTouchMove, onTouchEnd }
}
