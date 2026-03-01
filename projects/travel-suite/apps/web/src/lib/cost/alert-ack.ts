import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

type LegacyAckLogRow = {
  recipient_id: string | null;
  body: string | null;
  created_at: string | null;
  sent_at: string | null;
};

export type CostAlertAckMap = Map<
  string,
  {
    acknowledged_at: string;
    acknowledged_by: string | null;
  }
>;

type AcknowledgeCostAlertParams = {
  adminClient: AdminClient;
  alertId: string;
  organizationId: string;
  actorId: string;
  actorRole: "admin" | "super_admin";
};

type LoadCostAlertAckMapParams = {
  adminClient: AdminClient;
  activeAlertIds: string[];
  scopedOrganizationId: string | null;
  scopedRecipientIds: string[] | null;
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

function normalizeOrganizationScope(value: string | null): string | null {
  const candidate = (value || "").trim();
  return candidate.length > 0 ? candidate : null;
}

function sanitizeLogValue(value: string): string {
  return value.replace(/\|/g, "/").replace(/\s+/g, " ").trim();
}

function isRelationMissingError(error: {
  code?: string | null;
  message?: string | null;
}): boolean {
  const code = (error.code || "").trim();
  if (code === "42P01" || code === "PGRST205") return true;
  return (error.message || "").toLowerCase().includes("does not exist");
}

async function insertLegacyAckLog(params: {
  adminClient: AdminClient;
  alertId: string;
  organizationId: string;
  actorId: string;
  actorRole: "admin" | "super_admin";
  acknowledgedAt: string;
}): Promise<void> {
  const bodyValue = [
    `alert_id=${sanitizeLogValue(params.alertId)}`,
    `organization_id=${sanitizeLogValue(params.organizationId)}`,
    `actor_id=${sanitizeLogValue(params.actorId)}`,
    `actor_role=${sanitizeLogValue(params.actorRole)}`,
    `acknowledged_at=${sanitizeLogValue(params.acknowledgedAt)}`,
  ].join("|");

  await params.adminClient.from("notification_logs").insert({
    recipient_id: params.actorId,
    recipient_type: "admin",
    notification_type: "cost_alert_ack",
    title: "Cost alert acknowledged",
    body: bodyValue,
    status: "sent",
    sent_at: params.acknowledgedAt,
  });
}

async function loadLegacyAckMap(params: {
  adminClient: AdminClient;
  activeAlertIds: Set<string>;
  scopedOrganizationId: string | null;
  scopedRecipientIds: string[] | null;
}): Promise<CostAlertAckMap> {
  const ackMap: CostAlertAckMap = new Map();
  if (params.activeAlertIds.size === 0) return ackMap;
  if (params.scopedRecipientIds && params.scopedRecipientIds.length === 0)
    return ackMap;

  let query = params.adminClient
    .from("notification_logs")
    .select("recipient_id,body,created_at,sent_at")
    .eq("notification_type", "cost_alert_ack")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (params.scopedRecipientIds) {
    query = query.in("recipient_id", params.scopedRecipientIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data || []) as LegacyAckLogRow[]) {
    const bodyKv = parseKvBody(row.body);
    const alertId = (bodyKv.get("alert_id") || "").trim();
    if (
      !alertId ||
      ackMap.has(alertId) ||
      !params.activeAlertIds.has(alertId)
    ) {
      continue;
    }

    const ackOrganizationId = normalizeOrganizationScope(
      bodyKv.get("organization_id") || null,
    );
    if (
      params.scopedOrganizationId &&
      ackOrganizationId &&
      ackOrganizationId !== params.scopedOrganizationId
    ) {
      continue;
    }

    ackMap.set(alertId, {
      acknowledged_at:
        row.created_at || row.sent_at || new Date().toISOString(),
      acknowledged_by: row.recipient_id || null,
    });
  }

  return ackMap;
}

export async function acknowledgeCostAlert(
  params: AcknowledgeCostAlertParams,
): Promise<{ acknowledgedAt: string; acknowledgedBy: string }> {
  const acknowledgedAt = new Date().toISOString();
  const payload = {
    alert_id: sanitizeLogValue(params.alertId),
    organization_id: params.organizationId,
    acknowledged_by: params.actorId,
    acknowledged_at: acknowledgedAt,
    updated_at: acknowledgedAt,
  };

  const upsertResult = await params.adminClient
    .from("cost_alert_acknowledgments")
    .upsert(payload, { onConflict: "alert_id,organization_id" })
    .select("acknowledged_at,acknowledged_by")
    .single();

  if (upsertResult.error && !isRelationMissingError(upsertResult.error)) {
    throw new Error(upsertResult.error.message);
  }

  if (!upsertResult.error) {
    const { error: historyError } = await params.adminClient
      .from("cost_alert_ack_events")
      .insert({
        alert_id: sanitizeLogValue(params.alertId),
        organization_id: params.organizationId,
        actor_id: params.actorId,
        actor_role: params.actorRole,
        event_type: "acknowledged",
        metadata: {},
      });

    if (historyError && !isRelationMissingError(historyError)) {
      throw new Error(historyError.message);
    }
  }

  // Keep legacy log stream for backward compatibility and existing analytics feeds.
  await insertLegacyAckLog({
    adminClient: params.adminClient,
    alertId: params.alertId,
    organizationId: params.organizationId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    acknowledgedAt,
  });

  return {
    acknowledgedAt: upsertResult.data?.acknowledged_at || acknowledgedAt,
    acknowledgedBy: upsertResult.data?.acknowledged_by || params.actorId,
  };
}

export async function loadCostAlertAckMap(
  params: LoadCostAlertAckMapParams,
): Promise<CostAlertAckMap> {
  const activeAlertIds = Array.from(
    new Set(params.activeAlertIds.map((id) => id.trim()).filter(Boolean)),
  );
  const activeSet = new Set(activeAlertIds);
  if (activeSet.size === 0) return new Map();

  const nextMap: CostAlertAckMap = new Map();
  if (params.scopedRecipientIds && params.scopedRecipientIds.length === 0) {
    return nextMap;
  }

  let query = params.adminClient
    .from("cost_alert_acknowledgments")
    .select("alert_id,acknowledged_at,acknowledged_by,organization_id")
    .in("alert_id", activeAlertIds)
    .order("acknowledged_at", { ascending: false })
    .limit(5000);

  if (params.scopedOrganizationId) {
    query = query.eq("organization_id", params.scopedOrganizationId);
  }

  const { data, error } = await query;
  if (error) {
    if (!isRelationMissingError(error)) {
      throw new Error(error.message);
    }
    return loadLegacyAckMap({
      adminClient: params.adminClient,
      activeAlertIds: activeSet,
      scopedOrganizationId: params.scopedOrganizationId,
      scopedRecipientIds: params.scopedRecipientIds,
    });
  }

  for (const row of data || []) {
    const alertId = (row.alert_id || "").trim();
    if (!alertId || nextMap.has(alertId) || !activeSet.has(alertId)) continue;
    nextMap.set(alertId, {
      acknowledged_at: row.acknowledged_at,
      acknowledged_by: row.acknowledged_by || null,
    });
  }

  return nextMap;
}
