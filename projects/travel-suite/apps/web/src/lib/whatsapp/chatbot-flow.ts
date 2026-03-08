import "server-only";

import crypto from "node:crypto";

import { z } from "zod";

import { getGeminiModel, parseGeminiJson } from "@/lib/ai/gemini.server";
import type { Database, Json } from "@/lib/database.types";
import { isFeatureEnabled } from "@/lib/platform/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertWhatsAppProposalDraftFromCollected, getProposalDraftSummariesForSessions } from "@/lib/whatsapp/proposal-drafts.server";
import { sendWahaText } from "@/lib/whatsapp-waha.server";

export type ChatbotState = "new" | "qualifying" | "proposal_ready" | "handed_off";

export type ChatbotSessionSummary = {
  id: string;
  state: ChatbotState;
  aiReplyCount: number;
  updatedAt: string;
  proposalDraftId?: string | null;
  proposalDraftStatus?: string | null;
};

type ChatbotSessionRow = Database["public"]["Tables"]["whatsapp_chatbot_sessions"]["Row"];

type ChatbotContextMessage = {
  role: "traveler" | "assistant";
  content: string;
};

type ChatbotCollectedFields = {
  destination: string | null;
  travelDates: string | null;
  groupSize: string | null;
  budget: string | null;
};

type ChatbotContext = {
  collected: ChatbotCollectedFields;
  messages: ChatbotContextMessage[];
  lastMissing: string[];
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

type ProfileRoleLookup = {
  id: string;
  role: string | null;
};

const CHATBOT_STATES = ["new", "qualifying", "proposal_ready", "handed_off"] as const;
const MAX_AI_REPLIES = 5;
const RECENT_HUMAN_REPLY_WINDOW_MS = 10 * 60 * 1000;

const ChatbotResponseSchema = z.object({
  reply: z.string().trim().min(1).max(400),
  nextState: z.enum(CHATBOT_STATES),
  collected: z
    .object({
      destination: z.string().trim().min(1).max(160).nullable().optional(),
      travelDates: z.string().trim().min(1).max(160).nullable().optional(),
      groupSize: z.string().trim().min(1).max(80).nullable().optional(),
      budget: z.string().trim().min(1).max(80).nullable().optional(),
    })
    .optional(),
  missing: z.array(z.string().trim().min(1).max(60)).max(4).optional(),
});

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `+${digits}` : phone;
}

function phoneCandidates(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return Array.from(new Set([digits, digits ? `+${digits}` : null].filter(Boolean))) as string[];
}

function parseContext(value: unknown): ChatbotContext {
  const base: ChatbotContext = {
    collected: {
      destination: null,
      travelDates: null,
      groupSize: null,
      budget: null,
    },
    messages: [],
    lastMissing: [],
  };

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  const raw = value as Record<string, unknown>;
  const collected = raw.collected;
  const messages = raw.messages;
  const lastMissing = raw.lastMissing;
  const collectedRecord =
    collected && typeof collected === "object" && !Array.isArray(collected)
      ? (collected as Record<string, unknown>)
      : null;

  return {
    collected: {
      destination:
        typeof collectedRecord?.destination === "string"
          ? collectedRecord.destination
          : null,
      travelDates:
        typeof collectedRecord?.travelDates === "string"
          ? collectedRecord.travelDates
          : null,
      groupSize:
        typeof collectedRecord?.groupSize === "string"
          ? collectedRecord.groupSize
          : null,
      budget:
        typeof collectedRecord?.budget === "string"
          ? collectedRecord.budget
          : null,
    },
    messages: Array.isArray(messages)
      ? messages
          .filter(
            (entry): entry is ChatbotContextMessage =>
              Boolean(entry) &&
              typeof entry === "object" &&
              !Array.isArray(entry) &&
              (entry as { role?: unknown }).role !== undefined &&
              (entry as { content?: unknown }).content !== undefined &&
              ((entry as { role?: unknown }).role === "traveler" ||
                (entry as { role?: unknown }).role === "assistant") &&
              typeof (entry as { content?: unknown }).content === "string",
          )
          .slice(-10)
      : [],
    lastMissing: Array.isArray(lastMissing)
      ? lastMissing.filter((entry): entry is string => typeof entry === "string").slice(0, 4)
      : [],
  };
}

