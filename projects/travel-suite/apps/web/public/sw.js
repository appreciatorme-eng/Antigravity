// Service Worker for TourOS PWA
// Caches app shell for offline access
// Special: trip detail pages cached for drivers in low-signal zones

const CACHE_NAME = 'touros-v1'
const APP_SHELL = [
  '/',
  '/trips',
  '/inbox',
  '/offline',
]

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network first, fallback to cache, fallback to offline page
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for trip pages (for drivers offline)
        if (response.ok && event.request.url.includes('/trips/')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match('/offline') || new Response('Offline', { status: 503 })
        )
      )
  )
})

// Background sync for when driver comes back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location') {
    // Location updates queued while offline will sync here
    event.waitUntil(Promise.resolve())
  }
})
