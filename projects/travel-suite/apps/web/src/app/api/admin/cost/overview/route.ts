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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get("days") || 7)));
  const sinceIso = daysAgoISO(days);

  const { data: logs, error: logsError } = await admin.adminClient
    .from("notification_logs")
    .select("id,recipient_id,status,body,created_at")
    .eq("notification_type", "cost_metering")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  const recipientIds = Array.from(
    new Set((logs || []).map((log) => log.recipient_id).filter((id): id is string => Boolean(id)))
  );

  let profileMap = new Map<string, string>();
  if (recipientIds.length > 0) {
    const { data: profiles } = await admin.adminClient
      .from("profiles")
      .select("id,organization_id")
      .in("id", recipientIds);

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

  for (const log of logs || []) {
    const parsed = parseCostMeteringBody(log.body);
    if (!parsed.category) continue;

    const inferredOrgId = parsed.organizationId || (log.recipient_id ? profileMap.get(log.recipient_id) : null);
    if (!inferredOrgId) continue;

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

  const emergencyCapsUsd = Object.fromEntries(
    await Promise.all(
      CATEGORIES.map(async (category) => [category, await getEmergencyDailySpendCapUsd(category)])
    )
  ) as Record<CostCategory, number>;

  return NextResponse.json({
    period: {
      days,
      since: sinceIso,
    },
    emergency_caps_usd: emergencyCapsUsd,
    organizations: Array.from(organizations.values()).sort(
      (a, b) => b.total_estimated_cost_usd - a.total_estimated_cost_usd
    ),
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

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
    body: `${parsed.data.category}|cap_usd=${normalizedCap.toFixed(4)}`,
    status: "sent",
    sent_at: nowIso,
  });

  return NextResponse.json({
    category: parsed.data.category,
    cap_usd: normalizedCap,
  });
}
