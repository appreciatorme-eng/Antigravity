import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PLAN_CATALOG,
  normalizeCanonicalPlanId,
  tierForPlan,
  type CanonicalPlanId,
  type CanonicalTier,
} from "@/lib/billing/plan-catalog";

export type SubscriptionTier = CanonicalTier;
export type SubscriptionPlanId = CanonicalPlanId;
export type LimitedFeature =
  | "clients"
  | "trips"
  | "proposals"
  | "templates"
  | "team_members";

export type SubscriptionLifecycleStatus =
  | "active"
  | "trialing"
  | "cancelled"
  | "canceled"
  | "past_due"
  | "paused"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "unknown";

export interface LifecyclePlanResolutionInput {
  activePlanId: string | null | undefined;
  status?: string | null;
  trialEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodEnd?: string | null;
  downgradePlanId?: string | null;
  now?: Date;
}

type CounterWindow = "all_time" | "monthly";

interface FeatureLimitConfig {
  limit: number | null;
  window: CounterWindow;
  label: string;
}

export interface FeatureLimitStatus {
  feature: LimitedFeature;
  allowed: boolean;
  tier: SubscriptionTier;
  planId: SubscriptionPlanId;
  used: number;
  limit: number | null;
  remaining: number | null;
  window: CounterWindow;
  label: string;
  resetAt: string | null;
  upgradePlan: "pro_monthly" | "enterprise" | null;
}

const FEATURE_LIMIT_LABELS: Record<LimitedFeature, string> = {
  clients: "clients",
  trips: "trips per month",
  proposals: "proposals per month",
  templates: "active templates",
  team_members: "team members",
};

const FEATURE_LIMIT_WINDOWS: Record<LimitedFeature, CounterWindow> = {
  clients: "all_time",
  trips: "monthly",
  proposals: "monthly",
  templates: "all_time",
  team_members: "all_time",
};

function normalizeTier(raw: string | null | undefined): SubscriptionTier {
  return tierForPlan(normalizePlanId(raw));
}

function normalizePlanId(raw: string | null | undefined): SubscriptionPlanId {
  return normalizeCanonicalPlanId(raw);
}

function normalizeLifecycleStatus(raw: string | null | undefined): SubscriptionLifecycleStatus {
  if (!raw) return "unknown";
  const normalized = raw.toLowerCase();
  if (
    normalized === "active" ||
    normalized === "trialing" ||
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "past_due" ||
    normalized === "paused" ||
    normalized === "incomplete" ||
    normalized === "incomplete_expired" ||
    normalized === "unpaid"
  ) {
    return normalized;
  }
  return "unknown";
}

function isDatePast(value: string | null | undefined, now: Date): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() <= now.getTime();
}

export function getUpgradePlanForPlanId(
  planId: SubscriptionPlanId
): "pro_monthly" | "enterprise" | null {
  if (planId === "free") return "pro_monthly";
  if (planId === "pro_monthly" || planId === "pro_annual") return "enterprise";
  return null;
}

/**
 * Resolve effective plan based on subscription lifecycle state.
 * This allows consistent gating during trial expiry, cancellation and scheduled downgrades.
 */
export function resolvePlanIdForLifecycle(input: LifecyclePlanResolutionInput): SubscriptionPlanId {
  const now = input.now || new Date();
  const status = normalizeLifecycleStatus(input.status);
  const activePlanId = normalizePlanId(input.activePlanId);
  const downgradePlanId = input.downgradePlanId ? normalizePlanId(input.downgradePlanId) : null;

  if (status === "cancelled" || status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
    return "free";
  }

  if (status === "trialing" && isDatePast(input.trialEnd, now)) {
    return "free";
  }

  const periodEnded = isDatePast(input.currentPeriodEnd, now);

  if (input.cancelAtPeriodEnd && periodEnded) {
    return downgradePlanId || "free";
  }

  if (downgradePlanId && periodEnded) {
    return downgradePlanId;
  }

  return activePlanId;
}

function getLimitForFeature(planId: SubscriptionPlanId, feature: LimitedFeature): number | null {
  const plan = PLAN_CATALOG[planId];

  if (feature === "clients") return plan.limits.clients;
  if (feature === "trips") return plan.limits.trips;
  if (feature === "proposals") return plan.limits.proposals;
  if (feature === "templates") return plan.limits.templates;
  return plan.limits.teamMembers;
}

