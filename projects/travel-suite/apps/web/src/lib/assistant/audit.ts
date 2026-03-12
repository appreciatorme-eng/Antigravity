import "server-only";

/* ------------------------------------------------------------------
 * Audit Logger -- compliance and debugging trail for assistant actions.
 *
 * Every action the assistant proposes, confirms, executes, cancels,
 * or fails is recorded in the `assistant_audit_log` table.
 *
 * This module is best-effort: errors are caught and logged to stderr
 * so that audit failures never break the main conversation flow.
 *
 * ------------------------------------------------------------------ */

import { logError } from "@/lib/observability/logger";
import type { Json } from "@/lib/supabase/database.types";
import type { ActionContext } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The lifecycle events tracked for each assistant action. */
export type AuditEventType =
  | "action_proposed"
  | "action_confirmed"
  | "action_executed"
  | "action_cancelled"
  | "action_failed";

/** Shape of an audit event passed to the logger. */
export interface AuditEvent {
  readonly sessionId: string | null;
  readonly eventType: AuditEventType;
  readonly actionName: string | null;
  readonly actionParams: Record<string, unknown> | null;
  readonly actionResult: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Insert a single audit row. This function never throws -- all errors
 * are caught and written to the server log.
 */
export async function logAuditEvent(
  ctx: ActionContext,
  event: AuditEvent,
): Promise<void> {
  try {
    const { error } = await ctx.supabase
      .from("assistant_audit_log")
      .insert({
        organization_id: ctx.organizationId,
        user_id: ctx.userId,
        session_id: event.sessionId,
        channel: ctx.channel,
        event_type: event.eventType,
        action_name: event.actionName,
        action_params: event.actionParams as Json,
        action_result: event.actionResult as Json,
      });

    if (error) {
      logError("Assistant audit log insert error", error);
    }
  } catch (error: unknown) {
    // Best-effort -- never let audit logging break the main flow
    logError("Assistant audit log error", error);
  }
}
