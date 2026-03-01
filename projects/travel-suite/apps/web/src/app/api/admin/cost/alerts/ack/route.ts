import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";

const AckAlertSchema = z.object({
  alert_id: z.string().trim().min(3).max(200),
  organization_id: z.string().uuid().optional().nullable(),
});

function sanitizeLogValue(value: string): string {
  return value.replace(/\|/g, "/").replace(/\s+/g, " ").trim();
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  const body = await request.json().catch(() => null);
  const parsed = AckAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid alert acknowledgment payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const alertId = sanitizeLogValue(parsed.data.alert_id);
  const organizationId = admin.isSuperAdmin
    ? parsed.data.organization_id || null
    : admin.organizationId;

  if (!admin.isSuperAdmin && !organizationId) {
    return NextResponse.json(
      { error: "Admin organization not configured" },
      { status: 400 },
    );
  }

  const acknowledgedAt = new Date().toISOString();
  const bodyValue = [
    `alert_id=${alertId}`,
    `organization_id=${organizationId || "unknown"}`,
    `actor_id=${admin.userId}`,
    `actor_role=${admin.role}`,
    `acknowledged_at=${acknowledgedAt}`,
  ].join("|");

  const { error: insertError } = await admin.adminClient
    .from("notification_logs")
    .insert({
      recipient_id: admin.userId,
      recipient_type: "admin",
      notification_type: "cost_alert_ack",
      title: "Cost alert acknowledged",
      body: bodyValue,
      status: "sent",
      sent_at: acknowledgedAt,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    alert_id: alertId,
    organization_id: organizationId,
    acknowledged_at: acknowledgedAt,
    acknowledged_by: admin.userId,
  });
}
