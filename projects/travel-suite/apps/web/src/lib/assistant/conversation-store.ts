import "server-only";

/* ------------------------------------------------------------------
 * Conversation Store -- persistent chat history for the assistant.
 *
 * Stores individual messages in `assistant_conversations` table,
 * grouped by session_id. Provides search via PostgreSQL full-text.
 *
 * All functions use the admin client and are scoped by org + user.
 * Immutable patterns throughout. Never throws -- returns empty on error.
 * ------------------------------------------------------------------ */

import type { ActionContext } from "./types";

// Types
export interface StoredMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly actionName: string | null;
  readonly actionResult: { success: boolean; message: string } | null;
  readonly createdAt: string;
}

export interface ConversationSummary {
  readonly sessionId: string;
  readonly title: string | null;
  readonly messageCount: number;
  readonly lastMessageAt: string;
  readonly preview: string;
}

export interface ConversationDetail {
  readonly sessionId: string;
  readonly title: string | null;
  readonly messages: readonly StoredMessage[];
}

// Helper
function convTable(ctx: ActionContext) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ctx.supabase as any).from("assistant_conversations");
}

// Save a message pair (user + assistant) to a conversation
export async function saveConversationMessages(
  ctx: ActionContext,
  sessionId: string,
  userMessage: string,
  assistantReply: string,
  actionName?: string | null,
  actionResult?: { success: boolean; message: string } | null,
): Promise<void> {
  try {
    // Determine title from first user message
    const title = userMessage.slice(0, 80) + (userMessage.length > 80 ? "..." : "");

    const rows = [
      {
        organization_id: ctx.organizationId,
        user_id: ctx.userId,
        session_id: sessionId,
        title,
        message_role: "user",
        message_content: userMessage,
        action_name: null,
        action_result: null,
      },
      {
        organization_id: ctx.organizationId,
        user_id: ctx.userId,
        session_id: sessionId,
        title,
        message_role: "assistant",
        message_content: assistantReply,
        action_name: actionName ?? null,
        action_result: actionResult ?? null,
      },
    ];

    await convTable(ctx).insert(rows);
  } catch (error) {
    console.error("Failed to save conversation:", error);
  }
}

// List recent conversations (grouped by session_id)
export async function listConversations(
  ctx: ActionContext,
  options: { readonly limit?: number; readonly offset?: number } = {},
): Promise<readonly ConversationSummary[]> {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  try {
    // Get the most recent message per session
    const { data, error } = await convTable(ctx)
      .select("session_id, title, message_content, message_role, created_at")
      .eq("organization_id", ctx.organizationId)
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit * 4); // Fetch extra for grouping

    if (error || !data) return [];

    type Row = {
      session_id: string;
      title: string | null;
      message_content: string;
      message_role: string;
      created_at: string;
    };
    const typedData = data as Row[];

    // Group by session_id, keep latest per session
    const sessionMap = new Map<string, {
      sessionId: string;
      title: string | null;
      messageCount: number;
      lastMessageAt: string;
      preview: string;
    }>();

    for (const row of typedData) {
      const existing = sessionMap.get(row.session_id);
      if (existing) {
        const updated = {
          ...existing,
          messageCount: existing.messageCount + 1,
          lastMessageAt: row.created_at > existing.lastMessageAt
            ? row.created_at
            : existing.lastMessageAt,
        };
        sessionMap.set(row.session_id, updated);
      } else {
        sessionMap.set(row.session_id, {
          sessionId: row.session_id,
          title: row.title,
          messageCount: 1,
          lastMessageAt: row.created_at,
          preview: row.message_content.slice(0, 100),
        });
      }
    }

    return [...sessionMap.values()]
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .slice(0, limit);
  } catch {
    return [];
  }
}

// Get full conversation by session ID
export async function getConversation(
  ctx: ActionContext,
  sessionId: string,
): Promise<ConversationDetail | null> {
  try {
    const { data, error } = await convTable(ctx)
      .select("id, message_role, message_content, action_name, action_result, created_at, title")
      .eq("organization_id", ctx.organizationId)
      .eq("user_id", ctx.userId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) return null;

    type Row = {
      id: string;
      message_role: string;
      message_content: string;
      action_name: string | null;
      action_result: { success: boolean; message: string } | null;
      created_at: string;
      title: string | null;
    };
    const typedData = data as Row[];

    const messages: StoredMessage[] = typedData.map((row) => ({
      id: row.id,
      role: row.message_role as "user" | "assistant",
      content: row.message_content,
      actionName: row.action_name,
      actionResult: row.action_result,
      createdAt: row.created_at,
    }));

    return {
      sessionId,
      title: typedData[0].title,
      messages,
    };
  } catch {
    return null;
  }
}

// Search conversations by text
export async function searchConversations(
  ctx: ActionContext,
  query: string,
  limit = 10,
): Promise<readonly ConversationSummary[]> {
  try {
    // Use PostgreSQL full-text search
    const searchTerms = query.trim().split(/\s+/).join(" & ");

    const { data, error } = await convTable(ctx)
      .select("session_id, title, message_content, created_at")
      .eq("organization_id", ctx.organizationId)
      .eq("user_id", ctx.userId)
      .textSearch("message_content", searchTerms)
      .order("created_at", { ascending: false })
      .limit(limit * 2);

    if (error || !data) return [];

    type Row = {
      session_id: string;
      title: string | null;
      message_content: string;
      created_at: string;
    };
    const typedData = data as Row[];

    const sessionMap = new Map<string, ConversationSummary>();

    for (const row of typedData) {
      if (!sessionMap.has(row.session_id)) {
        sessionMap.set(row.session_id, {
          sessionId: row.session_id,
          title: row.title,
          messageCount: 1,
          lastMessageAt: row.created_at,
          preview: row.message_content.slice(0, 100),
        });
      }
    }

    return [...sessionMap.values()].slice(0, limit);
  } catch {
    return [];
  }
}

// Delete a conversation
export async function deleteConversation(
  ctx: ActionContext,
  sessionId: string,
): Promise<boolean> {
  try {
    const { error } = await convTable(ctx)
      .delete()
      .eq("organization_id", ctx.organizationId)
      .eq("user_id", ctx.userId)
      .eq("session_id", sessionId);

    return !error;
  } catch {
    return false;
  }
}
