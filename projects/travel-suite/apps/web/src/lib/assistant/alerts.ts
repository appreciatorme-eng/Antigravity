import "server-only";

/* ------------------------------------------------------------------
 * Proactive Alerts -- periodic detection of issues needing attention.
 *
 * Scans each organisation for:
 *   1. Invoices overdue by more than 7 days (filterable by minimum amount)
 *   2. Trips starting within a configurable lead time with no assigned driver
 *   3. Clients not contacted within a configurable number of days
 *
 * Alert thresholds, quiet hours, and per-cycle caps are loaded from
 * user preferences via alert-preferences.ts. Sensible defaults apply
 * when no preferences are configured.
 *
 * Detected alerts are queued as WhatsApp notifications with idempotency
 * keys to prevent duplicate sends.
 *
 * All queries use the admin client to bypass RLS.
 * Errors are caught at every boundary and never thrown to callers.
 * ------------------------------------------------------------------ */

import type { ActionContext } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAlertThresholds, isQuietHours } from "./alert-preferences";
import type { AlertThresholds } from "./alert-preferences";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AlertTrigger {
  readonly type: "invoice_overdue" | "trip_no_driver" | "client_dormant";
  readonly message: string;
  readonly entityType: string;
  readonly entityId: string;
}

interface EligibleAlertOrg {
  readonly organizationId: string;
  readonly userId: string;
  readonly phone: string;
}

