import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getCachedJson, setCachedJson } from "@/lib/cache/upstash";
import { loadCostAlertAckMap } from "@/lib/cost/alert-ack";
import {
  buildCostOverviewCacheKey,
  buildCostOverviewStaleCacheKey,
  COST_OVERVIEW_CACHE_TTL_SECONDS,
  COST_OVERVIEW_STALE_CACHE_TTL_SECONDS,
} from "@/lib/cost/overview-cache";
import { getEmergencyDailySpendCapUsd, type CostCategory } from "@/lib/cost/spend-guardrails";
import {
  CATEGORIES,
  daysAgoISO,
  getErrorMessage,
  handleEmergencyCapPost,
  normalizeOrganizationScope,
  toCacheMeta,
  type CostOverviewCacheEnvelope,
  type CostOverviewPayload,
  type OrganizationAggregate,
} from "./shared";
import {
  loadCostLogs,
  loadRecentCostLogs,
  loadAuthFailureLogs,
  loadScopedRecipientIds,
  loadProfileOrgMap,
  loadOrganizationMetadata,
  loadWeeklyRevenue,
} from "./loaders";
import {
  aggregateCostLogs,
  computeCategoryWindowStats,
  aggregateAuthFailures,
  applyOrganizationMetadata,
  buildWeeklyMarginReport,
  aggregateWeeklyRevenue,
  deriveWeeklyTotals,
} from "./aggregators";
import {
  buildCategoryAlerts,
  buildAuthFailureAlerts,
  finalizeAlerts,
} from "./alert-builders";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const days = Math.min(
    90,
    Math.max(1, Number(request.nextUrl.searchParams.get("days") || 7)),
  );
  const sinceIso = daysAgoISO(days);

  const requestedOrganizationId = normalizeOrganizationScope(
    request.nextUrl.searchParams.get("organization_id"),
  );
  const scopedOrganizationId = admin.isSuperAdmin
    ? requestedOrganizationId
    : admin.organizationId;

  if (!admin.isSuperAdmin && !scopedOrganizationId) {
    return NextResponse.json(
      { error: "Admin organization not configured" },
      { status: 400 },
    );
  }

  const cacheKey = buildCostOverviewCacheKey({
    role: admin.role,
    organizationId: scopedOrganizationId,
    days,
  });
  const staleCacheKey = buildCostOverviewStaleCacheKey(cacheKey);

  const cached = await getCachedJson<CostOverviewCacheEnvelope>(cacheKey);
  if (cached?.payload && cached.cached_at) {
    return NextResponse.json({
      ...cached.payload,
      cache: toCacheMeta("hit", cached.cached_at, COST_OVERVIEW_CACHE_TTL_SECONDS),
    });
  }

  try {
    if (
      process.env.NODE_ENV === "test" &&
      request.headers.get("x-test-cost-overview-force-failure") === "1"
    ) {
      throw new Error("forced_cost_overview_failure");
    }

    const scopedRecipientIds = scopedOrganizationId
      ? await loadScopedRecipientIds(admin.adminClient, scopedOrganizationId)
      : null;

    const ctx = {
      adminClient: admin.adminClient,
      scopedOrganizationId,
      scopedRecipientIds,
    };

    // Fan-out: load all data in parallel
    const [logs, recentCostLogs, authFailureLogs] = await Promise.all([
      loadCostLogs(ctx, sinceIso),
      loadRecentCostLogs(ctx),
      loadAuthFailureLogs(ctx),
    ]);

    // Collect unique recipient IDs for profile lookup
    const recipientIds = Array.from(
      new Set(
        [...logs, ...recentCostLogs, ...authFailureLogs]
          .map((log) => log.recipient_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const profileMap = await loadProfileOrgMap(ctx, recipientIds);

    // Build organization aggregates
    const organizations = new Map<string, OrganizationAggregate>();
    aggregateCostLogs(logs, profileMap, scopedOrganizationId, organizations);

    const since24hIso = daysAgoISO(1);
    const since48hIso = daysAgoISO(2);
    const categoryWindowStats = computeCategoryWindowStats(
      recentCostLogs,
      profileMap,
      scopedOrganizationId,
      organizations,
      since24hIso,
      since48hIso,
    );

    const authFailuresByOrg = aggregateAuthFailures(
      authFailureLogs,
      profileMap,
      scopedOrganizationId,
      organizations,
    );

    // Build alerts
    const alerts = [
      ...buildCategoryAlerts(categoryWindowStats, organizations),
      ...buildAuthFailureAlerts(authFailuresByOrg, organizations),
    ];

    const alertAckMap = await loadCostAlertAckMap({
      adminClient: admin.adminClient,
      activeAlertIds: alerts.map((a) => a.id),
      scopedOrganizationId,
      scopedRecipientIds,
    });

    // Load revenue and weekly totals
    const weeklyRevenueRows = await loadWeeklyRevenue(ctx);
    const weeklyRevenueByOrg = aggregateWeeklyRevenue(weeklyRevenueRows, organizations);
    const { weeklySpendByOrg, weeklyDenialsByOrg } = deriveWeeklyTotals(
      categoryWindowStats,
      organizations,
    );

    // Enrich organizations with metadata
    const allOrganizationIds = Array.from(
      new Set([
        ...organizations.keys(),
        ...weeklyRevenueByOrg.keys(),
        ...weeklySpendByOrg.keys(),
        ...authFailuresByOrg.keys(),
      ]),
    );

    const { orgRows, aiUsageRows } = await loadOrganizationMetadata(
      admin.adminClient,
      allOrganizationIds,
    );
    applyOrganizationMetadata(organizations, orgRows, aiUsageRows);

    // Build margin report
    const weeklyMarginReport = buildWeeklyMarginReport(
      allOrganizationIds,
      organizations,
      weeklySpendByOrg,
      weeklyRevenueByOrg,
      weeklyDenialsByOrg,
    );

    // Emergency caps
    const emergencyCapsUsd = Object.fromEntries(
      await Promise.all(
        CATEGORIES.map(async (category) => [
          category,
          await getEmergencyDailySpendCapUsd(category),
        ]),
      ),
    ) as Record<CostCategory, number>;

    const payload: CostOverviewPayload = {
      period: { days, since: sinceIso },
      scope: {
        mode: scopedOrganizationId ? "organization" : "global",
        organization_id: scopedOrganizationId,
        actor_role: admin.role,
      },
      emergency_caps_usd: emergencyCapsUsd,
      alerts: finalizeAlerts(alerts, alertAckMap, organizations),
      weekly_margin_report: weeklyMarginReport,
      organizations: Array.from(organizations.values()).sort(
        (a, b) => b.total_estimated_cost_usd - a.total_estimated_cost_usd,
      ),
    };

    // Write-through cache
    const cachedAt = new Date().toISOString();
    const cacheEnvelope: CostOverviewCacheEnvelope = { cached_at: cachedAt, payload };
    await Promise.all([
      setCachedJson(cacheKey, cacheEnvelope, COST_OVERVIEW_CACHE_TTL_SECONDS),
      setCachedJson(staleCacheKey, cacheEnvelope, COST_OVERVIEW_STALE_CACHE_TTL_SECONDS),
    ]);

    return NextResponse.json({
      ...payload,
      cache: toCacheMeta("miss", cachedAt, COST_OVERVIEW_CACHE_TTL_SECONDS),
    });
  } catch (error) {
    const staleCached =
      await getCachedJson<CostOverviewCacheEnvelope>(staleCacheKey);
    if (staleCached?.payload && staleCached.cached_at) {
      return NextResponse.json({
        ...staleCached.payload,
        warning:
          "Serving stale cached cost overview due to temporary provider failure.",
        cache: toCacheMeta(
          "stale_fallback",
          staleCached.cached_at,
          COST_OVERVIEW_STALE_CACHE_TTL_SECONDS,
        ),
      });
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  const body = await request.json().catch(() => null);
  return handleEmergencyCapPost(admin, body);
}