function getFeatureLimitConfig(planId: SubscriptionPlanId, feature: LimitedFeature): FeatureLimitConfig {
  return {
    limit: getLimitForFeature(planId, feature),
    window: FEATURE_LIMIT_WINDOWS[feature],
    label: FEATURE_LIMIT_LABELS[feature],
  };
}

function getMonthlyWindowBounds(now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)
  );
  return {
    monthStart: monthStart.toISOString(),
    resetAt: nextMonthStart.toISOString(),
  };
}

export async function resolveOrganizationPlan(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{ tier: SubscriptionTier; planId: SubscriptionPlanId }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeSubscriptionQuery = (supabase as any)
    .from("subscriptions")
    .select("plan_id, status, created_at, trial_end, cancel_at_period_end, current_period_end")
    .eq("organization_id", organizationId)
    .in("status", ["active", "trialing", "cancelled", "canceled", "past_due", "paused", "incomplete", "incomplete_expired", "unpaid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: activeSubscription } = await activeSubscriptionQuery;
  const lifecyclePlanId = resolvePlanIdForLifecycle({
    activePlanId: activeSubscription?.plan_id,
    status: activeSubscription?.status,
    trialEnd: activeSubscription?.trial_end,
    cancelAtPeriodEnd: activeSubscription?.cancel_at_period_end,
    currentPeriodEnd: activeSubscription?.current_period_end,
  });

  if (lifecyclePlanId !== "free") {
    return { tier: normalizeTier(lifecyclePlanId), planId: lifecyclePlanId };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const organizationQuery = (supabase as any)
    .from("organizations")
    .select("subscription_tier")
    .eq("id", organizationId)
    .maybeSingle();
  const { data: organization } = await organizationQuery;
  const organizationTier = normalizeTier(organization?.subscription_tier);

  if (organizationTier === "enterprise") {
    return { tier: "enterprise", planId: "enterprise" };
  }
  if (organizationTier === "pro") {
    return { tier: "pro", planId: "pro_monthly" };
  }

  return { tier: "free", planId: "free" };
}

async function getFeatureUsage(
  supabase: SupabaseClient,
  organizationId: string,
  feature: LimitedFeature
): Promise<{ used: number; resetAt: string | null }> {
  const { monthStart, resetAt } = getMonthlyWindowBounds();

  if (feature === "clients") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("role", "client");
    return { used: count || 0, resetAt: null };
  }

  if (feature === "trips") {
    const { count } = await supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", monthStart);
    return { used: count || 0, resetAt };
  }

  if (feature === "proposals") {
    const { count } = await supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", monthStart);
    return { used: count || 0, resetAt };
  }

  if (feature === "templates") {
    const { count } = await supabase
      .from("tour_templates")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active");
    return { used: count || 0, resetAt: null };
  }

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .neq("role", "client");
  return { used: count || 0, resetAt: null };
}

export async function getFeatureLimitStatus(
  supabase: SupabaseClient,
  organizationId: string,
  feature: LimitedFeature
): Promise<FeatureLimitStatus> {
  const { tier, planId } = await resolveOrganizationPlan(supabase, organizationId);
  const config = getFeatureLimitConfig(planId, feature);
  const usage = await getFeatureUsage(supabase, organizationId, feature);
  const remaining = config.limit === null ? null : Math.max(config.limit - usage.used, 0);
  const allowed = config.limit === null || usage.used < config.limit;

  return {
    feature,
    allowed,
    tier,
    planId,
    used: usage.used,
    limit: config.limit,
    remaining,
    window: config.window,
    label: config.label,
    resetAt: config.window === "monthly" ? usage.resetAt : null,
    upgradePlan: getUpgradePlanForPlanId(planId),
  };
}

export async function getAllFeatureLimitStatuses(
  supabase: SupabaseClient,
  organizationId: string
): Promise<Record<LimitedFeature, FeatureLimitStatus>> {
  const features: LimitedFeature[] = [
    "clients",
    "trips",
    "proposals",
    "templates",
    "team_members",
  ];

  const entries = await Promise.all(
    features.map(async (feature) => {
      const status = await getFeatureLimitStatus(supabase, organizationId, feature);
      return [feature, status] as const;
    })
  );

  return Object.fromEntries(entries) as Record<LimitedFeature, FeatureLimitStatus>;
}
