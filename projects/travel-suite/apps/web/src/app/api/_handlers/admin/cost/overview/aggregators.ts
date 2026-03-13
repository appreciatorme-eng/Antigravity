import {
  parseCostMeteringBody,
  parseKvBody,
  normalizeOrganizationScope,
  toInr,
  type OrganizationAggregate,
  type WeeklyMarginReportRow,
} from "./shared";
import type {
  AuthFailureLog,
  CategoryWindowStats,
  NotificationLog,
  RecentCostLog,
  WeeklyRevenueRow,
} from "./types";

// ---------------------------------------------------------------------------
// Organization aggregate registry
// ---------------------------------------------------------------------------

function createEmptyCategoryAggregate() {
  return {
    allowed_requests: 0,
    denied_requests: 0,
    estimated_cost_usd: 0,
    last_daily_spend_usd: 0,
    last_plan_cap_usd: 0,
    last_emergency_cap_usd: 0,
  };
}

function createEmptyOrganizationAggregate(
  organizationId: string,
): OrganizationAggregate {
  return {
    organization_id: organizationId,
    organization_name: organizationId,
    tier: "unknown",
    categories: {
      amadeus: createEmptyCategoryAggregate(),
      image_search: createEmptyCategoryAggregate(),
      ai_image: createEmptyCategoryAggregate(),
      ai_poster: createEmptyCategoryAggregate(),
      ai_text: createEmptyCategoryAggregate(),
    },
    total_estimated_cost_usd: 0,
    ai_monthly_requests: 0,
    ai_monthly_estimated_cost_usd: 0,
  };
}

export function ensureOrganization(
  organizations: Map<string, OrganizationAggregate>,
  organizationId: string,
): OrganizationAggregate {
  const existing = organizations.get(organizationId);
  if (existing) return existing;

  const next = createEmptyOrganizationAggregate(organizationId);
  organizations.set(organizationId, next);
  return next;
}

// ---------------------------------------------------------------------------
// Aggregate cost logs into organization-level data
// ---------------------------------------------------------------------------

export function aggregateCostLogs(
  logs: ReadonlyArray<NotificationLog>,
  profileMap: ReadonlyMap<string, string>,
  scopedOrganizationId: string | null,
  organizations: Map<string, OrganizationAggregate>,
): void {
  for (const log of logs) {
    const parsed = parseCostMeteringBody(log.body);
    if (!parsed.category) continue;

    const inferredOrgId =
      parsed.organizationId ||
      (log.recipient_id ? profileMap.get(log.recipient_id) : null);
    if (!inferredOrgId) continue;

    if (scopedOrganizationId && inferredOrgId !== scopedOrganizationId) {
      continue;
    }

    const aggregate = ensureOrganization(organizations, inferredOrgId);
    const category = aggregate.categories[parsed.category];

    if (log.status === "sent") {
      category.allowed_requests += 1;
    } else {
      category.denied_requests += 1;
    }

    if (
      log.status === "sent" &&
      typeof parsed.estimatedCostUsd === "number"
    ) {
      category.estimated_cost_usd += parsed.estimatedCostUsd;
      aggregate.total_estimated_cost_usd += parsed.estimatedCostUsd;
    }

    if (typeof parsed.dailySpendUsd === "number") {
      category.last_daily_spend_usd = Math.max(
        category.last_daily_spend_usd,
        parsed.dailySpendUsd,
      );
    }

    if (typeof parsed.planCapUsd === "number") {
      category.last_plan_cap_usd = parsed.planCapUsd;
    }

    if (typeof parsed.emergencyCapUsd === "number") {
      category.last_emergency_cap_usd = parsed.emergencyCapUsd;
    }
  }
}

// ---------------------------------------------------------------------------
// Compute per-category window stats from recent cost logs
// ---------------------------------------------------------------------------

