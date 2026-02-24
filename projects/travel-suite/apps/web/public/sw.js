const CORE_CACHE = "gobuddy-core-v1";
const ITINERARY_CACHE = "gobuddy-itinerary-v1";
const API_CACHE = "gobuddy-api-v1";

const OFFLINE_MUTATION_DB = "gobuddy-offline-mutations-v1";
const OFFLINE_MUTATION_STORE = "mutation_queue";
const OFFLINE_SYNC_TAG = "gobuddy-mutation-sync";
const OFFLINE_MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const CORE_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => undefined)
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

function isQueueableMutationRequest(request, url) {
  return (
    OFFLINE_MUTATION_METHODS.has(request.method.toUpperCase()) &&
    url.origin === self.location.origin &&
    url.pathname.startsWith("/api/share/")
  );
}

function createQueuedMutationResponse(recordId) {
  return new Response(
    JSON.stringify({
      success: true,
      offlineQueued: true,
      queueId: recordId,
      message: "Saved offline. Changes will sync automatically when you reconnect.",
    }),
    {
      status: 202,
      headers: {
        "content-type": "application/json",
        "x-offline-queued": "1",
      },
    }
  );
}

function createMutationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRequestHeaders(headers) {
  const normalized = {};
  headers.forEach((value, key) => {
    normalized[key.toLowerCase()] = value;
  });

  if (!normalized["content-type"]) {
    normalized["content-type"] = "application/json";
  }

  return normalized;
}

function openMutationDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_MUTATION_DB, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(OFFLINE_MUTATION_STORE)) {
        const store = database.createObjectStore(OFFLINE_MUTATION_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open offline mutation DB"));
  });
}

async function withMutationStore(mode, operation) {
  const database = await openMutationDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_MUTATION_STORE, mode);
    const store = transaction.objectStore(OFFLINE_MUTATION_STORE);
    let result;
    let hasResult = false;
    let isSettled = false;

    const settleError = (error) => {
      if (isSettled) return;
      isSettled = true;
      database.close();
      reject(error);
    };

    transaction.oncomplete = () => {
      if (isSettled) return;
      isSettled = true;
      database.close();
      if (hasResult) {
        resolve(result);
        return;
      }
      reject(new Error("Offline mutation transaction completed without result"));
    };

    transaction.onerror = () => {
      const txError = transaction.error || new Error("Offline mutation transaction failed");
      settleError(txError);
    };

    transaction.onabort = () => {
      const txError = transaction.error || new Error("Offline mutation transaction aborted");
      settleError(txError);
    };

    Promise.resolve(operation(store, transaction))
      .then((value) => {
        result = value;
        hasResult = true;
      })
      .catch((error) => {
        try {
          transaction.abort();
        } catch {
          // noop
        }
        settleError(error);
      });
  });
}

async function enqueueMutationRequest(request, errorMessage) {
  const payload = await request.text().catch(() => null);

  const record = {
    id: createMutationId(),
    url: request.url,
    method: request.method.toUpperCase(),
    headers: normalizeRequestHeaders(request.headers),
    body: payload,
    createdAt: Date.now(),
    attemptCount: 0,
    lastError: errorMessage,
  };

  await withMutationStore("readwrite", async (store) => {
    store.put(record);
  });

  return record;
}

async function listQueuedMutations() {
  return withMutationStore("readonly", async (store) => {
    const index = store.index("createdAt");
    const request = index.getAll();

    const records = await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(Array.isArray(request.result) ? request.result : []);
      };
      request.onerror = () => reject(request.error || new Error("Unable to read offline mutation queue"));
    });

    return records.sort((left, right) => left.createdAt - right.createdAt);
  });
}

async function getQueuedMutationCount() {
  return withMutationStore("readonly", async (store) => {
    const request = store.count();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(typeof request.result === "number" ? request.result : 0);
      request.onerror = () => reject(request.error || new Error("Unable to count offline mutation queue"));
    });
  });
}

async function deleteQueuedMutation(id) {
  await withMutationStore("readwrite", async (store) => {
    store.delete(id);
  });
}

async function markQueuedMutationFailure(record, errorMessage) {
  const nextRecord = {
    ...record,
    attemptCount: (record.attemptCount || 0) + 1,
    lastError: String(errorMessage || "Replay failed").slice(0, 500),
  };

  await withMutationStore("readwrite", async (store) => {
    store.put(nextRecord);
  });
}

function isTerminalClientError(status) {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

async function broadcastMutationReplayResult(result) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  for (const client of clients) {
    client.postMessage({ type: "OFFLINE_MUTATIONS_REPLAYED", ...result });
  }
}

async function replayQueuedMutations() {
  const queued = await listQueuedMutations();
  let replayed = 0;
  let failed = 0;

  for (const record of queued) {
    try {
      const response = await fetch(record.url, {
        method: record.method,
        headers: {
          ...record.headers,
          "x-offline-replay": "1",
        },
        body: record.body,
        credentials: "include",
      });

      if (response.ok || isTerminalClientError(response.status)) {
        await deleteQueuedMutation(record.id);
        replayed += 1;
      } else {
        failed += 1;
        await markQueuedMutationFailure(record, `HTTP ${response.status}`);
      }
    } catch (error) {
      failed += 1;
      const message = error && typeof error === "object" && "message" in error ? error.message : "Network failure";
      await markQueuedMutationFailure(record, message);
    }
  }

  const remaining = await getQueuedMutationCount();
  const result = { replayed, failed, remaining };
  await broadcastMutationReplayResult(result);
  return result;
}

async function scheduleOfflineSync() {
  try {
    if (self.registration && self.registration.sync && typeof self.registration.sync.register === "function") {
      await self.registration.sync.register(OFFLINE_SYNC_TAG);
    }
  } catch {
    // Background Sync is optional; replay can still happen via explicit message/online event.
  }
}

async function handleQueueableMutation(request) {
  const replayClone = request.clone();

  try {
    return await fetch(request);
  } catch (error) {
    const message = error && typeof error === "object" && "message" in error ? error.message : "Network failure";
    const queued = await enqueueMutationRequest(replayClone, message);
    await scheduleOfflineSync();
    return createQueuedMutationResponse(queued.id);
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === OFFLINE_SYNC_TAG) {
    event.waitUntil(replayQueuedMutations());
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    if (isQueueableMutationRequest(request, url)) {
      event.respondWith(handleQueueableMutation(request));
    }
    return;
  }

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
    return;
  }

  if (data.type === "GET_OFFLINE_QUEUE_STATUS") {
    event.waitUntil(
      getQueuedMutationCount()
        .then((queueLength) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ queueLength });
          }
        })
        .catch(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ queueLength: 0 });
          }
        })
    );
    return;
  }

  if (data.type === "REPLAY_OFFLINE_MUTATIONS") {
    event.waitUntil(
      replayQueuedMutations()
        .then((result) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(result);
          }
        })
        .catch(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ replayed: 0, failed: 1, remaining: 0 });
          }
        })
    );
  }
});
