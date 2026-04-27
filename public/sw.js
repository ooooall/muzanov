// Quarters PWA — Service Worker
// Strategy: cache-first for static, network-first for pages, network-only for API/Supabase

const CACHE = 'quarters-v2'

const NEVER_CACHE = [
  '/api/',
  '/auth/',
  'supabase.co',
  'supabase.in',
]

const STATIC_PATHS = [
  '/_next/static/',
  '/api/icon/',
]

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', () => {
  // Take over immediately without waiting for old SW to die
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  // Delete any old caches, then claim clients
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Pass through: non-GET, WebSocket upgrades, and anything we never cache
  if (request.method !== 'GET') return
  if (request.headers.get('upgrade') === 'websocket') return
  if (NEVER_CACHE.some((s) => url.pathname.startsWith(s) || url.hostname.includes(s))) return

  const isStatic = STATIC_PATHS.some((p) => url.pathname.startsWith(p))

  if (isStatic) {
    // Cache-first: hashed Next.js chunks never change
    e.respondWith(fromCacheFirst(request))
  } else {
    // Network-first: pages always get fresh content, fall back to cache
    e.respondWith(fromNetworkFirst(request))
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fromCacheFirst(request) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(request)
  if (hit) return hit

  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

async function fromNetworkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const hit = await cache.match(request)
    return hit ?? Response.error()
  }
}
