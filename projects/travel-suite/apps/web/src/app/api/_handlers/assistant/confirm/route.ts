import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAction } from "@/lib/assistant/actions/registry";
import { isActionBlocked } from "@/lib/assistant/guardrails";
import { logAuditEvent } from "@/lib/assistant/audit";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import type { ActionContext } from "@/lib/assistant/types";

export async function POST(req: Request) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("Unauthorized", 401);
    }

    // 2. Get organization ID
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

    // Rate limit: 30 confirmations per 5 minutes per user (stricter for writes)
    const rateLimit = await enforceRateLimit({
      identifier: user.id,
      limit: 30,
      windowMs: 5 * 60 * 1000,
      prefix: "assistant-confirm",
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many actions. Please slow down." },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = (await req.json()) as {
      action?: string; // "confirm" or "cancel"
      actionName?: string;
      params?: Record<string, unknown>;
    };

    const { action, actionName, params } = body;

    if (!action || !actionName) {
      return NextResponse.json(
        { error: "Missing action or actionName" },
        { status: 400 },
      );
    }

    // 4. Build context
    const adminClient = createAdminClient();
    const ctx: ActionContext = {
      organizationId: profile.organization_id,
      userId: user.id,
      channel: "web",
      supabase: adminClient,
    };

    // 5. Handle cancel
    if (action === "cancel") {
      void logAuditEvent(ctx, {
        sessionId: null,
        eventType: "action_cancelled",
        actionName,
        actionParams: params ?? null,
        actionResult: null,
      });

      return NextResponse.json({
        reply: "Action cancelled. Is there anything else I can help with?",
      });
    }

    // 6. Handle confirm
    if (action === "confirm") {
      // Blocklist check -- defence-in-depth against dangerous operations
      if (isActionBlocked(actionName)) {
        return NextResponse.json(
          { error: "This action is not permitted through the assistant." },
          { status: 403 },
        );
      }

      const actionDef = findAction(actionName);
      if (!actionDef) {
        return NextResponse.json(
          { error: `Unknown action: ${actionName}` },
          { status: 400 },
        );
      }

      // Execute the action
      const result = await actionDef.execute(ctx, params ?? {});

      // Audit log
      void logAuditEvent(ctx, {
        sessionId: null,
        eventType: result.success ? "action_executed" : "action_failed",
        actionName,
        actionParams: params ?? null,
        actionResult: { success: result.success, message: result.message },
      });

      return NextResponse.json({
        reply: result.message,
        actionResult: result,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'confirm' or 'cancel'." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Assistant confirm error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
