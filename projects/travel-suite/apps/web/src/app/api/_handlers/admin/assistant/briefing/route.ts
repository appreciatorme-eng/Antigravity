import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";

const UpdateBriefingSchema = z.object({
  enabled: z.boolean(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;
    if (!auth.organizationId) {
      return apiError("Admin organization not configured", 400);
    }

    const organizationId = auth.organizationId;

    const [{ data: preferenceRow, error: preferenceError }, { data: connectionRow, error: connectionError }, { data: queueRow, error: queueError }] =
      await Promise.all([
        auth.adminClient
          .from("assistant_preferences")
          .select("preference_value")
          .eq("organization_id", organizationId)
          .eq("user_id", auth.userId)
          .eq("preference_key", "morning_briefing_enabled")
          .maybeSingle(),
        auth.adminClient
          .from("whatsapp_connections")
          .select("assistant_group_jid, status")
          .eq("organization_id", organizationId)
          .eq("status", "connected")
          .maybeSingle(),
        auth.adminClient
          .from("notification_queue")
          .select("scheduled_for, status")
          .eq("user_id", auth.userId)
          .eq("notification_type", "morning_briefing")
          .order("scheduled_for", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (preferenceError) {
      logError("[admin/assistant/briefing:GET] Failed to load preference", preferenceError);
      return apiError("Failed to load morning briefing settings", 500);
    }
    if (connectionError) {
      logError("[admin/assistant/briefing:GET] Failed to load WhatsApp connection", connectionError);
      return apiError("Failed to load morning briefing settings", 500);
    }
    if (queueError) {
      logError("[admin/assistant/briefing:GET] Failed to load last briefing", queueError);
      return apiError("Failed to load morning briefing settings", 500);
    }

    return apiSuccess({
      enabled: preferenceRow?.preference_value === true,
      assistantGroupReady: Boolean(connectionRow?.assistant_group_jid),
      lastBriefingAt: queueRow?.scheduled_for ?? null,
      lastBriefingStatus: queueRow?.status ?? null,
    });
  } catch (error) {
    logError("[admin/assistant/briefing:GET] Unhandled error", error);
    return apiError("An unexpected error occurred", 500);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;
    if (!auth.organizationId) {
      return apiError("Admin organization not configured", 400);
    }

    const organizationId = auth.organizationId;

    const body = await request.json().catch(() => null);
    const parsed = UpdateBriefingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid morning briefing setting", 400);
    }

    const { data: connectionRow, error: connectionError } = await auth.adminClient
      .from("whatsapp_connections")
      .select("assistant_group_jid")
      .eq("organization_id", organizationId)
      .eq("status", "connected")
      .maybeSingle();

    if (connectionError) {
      logError("[admin/assistant/briefing:PATCH] Failed to load WhatsApp connection", connectionError);
      return apiError("Failed to update morning briefing", 500);
    }

    if (parsed.data.enabled && !connectionRow?.assistant_group_jid) {
      return apiError("Connect the TripBuilt Assistant WhatsApp group first", 400);
    }

    const { error: updateError } = await auth.adminClient
      .from("assistant_preferences")
      .upsert(
        {
          organization_id: organizationId,
          user_id: auth.userId,
          preference_key: "morning_briefing_enabled",
          preference_value: parsed.data.enabled,
        },
        { onConflict: "organization_id,user_id,preference_key" },
      );

    if (updateError) {
      logError("[admin/assistant/briefing:PATCH] Failed to save preference", updateError);
      return apiError("Failed to update morning briefing", 500);
    }

    return apiSuccess({
      enabled: parsed.data.enabled,
      assistantGroupReady: Boolean(connectionRow?.assistant_group_jid),
    });
  } catch (error) {
    logError("[admin/assistant/briefing:PATCH] Unhandled error", error);
    return apiError("An unexpected error occurred", 500);
  }
}