interface AlertQueueResult {
  readonly queued: number;
  readonly skipped: number;
  readonly errors: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Today as YYYY-MM-DD. */
const todayISO = (): string => new Date().toISOString().slice(0, 10);

/** ISO date string for N days from now. */
const nDaysFromNowISO = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** ISO date string for N days ago. */
const nDaysAgoISO = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

// ---------------------------------------------------------------------------
// Alert detection
// ---------------------------------------------------------------------------

/**
 * Detect alert conditions for a single organisation.
 *
 * Returns an array of AlertTrigger objects -- one per detected issue.
 * Individual query failures are silently skipped so partial results
 * can still be returned.
 */
export async function detectAlerts(
  ctx: ActionContext,
  thresholds?: AlertThresholds | null,
): Promise<readonly AlertTrigger[]> {
  const alerts: AlertTrigger[] = [];

  // 1. Invoices overdue > 7 days
  try {
    const sevenDaysAgo = nDaysAgoISO(7).slice(0, 10);

    const { data: overdueInvoices, error: invError } = await ctx.supabase
      .from("invoices")
      .select(
        "id, invoice_number, client_id, balance_amount, profiles!invoices_client_id_fkey(full_name)",
      )
      .eq("organization_id", ctx.organizationId)
      .in("status", ["overdue", "issued"])
      .lt("due_date", sevenDaysAgo)
      .limit(10);

    if (!invError && overdueInvoices) {
      const minAmount = thresholds?.minOverdueAmountInr ?? 0;

      for (const inv of overdueInvoices) {
        const balanceAmount =
          typeof inv.balance_amount === "number" ? inv.balance_amount : 0;

        if (balanceAmount < minAmount) continue;

        const profiles = inv.profiles as
          | { full_name: string | null }
          | null;
        const clientName = profiles?.full_name ?? "Unknown client";

        alerts.push({
          type: "invoice_overdue",
          message: `Invoice #${inv.invoice_number} for ${clientName} is overdue by more than 7 days.`,
          entityType: "invoice",
          entityId: inv.id,
        });
      }
    }
  } catch {
    // Skip invoice alerts on failure.
  }

  // 2. Trips starting tomorrow with no driver
  try {
    const leadDays = thresholds?.tripLeadTimeDays ?? 1;
    const leadDate = nDaysFromNowISO(leadDays);

    const { data: driverlessTrips, error: tripError } = await ctx.supabase
      .from("trips")
      .select(
        "id, client_id, profiles!trips_client_id_fkey(full_name)",
      )
      .eq("organization_id", ctx.organizationId)
      .eq("start_date", leadDate)
      .is("driver_id", null)
      .limit(10);

    if (!tripError && driverlessTrips) {
      const label = leadDays === 1 ? "tomorrow" : `in ${leadDays} days`;

      for (const trip of driverlessTrips) {
        const profiles = trip.profiles as
          | { full_name: string | null }
          | null;
        const clientName = profiles?.full_name ?? "Unknown client";

        alerts.push({
          type: "trip_no_driver",
          message: `Trip for ${clientName} starts ${label} but has no driver assigned.`,
          entityType: "trip",
          entityId: trip.id,
        });
      }
    }
  } catch {
    // Skip trip alerts on failure.
  }

  // 3. Clients not contacted in 30 days
  try {
    const dormantDays = thresholds?.dormantClientDays ?? 30;
    const dormantCutoff = nDaysAgoISO(dormantDays);

    const { data: dormantClients, error: clientError } = await ctx.supabase
      .from("profiles")
      .select("id, full_name, lifecycle_stage, last_contacted_at")
      .eq("organization_id", ctx.organizationId)
      .lt("last_contacted_at", dormantCutoff)
      .not("lifecycle_stage", "eq", "trip_completed")
      .not("last_contacted_at", "is", null)
      .limit(10);

    if (!clientError && dormantClients) {
      for (const client of dormantClients) {
        const clientName = client.full_name ?? "Unknown client";

        alerts.push({
          type: "client_dormant",
          message: `${clientName} has not been contacted in over ${dormantDays} days.`,
          entityType: "client",
          entityId: client.id,
        });
      }
    }
  } catch {
    // Skip client alerts on failure.
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Eligible org discovery
// ---------------------------------------------------------------------------

/**
 * Find operators with a WhatsApp-capable phone number.
 *
 * Unlike briefings, alerts do not require an explicit preference --
 * all operators with a normalised phone are eligible.
 */
export async function getEligibleOrgsForAlerts(): Promise<
  ReadonlyArray<EligibleAlertOrg>
> {
  try {
    const supabase = createAdminClient();

    // Find profiles that are operators (have an org) with a phone number.
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, organization_id, phone_normalized, role")
      .not("organization_id", "is", null)
      .not("phone_normalized", "is", null)
      .in("role", ["admin", "super_admin", "operator"]);

    if (profileError || !profileRows) {
      return [];
    }

    return profileRows
      .filter((p) => p.organization_id !== null && p.phone_normalized !== null)
      .map((p) => ({
        organizationId: p.organization_id as string,
        userId: p.id,
        phone: p.phone_normalized as string,
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Batch alert generator
// ---------------------------------------------------------------------------

/**
 * Detect and queue alerts for all eligible organisations.
 *
 * For each org:
 *   1. Load alert thresholds from user preferences.
 *   2. Skip if alerts are disabled or it is quiet hours.
 *   3. Detect alert conditions using the loaded thresholds.
 *   4. Cap alerts to `thresholds.maxAlertsPerCycle`.
 *   5. Insert into `notification_queue` with idempotency keys
 *      scoped to org + alert type + entity + calendar day.
 */
export async function generateAndQueueAlerts(): Promise<AlertQueueResult> {
  const eligible = await getEligibleOrgsForAlerts();

  if (eligible.length === 0) {
    return { queued: 0, skipped: 0, errors: 0 };
  }

  const supabase = createAdminClient();
  const dateKey = todayISO();

  let queued = 0;
  let skipped = 0;
  let errors = 0;

  // Deduplicate: only process one operator per org (first found).
  const seenOrgs = new Set<string>();
  const uniqueEntries: EligibleAlertOrg[] = [];

  for (const entry of eligible) {
    if (!seenOrgs.has(entry.organizationId)) {
      seenOrgs.add(entry.organizationId);
      uniqueEntries.push(entry);
    }
  }

  for (const entry of uniqueEntries) {
    try {
      const thresholds = await getAlertThresholds({
        organizationId: entry.organizationId,
        userId: entry.userId,
        channel: "whatsapp",
        supabase,
      });

      if (!thresholds.alertsEnabled) continue;
      if (isQuietHours(thresholds)) continue;

      const alerts = await detectAlerts(
        {
          organizationId: entry.organizationId,
          userId: entry.userId,
          channel: "whatsapp",
          supabase,
        },
        thresholds,
      );

      const capped = alerts.slice(0, thresholds.maxAlertsPerCycle);

      for (const alert of capped) {
        const idempotencyKey = `${entry.organizationId}:alert:${alert.type}:${alert.entityId}:${dateKey}`;

        const { error: insertError } = await supabase
          .from("notification_queue")
          .insert({
            notification_type: "assistant_alert",
            channel_preference: "whatsapp",
            user_id: entry.userId,
            recipient_phone: entry.phone,
            scheduled_for: new Date().toISOString(),
            idempotency_key: idempotencyKey,
            status: "pending",
            attempts: 0,
            payload: {
              message: alert.message,
              alert_type: alert.type,
              entity_type: alert.entityType,
              entity_id: alert.entityId,
            },
          });

        if (insertError) {
          // Idempotency key violation means already queued today -- skip.
          if (insertError.code === "23505") {
            skipped += 1;
          } else {
            errors += 1;
          }
        } else {
          queued += 1;
        }
      }
    } catch {
      errors += 1;
    }
  }

  return { queued, skipped, errors };
}
