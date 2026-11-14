// Small saved-copy store (localStorage) so the app can paint the last known
// data instantly and still show something when the network is down.
const PREFIX = 'ft_cache_'

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw).value : null
  } catch {
    return null
  }
}

export function cacheSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ saved_at: Date.now(), value }))
  } catch {
    // Storage full or unavailable (private mode): drop old week copies and move on.
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX + 'entries_') || k.startsWith(PREFIX + 'week_'))
        .forEach((k) => localStorage.removeItem(k))
    } catch { /* ignore */ }
  }
}

export function cacheClearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
}
