import "server-only";

/* ------------------------------------------------------------------
 * Orchestrator -- function-calling loop with OpenAI.
 *
 * This is the brain of the assistant. It:
 *   1. Validates the incoming request
 *   2. Builds an enriched system prompt (business snapshot + FAQ)
 *   3. Sends the conversation to OpenAI with registered tool schemas
 *   4. Executes tool calls returned by the model
 *   5. Feeds tool results back for a final formatted reply
 *
 * Maximum 3 tool-call rounds to prevent infinite loops.
 * Every function is pure where possible; side effects are limited
 * to OpenAI fetch calls and action execution.
 * ------------------------------------------------------------------ */

import fs from "node:fs";
import path from "node:path";

import type {
  ActionContext,
  ConversationMessage,
  OrchestratorRequest,
  OrchestratorResponse,
  ActionResult,
} from "./types";
import { findAction } from "./actions/registry";
import { isActionBlocked } from "./guardrails";
import { logAuditEvent } from "./audit";
import { getCachedContextSnapshot } from "./context-engine";
import { buildSystemPrompt } from "./prompts/system";
import { buildPreferencesBlock, getPreference } from "./preferences";
import { getCachedResponse, setCachedResponse, invalidateOrgCache } from "./response-cache";
import { getSemanticCachedResponse, setSemanticCachedResponse } from "./semantic-response-cache";
import { getRelevantSchemas } from "./schema-router";
import { tryDirectExecution } from "./direct-executor";
import { checkUsageAllowed, incrementUsage } from "./usage-meter";
import { getSuggestedActions } from "./suggested-actions";
import { getActiveWorkflow, startWorkflow, processWorkflowStep } from "./workflows/engine";
import { findWorkflow, ALL_WORKFLOWS } from "./workflows/definitions";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";
const MAX_TOOL_ROUNDS = 3;
const MAX_HISTORY_MESSAGES = 10;
const MAX_TOKENS = 800;
const TEMPERATURE = 0.3;

// ---------------------------------------------------------------------------
// FAQ fallback -- reused from the original route.ts
// ---------------------------------------------------------------------------

const FAQ_PATH = path.join(
  process.cwd(),
  "..",
  "..",
  "apps",
  "rag-assistant",
  "faq",
  "faq_tour_operator.jsonl",
);

interface FaqRow {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly category: string;
  readonly source: string;
}

function loadFaq(): readonly FaqRow[] {
  try {
    const lines = fs
      .readFileSync(FAQ_PATH, "utf8")
      .split("\n")
      .filter(Boolean);
    return lines.map((line) => JSON.parse(line) as FaqRow);
  } catch {
    return [];
  }
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

function retrieveFaqContext(query: string, maxChunks = 3): readonly FaqRow[] {
  const rows = loadFaq();
  const queryTokens = tokenize(query);

  return rows
    .map((row) => {
      const rowTokens = tokenize(`${row.question} ${row.answer}`);
      let overlap = 0;
      queryTokens.forEach((t) => {
        if (rowTokens.has(t)) overlap++;
      });
      return { row, score: overlap };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((item) => item.row);
}

/** Build an FAQ block string suitable for appending to the system prompt. */
function buildFaqBlock(faqRows: readonly FaqRow[]): string {
  if (faqRows.length === 0) return "";

  const entries = faqRows
    .map((r) => `Q: ${r.question}\nA: ${r.answer}`)
    .join("\n\n");

  return `\n\n## FAQ Context\n${entries}`;
}

// ---------------------------------------------------------------------------
// OpenAI response types (minimal, matching the API shape we use)
// ---------------------------------------------------------------------------

interface OpenAIToolCall {
  readonly id: string;
  readonly type: "function";
  readonly function: {
    readonly name: string;
    readonly arguments: string;
  };
}

interface OpenAIMessage {
  readonly role: string;
  readonly content: string | null;
  readonly tool_calls?: readonly OpenAIToolCall[];
}

interface OpenAIChoice {
  readonly message: OpenAIMessage;
  readonly finish_reason: string;
}

interface OpenAIResponse {
  readonly choices?: readonly OpenAIChoice[];
  readonly error?: { readonly message?: string };
}

// ---------------------------------------------------------------------------
// Chat message builders (immutable)
// ---------------------------------------------------------------------------

interface ChatMessage {
  readonly role: string;
  readonly content: string;
  readonly tool_call_id?: string;
  readonly name?: string;
  readonly tool_calls?: readonly OpenAIToolCall[];
}

function buildChatMessages(
  systemPrompt: string,
  history: readonly ConversationMessage[],
  userMessage: string,
): readonly ChatMessage[] {
  const systemMsg: ChatMessage = { role: "system", content: systemPrompt };

  const historySlice = history.slice(-MAX_HISTORY_MESSAGES).map(
    (msg): ChatMessage => ({
      role: msg.role,
      content: msg.content,
      ...(msg.toolCallId ? { tool_call_id: msg.toolCallId } : {}),
      ...(msg.name ? { name: msg.name } : {}),
    }),
  );

  const userMsg: ChatMessage = { role: "user", content: userMessage };

  return [systemMsg, ...historySlice, userMsg];
}

// ---------------------------------------------------------------------------
// OpenAI API caller
// ---------------------------------------------------------------------------

async function callOpenAI(
  apiKey: string,
  messages: readonly ChatMessage[],
  tools: readonly unknown[] | null,
): Promise<OpenAIResponse> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
  };

  if (tools !== null && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => ({}))) as OpenAIResponse;
    const detail = errorBody.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`OpenAI API error: ${detail}`);
  }

  return (await response.json()) as OpenAIResponse;
}

