import "server-only";

/* ------------------------------------------------------------------
 * Morning Briefing -- zero-cost daily summary via WhatsApp templates.
 *
 * Generates a formatted WhatsApp message from a ContextSnapshot
 * without any LLM call ($0.00 per briefing).
 *
 * Eligible operators are those who have:
 *   1. `morning_briefing_enabled` preference set to true
 *   2. A connected TripBuilt Assistant WhatsApp group
 *
 * All functions are pure or use explicit admin Supabase calls.
 * Errors are caught at every boundary and never thrown to callers.
 * ------------------------------------------------------------------ */

import type { ContextSnapshot, ActionContext } from "./types";
import { formatCurrency } from "./prompts/system";
import { buildOwnerAgenda, formatOwnerAgenda } from "./owner-agenda";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardedSendText } from "@/lib/whatsapp-evolution.server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EligibleOrg {
  readonly organizationId: string;
  readonly userId: string;
  readonly sessionName: string;
  readonly assistantGroupJid: string;
  readonly orgName: string;
}

interface BriefingResult {
  readonly queued: number;
  readonly skipped: number;
  readonly errors: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Today as YYYY-MM-DD for idempotency keys. */
const todayDateKey = (): string => new Date().toISOString().slice(0, 10);

/** Cap a list at `max` items for message brevity. */
function takeMax<T>(items: readonly T[], max: number): readonly T[] {
  return items.slice(0, max);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

export interface LatestBriefingDelivery {
  readonly at: string | null;
  readonly status: string | null;
}

export async function getLatestBriefingDelivery(
  organizationId: string,
  userId: string,
): Promise<LatestBriefingDelivery> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("notification_logs")
    .select("created_at, sent_at, status")
    .eq("organization_id", organizationId)
    .eq("recipient_id", userId)
    .eq("notification_type", "morning_briefing")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    at: data?.sent_at ?? data?.created_at ?? null,
    status: data?.status ?? null,
  };
}

// ---------------------------------------------------------------------------
// Briefing formatter (pure function -- no I/O, no LLM)
// ---------------------------------------------------------------------------

/**
 * Format a WhatsApp-friendly briefing message from a context snapshot.
 *
 * Uses WhatsApp-compatible *bold* markers. Returns a concise summary
 * capped at 5 items per section to stay within message-length limits.
 */
