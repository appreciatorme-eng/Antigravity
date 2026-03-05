import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";

const CreateSchema = z.object({
  trip_id: z.string().uuid(),
  category: z.enum(["hotels", "vehicle", "flights", "visa", "insurance", "train", "bus", "other"]),
  vendor_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  pax_count: z.number().int().min(1).default(1),
  cost_amount: z.number().min(0).default(0),
  price_amount: z.number().min(0).default(0),
  currency: z.string().default("INR"),
  notes: z.string().nullable().optional(),
});

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
