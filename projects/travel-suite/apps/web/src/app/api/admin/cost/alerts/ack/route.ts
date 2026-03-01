import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { acknowledgeCostAlert } from "@/lib/cost/alert-ack";
import { invalidateCostOverviewCache } from "@/lib/cost/overview-cache";

const AckAlertSchema = z.object({
  alert_id: z.string().trim().min(3).max(200),
  organization_id: z.string().uuid().optional().nullable(),
});

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

  const alertId = parsed.data.alert_id.trim();

  if (admin.isSuperAdmin && !parsed.data.organization_id) {
    return NextResponse.json(
      { error: "organization_id is required for super admin acknowledgments" },
      { status: 400 },
    );
  }

  if (
    !admin.isSuperAdmin &&
    parsed.data.organization_id &&
    parsed.data.organization_id !== admin.organizationId
  ) {
    return NextResponse.json(
      { error: "Cannot acknowledge alerts for a foreign organization" },
      { status: 403 },
    );
  }

  const organizationId = admin.isSuperAdmin
    ? parsed.data.organization_id || null
    : admin.organizationId;
  if (!organizationId) {
    return NextResponse.json(
      { error: "Admin organization not configured" },
      { status: 400 },
    );
  }

  if (admin.isSuperAdmin) {
    const { data: organization, error: organizationError } =
      await admin.adminClient
        .from("organizations")
        .select("id")
        .eq("id", organizationId)
        .maybeSingle();

    if (organizationError) {
      return NextResponse.json(
        { error: organizationError.message },
        { status: 500 },
      );
    }

    if (!organization) {
      return NextResponse.json(
        { error: "Unknown organization_id for acknowledgment" },
        { status: 400 },
      );
    }
  }

  try {
    const acknowledged = await acknowledgeCostAlert({
      adminClient: admin.adminClient,
      alertId,
      organizationId,
      actorId: admin.userId,
      actorRole: admin.role,
    });

    void invalidateCostOverviewCache();

    return NextResponse.json({
      ok: true,
      alert_id: alertId,
      organization_id: organizationId,
      acknowledged_at: acknowledged.acknowledgedAt,
      acknowledged_by: acknowledged.acknowledgedBy,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to acknowledge alert";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
