import "server-only";

import { isFeatureEnabled } from "@/lib/platform/settings";
import { logError, logEvent } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardedSendText } from "@/lib/whatsapp-evolution.server";
import {
  DEFAULT_WHATSAPP_CUSTOMER_REPLY_MODE,
  getWhatsAppCustomerReplyMode,
  type WhatsAppCustomerReplyMode,
} from "@/lib/whatsapp/first-contact-welcome.server";
import {
  buildTripRequestFormUrl,
  findLatestTripRequestForPhone,
  type TripRequestCustomerDraft,
} from "@/lib/whatsapp/trip-intake.server";
import { notifyCustomerAssistantHandoff } from "@/lib/whatsapp/assistant-notifications";
import type { Database, Json } from "@/lib/database.types";

export type ChatbotState =
  | "new_contact"
  | "welcome_sent"
  | "awaiting_form_completion"
  | "form_submitted"
  | "operator_handoff";

export type ChatbotSessionSummary = {
  id: string;
  state: ChatbotState;
  aiReplyCount: number;
  updatedAt: string;
  proposalDraftId?: string | null;
  proposalDraftStatus?: string | null;
};

type ChatbotSessionRow = Database["public"]["Tables"]["whatsapp_chatbot_sessions"]["Row"];

type ChatbotContext = {
  draftId: string | null;
  formToken: string | null;
  formUrl: string | null;
  lastAutoReplyType: "welcome" | "reminder" | "completion" | null;
  operatorNotifiedAt: string | null;
};

type ProcessChatbotMessageArgs = {
  phone: string;
  incomingMessage: string;
  organizationId: string;
};

type ProcessChatbotMessageResult = {
  reply: string | null;
  sessionId: string;
  state: ChatbotState;
  aiReplyCount: number;
  shouldHandOff: boolean;
};

type CustomerFlowUpdateArgs = {
  organizationId: string;
  phone: string;
  state: ChatbotState;
  draftId?: string | null;
  formToken?: string | null;
  incrementReplyCount?: boolean;
  lastAutoReplyType?: ChatbotContext["lastAutoReplyType"];
  operatorNotifiedAt?: string | null;
};

type ProfileRoleLookup = {
  id: string;
  role: string | null;
};

const RECENT_HUMAN_REPLY_WINDOW_MS = 10 * 60 * 1000;
const CHATBOT_SESSION_SELECT = [
  "ai_reply_count",
  "context",
  "handed_off_at",
  "id",
  "organization_id",
  "phone",
  "state",
  "updated_at",
].join(", ");

const REMINDER_PHRASES = new Set([
  "ok",
  "okay",
  "thanks",
  "thank you",
  "sure",
  "received",
  "got it",
  "will do",
  "done",
  "filled",
  "submitted",
  "submit",
  "form",
  "link",
  "details",
  "open link",
  "share link",
  "send link",
]);

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `+${digits}` : phone;
}

function phoneCandidates(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return Array.from(new Set([digits, digits ? `+${digits}` : null].filter(Boolean))) as string[];
}

function parseContext(value: unknown): ChatbotContext {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      draftId: null,
      formToken: null,
      formUrl: null,
      lastAutoReplyType: null,
      operatorNotifiedAt: null,
    };
  }

  const raw = value as Record<string, unknown>;
  return {
    draftId: typeof raw.draftId === "string" ? raw.draftId : null,
    formToken: typeof raw.formToken === "string" ? raw.formToken : null,
    formUrl: typeof raw.formUrl === "string" ? raw.formUrl : null,
    lastAutoReplyType:
      raw.lastAutoReplyType === "welcome"
      || raw.lastAutoReplyType === "reminder"
      || raw.lastAutoReplyType === "completion"
        ? raw.lastAutoReplyType
        : null,
    operatorNotifiedAt: typeof raw.operatorNotifiedAt === "string" ? raw.operatorNotifiedAt : null,
  };
}

function buildContextPatch(
  current: ChatbotContext,
  draft: TripRequestCustomerDraft | null,
  overrides?: {
    lastAutoReplyType?: ChatbotContext["lastAutoReplyType"];
    operatorNotifiedAt?: string | null;
  },
): ChatbotContext {
  const formToken = draft?.formToken ?? current.formToken;
  return {
    draftId: draft?.id ?? current.draftId,
    formToken,
    formUrl: formToken ? buildTripRequestFormUrl(formToken) : current.formUrl,
    lastAutoReplyType: overrides?.lastAutoReplyType ?? current.lastAutoReplyType,
    operatorNotifiedAt:
      overrides?.operatorNotifiedAt !== undefined
        ? overrides.operatorNotifiedAt
        : current.operatorNotifiedAt,
  } satisfies ChatbotContext;
}

