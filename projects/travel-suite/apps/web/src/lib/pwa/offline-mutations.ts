export const OFFLINE_MUTATION_DB = "gobuddy-offline-mutations-v1";
export const OFFLINE_MUTATION_STORE = "mutation_queue";
export const OFFLINE_SYNC_TAG = "gobuddy-mutation-sync";

const REPLAYABLE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export interface OfflineMutationRecord {
  id: string;
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  headers: Record<string, string>;
  body: string | null;
  createdAt: number;
  attemptCount: number;
  lastError?: string;
}

export interface OfflineReplayResult {
  replayed: number;
  remaining: number;
  failed: number;
}

interface SyncCapableServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: {
    register: (tag: string) => Promise<void>;
  };
}

function isBrowserEnvironment(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function generateRecordId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openQueueDb(): Promise<IDBDatabase> {
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
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline queue DB"));
  });
}

async function withQueueStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, transaction: IDBTransaction) => T | Promise<T>
): Promise<T> {
  const database = await openQueueDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(OFFLINE_MUTATION_STORE, mode);
    const store = transaction.objectStore(OFFLINE_MUTATION_STORE);
    let result: T;
    let hasResult = false;
    let isSettled = false;

    const settleError = (error: unknown) => {
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
      reject(new Error("Offline queue transaction completed without a result"));
    };

    transaction.onerror = () => {
      const txError = transaction.error ?? new Error("Offline queue transaction failed");
      settleError(txError);
    };

    transaction.onabort = () => {
      const abortError = transaction.error ?? new Error("Offline queue transaction aborted");
      settleError(abortError);
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

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return { "content-type": "application/json" };

  const normalized: Record<string, string> = {};
  const source = new Headers(headers);
  source.forEach((value, key) => {
    normalized[key.toLowerCase()] = value;
  });

  if (!normalized["content-type"]) {
    normalized["content-type"] = "application/json";
  }

  return normalized;
}

function asReplayMethod(method: string): OfflineMutationRecord["method"] {
  const upper = method.toUpperCase();
  if (upper === "POST" || upper === "PUT" || upper === "PATCH" || upper === "DELETE") {
    return upper;
  }

  return "POST";
}

function isTerminalClientError(status: number): boolean {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

function sanitizeReplayTarget(input: string): URL | null {
  try {
    const target = new URL(input, window.location.origin);
    if (target.origin !== window.location.origin) return null;
    return target;
  } catch {
    return null;
  }
}

export function isQueueableMutation(url: string, method: string = "POST"): boolean {
  if (!isBrowserEnvironment()) return false;

  const upperMethod = method.toUpperCase();
  if (!REPLAYABLE_METHODS.has(upperMethod)) return false;

  const target = sanitizeReplayTarget(url);
  if (!target) return false;

  return target.pathname.startsWith("/api/share/");
}

export async function enqueueOfflineMutation(input: {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: string | null;
  lastError?: string;
}): Promise<OfflineMutationRecord | null> {
  if (!isQueueableMutation(input.url, input.method)) return null;

  const target = sanitizeReplayTarget(input.url);
  if (!target) return null;

  const record: OfflineMutationRecord = {
    id: generateRecordId(),
    url: target.toString(),
    method: asReplayMethod(input.method ?? "POST"),
    headers: normalizeHeaders(input.headers),
    body: input.body ?? null,
    createdAt: Date.now(),
    attemptCount: 0,
    lastError: input.lastError,
  };

  await withQueueStore("readwrite", async (store) => {
    store.put(record);
  });

  return record;
}

export async function listOfflineMutations(): Promise<OfflineMutationRecord[]> {
  if (!isBrowserEnvironment()) return [];

  return withQueueStore("readonly", async (store) => {
    const index = store.index("createdAt");
    const request = index.getAll();

    const records = await new Promise<OfflineMutationRecord[]>((resolve, reject) => {
      request.onsuccess = () => {
        const value = Array.isArray(request.result)
          ? (request.result as OfflineMutationRecord[])
          : [];
        resolve(value);
      };
      request.onerror = () => reject(request.error ?? new Error("Unable to list offline queue"));
    });

    return records.sort((left, right) => left.createdAt - right.createdAt);
  });
}

export async function getOfflineMutationQueueSize(): Promise<number> {
  if (!isBrowserEnvironment()) return 0;

  return withQueueStore("readonly", async (store) => {
    const request = store.count();
    return new Promise<number>((resolve, reject) => {
      request.onsuccess = () => resolve(typeof request.result === "number" ? request.result : 0);
      request.onerror = () => reject(request.error ?? new Error("Unable to count offline queue"));
    });
  });
}

async function deleteOfflineMutation(id: string): Promise<void> {
  await withQueueStore("readwrite", async (store) => {
    store.delete(id);
  });
}

async function markOfflineMutationFailure(record: OfflineMutationRecord, message: string): Promise<void> {
  const nextRecord: OfflineMutationRecord = {
    ...record,
    attemptCount: record.attemptCount + 1,
    lastError: message.slice(0, 500),
  };

  await withQueueStore("readwrite", async (store) => {
    store.put(nextRecord);
  });
}

export async function replayOfflineMutationsFromClient(): Promise<OfflineReplayResult> {
  if (!isBrowserEnvironment()) {
    return { replayed: 0, remaining: 0, failed: 0 };
  }

  const queued = await listOfflineMutations();
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
        await deleteOfflineMutation(record.id);
        replayed += 1;
      } else {
        failed += 1;
        await markOfflineMutationFailure(record, `HTTP ${response.status}`);
      }
    } catch (error) {
      failed += 1;
      const errorMessage = error instanceof Error ? error.message : "Network failure";
      await markOfflineMutationFailure(record, errorMessage);
    }
  }

  const remaining = await getOfflineMutationQueueSize();
  return { replayed, remaining, failed };
}

