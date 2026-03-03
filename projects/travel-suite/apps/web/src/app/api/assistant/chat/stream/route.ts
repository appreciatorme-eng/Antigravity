import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionContext, ConversationMessage } from "@/lib/assistant/types";
import { findAction } from "@/lib/assistant/actions/registry";
import { isActionBlocked } from "@/lib/assistant/guardrails";
import { logAuditEvent } from "@/lib/assistant/audit";
import { getCachedContextSnapshot } from "@/lib/assistant/context-engine";
import { buildSystemPrompt } from "@/lib/assistant/prompts/system";
import { buildPreferencesBlock, getPreference } from "@/lib/assistant/preferences";
import { getCachedResponse, setCachedResponse, invalidateOrgCache } from "@/lib/assistant/response-cache";
import { getRelevantSchemas } from "@/lib/assistant/schema-router";
import { tryDirectExecution } from "@/lib/assistant/direct-executor";
import { checkUsageAllowed, incrementUsage } from "@/lib/assistant/usage-meter";
import { getSuggestedActions } from "@/lib/assistant/suggested-actions";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

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
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  readonly role: string;
  readonly content: string;
  readonly tool_call_id?: string;
  readonly name?: string;
  readonly tool_calls?: readonly OpenAIToolCall[];
}

interface OpenAIToolCall {
  readonly id: string;
  readonly type: "function";
  readonly function: {
    readonly name: string;
    readonly arguments: string;
  };
}

interface SSEWriter {
  readonly writeStatus: (status: string) => void;
  readonly writeToken: (token: string) => void;
  readonly writeData: (event: string, data: Record<string, unknown>) => void;
  readonly writeDone: (data?: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSSEWriter(controller: ReadableStreamDefaultController<Uint8Array>): SSEWriter {
  const encoder = new TextEncoder();

  return {
    writeStatus(status: string) {
      controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify({ status })}\n\n`));
    },
    writeToken(token: string) {
      controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ token })}\n\n`));
    },
    writeData(event: string, data: Record<string, unknown>) {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    },
    writeDone(data?: Record<string, unknown>) {
      controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify(data ?? {})}\n\n`));
    },
  };
}

/** Write a complete text reply as a series of SSE token events followed by done. */
function writeTextAsSSE(writer: SSEWriter, text: string): void {
  // Split into word-sized chunks for a natural streaming effect
  const words = text.split(/(\s+)/);
  for (const word of words) {
    if (word.length > 0) {
      writer.writeToken(word);
    }
  }
  writer.writeDone();
}

async function getOrganizationName(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
): Promise<string> {
  try {
    const { data } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();
    return data?.name ?? "your organization";
  } catch {
    return "your organization";
  }
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

/** Non-streaming OpenAI call (for tool-calling rounds). */
async function callOpenAI(
  apiKey: string,
  messages: readonly ChatMessage[],
  tools: readonly unknown[] | null,
): Promise<{
  readonly content: string | null;
  readonly toolCalls: readonly OpenAIToolCall[];
}> {
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
    throw new Error(`OpenAI API error: HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message: {
        content: string | null;
        tool_calls?: readonly OpenAIToolCall[];
      };
    }>;
  };

  const msg = data.choices?.[0]?.message;
  return {
    content: msg?.content ?? null,
    toolCalls: msg?.tool_calls ?? [],
  };
}

/** Streaming OpenAI call (for the final response). */
async function streamOpenAI(
  apiKey: string,
  messages: readonly ChatMessage[],
  writer: SSEWriter,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    stream: true,
  };

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const jsonStr = trimmed.slice(6);
      if (jsonStr === "[DONE]") continue;

      try {
        const chunk = JSON.parse(jsonStr) as {
          choices?: Array<{
            delta?: { content?: string };
          }>;
        };

        const token = chunk.choices?.[0]?.delta?.content;
        if (token) {
          fullText += token;
          writer.writeToken(token);
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }

  return fullText;
}

