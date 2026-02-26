import { createAdminClient } from "@/lib/supabase/admin";

export type AiUsageEventKind = "cache_hit" | "rag_hit" | "ai_generation" | "fallback";

export interface OrgAiUsageSnapshot {
  organizationId: string | null;
  monthStart: string;
  aiRequests: number;
  ragHits: number;
  cacheHits: number;
  fallbackCount: number;
  estimatedCostUsd: number;
  requestCap: number;
  spendCapUsd: number;
  overCap: boolean;
}

const DEFAULT_REQUEST_CAP = Number(process.env.AI_MAX_GENERATIONS_PER_ORG_MONTH || "400");
const DEFAULT_SPEND_CAP_USD = Number(process.env.AI_MAX_SPEND_PER_ORG_MONTH_USD || "25");

function monthStartIso(date = new Date()): string {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return start.toISOString().slice(0, 10);
}

export async function getOrgAiUsageSnapshot(userId: string): Promise<OrgAiUsageSnapshot> {
  const admin = createAdminClient();
  const monthStart = monthStartIso();

  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  const organizationId = profile?.organization_id || null;
  if (!organizationId) {
    return {
      organizationId,
      monthStart,
      aiRequests: 0,
      ragHits: 0,
      cacheHits: 0,
      fallbackCount: 0,
      estimatedCostUsd: 0,
      requestCap: DEFAULT_REQUEST_CAP,
      spendCapUsd: DEFAULT_SPEND_CAP_USD,
      overCap: false,
    };
  }

  let requestCap = DEFAULT_REQUEST_CAP;
  let spendCapUsd = DEFAULT_SPEND_CAP_USD;

  try {
    const { data: org } = await admin
      .from("organizations")
      .select("ai_monthly_request_cap, ai_monthly_spend_cap_usd")
      .eq("id", organizationId)
      .maybeSingle();

    const requestCapValue = Number((org as { ai_monthly_request_cap?: number | null })?.ai_monthly_request_cap);
    if (Number.isFinite(requestCapValue) && requestCapValue > 0) {
      requestCap = requestCapValue;
    }

    const spendCapValue = Number((org as { ai_monthly_spend_cap_usd?: number | null })?.ai_monthly_spend_cap_usd);
    if (Number.isFinite(spendCapValue) && spendCapValue > 0) {
      spendCapUsd = spendCapValue;
    }
  } catch {
    // Organizations table may not have cap columns yet in some environments.
  }

  try {
    const { data: usage } = await admin
      .from("organization_ai_usage")
      .select("ai_requests, rag_hits, cache_hits, fallback_count, estimated_cost_usd")
      .eq("organization_id", organizationId)
      .eq("month_start", monthStart)
      .maybeSingle();

    const aiRequests = Number((usage as { ai_requests?: number | null })?.ai_requests || 0);
    const ragHits = Number((usage as { rag_hits?: number | null })?.rag_hits || 0);
    const cacheHits = Number((usage as { cache_hits?: number | null })?.cache_hits || 0);
    const fallbackCount = Number((usage as { fallback_count?: number | null })?.fallback_count || 0);
    const estimatedCostUsd = Number((usage as { estimated_cost_usd?: number | string | null })?.estimated_cost_usd || 0);

    return {
      organizationId,
      monthStart,
      aiRequests,
      ragHits,
      cacheHits,
      fallbackCount,
      estimatedCostUsd,
      requestCap,
      spendCapUsd,
      overCap: aiRequests >= requestCap || estimatedCostUsd >= spendCapUsd,
    };
  } catch {
    // Usage table may not exist in all environments yet.
    return {
      organizationId,
      monthStart,
      aiRequests: 0,
      ragHits: 0,
      cacheHits: 0,
      fallbackCount: 0,
      estimatedCostUsd: 0,
      requestCap,
      spendCapUsd,
      overCap: false,
    };
  }
}

export async function trackOrgAiUsage(
  userId: string,
  kind: AiUsageEventKind,
  estimatedCostUsd = 0
): Promise<void> {
  const snapshot = await getOrgAiUsageSnapshot(userId);
  if (!snapshot.organizationId) return;

  const admin = createAdminClient();

  const aiDelta = kind === "ai_generation" ? 1 : 0;
  const ragDelta = kind === "rag_hit" ? 1 : 0;
  const cacheDelta = kind === "cache_hit" ? 1 : 0;
  const fallbackDelta = kind === "fallback" ? 1 : 0;

  try {
    await admin
      .from("organization_ai_usage")
      .upsert(
        {
          organization_id: snapshot.organizationId,
          month_start: snapshot.monthStart,
          ai_requests: snapshot.aiRequests + aiDelta,
          rag_hits: snapshot.ragHits + ragDelta,
          cache_hits: snapshot.cacheHits + cacheDelta,
          fallback_count: snapshot.fallbackCount + fallbackDelta,
          estimated_cost_usd: Number((snapshot.estimatedCostUsd + estimatedCostUsd).toFixed(4)),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,month_start" }
      );
  } catch {
    // Non-blocking telemetry path.
  }
}