// ---------------------------------------------------------------------------
// Tool-call executor
// ---------------------------------------------------------------------------

async function executeToolCall(
  toolCall: OpenAIToolCall,
  ctx: ActionContext,
): Promise<{
  readonly toolMessage: ChatMessage;
  readonly actionResult: ActionResult | null;
  readonly requiresConfirmation: boolean;
  readonly confirmationPayload: OrchestratorResponse["actionProposal"] | null;
}> {
  const action = findAction(toolCall.function.name);

  // Blocklist check -- defence-in-depth against dangerous operations
  if (isActionBlocked(toolCall.function.name)) {
    return {
      toolMessage: {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          success: false,
          message: `Action "${toolCall.function.name}" is not permitted through the assistant.`,
        }),
      },
      actionResult: null,
      requiresConfirmation: false,
      confirmationPayload: null,
    };
  }

  if (!action) {
    return {
      toolMessage: {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          success: false,
          message: `Unknown action: ${toolCall.function.name}`,
        }),
      },
      actionResult: null,
      requiresConfirmation: false,
      confirmationPayload: null,
    };
  }

  // Parse parameters safely
  let params: Record<string, unknown>;
  try {
    params = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
  } catch {
    return {
      toolMessage: {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          success: false,
          message: "Invalid parameters received from the AI model.",
        }),
      },
      actionResult: null,
      requiresConfirmation: false,
      confirmationPayload: null,
    };
  }

  // If the action requires confirmation, don't execute -- return a proposal
  if (action.requiresConfirmation) {
    const confirmationMessage = `I'd like to perform **${action.name}** with these details: ${JSON.stringify(params)}. Shall I proceed?`;

    // Audit: log the proposed write action
    void logAuditEvent(ctx, {
      sessionId: null,
      eventType: "action_proposed",
      actionName: toolCall.function.name,
      actionParams: params,
      actionResult: null,
    });

    return {
      toolMessage: {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({
          success: true,
          message: "Action requires user confirmation before execution.",
        }),
      },
      actionResult: null,
      requiresConfirmation: true,
      confirmationPayload: {
        actionName: action.name,
        params,
        confirmationMessage,
      },
    };
  }

  // Execute read actions immediately
  const result = await action.execute(ctx, params);

  // Audit: log the executed action
  void logAuditEvent(ctx, {
    sessionId: null,
    eventType: "action_executed",
    actionName: toolCall.function.name,
    actionParams: params,
    actionResult: { success: result.success, message: result.message },
  });

  // Invalidate response cache after write actions so stale data is not served
  if (action.category === "write") {
    void invalidateOrgCache(ctx.organizationId);
  }

  return {
    toolMessage: {
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify({
        success: result.success,
        message: result.message,
        data: result.data,
      }),
    },
    actionResult: result,
    requiresConfirmation: false,
    confirmationPayload: null,
  };
}

// ---------------------------------------------------------------------------
// Organization name lookup
// ---------------------------------------------------------------------------