async function requestServiceWorkerMessage<T>(message: Record<string, unknown>): Promise<T | null> {
  if (!isBrowserEnvironment() || !("serviceWorker" in navigator)) return null;

  try {
    const registration = (await navigator.serviceWorker.ready) as SyncCapableServiceWorkerRegistration;
    const worker = registration.active ?? navigator.serviceWorker.controller;
    if (!worker) return null;

    return await new Promise<T | null>((resolve) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => resolve(null), 2000);

      channel.port1.onmessage = (event) => {
        window.clearTimeout(timeout);
        resolve((event.data as T) ?? null);
      };

      worker.postMessage(message, [channel.port2]);
    });
  } catch {
    return null;
  }
}

export async function requestOfflineQueueStatus(): Promise<number> {
  const response = await requestServiceWorkerMessage<{ queueLength?: unknown }>({
    type: "GET_OFFLINE_QUEUE_STATUS",
  });

  if (response && typeof response.queueLength === "number") {
    return response.queueLength;
  }

  return getOfflineMutationQueueSize();
}

export async function triggerOfflineReplay(): Promise<OfflineReplayResult> {
  const response = await requestServiceWorkerMessage<OfflineReplayResult>({
    type: "REPLAY_OFFLINE_MUTATIONS",
  });

  if (
    response &&
    typeof response.replayed === "number" &&
    typeof response.remaining === "number" &&
    typeof response.failed === "number"
  ) {
    return response;
  }

  return replayOfflineMutationsFromClient();
}

export async function registerOfflineSync(): Promise<boolean> {
  if (!isBrowserEnvironment() || !("serviceWorker" in navigator)) return false;

  try {
    const registration = (await navigator.serviceWorker.ready) as SyncCapableServiceWorkerRegistration;
    if (!registration.sync || typeof registration.sync.register !== "function") {
      return false;
    }

    await registration.sync.register(OFFLINE_SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}

export async function queueOfflineMutationWithSync(input: {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: string | null;
  lastError?: string;
}): Promise<OfflineMutationRecord | null> {
  const queued = await enqueueOfflineMutation(input);
  if (!queued) return null;

  await registerOfflineSync();
  return queued;
}
