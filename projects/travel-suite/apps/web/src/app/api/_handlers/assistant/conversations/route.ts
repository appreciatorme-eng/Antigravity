import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listConversations,
  searchConversations,
  deleteConversation,
} from "@/lib/assistant/conversation-store";
import { logError } from "@/lib/observability/logger";
import type { ActionContext } from "@/lib/assistant/types";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Build an ActionContext after authenticating the caller.
 * Returns null (with an error response) when auth fails.
 */
async function authenticate(): Promise<
  | { readonly ctx: ActionContext; readonly response?: never }
  | { readonly ctx?: never; readonly response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { response: jsonError("Unauthorized", 401) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { response: jsonError("No organization found", 400) };
  }

  const ctx: ActionContext = {
    organizationId: profile.organization_id,
    userId: user.id,
    channel: "web",
    supabase: createAdminClient(),
  };

  return { ctx };
}

/**
 * GET /api/assistant/conversations
 *
 * Query params:
 *   search  - full-text search query (optional)
 *   limit   - max results (default 20)
 *   offset  - pagination offset (default 0)
 */
export async function GET(request: Request) {
  try {
    const auth = await authenticate();
    if (auth.response) return auth.response;
    const { ctx } = auth;

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() ?? "";
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

    if (search.length > 0) {
      const conversations = await searchConversations(ctx, search, limit);
      return NextResponse.json({ success: true, conversations, query: search });
    }

    const conversations = await listConversations(ctx, { limit, offset });
    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    logError("Conversations list error", error);
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE /api/assistant/conversations?sessionId=...
 *
 * Deletes all messages for the given session.
 */
export async function DELETE(request: Request) {
  try {
    const auth = await authenticate();
    if (auth.response) return auth.response;
    const { ctx } = auth;

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";

    if (!sessionId) {
      return jsonError("sessionId query parameter is required", 400);
    }

    const deleted = await deleteConversation(ctx, sessionId);
    if (!deleted) {
      return jsonError("Failed to delete conversation", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Conversation delete error", error);
    return jsonError("Internal server error", 500);
  }
}
