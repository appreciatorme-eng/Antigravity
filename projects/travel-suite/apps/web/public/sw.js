const CORE_CACHE = "gobuddy-core-v1";
const ITINERARY_CACHE = "gobuddy-itinerary-v1";
const API_CACHE = "gobuddy-api-v1";

const CORE_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([CORE_CACHE, ITINERARY_CACHE, API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (!keep.has(key)) {
              return caches.delete(key);
            }
            return Promise.resolve(true);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

function shouldCacheItineraryPath(pathname) {
  return pathname.startsWith("/share/") || pathname.startsWith("/p/") || pathname.startsWith("/trips/");
}

function shouldCacheApiPath(pathname) {
  return (
    pathname.startsWith("/api/share/") ||
    pathname.startsWith("/api/proposals/public/") ||
    pathname.startsWith("/api/weather")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && shouldCacheItineraryPath(url.pathname)) {
            const copy = response.clone();
            caches.open(ITINERARY_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          const itineraryMatch = await caches.match(request);
          if (itineraryMatch) return itineraryMatch;
          const offline = await caches.match("/offline");
          return offline || Response.error();
        })
    );
    return;
  }

  if (shouldCacheApiPath(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || Response.error();
        })
    );
    return;
  }

  if (request.destination === "image" || request.destination === "style" || request.destination === "script") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CORE_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
            }
            return response;
          })
          .catch(() => Response.error());
      })
    );
  }
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "CACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(ITINERARY_CACHE).then(async (cache) => {
        for (const value of data.urls) {
          if (typeof value !== "string" || value.length === 0) continue;
          try {
            await cache.add(value);
          } catch {
            // Ignore invalid or unreachable URLs.
          }
        }
      })
    );
  }
});