function buildPrompt(args: {
  session: ChatbotSessionRow;
  context: ChatbotContext;
  incomingMessage: string;
}) {
  const transcript = args.context.messages
    .slice(-8)
    .map((message) => `${message.role === "traveler" ? "Traveler" : "Assistant"}: ${message.content}`)
    .join("\n");

  return `You are a helpful travel booking assistant for a professional travel operator.

Conversation state: ${args.session.state}
Already collected:
- destination: ${args.context.collected.destination ?? "missing"}
- travelDates: ${args.context.collected.travelDates ?? "missing"}
- groupSize: ${args.context.collected.groupSize ?? "missing"}
- budget: ${args.context.collected.budget ?? "missing"}

Rules:
1. Greet warmly and gather destination, travel dates, group size, and budget.
2. Once all four are clearly known, reply: "Perfect! I'll prepare a personalised proposal for you. Our team will be in touch shortly." and set nextState to "proposal_ready".
3. If the traveler asks for something you cannot confidently answer, set nextState to "handed_off" and reply: "Let me connect you with our travel expert."
4. Keep replies under 100 words and sound human, warm, and professional.
5. Return JSON only.

Recent conversation:
${transcript || "No previous context."}
Traveler: ${args.incomingMessage}

Return exactly this JSON shape:
{
  "reply": "string",
  "nextState": "new" | "qualifying" | "proposal_ready" | "handed_off",
  "collected": {
    "destination": "string | null",
    "travelDates": "string | null",
    "groupSize": "string | null",
    "budget": "string | null"
  },
  "missing": ["destination", "travelDates", "groupSize", "budget"]
}`;
}

function mergeCollectedFields(
  current: ChatbotCollectedFields,
  next?: Partial<Record<keyof ChatbotCollectedFields, string | null>>,
): ChatbotCollectedFields {
  return {
    destination: next?.destination || current.destination,
    travelDates: next?.travelDates || current.travelDates,
    groupSize: next?.groupSize || current.groupSize,
    budget: next?.budget || current.budget,
  };
}

