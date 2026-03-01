import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizePhone, sanitizeText } from "@/lib/security/sanitize";

const NORMALIZE_DRIVER_PHONES_RATE_LIMIT_MAX = 20;
const NORMALIZE_DRIVER_PHONES_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.response.status || 401 },
      );
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: NORMALIZE_DRIVER_PHONES_RATE_LIMIT_MAX,
      windowMs: NORMALIZE_DRIVER_PHONES_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:whatsapp:normalize-driver-phones",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error:
            "Too many driver phone normalization requests. Please retry later.",
        },
        { status: 429 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      driver_id?: string;
      organization_id?: string;
    };

    const driverId = sanitizeText(body.driver_id, { maxLength: 80 });
    const requestedOrganizationId = sanitizeText(body.organization_id, {
      maxLength: 80,
    });

    const organizationId = admin.isSuperAdmin
      ? requestedOrganizationId || null
      : admin.organizationId;

    if (!admin.isSuperAdmin && !organizationId) {
      return NextResponse.json(
        { error: "Admin organization not configured" },
        { status: 400 },
      );
    }

    if (
      !admin.isSuperAdmin &&
      requestedOrganizationId &&
      requestedOrganizationId !== organizationId
    ) {
      return NextResponse.json(
        { error: "Cannot mutate another organization scope" },
        { status: 403 },
      );
    }

    let query = admin.adminClient
      .from("profiles")
      .select("id,full_name,email,phone,phone_normalized,organization_id")
      .eq("role", "driver")
      .is("phone_normalized", null);

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }
    if (driverId) {
      query = query.eq("id", driverId);
    }

    const { data: rows, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const candidates = (rows || []).filter((row) => !!sanitizePhone(row.phone));
    let updated = 0;
    const skipped = (rows || []).length - candidates.length;

    for (const row of candidates) {
      const normalized = sanitizePhone(row.phone);
      if (!normalized) continue;

      const { error: updateError } = await admin.adminClient
        .from("profiles")
        .update({ phone_normalized: normalized })
        .eq("id", row.id);

      if (!updateError) {
        updated += 1;
      }
    }

    await admin.adminClient.from("notification_logs").insert({
      notification_type: "manual",
      recipient_type: "admin",
      recipient_id: admin.userId,
      title: "Normalize Driver Phone Mapping",
      body: `Updated ${updated} driver phone mapping(s), skipped ${skipped}.`,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      scanned: rows?.length || 0,
      updated,
      skipped,
      organization_id: organizationId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
