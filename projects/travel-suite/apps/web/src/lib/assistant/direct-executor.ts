import "server-only";

/* ------------------------------------------------------------------
 * Direct Executor -- pattern-matches common queries and executes
 * actions directly without any OpenAI API call.
 *
 * This module achieves zero LLM cost for frequently asked queries
 * by mapping well-known user intents to registered actions via
 * regex patterns. Each pattern has a simple template formatter
 * that converts the ActionResult into a human-readable reply.
 *
 * Pure pattern matching with immutable data structures.
 * Falls back to null so the caller can route to the full
 * orchestrator when no pattern matches.
 * ------------------------------------------------------------------ */

import type { ActionContext, OrchestratorResponse, ActionResult } from "./types";
import { findAction } from "./actions/registry";

// ---------------------------------------------------------------------------
// Direct pattern definition
// ---------------------------------------------------------------------------

/** A mapping from a regex pattern to an action name and reply formatter. */
interface DirectPattern {
  readonly pattern: RegExp;
  readonly actionName: string;
  readonly formatReply: (result: ActionResult) => string;
}

// ---------------------------------------------------------------------------
// Template formatters
// ---------------------------------------------------------------------------

const formatTodaySummary = (result: ActionResult): string =>
  `Here's your summary for today:\n\n${result.message}`;

const formatOverdueInvoices = (result: ActionResult): string =>
  `Here are your overdue invoices:\n\n${result.message}`;

const formatPassthrough = (result: ActionResult): string => result.message;

// ---------------------------------------------------------------------------
// Pattern table (first match wins)
// ---------------------------------------------------------------------------

const DIRECT_PATTERNS: readonly DirectPattern[] = [
  {
    pattern:
      /^(what'?s?\s+happening\s+today|today'?s?\s+summary|show\s+(me\s+)?today|what.*today)/i,
    actionName: "get_today_summary",
    formatReply: formatTodaySummary,
  },
  {
    pattern: /^(show\s+)?(me\s+)?(all\s+)?(overdue|unpaid)\s+invoices?/i,
    actionName: "get_overdue_invoices",
    formatReply: formatOverdueInvoices,
  },
  {
    pattern:
      /^(what\s+needs?\s+attention|pending\s+items?|action\s+items?|show\s+(me\s+)?pending)/i,
    actionName: "get_pending_items",
    formatReply: formatPassthrough,
  },
  {
    pattern: /^(show\s+)?(me\s+)?(my\s+)?(preferences?|settings?)/i,
    actionName: "get_my_preferences",
    formatReply: formatPassthrough,
  },
  {
    pattern:
      /^(kpi|dashboard|stats|statistics|key\s+metrics?|business\s+snapshot)/i,
    actionName: "get_kpi_snapshot",
    formatReply: formatPassthrough,
  },
];

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Attempt to handle a user message via direct pattern matching.
 *
 * Returns an OrchestratorResponse when a known pattern matches and the
 * corresponding action executes successfully. Returns null when no pattern
 * matches or the action fails, signalling the caller to fall through to
 * the full LLM-based orchestrator.
 */
export async function tryDirectExecution(
  message: string,
  ctx: ActionContext,
): Promise<OrchestratorResponse | null> {
  try {
    const trimmed = message.trim();

    // Find the first matching pattern
    const match = DIRECT_PATTERNS.find((dp) => dp.pattern.test(trimmed));

    if (!match) {
      return null;
    }

    // Look up the registered action
    const action = findAction(match.actionName);

    if (!action) {
      return null;
    }

    // Execute with empty params -- direct patterns need no arguments
    const result: ActionResult = await action.execute(ctx, {});

    if (!result.success) {
      return null;
    }

    return {
      reply: match.formatReply(result),
      actionResult: result,
    };
  } catch {
    // Any unexpected error -- fall through to the full orchestrator
    return null;
  }
}
