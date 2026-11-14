// BUILD_ID is stamped in at build time (see vite.config.js), so every deploy
// gets a fresh cache automatically. No manual version bump needed.
const BUILD_ID = '__BUILD_ID__'
const CACHE_NAME = `family-tracker-${BUILD_ID}`
const NAV_TIMEOUT_MS = 3000

// Save the page and the JS/CSS it points at, so the app can open with no
// network from the very next launch.
async function precache() {
  const cache = await caches.open(CACHE_NAME)
  const res = await fetch(new Request('/', { cache: 'reload' }))
  if (!res.ok) throw new Error(`Shell fetch failed: ${res.status}`)
  const html = await res.clone().text()
  await cache.put('/', res)
  const assets = [...new Set(html.match(/\/assets\/[^"'\s>]+/g) || [])]
  await Promise.all(assets.map((url) => cache.add(url).catch(() => {})))
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

async function putInCache(request, response) {
  if (!response || !response.ok) return
  const cache = await caches.open(CACHE_NAME)
  await cache.put(request, response)
}

// Page loads: try the network, but never wait more than a few seconds on a
// weak connection. Fall back to the saved copy so the app always opens.
async function handleNavigation(request) {
  const cached = await caches.match('/')
  const network = fetch(request)
    .then((res) => {
      if (res.ok) putInCache('/', res.clone()).catch(() => {})
      return res
    })

  if (!cached) return network

  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NAV_TIMEOUT_MS))
  try {
    const winner = await Promise.race([network, timeout])
    if (winner && winner.ok) return winner
  } catch { /* offline: fall through to the saved copy */ }
  network.catch(() => {})
  return cached
}

// Built JS/CSS files have a unique hash in their name and never change.
async function handleAsset(request) {
  // Match on the URL alone: the file name already contains a content hash.
  const cached = await caches.match(request.url, { ignoreVary: true })
  if (cached) return cached
  const res = await fetch(request)
  putInCache(request, res.clone()).catch(() => {})
  return res
}

async function handleOther(request) {
  try {
    const res = await fetch(request)
    putInCache(request, res.clone()).catch(() => {})
    return res
  } catch (err) {
    const cached = await caches.match(request)
    if (cached) return cached
    throw err
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Supabase, weather and fonts go straight to the network. Caching API and
  // sign-in responses here used to serve stale data that looked current.
  if (url.origin !== self.location.origin) return
  if (url.pathname === '/version.json') return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(handleAsset(request))
  } else {
    event.respondWith(handleOther(request))
  }
})
