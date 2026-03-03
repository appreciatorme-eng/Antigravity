import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConversation } from "@/lib/assistant/conversation-store";
import type { ActionContext } from "@/lib/assistant/types";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/assistant/conversations/[sessionId]
 *
 * Returns the full conversation detail for a single session.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError("Unauthorized", 401);
    }

    // 2. Get organization ID from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return jsonError("No organization found", 400);
    }

    // 3. Build ActionContext with admin client
    const ctx: ActionContext = {
      organizationId: profile.organization_id,
      userId: user.id,
      channel: "web",
      supabase: createAdminClient(),
    };

    // 4. Fetch conversation
    const { sessionId } = await params;

    if (!sessionId || sessionId.trim().length === 0) {
      return jsonError("Invalid session ID", 400);
    }

    const conversation = await getConversation(ctx, sessionId.trim());

    if (!conversation) {
      return jsonError("Conversation not found", 404);
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error("Conversation detail error:", error);
    return jsonError("Internal server error", 500);
  }
}
