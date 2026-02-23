import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

export interface RateLimitOptions {
    identifier: string;
    limit: number;
    windowMs: number;
    prefix: string;
}

const localAttempts = new Map<string, { count: number; resetAt: number }>();
const limiterCache = new Map<string, Ratelimit>();
let redisClient: Redis | null | undefined;

function toUpstashDuration(windowMs: number): `${number} s` | `${number} m` | `${number} h` | `${number} d` {
    const seconds = Math.max(1, Math.ceil(windowMs / 1000));
    if (seconds % 86400 === 0) return `${seconds / 86400} d`;
    if (seconds % 3600 === 0) return `${seconds / 3600} h`;
    if (seconds % 60 === 0) return `${seconds / 60} m`;
    return `${seconds} s`;
}

function getRedisClient(): Redis | null {
    if (redisClient !== undefined) return redisClient;
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) {
        redisClient = null;
        return null;
    }
    redisClient = new Redis({ url, token });
    return redisClient;
}

function getUpstashLimiter(limit: number, windowMs: number, prefix: string): Ratelimit | null {
    const redis = getRedisClient();
    if (!redis) return null;

    const cacheKey = `${prefix}:${limit}:${windowMs}`;
    const cached = limiterCache.get(cacheKey);
    if (cached) return cached;

    const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, toUpstashDuration(windowMs)),
        prefix: `ratelimit:${prefix}`,
        analytics: false,
    });
    limiterCache.set(cacheKey, limiter);
    return limiter;
}

function cleanupExpiredLocal(now: number) {
    if (localAttempts.size < 5000) return;
    for (const [key, value] of localAttempts.entries()) {
        if (value.resetAt <= now) {
            localAttempts.delete(key);
        }
    }
}

function enforceLocalRateLimit(options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const key = `${options.prefix}:${options.identifier}`;
    const existing = localAttempts.get(key);

    if (!existing || existing.resetAt <= now) {
        const resetAt = now + options.windowMs;
        localAttempts.set(key, { count: 1, resetAt });
        cleanupExpiredLocal(now);
        return {
            success: true,
            limit: options.limit,
            remaining: Math.max(0, options.limit - 1),
            reset: resetAt,
        };
    }

    const nextCount = existing.count + 1;
    localAttempts.set(key, { count: nextCount, resetAt: existing.resetAt });
    cleanupExpiredLocal(now);

    return {
        success: nextCount <= options.limit,
        limit: options.limit,
        remaining: Math.max(0, options.limit - nextCount),
        reset: existing.resetAt,
    };
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const limiter = getUpstashLimiter(options.limit, options.windowMs, options.prefix);
    if (!limiter) {
        return enforceLocalRateLimit(options);
    }

    try {
        const result = await limiter.limit(options.identifier);
        return {
            success: result.success,
            limit: result.limit ?? options.limit,
            remaining: result.remaining ?? 0,
            reset: typeof result.reset === "number" ? result.reset : Date.now() + options.windowMs,
        };
    } catch {
        return enforceLocalRateLimit(options);
    }
}
