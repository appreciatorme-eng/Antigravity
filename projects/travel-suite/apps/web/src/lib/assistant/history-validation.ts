import { sanitizeText } from "@/lib/security/sanitize";
import type { ConversationMessage } from "@/lib/assistant/types";

type ClientHistoryRole = Extract<ConversationMessage["role"], "user" | "assistant">;

const ALLOWED_HISTORY_ROLES: ReadonlySet<ClientHistoryRole> = new Set(["user", "assistant"]);

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeClientConversationHistory(
  rawHistory: unknown,
  maxMessages = 20,
): { ok: true; history: ConversationMessage[] } | { ok: false; error: string } {
  if (rawHistory === undefined || rawHistory === null) {
    return { ok: true, history: [] };
  }

  if (!Array.isArray(rawHistory)) {
    return { ok: false, error: "History must be an array" };
  }

  const normalized: ConversationMessage[] = [];
  for (const item of rawHistory) {
    if (!isObjectRecord(item)) {
      return { ok: false, error: "History entries must be objects" };
    }

    const roleValue = item.role;
    const contentValue = item.content;

    if (typeof roleValue !== "string" || !ALLOWED_HISTORY_ROLES.has(roleValue as ClientHistoryRole)) {
      return { ok: false, error: "History role must be either user or assistant" };
    }

    if (typeof contentValue !== "string") {
      return { ok: false, error: "History content must be a string" };
    }

    const content = sanitizeText(contentValue, { maxLength: 2000, preserveNewlines: true });
    if (!content) {
      continue;
    }

    normalized.push({
      role: roleValue as ClientHistoryRole,
      content,
    });
  }

  return { ok: true, history: normalized.slice(-maxMessages) };
}
