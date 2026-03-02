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
 * NOTE: `assistant_sessions` is not yet in the generated Database
 * types. We cast `ctx.supabase` via `(ctx.supabase as any)` until
 * `supabase gen types` is re-run after the migration is applied.
 * This follows the same pattern used in lib/semantic-cache.ts and
 * lib/subscriptions/limits.ts.
 * ------------------------------------------------------------------ */

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

/**
 * Untyped accessor for the `assistant_sessions` table.
 * Remove after `supabase gen types` includes the new table.
 */
function sessionsTable(ctx: ActionContext) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ctx.supabase as any).from("assistant_sessions");
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
      id: existing.id as string,
      conversationHistory: (existing.conversation_history ?? []) as readonly ConversationMessage[],
      pendingAction: (existing.pending_action as PendingAction) ?? null,
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
    throw new Error(
      `Failed to create assistant session: ${insertError?.message ?? "unknown error"}`,
    );
  }

  return {
    id: created.id as string,
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
    .update({ conversation_history: trimmedHistory })
    .eq("id", sessionId)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    throw new Error(
      `Failed to update session history: ${error.message}`,
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
    .update({ pending_action: action })
    .eq("id", sessionId)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    throw new Error(
      `Failed to set pending action: ${error.message}`,
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
    throw new Error(
      `Failed to clear pending action: ${error.message}`,
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

  return (data.pending_action as PendingAction) ?? null;
}
