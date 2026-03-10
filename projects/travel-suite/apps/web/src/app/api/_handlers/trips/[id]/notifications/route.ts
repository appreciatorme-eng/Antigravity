import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";

const supabaseAdmin = createAdminClient();

async function getAuthUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user) return data.user.id;
  } else {
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    return user?.id || null;
  }
  return null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id?: string }> }) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId } = await params;
    if (!tripId) {
      return NextResponse.json({ error: "Missing trip id" }, { status: 400 });
    }

    // Fetch from notification_logs
    const { data: logs } = await supabaseAdmin
      .from("notification_logs")
      .select("id, notification_type, title, body, status, sent_at, created_at")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch from notification_queue
    const { data: queue } = await supabaseAdmin
      .from("notification_queue")
      .select("id, notification_type, status, scheduled_for, created_at, payload, channel_preference")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Combine and normalize
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

    // Merge and sort by created_at descending
    const notifications = [...fromLogs, ...fromQueue].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Trip notifications error:", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Request failed") },
      { status: 500 },
    );
  }
}
