/**
 * TripBuilt WhatsApp Assistant — Agenda-first group router
 *
 * The private operator group is a thin channel over the shared assistant.
 * Deterministic commands stay fast, but natural-language and write actions
 * flow through the same orchestrator + confirmation model used elsewhere.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type {
  ActionContext,
  ContextSnapshot,
  ConversationMessage,
} from "@/lib/assistant/types";

import { createAdminClient } from "@/lib/supabase/admin";
import { guardedSendText } from "@/lib/whatsapp-evolution.server";
import { getCachedContextSnapshot } from "@/lib/assistant/context-engine";
import { handleMessage } from "@/lib/assistant/orchestrator";
import { buildOwnerAgenda, formatOwnerAgenda } from "@/lib/assistant/owner-agenda";
import {
  clearPendingAction,
  getOrCreateSession,
  getPendingAction,
  setPendingAction,
  updateSessionHistory,
  type PendingAction,
} from "@/lib/assistant/session";
import { findAction } from "@/lib/assistant/actions/registry";
import { logAuditEvent } from "@/lib/assistant/audit";
import {
  formatDashboard,
  formatLeads,
  formatPendingPayments,
  formatRevenue,
  formatTripsToday,
} from "./assistant-formatters";
import { logError } from "@/lib/observability/logger";
import { POLL_OPTION_TO_COMMAND, sendFollowUpPoll } from "./assistant-polls";

type AdminClient = SupabaseClient<Database>;

interface CommandContext {
  readonly admin: AdminClient;
  readonly orgId: string;
  readonly ownerUserId: string;
  readonly instanceName: string;
  readonly groupJid: string;
  readonly actionCtx: ActionContext;
  readonly sessionId: string;
  readonly conversationHistory: readonly ConversationMessage[];
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const MIN_AI_MESSAGE_LENGTH = 4;
const MAX_REPLY_LENGTH = 3800;
const EMOJI_ONLY_RE = /^[\p{Emoji_Presentation}\p{Emoji}\s]+$/u;
const CONFIRM_PHRASES = new Set(["yes", "y", "confirm", "ok", "go ahead", "proceed"]);
const CANCEL_PHRASES = new Set(["no", "n", "cancel", "stop", "nevermind", "never mind"]);

const KEYWORD_ALIASES: Record<string, string> = {
  "help": "help",
  "?": "help",
  "menu": "help",
  "commands": "help",
  "hi": "help",
  "hello": "help",
  "hey": "help",
  "start": "help",
  "today": "today",
  "trips": "today",
  "pickups": "today",
  "pickup": "today",
  "trips today": "today",
  "leads": "leads",
  "lead": "leads",
  "new": "leads",
  "inbox": "leads",
  "payments": "payments",
  "payment": "payments",
  "pending": "payments",
  "due": "payments",
  "revenue": "revenue",
  "money": "revenue",
  "earnings": "revenue",
  "income": "revenue",
  "stats": "stats",
  "dashboard": "stats",
  "overview": "stats",
  "dashboard overview": "stats",
  "brief": "brief",
  "briefing": "brief",
  "summary": "brief",
  "morning": "brief",
  "daily briefing": "brief",
};

function normalizePhoneDigits(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length > 0 ? digits : null;
}

function shouldTriggerAI(normalized: string): boolean {
  if (normalized.length < MIN_AI_MESSAGE_LENGTH) return false;
  if (EMOJI_ONLY_RE.test(normalized)) return false;

  const skipPhrases = [
    "ok", "okay", "fine", "thanks", "thank you", "noted",
    "done", "yes", "no", "sure", "alright", "cool", "great",
    "good", "nice", "perfect", "awesome", "got it",
  ];

  return !skipPhrases.includes(normalized);
}

function formatForWhatsApp(text: string): string {
  return text
    .replace(/^#{1,3}\s+(.+)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2")
    .slice(0, MAX_REPLY_LENGTH);
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

async function resolveCommandContext(
  instanceName: string,
  groupJid: string,
): Promise<CommandContext | null> {
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("whatsapp_connections")
    .select("organization_id, assistant_group_jid, phone_number")
    .eq("session_name", instanceName)
    .maybeSingle();

  if (!conn?.organization_id || !conn.assistant_group_jid || conn.assistant_group_jid !== groupJid) {
    return null;
  }

  const ownerUserId = await resolveOwnerUserId(
    admin,
    conn.organization_id,
    conn.phone_number ?? null,
  );

  if (!ownerUserId) {
    logError("[assistant-commands] could not resolve owner user for assistant group", null, {
      organizationId: conn.organization_id,
      instanceName,
    });
    return null;
  }

  const actionCtx: ActionContext = {
    organizationId: conn.organization_id,
    userId: ownerUserId,
    channel: "whatsapp_group",
    supabase: admin,
  };

  const session = await getOrCreateSession(actionCtx);

  return {
    admin,
    orgId: conn.organization_id,
    ownerUserId,
    instanceName,
    groupJid,
    actionCtx,
    sessionId: session.id,
    conversationHistory: session.conversationHistory,
  };
}

async function persistTurn(
  ctx: CommandContext,
  userText: string,
  replyText: string,
): Promise<void> {
  const updatedHistory: readonly ConversationMessage[] = [
    ...ctx.conversationHistory,
    { role: "user", content: userText },
    { role: "assistant", content: replyText },
  ];

  await updateSessionHistory(ctx.actionCtx, ctx.sessionId, updatedHistory).catch((historyError) => {
    logError("[assistant-commands] failed to persist group assistant history", historyError, {
      sessionId: ctx.sessionId,
      organizationId: ctx.orgId,
    });
  });
}

async function sendReply(ctx: CommandContext, text: string): Promise<void> {
  await guardedSendText(
    ctx.instanceName,
    ctx.groupJid,
    formatForWhatsApp(text),
  ).catch((error) => {
    logError("[assistant-commands] failed to send assistant group reply", error, {
      organizationId: ctx.orgId,
      sessionId: ctx.sessionId,
    });
  });
}

async function handlePendingAction(
  ctx: CommandContext,
  userText: string,
  pending: PendingAction,
): Promise<string> {
  const normalizedText = userText.trim().toLowerCase();
  const isConfirm = CONFIRM_PHRASES.has(normalizedText);
  const isCancel = CANCEL_PHRASES.has(normalizedText);

  if (isConfirm) {
    const actionDef = findAction(pending.actionName);
    if (!actionDef) {
      await clearPendingAction(ctx.actionCtx, ctx.sessionId);
      return "Sorry, I couldn't find that action anymore. Tell me what you want to do next.";
    }

    try {
      const result = await actionDef.execute(ctx.actionCtx, pending.params);

      void logAuditEvent(ctx.actionCtx, {
        sessionId: ctx.sessionId,
        eventType: result.success ? "action_executed" : "action_failed",
        actionName: pending.actionName,
        actionParams: pending.params,
        actionResult: { success: result.success, message: result.message },
      });

      await clearPendingAction(ctx.actionCtx, ctx.sessionId);
      return result.success
        ? `Done. ${result.message}`
        : `Action failed: ${result.message}`;
    } catch (error) {
      logError("[assistant-commands] pending action execution failed", error, {
        actionName: pending.actionName,
        organizationId: ctx.orgId,
      });
      await clearPendingAction(ctx.actionCtx, ctx.sessionId);
      return "Something went wrong while executing that action. Please try again.";
    }
  }

  if (isCancel) {
    void logAuditEvent(ctx.actionCtx, {
      sessionId: ctx.sessionId,
      eventType: "action_cancelled",
      actionName: pending.actionName,
      actionParams: pending.params,
      actionResult: null,
    });

    await clearPendingAction(ctx.actionCtx, ctx.sessionId);
    return "Action cancelled. What should we work on next?";
  }

  await clearPendingAction(ctx.actionCtx, ctx.sessionId);
  return "";
}

async function getSnapshot(ctx: CommandContext): Promise<ContextSnapshot> {
  return getCachedContextSnapshot(ctx.actionCtx);
}

async function getMonthlyRevenue(
  admin: AdminClient,
  orgId: string,
  year: number,
  month: number,
): Promise<{ totalRupees: number; count: number }> {
  const monthStart = new Date(year, month, 1).toISOString();
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data } = await admin
    .from("invoices")
    .select("total_amount")
    .eq("organization_id", orgId)
    .eq("status", "paid")
    .gte("paid_at", monthStart)
    .lte("paid_at", monthEnd);

  const rows = (data ?? []) as ReadonlyArray<{ total_amount: number }>;
  const totalRupees = rows.reduce((sum, row) => sum + (row.total_amount ?? 0), 0);
  return { totalRupees, count: rows.length };
}

async function handleAgendaCommand(ctx: CommandContext): Promise<string> {
  const agenda = await buildOwnerAgenda(ctx.actionCtx);
  return `${formatOwnerAgenda(agenda)}\n\nReply *today*, *payments*, *leads*, *stats*, or tell me what you want to change.`;
}

async function handleTodayCommand(ctx: CommandContext): Promise<string> {
  const snapshot = await getSnapshot(ctx);
  return formatTripsToday(snapshot.todayTrips);
}

async function handlePaymentsCommand(ctx: CommandContext): Promise<string> {
  const snapshot = await getSnapshot(ctx);
  return formatPendingPayments(snapshot.pendingInvoices);
}

async function handleLeadsCommand(ctx: CommandContext): Promise<string> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await ctx.admin
    .from("whatsapp_webhook_events")
    .select("wa_id, metadata")
    .filter("metadata->>direction", "eq", "in")
    .filter("metadata->>session", "eq", ctx.instanceName)
    .gte("created_at", yesterday)
    .order("created_at", { ascending: false })
    .limit(30);

  const unique = [...new Map((data ?? []).map((event) => [event.wa_id, event])).values()];
  const leads = unique.map((event) => {
    const meta = event.metadata as { body_preview?: string; pushName?: string } | null;
    return {
      phone: event.wa_id,
      name: meta?.pushName ?? null,
      preview: meta?.body_preview ?? "",
    };
  }).filter((lead): lead is { phone: string; name: string | null; preview: string } => Boolean(lead.phone));

  return formatLeads(leads);
}

async function handleRevenueCommand(ctx: CommandContext): Promise<string> {
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()] ?? "";
  const lastMonthName = MONTH_NAMES[(now.getMonth() - 1 + 12) % 12] ?? "";

  const { totalRupees: currentTotal, count: currentCount } =
    await getMonthlyRevenue(ctx.admin, ctx.orgId, now.getFullYear(), now.getMonth());

  const lastMonth = now.getMonth() === 0
    ? { year: now.getFullYear() - 1, month: 11 }
    : { year: now.getFullYear(), month: now.getMonth() - 1 };
  const { totalRupees: lastTotal } =
    await getMonthlyRevenue(ctx.admin, ctx.orgId, lastMonth.year, lastMonth.month);

  return formatRevenue(currentTotal, lastTotal, monthName, lastMonthName, currentCount);
}

async function handleStatsCommand(ctx: CommandContext): Promise<string> {
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()] ?? "";

  const [snapshot, { totalRupees }] = await Promise.all([
    getSnapshot(ctx),
    getMonthlyRevenue(ctx.admin, ctx.orgId, now.getFullYear(), now.getMonth()),
  ]);

  return formatDashboard(snapshot, totalRupees, monthName);
}

async function handleKeywordCommand(
  ctx: CommandContext,
  command: string,
): Promise<string> {
  switch (command) {
    case "help":
    case "brief":
      return handleAgendaCommand(ctx);
    case "today":
      return handleTodayCommand(ctx);
    case "leads":
      return handleLeadsCommand(ctx);
    case "payments":
      return handlePaymentsCommand(ctx);
    case "revenue":
      return handleRevenueCommand(ctx);
    case "stats":
      return handleStatsCommand(ctx);
    default:
      return handleAgendaCommand(ctx);
  }
}

async function handleSharedAssistant(
  ctx: CommandContext,
  message: string,
): Promise<string> {
  const response = await handleMessage({
    message,
    history: ctx.conversationHistory,
    channel: "whatsapp_group",
    organizationId: ctx.orgId,
    userId: ctx.ownerUserId,
  });

  let replyText = response.reply;

  if (response.actionProposal) {
    await setPendingAction(ctx.actionCtx, ctx.sessionId, {
      actionName: response.actionProposal.actionName,
      params: response.actionProposal.params,
      confirmationMessage: response.actionProposal.confirmationMessage,
      proposedAt: new Date().toISOString(),
    });

    replyText += "\n\n_Reply *YES* to confirm or *NO* to cancel._";
  }

  return replyText;
}

export async function routeAssistantCommand(
  instanceName: string,
  groupJid: string,
  message: string,
): Promise<boolean> {
  const ctx = await resolveCommandContext(instanceName, groupJid);
  if (!ctx) return false;

  const trimmed = message.trim();
  if (!trimmed) return true;

  const normalized = trimmed.toLowerCase();
  const pending = await getPendingAction(ctx.actionCtx, ctx.sessionId);

  try {
    if (pending) {
      const pendingReply = await handlePendingAction(ctx, trimmed, pending);
      if (pendingReply) {
        await persistTurn(ctx, trimmed, pendingReply);
        await sendReply(ctx, pendingReply);
        return true;
      }
    }

    const pollCommand = POLL_OPTION_TO_COMMAND[trimmed];
    const command = pollCommand ?? KEYWORD_ALIASES[normalized];

    let reply = "";
    let resolvedCommand: string | undefined = command;

    if (command) {
      reply = await handleKeywordCommand(ctx, command);
    } else if (shouldTriggerAI(normalized)) {
      resolvedCommand = undefined;
      reply = await handleSharedAssistant(ctx, trimmed);
    } else {
      return true;
    }

    await persistTurn(ctx, trimmed, reply);
    await sendReply(ctx, reply);

    if (resolvedCommand) {
      sendFollowUpPoll(instanceName, groupJid, resolvedCommand);
    }

    return true;
  } catch (error) {
    logError("[assistant-commands] command failed", error, {
      organizationId: ctx.orgId,
      sessionId: ctx.sessionId,
    });
    const errorReply = "Something went wrong. Try again, or reply *brief* to reload your agenda.";
    await persistTurn(ctx, trimmed, errorReply);
    await sendReply(ctx, errorReply);
    return true;
  }
}
