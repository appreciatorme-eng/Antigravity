import { NextResponse } from "next/server";
import { z } from "zod";
import { safeErrorMessage } from "@/lib/security/safe-error";
import {
  isJsonCacheConfigured,
} from "@/lib/cache/upstash";
import {
  invalidateCostOverviewCache,
} from "@/lib/cost/overview-cache";
import {
  setEmergencyDailySpendCapUsd,
  type CostCategory,
} from "@/lib/cost/spend-guardrails";
import type { RequireAdminResult } from "@/lib/auth/admin";

type RequireAdminSuccess = Extract<RequireAdminResult, { ok: true }>;

export const CATEGORIES: CostCategory[] = ["amadeus", "image_search", "ai_image"];

export const UpdateEmergencyCapSchema = z.object({
  category: z.enum(["amadeus", "image_search", "ai_image"]),
  capUsd: z.number().positive(),
});

type ParsedMeteringBody = {
  category: CostCategory | null;
  tier: string | null;
  reason: string | null;
  remainingDaily: number | null;
  organizationId: string | null;
  estimatedCostUsd: number | null;
  dailySpendUsd: number | null;
  planCapUsd: number | null;
  emergencyCapUsd: number | null;
};

function parseBodyNumber(value: string | undefined): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function parseCostMeteringBody(body: string | null): ParsedMeteringBody {
  if (!body) {
    return {
      category: null,
      tier: null,
      reason: null,
      remainingDaily: null,
      organizationId: null,
      estimatedCostUsd: null,
      dailySpendUsd: null,
      planCapUsd: null,
      emergencyCapUsd: null,
    };
  }

  const parts = body.split("|").map((part) => part.trim());
  const category = parts[0];
  const kv = new Map<string, string>();

  for (const part of parts.slice(1)) {
    const [key, ...rest] = part.split("=");
    if (!key || rest.length === 0) continue;
    kv.set(key.trim(), rest.join("=").trim());
  }

  const normalizedCategory = CATEGORIES.includes(category as CostCategory)
    ? (category as CostCategory)
    : null;

  return {
    category: normalizedCategory,
    tier: kv.get("tier") || null,
    reason: kv.get("reason") || null,
    remainingDaily: parseBodyNumber(kv.get("remaining_daily")),
    organizationId: kv.get("organization_id") || null,
    estimatedCostUsd: parseBodyNumber(kv.get("estimated_cost_usd")),
    dailySpendUsd: parseBodyNumber(kv.get("daily_spend_usd")),
    planCapUsd: parseBodyNumber(kv.get("plan_cap_usd")),
    emergencyCapUsd: parseBodyNumber(kv.get("emergency_cap_usd")),
  };
}

export function monthStartISO(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export function daysAgoISO(days: number): string {
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60_000);
  return since.toISOString();
}

export function normalizeOrganizationScope(value: string | null): string | null {
  const candidate = (value || "").trim();
  return candidate.length > 0 ? candidate : null;
}

const USD_TO_INR = 83;
const COST_SPIKE_MULTIPLIER = 1.8;
const MIN_COST_SPIKE_USD = 5;
const AUTH_FAILURE_ALERT_THRESHOLD = 5;
const CAP_HIT_ALERT_THRESHOLD = 0.25;

export type OperationalAlertCategory = "cost_spike" | "auth_failures" | "cap_hit_rate";

type AlertRunbook = {
  id: string;
  version: string;
  url: string;
  owner: string;
  response_sla_minutes: number;
};

export const ALERT_RUNBOOKS: Record<OperationalAlertCategory, AlertRunbook> = {
  cost_spike: {
    id: "spend-spike-response",
    version: "2026-03-01",
    url: "/admin/cost#spend-spike-response",
    owner: "Platform Ops",
    response_sla_minutes: 30,
  },
  cap_hit_rate: {
    id: "cap-hit-triage",
    version: "2026-03-01",
    url: "/admin/cost#cap-hit-triage",
    owner: "Revenue Operations",
    response_sla_minutes: 60,
  },
  auth_failures: {
    id: "auth-failures",
    version: "2026-03-01",
    url: "/admin/security#auth-failures",
    owner: "Security",
    response_sla_minutes: 15,
  },
};

type CategoryAggregate = {
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

export type OperationalAlert = {
  id: string;
  severity: "high" | "medium";
  category: OperationalAlertCategory;
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

export type WeeklyMarginReportRow = {
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
  scope: {
    mode: "organization" | "global";
    organization_id: string | null;
    actor_role: "admin" | "super_admin";
  };
  emergency_caps_usd: Record<CostCategory, number>;
  alerts: OperationalAlert[];
  weekly_margin_report: WeeklyMarginReportRow[];
  organizations: OrganizationAggregate[];
};

export type CostOverviewCacheEnvelope = {
  cached_at: string;
  payload: CostOverviewPayload;
};

export type CostOverviewCacheMeta = {
  enabled: boolean;
  status: "hit" | "miss" | "stale_fallback";
  cached_at: string;
  age_seconds: number;
  ttl_seconds: number;
};

export function parseKvBody(body: string | null): Map<string, string> {
  const kv = new Map<string, string>();
  if (!body) return kv;
  const parts = body.split("|").map((part) => part.trim());
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (!key || rest.length === 0) continue;
    kv.set(key.trim(), rest.join("=").trim());
  }
  return kv;
}

export function toInr(usd: number): number {
  return Number((usd * USD_TO_INR).toFixed(2));
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return safeErrorMessage(error, "Request failed");
  return "Request failed";
}

export function toCacheMeta(
  status: CostOverviewCacheMeta["status"],
  cachedAt: string,
  ttlSeconds: number,
): CostOverviewCacheMeta {
  const ageSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000),
  );
  return {
    enabled: isJsonCacheConfigured(),
    status,
    cached_at: cachedAt,
    age_seconds: Number.isFinite(ageSeconds) ? ageSeconds : 0,
    ttl_seconds: ttlSeconds,
  };
}

export const costAlertThresholds = {
  AUTH_FAILURE_ALERT_THRESHOLD,
  CAP_HIT_ALERT_THRESHOLD,
  COST_SPIKE_MULTIPLIER,
  MIN_COST_SPIKE_USD,
} as const;

export async function handleEmergencyCapPost(
  admin: RequireAdminSuccess,
  body: unknown,
) {
  if (!admin.isSuperAdmin) {
    return NextResponse.json(
      { error: "Only super admins can update emergency caps" },
      { status: 403 },
    );
  }

  const parsed = UpdateEmergencyCapSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid emergency cap payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const normalizedCap = await setEmergencyDailySpendCapUsd(
    parsed.data.category,
    parsed.data.capUsd,
  );

  const nowIso = new Date().toISOString();
  await admin.adminClient.from("notification_logs").insert({
    recipient_id: admin.userId,
    recipient_type: "admin",
    notification_type: "cost_guardrail_config",
    title: "Emergency spend cap updated",
    body: `${parsed.data.category}|cap_usd=${normalizedCap.toFixed(4)}|actor_id=${admin.userId}|actor_role=${admin.role}`,
    status: "sent",
    sent_at: nowIso,
  });

  void invalidateCostOverviewCache();

  return NextResponse.json({
    category: parsed.data.category,
    cap_usd: normalizedCap,
  });
}
