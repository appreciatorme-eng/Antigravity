import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { TRIP_SERVICE_COST_SELECT } from "@/lib/business/selects";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { Database } from "@/lib/database.types";
import { logError } from "@/lib/observability/logger";

type TripServiceCostRow = Database["public"]["Tables"]["trip_service_costs"]["Row"];

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
      return apiError("Organization not configured", 400);
    }

    const id = extractId(req);
    const db = admin.adminClient;
    const { data: costData, error } = await db
      .from("trip_service_costs")
      .select(TRIP_SERVICE_COST_SELECT)
      .eq("id", id)
      .eq("organization_id", admin.organizationId)
      .single();
    const data = costData as unknown as TripServiceCostRow | null;

    if (error || !data) {
      return apiError("Not found", 404);
    }
    return apiSuccess(data);
  } catch (error) {
    logError("[/api/admin/pricing/trip-costs/[id]:GET] Unhandled error", error);
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
      return apiError("Organization not configured", 400);
    }

    const id = extractId(req);
    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError("Invalid JSON", 400);
    }

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = admin.adminClient;
    const { data: costData, error } = await db
      .from("trip_service_costs")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", admin.organizationId)
      .select(TRIP_SERVICE_COST_SELECT)
      .single();
    const data = costData as unknown as TripServiceCostRow | null;

    if (error || !data) {
      logError("[/api/admin/pricing/trip-costs/[id]:PATCH] DB error", error);
      return NextResponse.json(
        { error: safeErrorMessage(error, "Not found") },
        { status: error ? 500 : 404 }
      );
    }
    return apiSuccess(data);
  } catch (error) {
    logError("[/api/admin/pricing/trip-costs/[id]:PATCH] Unhandled error", error);
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
      return apiError("Organization not configured", 400);
    }

    const id = extractId(req);
    const db = admin.adminClient;
    const { error } = await db
      .from("trip_service_costs")
      .delete()
      .eq("id", id)
      .eq("organization_id", admin.organizationId);

    if (error) {
      logError("[/api/admin/pricing/trip-costs/[id]:DELETE] DB error", error);
      return apiError(safeErrorMessage(error, "Request failed"), 500);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logError("[/api/admin/pricing/trip-costs/[id]:DELETE] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
