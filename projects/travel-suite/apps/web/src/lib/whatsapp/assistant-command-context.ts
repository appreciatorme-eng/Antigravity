import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateSession } from "@/lib/assistant/session";
import type { ActionContext } from "@/lib/assistant/types";
import { logError, logEvent, logWarn } from "@/lib/observability/logger";
import {
  normalizeAssistantGroupJid,
  resolveAssistantGroupConnection,
  type AssistantGroupConnectionCandidate,
} from "@/lib/whatsapp/assistant-group-context";
import type { AdminClient, CommandContext } from "@/lib/whatsapp/assistant-command-types";

function normalizePhoneDigits(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length > 0 ? digits : null;
}

async function resolveOwnerUserId(
  admin: AdminClient,
  orgId: string,
  connectedPhone: string | null,
): Promise<string | null> {
  const { data: org } = await admin
    .from("organizations")
    .select("owner_id")
    .eq("id", orgId)
    .maybeSingle();

  if (typeof org?.owner_id === "string" && org.owner_id.length > 0) {
    return org.owner_id;
  }

  const phoneDigits = normalizePhoneDigits(connectedPhone);
  if (phoneDigits) {
    const { data: ownerFromPhone } = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("phone_normalized", phoneDigits)
      .maybeSingle();

    if (ownerFromPhone?.id) {
      return ownerFromPhone.id;
    }
  }

  const { data: adminProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", orgId)
    .in("role", ["super_admin", "admin"])
    .order("created_at", { ascending: true })
    .limit(1);

  if ((adminProfiles ?? []).length > 0) {
    return adminProfiles?.[0]?.id ?? null;
  }

  const { data: anyProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true })
    .limit(1);

  return anyProfile?.[0]?.id ?? null;
}

export async function resolveCommandContext(
  instanceName: string,
  groupJid: string,
): Promise<CommandContext | null> {
  const admin = createAdminClient();
  const { data: sessionConn } = await admin
    .from("whatsapp_connections")
    .select("organization_id, assistant_group_jid, phone_number, session_name, session_token, updated_at")
    .eq("session_name", instanceName)
    .maybeSingle();

  const directConn = sessionConn ?? (
    await admin
      .from("whatsapp_connections")
      .select("organization_id, assistant_group_jid, phone_number, session_name, session_token, updated_at")
      .eq("session_token", instanceName)
      .maybeSingle()
  ).data ?? null;

  const { data: candidateRows } = await admin
    .from("whatsapp_connections")
    .select("organization_id, assistant_group_jid, phone_number, session_name, session_token, updated_at")
    .not("assistant_group_jid", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  const incomingGroupJid = normalizeAssistantGroupJid(groupJid);
  const resolution = resolveAssistantGroupConnection({
    instanceName,
    incomingGroupJid,
    sessionConnection: (directConn as AssistantGroupConnectionCandidate | null) ?? null,
    candidateRows: (candidateRows as AssistantGroupConnectionCandidate[] | null) ?? [],
  });

  if (!resolution.connection?.organization_id || !incomingGroupJid) {
    logWarn("[assistant-commands] failed to resolve assistant group context", {
      instanceName,
      incomingGroupJid,
      failureReason: resolution.failureReason,
      sessionConnectionFound: Boolean(directConn),
      candidateCount: candidateRows?.length ?? 0,
    });
    return null;
  }

  const conn = resolution.connection;
  const organizationId = conn.organization_id;
  if (typeof organizationId !== "string" || organizationId.length === 0) {
    logWarn("[assistant-commands] resolved assistant group row is missing organization id", {
      instanceName,
      incomingGroupJid,
      matchedBy: resolution.matchedBy,
    });
    return null;
  }

  if (resolution.matchedBy && resolution.matchedBy !== "session_row") {
    logEvent("info", "[assistant-commands] resolved assistant group via fallback match", {
      instanceName,
      incomingGroupJid,
      matchedBy: resolution.matchedBy,
      organizationId,
      replyInstanceName: conn.session_name ?? instanceName,
    });
  }

  const ownerUserId = await resolveOwnerUserId(
    admin,
    organizationId,
    conn.phone_number ?? null,
  );

  if (!ownerUserId) {
    logError("[assistant-commands] could not resolve owner user for assistant group", null, {
      organizationId,
      instanceName,
    });
    return null;
  }

  const actionCtx: ActionContext = {
    organizationId,
    userId: ownerUserId,
    channel: "whatsapp_group",
    supabase: admin,
  };

  const session = await getOrCreateSession(actionCtx);

  return {
    admin,
    orgId: organizationId,
    ownerUserId,
    instanceName,
    replyInstanceName: conn.session_name ?? instanceName,
    groupJid,
    actionCtx,
    sessionId: session.id,
    conversationHistory: session.conversationHistory,
  };
}
