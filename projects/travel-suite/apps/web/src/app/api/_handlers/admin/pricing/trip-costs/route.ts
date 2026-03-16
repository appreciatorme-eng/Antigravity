import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { TRIP_SERVICE_COST_SELECT } from "@/lib/business/selects";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { Database } from "@/lib/database.types";
import { logError } from "@/lib/observability/logger";

type TripServiceCostRow = Database["public"]["Tables"]["trip_service_costs"]["Row"];

const CreateSchema = z.object({
  trip_id: z.string().uuid(),
  category: z.enum(["hotels", "vehicle", "flights", "visa", "insurance", "train", "bus", "other"]),
  vendor_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  pax_count: z.number().int().min(1).default(1),
  cost_amount: z.number().min(0).default(0),
  price_amount: z.number().min(0).default(0),
  commission_pct: z.number().min(0).max(100).default(0),
  commission_amount: z.number().min(0).default(0),
  currency: z.string().default("INR"),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const url = new URL(req.url);
    const tripId = url.searchParams.get("trip_id");

    const db = admin.adminClient;
    let query = db
      .from("trip_service_costs")
      .select("id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, commission_pct, commission_amount, currency, notes, created_by, created_at")
      .eq("organization_id", admin.organizationId)
      .order("created_at", { ascending: false });

    if (tripId) {
      query = query.eq("trip_id", tripId);
    }

    const { data, error } = await query;
    if (error) {
      logError("[/api/admin/pricing/trip-costs:GET] DB error", error);
      return apiError(safeErrorMessage(error, "Request failed"), 500);
    }

    return NextResponse.json({ costs: data || [] });
  } catch (error) {
    logError("[/api/admin/pricing/trip-costs:GET] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError("Invalid JSON body", 400);
    }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = admin.adminClient;
    const { data: costData, error } = await db
      .from("trip_service_costs")
      .insert({
        ...parsed.data,
        organization_id: admin.organizationId,
        created_by: admin.userId,
      })
      .select(TRIP_SERVICE_COST_SELECT)
      .single();
    const data = costData as unknown as TripServiceCostRow | null;

    if (error) {
      logError("[/api/admin/pricing/trip-costs:POST] DB error", error);
      return apiError(safeErrorMessage(error, "Request failed"), 500);
    }

    return apiSuccess(data, { status: 201 });
  } catch (error) {
    logError("[/api/admin/pricing/trip-costs:POST] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
