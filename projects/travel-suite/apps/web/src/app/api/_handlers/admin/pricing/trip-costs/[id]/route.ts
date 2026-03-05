import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";

const UpdateSchema = z.object({
  category: z.enum(["hotels", "vehicle", "flights", "visa", "insurance", "train", "bus", "other"]).optional(),
  vendor_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  pax_count: z.number().int().min(1).optional(),
  cost_amount: z.number().min(0).optional(),
  price_amount: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split("/");
  return segments[segments.length - 1];
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
  }

  const id = extractId(req);
  const db = admin.adminClient as any;
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
}

export async function PATCH(req: NextRequest) {
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

  const db = admin.adminClient as any;
  const { data, error } = await db
    .from("trip_service_costs")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", admin.organizationId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Not found" },
      { status: error ? 500 : 404 }
    );
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
  }

  const id = extractId(req);
  const db = admin.adminClient as any;
  const { error } = await db
    .from("trip_service_costs")
    .delete()
    .eq("id", id)
    .eq("organization_id", admin.organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
