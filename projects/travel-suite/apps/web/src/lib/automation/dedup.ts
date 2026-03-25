import "server-only";

/* ------------------------------------------------------------------
 * Automation Deduplication
 *
 * Prevents duplicate WhatsApp messages by tracking sent messages in
 * the automation_sent_messages table. Each (org, rule_type, phone)
 * combination can only receive one message.
 * ------------------------------------------------------------------ */

import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/observability/logger";

/**
 * Check if a message was already sent for this combination.
 *
 * @returns true if a message was already sent (should skip)
 */
export async function hasAlreadySent(
  orgId: string,
  ruleType: string,
  contactPhone: string,
): Promise<boolean> {
  const admin = createAdminClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("automation_sent_messages")
      .select("id")
      .eq("organization_id", orgId)
      .eq("rule_type", ruleType)
      .eq("contact_phone", contactPhone)
      .limit(1)
      .maybeSingle();

    if (error) {
      logError("[dedup] Failed to check sent status", error);
      // Fail open: allow sending if we can't check (better to double-send than never send)
      return false;
    }

    return data !== null;
  } catch (error) {
    logError("[dedup] Exception checking sent status", error);
    return false;
  }
}

/**
 * Record that a message was sent for deduplication tracking.
 */
export async function recordSent(
  orgId: string,
  ruleType: string,
  contactPhone: string,
  preview: string,
): Promise<void> {
  const admin = createAdminClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("automation_sent_messages")
      .insert({
        organization_id: orgId,
        rule_type: ruleType,
        contact_phone: contactPhone,
        message_preview: preview.slice(0, 500),
        sent_at: new Date().toISOString(),
      });

    if (error) {
      logError("[dedup] Failed to record sent message", error);
    }
  } catch (error) {
    logError("[dedup] Exception recording sent message", error);
  }
}
