import {
  normalizeCanonicalPlanId,
  type CanonicalPlanId,
  type CanonicalTier,
  tierForPlan,
} from "@/lib/billing/plan-catalog";

export type CreditPackKey =
  | "ai_credits_starter"
  | "ai_credits_growth"
  | "media_credits_growth"
  | "automation_recovery";

export type CreditPackCategory = "ai" | "media" | "automation";

export interface CreditPackDefinition {
  key: CreditPackKey;
  name: string;
  category: CreditPackCategory;
  description: string;
  included_credits: number;
  unit_label: string;
  price_inr: number;
  estimated_cogs_inr: number;
  min_tier: CanonicalTier;
}

export interface CreditPackOffer extends CreditPackDefinition {
  gross_profit_inr: number;
  margin_pct: number;
  requires_plan_upgrade: boolean;
  required_plan_id: CanonicalPlanId | null;
}

export interface PremiumAutomationGate {
  enabled: boolean;
  required_plan_id: CanonicalPlanId | null;
  reason: string;
}

const CREDIT_PACKS: CreditPackDefinition[] = [
  {
    key: "ai_credits_starter",
    name: "AI Starter Credits",
    category: "ai",
    description: "Prepaid AI generation buffer for peak inquiry hours.",
    included_credits: 1000,
    unit_label: "AI requests",
    price_inr: 2999,
    estimated_cogs_inr: 920,
    min_tier: "free",
  },
  {
    key: "ai_credits_growth",
    name: "AI Growth Credits",
    category: "ai",
    description: "High-volume AI credits for proposal and itinerary bursts.",
    included_credits: 5000,
    unit_label: "AI requests",
    price_inr: 11999,
    estimated_cogs_inr: 3680,
    min_tier: "free",
  },
  {
    key: "media_credits_growth",
    name: "Media Search Credits",
    category: "media",
    description: "Prepaid stock image and media discovery credits.",
    included_credits: 500,
    unit_label: "media lookups",
    price_inr: 2499,
    estimated_cogs_inr: 790,
    min_tier: "free",
  },
  {
    key: "automation_recovery",
    name: "Collections Automation Pack",
    category: "automation",
    description: "Outcome-focused reminder automation for payment recovery and quote follow-ups.",
    included_credits: 2000,
    unit_label: "automation actions",
    price_inr: 4999,
    estimated_cogs_inr: 1480,
    min_tier: "pro",
  },
];

function requiredPlanIdForTier(tier: CanonicalTier): CanonicalPlanId | null {
  if (tier === "free") return null;
  if (tier === "pro") return "pro_monthly";
  return "enterprise";
}

function marginPct(priceInr: number, cogsInr: number): number {
  if (priceInr <= 0) return 0;
  return Number((((priceInr - cogsInr) / priceInr) * 100).toFixed(1));
}

function tierRank(tier: CanonicalTier): number {
  if (tier === "free") return 0;
  if (tier === "pro") return 1;
  return 2;
}

function canAccessTier(planTier: CanonicalTier, requiredTier: CanonicalTier): boolean {
  return tierRank(planTier) >= tierRank(requiredTier);
}

export function resolveCreditPackOffers(rawPlanId: string | null | undefined): {
  plan_id: CanonicalPlanId;
  tier: CanonicalTier;
  offers: CreditPackOffer[];
  premium_automation_gate: PremiumAutomationGate;
} {
  const planId = normalizeCanonicalPlanId(rawPlanId);
  const tier = tierForPlan(planId);

  const offers: CreditPackOffer[] = CREDIT_PACKS.map((pack) => {
    const requiresUpgrade = !canAccessTier(tier, pack.min_tier);
    const requiredPlanId = requiresUpgrade ? requiredPlanIdForTier(pack.min_tier) : null;
    const grossProfit = Math.max(0, pack.price_inr - pack.estimated_cogs_inr);

    return {
      ...pack,
      gross_profit_inr: grossProfit,
      margin_pct: marginPct(pack.price_inr, pack.estimated_cogs_inr),
      requires_plan_upgrade: requiresUpgrade,
      required_plan_id: requiredPlanId,
    };
  });

  return {
    plan_id: planId,
    tier,
    offers,
    premium_automation_gate: {
      enabled: canAccessTier(tier, "pro"),
      required_plan_id: canAccessTier(tier, "pro") ? null : "pro_monthly",
      reason: canAccessTier(tier, "pro")
        ? "Premium automation access is active for your plan."
        : "Upgrade to Pro to activate premium automation packs with SLA-level workflows.",
    },
  };
}