function normalizeStoredState(
  state: string | null | undefined,
  draft: TripRequestCustomerDraft | null,
): ChatbotState {
  switch (state) {
    case "new_contact":
    case "welcome_sent":
    case "awaiting_form_completion":
    case "form_submitted":
    case "operator_handoff":
      return state;
    case "handed_off":
    case "proposal_ready":
      return "operator_handoff";
    case "qualifying":
      return draft?.status === "completed" ? "form_submitted" : "awaiting_form_completion";
    case "new":
    default:
      if (draft?.status === "completed") {
        return "form_submitted";
      }
      if (draft) {
        return "awaiting_form_completion";
      }
      return "new_contact";
  }
}

function buildReminderReply(formUrl: string): string {
  return [
    "Please use this secure trip form to share your travel details.",
    formUrl,
    "",
    "Once it is submitted, our travel team will prepare your trip and share the final link back on WhatsApp.",
  ].join("\n");
}

function buildCompletionReply(): string {
  return "Thanks. Your trip request is complete and our travel team will follow up shortly.";
}

function shouldSendReminder(message: string): boolean {
  const normalized = message.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return false;
  if (REMINDER_PHRASES.has(normalized)) return true;
  if (normalized.length <= 24 && /^(hi|hello|hey)$/.test(normalized)) return true;

  return /(form|link|submit|submitted|fill|filled|details|open|working|issue|problem|share|send)/i.test(normalized);
}

async function getOrCreateChatbotSession(
  phone: string,
  organizationId: string,
): Promise<ChatbotSessionRow> {
  const admin = createAdminClient();
  const normalizedPhone = normalizePhone(phone);

  const { data: existing, error: selectError } = await admin
    .from("whatsapp_chatbot_sessions")
    .select(CHATBOT_SESSION_SELECT)
    .eq("organization_id", organizationId)
    .eq("phone", normalizedPhone)
    .maybeSingle();
  const existingSession = existing as unknown as ChatbotSessionRow | null;

  if (selectError) {
    throw selectError;
  }

  if (existingSession) {
    return existingSession;
  }

  const now = new Date().toISOString();
  const { data: created, error: insertError } = await admin
    .from("whatsapp_chatbot_sessions")
    .insert({
      organization_id: organizationId,
      phone: normalizedPhone,
      state: "new_contact",
      last_message_at: now,
      context: {
        draftId: null,
        formToken: null,
        formUrl: null,
        lastAutoReplyType: null,
        operatorNotifiedAt: null,
      },
    })
    .select(CHATBOT_SESSION_SELECT)
    .single();
  const createdSession = created as unknown as ChatbotSessionRow | null;

  if (insertError) {
    throw insertError;
  }

  if (!createdSession) {
    throw new Error("Failed to create chatbot session");
  }

  return createdSession;
}

async function updateCustomerFlowSession(
  args: CustomerFlowUpdateArgs,
): Promise<void> {
  const admin = createAdminClient();
  const normalizedPhone = normalizePhone(args.phone);
  const session = await getOrCreateChatbotSession(normalizedPhone, args.organizationId);
  const currentContext = parseContext(session.context);
  const draft =
    args.draftId
      ? await findLatestTripRequestForPhone(args.organizationId, normalizedPhone).catch(() => null)
      : null;
  const now = new Date().toISOString();
  const nextReplyCount = session.ai_reply_count + (args.incrementReplyCount ? 1 : 0);

  await admin
    .from("whatsapp_chatbot_sessions")
    .update({
      state: args.state,
      context: buildContextPatch(currentContext, draft, {
        lastAutoReplyType: args.lastAutoReplyType,
        operatorNotifiedAt: args.operatorNotifiedAt,
      }),
      ai_reply_count: nextReplyCount,
      last_message_at: now,
      last_ai_reply_at: args.incrementReplyCount ? now : session.last_ai_reply_at,
      handed_off_at: args.state === "operator_handoff" ? now : session.handed_off_at,
      updated_at: now,
    })
    .eq("id", session.id);
}

export async function markCustomerFlowWelcomeSent(args: {
  organizationId: string;
  phone: string;
  draftId: string;
  formToken: string;
}): Promise<void> {
  await updateCustomerFlowSession({
    organizationId: args.organizationId,
    phone: args.phone,
    state: "welcome_sent",
    draftId: args.draftId,
    formToken: args.formToken,
    incrementReplyCount: true,
    lastAutoReplyType: "welcome",
  });
}

