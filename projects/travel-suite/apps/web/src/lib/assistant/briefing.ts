import "server-only";

/* ------------------------------------------------------------------
 * Morning Briefing -- zero-cost daily summary via WhatsApp templates.
 *
 * Generates a formatted WhatsApp message from a ContextSnapshot
 * without any LLM call ($0.00 per briefing).
 *
 * Eligible operators are those who have:
 *   1. `morning_briefing_enabled` preference set to true
 *   2. A normalised WhatsApp phone number on their profile
 *
 * All functions are pure or use explicit admin Supabase calls.
 * Errors are caught at every boundary and never thrown to callers.
 * ------------------------------------------------------------------ */

import type { ContextSnapshot, ActionContext } from "./types";
import { formatCurrency } from "./prompts/system";
import { buildOwnerAgenda, formatOwnerAgenda } from "./owner-agenda";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOperator } from "@/lib/whatsapp/assistant-notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EligibleOrg {
  readonly organizationId: string;
  readonly userId: string;
  readonly phone: string;
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
 *   - A normalised WhatsApp phone on their profile
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

    const userIds = prefRows.map((r) => r.user_id);

    // Fetch profiles with a WhatsApp-capable phone number.
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, phone_normalized, organization_id")
      .in("id", userIds)
      .not("phone_normalized", "is", null);

    if (profileError || !profileRows) {
      return [];
    }

    const phoneByUserId = new Map(
      profileRows.map((p) => [p.id, p.phone_normalized ?? ""]),
    );

    // Collect unique org IDs for name lookup.
    const orgIds = [
      ...new Set(prefRows.map((r) => r.organization_id)),
    ];

    const { data: orgRows, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);

    if (orgError || !orgRows) {
      return [];
    }

    const orgNameById = new Map(orgRows.map((o) => [o.id, o.name]));

    // Join preferences + profiles + org names.
    const results: EligibleOrg[] = [];

    for (const pref of prefRows) {
      const phone = phoneByUserId.get(pref.user_id);
      if (!phone) continue;

      const orgName = orgNameById.get(pref.organization_id) ?? "Your Organisation";

      results.push({
        organizationId: pref.organization_id,
        userId: pref.user_id,
        phone,
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
 * Generate and queue morning briefings for all eligible operators.
 *
 * For each eligible org/user pair:
 *   1. Build a context snapshot (cached per org).
 *   2. Format the briefing message (pure, zero-cost).
 *   3. Insert into `notification_queue` with an idempotency key
 *      to prevent duplicate sends on the same calendar day.
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
    try {
      const agendaContext: ActionContext = {
        organizationId: entry.organizationId,
        userId: entry.userId,
        channel: "whatsapp_group",
        supabase,
      };
      const agenda = await buildOwnerAgenda(agendaContext);
      const message = formatOwnerAgenda(agenda);
      const idempotencyKey = `${entry.organizationId}:${entry.userId}:briefing:${dateKey}`;

      const { error: insertError } = await supabase
        .from("notification_queue")
        .insert({
          notification_type: "morning_briefing",
          channel_preference: "whatsapp",
          user_id: entry.userId,
          recipient_phone: entry.phone,
          scheduled_for: new Date().toISOString(),
          idempotency_key: idempotencyKey,
          status: "pending",
          attempts: 0,
          payload: {
            message,
            org_name: entry.orgName,
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

        // Also send to WhatsApp Assistant group (best-effort)
        void notifyOperator(entry.organizationId, message);
      }
    } catch {
      errors += 1;
    }
  }

  return { queued, skipped, errors };
}
