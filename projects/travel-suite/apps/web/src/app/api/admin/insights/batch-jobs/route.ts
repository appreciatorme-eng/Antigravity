import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";

function isSchemaDriftError(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("does not exist") || normalized.includes("could not find");
}

const EnqueueSchema = z.object({
  job_type: z.enum(["recompute_analytics", "recompute_upsell", "refresh_copilot"]).default("recompute_analytics"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const { data, error } = await admin.adminClient
    .from("notification_queue")
    .select("id,status,scheduled_for,created_at,last_attempt_at,error_message,payload")
    .eq("notification_type", "analytics_batch")
    .eq("recipient_type", "admin")
    .eq("recipient_email", admin.organizationId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    if (isSchemaDriftError(error.message)) {
      return NextResponse.json({
        jobs: [],
        unavailable_reason: "notification queue schema not available in this environment",
      });
    }
    return NextResponse.json({ error: error.message || "Failed to list batch jobs" }, { status: 500 });
  }

  return NextResponse.json({ jobs: data || [] });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = EnqueueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const idempotencyKey = `analytics-batch:${admin.organizationId}:${parsed.data.job_type}:${Date.now()}`;

  const { data, error } = await admin.adminClient
    .from("notification_queue")
    .insert({
      notification_type: "analytics_batch",
      recipient_type: "admin",
      recipient_email: admin.organizationId,
      user_id: admin.userId,
      status: "pending",
      scheduled_for: now,
      channel_preference: "system",
      idempotency_key: idempotencyKey,
      payload: {
        job_type: parsed.data.job_type,
        priority: parsed.data.priority,
        requested_by: admin.userId,
        organization_id: admin.organizationId,
      },
    })
    .select("id,status,scheduled_for,created_at,payload")
    .single();

  if (error || !data) {
    if (isSchemaDriftError(error?.message)) {
      return NextResponse.json(
        {
          queued: false,
          error: "Batch queue is unavailable until notification migrations are applied",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error?.message || "Failed to enqueue job" }, { status: 500 });
  }

  return NextResponse.json({
    queued: true,
    job: data,
    note: "Heavy insight recomputation queued asynchronously. Process with a scheduled worker.",
  });
}
