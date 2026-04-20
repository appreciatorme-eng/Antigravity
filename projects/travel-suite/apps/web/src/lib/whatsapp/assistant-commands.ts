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
  ActionResult,
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
  getSessionContextSnapshot,
  getOrCreateSession,
  getPendingAction,
  setPendingAction,
  updateSessionContextSnapshot,
  updateSessionHistory,
  type PendingAction,
  type SessionReferenceItem,
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
import { logError, logWarn, logEvent } from "@/lib/observability/logger";
import { POLL_OPTION_TO_COMMAND, sendFollowUpPoll } from "./assistant-polls";
import { handleTripIntakeMessage } from "./trip-intake.server";
import {
  normalizeAssistantGroupJid,
  resolveAssistantGroupConnection,
  type AssistantGroupConnectionCandidate,
} from "./assistant-group-context";

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

interface CommandReply {
  readonly reply: string;
  readonly references?: {
    readonly kind: string;
    readonly items: readonly SessionReferenceItem[];
  };
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
  "followups": "followups",
  "followup": "followups",
  "next": "followups",
  "collections": "collections",
  "collection": "collections",
  "cash": "collections",
  "work": "work",
  "tasks": "work",
  "task": "work",
  "promises": "promises",
  "promise": "promises",
  "handoff": "handoff",
  "commercial": "handoff",
  "approvals": "approvals",
  "approval": "approvals",
  "trip check": "trip_check",
  "trip check today": "trip_check",
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

async function saveLoopReferences(
  ctx: CommandContext,
  references?: CommandReply["references"],
): Promise<void> {
  await updateSessionContextSnapshot(
    ctx.actionCtx,
    ctx.sessionId,
    references
      ? {
          operatorLoop: {
            kind: references.kind,
            items: [...references.items],
            updatedAt: new Date().toISOString(),
          },
        }
      : null,
  ).catch((error) => {
    logError("[assistant-commands] failed to persist operator loop references", error, {
      sessionId: ctx.sessionId,
      organizationId: ctx.orgId,
    });
  });
}

async function getLoopItem(
  ctx: CommandContext,
  expectedKind: string,
  index: number | null,
): Promise<SessionReferenceItem | null> {
  const snapshot = await getSessionContextSnapshot(ctx.actionCtx, ctx.sessionId);
  const operatorLoop = snapshot?.operatorLoop;
  if (!operatorLoop || operatorLoop.kind !== expectedKind || operatorLoop.items.length === 0) {
    return null;
  }

  const resolvedIndex = index ?? 1;
  if (resolvedIndex < 1 || resolvedIndex > operatorLoop.items.length) {
    return null;
  }

  return operatorLoop.items[resolvedIndex - 1] ?? null;
}

async function executeRegisteredAction(
  ctx: CommandContext,
  actionName: string,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const action = findAction(actionName);
  if (!action) {
    return {
      success: false,
      message: `Action "${actionName}" is not available.`,
    };
  }

  return action.execute(ctx.actionCtx, params);
}

function parseIndexCommand(
  input: string,
  keyword: string,
): number | null {
  const match = new RegExp(`^${keyword}\\s+(\\d+)$`, "i").exec(input.trim());
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSnoozeCommand(input: string): { readonly index: number | null; readonly days: number | null; readonly dueText: string | null } | null {
  const trimmed = input.trim();
  if (!/^snooze\b/i.test(trimmed)) return null;
  const tokens = trimmed.split(/\s+/).slice(1);
  if (tokens.length === 0) return null;

  if (
    tokens.length >= 3 &&
    /^\d+$/.test(tokens[0]) &&
    !/^(day|days|week|weeks)$/i.test(tokens[1])
  ) {
    const index = Number.parseInt(tokens[0], 10);
    const rest = tokens.slice(1).join(" ");
    const dayMatch = /^(\d+)\s+days?$/i.exec(rest);
    return {
      index,
      days: dayMatch ? Number.parseInt(dayMatch[1], 10) : null,
      dueText: dayMatch ? null : rest,
    };
  }

  const rest = tokens.join(" ");
  const dayMatch = /^(\d+)\s+days?$/i.exec(rest);
  return {
    index: null,
    days: dayMatch ? Number.parseInt(dayMatch[1], 10) : null,
    dueText: dayMatch ? null : rest,
  };
}

function parsePromiseCommand(input: string): { readonly index: number | null; readonly dueText: string } | null {
  const trimmed = input.trim();
  if (!/^payment promised\b/i.test(trimmed)) return null;
  const tokens = trimmed.split(/\s+/).slice(2);
  if (tokens.length === 0) return null;

  if (tokens.length >= 2 && /^\d+$/.test(tokens[0]) && !/^(day|days|week|weeks)$/i.test(tokens[1])) {
    return {
      index: Number.parseInt(tokens[0], 10),
      dueText: tokens.slice(1).join(" "),
    };
  }

  return {
    index: null,
    dueText: tokens.join(" "),
  };
}

function parseCreateTaskCommand(input: string): string | null {
  const match = /^create task\s+(.+)$/i.exec(input.trim());
  return match?.[1]?.trim() ?? null;
}

function parseArtifactCommand(
  input: string,
  prefix: string,
): { readonly index: number | null; readonly query: string | null } | null {
  const trimmed = input.trim();
  const exactPrefix = new RegExp(`^${prefix}$`, "i");
  if (exactPrefix.test(trimmed)) {
    return { index: null, query: null };
  }

  const indexMatch = new RegExp(`^${prefix}\\s+(\\d+)$`, "i").exec(trimmed);
  if (indexMatch) {
    return {
      index: Number.parseInt(indexMatch[1], 10),
      query: null,
    };
  }

  const forMatch = new RegExp(`^${prefix}\\s+for\\s+(.+)$`, "i").exec(trimmed);
  if (forMatch) {
    return { index: null, query: forMatch[1].trim() };
  }

  const freeMatch = new RegExp(`^${prefix}\\s+(.+)$`, "i").exec(trimmed);
  if (freeMatch) {
    return { index: null, query: freeMatch[1].trim() };
  }

  return null;
}

async function resolveProposalIdFromQuery(
  ctx: CommandContext,
  query: string,
): Promise<string | null> {
  const lowered = query.trim().toLowerCase();
  if (!lowered) return null;

  const { data } = await ctx.admin
    .from("proposals")
    .select(
      "id, title, clients!proposals_client_id_fkey(profiles!clients_id_fkey(full_name)), tour_templates(destination)",
    )
    .eq("organization_id", ctx.orgId)
    .order("updated_at", { ascending: false })
    .limit(25);

  const rows = (data ?? []) as Array<{
    id: string;
    title: string | null;
    clients:
      | { profiles: { full_name: string | null } | null }
      | null;
    tour_templates:
      | { destination: string | null }
      | { destination: string | null }[]
      | null;
  }>;

  const match = rows.find((row) => {
    const destination = Array.isArray(row.tour_templates)
      ? row.tour_templates[0]?.destination ?? null
      : row.tour_templates?.destination ?? null;
    const haystack = [
      row.title ?? "",
      row.clients?.profiles?.full_name ?? "",
      destination ?? "",
    ].join(" ").toLowerCase();
    return haystack.includes(lowered);
  });

  return match?.id ?? null;
}

async function resolveTripIdFromQuery(
  ctx: CommandContext,
  query: string,
): Promise<string | null> {
  const lowered = query.trim().toLowerCase();
  if (!lowered) return null;

  const { data } = await ctx.admin
    .from("trips")
    .select("id, name, destination, profiles!trips_client_id_fkey(full_name)")
    .eq("organization_id", ctx.orgId)
    .order("updated_at", { ascending: false })
    .limit(25);

  const rows = (data ?? []) as Array<{
    id: string;
    name: string | null;
    destination: string | null;
    profiles: { full_name: string | null } | null;
  }>;

  const match = rows.find((row) => {
    const haystack = [
      row.name ?? "",
      row.destination ?? "",
      row.profiles?.full_name ?? "",
    ].join(" ").toLowerCase();
    return haystack.includes(lowered);
  });

  return match?.id ?? null;
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
  return `${formatOwnerAgenda(agenda)}\n\nReply *handoff*, *followups*, *collections*, *work*, *promises*, *approvals*, *trip check today*, *today*, *payments*, *leads*, or tell me what you want to change.`;
}

async function handleTodayCommand(ctx: CommandContext): Promise<string> {
  const snapshot = await getSnapshot(ctx);
  return formatTripsToday(snapshot.todayTrips);
}

async function handlePaymentsCommand(ctx: CommandContext): Promise<string> {
  const snapshot = await getSnapshot(ctx);
  return formatPendingPayments(snapshot.pendingInvoices);
}

async function handleOperatorListCommand(
  ctx: CommandContext,
  actionName:
    | "list_due_followups"
    | "review_overdue_accounts"
    | "list_open_work_items"
    | "list_breached_commitments"
    | "list_handoff_queue"
    | "list_pending_approvals"
    | "check_trip_readiness",
  params: Record<string, unknown>,
  kind: string,
): Promise<CommandReply> {
  const result = await executeRegisteredAction(ctx, actionName, params);
  const items =
    result.success &&
    result.data &&
    typeof result.data === "object" &&
    Array.isArray((result.data as { items?: unknown }).items)
      ? (((result.data as { items: Array<{ id: string; label: string; metadata?: Record<string, unknown> }> }).items) ?? [])
      : [];

  return {
    reply: result.message,
    references: {
      kind,
      items: items.map((item) => ({
        id: item.id,
        label: item.label,
        metadata: item.metadata,
      })),
    },
  };
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
): Promise<CommandReply> {
  switch (command) {
    case "help":
    case "brief":
      return { reply: await handleAgendaCommand(ctx) };
    case "today":
      return { reply: await handleTodayCommand(ctx) };
    case "leads":
      return { reply: await handleLeadsCommand(ctx) };
    case "payments":
      return { reply: await handlePaymentsCommand(ctx) };
    case "revenue":
      return { reply: await handleRevenueCommand(ctx) };
    case "stats":
      return { reply: await handleStatsCommand(ctx) };
    case "followups":
      return handleOperatorListCommand(ctx, "list_due_followups", { limit: 5 }, "followups");
    case "collections":
      return handleOperatorListCommand(ctx, "review_overdue_accounts", { limit: 5 }, "collections");
    case "work":
      return handleOperatorListCommand(ctx, "list_open_work_items", { limit: 5 }, "work");
    case "promises":
      return handleOperatorListCommand(ctx, "list_breached_commitments", { limit: 5 }, "promises");
    case "handoff":
      return handleOperatorListCommand(ctx, "list_handoff_queue", { limit: 5 }, "handoff");
    case "approvals":
      return handleOperatorListCommand(ctx, "list_pending_approvals", { limit: 5 }, "approvals");
    case "trip_check":
      return handleOperatorListCommand(ctx, "check_trip_readiness", { scope: "today", limit: 5 }, "trip_check");
    default:
      return { reply: await handleAgendaCommand(ctx) };
  }
}

async function proposeAction(
  ctx: CommandContext,
  actionName: string,
  params: Record<string, unknown>,
  confirmationMessage: string,
): Promise<CommandReply> {
  await setPendingAction(ctx.actionCtx, ctx.sessionId, {
    actionName,
    params,
    confirmationMessage,
    proposedAt: new Date().toISOString(),
  });

  return {
    reply: `${confirmationMessage}\n\n_Reply *YES* to confirm or *NO* to cancel._`,
  };
}

async function handleIndexedOperatorCommand(
  ctx: CommandContext,
  input: string,
): Promise<CommandReply | null> {
  const doneIndex = parseIndexCommand(input, "done");
  if (doneIndex !== null) {
    const item = await getLoopItem(ctx, "work", doneIndex);
    if (!item) {
      return { reply: "I don't have that work item in the current queue. Reply *work* to reload it." };
    }

    return proposeAction(
      ctx,
      "complete_work_item",
      { work_item_id: item.id },
      `Mark *${item.label}* as done?`,
    );
  }

  const resolveIndex = parseIndexCommand(input, "resolve");
  if (resolveIndex !== null) {
    const item = await getLoopItem(ctx, "promises", resolveIndex);
    if (!item) {
      return { reply: "I don't have that promise in the current queue. Reply *promises* to reload it." };
    }

    return proposeAction(
      ctx,
      "resolve_commitment",
      { commitment_id: item.id },
      `Mark *${item.label}* as resolved?`,
    );
  }

  const approveIndex = parseIndexCommand(input, "approve");
  if (approveIndex !== null) {
    const item = await getLoopItem(ctx, "approvals", approveIndex);
    if (!item) {
      return { reply: "I don't have that approval in the current queue. Reply *approvals* to reload it." };
    }

    return proposeAction(
      ctx,
      "approve_draft",
      { approval_id: item.id },
      `Approve *${item.label}*?`,
    );
  }

  const rejectIndex = parseIndexCommand(input, "reject");
  if (rejectIndex !== null) {
    const item = await getLoopItem(ctx, "approvals", rejectIndex);
    if (!item) {
      return { reply: "I don't have that approval in the current queue. Reply *approvals* to reload it." };
    }

    return proposeAction(
      ctx,
      "reject_draft",
      { approval_id: item.id },
      `Reject *${item.label}*?`,
    );
  }

  const sendPaymentLinkMatch = /^send payment link(?:\s+(\d+))?$/i.exec(input.trim());
  if (sendPaymentLinkMatch) {
    const index = sendPaymentLinkMatch[1] ? Number.parseInt(sendPaymentLinkMatch[1], 10) : null;
    const item = await getLoopItem(ctx, "collections", index);
    if (!item?.metadata?.invoice_id) {
      return { reply: "I don't have an overdue invoice selected. Reply *collections* to reload the queue." };
    }

    return proposeAction(
      ctx,
      "send_payment_link",
      { invoice_id: item.metadata.invoice_id },
      `Send a payment link for *${item.label}*?`,
    );
  }

  const paymentPromise = parsePromiseCommand(input);
  if (paymentPromise) {
    const item = await getLoopItem(ctx, "collections", paymentPromise.index);
    if (!item?.metadata?.client_id || !item.metadata.amount_inr) {
      return { reply: "I don't have a collections item selected. Reply *collections* to reload the queue." };
    }

    return proposeAction(
      ctx,
      "record_payment_promise",
      {
        client_id: item.metadata.client_id,
        amount_inr: item.metadata.amount_inr,
        due_date: paymentPromise.dueText,
        note: `Recorded from WhatsApp assistant for ${item.label}`,
      },
      `Record a payment promise for *${item.label}* due *${paymentPromise.dueText}*?`,
    );
  }

  const snoozeCommand = parseSnoozeCommand(input);
  if (snoozeCommand) {
    const item = await getLoopItem(ctx, "followups", snoozeCommand.index);
    if (!item) {
      return { reply: "I don't have that follow-up in the current queue. Reply *followups* to reload it." };
    }

    const clientId =
      typeof item.metadata?.client_id === "string" ? item.metadata.client_id : null;
    if (!clientId) {
      return { reply: "That follow-up cannot be snoozed yet because it is missing a client reference." };
    }

    return proposeAction(
      ctx,
      "snooze_followup",
      {
        followup_id:
          typeof item.metadata?.source === "string" && item.metadata.source === "comms_sequence"
            ? item.id
            : undefined,
        client_id: clientId,
        days: snoozeCommand.days ?? undefined,
        follow_up_at: snoozeCommand.dueText ?? undefined,
      },
      `Snooze *${item.label}*?`,
    );
  }

  const sentMatch = /^sent(?:\s+(\d+))?$/i.exec(input.trim());
  if (sentMatch) {
    const index = sentMatch[1] ? Number.parseInt(sentMatch[1], 10) : null;
    const item = await getLoopItem(ctx, "followups", index);
    if (!item?.metadata?.client_id) {
      return { reply: "I don't have a follow-up selected. Reply *followups* to reload the queue." };
    }

    return proposeAction(
      ctx,
      "send_followup_message",
      {
        client_id: item.metadata.client_id,
        message: `Hi ${typeof item.metadata.client_name === "string" ? item.metadata.client_name : "there"}, just following up from TripBuilt. Let me know if you want me to tighten anything for you.`,
      },
      `Send a follow-up to *${item.label}*?`,
    );
  }

  const clientRepliedMatch = /^client replied(?:\s+(\d+))?$/i.exec(input.trim());
  if (clientRepliedMatch) {
    const index = clientRepliedMatch[1] ? Number.parseInt(clientRepliedMatch[1], 10) : null;
    const item = await getLoopItem(ctx, "followups", index);
    if (!item?.metadata?.client_id) {
      return { reply: "I don't have a follow-up selected. Reply *followups* to reload the queue." };
    }

    return proposeAction(
      ctx,
      "mark_followup_outcome",
      {
        client_id: item.metadata.client_id,
        followup_id: typeof item.metadata?.source === "string" && item.metadata.source === "comms_sequence" ? item.id : undefined,
        outcome: "replied",
      },
      `Mark *${item.label}* as replied?`,
    );
  }

  const notInterestedMatch = /^not interested(?:\s+(\d+))?$/i.exec(input.trim());
  if (notInterestedMatch) {
    const index = notInterestedMatch[1] ? Number.parseInt(notInterestedMatch[1], 10) : null;
    const item = await getLoopItem(ctx, "followups", index);
    if (!item?.metadata?.client_id) {
      return { reply: "I don't have a follow-up selected. Reply *followups* to reload the queue." };
    }

    return proposeAction(
      ctx,
      "mark_followup_outcome",
      {
        client_id: item.metadata.client_id,
        followup_id: typeof item.metadata?.source === "string" && item.metadata.source === "comms_sequence" ? item.id : undefined,
        outcome: "not_interested",
      },
      `Mark *${item.label}* as not interested?`,
    );
  }

  const createTaskText = parseCreateTaskCommand(input);
  if (createTaskText) {
    const dueMatch = /(tomorrow|today|next\s+\w+|\d{4}-\d{2}-\d{2})$/i.exec(createTaskText);
    const dueDate = dueMatch?.[1] ?? "tomorrow";
    const title = dueMatch ? createTaskText.slice(0, dueMatch.index).trim() : createTaskText;
    return proposeAction(
      ctx,
      "create_work_item",
      { title, due_date: dueDate },
      `Create task *${title}* due *${dueDate}*?`,
    );
  }

  const handoffCommand = KEYWORD_ALIASES[input.trim().toLowerCase()];
  if (handoffCommand === "handoff") {
    return handleOperatorListCommand(ctx, "list_handoff_queue", { limit: 5 }, "handoff");
  }

  const sendProposalCommand = parseArtifactCommand(input, "send proposal");
  if (sendProposalCommand) {
    let proposalId: string | null = null;

    if (sendProposalCommand.query) {
      proposalId = await resolveProposalIdFromQuery(ctx, sendProposalCommand.query);
    } else {
      const item = await getLoopItem(ctx, "handoff", sendProposalCommand.index);
      if (item?.metadata?.artifact_type === "proposal" && typeof item.metadata.proposal_id === "string") {
        proposalId = item.metadata.proposal_id;
      }
    }

    if (!proposalId) {
      return { reply: "I couldn't find that proposal. Reply *handoff* first, or say *send proposal for Rahul*." };
    }

    return proposeAction(
      ctx,
      "send_proposal_artifact",
      { proposal_id: proposalId, include_pdf: true },
      `Send the proposal package on WhatsApp now?`,
    );
  }

  const resendProposalCommand = parseArtifactCommand(input, "resend proposal");
  if (resendProposalCommand) {
    let proposalId: string | null = null;
    let clientId: string | null = null;

    if (resendProposalCommand.query) {
      proposalId = await resolveProposalIdFromQuery(ctx, resendProposalCommand.query);
    } else {
      const item = await getLoopItem(ctx, "handoff", resendProposalCommand.index);
      if (item?.metadata?.artifact_type === "proposal") {
        proposalId = typeof item.metadata.proposal_id === "string" ? item.metadata.proposal_id : null;
        clientId = typeof item.metadata.client_id === "string" ? item.metadata.client_id : null;
      }
    }

    if (!proposalId && !clientId) {
      return { reply: "I couldn't find that proposal to resend. Reply *handoff* first, or say *resend proposal for Rahul*." };
    }

    return proposeAction(
      ctx,
      "resend_last_artifact",
      proposalId
        ? { proposal_id: proposalId, artifact_type: "proposal" }
        : { client_id: clientId, artifact_type: "proposal" },
      "Resend the latest proposal package on WhatsApp?",
    );
  }

  const sendItineraryCommand = parseArtifactCommand(input, "send itinerary");
  if (sendItineraryCommand) {
    let tripId: string | null = null;

    if (sendItineraryCommand.query) {
      tripId = await resolveTripIdFromQuery(ctx, sendItineraryCommand.query);
    } else {
      const handoffItem = await getLoopItem(ctx, "handoff", sendItineraryCommand.index);
      if (handoffItem?.metadata?.artifact_type === "itinerary" && typeof handoffItem.metadata.trip_id === "string") {
        tripId = handoffItem.metadata.trip_id;
      } else {
        const tripItem = await getLoopItem(ctx, "trip_check", sendItineraryCommand.index);
        if (tripItem?.id) {
          tripId = tripItem.id;
        }
      }
    }

    if (!tripId) {
      return { reply: "I couldn't find that itinerary. Reply *handoff* or *trip check today* first, or say *send itinerary for Bali trip*." };
    }

    return proposeAction(
      ctx,
      "send_trip_share_link",
      { trip_id: tripId },
      "Send the itinerary share link on WhatsApp now?",
    );
  }

  const clientWantsChangesMatch = /^client wants changes(?:\s+(\d+))?(?:\s+(.+))?$/i.exec(input.trim());
  if (clientWantsChangesMatch) {
    const index = clientWantsChangesMatch[1] ? Number.parseInt(clientWantsChangesMatch[1], 10) : null;
    const revisionNote = clientWantsChangesMatch[2]?.trim() || "Client requested changes";
    const item = await getLoopItem(ctx, "handoff", index);
    if (!item) {
      return { reply: "I don't have that handoff item selected. Reply *handoff* to reload the queue." };
    }

    return proposeAction(
      ctx,
      "record_revision_request",
      {
        client_id: typeof item.metadata?.client_id === "string" ? item.metadata.client_id : undefined,
        trip_id: typeof item.metadata?.trip_id === "string" ? item.metadata.trip_id : undefined,
        proposal_id: typeof item.metadata?.proposal_id === "string" ? item.metadata.proposal_id : undefined,
        revision_note: revisionNote,
      },
      `Record revision request for *${item.label}*?`,
    );
  }

  const reviseMatch = /^revise\s+(.+)$/i.exec(input.trim());
  if (reviseMatch) {
    const query = reviseMatch[1].trim();
    const proposalId = await resolveProposalIdFromQuery(ctx, query);
    const tripId = proposalId ? null : await resolveTripIdFromQuery(ctx, query);

    if (!proposalId && !tripId) {
      return { reply: `I couldn't find a proposal or trip matching *${query}*.` };
    }

    return proposeAction(
      ctx,
      "record_revision_request",
      {
        proposal_id: proposalId ?? undefined,
        trip_id: tripId ?? undefined,
        revision_note: `Revision requested from WhatsApp: ${query}`,
      },
      `Record a revision request for *${query}*?`,
    );
  }

  const shareLinkMatch = /^share link(?:\s+for)?\s+(.+)$/i.exec(input.trim());
  if (shareLinkMatch) {
    const query = shareLinkMatch[1].trim();
    const readiness = await executeRegisteredAction(ctx, "check_trip_readiness", {
      scope: "upcoming",
      query,
      limit: 1,
    });
    const items =
      readiness.success &&
      readiness.data &&
      typeof readiness.data === "object" &&
      Array.isArray((readiness.data as { items?: unknown }).items)
        ? ((readiness.data as { items: Array<{ id: string }> }).items ?? [])
        : [];

    const tripId = items[0]?.id;
    if (!tripId) {
      return { reply: `I couldn't find a trip matching *${query}*.` };
    }

    const result = await executeRegisteredAction(ctx, "resend_trip_share_link", {
      trip_id: tripId,
    });
    return { reply: result.message };
  }

  const pickupMatch = /^send pickup details(?:\s+(\d+))?$/i.exec(input.trim());
  if (pickupMatch) {
    const index = pickupMatch[1] ? Number.parseInt(pickupMatch[1], 10) : null;
    const item = await getLoopItem(ctx, "trip_check", index);
    if (!item) {
      return { reply: "I don't have a trip selected. Reply *trip check today* to reload the trip queue." };
    }

    return proposeAction(
      ctx,
      "send_pickup_details",
      { trip_id: item.id },
      `Send pickup details for *${item.label}*?`,
    );
  }

  return null;
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

    let commandReply: CommandReply = { reply: "" };
    let resolvedCommand: string | undefined = command;

    if (command) {
      commandReply = await handleKeywordCommand(ctx, command);
    } else {
      const indexedReply = await handleIndexedOperatorCommand(ctx, trimmed);
      if (indexedReply) {
        resolvedCommand = undefined;
        commandReply = indexedReply;
      } else {
      const tripIntakeReply = await handleTripIntakeMessage(ctx.actionCtx, trimmed);
      if (tripIntakeReply) {
        resolvedCommand = undefined;
        commandReply = { reply: tripIntakeReply };
      } else if (shouldTriggerAI(normalized)) {
        resolvedCommand = undefined;
        commandReply = { reply: await handleSharedAssistant(ctx, trimmed) };
      } else {
        return true;
      }
      }
    }

    await saveLoopReferences(ctx, commandReply.references);
    await persistTurn(ctx, trimmed, commandReply.reply);
    await sendReply(ctx, commandReply.reply);

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