export function computeCategoryWindowStats(
  recentCostLogs: ReadonlyArray<RecentCostLog>,
  profileMap: ReadonlyMap<string, string>,
  scopedOrganizationId: string | null,
  organizations: Map<string, OrganizationAggregate>,
  since24hIso: string,
  since48hIso: string,
): Map<string, CategoryWindowStats> {
  const stats = new Map<string, CategoryWindowStats>();
  const since24hMs = new Date(since24hIso).getTime();
  const since48hMs = new Date(since48hIso).getTime();

  for (const log of recentCostLogs) {
    const parsed = parseCostMeteringBody(log.body);
    if (!parsed.category) continue;

    const inferredOrgId =
      parsed.organizationId ||
      (log.recipient_id ? profileMap.get(log.recipient_id) : null);
    if (!inferredOrgId) continue;

    if (scopedOrganizationId && inferredOrgId !== scopedOrganizationId) {
      continue;
    }

    ensureOrganization(organizations, inferredOrgId);

    const createdAtMs = log.created_at
      ? new Date(log.created_at).getTime()
      : Number.NaN;
    if (!Number.isFinite(createdAtMs)) continue;

    const key = `${inferredOrgId}:${parsed.category}`;
    const current = stats.get(key) || {
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

    if (createdAtMs >= since24hMs) {
      current.total24hRequests += 1;
      if (isAllowed && typeof parsed.estimatedCostUsd === "number") {
        current.last24hSpendUsd += parsed.estimatedCostUsd;
      } else if (!isAllowed) {
        current.denied24hRequests += 1;
      }
    } else if (createdAtMs >= since48hMs) {
      if (isAllowed && typeof parsed.estimatedCostUsd === "number") {
        current.previous24hSpendUsd += parsed.estimatedCostUsd;
      }
    }

    stats.set(key, current);
  }

  return stats;
}

// ---------------------------------------------------------------------------
// Aggregate auth failure logs by organization
// ---------------------------------------------------------------------------

export function aggregateAuthFailures(
  authFailureLogs: ReadonlyArray<AuthFailureLog>,
  profileMap: ReadonlyMap<string, string>,
  scopedOrganizationId: string | null,
  organizations: Map<string, OrganizationAggregate>,
): Map<string, number> {
  const authFailuresByOrg = new Map<string, number>();

  for (const log of authFailureLogs) {
    const bodyKv = parseKvBody(log.body);
    const bodyOrgId = normalizeOrganizationScope(
      bodyKv.get("organization_id") || null,
    );
    const inferredOrgId =
      (bodyOrgId && bodyOrgId !== "unknown" ? bodyOrgId : null) ||
      (log.recipient_id ? profileMap.get(log.recipient_id) : null);

    if (!inferredOrgId) continue;
    if (scopedOrganizationId && inferredOrgId !== scopedOrganizationId) {
      continue;
    }

    ensureOrganization(organizations, inferredOrgId);
    authFailuresByOrg.set(
      inferredOrgId,
      (authFailuresByOrg.get(inferredOrgId) || 0) + 1,
    );
  }

  return authFailuresByOrg;
}

// ---------------------------------------------------------------------------
// Apply organization metadata (names, tiers, AI usage) to aggregates
// ---------------------------------------------------------------------------

export function applyOrganizationMetadata(
  organizations: Map<string, OrganizationAggregate>,
  orgRows: ReadonlyArray<{
    id: string;
    name: string | null;
    subscription_tier: string | null;
  }>,
  aiUsageRows: ReadonlyArray<{
    organization_id: string;
    ai_requests: number | string | null;
    estimated_cost_usd: number | string | null;
  }>,
): void {
  for (const row of orgRows) {
    const aggregate = organizations.get(row.id);
    if (!aggregate) continue;
    aggregate.organization_name = row.name || row.id;
    aggregate.tier = row.subscription_tier || "free";
  }

  for (const row of aiUsageRows) {
    const aggregate = organizations.get(row.organization_id);
    if (!aggregate) continue;
    const requests = Number(row.ai_requests || 0);
    const spend = Number(row.estimated_cost_usd || 0);
    aggregate.ai_monthly_requests = Number.isFinite(requests) ? requests : 0;
    aggregate.ai_monthly_estimated_cost_usd = Number.isFinite(spend)
      ? spend
      : 0;
  }
}

// ---------------------------------------------------------------------------
// Weekly margin report builder
// ---------------------------------------------------------------------------

export function buildWeeklyMarginReport(
  allOrganizationIds: ReadonlyArray<string>,
  organizations: Map<string, OrganizationAggregate>,
  weeklySpendByOrg: ReadonlyMap<string, number>,
  weeklyRevenueByOrg: ReadonlyMap<string, number>,
  weeklyDenialsByOrg: ReadonlyMap<
    string,
    { allowed: number; denied: number }
  >,
): WeeklyMarginReportRow[] {
  return allOrganizationIds
    .map((organizationId) => {
      const aggregate = ensureOrganization(organizations, organizationId);
      const revenueInr = Number(
        (weeklyRevenueByOrg.get(organizationId) || 0).toFixed(2),
      );
      const variableCostUsd = Number(
        (weeklySpendByOrg.get(organizationId) || 0).toFixed(4),
      );
      const variableCostInr = toInr(variableCostUsd);
      const denialStats = weeklyDenialsByOrg.get(organizationId) || {
        allowed: 0,
        denied: 0,
      };
      const totalAttempts = denialStats.allowed + denialStats.denied;
      const capDenialRatePct =
        totalAttempts > 0
          ? Number(((denialStats.denied / totalAttempts) * 100).toFixed(2))
          : 0;
      const grossMarginPct =
        revenueInr > 0
          ? Number(
              (((revenueInr - variableCostInr) / revenueInr) * 100).toFixed(2),
            )
          : variableCostInr > 0
            ? 0
            : 100;

      let recommendation = "Healthy weekly margin posture.";
      if (revenueInr === 0 && variableCostInr > 0) {
        recommendation =
          "COGS detected without matching revenue. Tighten feature gating or require prepaid packs.";
      } else if (grossMarginPct < 45) {
        recommendation =
          "Margin is below target. Enforce pricing floor and push high-cost workflows to prepaid packs.";
      } else if (capDenialRatePct >= 15) {
        recommendation =
          "Cap denials are high. Tune default caps and sell overage packs before throttling impacts conversion.";
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
    .sort(
      (left, right) =>
        right.revenue_inr - left.revenue_inr ||
        left.gross_margin_pct - right.gross_margin_pct,
    );
}

// ---------------------------------------------------------------------------
// Aggregate weekly revenue from invoice rows
// ---------------------------------------------------------------------------

export function aggregateWeeklyRevenue(
  weeklyRevenueRows: ReadonlyArray<WeeklyRevenueRow>,
  organizations: Map<string, OrganizationAggregate>,
): Map<string, number> {
  const weeklyRevenueByOrg = new Map<string, number>();

  for (const row of weeklyRevenueRows) {
    if (!row.organization_id) continue;
    ensureOrganization(organizations, row.organization_id);
    const amount = Number(row.total_amount || 0);
    if (!Number.isFinite(amount)) continue;
    weeklyRevenueByOrg.set(
      row.organization_id,
      (weeklyRevenueByOrg.get(row.organization_id) || 0) + amount,
    );
  }

  return weeklyRevenueByOrg;
}

// ---------------------------------------------------------------------------
// Derive weekly spend and denial totals from category window stats
// ---------------------------------------------------------------------------

export function deriveWeeklyTotals(
  categoryWindowStats: ReadonlyMap<string, CategoryWindowStats>,
  organizations: Map<string, OrganizationAggregate>,
): {
  weeklySpendByOrg: Map<string, number>;
  weeklyDenialsByOrg: Map<string, { allowed: number; denied: number }>;
} {
  const weeklySpendByOrg = new Map<string, number>();
  const weeklyDenialsByOrg = new Map<
    string,
    { allowed: number; denied: number }
  >();

  for (const item of categoryWindowStats.values()) {
    ensureOrganization(organizations, item.organizationId);

    weeklySpendByOrg.set(
      item.organizationId,
      Number(
        (weeklySpendByOrg.get(item.organizationId) || 0) + item.weeklySpendUsd,
      ),
    );

    const denialEntry = weeklyDenialsByOrg.get(item.organizationId) || {
      allowed: 0,
      denied: 0,
    };
    denialEntry.allowed += item.weeklyAllowedRequests;
    denialEntry.denied += item.weeklyDeniedRequests;
    weeklyDenialsByOrg.set(item.organizationId, denialEntry);
  }

  return { weeklySpendByOrg, weeklyDenialsByOrg };
}
