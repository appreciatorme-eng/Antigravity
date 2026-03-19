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

    // assistant_audit_log.user_id → auth.users (not profiles), so we can't
    // use a PostgREST join to profiles. Fetch logs first, then look up names
    // separately via the profiles table.
    const { data: rows, error } = await adminClient
      .from("assistant_audit_log")
      .select("id, event_type, action_name, action_params, action_result, channel, created_at, user_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      logError("[admin/activity] DB error", error);
      return apiError("Failed to fetch activity logs", 500);
    }

    // Collect distinct user IDs and look up their display names
    const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter(Boolean))] as string[];
    const userNameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        userNameMap.set(p.id, (p.full_name ?? p.email ?? "Unknown user") as string);
      }
    }

    const activities = (rows ?? []).map((row) => ({
      id: row.id,
      eventType: row.event_type,
      actionName: row.action_name,
      actionParams: row.action_params,
      actionResult: row.action_result,
      channel: row.channel,
      createdAt: row.created_at,
      userId: row.user_id,
      userName: row.user_id ? (userNameMap.get(row.user_id) ?? "Unknown user") : "Unknown user",
    }));

    return NextResponse.json({ data: { activities } });
  } catch (error) {
    logError("[/api/admin/activity:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
