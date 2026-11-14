import { useEffect, useRef } from 'react'

// Runs `callback` when the app comes back to the foreground or back online.
// iPhone suspends an installed web app in the background: its live connection
// dies silently and the screen keeps showing whatever was there hours ago.
export function useResume(callback, minHiddenMs = 3000) {
  const cbRef = useRef(callback)
  useEffect(() => { cbRef.current = callback })

  useEffect(() => {
    let hiddenAt = document.hidden ? Date.now() : null

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        return
      }
      const away = hiddenAt ? Date.now() - hiddenAt : 0
      hiddenAt = null
      if (away >= minHiddenMs) cbRef.current()
    }
    const onOnline = () => cbRef.current()
    const onPageShow = (e) => { if (e.persisted) cbRef.current() }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [minHiddenMs])
}
