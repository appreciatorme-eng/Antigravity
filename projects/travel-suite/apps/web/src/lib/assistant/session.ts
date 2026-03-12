import "server-only";

/* ------------------------------------------------------------------
 * Session Manager -- persistent assistant session state.
 *
 * Manages conversation sessions in the `assistant_sessions` table.
 * Each user+channel pair has at most one active (non-expired) session.
 *
 * All functions are scoped by organization_id and use the admin
 * client from ActionContext so the service role can read/write
 * sessions on behalf of the authenticated user.
 *
 * Immutable patterns: every returned object is freshly constructed;
 * no in-place mutations.
 *
 * ------------------------------------------------------------------ */

import { safeErrorMessage } from "@/lib/security/safe-error";
import type { Json } from "@/lib/supabase/database.types";
import type { ActionContext, ConversationMessage } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A pending write-action awaiting user confirmation. */
export interface PendingAction {
  readonly actionName: string;
  readonly params: Record<string, unknown>;
  readonly confirmationMessage: string;
  readonly proposedAt: string; // ISO timestamp
}

/** The shape returned to callers after loading or creating a session. */
export interface SessionData {
  readonly id: string;
  readonly conversationHistory: readonly ConversationMessage[];
  readonly pendingAction: PendingAction | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of conversation messages kept in a session. */
const MAX_HISTORY_LENGTH = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Accessor for the `assistant_sessions` table. */
function sessionsTable(ctx: ActionContext) {
  return ctx.supabase.from("assistant_sessions");
}

// ---------------------------------------------------------------------------
// Session CRUD
// ---------------------------------------------------------------------------

/**
 * Return the active session for this user+channel, creating one if
 * none exists or the existing one has expired.
 */
export async function getOrCreateSession(
  ctx: ActionContext,
): Promise<SessionData> {
  const now = new Date().toISOString();

  // Look for an unexpired session for this user + channel
  const { data: existing, error: selectError } = await sessionsTable(ctx)
    .select("id, conversation_history, pending_action")
    .eq("organization_id", ctx.organizationId)
    .eq("user_id", ctx.userId)
    .eq("channel", ctx.channel)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!selectError && existing) {
    return {
      id: existing.id,
      conversationHistory: (existing.conversation_history ?? []) as unknown as readonly ConversationMessage[],
      pendingAction: (existing.pending_action as unknown as PendingAction) ?? null,
    };
  }

  // No active session found -- create a new one
  const { data: created, error: insertError } = await sessionsTable(ctx)
    .insert({
      organization_id: ctx.organizationId,
      user_id: ctx.userId,
      channel: ctx.channel,
      conversation_history: [],
      pending_action: null,
      context_snapshot: null,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    console.error("[assistant/session] create error:", insertError?.message);
    throw new Error(
      `Failed to create assistant session: ${safeErrorMessage(insertError, "unknown error")}`,
    );
  }

  return {
    id: created.id,
    conversationHistory: [],
    pendingAction: null,
  };
}

// ---------------------------------------------------------------------------
// Conversation history
// ---------------------------------------------------------------------------

/**
 * Replace the conversation history for a session, keeping only the
 * most recent messages up to MAX_HISTORY_LENGTH.
 */
export async function updateSessionHistory(
  ctx: ActionContext,
  sessionId: string,
  history: readonly ConversationMessage[],
): Promise<void> {
  const trimmedHistory = history.slice(-MAX_HISTORY_LENGTH);

  const { error } = await sessionsTable(ctx)
    .update({ conversation_history: trimmedHistory as unknown as Json })
    .eq("id", sessionId)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    console.error("[assistant/session] updateSessionHistory error:", error.message);
    throw new Error(
      `Failed to update session history: ${safeErrorMessage(error, "database error")}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Pending action management
// ---------------------------------------------------------------------------

/**
 * Store a pending action proposal in the session so it can be
 * confirmed or cancelled in a subsequent message.
 */
export async function setPendingAction(
  ctx: ActionContext,
  sessionId: string,
  action: PendingAction,
): Promise<void> {
  const { error } = await sessionsTable(ctx)
    .update({ pending_action: action as unknown as Json })
    .eq("id", sessionId)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    console.error("[assistant/session] setPendingAction error:", error.message);
    throw new Error(
      `Failed to set pending action: ${safeErrorMessage(error, "database error")}`,
    );
  }
}

/**
 * Clear the pending action (e.g. after confirmation or cancellation).
 */
export async function clearPendingAction(
  ctx: ActionContext,
  sessionId: string,
): Promise<void> {
  const { error } = await sessionsTable(ctx)
    .update({ pending_action: null })
    .eq("id", sessionId)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    console.error("[assistant/session] clearPendingAction error:", error.message);
    throw new Error(
      `Failed to clear pending action: ${safeErrorMessage(error, "database error")}`,
    );
  }
}

/**
 * Retrieve the current pending action for a session, or null if none.
 */
export async function getPendingAction(
  ctx: ActionContext,
  sessionId: string,
): Promise<PendingAction | null> {
  const { data, error } = await sessionsTable(ctx)
    .select("pending_action")
    .eq("id", sessionId)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (error || !data) {
    return null;
  }

  return (data.pending_action as unknown as PendingAction) ?? null;
}
