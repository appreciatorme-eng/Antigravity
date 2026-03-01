import { Redis } from "@upstash/redis";
import type { SubscriptionTier } from "@/lib/subscriptions/limits";

export type CostCategory = "amadeus" | "image_search" | "ai_image";

const COST_PER_REQUEST_USD: Record<CostCategory, number> = {
  amadeus: 0.025,
  image_search: 0.004,
  ai_image: 0.06,
};

const PLAN_DAILY_SPEND_CAP_USD: Record<CostCategory, Record<SubscriptionTier, number>> = {
  amadeus: {
    free: 3,
    pro: 35,
    enterprise: 120,
  },
  image_search: {
    free: 1,
    pro: 12,
    enterprise: 50,
  },
  ai_image: {
    free: 2,
    pro: 20,
    enterprise: 80,
  },
};

const DEFAULT_EMERGENCY_DAILY_SPEND_CAP_USD: Record<CostCategory, number> = {
  amadeus: 75,
  image_search: 35,
  ai_image: 55,
};

const localSpendStore = new Map<string, { value: number; resetAt: number }>();
const localEmergencyCaps = new Map<CostCategory, number>();

let redisClient: Redis | null | undefined;

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

function getUtcDateKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function secondsUntilNextUtcMidnight(now = new Date()): number {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(60, Math.ceil((next.getTime() - now.getTime()) / 1000));
}

function localSpendKey(orgId: string, category: CostCategory, dateKey = getUtcDateKey()): string {
  return `${dateKey}:${orgId}:${category}`;
}

function cleanupLocalSpend(nowMs: number) {
  if (localSpendStore.size < 5000) return;
  for (const [key, value] of localSpendStore.entries()) {
    if (value.resetAt <= nowMs) {
      localSpendStore.delete(key);
    }
  }
}

function getOrInitLocalSpend(orgId: string, category: CostCategory): { key: string; bucket: { value: number; resetAt: number } } {
  const now = Date.now();
  const key = localSpendKey(orgId, category);
  const existing = localSpendStore.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + secondsUntilNextUtcMidnight() * 1000;
    const fresh = { value: 0, resetAt };
    localSpendStore.set(key, fresh);
    cleanupLocalSpend(now);
    return { key, bucket: fresh };
  }

  return { key, bucket: existing };
}

export function getEstimatedRequestCostUsd(category: CostCategory): number {
  return COST_PER_REQUEST_USD[category];
}

export function getPlanDailySpendCapUsd(category: CostCategory, tier: SubscriptionTier): number {
  return PLAN_DAILY_SPEND_CAP_USD[category][tier];
}

export function getDefaultEmergencyDailySpendCapUsd(category: CostCategory): number {
  return DEFAULT_EMERGENCY_DAILY_SPEND_CAP_USD[category];
}

export async function getEmergencyDailySpendCapUsd(category: CostCategory): Promise<number> {
  const redis = getRedisClient();
  const redisKey = `cost:config:emergency:${category}`;

  if (redis) {
    try {
      const raw = await redis.get<string | number | null>(redisKey);
      const numeric = Number(raw);
      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }
    } catch {
      // fall through to local/env/defaults
    }
  }

  const local = localEmergencyCaps.get(category);
  if (typeof local === "number" && Number.isFinite(local) && local > 0) {
    return local;
  }

  const envKey = `COST_EMERGENCY_CAP_${category.toUpperCase()}_USD`;
  const envCap = Number(process.env[envKey]);
  if (Number.isFinite(envCap) && envCap > 0) {
    return envCap;
  }

  return getDefaultEmergencyDailySpendCapUsd(category);
}

export async function setEmergencyDailySpendCapUsd(
  category: CostCategory,
  capUsd: number
): Promise<number> {
  const normalized = Number(capUsd);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error("capUsd must be a positive number");
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(`cost:config:emergency:${category}`, normalized.toFixed(4));
      return normalized;
    } catch {
      // fallback to local in-memory value
    }
  }

  localEmergencyCaps.set(category, normalized);
  return normalized;
}

export async function getCurrentDailySpendUsd(
  organizationId: string,
  category: CostCategory
): Promise<number> {
  const redis = getRedisClient();
  const key = `cost:spend:${localSpendKey(organizationId, category)}`;

  if (redis) {
    try {
      const raw = await redis.get<string | number | null>(key);
      const numeric = Number(raw);
      return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
    } catch {
      // local fallback
    }
  }

  const { bucket } = getOrInitLocalSpend(organizationId, category);
  return bucket.value;
}

export async function recordDailySpendUsd(
  organizationId: string,
  category: CostCategory,
  deltaUsd: number
): Promise<number> {
  const delta = Number(deltaUsd);
  if (!Number.isFinite(delta) || delta <= 0) {
    return getCurrentDailySpendUsd(organizationId, category);
  }

  const redis = getRedisClient();
  const key = `cost:spend:${localSpendKey(organizationId, category)}`;

  if (redis) {
    try {
      const nextValue = await redis.incrbyfloat(key, delta);
      await redis.expire(key, secondsUntilNextUtcMidnight() + 3600);
      const numeric = Number(nextValue);
      if (Number.isFinite(numeric) && numeric >= 0) {
        return numeric;
      }
    } catch {
      // local fallback
    }
  }

  const { bucket } = getOrInitLocalSpend(organizationId, category);
  bucket.value += delta;
  return bucket.value;
}
