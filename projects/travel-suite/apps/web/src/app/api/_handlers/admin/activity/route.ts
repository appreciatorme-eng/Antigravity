/* ------------------------------------------------------------------
 * GET /api/admin/activity
 * Returns organization activity audit trail from assistant_audit_log
 * ------------------------------------------------------------------ */

import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";

export async function GET(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;
    const { organizationId, adminClient } = authResult;

    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    const { data: rows, error } = await adminClient
      .from("assistant_audit_log")
      .select(`
        id,
        event_type,
        action_name,
        action_params,
        action_result,
        channel,
        created_at,
        user_id,
        profiles!assistant_audit_log_user_id_fkey(full_name, email)
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      logError("[admin/activity] DB error", error);
      return apiError("Failed to fetch activity logs", 500);
    }

    const activities = (rows || []).map((row) => {
      const profileRecord = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const userName = (profileRecord as { full_name?: string; email?: string } | null)?.full_name
        ?? (profileRecord as { full_name?: string; email?: string } | null)?.email
        ?? "Unknown user";

      return {
        id: row.id,
        eventType: row.event_type,
        actionName: row.action_name,
        actionParams: row.action_params,
        actionResult: row.action_result,
        channel: row.channel,
        createdAt: row.created_at,
        userId: row.user_id,
        userName,
      };
    });

    return NextResponse.json({ data: { activities } });
  } catch (error) {
    logError("[/api/admin/activity:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
