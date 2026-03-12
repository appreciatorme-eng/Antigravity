import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo, blockDemoMutation } from "@/lib/auth/demo-org-resolver";
import { safeErrorMessage } from "@/lib/security/safe-error";

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const CreateSchema = z.object({
  month_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().min(0),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const orgId = resolveScopedOrgWithDemo(req, admin.organizationId)!;

    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      month: url.searchParams.get("month") || undefined,
    });
    if (!parsed.success) {
      return apiError("Invalid params", 400);
    }

    const now = new Date();
    const monthStr = parsed.data.month ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, mon] = monthStr.split("-").map(Number);
    const monthStart = `${year}-${String(mon).padStart(2, "0")}-01`;

    const db = admin.adminClient;
    const { data, error } = await db
      .from("monthly_overhead_expenses")
      .select("*")
      .eq("organization_id", orgId)
      .eq("month_start", monthStart)
      .order("category", { ascending: true });

    if (error) {
      console.error("[/api/admin/pricing/overheads:GET] DB error:", error);
      return apiError(safeErrorMessage(error, "Request failed"), 500);
    }

    return NextResponse.json({ expenses: data || [] });
  } catch (error) {
    console.error("[/api/admin/pricing/overheads:GET] Unhandled error:", error);
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

    const demoBlocked = blockDemoMutation(req);
    if (demoBlocked) return demoBlocked;

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError("Invalid JSON", 400);
    }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = admin.adminClient;
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
      console.error("[/api/admin/pricing/overheads:POST] DB error:", error);
      return apiError(safeErrorMessage(error, "Request failed"), 500);
    }

    return apiSuccess(data, 201);
  } catch (error) {
    console.error("[/api/admin/pricing/overheads:POST] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
