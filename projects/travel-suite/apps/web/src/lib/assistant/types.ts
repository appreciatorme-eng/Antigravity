/* ------------------------------------------------------------------
 * Core type definitions for the GoBuddy assistant action system.
 *
 * All interfaces use readonly properties to enforce immutability.
 * This module is pure types plus one small helper function --
 * no side effects, no I/O.
 * ------------------------------------------------------------------ */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Fundamental enums / unions
// ---------------------------------------------------------------------------

/** Whether an action reads or writes data. */
export type ActionCategory = "read" | "write";

/** The channel through which the user is interacting. */
export type ActionChannel = "web" | "whatsapp";

// ---------------------------------------------------------------------------
// Action execution types
// ---------------------------------------------------------------------------

/**
 * Context passed to every action handler.
 *
 * The `supabase` client is the service-role admin client
 * (from lib/supabase/admin.ts) so actions can bypass RLS when needed.
 */
export interface ActionContext {
  readonly organizationId: string;
  readonly userId: string;
  readonly channel: ActionChannel;
  readonly supabase: SupabaseClient<Database>;
}

/**
 * The result returned by every action handler.
 *
 * `message` is a human-friendly summary the LLM can incorporate
 * directly into its response.
 */
export interface ActionResult {
  readonly success: boolean;
  readonly data?: unknown;
  readonly message: string;
  readonly affectedEntities?: ReadonlyArray<{
    readonly type: string;
    readonly id: string;
  }>;
}

// ---------------------------------------------------------------------------
// Action definition types
// ---------------------------------------------------------------------------

/**
 * JSON Schema object describing the parameters an action accepts.
 * This maps directly to the `parameters` field in an OpenAI function tool.
 */
export interface ActionParameterSchema {
  readonly type: "object";
  readonly properties: Record<string, unknown>;
  readonly required?: readonly string[];
}

/**
 * Full definition of a single assistant action.
 *
 * `requiresConfirmation` indicates that the orchestrator should present
 * a confirmation prompt to the user before executing the action (typically
 * used for write actions).
 */
export interface ActionDefinition {
  readonly name: string;
  readonly description: string;
  readonly category: ActionCategory;
  readonly parameters: ActionParameterSchema;
  readonly requiresConfirmation: boolean;
  readonly execute: (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ) => Promise<ActionResult>;
}

// ---------------------------------------------------------------------------
// OpenAI tool format
// ---------------------------------------------------------------------------

/**
 * Maps directly to the OpenAI chat completion tool format.
 * Used when building the `tools` array for a chat completion request.
 */
export interface OpenAITool {
  readonly type: "function";
  readonly function: {
    readonly name: string;
    readonly description: string;
    readonly parameters: ActionParameterSchema;
  };
}

/**
 * Convert an ActionDefinition into the OpenAI tool format expected by
 * the chat completions API.
 *
 * This is a pure mapping -- no side effects.
 */
export function toOpenAITool(def: ActionDefinition): OpenAITool {
  return {
    type: "function",
    function: {
      name: def.name,
      description: def.description,
      parameters: def.parameters,
    },
  };
}

// ---------------------------------------------------------------------------
// Context snapshot types (business data for system prompt enrichment)
// ---------------------------------------------------------------------------

/** A trip active today. */
export interface TripSnapshot {
  readonly id: string;
  readonly status: string | null;
  readonly clientName: string | null;
  readonly startDate: string | null;
  readonly endDate: string | null;
}

/** A pending / partially-paid / overdue invoice. */
export interface InvoiceSnapshot {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly clientName: string | null;
  readonly totalAmount: number;
  readonly balanceAmount: number;
  readonly currency: string;
  readonly dueDate: string | null;
  readonly status: string;
}

/** A recently active client. */
export interface ClientSnapshot {
  readonly id: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly lifecycleStage: string | null;
  readonly lastContactedAt: string | null;
}

/** A notification that failed to deliver. */
export interface FailedNotification {
  readonly id: string;
  readonly recipientName: string | null;
  readonly channel: string | null;
  readonly errorMessage: string | null;
}

/** Point-in-time snapshot of business context fed into the system prompt. */
export interface ContextSnapshot {
  readonly todayTrips: readonly TripSnapshot[];
  readonly pendingInvoices: readonly InvoiceSnapshot[];
  readonly recentClients: readonly ClientSnapshot[];
  readonly failedNotifications: readonly FailedNotification[];
  readonly generatedAt: string;
}

// ---------------------------------------------------------------------------
// Conversation types
// ---------------------------------------------------------------------------

/** A single message in the conversation history. */
export interface ConversationMessage {
  readonly role: "user" | "assistant" | "system" | "tool";
  readonly content: string;
  readonly toolCallId?: string;
  readonly name?: string;
}

// ---------------------------------------------------------------------------
// Orchestrator request / response
// ---------------------------------------------------------------------------

/** Input to the orchestrator. */
export interface OrchestratorRequest {
  readonly message: string;
  readonly history: readonly ConversationMessage[];
  readonly channel: ActionChannel;
  readonly organizationId: string;
  readonly userId: string;
}

/** Output from the orchestrator. */
export interface OrchestratorResponse {
  readonly reply: string;
  readonly citations?: ReadonlyArray<{
    readonly id: string;
    readonly question: string;
  }>;
  readonly actionProposal?: {
    readonly actionName: string;
    readonly params: Record<string, unknown>;
    readonly confirmationMessage: string;
  };
  readonly actionResult?: ActionResult;
  readonly suggestedActions?: ReadonlyArray<{
    readonly label: string;
    readonly prefilledMessage: string;
  }>;
}
