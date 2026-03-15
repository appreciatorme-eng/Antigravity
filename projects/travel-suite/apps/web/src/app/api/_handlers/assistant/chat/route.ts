import { NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { handleMessage } from "@/lib/assistant/orchestrator";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { logError } from "@/lib/observability/logger";
import { normalizeClientConversationHistory } from "@/lib/assistant/history-validation";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("Unauthorized", 401);
    }

    // 2. Get organization ID from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Rate limit: 60 messages per 5 minutes per user
    const rateLimit = await enforceRateLimit({
      identifier: user.id,
      limit: 60,
      windowMs: 5 * 60 * 1000,
      prefix: "assistant-chat",
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down and try again." },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const message = body.message;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Sanitize and enforce length limit
    const sanitizedMessage = sanitizeText(message, { maxLength: 2000, preserveNewlines: true });
    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const normalizedHistoryResult = normalizeClientConversationHistory(body.history);
    if (!normalizedHistoryResult.ok) {
      return NextResponse.json(
        { error: normalizedHistoryResult.error },
        { status: 400 },
      );
    }
    const normalizedHistory = normalizedHistoryResult.history;

    // 5. Call the orchestrator
    const response = await handleMessage({
      message: sanitizedMessage,
      history: normalizedHistory,
      channel: "web",
      organizationId: profile.organization_id,
      userId: user.id,
    });

    // 6. Return orchestrator response
    return apiSuccess(response);
  } catch (error) {
    logError("Assistant chat error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