async function getOrCreateChatbotSession(
  phone: string,
  organizationId: string,
) {
  const admin = createAdminClient();
  const normalizedPhone = normalizePhone(phone);

  const { data: existing, error: selectError } = await admin
    .from("whatsapp_chatbot_sessions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: insertError } = await admin
    .from("whatsapp_chatbot_sessions")
    .insert({
      organization_id: organizationId,
      phone: normalizedPhone,
      state: "new",
      context: {
        collected: {
          destination: null,
          travelDates: null,
          groupSize: null,
          budget: null,
        },
        messages: [],
        lastMissing: [],
      },
    })
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return created;
}

export async function isWhatsAppChatbotEnabled() {
  const [whatsAppEnabled, aiEnabled] = await Promise.all([
    isFeatureEnabled("whatsapp_enabled"),
    isFeatureEnabled("ai_enabled"),
  ]);

  return whatsAppEnabled && aiEnabled;
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

  const draftSummaries = await getProposalDraftSummariesForSessions(
    organizationId,
    (data || []).map((row) => row.id),
  );

  return new Map(
    (data || []).map((row) => [
      row.phone,
      {
        id: row.id,
        state: row.state as ChatbotState,
        aiReplyCount: row.ai_reply_count,
        updatedAt: row.updated_at,
        proposalDraftId: draftSummaries.get(row.id)?.id ?? null,
        proposalDraftStatus: draftSummaries.get(row.id)?.status ?? null,
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
      state: "handed_off",
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
        state: data.state as ChatbotState,
        aiReplyCount: data.ai_reply_count,
        updatedAt: data.updated_at,
      }
    : null;
}

export async function processChatbotMessage(
  args: ProcessChatbotMessageArgs,
): Promise<ProcessChatbotMessageResult> {
  const admin = createAdminClient();
  const session = await getOrCreateChatbotSession(args.phone, args.organizationId);
  const context = parseContext(session.context);

  if (session.state === "proposal_ready" || session.state === "handed_off") {
    return {
      reply: null,
      sessionId: session.id,
      state: session.state as ChatbotState,
      aiReplyCount: session.ai_reply_count,
      shouldHandOff: true,
    };
  }

  if (session.ai_reply_count >= MAX_AI_REPLIES) {
    const now = new Date().toISOString();
    await admin
      .from("whatsapp_chatbot_sessions")
      .update({
        state: "handed_off",
        handed_off_at: now,
        updated_at: now,
        last_message_at: now,
      })
      .eq("id", session.id);

    return {
      reply: "I'm connecting you with our travel expert who will assist you shortly! 🙏",
      sessionId: session.id,
      state: "handed_off",
      aiReplyCount: session.ai_reply_count,
      shouldHandOff: true,
    };
  }

  let parsed: z.infer<typeof ChatbotResponseSchema>;
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(buildPrompt({
      session,
      context,
      incomingMessage: args.incomingMessage,
    }));
    parsed = ChatbotResponseSchema.parse(parseGeminiJson(result.response.text()));
  } catch {
    parsed = {
      reply: "Let me connect you with our travel expert.",
      nextState: "handed_off",
      missing: [],
    };
  }

  const nextReplyCount = session.ai_reply_count + 1;
  const now = new Date().toISOString();
  let nextState = parsed.nextState;
  let reply = parsed.reply;
  const mergedCollected = mergeCollectedFields(context.collected, parsed.collected);
  const shouldForceHandoff =
    nextReplyCount >= MAX_AI_REPLIES &&
    nextState !== "proposal_ready" &&
    nextState !== "handed_off";

  if (shouldForceHandoff) {
    nextState = "handed_off";
    reply = "I'm connecting you with our travel expert who will assist you shortly! 🙏";
  }

  const nextMessages = [
    ...context.messages.slice(-8),
    { role: "traveler" as const, content: args.incomingMessage },
    { role: "assistant" as const, content: reply },
  ].slice(-10) satisfies ChatbotContextMessage[];

  const nextContext: ChatbotContext = {
    collected: mergedCollected,
    messages: nextMessages,
    lastMissing: parsed.missing ?? [],
  };

  await admin
    .from("whatsapp_chatbot_sessions")
    .update({
      state: nextState,
      context: nextContext,
      ai_reply_count: nextReplyCount,
      last_message_at: now,
      last_ai_reply_at: now,
      handed_off_at: nextState === "handed_off" ? now : session.handed_off_at,
      updated_at: now,
    })
    .eq("id", session.id);

  if (nextState === "proposal_ready") {
    try {
      await upsertWhatsAppProposalDraftFromCollected({
        organizationId: args.organizationId,
        chatbotSessionId: session.id,
        travelerPhone: args.phone,
        collected: mergedCollected,
        sourceContext: nextContext as Json,
      });
    } catch (proposalDraftError) {
      console.error("[whatsapp/chatbot-flow] failed to create proposal draft:", proposalDraftError);
    }
  }

  return {
    reply,
    sessionId: session.id,
    state: nextState,
    aiReplyCount: nextReplyCount,
    shouldHandOff: nextState === "handed_off" || nextState === "proposal_ready",
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
  const admin = createAdminClient();
  const sentAt = new Date().toISOString();

  await sendWahaText(args.sessionName, args.sessionToken, args.waId, args.reply);

  await admin.from("whatsapp_webhook_events").insert({
    provider_message_id: crypto.randomUUID(),
    payload_hash: crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          session: args.sessionName,
          organization_id: args.organizationId,
          wa_id: args.waId,
          sent_at: sentAt,
          chatbot_session_id: args.chatbotSessionId,
          body_preview: args.reply,
        }),
      )
      .digest("hex"),
    event_type: "text",
    wa_id: args.waId,
    processing_status: "processed",
    processed_at: sentAt,
    received_at: sentAt,
    metadata: {
      session: args.sessionName,
      direction: "out",
      source: "chatbot",
      chatbot_session_id: args.chatbotSessionId,
      body_preview: args.reply,
    },
  });
}
