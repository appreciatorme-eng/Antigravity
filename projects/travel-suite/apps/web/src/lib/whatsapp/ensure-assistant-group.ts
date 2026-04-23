import { createAdminClient } from "@/lib/supabase/admin";
import {
  createEvolutionGroup,
  guardedSendText,
  updateEvolutionGroupDescription,
} from "@/lib/whatsapp-evolution.server";
import { logError, logEvent } from "@/lib/observability/logger";
import { sendPoll, WELCOME_POLL } from "./assistant-polls";

async function resolveOwnerUserIdForOrg(
  organizationId: string,
  connectedPhone: string | null | undefined,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("owner_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (typeof org?.owner_id === "string" && org.owner_id.length > 0) {
    return org.owner_id;
  }

  const digits = connectedPhone?.replace(/\D/g, "") ?? "";
  if (digits) {
    const { data: ownerFromPhone } = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("phone_normalized", digits)
      .maybeSingle();

    if (ownerFromPhone?.id) {
      return ownerFromPhone.id;
    }
  }

  const { data: adminProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .in("role", ["super_admin", "admin"])
    .order("created_at", { ascending: true })
    .limit(1);

  return adminProfiles?.[0]?.id ?? null;
}

async function enableMorningBriefingByDefault(
  organizationId: string,
  ownerUserId: string | null,
): Promise<void> {
  if (!ownerUserId) return;

  const admin = createAdminClient();
  await admin
    .from("assistant_preferences")
    .upsert(
      {
        organization_id: organizationId,
        user_id: ownerUserId,
        preference_key: "morning_briefing_enabled",
        preference_value: true,
      },
      { onConflict: "organization_id,user_id,preference_key" },
    );
}

/**
 * Ensure the TripBuilt Assistant WhatsApp group exists for an instance.
 * Idempotent — skips if the group already exists in the DB.
 *
 * On reconnect (new unique session name), falls back to checking the
 * organization's row for an existing group JID from a previous session.
 * This prevents creating duplicate WhatsApp groups on disconnect/reconnect.
 *
 * Returns the groupJid if created/existed, or null on failure.
 */
export async function ensureAssistantGroup(
  sessionName: string,
): Promise<string | null> {
  const admin = createAdminClient();

  // 1. Check current session row
  const { data: rawConn } = await admin
    .from("whatsapp_connections")
    .select("organization_id, assistant_group_jid, phone_number")
    .eq("session_name", sessionName)
    .maybeSingle();

  const conn = rawConn as {
    organization_id?: string;
    assistant_group_jid?: string;
    phone_number?: string;
  } | null;

  const orgId = conn?.organization_id ?? null;

  if (orgId && conn?.phone_number) {
    const ownerUserId = await resolveOwnerUserIdForOrg(orgId, conn.phone_number).catch(() => null);
    await enableMorningBriefingByDefault(orgId, ownerUserId).catch((err) => {
      logError("[ensure-assistant-group] Failed to enable morning briefing preference", err);
    });
  }

  // Keep the currently stored group authoritative for this session.
  if (conn?.assistant_group_jid) {
    return conn.assistant_group_jid;
  }

  // No phone number — can't create group
  if (!conn?.phone_number) return null;
  if (!orgId) return null;

  // 2. Check if any row for this org has an existing group JID
  //    (from a previous session before disconnect/reconnect)
  const { data: rawOrgConn } = await admin
    .from("whatsapp_connections")
    .select("assistant_group_jid")
    .eq("organization_id", orgId)
    .not("assistant_group_jid", "is", null)
    .limit(1)
    .maybeSingle();

  const existingJid = (rawOrgConn as { assistant_group_jid?: string } | null)
    ?.assistant_group_jid;

  if (existingJid) {
    // Carry the existing group JID forward to the new session row
    await admin
      .from("whatsapp_connections")
      .update({ assistant_group_jid: existingJid } as Record<string, unknown>)
      .eq("session_name", sessionName);

    logEvent("info", `[ensure-assistant-group] Reused existing group ${existingJid} for ${sessionName}`);
    return existingJid;
  }

  // 3. No existing group anywhere — create a new one
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
    "Your private TripBuilt notification channel. Daily briefings, payments, trip updates, and operator actions — all here.",
  );

  await guardedSendText(sessionName, groupJid, [
    "\u{1F916} *TripBuilt Assistant is ready!*",
    "",
    "I'll send you:",
    "\u{1F4CB} Daily briefings at 6:30 AM",
    "\u{1F4B0} Payment notifications",
    "\u{1F4CB} Trip and operations updates",
    "",
    "*Quick commands you can type:*",
    "  \u{1F4CA} *stats* — Dashboard overview",
    "  \u{1F4CB} *today* — Today's trips",
    "  \u{1F4B0} *payments* — Pending payments",
    "  \u{1F4CA} *brief* — Today's agenda",
    "  \u{1F4B5} *work* — Priority queue",
    "",
    "Or just ask me anything in plain English!",
  ].join("\n"));

  // Send a welcome poll so operator can try it immediately
  void sendPoll(sessionName, groupJid, WELCOME_POLL).catch((err) => {
    logError("[ensure-assistant-group] Failed to send welcome poll", err);
  });

  logEvent("info", `[ensure-assistant-group] Created group ${groupJid} for ${sessionName}`);
  return groupJid;
}