/** Execute a tool call and return the result message. */
async function executeToolCall(
  toolCall: OpenAIToolCall,
  ctx: ActionContext,
): Promise<{
  readonly toolMessage: ChatMessage;
  readonly hasProposal: boolean;
  readonly proposal: { actionName: string; params: Record<string, unknown>; confirmationMessage: string } | null;
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
      hasProposal: false,
      proposal: null,
    };
  }

  if (!action) {
    return {
      toolMessage: {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ success: false, message: `Unknown action: ${toolCall.function.name}` }),
      },
      hasProposal: false,
      proposal: null,
    };
  }

  let params: Record<string, unknown>;
  try {
    params = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
  } catch {
    return {
      toolMessage: {
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ success: false, message: "Invalid parameters." }),
      },
      hasProposal: false,
      proposal: null,
    };
  }

  if (action.requiresConfirmation) {
    const confirmationMessage = `I'd like to perform **${action.name}** with these details: ${JSON.stringify(params)}. Shall I proceed?`;

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
        content: JSON.stringify({ success: true, message: "Action requires user confirmation." }),
      },
      hasProposal: true,
      proposal: { actionName: action.name, params, confirmationMessage },
    };
  }

  const result = await action.execute(ctx, params);

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
      content: JSON.stringify({ success: result.success, message: result.message, data: result.data }),
    },
    hasProposal: false,
    proposal: null,
  };
}

// ---------------------------------------------------------------------------
// Main streaming handler
// ---------------------------------------------------------------------------

