import "server-only";

import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;
const localJsonCache = new Map<string, { value: unknown; expiresAt: number }>();

function isLocalFallbackEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

function cleanupExpiredLocalCache(nowMs: number): void {
  if (localJsonCache.size < 4096) return;
  for (const [key, entry] of localJsonCache.entries()) {
    if (entry.expiresAt <= nowMs) {
      localJsonCache.delete(key);
    }
  }
}

function resolveRedisClient(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export function isUpstashConfigured(): boolean {
  return !!resolveRedisClient();
}

export function isJsonCacheConfigured(): boolean {
  return isUpstashConfigured() || isLocalFallbackEnabled();
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const client = resolveRedisClient();
  if (!client) {
    if (!isLocalFallbackEnabled()) return null;

    const entry = localJsonCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      localJsonCache.delete(key);
      return null;
    }
    return (entry.value as T) ?? null;
  }

  try {
    const value = await client.get<T>(key);
    return value ?? null;
  } catch (error) {
    console.error("Upstash get cache failed:", error);
    return null;
  }
}

export async function setCachedJson<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  const client = resolveRedisClient();
  if (!client) {
    if (!isLocalFallbackEnabled()) return;
    const now = Date.now();
    localJsonCache.set(key, {
      value,
      expiresAt: now + Math.max(1, ttlSeconds) * 1000,
    });
    cleanupExpiredLocalCache(now);
    return;
  }

  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error("Upstash set cache failed:", error);
  }
}

export async function deleteCachedByPrefix(
  prefix: string,
  maxDeletes = 500,
): Promise<number> {
  const client = resolveRedisClient();
  let deleted = 0;

  if (client) {
    try {
      const keys = (await client.keys(`${prefix}*`)) as string[] | null;
      const limited = (keys || []).slice(0, Math.max(1, maxDeletes));
      if (limited.length > 0) {
        await Promise.all(limited.map((key) => client.del(key)));
        deleted += limited.length;
      }
    } catch (error) {
      console.error("Upstash delete cache failed:", error);
    }
  }

  if (isLocalFallbackEnabled()) {
    for (const key of localJsonCache.keys()) {
      if (!key.startsWith(prefix)) continue;
      localJsonCache.delete(key);
      deleted += 1;
      if (deleted >= maxDeletes) break;
    }
  }

  return deleted;
}