export async function markCustomerFlowFormSubmitted(args: {
  organizationId: string;
  phone: string;
  draftId: string;
  formToken: string;
}): Promise<void> {
  await updateCustomerFlowSession({
    organizationId: args.organizationId,
    phone: args.phone,
    state: "form_submitted",
    draftId: args.draftId,
    formToken: args.formToken,
    lastAutoReplyType: "completion",
  });
}

async function markOperatorHandoff(args: {
  organizationId: string;
  phone: string;
  session: ChatbotSessionRow;
  draft: TripRequestCustomerDraft | null;
  incomingMessage: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const context = parseContext(args.session.context);
  await createAdminClient()
    .from("whatsapp_chatbot_sessions")
    .update({
      state: "operator_handoff",
      context: buildContextPatch(context, args.draft, {
        operatorNotifiedAt: now,
      }),
      handed_off_at: now,
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", args.session.id);

  await notifyCustomerAssistantHandoff(
    args.organizationId,
    args.phone,
    args.incomingMessage,
    args.draft?.formToken ? buildTripRequestFormUrl(args.draft.formToken) : null,
  ).catch((error) => {
    logError("[whatsapp/chatbot-flow] failed to notify operator about customer handoff", error, {
      organizationId: args.organizationId,
      phone: args.phone,
    });
  });

  logEvent("info", "[whatsapp/chatbot-flow] operator handoff triggered", {
    organizationId: args.organizationId,
    phone: args.phone,
    draftId: args.draft?.id ?? null,
  });
}

export async function isWhatsAppChatbotEnabled() {
  return isFeatureEnabled("whatsapp_enabled");
}

export async function findInternalWhatsAppProfile(
  organizationId: string,
  phone: string,
) {
  const admin = createAdminClient();
  const candidates = phoneCandidates(phone);

  const { data, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("organization_id", organizationId)
    .in("phone_normalized", candidates)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ProfileRoleLookup | null) ?? null;
}

export async function hasRecentHumanReply(
  sessionName: string,
  waId: string,
) {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - RECENT_HUMAN_REPLY_WINDOW_MS).toISOString();
  const { data, error } = await admin
    .from("whatsapp_webhook_events")
    .select("received_at, metadata")
    .eq("wa_id", waId)
    .filter("metadata->>session", "eq", sessionName)
    .filter("metadata->>direction", "eq", "out")
    .gte("received_at", cutoff)
    .order("received_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return (data || []).some((row) => {
    const metadata =
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null;
    return typeof metadata?.sent_by === "string" && metadata.sent_by.trim().length > 0;
  });
}

export async function getChatbotSessionsForPhones(
  organizationId: string,
  phones: string[],
) {
  const admin = createAdminClient();
  const normalizedPhones = Array.from(
    new Set(phones.map((phone) => normalizePhone(phone)).filter(Boolean)),
  );

  if (normalizedPhones.length === 0) {
    return new Map<string, ChatbotSessionSummary>();
  }

  const { data, error } = await admin
    .from("whatsapp_chatbot_sessions")
    .select("id, phone, state, ai_reply_count, updated_at")
    .eq("organization_id", organizationId)
    .in("phone", normalizedPhones);

  if (error) {
    throw error;
  }

  return new Map(
    (data || []).map((row) => [
      row.phone,
      {
        id: row.id,
        state: normalizeStoredState(row.state, null),
        aiReplyCount: row.ai_reply_count,
        updatedAt: row.updated_at,
        proposalDraftId: null,
        proposalDraftStatus: null,
      },
    ]),
  );
}

export async function markChatbotSessionHandedOff(args: {
  sessionId: string;
  organizationId: string;
}) {
  const admin = createAdminClient();
  const handoffTime = new Date().toISOString();

  const { data, error } = await admin
    .from("whatsapp_chatbot_sessions")
    .update({
      state: "operator_handoff",
      handed_off_at: handoffTime,
      updated_at: handoffTime,
    })
    .eq("id", args.sessionId)
    .eq("organization_id", args.organizationId)
    .select("id, phone, state, ai_reply_count, updated_at")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        id: data.id,
        state: normalizeStoredState(data.state, null),
        aiReplyCount: data.ai_reply_count,
        updatedAt: data.updated_at,
      }
    : null;
}

async function resolveReplyMode(
  organizationId: string,
): Promise<WhatsAppCustomerReplyMode> {
  try {
    return await getWhatsAppCustomerReplyMode(organizationId);
  } catch (error) {
    logError("[whatsapp/chatbot-flow] failed to resolve customer reply mode", error, {
      organizationId,
    });
    return DEFAULT_WHATSAPP_CUSTOMER_REPLY_MODE;
  }
}

