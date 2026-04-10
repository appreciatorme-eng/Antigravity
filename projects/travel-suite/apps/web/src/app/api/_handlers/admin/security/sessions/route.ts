import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = { from: (table: string) => any };

const DeleteSchema = z.object({
  session_id: z.string().uuid(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const db = auth.adminClient as unknown as AnyClient;
    const { data, error } = await db
      .from("user_sessions")
      .select("id, supabase_session_id, ip_address, device_name, browser, os, city, country, created_at, last_seen_at")
      .eq("user_id", auth.userId)
      .order("last_seen_at", { ascending: false })
      .limit(10);

    if (error) {
      logError("[admin/security/sessions:GET] Failed to load sessions", error);
      return apiError("Failed to load sessions", 500);
    }

    return apiSuccess({ sessions: (data as unknown[]) ?? [] });
  } catch (error) {
    logError("[admin/security/sessions:GET] Unhandled error", error);
    return apiError("An unexpected error occurred", 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid session ID", 400);

    const db = auth.adminClient as unknown as AnyClient;

    // Verify ownership before deleting
    const { data: session, error: fetchError } = await db
      .from("user_sessions")
      .select("id")
      .eq("id", parsed.data.session_id)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (fetchError) {
      logError("[admin/security/sessions:DELETE] Failed to fetch session", fetchError);
      return apiError("Failed to find session", 500);
    }
    if (!session) return apiError("Session not found", 404);

    const { error: deleteError } = await db
      .from("user_sessions")
      .delete()
      .eq("id", parsed.data.session_id)
      .eq("user_id", auth.userId);

    if (deleteError) {
      logError("[admin/security/sessions:DELETE] Failed to delete session", deleteError);
      return apiError("Failed to revoke session", 500);
    }

    return apiSuccess({ revoked: true });
  } catch (error) {
    logError("[admin/security/sessions:DELETE] Unhandled error", error);
    return apiError("An unexpected error occurred", 500);
  }
}
