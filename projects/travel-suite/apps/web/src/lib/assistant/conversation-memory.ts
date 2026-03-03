import "server-only";

/* ------------------------------------------------------------------
 * Conversation Memory -- cross-session context injection.
 *
 * Loads the most recent N assistant exchange pairs from previous
 * sessions (stored in assistant_conversations) and surfaces them
 * as ConversationMessage objects so the orchestrator can inject
 * them into the OpenAI context window.
 *
 * Results are Redis/local cached for 60 s per org+user to avoid
 * repeated DB reads within the same conversation window.
 *
 * Never throws -- returns [] on any error.
 * ------------------------------------------------------------------ */

import type { ActionContext, ConversationMessage } from "./types";
import { getCachedJson, setCachedJson } from "@/lib/cache/upstash";

const MEMORY_CACHE_TTL_SECONDS = 60;
const MEMORY_KEY_PREFIX = "assistant:memory";
const MEMORY_PAIR_COUNT = 3; // user+assistant pairs = 6 messages

function buildMemoryKey(orgId: string, userId: string): string {
  return `${MEMORY_KEY_PREFIX}:${orgId}:${userId}`;
}

function convTable(ctx: ActionContext) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ctx.supabase as any).from("assistant_conversations");
}

interface MemoryRow {
  readonly message_role: string;
  readonly message_content: string;
}

/**
 * Load the last MEMORY_PAIR_COUNT exchange pairs for this org+user
 * from the assistant_conversations table.
 *
 * Messages are returned oldest-first so they appear in natural
 * chronological order when prepended to the current history.
 *
 * Returns an empty array when there is no history or on any error.
 */
export async function getRecentMemory(
  ctx: ActionContext,
): Promise<readonly ConversationMessage[]> {
  try {
    const key = buildMemoryKey(ctx.organizationId, ctx.userId);

    const cached = await getCachedJson<readonly ConversationMessage[]>(key);
    if (cached !== null) return cached;

    const { data, error } = await convTable(ctx)
      .select("message_role, message_content")
      .eq("organization_id", ctx.organizationId)
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(MEMORY_PAIR_COUNT * 2);

    if (error || !data || (data as MemoryRow[]).length === 0) return [];

    const typedData = data as MemoryRow[];

    // Reverse to chronological (oldest first) before injecting
    const messages: readonly ConversationMessage[] = [...typedData]
      .reverse()
      .map((row) => ({
        role: row.message_role as "user" | "assistant",
        content: row.message_content as string,
      }))
      .filter((m) => m.content && m.content.trim().length > 0);

    void setCachedJson(key, messages, MEMORY_CACHE_TTL_SECONDS);
    return messages;
  } catch {
    return [];
  }
}
