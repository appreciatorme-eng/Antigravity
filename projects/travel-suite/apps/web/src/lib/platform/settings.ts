/* eslint-disable @typescript-eslint/no-explicit-any */
// Platform settings: Redis-first (60 s TTL) with Supabase fallback.
// Writes update DB → invalidate Redis → log to platform_audit_log.

import { Redis } from "@upstash/redis";
import { createAdminClient } from "@/lib/supabase/admin";
import { logPlatformAction } from "@/lib/platform/audit";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type FeatureFlags = {
  ai_enabled: boolean;
  marketplace_enabled: boolean;
  social_enabled: boolean;
  reputation_enabled: boolean;
  booking_enabled: boolean;
  whatsapp_enabled: boolean;
};

type MaintenanceMode = {
  enabled: boolean;
  message: string;
  allowed_paths: string[];
};

type OrgSuspensions = {
  suspended_org_ids: string[];
};

const REDIS_TTL_SECONDS = 60;
const REDIS_KEY_PREFIX = "platform:";

let _redis: Redis | null | undefined;

function getRedisClient(): Redis | null {
  if (_redis !== undefined) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    _redis = null;
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

function redisKey(key: string): string {
  return `${REDIS_KEY_PREFIX}${key}`;
}

async function fetchFromSupabase(key: string): Promise<JsonValue | null> {
  const adminClient = createAdminClient() as any;
  const { data } = await adminClient
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  return (data?.value as JsonValue) ?? null;
}

export async function getPlatformSetting(key: string): Promise<JsonValue | null> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get<JsonValue>(redisKey(key));
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch {
      // Fall through to Supabase on Redis error.
    }
  }

  const value = await fetchFromSupabase(key);

  if (value !== null && redis) {
    try {
      await redis.set(redisKey(key), value, { ex: REDIS_TTL_SECONDS });
    } catch {
      // Cache population is best-effort.
    }
  }

  return value;
}

export async function setPlatformSetting(
  key: string,
  value: JsonValue,
  actorId: string
): Promise<void> {
  const adminClient = createAdminClient() as any;

  await adminClient.from("platform_settings").upsert({
    key,
    value,
    updated_by: actorId,
    updated_at: new Date().toISOString(),
  });

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.del(redisKey(key));
    } catch {
      // Cache invalidation is best-effort.
    }
  }

  await logPlatformAction(actorId, `Updated platform setting: ${key}`, "settings", {
    key,
    value,
  });
}

export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await getPlatformSetting("maintenance_mode");
    if (!setting || typeof setting !== "object" || Array.isArray(setting)) {
      return false;
    }
    return (setting as MaintenanceMode).enabled === true;
  } catch {
    return false;
  }
}

export async function getMaintenanceSettings(): Promise<MaintenanceMode> {
  const setting = await getPlatformSetting("maintenance_mode");
  const defaults: MaintenanceMode = {
    enabled: false,
    message: "Platform is under maintenance.",
    allowed_paths: ["/api/health", "/api/superadmin"],
  };

  if (!setting || typeof setting !== "object" || Array.isArray(setting)) {
    return defaults;
  }

  return { ...defaults, ...(setting as Partial<MaintenanceMode>) };
}

export async function isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
  try {
    const setting = await getPlatformSetting("feature_flags");
    if (!setting || typeof setting !== "object" || Array.isArray(setting)) {
      return true;
    }
    const flags = setting as Partial<FeatureFlags>;
    return flags[feature] !== false;
  } catch {
    return true;
  }
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const defaults: FeatureFlags = {
    ai_enabled: true,
    marketplace_enabled: true,
    social_enabled: true,
    reputation_enabled: true,
    booking_enabled: true,
    whatsapp_enabled: true,
  };

  const setting = await getPlatformSetting("feature_flags");
  if (!setting || typeof setting !== "object" || Array.isArray(setting)) {
    return defaults;
  }

  return { ...defaults, ...(setting as Partial<FeatureFlags>) };
}

export async function isOrgSuspended(orgId: string): Promise<boolean> {
  try {
    const setting = await getPlatformSetting("org_suspensions");
    if (!setting || typeof setting !== "object" || Array.isArray(setting)) {
      return false;
    }
    const suspensions = setting as Partial<OrgSuspensions>;
    return (suspensions.suspended_org_ids ?? []).includes(orgId);
  } catch {
    return false;
  }
}

export async function getAllPlatformSettings(): Promise<Record<string, JsonValue>> {
  const adminClient = createAdminClient() as any;
  const { data } = await adminClient
    .from("platform_settings")
    .select("key, value, description, updated_by, updated_at, created_at")
    .order("key");

  if (!data) return {};

  return Object.fromEntries(data.map((row: any) => [row.key, row.value as JsonValue]));
}
