import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { toNumber } from "@/lib/admin/insights";

function isSchemaDriftError(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find");
}

function monthStartISO(date = new Date()): string {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return start.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const monthStart = monthStartISO();

  const [orgRes, usageRes] = await Promise.all([
    admin.adminClient
      .from("organizations")
      .select("ai_monthly_spend_cap_usd,ai_monthly_request_cap,subscription_tier")
      .eq("id", admin.organizationId)
      .single(),
    admin.adminClient
      .from("organization_ai_usage")
      .select("ai_requests,rag_hits,cache_hits,fallback_count,estimated_cost_usd")
      .eq("organization_id", admin.organizationId)
      .eq("month_start", monthStart)
      .maybeSingle(),
  ]);

  if (orgRes.error || usageRes.error) {
    const err = orgRes.error || usageRes.error;
    if (!isSchemaDriftError(err?.message || undefined)) {
      return NextResponse.json({ error: err?.message || "Failed to load AI usage" }, { status: 500 });
    }

    return NextResponse.json({
      month_start: monthStart,
      tier: "free",
      caps: {
        monthly_request_cap: 0,
        monthly_spend_cap_usd: 0,
      },
      usage: {
        ai_requests: 0,
        estimated_cost_usd: 0,
        rag_hits: 0,
        cache_hits: 0,
        fallback_count: 0,
      },
      utilization: {
        requests_pct: 0,
        spend_pct: 0,
      },
      degraded_mode_recommended: false,
      unavailable_reason: "AI usage schema not available in this environment",
    });
  }

  const requestCap = toNumber(orgRes.data.ai_monthly_request_cap, 0);
  const spendCap = toNumber(orgRes.data.ai_monthly_spend_cap_usd, 0);

  const requests = toNumber(usageRes.data?.ai_requests, 0);
  const spend = toNumber(usageRes.data?.estimated_cost_usd, 0);
  const ragHits = toNumber(usageRes.data?.rag_hits, 0);
  const cacheHits = toNumber(usageRes.data?.cache_hits, 0);
  const fallbackCount = toNumber(usageRes.data?.fallback_count, 0);

  const requestPct = requestCap > 0 ? Math.min(100, (requests / requestCap) * 100) : 0;
  const spendPct = spendCap > 0 ? Math.min(100, (spend / spendCap) * 100) : 0;

  return NextResponse.json({
    month_start: monthStart,
    tier: orgRes.data.subscription_tier || "free",
    caps: {
      monthly_request_cap: requestCap,
      monthly_spend_cap_usd: Number(spendCap.toFixed(4)),
    },
    usage: {
      ai_requests: requests,
      estimated_cost_usd: Number(spend.toFixed(4)),
      rag_hits: ragHits,
      cache_hits: cacheHits,
      fallback_count: fallbackCount,
    },
    utilization: {
      requests_pct: Number(requestPct.toFixed(1)),
      spend_pct: Number(spendPct.toFixed(1)),
    },
    degraded_mode_recommended: requestPct >= 85 || spendPct >= 85,
  });
}
