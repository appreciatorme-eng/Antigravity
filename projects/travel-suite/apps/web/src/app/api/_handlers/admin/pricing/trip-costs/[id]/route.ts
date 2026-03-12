import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";

const UpdateSchema = z.object({
  category: z.enum(["hotels", "vehicle", "flights", "visa", "insurance", "train", "bus", "other"]).optional(),
  vendor_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  pax_count: z.number().int().min(1).optional(),
  cost_amount: z.number().min(0).optional(),
  price_amount: z.number().min(0).optional(),
  commission_pct: z.number().min(0).max(100).optional(),
  commission_amount: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
});

function extractId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split("/");
  return segments[segments.length - 1];
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
    }

    const id = extractId(req);
    const db = admin.adminClient;
    const { data, error } = await db
      .from("trip_service_costs")
      .select("*")
      .eq("id", id)
      .eq("organization_id", admin.organizationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("[/api/admin/pricing/trip-costs/[id]:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
    }

    const id = extractId(req);
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = admin.adminClient;
    const { data, error } = await db
      .from("trip_service_costs")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", admin.organizationId)
      .select()
      .single();

    if (error || !data) {
      console.error("[/api/admin/pricing/trip-costs/[id]:PATCH] DB error:", error);
      return NextResponse.json(
        { error: safeErrorMessage(error, "Not found") },
        { status: error ? 500 : 404 }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("[/api/admin/pricing/trip-costs/[id]:PATCH] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
    }

    const id = extractId(req);
    const db = admin.adminClient;
    const { error } = await db
      .from("trip_service_costs")
      .delete()
      .eq("id", id)
      .eq("organization_id", admin.organizationId);

    if (error) {
      console.error("[/api/admin/pricing/trip-costs/[id]:DELETE] DB error:", error);
      return NextResponse.json({ error: safeErrorMessage(error, "Request failed") }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/pricing/trip-costs/[id]:DELETE] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