async function handleStreamingRequest(
  controller: ReadableStreamDefaultController<Uint8Array>,
  organizationId: string,
  userId: string,
  message: string,
  history: readonly ConversationMessage[],
) {
  const writer = createSSEWriter(controller);

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      writer.writeData("error", { message: "AI service is not configured." });
      writer.writeDone();
      controller.close();
      return;
    }

    // Build context
    writer.writeStatus("Loading your business context...");

    const adminClient = createAdminClient();
    const ctx: ActionContext = {
      organizationId,
      userId,
      channel: "web",
      supabase: adminClient,
    };

    // -- Usage metering: check if org is within their plan limit
    const usageStatus = await checkUsageAllowed(ctx);
    if (!usageStatus.allowed) {
      writeTextAsSSE(
        writer,
        `You've used ${usageStatus.used} of ${usageStatus.limit} assistant messages this month on the ${usageStatus.tier} plan. Upgrade to get more messages, or wait until next month for your quota to reset.`,
      );
      controller.close();
      return;
    }

    // -- Direct execution: try zero-cost pattern matching first
    const directResult = await tryDirectExecution(message, ctx);
    if (directResult !== null) {
      void incrementUsage(ctx, { isDirectExecution: true });
      writeTextAsSSE(writer, directResult.reply);
      controller.close();
      return;
    }

    // -- Response cache: check for cached response before OpenAI
    const cachedResponse = await getCachedResponse(organizationId, message);
    if (cachedResponse !== null) {
      void incrementUsage(ctx, { isCacheHit: true });
      writeTextAsSSE(writer, cachedResponse.reply);
      controller.close();
      return;
    }

    const [snapshot, orgName, prefsBlock, languagePref] = await Promise.all([
      getCachedContextSnapshot(ctx),
      getOrganizationName(adminClient, organizationId),
      buildPreferencesBlock(ctx),
      getPreference(ctx, "preferred_language"),
    ]);

    const language = typeof languagePref === "string" ? languagePref : undefined;
    const baseSystemPrompt = buildSystemPrompt(orgName, snapshot, language) + prefsBlock;
    const tools = getRelevantSchemas(message);
    let messages: readonly ChatMessage[] = buildChatMessages(baseSystemPrompt, history, message);

    // Function calling loop (non-streaming)
    let lastActionName: string | null = null;
    let pendingProposal: { actionName: string; params: Record<string, unknown>; confirmationMessage: string } | null = null;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      writer.writeStatus(round === 0 ? "Thinking..." : "Searching your data...");

      const result = await callOpenAI(openaiKey, messages, tools);

      // No tool calls — stream the final response
      if (result.toolCalls.length === 0) {
        if (result.content && result.content.trim().length >= 10) {
          // Good response from function-calling -- write it as tokens
          writer.writeStatus("Generating response...");
          for (const char of result.content) {
            writer.writeToken(char);
          }
          const suggestions = getSuggestedActions(lastActionName);
          void setCachedResponse(organizationId, message, { reply: result.content });
          void incrementUsage(ctx);
          writer.writeDone(suggestions.length > 0 ? { suggestedActions: suggestions } : undefined);
          controller.close();
          return;
        }

        // Weak response — fall through to stream a fresh answer
        break;
      }

      // Process tool calls
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: result.content ?? "",
        tool_calls: result.toolCalls,
      };

      const toolMessages: ChatMessage[] = [];
      for (const toolCall of result.toolCalls) {
        writer.writeStatus(`Looking up ${toolCall.function.name.replace(/_/g, " ")}...`);
        const toolResult = await executeToolCall(toolCall, ctx);
        toolMessages.push(toolResult.toolMessage);

        if (!toolResult.hasProposal && !toolResult.proposal) {
          lastActionName = toolCall.function.name;
        }

        if (toolResult.hasProposal && toolResult.proposal) {
          pendingProposal = toolResult.proposal;
        }
      }

      // If we have a pending confirmation, get a formatted message and stream it
      if (pendingProposal) {
        const followUpMessages: readonly ChatMessage[] = [
          ...messages,
          assistantMsg,
          ...toolMessages,
        ];

        writer.writeStatus("Preparing confirmation...");
        const finalText = await streamOpenAI(openaiKey, followUpMessages, writer);

        writer.writeData("proposal", {
          actionName: pendingProposal.actionName,
          params: pendingProposal.params,
          confirmationMessage: pendingProposal.confirmationMessage,
          reply: finalText,
        });

        void setCachedResponse(organizationId, message, {
          reply: finalText,
          actionProposal: pendingProposal,
        });
        void incrementUsage(ctx);
        writer.writeDone();
        controller.close();
        return;
      }

      // Feed tool results back
      messages = [...messages, assistantMsg, ...toolMessages];
    }

    // Stream the final response
    writer.writeStatus("Generating response...");
    const streamedReply = await streamOpenAI(openaiKey, messages, writer);
    const finalSuggestions = getSuggestedActions(lastActionName);
    void setCachedResponse(organizationId, message, { reply: streamedReply });
    void incrementUsage(ctx);
    writer.writeDone(finalSuggestions.length > 0 ? { suggestedActions: finalSuggestions } : undefined);
    controller.close();
  } catch (error) {
    writer.writeData("error", {
      message: error instanceof Error ? error.message : "Something went wrong.",
    });
    writer.writeDone();
    controller.close();
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Get organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const organizationId = profile?.organization_id;
    if (!organizationId) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limit: 60 messages per 5 minutes per user
    const rateLimit = await enforceRateLimit({
      identifier: user.id,
      limit: 60,
      windowMs: 5 * 60 * 1000,
      prefix: "assistant-chat-stream",
    });

    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please slow down and try again." }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Parse request
    const body = (await req.json()) as {
      message?: string;
      history?: Array<{ role: string; content: string }>;
    };

    const { message, history = [] } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sanitize and enforce length limit
    const sanitizedMessage = sanitizeText(message, { maxLength: 2000, preserveNewlines: true });
    if (!sanitizedMessage) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const normalizedHistory: ConversationMessage[] = history
      .slice(-20)
      .map((msg) => ({
        role: msg.role as ConversationMessage["role"],
        content: msg.content,
      }));

    // 4. Create SSE stream
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        handleStreamingRequest(
          controller,
          organizationId,
          user.id,
          sanitizedMessage,
          normalizedHistory,
        ).catch(() => {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Assistant stream error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
