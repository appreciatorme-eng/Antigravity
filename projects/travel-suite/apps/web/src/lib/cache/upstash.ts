import "server-only";

import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

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

export async function getCachedJson<T>(key: string): Promise<T | null> {
    const client = resolveRedisClient();
    if (!client) return null;

    try {
        const value = await client.get<T>(key);
        return value ?? null;
    } catch (error) {
        console.error("Upstash get cache failed:", error);
        return null;
    }
}

export async function setCachedJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const client = resolveRedisClient();
    if (!client) return;

    try {
        await client.set(key, value, { ex: ttlSeconds });
    } catch (error) {
        console.error("Upstash set cache failed:", error);
    }
}
