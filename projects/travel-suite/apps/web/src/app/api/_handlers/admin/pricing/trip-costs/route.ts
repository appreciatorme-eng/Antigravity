import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";

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

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
    }

    const url = new URL(req.url);
    const tripId = url.searchParams.get("trip_id");

    const db = admin.adminClient as any;
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
      console.error("[/api/admin/pricing/trip-costs:GET] DB error:", error);
      return NextResponse.json({ error: safeErrorMessage(error, "Request failed") }, { status: 500 });
    }

    return NextResponse.json({ costs: data || [] });
  } catch (error) {
    console.error("[/api/admin/pricing/trip-costs:GET] Unhandled error:", error);
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
      return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = admin.adminClient as any;
    const { data, error } = await db
      .from("trip_service_costs")
      .insert({
        ...parsed.data,
        organization_id: admin.organizationId,
        created_by: admin.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("[/api/admin/pricing/trip-costs:POST] DB error:", error);
      return NextResponse.json({ error: safeErrorMessage(error, "Request failed") }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[/api/admin/pricing/trip-costs:POST] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
