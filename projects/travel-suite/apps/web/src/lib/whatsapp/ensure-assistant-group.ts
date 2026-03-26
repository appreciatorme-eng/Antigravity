import { createAdminClient } from "@/lib/supabase/admin";
import {
  createEvolutionGroup,
  sendEvolutionText,
  updateEvolutionGroupDescription,
} from "@/lib/whatsapp-evolution.server";
import { logEvent } from "@/lib/observability/logger";

/**
 * Ensure the TripBuilt Assistant WhatsApp group exists for an instance.
 * Idempotent — skips if the group already exists in the DB.
 * Returns the groupJid if created/existed, or null on failure.
 */
export async function ensureAssistantGroup(
  sessionName: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data: rawConn } = await admin
    .from("whatsapp_connections")
    .select("assistant_group_jid, phone_number")
    .eq("session_name", sessionName)
    .maybeSingle();

  const conn = rawConn as {
    assistant_group_jid?: string;
    phone_number?: string;
  } | null;

  // Already exists
  if (conn?.assistant_group_jid) return conn.assistant_group_jid;

  // No phone number — can't create group
  if (!conn?.phone_number) return null;

  const operatorDigits = conn.phone_number.replace(/\D/g, "");

  const groupJid = await createEvolutionGroup(
    sessionName,
    "\u{1F916} TripBuilt Assistant",
    [operatorDigits],
  );

  await admin
    .from("whatsapp_connections")
    .update({ assistant_group_jid: groupJid } as Record<string, unknown>)
    .eq("session_name", sessionName);

  await updateEvolutionGroupDescription(
    sessionName,
    groupJid,
    "Your private TripBuilt notification channel. Daily briefings, new leads, payments, and driver updates — all here.",
  );

  await sendEvolutionText(sessionName, groupJid, [
    "\u{1F916} *TripBuilt Assistant is ready!*",
    "",
    "I'll send you:",
    "\u{1F4CB} Daily briefings at 6:30 AM",
    "\u{1F514} New lead alerts",
    "\u{1F4B0} Payment notifications",
    "\u{1F697} Driver updates",
    "",
    "*Quick commands you can type:*",
    "  \u{1F4CA} *stats* — Dashboard overview",
    "  \u{1F4CB} *today* — Today's trips",
    "  \u{1F195} *leads* — Recent leads",
    "  \u{1F4B0} *payments* — Pending payments",
    "  \u{1F4B5} *revenue* — Revenue summary",
    "",
    "Or just ask me anything in plain English!",
  ].join("\n"));

  logEvent("info", `[ensure-assistant-group] Created group ${groupJid} for ${sessionName}`);
  return groupJid;
}
