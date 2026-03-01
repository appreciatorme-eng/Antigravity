export type CanonicalTier = "free" | "pro" | "enterprise";
export type CanonicalPlanId = "free" | "pro_monthly" | "pro_annual" | "enterprise";

export interface CanonicalPlan {
  id: CanonicalPlanId;
  tier: CanonicalTier;
  displayName: string;
  monthlyPriceInr: number;
  annualTotalInr: number | null;
  limits: {
    clients: number | null;
    trips: number | null;
    proposals: number | null;
    templates: number | null;
    teamMembers: number | null;
    users: number | null;
    aiRequests: number | null;
  };
}

export const PLAN_CATALOG: Record<CanonicalPlanId, CanonicalPlan> = {
  free: {
    id: "free",
    tier: "free",
    displayName: "Free",
    monthlyPriceInr: 0,
    annualTotalInr: 0,
    limits: {
      clients: 10,
      trips: 5,
      proposals: 5,
      templates: 3,
      teamMembers: 1,
      users: 1,
      aiRequests: 200,
    },
  },
  pro_monthly: {
    id: "pro_monthly",
    tier: "pro",
    displayName: "Pro",
    monthlyPriceInr: 4999,
    annualTotalInr: null,
    limits: {
      clients: null,
      trips: null,
      proposals: null,
      templates: 6,
      teamMembers: 5,
      users: 5,
      aiRequests: 3000,
    },
  },
  pro_annual: {
    id: "pro_annual",
    tier: "pro",
    displayName: "Pro Annual",
    monthlyPriceInr: 4166,
    annualTotalInr: 49990,
    limits: {
      clients: null,
      trips: null,
      proposals: null,
      templates: 6,
      teamMembers: 10,
      users: 10,
      aiRequests: 5000,
    },
  },
  enterprise: {
    id: "enterprise",
    tier: "enterprise",
    displayName: "Enterprise",
    monthlyPriceInr: 15000,
    annualTotalInr: null,
    limits: {
      clients: null,
      trips: null,
      proposals: null,
      templates: null,
      teamMembers: null,
      users: null,
      aiRequests: 20000,
    },
  },
};

export function normalizeCanonicalPlanId(raw: string | null | undefined): CanonicalPlanId {
  if (!raw) return "free";
  if (raw === "enterprise") return "enterprise";
  if (raw === "pro_monthly" || raw === "pro_annual") return raw;
  if (raw === "pro") return "pro_monthly";
  return "free";
}

export function tierForPlan(planId: CanonicalPlanId): CanonicalTier {
  return PLAN_CATALOG[planId].tier;
}

export function limitToUiValue(limit: number | null): number {
  return limit === null ? -1 : limit;
}
