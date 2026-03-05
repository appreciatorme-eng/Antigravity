import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo, blockDemoMutation } from "@/lib/auth/demo-org-resolver";

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const CreateSchema = z.object({
  month_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().min(0),
});

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
  }

  const orgId = resolveScopedOrgWithDemo(req, admin.organizationId);

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    month: url.searchParams.get("month") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const now = new Date();
  const monthStr = parsed.data.month ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, mon] = monthStr.split("-").map(Number);
  const monthStart = `${year}-${String(mon).padStart(2, "0")}-01`;

  const db = admin.adminClient as any;
  const { data, error } = await db
    .from("monthly_overhead_expenses")
    .select("*")
    .eq("organization_id", orgId)
    .eq("month_start", monthStart)
    .order("category", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data || [] });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
  }

  const demoBlocked = blockDemoMutation(req);
  if (demoBlocked) return demoBlocked;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
    .from("monthly_overhead_expenses")
    .upsert(
      {
        ...parsed.data,
        organization_id: admin.organizationId,
        created_by: admin.userId,
      },
      { onConflict: "organization_id,month_start,category" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
