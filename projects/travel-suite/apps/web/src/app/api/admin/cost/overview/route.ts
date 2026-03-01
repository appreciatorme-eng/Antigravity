import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getEmergencyDailySpendCapUsd,
  setEmergencyDailySpendCapUsd,
  type CostCategory,
} from "@/lib/cost/spend-guardrails";

const CATEGORIES: CostCategory[] = ["amadeus", "image_search", "ai_image"];

const UpdateEmergencyCapSchema = z.object({
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

function parseCostMeteringBody(body: string | null): ParsedMeteringBody {
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

function monthStartISO(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60_000);
  return since.toISOString();
}

function normalizeOrganizationScope(value: string | null): string | null {
  const candidate = (value || "").trim();
  return candidate.length > 0 ? candidate : null;
}

const USD_TO_INR = 83;
const COST_SPIKE_MULTIPLIER = 1.8;
const MIN_COST_SPIKE_USD = 5;
const AUTH_FAILURE_ALERT_THRESHOLD = 5;
const CAP_HIT_ALERT_THRESHOLD = 0.25;

type OperationalAlert = {
  id: string;
  severity: "high" | "medium";
  category: "cost_spike" | "auth_failures" | "cap_hit_rate";
  organization_id: string;
  organization_name: string;
  title: string;
  description: string;
  metric_value: string;
  owner: string;
  runbook: string;
  detected_at: string;
};

type WeeklyMarginReportRow = {
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

function parseKvBody(body: string | null): Map<string, string> {
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

function toInr(usd: number): number {
  return Number((usd * USD_TO_INR).toFixed(2));
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get("days") || 7)));
  const sinceIso = daysAgoISO(days);

  const requestedOrganizationId = normalizeOrganizationScope(
    request.nextUrl.searchParams.get("organization_id")
  );

  const scopedOrganizationId = admin.isSuperAdmin ? requestedOrganizationId : admin.organizationId;
  if (!admin.isSuperAdmin && !scopedOrganizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  let scopedRecipientIds: string[] | null = null;
  if (scopedOrganizationId) {
    const { data: orgProfiles, error: orgProfilesError } = await admin.adminClient
      .from("profiles")
      .select("id")
      .eq("organization_id", scopedOrganizationId)
      .limit(5000);

    if (orgProfilesError) {
      return NextResponse.json({ error: orgProfilesError.message }, { status: 500 });
    }

    scopedRecipientIds = (orgProfiles || []).map((profile) => profile.id).filter(Boolean);
  }

  let logs: Array<{
    id: string;
    recipient_id: string | null;
    status: string | null;
    body: string | null;
    created_at: string | null;
  }> = [];

  if (!scopedRecipientIds || scopedRecipientIds.length > 0) {
    let logsQuery = admin.adminClient
      .from("notification_logs")
      .select("id,recipient_id,status,body,created_at")
      .eq("notification_type", "cost_metering")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (scopedRecipientIds) {
      logsQuery = logsQuery.in("recipient_id", scopedRecipientIds);
    }

    const { data: logsData, error: logsError } = await logsQuery;
    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    logs = logsData || [];
  }

  const since24hIso = daysAgoISO(1);
  const since48hIso = daysAgoISO(2);
  const since7dIso = daysAgoISO(7);

  let recentCostLogs: Array<{
    recipient_id: string | null;
    status: string | null;
    body: string | null;
    created_at: string | null;
  }> = [];

  let authFailureLogs: Array<{
    recipient_id: string | null;
    body: string | null;
    created_at: string | null;
  }> = [];

  if (!scopedRecipientIds || scopedRecipientIds.length > 0) {
    let recentCostLogsQuery = admin.adminClient
      .from("notification_logs")
      .select("recipient_id,status,body,created_at")
      .eq("notification_type", "cost_metering")
      .gte("created_at", since7dIso)
      .order("created_at", { ascending: false })
      .limit(10000);

    if (scopedRecipientIds) {
      recentCostLogsQuery = recentCostLogsQuery.in("recipient_id", scopedRecipientIds);
    }

    const { data: recentCostData, error: recentCostError } = await recentCostLogsQuery;
    if (recentCostError) {
      return NextResponse.json({ error: recentCostError.message }, { status: 500 });
    }
    recentCostLogs = recentCostData || [];

    let authFailureQuery = admin.adminClient
      .from("notification_logs")
      .select("recipient_id,body,created_at")
      .eq("notification_type", "admin_auth_failure")
      .gte("created_at", since24hIso)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (scopedRecipientIds) {
      authFailureQuery = authFailureQuery.in("recipient_id", scopedRecipientIds);
    }

    const { data: authFailureData, error: authFailureError } = await authFailureQuery;
    if (authFailureError) {
      return NextResponse.json({ error: authFailureError.message }, { status: 500 });
    }
    authFailureLogs = authFailureData || [];
  }

  const recipientIds = Array.from(
    new Set(
      [...logs, ...recentCostLogs, ...authFailureLogs]
        .map((log) => log.recipient_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let profileMap = new Map<string, string>();
  if (recipientIds.length > 0) {
    let profileQuery = admin.adminClient.from("profiles").select("id,organization_id").in("id", recipientIds);

    if (scopedOrganizationId) {
      profileQuery = profileQuery.eq("organization_id", scopedOrganizationId);
    }

    const { data: profiles } = await profileQuery;

    profileMap = new Map(
      (profiles || [])
        .filter((profile) => profile.organization_id)
        .map((profile) => [profile.id, profile.organization_id as string])
    );
  }

  type CategoryAggregate = {
    allowed_requests: number;
    denied_requests: number;
    estimated_cost_usd: number;
    last_daily_spend_usd: number;
    last_plan_cap_usd: number;
    last_emergency_cap_usd: number;
  };

  type OrganizationAggregate = {
    organization_id: string;
    organization_name: string;
    tier: string;
    categories: Record<CostCategory, CategoryAggregate>;
    total_estimated_cost_usd: number;
    ai_monthly_requests: number;
    ai_monthly_estimated_cost_usd: number;
  };

  const organizations = new Map<string, OrganizationAggregate>();

  const ensureOrganization = (organizationId: string): OrganizationAggregate => {
    const existing = organizations.get(organizationId);
    if (existing) return existing;

    const next: OrganizationAggregate = {
      organization_id: organizationId,
      organization_name: organizationId,
      tier: "unknown",
      categories: {
        amadeus: {
          allowed_requests: 0,
          denied_requests: 0,
          estimated_cost_usd: 0,
          last_daily_spend_usd: 0,
          last_plan_cap_usd: 0,
          last_emergency_cap_usd: 0,
        },
        image_search: {
          allowed_requests: 0,
          denied_requests: 0,
          estimated_cost_usd: 0,
          last_daily_spend_usd: 0,
          last_plan_cap_usd: 0,
          last_emergency_cap_usd: 0,
        },
        ai_image: {
          allowed_requests: 0,
          denied_requests: 0,
          estimated_cost_usd: 0,
          last_daily_spend_usd: 0,
          last_plan_cap_usd: 0,
          last_emergency_cap_usd: 0,
        },
      },
      total_estimated_cost_usd: 0,
      ai_monthly_requests: 0,
      ai_monthly_estimated_cost_usd: 0,
    };

    organizations.set(organizationId, next);
    return next;
  };

  for (const log of logs) {
    const parsed = parseCostMeteringBody(log.body);
    if (!parsed.category) continue;

    const inferredOrgId = parsed.organizationId || (log.recipient_id ? profileMap.get(log.recipient_id) : null);
    if (!inferredOrgId) continue;

    if (scopedOrganizationId && inferredOrgId !== scopedOrganizationId) {
      continue;
    }

    const aggregate = ensureOrganization(inferredOrgId);
    const category = aggregate.categories[parsed.category];

    if (log.status === "sent") {
      category.allowed_requests += 1;
    } else {
      category.denied_requests += 1;
    }

    if (log.status === "sent" && typeof parsed.estimatedCostUsd === "number") {
      category.estimated_cost_usd += parsed.estimatedCostUsd;
      aggregate.total_estimated_cost_usd += parsed.estimatedCostUsd;
    }

    if (typeof parsed.dailySpendUsd === "number") {
      category.last_daily_spend_usd = Math.max(category.last_daily_spend_usd, parsed.dailySpendUsd);
    }

    if (typeof parsed.planCapUsd === "number") {
      category.last_plan_cap_usd = parsed.planCapUsd;
    }

    if (typeof parsed.emergencyCapUsd === "number") {
      category.last_emergency_cap_usd = parsed.emergencyCapUsd;
    }
  }

  const organizationIds = Array.from(organizations.keys());

  if (organizationIds.length > 0) {
    const [{ data: organizationRows }, { data: aiUsageRows }] = await Promise.all([
      admin.adminClient
        .from("organizations")
        .select("id,name,subscription_tier")
        .in("id", organizationIds),
      admin.adminClient
        .from("organization_ai_usage")
        .select("organization_id,ai_requests,estimated_cost_usd")
        .eq("month_start", monthStartISO())
        .in("organization_id", organizationIds),
    ]);

    for (const row of organizationRows || []) {
      const aggregate = organizations.get(row.id);
      if (!aggregate) continue;
      aggregate.organization_name = row.name || row.id;
      aggregate.tier = row.subscription_tier || "free";
    }

    for (const row of aiUsageRows || []) {
      const aggregate = organizations.get(row.organization_id);
      if (!aggregate) continue;
      const requests = Number(row.ai_requests || 0);
      const spend = Number(row.estimated_cost_usd || 0);
      aggregate.ai_monthly_requests = Number.isFinite(requests) ? requests : 0;
      aggregate.ai_monthly_estimated_cost_usd = Number.isFinite(spend) ? spend : 0;
    }
  }

  const alerts: OperationalAlert[] = [];

  const categoryWindowStats = new Map<
    string,
    {
      organizationId: string;
      category: CostCategory;
      last24hSpendUsd: number;
      previous24hSpendUsd: number;
      total24hRequests: number;
      denied24hRequests: number;
      weeklyAllowedRequests: number;
      weeklyDeniedRequests: number;
      weeklySpendUsd: number;
    }
  >();

  for (const log of recentCostLogs) {
    const parsed = parseCostMeteringBody(log.body);
    if (!parsed.category) continue;

    const inferredOrgId = parsed.organizationId || (log.recipient_id ? profileMap.get(log.recipient_id) : null);
    if (!inferredOrgId) continue;

    if (scopedOrganizationId && inferredOrgId !== scopedOrganizationId) continue;
    ensureOrganization(inferredOrgId);

    const createdAtMs = log.created_at ? new Date(log.created_at).getTime() : Number.NaN;
    if (!Number.isFinite(createdAtMs)) continue;

    const key = `${inferredOrgId}:${parsed.category}`;
    const current =
      categoryWindowStats.get(key) ||
      {
        organizationId: inferredOrgId,
        category: parsed.category,
        last24hSpendUsd: 0,
        previous24hSpendUsd: 0,
        total24hRequests: 0,
        denied24hRequests: 0,
        weeklyAllowedRequests: 0,
        weeklyDeniedRequests: 0,
        weeklySpendUsd: 0,
      };

    const isAllowed = log.status === "sent";
    if (isAllowed) current.weeklyAllowedRequests += 1;
    else current.weeklyDeniedRequests += 1;

    if (isAllowed && typeof parsed.estimatedCostUsd === "number") {
      current.weeklySpendUsd += parsed.estimatedCostUsd;
    }

    if (createdAtMs >= new Date(since24hIso).getTime()) {
      current.total24hRequests += 1;
      if (isAllowed && typeof parsed.estimatedCostUsd === "number") {
        current.last24hSpendUsd += parsed.estimatedCostUsd;
      } else if (!isAllowed) {
        current.denied24hRequests += 1;
      }
    } else if (createdAtMs >= new Date(since48hIso).getTime()) {
      if (isAllowed && typeof parsed.estimatedCostUsd === "number") {
        current.previous24hSpendUsd += parsed.estimatedCostUsd;
      }
    }

    categoryWindowStats.set(key, current);
  }

  const weeklySpendByOrg = new Map<string, number>();
  const weeklyDenialsByOrg = new Map<string, { allowed: number; denied: number }>();

  for (const item of categoryWindowStats.values()) {
    const aggregate = ensureOrganization(item.organizationId);
    const organizationName = aggregate.organization_name;

    weeklySpendByOrg.set(
      item.organizationId,
      Number((weeklySpendByOrg.get(item.organizationId) || 0) + item.weeklySpendUsd)
    );

    const denialEntry = weeklyDenialsByOrg.get(item.organizationId) || { allowed: 0, denied: 0 };
    denialEntry.allowed += item.weeklyAllowedRequests;
    denialEntry.denied += item.weeklyDeniedRequests;
    weeklyDenialsByOrg.set(item.organizationId, denialEntry);

    if (
      item.previous24hSpendUsd >= MIN_COST_SPIKE_USD &&
      item.last24hSpendUsd >= item.previous24hSpendUsd * COST_SPIKE_MULTIPLIER
    ) {
      alerts.push({
        id: `cost-spike-${item.organizationId}-${item.category}`,
        severity: "high",
        category: "cost_spike",
        organization_id: item.organizationId,
        organization_name: organizationName,
        title: "Sudden provider cost spike detected",
        description: `${item.category} spend accelerated sharply in the last 24h.`,
        metric_value: `$${item.last24hSpendUsd.toFixed(2)} vs $${item.previous24hSpendUsd.toFixed(2)}`,
        owner: "Platform Ops",
        runbook: "/admin/cost#spend-spike-response",
        detected_at: new Date().toISOString(),
      });
    }

    const denialRate24h =
      item.total24hRequests > 0 ? item.denied24hRequests / item.total24hRequests : 0;
    if (item.total24hRequests >= 20 && denialRate24h >= CAP_HIT_ALERT_THRESHOLD) {
      alerts.push({
        id: `cap-hit-${item.organizationId}-${item.category}`,
        severity: denialRate24h >= 0.4 ? "high" : "medium",
        category: "cap_hit_rate",
        organization_id: item.organizationId,
        organization_name: organizationName,
        title: "Cap-hit anomaly",
        description: `${item.category} denials are elevated at the cap boundary.`,
        metric_value: `${(denialRate24h * 100).toFixed(1)}% denied in last 24h`,
        owner: "Revenue Operations",
        runbook: "/admin/cost#cap-hit-triage",
        detected_at: new Date().toISOString(),
      });
    }
  }

  const authFailuresByOrg = new Map<string, number>();
  for (const log of authFailureLogs) {
    const bodyKv = parseKvBody(log.body);
    const bodyOrgId = normalizeOrganizationScope(bodyKv.get("organization_id") || null);
    const inferredOrgId =
      (bodyOrgId && bodyOrgId !== "unknown" ? bodyOrgId : null) ||
      (log.recipient_id ? profileMap.get(log.recipient_id) : null);

    if (!inferredOrgId) continue;
    if (scopedOrganizationId && inferredOrgId !== scopedOrganizationId) continue;

    ensureOrganization(inferredOrgId);
    authFailuresByOrg.set(inferredOrgId, (authFailuresByOrg.get(inferredOrgId) || 0) + 1);
  }

  for (const [organizationId, failures] of authFailuresByOrg.entries()) {
    if (failures < AUTH_FAILURE_ALERT_THRESHOLD) continue;
    const aggregate = ensureOrganization(organizationId);

    alerts.push({
      id: `auth-failures-${organizationId}`,
      severity: failures >= AUTH_FAILURE_ALERT_THRESHOLD * 2 ? "high" : "medium",
      category: "auth_failures",
      organization_id: organizationId,
      organization_name: aggregate.organization_name,
      title: "Repeated admin authorization failures",
      description: "Investigate role drift, expired sessions, or suspicious admin access attempts.",
      metric_value: `${failures} denied admin attempts in last 24h`,
      owner: "Security",
      runbook: "/admin/security#auth-failures",
      detected_at: new Date().toISOString(),
    });
  }

  let weeklyRevenueRows: Array<{ organization_id: string; total_amount: number | string | null }> = [];
  {
    let weeklyRevenueQuery = admin.adminClient
      .from("invoices")
      .select("organization_id,total_amount")
      .eq("status", "paid")
      .gte("created_at", since7dIso)
      .limit(10000);

    if (scopedOrganizationId) {
      weeklyRevenueQuery = weeklyRevenueQuery.eq("organization_id", scopedOrganizationId);
    }

    const { data: revenueRows, error: revenueError } = await weeklyRevenueQuery;
    if (revenueError) {
      return NextResponse.json({ error: revenueError.message }, { status: 500 });
    }
    weeklyRevenueRows = revenueRows || [];
  }

  const weeklyRevenueByOrg = new Map<string, number>();
  for (const row of weeklyRevenueRows) {
    if (!row.organization_id) continue;
    ensureOrganization(row.organization_id);
    const amount = Number(row.total_amount || 0);
    if (!Number.isFinite(amount)) continue;
    weeklyRevenueByOrg.set(row.organization_id, (weeklyRevenueByOrg.get(row.organization_id) || 0) + amount);
  }

  const allOrganizationIds = Array.from(
    new Set([
      ...organizations.keys(),
      ...weeklyRevenueByOrg.keys(),
      ...weeklySpendByOrg.keys(),
      ...authFailuresByOrg.keys(),
    ])
  );

  if (allOrganizationIds.length > 0) {
    const [{ data: organizationRows }, { data: aiUsageRows }] = await Promise.all([
      admin.adminClient
        .from("organizations")
        .select("id,name,subscription_tier")
        .in("id", allOrganizationIds),
      admin.adminClient
        .from("organization_ai_usage")
        .select("organization_id,ai_requests,estimated_cost_usd")
        .eq("month_start", monthStartISO())
        .in("organization_id", allOrganizationIds),
    ]);

    for (const row of organizationRows || []) {
      const aggregate = organizations.get(row.id);
      if (!aggregate) continue;
      aggregate.organization_name = row.name || row.id;
      aggregate.tier = row.subscription_tier || "free";
    }

    for (const row of aiUsageRows || []) {
      const aggregate = organizations.get(row.organization_id);
      if (!aggregate) continue;
      const requests = Number(row.ai_requests || 0);
      const spend = Number(row.estimated_cost_usd || 0);
      aggregate.ai_monthly_requests = Number.isFinite(requests) ? requests : 0;
      aggregate.ai_monthly_estimated_cost_usd = Number.isFinite(spend) ? spend : 0;
    }
  }

  const weeklyMarginReport: WeeklyMarginReportRow[] = allOrganizationIds
    .map((organizationId) => {
      const aggregate = ensureOrganization(organizationId);
      const revenueInr = Number((weeklyRevenueByOrg.get(organizationId) || 0).toFixed(2));
      const variableCostUsd = Number((weeklySpendByOrg.get(organizationId) || 0).toFixed(4));
      const variableCostInr = toInr(variableCostUsd);
      const denialStats = weeklyDenialsByOrg.get(organizationId) || { allowed: 0, denied: 0 };
      const totalAttempts = denialStats.allowed + denialStats.denied;
      const capDenialRatePct = totalAttempts > 0 ? Number(((denialStats.denied / totalAttempts) * 100).toFixed(2)) : 0;
      const grossMarginPct =
        revenueInr > 0
          ? Number((((revenueInr - variableCostInr) / revenueInr) * 100).toFixed(2))
          : variableCostInr > 0
          ? 0
          : 100;

      let recommendation = "Healthy weekly margin posture.";
      if (revenueInr === 0 && variableCostInr > 0) {
        recommendation = "COGS detected without matching revenue. Tighten feature gating or require prepaid packs.";
      } else if (grossMarginPct < 45) {
        recommendation = "Margin is below target. Enforce pricing floor and push high-cost workflows to prepaid packs.";
      } else if (capDenialRatePct >= 15) {
        recommendation = "Cap denials are high. Tune default caps and sell overage packs before throttling impacts conversion.";
      }

      return {
        organization_id: organizationId,
        organization_name: aggregate.organization_name,
        tier: aggregate.tier,
        revenue_inr: revenueInr,
        variable_cost_usd: variableCostUsd,
        variable_cost_inr: variableCostInr,
        gross_margin_pct: grossMarginPct,
        cap_denial_rate_pct: capDenialRatePct,
        recommendation,
      };
    })
    .sort((left, right) => right.revenue_inr - left.revenue_inr || left.gross_margin_pct - right.gross_margin_pct);

  const emergencyCapsUsd = Object.fromEntries(
    await Promise.all(CATEGORIES.map(async (category) => [category, await getEmergencyDailySpendCapUsd(category)]))
  ) as Record<CostCategory, number>;

  return NextResponse.json({
    period: {
      days,
      since: sinceIso,
    },
    scope: {
      mode: scopedOrganizationId ? "organization" : "global",
      organization_id: scopedOrganizationId,
      actor_role: admin.role,
    },
    emergency_caps_usd: emergencyCapsUsd,
    alerts: alerts
      .map((alert) => ({
        ...alert,
        organization_name: organizations.get(alert.organization_id)?.organization_name || alert.organization_name,
      }))
      .sort((left, right) => {
        if (left.severity === right.severity) return left.organization_name.localeCompare(right.organization_name);
        return left.severity === "high" ? -1 : 1;
      }),
    weekly_margin_report: weeklyMarginReport,
    organizations: Array.from(organizations.values()).sort(
      (a, b) => b.total_estimated_cost_usd - a.total_estimated_cost_usd
    ),
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  if (!admin.isSuperAdmin) {
    return NextResponse.json({ error: "Only super admins can update emergency caps" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateEmergencyCapSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid emergency cap payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const normalizedCap = await setEmergencyDailySpendCapUsd(parsed.data.category, parsed.data.capUsd);

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

  return NextResponse.json({
    category: parsed.data.category,
    cap_usd: normalizedCap,
  });
}