export function formatBriefingMessage(
  snapshot: ContextSnapshot,
  orgName: string,
): string {
  const sections: string[] = [];

  sections.push(`*Good morning!* Here's your daily briefing for ${orgName}:`);

  // -- Trips --
  const tripCount = snapshot.todayTrips.length;
  sections.push(`\n*Trips Today:* ${tripCount} active`);

  if (tripCount > 0) {
    const tripLines = takeMax(snapshot.todayTrips, 5).map(
      (t) => `- ${t.clientName ?? "Unknown client"} (${t.status ?? "unknown"})`,
    );
    sections.push(tripLines.join("\n"));
  }

  // -- Invoices --
  const invoiceCount = snapshot.pendingInvoices.length;
  sections.push(`\n*Pending Invoices:* ${invoiceCount}`);

  if (invoiceCount > 0) {
    const invoiceLines = takeMax(snapshot.pendingInvoices, 5).map(
      (inv) =>
        `- #${inv.invoiceNumber}: ${inv.clientName ?? "Unknown"} \u2014 ${formatCurrency(inv.balanceAmount, inv.currency)} (${inv.status})`,
    );
    sections.push(invoiceLines.join("\n"));
  }

  // -- Clients needing attention --
  const clientCount = snapshot.recentClients.length;
  sections.push(`\n*Clients Needing Attention:* ${clientCount}`);

  // -- Failed notifications --
  const failedCount = snapshot.failedNotifications.length;
  sections.push(`\n*Failed Notifications:* ${failedCount}`);

  // -- No activity shortcut --
  const hasActivity =
    tripCount > 0 || invoiceCount > 0 || clientCount > 0 || failedCount > 0;

  if (!hasActivity) {
    return "All clear today! No urgent items.";
  }

  sections.push("\nReply with any question to get started!");

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Eligible org discovery
// ---------------------------------------------------------------------------

/**
 * Find organisations whose operators have:
 *   - `morning_briefing_enabled` preference set to `true`
 *   - A connected assistant WhatsApp group
 *
 * Uses the admin client to bypass RLS.
 */
export async function getEligibleOrgsForBriefing(): Promise<
  ReadonlyArray<EligibleOrg>
> {
  try {
    const supabase = createAdminClient();

    const { data: prefRows, error: prefError } = await supabase
      .from("assistant_preferences")
      .select("organization_id, user_id")
      .eq("preference_key", "morning_briefing_enabled")
      .eq("preference_value", true);

    if (prefError || !prefRows || prefRows.length === 0) {
      return [];
    }

    const orgIds = [...new Set(prefRows.map((r) => r.organization_id))];

    const { data: orgRows, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);

    if (orgError || !orgRows) {
      return [];
    }

    const orgNameById = new Map(orgRows.map((o) => [o.id, o.name]));
    const { data: connectionRows, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("organization_id, session_name, assistant_group_jid, updated_at")
      .in("organization_id", orgIds)
      .eq("status", "connected")
      .not("assistant_group_jid", "is", null)
      .order("updated_at", { ascending: false });

    if (connectionError || !connectionRows || connectionRows.length === 0) {
      return [];
    }

    const connectionByOrgId = new Map<
      string,
      {
        readonly sessionName: string;
        readonly assistantGroupJid: string;
      }
    >();

    for (const row of connectionRows) {
      if (!row.organization_id || !row.session_name || !row.assistant_group_jid) {
        continue;
      }

      if (!connectionByOrgId.has(row.organization_id)) {
        connectionByOrgId.set(row.organization_id, {
          sessionName: row.session_name,
          assistantGroupJid: row.assistant_group_jid,
        });
      }
    }

    // Join preferences + profiles + org names.
    const results: EligibleOrg[] = [];

    for (const pref of prefRows) {
      const connection = connectionByOrgId.get(pref.organization_id);
      if (!connection) continue;

      const orgName = orgNameById.get(pref.organization_id) ?? "Your Organisation";

      results.push({
        organizationId: pref.organization_id,
        userId: pref.user_id,
        sessionName: connection.sessionName,
        assistantGroupJid: connection.assistantGroupJid,
        orgName,
      });
    }

    return results;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Batch briefing generator
// ---------------------------------------------------------------------------

/**
 * Generate and send morning briefings for all eligible operators.
 *
 * For each eligible org/user pair:
 *   1. Build a context snapshot (cached per org).
 *   2. Format the briefing message (pure, zero-cost).
 *   3. Send directly to the assistant group with a per-day
 *      delivery guard and durable delivery logs.
 */
export async function generateAndQueueBriefings(): Promise<BriefingResult> {
  const eligible = await getEligibleOrgsForBriefing();

  if (eligible.length === 0) {
    return { queued: 0, skipped: 0, errors: 0 };
  }

  const supabase = createAdminClient();
  const dateKey = todayDateKey();

  let queued = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of eligible) {
    const idempotencyKey = `${entry.organizationId}:${entry.userId}:briefing:${dateKey}`;

    try {
      const { data: existingLog, error: existingLogError } = await supabase
        .from("notification_logs")
        .select("id")
        .eq("organization_id", entry.organizationId)
        .eq("recipient_id", entry.userId)
        .eq("notification_type", "morning_briefing")
        .eq("status", "sent")
        .eq("external_id", idempotencyKey)
        .maybeSingle();

      if (existingLogError) {
        errors += 1;
        continue;
      }

      if (existingLog?.id) {
        skipped += 1;
        continue;
      }

      const agendaContext: ActionContext = {
        organizationId: entry.organizationId,
        userId: entry.userId,
        channel: "whatsapp_group",
        supabase,
      };
      const agenda = await buildOwnerAgenda(agendaContext);
      const message = formatOwnerAgenda(agenda);
      const attemptedAt = new Date().toISOString();

      await guardedSendText(entry.sessionName, entry.assistantGroupJid, message);

      await Promise.all([
        supabase.from("notification_logs").insert({
          organization_id: entry.organizationId,
          recipient_id: entry.userId,
          recipient_phone: entry.assistantGroupJid,
          recipient_type: "admin",
          notification_type: "morning_briefing",
          title: "Morning briefing",
          body: message,
          status: "sent",
          external_id: idempotencyKey,
          sent_at: attemptedAt,
        }),
        supabase.from("notification_delivery_status").insert({
          organization_id: entry.organizationId,
          user_id: entry.userId,
          recipient_phone: entry.assistantGroupJid,
          recipient_type: "admin",
          channel: "whatsapp",
          provider: "evolution_assistant_group",
          notification_type: "morning_briefing",
          status: "sent",
          attempt_number: 1,
          provider_message_id: idempotencyKey,
          sent_at: attemptedAt,
          metadata: {
            assistant_group_jid: entry.assistantGroupJid,
            session_name: entry.sessionName,
            org_name: entry.orgName,
          },
        }),
      ]);

      queued += 1;
    } catch (error) {
      const attemptedAt = new Date().toISOString();
      const errorMessage = getErrorMessage(error);

      await Promise.all([
        supabase.from("notification_logs").insert({
          organization_id: entry.organizationId,
          recipient_id: entry.userId,
          recipient_phone: entry.assistantGroupJid,
          recipient_type: "admin",
          notification_type: "morning_briefing",
          title: "Morning briefing",
          body: null,
          status: "failed",
          external_id: idempotencyKey,
          error_message: errorMessage,
        }),
        supabase.from("notification_delivery_status").insert({
          organization_id: entry.organizationId,
          user_id: entry.userId,
          recipient_phone: entry.assistantGroupJid,
          recipient_type: "admin",
          channel: "whatsapp",
          provider: "evolution_assistant_group",
          notification_type: "morning_briefing",
          status: "failed",
          attempt_number: 1,
          provider_message_id: idempotencyKey,
          failed_at: attemptedAt,
          error_message: errorMessage,
          metadata: {
            assistant_group_jid: entry.assistantGroupJid,
            session_name: entry.sessionName,
            org_name: entry.orgName,
          },
        }),
      ]);

      errors += 1;
    }
  }

  return { queued, skipped, errors };
}