async function getOrganizationName(
  ctx: ActionContext,
): Promise<string> {
  try {
    const { data } = await ctx.supabase
      .from("organizations")
      .select("name")
      .eq("id", ctx.organizationId)
      .single();

    return data?.name ?? "your organization";
  } catch {
    return "your organization";
  }
}

// ---------------------------------------------------------------------------
// Extract reply text from OpenAI response
// ---------------------------------------------------------------------------

function extractReplyText(response: OpenAIResponse): string {
  return (
    response.choices?.[0]?.message?.content?.trim() ??
    "I could not generate a response. Please try again."
  );
}

// ---------------------------------------------------------------------------
// Main orchestrator entry point
// ---------------------------------------------------------------------------

export async function handleMessage(
  request: OrchestratorRequest,
): Promise<OrchestratorResponse> {
  // 1. Validate input
  const trimmedMessage = request.message.trim();
  if (!trimmedMessage) {
    return { reply: "Please enter a message." };
  }

  // 2. Verify OpenAI API key is available
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return { reply: "AI service is not configured. Please contact support." };
  }

  // 3. Build action context
  const adminClient = createAdminClient();
  const ctx: ActionContext = {
    organizationId: request.organizationId,
    userId: request.userId,
    channel: request.channel,
    supabase: adminClient,
  };

  // 4. Usage metering: check if org is within their plan limit
  const usageStatus = await checkUsageAllowed(ctx);
  if (!usageStatus.allowed) {
    return {
      reply: `You've used ${usageStatus.used} of ${usageStatus.limit} assistant messages this month on the ${usageStatus.tier} plan. Upgrade to get more messages, or wait until next month for your quota to reset.`,
    };
  }

  // 5. Direct execution: try zero-cost pattern matching first
  const directResult = await tryDirectExecution(trimmedMessage, ctx);
  if (directResult !== null) {
    void incrementUsage(ctx, { isDirectExecution: true });
    return directResult;
  }

  // 6. Workflow handling: check for active workflow or trigger new one
  const activeWorkflow = await getActiveWorkflow(ctx);
  if (activeWorkflow !== null) {
    const workflowDef = ALL_WORKFLOWS.find((w) => w.id === activeWorkflow.workflowId);
    if (workflowDef) {
      const workflowResult = await processWorkflowStep(ctx, workflowDef, activeWorkflow, trimmedMessage);
      void incrementUsage(ctx, { isDirectExecution: true });
      return workflowResult;
    }
  }

  const triggeredWorkflow = findWorkflow(trimmedMessage);
  if (triggeredWorkflow !== null) {
    const workflowResult = await startWorkflow(ctx, triggeredWorkflow);
    void incrementUsage(ctx, { isDirectExecution: true });
    return workflowResult;
  }

  // 7. Response cache: check for cached response before OpenAI
  const cachedResponse = await getCachedResponse(ctx.organizationId, trimmedMessage);
  if (cachedResponse !== null) {
    void incrementUsage(ctx, { isCacheHit: true });
    return cachedResponse;
  }

  // 7.5. Semantic cache: fuzzy match for near-identical queries
  const semanticCached = await getSemanticCachedResponse(ctx.organizationId, trimmedMessage, openaiKey);
  if (semanticCached !== null) {
    void incrementUsage(ctx, { isCacheHit: true });
    return semanticCached;
  }

  // 8. Gather enrichment data in parallel
  const [snapshot, orgName, prefsBlock, languagePref] = await Promise.all([
    getCachedContextSnapshot(ctx),
    getOrganizationName(ctx),
    buildPreferencesBlock(ctx),
    getPreference(ctx, "preferred_language"),
  ]);

  const language = typeof languagePref === "string" ? languagePref : undefined;

  // 9. Build system prompt with business context + user preferences
  const baseSystemPrompt = buildSystemPrompt(orgName, snapshot, language) + prefsBlock;

  // 10. Build initial message array with smart schema routing
  const tools = getRelevantSchemas(trimmedMessage);
  let messages: readonly ChatMessage[] = buildChatMessages(
    baseSystemPrompt,
    request.history,
    trimmedMessage,
  );

  // 11. Function-calling loop (max MAX_TOOL_ROUNDS rounds)
  let lastActionResult: ActionResult | null = null;
  let lastActionName: string | null = null;
  let pendingProposal: OrchestratorResponse["actionProposal"] | null = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await callOpenAI(openaiKey, messages, tools);
    const choice = response.choices?.[0];

    if (!choice) {
      return { reply: "I could not generate a response. Please try again." };
    }

    const assistantMessage = choice.message;
    const toolCalls = assistantMessage.tool_calls;

    // No tool calls -- the model produced a final text response
    if (!toolCalls || toolCalls.length === 0) {
      const replyText = assistantMessage.content?.trim() ?? "";

      // If the reply is empty or very short, try FAQ fallback
      if (replyText.length < 10) {
        return buildFaqFallbackResponse(
          openaiKey,
          baseSystemPrompt,
          request.history,
          trimmedMessage,
        );
      }

      const suggestions = getSuggestedActions(lastActionName);
      const textResponse: OrchestratorResponse = {
        reply: replyText,
        ...(lastActionResult ? { actionResult: lastActionResult } : {}),
        ...(suggestions.length > 0 ? { suggestedActions: suggestions } : {}),
      };
      void setCachedResponse(ctx.organizationId, trimmedMessage, textResponse);
      void setSemanticCachedResponse(ctx.organizationId, trimmedMessage, textResponse, openaiKey);
      void incrementUsage(ctx);
      return textResponse;
    }

    // Process each tool call
    const toolMessages: ChatMessage[] = [];
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: assistantMessage.content ?? "",
      tool_calls: toolCalls,
    };

    for (const toolCall of toolCalls) {
      const result = await executeToolCall(toolCall, ctx);
      toolMessages.push(result.toolMessage);

      if (result.actionResult) {
        lastActionResult = result.actionResult;
        lastActionName = toolCall.function.name;
      }

      // If any tool requires confirmation, short-circuit
      if (result.requiresConfirmation && result.confirmationPayload) {
        pendingProposal = result.confirmationPayload;
      }
    }

    // If we have a pending confirmation, ask the LLM to format a nice message
    if (pendingProposal) {
      const followUpMessages: readonly ChatMessage[] = [
        ...messages,
        assistantMsg,
        ...toolMessages,
      ];

      const confirmResponse = await callOpenAI(
        openaiKey,
        followUpMessages,
        null,
      );

      const proposalResponse: OrchestratorResponse = {
        reply: extractReplyText(confirmResponse),
        actionProposal: pendingProposal,
      };
      void setCachedResponse(ctx.organizationId, trimmedMessage, proposalResponse);
      void setSemanticCachedResponse(ctx.organizationId, trimmedMessage, proposalResponse, openaiKey);
      void incrementUsage(ctx);
      return proposalResponse;
    }

    // Feed tool results back to OpenAI for the next round
    messages = [...messages, assistantMsg, ...toolMessages];
  }

  // If we exhausted all rounds, get a final summary from the model
  const finalResponse = await callOpenAI(openaiKey, messages, null);

  const suggestions = getSuggestedActions(lastActionName);
  const exhaustedResponse: OrchestratorResponse = {
    reply: extractReplyText(finalResponse),
    ...(lastActionResult ? { actionResult: lastActionResult } : {}),
    ...(suggestions.length > 0 ? { suggestedActions: suggestions } : {}),
  };
  void setCachedResponse(ctx.organizationId, trimmedMessage, exhaustedResponse);
  void setSemanticCachedResponse(ctx.organizationId, trimmedMessage, exhaustedResponse, openaiKey);
  void incrementUsage(ctx);
  return exhaustedResponse;
}

// ---------------------------------------------------------------------------
// FAQ fallback -- used when the model produces an empty or weak response
// ---------------------------------------------------------------------------

async function buildFaqFallbackResponse(
  apiKey: string,
  baseSystemPrompt: string,
  history: readonly ConversationMessage[],
  userMessage: string,
): Promise<OrchestratorResponse> {
  const faqRows = retrieveFaqContext(userMessage);

  if (faqRows.length === 0) {
    return {
      reply:
        "I'm not sure how to help with that. Could you rephrase your question, or ask about trips, clients, invoices, proposals, or drivers?",
    };
  }

  const enrichedPrompt = baseSystemPrompt + buildFaqBlock(faqRows);

  const messages = buildChatMessages(enrichedPrompt, history, userMessage);
  const response = await callOpenAI(apiKey, messages, null);

  const citations = faqRows.slice(0, 2).map((r) => ({
    id: r.id,
    question: r.question,
  }));

  return {
    reply: extractReplyText(response),
    citations,
  };
}
