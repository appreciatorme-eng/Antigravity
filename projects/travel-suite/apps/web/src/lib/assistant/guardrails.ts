import "server-only";

/* ------------------------------------------------------------------
 * Safety Guardrails for the GoBuddy Assistant
 *
 * This module enforces safety constraints on action execution:
 * 1. Action blocklist -- prevents dangerous operations
 * 2. Session write counter -- limits writes per session
 * 3. Input validation helpers
 *
 * Pure functions where possible. No mutations.
 * ------------------------------------------------------------------ */

// ---------------------------------------------------------------------------
// Action Blocklist
// ---------------------------------------------------------------------------

/**
 * Actions that must NEVER be registered or executed through the assistant.
 * This is a defence-in-depth layer -- even if someone accidentally adds
 * one of these to the registry, the orchestrator will refuse to run it.
 */
const BLOCKED_ACTION_PATTERNS: readonly RegExp[] = [
  /delete_org/i,
  /delete_organization/i,
  /delete_user/i,
  /remove_user/i,
  /remove_organization/i,
  /billing/i,
  /subscription/i,
  /payment_method/i,
  /admin_role/i,
  /change_role/i,
  /promote_to_admin/i,
  /drop_table/i,
  /truncate/i,
  /raw_sql/i,
  /execute_sql/i,
];

/** Check if an action name is blocked. */
export function isActionBlocked(actionName: string): boolean {
  return BLOCKED_ACTION_PATTERNS.some((pattern) => pattern.test(actionName));
}

/** Get a human-readable blocklist description. */
export function getBlocklistDescription(): string {
  return "Blocked operations: organization/user deletion, billing changes, role modifications, and raw SQL execution.";
}

// ---------------------------------------------------------------------------
// Session Write Counter
// ---------------------------------------------------------------------------

const MAX_WRITES_PER_SESSION = 10;

/**
 * In-memory write counter per session.
 * Resets when the session expires or the process restarts.
 * This is a defence-in-depth layer alongside audit logging.
 */
const sessionWriteCounts = new Map<string, number>();

/** Increment and check the write counter for a session. */
export function checkSessionWriteLimit(sessionId: string): {
  readonly allowed: boolean;
  readonly count: number;
  readonly limit: number;
} {
  const current = sessionWriteCounts.get(sessionId) ?? 0;
  const next = current + 1;

  if (next > MAX_WRITES_PER_SESSION) {
    return { allowed: false, count: current, limit: MAX_WRITES_PER_SESSION };
  }

  sessionWriteCounts.set(sessionId, next);
  return { allowed: true, count: next, limit: MAX_WRITES_PER_SESSION };
}

/** Reset the write counter for a session (e.g., on session expiry). */
export function resetSessionWriteCount(sessionId: string): void {
  sessionWriteCounts.delete(sessionId);
}

/** Get the current write count for a session. */
export function getSessionWriteCount(sessionId: string): number {
  return sessionWriteCounts.get(sessionId) ?? 0;
}

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

/** Maximum message length accepted from users. */
export const MAX_MESSAGE_LENGTH = 2000;

/** Maximum number of tool-calling rounds per request. */
export const MAX_TOOL_ROUNDS = 3;

/** Maximum number of messages kept in history. */
export const MAX_HISTORY_MESSAGES = 20;
