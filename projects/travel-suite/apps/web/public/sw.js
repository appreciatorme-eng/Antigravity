const CACHE_NAME = 'trip-portal-v2';
const APP_SHELL = ['/', '/offline', '/manifest.json'];

const IDB_NAME = 'tripbuilt-offline-mutations-v1';
const IDB_STORE = 'mutation_queue';
const IDB_VERSION = 2;

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Remove the legacy "outbox" store from v1 if it exists
      if (db.objectStoreNames.contains('outbox')) {
        db.deleteObjectStore('outbox');
      }
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function queueMutation(db, entry) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.add(entry);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (event) => reject(event.target.error);
  });
}

function getAllMutations(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (event) => reject(event.target.error);
  });
}

function countMutations(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (event) => reject(event.target.error);
  });
}

function deleteMutation(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (event) => reject(event.target.error);
  });
}

// ─── Service Worker Lifecycle ────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

// ─── Route classification ─────────────────────────────────────────────────────

function isApiRequest(request) {
  return request.url.includes('/api/');
}

function isMutableMethod(method) {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

function isPortalPage(request) {
  return request.mode === 'navigate' && request.url.includes('/portal/');
}

function isStaticAsset(request) {
  return (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  );
}

// ─── Fetch interception ──────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Mutable API requests: network-first, queue on failure
  if (isApiRequest(request) && isMutableMethod(request.method)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request.clone());
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_networkError) {
          // Persist the failed mutation in IndexedDB for later replay
          try {
            const db = await openDB();
            const body = await request.text().catch(() => '');
            const headers = {};
            request.headers.forEach((value, key) => {
              headers[key] = value;
            });
            await queueMutation(db, {
              url: request.url,
              method: request.method,
              headers,
              body,
              timestamp: Date.now(),
            });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_idbError) {
            // IDB unavailable — still return the offline indicator
          }
          return new Response(
            JSON.stringify({ offlineQueued: true, message: 'Request queued for later replay' }),
            { status: 202, headers: { 'Content-Type': 'application/json' } },
          );
        }
      })(),
    );
    return;
  }

  // Read-only API requests: network-first, fall back to /offline
  if (isApiRequest(request)) {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        });
      }),
    );
    return;
  }

  if (isPortalPage(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match('/offline')),
        ),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/offline'))),
  );
});

// ─── Message handling ─────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const type = event.data && event.data.type;
  const port = event.ports && event.ports[0];

  if (type === 'GET_OFFLINE_QUEUE_STATUS') {
    openDB()
      .then((db) => countMutations(db))
      .then((queueLength) => {
        if (port) port.postMessage({ queueLength });
      })
      .catch(() => {
        if (port) port.postMessage({ queueLength: 0 });
      });
    return;
  }

  if (type === 'REPLAY_OFFLINE_MUTATIONS') {
    openDB()
      .then(async (db) => {
        const mutations = await getAllMutations(db);
        let replayed = 0;
        let failed = 0;

        for (const mutation of mutations) {
          try {
            const response = await fetch(mutation.url, {
              method: mutation.method,
              headers: mutation.headers,
              body: mutation.body || undefined,
            });
            // Treat any non-5xx response as successfully dispatched
            if (response.status < 500) {
              await deleteMutation(db, mutation.id);
              replayed++;
            } else {
              failed++;
            }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_networkError) {
            failed++;
          }
        }

        const remaining = await countMutations(db);
        if (port) port.postMessage({ replayed, remaining, failed });
      })
      .catch(() => {
        if (port) port.postMessage({ replayed: 0, remaining: 0, failed: 1 });
      });
    return;
  }
});