export async function processChatbotMessage(
  args: ProcessChatbotMessageArgs,
): Promise<ProcessChatbotMessageResult> {
  const replyMode = await resolveReplyMode(args.organizationId);
  const session = await getOrCreateChatbotSession(args.phone, args.organizationId);
  const context = parseContext(session.context);
  const draft = await findLatestTripRequestForPhone(args.organizationId, args.phone).catch((error) => {
    logError("[whatsapp/chatbot-flow] failed to load latest trip request draft", error, {
      organizationId: args.organizationId,
      phone: args.phone,
    });
    return null;
  });
  const normalizedState = normalizeStoredState(session.state, draft);
  const now = new Date().toISOString();

  if (replyMode === "off") {
    return {
      reply: null,
      sessionId: session.id,
      state: normalizedState,
      aiReplyCount: session.ai_reply_count,
      shouldHandOff: normalizedState === "operator_handoff",
    };
  }

  if (!draft) {
    if (normalizedState !== "new_contact") {
      await createAdminClient()
        .from("whatsapp_chatbot_sessions")
        .update({
          state: "new_contact",
          last_message_at: now,
          updated_at: now,
        })
        .eq("id", session.id);
    }

    return {
      reply: null,
      sessionId: session.id,
      state: "new_contact",
      aiReplyCount: session.ai_reply_count,
      shouldHandOff: false,
    };
  }

  const nextContext = buildContextPatch(context, draft);

  if (draft.status === "completed") {
    const nextReplyCount = session.ai_reply_count + 1;
    const nextState: ChatbotState = "form_submitted";
    await createAdminClient()
      .from("whatsapp_chatbot_sessions")
      .update({
        state: nextState,
        context: { ...nextContext, lastAutoReplyType: "completion" } as Json,
        ai_reply_count: nextReplyCount,
        last_message_at: now,
        last_ai_reply_at: now,
        updated_at: now,
      })
      .eq("id", session.id);

    logEvent("info", "[whatsapp/chatbot-flow] completion acknowledgement sent", {
      organizationId: args.organizationId,
      phone: args.phone,
      draftId: draft.id,
    });

    return {
      reply: buildCompletionReply(),
      sessionId: session.id,
      state: nextState,
      aiReplyCount: nextReplyCount,
      shouldHandOff: false,
    };
  }

  if (normalizedState === "operator_handoff") {
    return {
      reply: null,
      sessionId: session.id,
      state: "operator_handoff",
      aiReplyCount: session.ai_reply_count,
      shouldHandOff: true,
    };
  }

  if (!draft.formToken) {
    await markOperatorHandoff({
      organizationId: args.organizationId,
      phone: args.phone,
      session,
      draft,
      incomingMessage: args.incomingMessage,
    });

    return {
      reply: null,
      sessionId: session.id,
      state: "operator_handoff",
      aiReplyCount: session.ai_reply_count,
      shouldHandOff: true,
    };
  }

  if (!shouldSendReminder(args.incomingMessage)) {
    await markOperatorHandoff({
      organizationId: args.organizationId,
      phone: args.phone,
      session,
      draft,
      incomingMessage: args.incomingMessage,
    });

    return {
      reply: null,
      sessionId: session.id,
      state: "operator_handoff",
      aiReplyCount: session.ai_reply_count,
      shouldHandOff: true,
    };
  }

  const reply = buildReminderReply(buildTripRequestFormUrl(draft.formToken));
  const nextReplyCount = session.ai_reply_count + 1;
  const nextState: ChatbotState =
    normalizedState === "welcome_sent" ? "awaiting_form_completion" : "awaiting_form_completion";

  await createAdminClient()
    .from("whatsapp_chatbot_sessions")
    .update({
      state: nextState,
      context: { ...nextContext, lastAutoReplyType: "reminder" } as Json,
      ai_reply_count: nextReplyCount,
      last_message_at: now,
      last_ai_reply_at: now,
      updated_at: now,
    })
    .eq("id", session.id);

  logEvent("info", "[whatsapp/chatbot-flow] form reminder sent", {
    organizationId: args.organizationId,
    phone: args.phone,
    draftId: draft.id,
    mode: replyMode,
  });

  return {
    reply,
    sessionId: session.id,
    state: nextState,
    aiReplyCount: nextReplyCount,
    shouldHandOff: false,
  };
}

export async function sendChatbotReply(args: {
  organizationId: string;
  sessionName: string;
  sessionToken: string;
  waId: string;
  chatbotSessionId: string;
  reply: string;
}) {
  await guardedSendText(args.sessionName, args.waId, args.reply);
}
