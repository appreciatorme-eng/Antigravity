import type { OrganizationAggregate, OperationalAlert } from "./shared";
import { ALERT_RUNBOOKS, costAlertThresholds } from "./shared";
import { ensureOrganization } from "./aggregators";
import type { CategoryWindowStats } from "./types";

/**
 * Evaluate cost-spike and cap-hit alerts from category window stats.
 */
export function buildCategoryAlerts(
  categoryWindowStats: ReadonlyMap<string, CategoryWindowStats>,
  organizations: Map<string, OrganizationAggregate>,
): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  for (const item of categoryWindowStats.values()) {
    const aggregate = ensureOrganization(organizations, item.organizationId);
    const organizationName = aggregate.organization_name;

    // Cost-spike detection
    if (
      item.previous24hSpendUsd >= costAlertThresholds.MIN_COST_SPIKE_USD &&
      item.last24hSpendUsd >=
        item.previous24hSpendUsd * costAlertThresholds.COST_SPIKE_MULTIPLIER
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
        runbook: ALERT_RUNBOOKS.cost_spike,
        acknowledged: false,
        acknowledged_at: null,
        acknowledged_by: null,
        detected_at: new Date().toISOString(),
      });
    }

    // Cap-hit detection
    const denialRate24h =
      item.total24hRequests > 0
        ? item.denied24hRequests / item.total24hRequests
        : 0;
    if (
      item.total24hRequests >= 20 &&
      denialRate24h >= costAlertThresholds.CAP_HIT_ALERT_THRESHOLD
    ) {
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
        runbook: ALERT_RUNBOOKS.cap_hit_rate,
        acknowledged: false,
        acknowledged_at: null,
        acknowledged_by: null,
        detected_at: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

/**
 * Evaluate auth-failure alerts from aggregated failure counts.
 */
export function buildAuthFailureAlerts(
  authFailuresByOrg: ReadonlyMap<string, number>,
  organizations: Map<string, OrganizationAggregate>,
): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  for (const [organizationId, failures] of authFailuresByOrg.entries()) {
    if (failures < costAlertThresholds.AUTH_FAILURE_ALERT_THRESHOLD) continue;
    const aggregate = ensureOrganization(organizations, organizationId);

    alerts.push({
      id: `auth-failures-${organizationId}`,
      severity:
        failures >= costAlertThresholds.AUTH_FAILURE_ALERT_THRESHOLD * 2
          ? "high"
          : "medium",
      category: "auth_failures",
      organization_id: organizationId,
      organization_name: aggregate.organization_name,
      title: "Repeated admin authorization failures",
      description:
        "Investigate role drift, expired sessions, or suspicious admin access attempts.",
      metric_value: `${failures} denied admin attempts in last 24h`,
      owner: "Security",
      runbook: ALERT_RUNBOOKS.auth_failures,
      acknowledged: false,
      acknowledged_at: null,
      acknowledged_by: null,
      detected_at: new Date().toISOString(),
    });
  }

  return alerts;
}

/**
 * Apply acknowledgement metadata and sort alerts by severity.
 */
export function finalizeAlerts(
  alerts: ReadonlyArray<OperationalAlert>,
  alertAckMap: ReadonlyMap<
    string,
    { acknowledged_at: string | null; acknowledged_by: string | null }
  >,
  organizations: ReadonlyMap<string, OrganizationAggregate>,
): OperationalAlert[] {
  return alerts
    .map((alert) => {
      const ack = alertAckMap.get(alert.id);
      return {
        ...alert,
        organization_name:
          organizations.get(alert.organization_id)?.organization_name ||
          alert.organization_name,
        acknowledged: !!ack,
        acknowledged_at: ack?.acknowledged_at || null,
        acknowledged_by: ack?.acknowledged_by || null,
      };
    })
    .sort((left, right) => {
      if (left.severity === right.severity)
        return left.organization_name.localeCompare(right.organization_name);
      return left.severity === "high" ? -1 : 1;
    });
}
