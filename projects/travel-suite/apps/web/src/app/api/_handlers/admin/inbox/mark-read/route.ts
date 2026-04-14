/* ------------------------------------------------------------------
 * POST /api/admin/inbox/mark-read
 * Marks a conversation as read for the current user.
 * Body: { conversationId: string }
 *
 * GET /api/admin/inbox/mark-read
 * Returns all read timestamps for the current user (bulk fetch).
 * Used on initial inbox load to apply read state to conversations.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// GET — bulk fetch read state for all conversations
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiError("Not authenticated", 401);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inbox_read_state not yet in generated types
    const { data, error } = await (supabase as any)
      .from("inbox_read_state")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    if (error) {
      logError("[inbox/mark-read] GET failed", error);
      return apiError("Failed to fetch read state", 500);
    }

    // Return as a map: { [conversationId]: isoTimestamp }
    const readMap: Record<string, string> = {};
    for (const row of data ?? []) {
      readMap[row.conversation_id] = row.last_read_at;
    }

    return apiSuccess({ readMap });
  } catch (err) {
    logError("[inbox/mark-read] GET error", err);
    return apiError("Failed to fetch read state", 500);
  }
}

// ---------------------------------------------------------------------------
// POST — mark a single conversation as read
// ---------------------------------------------------------------------------

interface MarkReadBody {
  conversationId?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => ({}))) as MarkReadBody;
    const { conversationId } = body;

    if (!conversationId || typeof conversationId !== "string") {
      return apiError("'conversationId' is required", 400);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiError("Not authenticated", 401);

    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inbox_read_state not yet in generated types
    const { error } = await (supabase as any)
      .from("inbox_read_state")
      .upsert(
        {
          user_id: user.id,
          conversation_id: conversationId,
          last_read_at: now,
        },
        { onConflict: "user_id,conversation_id" },
      );

    if (error) {
      logError("[inbox/mark-read] POST upsert failed", error);
      return apiError("Failed to mark conversation as read", 500);
    }

    return apiSuccess({ conversationId, lastReadAt: now });
  } catch (err) {
    logError("[inbox/mark-read] POST error", err);
    return apiError("Failed to mark conversation as read", 500);
  }
}
