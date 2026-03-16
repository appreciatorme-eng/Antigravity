import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id?: string }> },
) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: true });
    if (!admin.ok) {
      return admin.response;
    }

    const { id: tripId } = await params;
    if (!tripId || !UUID_REGEX.test(tripId)) {
      return apiError("Invalid trip id", 400);
    }

    let tripScopeQuery = admin.adminClient
      .from("trips")
      .select("id")
      .eq("id", tripId);

    if (!admin.isSuperAdmin) {
      tripScopeQuery = tripScopeQuery.eq("organization_id", admin.organizationId ?? "");
    }

    const { data: scopedTrip, error: scopedTripError } = await tripScopeQuery.maybeSingle();

    if (scopedTripError || !scopedTrip) {
      return apiError("Trip not found", 404);
    }

    const { data: logs } = await admin.adminClient
      .from("notification_logs")
      .select("id, notification_type, title, body, status, sent_at, created_at")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: queue } = await admin.adminClient
      .from("notification_queue")
      .select("id, notification_type, status, scheduled_for, created_at, payload, channel_preference")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(50);

    const fromLogs = (logs || []).map((log) => ({
      id: log.id,
      source: "log" as const,
      notification_type: log.notification_type || "unknown",
      title: log.title || null,
      body: log.body || null,
      status: log.status || null,
      channel: null,
      scheduled_for: null,
      sent_at: log.sent_at || null,
      created_at: log.created_at || null,
    }));

    const fromQueue = (queue || []).map((item) => {
      const payload = item.payload as Record<string, unknown> | null;
      return {
        id: item.id,
        source: "queue" as const,
        notification_type: item.notification_type || "unknown",
        title: (payload?.title as string) || null,
        body: (payload?.body as string) || null,
        status: item.status || null,
        channel: item.channel_preference || null,
        scheduled_for: item.scheduled_for || null,
        sent_at: null,
        created_at: item.created_at || null,
      };
    });

    const notifications = [...fromLogs, ...fromQueue].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    logError("Trip notifications error", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Request failed") },
      { status: 500 },
    );
  }
}
