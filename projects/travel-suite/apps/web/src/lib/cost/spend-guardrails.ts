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

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function requireDistributedSpendStore(operation: string): Redis | null {
  const redis = getRedisClient();
  if (!redis && isProductionRuntime()) {
    throw new Error(`Distributed spend metering backend is required in production (${operation})`);
  }
  return redis;
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

function getOrInitLocalSpend(
  orgId: string,
  category: CostCategory
): { key: string; bucket: { value: number; resetAt: number } } {
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
      // Fall through to env/defaults if Redis is unavailable.
    }
  }

  if (!isProductionRuntime()) {
    const local = localEmergencyCaps.get(category);
    if (typeof local === "number" && Number.isFinite(local) && local > 0) {
      return local;
    }
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
    await redis.set(`cost:config:emergency:${category}`, normalized.toFixed(4));
    return normalized;
  }

  if (isProductionRuntime()) {
    throw new Error("Cannot mutate emergency caps without distributed configuration backend in production");
  }

  localEmergencyCaps.set(category, normalized);
  return normalized;
}

export async function getCurrentDailySpendUsd(
  organizationId: string,
  category: CostCategory
): Promise<number> {
  const redis = requireDistributedSpendStore("read_current_spend");
  const key = `cost:spend:${localSpendKey(organizationId, category)}`;

  if (redis) {
    const raw = await redis.get<string | number | null>(key);
    const numeric = Number(raw);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
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

  const redis = requireDistributedSpendStore("record_spend_delta");
  const key = `cost:spend:${localSpendKey(organizationId, category)}`;

  if (redis) {
    const nextValue = await redis.incrbyfloat(key, delta);
    await redis.expire(key, secondsUntilNextUtcMidnight() + 3600);
    return toFiniteNumber(nextValue, 0);
  }

  const { bucket } = getOrInitLocalSpend(organizationId, category);
  bucket.value += delta;
  return bucket.value;
}

export type SpendReservationResult = {
  allowed: boolean;
  currentSpendUsd: number;
  projectedSpendUsd: number;
  nextSpendUsd: number;
  denialReason: "plan_cap_exceeded" | "emergency_cap_exceeded" | null;
};

function buildReservationResult(params: {
  allowed: boolean;
  currentSpendUsd: number;
  projectedSpendUsd: number;
  nextSpendUsd: number;
  planCapUsd: number;
  emergencyCapUsd: number;
}): SpendReservationResult {
  let denialReason: SpendReservationResult["denialReason"] = null;
  if (!params.allowed) {
    denialReason =
      params.projectedSpendUsd > params.emergencyCapUsd
        ? "emergency_cap_exceeded"
        : "plan_cap_exceeded";
  }

  return {
    allowed: params.allowed,
    currentSpendUsd: params.currentSpendUsd,
    projectedSpendUsd: params.projectedSpendUsd,
    nextSpendUsd: params.nextSpendUsd,
    denialReason,
  };
}

export async function reserveDailySpendUsd(
  organizationId: string,
  category: CostCategory,
  deltaUsd: number,
  limits: { planCapUsd: number; emergencyCapUsd: number }
): Promise<SpendReservationResult> {
  const delta = Number(deltaUsd);
  const planCapUsd = Number(limits.planCapUsd);
  const emergencyCapUsd = Number(limits.emergencyCapUsd);

  if (!Number.isFinite(delta) || delta <= 0) {
    const current = await getCurrentDailySpendUsd(organizationId, category);
    return buildReservationResult({
      allowed: true,
      currentSpendUsd: current,
      projectedSpendUsd: current,
      nextSpendUsd: current,
      planCapUsd,
      emergencyCapUsd,
    });
  }

  if (!Number.isFinite(planCapUsd) || planCapUsd <= 0) {
    throw new Error("planCapUsd must be a positive number");
  }

  if (!Number.isFinite(emergencyCapUsd) || emergencyCapUsd <= 0) {
    throw new Error("emergencyCapUsd must be a positive number");
  }

  const redis = requireDistributedSpendStore("reserve_spend_budget");
  const key = `cost:spend:${localSpendKey(organizationId, category)}`;

  if (redis) {
    const ttlSeconds = secondsUntilNextUtcMidnight() + 3600;
    const script = `
local key = KEYS[1]
local delta = tonumber(ARGV[1]) or 0
local planCap = tonumber(ARGV[2]) or 0
local emergencyCap = tonumber(ARGV[3]) or 0
local ttl = tonumber(ARGV[4]) or 0
local effectiveCap = math.min(planCap, emergencyCap)
local current = tonumber(redis.call("GET", key) or "0")
local projected = current + delta
if projected > effectiveCap then
  return {0, current, projected}
end
local next = tonumber(redis.call("INCRBYFLOAT", key, delta))
if ttl > 0 then
  redis.call("EXPIRE", key, ttl)
end
return {1, next, next}
`;

    const rawResult = await redis.eval<unknown[]>(script, [key], [
      delta.toString(),
      planCapUsd.toString(),
      emergencyCapUsd.toString(),
      ttlSeconds.toString(),
    ]);

    const tuple = Array.isArray(rawResult) ? rawResult : [];
    const allowed = toFiniteNumber(tuple[0], 0) === 1;

    if (allowed) {
      const nextSpendUsd = toFiniteNumber(tuple[1], 0);
      const currentSpendUsd = Math.max(0, nextSpendUsd - delta);
      return buildReservationResult({
        allowed,
        currentSpendUsd,
        projectedSpendUsd: nextSpendUsd,
        nextSpendUsd,
        planCapUsd,
        emergencyCapUsd,
      });
    }

    const currentSpendUsd = toFiniteNumber(tuple[1], 0);
    const projectedSpendUsd = toFiniteNumber(tuple[2], currentSpendUsd + delta);
    return buildReservationResult({
      allowed,
      currentSpendUsd,
      projectedSpendUsd,
      nextSpendUsd: currentSpendUsd,
      planCapUsd,
      emergencyCapUsd,
    });
  }

  const { bucket } = getOrInitLocalSpend(organizationId, category);
  const projectedSpendUsd = bucket.value + delta;
  const withinCap = projectedSpendUsd <= Math.min(planCapUsd, emergencyCapUsd);

  if (!withinCap) {
    return buildReservationResult({
      allowed: false,
      currentSpendUsd: bucket.value,
      projectedSpendUsd,
      nextSpendUsd: bucket.value,
      planCapUsd,
      emergencyCapUsd,
    });
  }

  bucket.value = projectedSpendUsd;
  return buildReservationResult({
    allowed: true,
    currentSpendUsd: projectedSpendUsd - delta,
    projectedSpendUsd,
    nextSpendUsd: projectedSpendUsd,
    planCapUsd,
    emergencyCapUsd,
  });
}
