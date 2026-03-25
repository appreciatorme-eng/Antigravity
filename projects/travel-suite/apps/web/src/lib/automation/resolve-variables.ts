import "server-only";

/* ------------------------------------------------------------------
 * Variable Resolution for Automation Templates
 *
 * Resolves {{variable}} placeholders in message templates by fetching
 * entity data from Supabase. Each entity type (proposal, payment,
 * trip, booking) has its own data-fetching strategy.
 * ------------------------------------------------------------------ */

import { createAdminClient } from "@/lib/supabase/admin";
import { logError, logEvent } from "@/lib/observability/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ResolvedData {
  readonly client_name: string;
  readonly destination: string;
  readonly trip_date: string;
  readonly start_date: string;
  readonly amount: string;
  readonly duration: string;
  readonly operator_name: string;
  readonly operator_phone: string;
  readonly trip_name: string;
  readonly due_date: string;
  readonly days_remaining: string;
  readonly payment_link: string;
  readonly review_link: string;
  readonly [key: string]: string;
}

type EntityType = "proposal" | "payment" | "trip" | "booking";

// ─── Entity Fetchers ────────────────────────────────────────────────────────

async function fetchEntityData(
  entityType: EntityType,
  entityId: string,
  orgId: string,
): Promise<Record<string, unknown> | null> {
  const admin = createAdminClient();
  const tableName = `${entityType}s`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from(tableName)
    .select("*")
    .eq("id", entityId)
    .eq("organization_id", orgId)
    .single();

  if (error || !data) {
    logError(`[resolve-variables] Failed to fetch ${entityType}`, error);
    return null;
  }

  return data as Record<string, unknown>;
}

async function fetchOperatorProfile(
  orgId: string,
): Promise<{ name: string; phone: string }> {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("organizations")
    .select("name, phone")
    .eq("id", orgId)
    .single();

  if (error || !data) {
    logEvent("warn", "[resolve-variables] Could not fetch operator profile", { orgId });
    return { name: "", phone: "" };
  }

  return {
    name: String(data.name ?? ""),
    phone: String(data.phone ?? ""),
  };
}

async function fetchClientName(
  clientId: string | undefined,
): Promise<string> {
  if (!clientId) return "";

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("profiles")
    .select("full_name, first_name, last_name")
    .eq("id", clientId)
    .single();

  if (!data) return "";

  return String(
    data.full_name ?? `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
  );
}

// ─── Variable Builder ───────────────────────────────────────────────────────

function buildVariables(
  entity: Record<string, unknown>,
  operator: { name: string; phone: string },
  clientName: string,
): ResolvedData {
  const startDate = entity.start_date ?? entity.trip_date ?? entity.date ?? "";
  const startDateStr = String(startDate);

  let daysRemaining = "";
  if (startDateStr) {
    const diff = Math.ceil(
      (new Date(startDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    daysRemaining = diff > 0 ? String(diff) : "0";
  }

  return {
    client_name: clientName || String(entity.client_name ?? entity.customer_name ?? ""),
    destination: String(entity.destination ?? entity.destinations ?? ""),
    trip_date: startDateStr,
    start_date: startDateStr,
    amount: String(entity.amount ?? entity.total_amount ?? entity.price ?? ""),
    duration: String(entity.duration ?? entity.nights ?? ""),
    operator_name: operator.name,
    operator_phone: operator.phone,
    trip_name: String(entity.name ?? entity.title ?? entity.trip_name ?? ""),
    due_date: String(entity.due_date ?? ""),
    days_remaining: daysRemaining,
    payment_link: String(entity.payment_link ?? entity.payment_url ?? ""),
    review_link: String(entity.review_link ?? entity.review_url ?? ""),
  };
}

// ─── Main Export ────────────────────────────────────────────────────────────

/**
 * Resolve template variables by fetching real entity data from Supabase.
 *
 * @param template  - Message template with {{variable}} placeholders
 * @param entityType - Type of entity (proposal, payment, trip, booking)
 * @param entityId  - ID of the entity to resolve data from
 * @param orgId     - Organization ID for scoping queries
 * @returns The template with all variables replaced
 */
export async function resolveVariables(
  template: string,
  entityType: EntityType,
  entityId: string,
  orgId: string,
): Promise<string> {
  const [entity, operator] = await Promise.all([
    fetchEntityData(entityType, entityId, orgId),
    fetchOperatorProfile(orgId),
  ]);

  if (!entity) {
    logEvent("warn", "[resolve-variables] Entity not found, returning raw template", {
      entityType,
      entityId,
      orgId,
    });
    return template;
  }

  const clientId = (entity.client_id ?? entity.customer_id ?? entity.user_id) as
    | string
    | undefined;
  const clientName = await fetchClientName(clientId);

  const variables = buildVariables(entity, operator, clientName);

  // Replace all {{variable}} patterns
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return variables[key] ?? "";
  });
}
