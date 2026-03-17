import "server-only";

/* ------------------------------------------------------------------
 * WhatsApp Channel Adapter
 *
 * Bridges incoming WhatsApp text messages to the TripBuilt orchestrator
 * and sends replies back through the Meta Cloud API.
 *
 * Key differences from the web channel:
 * - Confirmation is text-based ("Reply YES to confirm, or anything else to cancel")
 * - Responses are shorter and avoid heavy markdown
 * - Session persistence uses the assistant_sessions table
 * - Replies are sent via sendWhatsAppText() instead of HTTP response
 * ------------------------------------------------------------------ */

import type { ActionContext, ConversationMessage } from "../types";
import { handleMessage } from "../orchestrator";
import {
  getOrCreateSession,
  updateSessionHistory,
  setPendingAction,
  clearPendingAction,
  getPendingAction,
} from "../session";
import { findAction } from "../actions/registry";
import { logAuditEvent } from "../audit";
import { sendWhatsAppText } from "@/lib/whatsapp.server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum reply length for WhatsApp messages (API limit is 4096). */
const MAX_REPLY_LENGTH = 3800;

/** Phrases that confirm a pending action. */
const CONFIRM_PHRASES = new Set(["yes", "y", "confirm", "ok", "go ahead", "proceed"]);

/** Phrases that cancel a pending action. */
const CANCEL_PHRASES = new Set(["no", "n", "cancel", "stop", "nevermind", "never mind"]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of processing an incoming WhatsApp text message. */
export interface WhatsAppHandlerResult {
  readonly success: boolean;
  readonly replySent: boolean;
  readonly replyText: string;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip heavy markdown formatting for WhatsApp (keep basic formatting). */
function formatForWhatsApp(text: string): string {
  return text
    // WhatsApp supports *bold* and _italic_ natively, keep those
    // Convert markdown headers to *bold* lines
    .replace(/^#{1,3}\s+(.+)$/gm, "*$1*")
    // Convert markdown bold **text** to WhatsApp bold *text*
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    // Convert markdown links [text](url) to "text: url"
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2")
    // Trim to max length
    .slice(0, MAX_REPLY_LENGTH);
}

/** Resolve a WhatsApp sender to their profile and organization. */
export async function resolveWhatsAppSender(
  waId: string,
): Promise<{ userId: string; organizationId: string } | null> {
  const supabase = createAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("phone_normalized", waId)
    .maybeSingle();

  if (error || !profile || !profile.organization_id) {
    return null;
  }

  return {
    userId: profile.id,
    organizationId: profile.organization_id,
  };
}

// ---------------------------------------------------------------------------
// Pending action handler
// ---------------------------------------------------------------------------

/** Handle a confirmation or cancellation of a pending write action. */
async function handlePendingAction(
  ctx: ActionContext,
  sessionId: string,
  userText: string,
  pending: { readonly actionName: string; readonly params: Record<string, unknown>; readonly confirmationMessage: string; readonly proposedAt: string },
): Promise<string> {
  const normalizedText = userText.trim().toLowerCase();
  const isConfirm = CONFIRM_PHRASES.has(normalizedText);
  const isCancel = CANCEL_PHRASES.has(normalizedText);

  if (isConfirm) {
    const actionDef = findAction(pending.actionName);
    if (!actionDef) {
      await clearPendingAction(ctx, sessionId);
      return "Sorry, I couldn't find that action anymore. How else can I help?";
    }

    try {
      const result = await actionDef.execute(ctx, pending.params);

      void logAuditEvent(ctx, {
        sessionId,
        eventType: result.success ? "action_executed" : "action_failed",
        actionName: pending.actionName,
        actionParams: pending.params,
        actionResult: { success: result.success, message: result.message },
      });

      await clearPendingAction(ctx, sessionId);
      return result.success
        ? `Done! ${result.message}`
        : `Action failed: ${result.message}`;
    } catch {
      await clearPendingAction(ctx, sessionId);
      return "Something went wrong while executing the action. Please try again.";
    }
  }

  if (isCancel) {
    void logAuditEvent(ctx, {
      sessionId,
      eventType: "action_cancelled",
      actionName: pending.actionName,
      actionParams: pending.params,
      actionResult: null,
    });

    await clearPendingAction(ctx, sessionId);
    return "Action cancelled. How else can I help?";
  }

  // Neither confirm nor cancel -- treat as a new message
  // Clear the pending action and process as a fresh query
  await clearPendingAction(ctx, sessionId);
  return ""; // empty means "process as new message"
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

/**
 * Process an incoming WhatsApp text message through the assistant
 * and send the reply back to the sender.
 *
 * This is the main entry point called by the webhook route when
 * a text message is received.
 */
export async function handleWhatsAppMessage(
  waId: string,
  messageText: string,
  senderPhone: string,
): Promise<WhatsAppHandlerResult> {
  // 1. Resolve sender identity
  const sender = await resolveWhatsAppSender(waId);
  if (!sender) {
    // Unknown user -- send a polite message and bail
    const unknownReply =
      "Hi! I'm TripBuilt, a business assistant. I couldn't find your account. Please make sure your WhatsApp number is registered in your tour operator profile.";
    await sendWhatsAppText(senderPhone, unknownReply);
    return { success: true, replySent: true, replyText: unknownReply };
  }

  // Rate limit: 40 messages per 5 minutes per WhatsApp user
  const rateLimit = await enforceRateLimit({
    identifier: `wa-${sender.userId}`,
    limit: 40,
    windowMs: 5 * 60 * 1000,
    prefix: "assistant-whatsapp",
  });

  if (!rateLimit.success) {
    const rateLimitReply = "You're sending messages too quickly. Please wait a moment before trying again.";
    await sendWhatsAppText(senderPhone, rateLimitReply);
    return { success: true, replySent: true, replyText: rateLimitReply };
  }

  // Sanitize input
  const sanitizedText = sanitizeText(messageText, { maxLength: 2000, preserveNewlines: true });
  if (!sanitizedText) {
    return { success: true, replySent: false, replyText: "" };
  }

  // 2. Build action context
  const adminClient = createAdminClient();
  const ctx: ActionContext = {
    organizationId: sender.organizationId,
    userId: sender.userId,
    channel: "whatsapp" as const,
    supabase: adminClient,
  };

  // 3. Load or create session
  let session;
  try {
    session = await getOrCreateSession(ctx);
  } catch {
    const errorReply = "I'm having trouble connecting. Please try again in a moment.";
    await sendWhatsAppText(senderPhone, errorReply);
    return { success: false, replySent: true, replyText: errorReply, error: "Session creation failed" };
  }

  // 4. Check for pending action confirmation
  const pending = await getPendingAction(ctx, session.id);
  if (pending) {
    const confirmReply = await handlePendingAction(ctx, session.id, sanitizedText, pending);
    if (confirmReply) {
      // Was a confirm/cancel -- send reply and update history
      const updatedHistory: readonly ConversationMessage[] = [
        ...session.conversationHistory,
        { role: "user" as const, content: sanitizedText },
        { role: "assistant" as const, content: confirmReply },
      ];
      await updateSessionHistory(ctx, session.id, updatedHistory).catch((historyError) => {
        console.error("[assistant/whatsapp] failed to persist confirmation history", {
          sessionId: session.id,
          organizationId: ctx.organizationId,
          error: historyError instanceof Error ? historyError.message : String(historyError),
        });
      });

      const formatted = formatForWhatsApp(confirmReply);
      await sendWhatsAppText(senderPhone, formatted);
      return { success: true, replySent: true, replyText: formatted };
    }
    // Empty reply means user sent a new topic -- fall through to orchestrator
  }

  // 5. Call the orchestrator
  try {
    const response = await handleMessage({
      message: sanitizedText,
      history: session.conversationHistory,
      channel: "whatsapp",
      organizationId: sender.organizationId,
      userId: sender.userId,
    });

    // 6. Handle action proposals (confirmation flow)
    let replyText = response.reply;
    if (response.actionProposal) {
      await setPendingAction(ctx, session.id, {
        actionName: response.actionProposal.actionName,
        params: response.actionProposal.params,
        confirmationMessage: response.actionProposal.confirmationMessage,
        proposedAt: new Date().toISOString(),
      });

      // Append WhatsApp-style confirmation prompt
      replyText += "\n\n_Reply *YES* to confirm or *NO* to cancel._";
    }

    // 7. Update session history
    const updatedHistory: readonly ConversationMessage[] = [
      ...session.conversationHistory,
      { role: "user" as const, content: sanitizedText },
      { role: "assistant" as const, content: replyText },
    ];
    await updateSessionHistory(ctx, session.id, updatedHistory).catch((historyError) => {
      console.error("[assistant/whatsapp] failed to persist conversation history", {
        sessionId: session.id,
        organizationId: ctx.organizationId,
        error: historyError instanceof Error ? historyError.message : String(historyError),
      });
    });

    // 8. Send reply via WhatsApp
    const formatted = formatForWhatsApp(replyText);
    const sendResult = await sendWhatsAppText(senderPhone, formatted);

    return {
      success: sendResult.success,
      replySent: sendResult.success,
      replyText: formatted,
      error: sendResult.error,
    };
  } catch (error) {
    const errorReply = "I ran into an issue processing your message. Please try again.";
    await sendWhatsAppText(senderPhone, errorReply);
    return {
      success: false,
      replySent: true,
      replyText: errorReply,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
