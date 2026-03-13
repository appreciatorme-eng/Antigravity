export type CostCategory = "amadeus" | "image_search" | "ai_image";

export type CategoryAggregate = {
  allowed_requests: number;
  denied_requests: number;
  estimated_cost_usd: number;
  last_daily_spend_usd: number;
  last_plan_cap_usd: number;
  last_emergency_cap_usd: number;
};

export type OrganizationAggregate = {
  organization_id: string;
  organization_name: string;
  tier: string;
  categories: Record<CostCategory, CategoryAggregate>;
  total_estimated_cost_usd: number;
  ai_monthly_requests: number;
  ai_monthly_estimated_cost_usd: number;
};

export type AlertRunbook = {
  id: string;
  version: string;
  url: string;
  owner: string;
  response_sla_minutes: number;
};

export type CostAlert = {
  id: string;
  severity: "high" | "medium";
  category: "cost_spike" | "auth_failures" | "cap_hit_rate";
  organization_id: string;
  organization_name: string;
  title: string;
  description: string;
  metric_value: string;
  owner: string;
  runbook: AlertRunbook;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  detected_at: string;
};

export type CostOverviewCacheMeta = {
  enabled: boolean;
  status: "hit" | "miss" | "stale_fallback";
  cached_at: string;
  age_seconds: number;
  ttl_seconds: number;
};

export type WeeklyMarginRow = {
  organization_id: string;
  organization_name: string;
  tier: string;
  revenue_inr: number;
  variable_cost_usd: number;
  variable_cost_inr: number;
  gross_margin_pct: number;
  cap_denial_rate_pct: number;
  recommendation: string;
};

export type CostOverviewPayload = {
  period: {
    days: number;
    since: string;
  };
  emergency_caps_usd: Record<CostCategory, number>;
  alerts: CostAlert[];
  weekly_margin_report: WeeklyMarginRow[];
  organizations: OrganizationAggregate[];
  cache?: CostOverviewCacheMeta;
};

export const CATEGORY_LABEL: Record<CostCategory, string> = {
  amadeus: "Flights & Hotels API",
  image_search: "Image Search",
  ai_image: "AI Image Generation",
};

export const CATEGORY_COLOR: Record<CostCategory, string> = {
  amadeus: "text-blue-600",
  image_search: "text-amber-600",
  ai_image: "text-emerald-600",
};

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatInr(value: number): string {
  return `\u20B9${Math.round(value).toLocaleString("en-IN")}`;
}
