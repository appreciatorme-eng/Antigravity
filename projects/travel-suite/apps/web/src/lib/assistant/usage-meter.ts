import "server-only";

/* ------------------------------------------------------------------
 * Usage Meter -- per-org monthly AI request tracking and enforcement.
 *
 * Tracks assistant usage against tier limits using Redis counters
 * for fast reads, with periodic flushes to the Supabase
 * `organization_ai_usage` table for durability.
 *
 * All exported async functions are wrapped in try-catch so that
 * metering failures never break the main assistant flow.
 * ------------------------------------------------------------------ */

import { getCachedJson, setCachedJson } from "@/lib/cache/upstash";
import {
  PLAN_CATALOG,
  type CanonicalPlanId,
} from "@/lib/billing/plan-catalog";
import { resolveOrganizationPlan } from "@/lib/subscriptions/limits";
import type { ActionContext } from "./types";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface UsageStatus {
  readonly allowed: boolean;
  readonly used: number;
  readonly limit: number | null;
  readonly remaining: number | null;
  readonly tier: string;
  readonly planId: string;
}

export interface UsageIncrementOptions {
  readonly isCacheHit?: boolean;
  readonly isDirectExecution?: boolean;
  readonly estimatedCostUsd?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** TTL for Redis usage keys: 40 days in seconds. */
const REDIS_TTL_SECONDS = 40 * 24 * 60 * 60;

/** Flush to the database every N increments. */
const DB_FLUSH_INTERVAL = 10;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Return the current month as YYYY-MM. */
function currentMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Return the first day of the current UTC month as YYYY-MM-DD. */
function currentMonthStart(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/** Build the Redis key for the main AI request counter. */
function requestCountKey(orgId: string, monthKey: string): string {
  return `assistant:usage:${orgId}:${monthKey}`;
}

/** Build the Redis key for the cache hit counter. */
function cacheHitCountKey(orgId: string, monthKey: string): string {
  return `assistant:usage:cache:${orgId}:${monthKey}`;
}

/** Build the Redis key for the direct execution counter. */
function directExecCountKey(orgId: string, monthKey: string): string {
  return `assistant:usage:direct:${orgId}:${monthKey}`;
}

/** Look up the AI request limit for a given plan. */
function getAiRequestLimit(planId: CanonicalPlanId): number | null {
  return PLAN_CATALOG[planId].limits.aiRequests;
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

/**
 * Read the current `ai_requests` count from the database for the given
 * org and month. Returns 0 if no row exists or the query fails.
 */
async function fetchUsageFromDb(
  ctx: ActionContext,
  monthStart: string,
): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (ctx.supabase as any)
      .from("organization_ai_usage")
      .select("ai_requests")
      .eq("organization_id", ctx.organizationId)
      .eq("month_start", monthStart)
      .maybeSingle();

    return (data?.ai_requests as number) ?? 0;
  } catch (error: unknown) {
    console.error("usage-meter: failed to read usage from DB", error);
    return 0;
  }
}

/**
 * Upsert usage deltas into the `organization_ai_usage` table.
 *
 * Uses a raw SQL upsert via Supabase RPC so that concurrent flushes
 * add to the total rather than overwrite it.
 */
async function flushIncrementToDb(
  ctx: ActionContext,
  increment: number,
  cacheHitIncrement: number,
  directExecIncrement: number,
  costIncrement: number,
): Promise<void> {
  try {
    const monthStart = currentMonthStart();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (ctx.supabase as any).rpc(
      "upsert_organization_ai_usage",
      {
        p_organization_id: ctx.organizationId,
        p_month_start: monthStart,
        p_ai_requests: increment,
        p_cache_hits: cacheHitIncrement,
        p_direct_execution_count: directExecIncrement,
        p_estimated_cost_usd: costIncrement,
      },
    );

    if (error) {
      // Fallback: try a plain upsert if the RPC does not exist yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upsertResult = await (ctx.supabase as any)
        .from("organization_ai_usage")
        .upsert(
          {
            organization_id: ctx.organizationId,
            month_start: monthStart,
            ai_requests: increment,
            cache_hits: cacheHitIncrement,
            estimated_cost_usd: costIncrement,
          },
          { onConflict: "organization_id,month_start" },
        );

      if (upsertResult.error) {
        console.error(
          "usage-meter: DB flush upsert fallback failed",
          upsertResult.error,
        );
      }
    }
  } catch (error: unknown) {
    console.error("usage-meter: DB flush failed", error);
  }
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Check whether the organisation is within its AI request limit for the
 * current month.
 *
 * Fast path: reads the Redis counter.
 * Slow path: falls back to a DB query if Redis is unavailable.
 */
export async function checkUsageAllowed(
  ctx: ActionContext,
): Promise<UsageStatus> {
  try {
    const { tier, planId } = await resolveOrganizationPlan(
      ctx.supabase,
      ctx.organizationId,
    );

    const limit = getAiRequestLimit(planId);
    const monthKey = currentMonthKey();
    const redisKey = requestCountKey(ctx.organizationId, monthKey);

    // Attempt Redis first
    let used: number | null = null;
    try {
      const cached = await getCachedJson<number>(redisKey);
      if (cached !== null) {
        used = cached;
      }
    } catch {
      // Redis unavailable -- will fall back to DB below
    }

    // Fallback to DB
    if (used === null) {
      used = await fetchUsageFromDb(ctx, currentMonthStart());
    }

    const allowed = limit === null || used < limit;
    const remaining = limit === null ? null : Math.max(limit - used, 0);

    return { allowed, used, limit, remaining, tier, planId };
  } catch (error: unknown) {
    console.error("usage-meter: checkUsageAllowed failed", error);
    // Fail open -- do not block the user on metering errors
    return {
      allowed: true,
      used: 0,
      limit: null,
      remaining: null,
      tier: "unknown",
      planId: "free",
    };
  }
}

/**
 * Increment the usage counter for the current org and month.
 *
 * Always updates the Redis counter. Flushes to the database on every
 * Nth increment (controlled by `DB_FLUSH_INTERVAL`).
 */
export async function incrementUsage(
  ctx: ActionContext,
  options: UsageIncrementOptions = {},
): Promise<void> {
  try {
    const monthKey = currentMonthKey();
    const redisKey = requestCountKey(ctx.organizationId, monthKey);

    // --- Main counter ---
    const previous = (await getCachedJson<number>(redisKey)) ?? 0;
    const next = previous + 1;
    await setCachedJson(redisKey, next, REDIS_TTL_SECONDS);

    // --- Cache hit counter ---
    let cacheHitIncrement = 0;
    if (options.isCacheHit) {
      cacheHitIncrement = 1;
      const cacheKey = cacheHitCountKey(ctx.organizationId, monthKey);
      const prevCacheHits = (await getCachedJson<number>(cacheKey)) ?? 0;
      await setCachedJson(cacheKey, prevCacheHits + 1, REDIS_TTL_SECONDS);
    }

    // --- Direct execution counter ---
    let directExecIncrement = 0;
    if (options.isDirectExecution) {
      directExecIncrement = 1;
      const directKey = directExecCountKey(ctx.organizationId, monthKey);
      const prevDirect = (await getCachedJson<number>(directKey)) ?? 0;
      await setCachedJson(directKey, prevDirect + 1, REDIS_TTL_SECONDS);
    }

    // --- Periodic DB flush ---
    if (next % DB_FLUSH_INTERVAL === 0) {
      await flushIncrementToDb(
        ctx,
        DB_FLUSH_INTERVAL,
        cacheHitIncrement,
        directExecIncrement,
        options.estimatedCostUsd ?? 0,
      );
    }
  } catch (error: unknown) {
    console.error("usage-meter: incrementUsage failed", error);
  }
}

/**
 * Return usage statistics for the current org and month, suitable for
 * an API endpoint response.
 */
export async function getUsageStats(ctx: ActionContext): Promise<{
  readonly month: string;
  readonly messageCount: number;
  readonly limit: number | null;
  readonly remaining: number | null;
  readonly cacheHits: number;
  readonly directExecutions: number;
  readonly estimatedCostUsd: number;
  readonly tier: string;
}> {
  try {
    const { tier, planId } = await resolveOrganizationPlan(
      ctx.supabase,
      ctx.organizationId,
    );

    const limit = getAiRequestLimit(planId);
    const monthKey = currentMonthKey();

    // Read counters from Redis (fall back to 0)
    const [messageCount, cacheHits, directExecutions] = await Promise.all([
      getCachedJson<number>(requestCountKey(ctx.organizationId, monthKey)).then(
        (v) => v ?? 0,
      ),
      getCachedJson<number>(
        cacheHitCountKey(ctx.organizationId, monthKey),
      ).then((v) => v ?? 0),
      getCachedJson<number>(
        directExecCountKey(ctx.organizationId, monthKey),
      ).then((v) => v ?? 0),
    ]);

    // Read estimated cost from DB (not tracked in Redis)
    let estimatedCostUsd = 0;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (ctx.supabase as any)
        .from("organization_ai_usage")
        .select("estimated_cost_usd")
        .eq("organization_id", ctx.organizationId)
        .eq("month_start", currentMonthStart())
        .maybeSingle();

      estimatedCostUsd = parseFloat(data?.estimated_cost_usd ?? "0") || 0;
    } catch {
      // Non-critical -- default to 0
    }

    const remaining = limit === null ? null : Math.max(limit - messageCount, 0);

    return {
      month: monthKey,
      messageCount,
      limit,
      remaining,
      cacheHits,
      directExecutions,
      estimatedCostUsd,
      tier,
    };
  } catch (error: unknown) {
    console.error("usage-meter: getUsageStats failed", error);
    return {
      month: currentMonthKey(),
      messageCount: 0,
      limit: null,
      remaining: null,
      cacheHits: 0,
      directExecutions: 0,
      estimatedCostUsd: 0,
      tier: "unknown",
    };
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a user-facing message when the monthly AI request limit has
 * been reached.
 */
function buildLimitReachedMessage(status: UsageStatus): string {
  const limitStr =
    status.limit === null ? "unlimited" : String(status.limit);

  return (
    `You've used ${status.used} of ${limitStr} assistant messages this month ` +
    `on the ${status.tier} plan. Upgrade for more messages, or wait until ` +
    `next month for your quota to reset.`
  );
}

export { buildLimitReachedMessage };
