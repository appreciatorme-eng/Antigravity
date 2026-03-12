import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";

const UpdateSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  amount: z.number().min(0).optional(),
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
    const { data, error } = await db
      .from("monthly_overhead_expenses")
      .select("id, description, amount, category, month_start, organization_id, created_at, updated_at")
      .eq("id", id)
      .eq("organization_id", admin.organizationId)
      .maybeSingle();

    if (error) {
      console.error("[/api/admin/pricing/overheads/[id]:GET] DB error:", error);
      return apiError(safeErrorMessage(error, "Request failed"), 500);
    }
    if (!data) {
      return apiError("Overhead not found", 404);
    }

    return apiSuccess(data);
  } catch (error) {
    console.error("[/api/admin/pricing/overheads/[id]:GET] Unhandled error:", error);
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
    const { data, error } = await db
      .from("monthly_overhead_expenses")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", admin.organizationId)
      .select()
      .single();

    if (error || !data) {
      console.error("[/api/admin/pricing/overheads/[id]:PATCH] DB error:", error);
      return NextResponse.json(
        { error: safeErrorMessage(error, "Not found") },
        { status: error ? 500 : 404 }
      );
    }
    return apiSuccess(data);
  } catch (error) {
    console.error("[/api/admin/pricing/overheads/[id]:PATCH] Unhandled error:", error);
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
      .from("monthly_overhead_expenses")
      .delete()
      .eq("id", id)
      .eq("organization_id", admin.organizationId);

    if (error) {
      console.error("[/api/admin/pricing/overheads/[id]:DELETE] DB error:", error);
      return apiError(safeErrorMessage(error, "Request failed"), 500);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/pricing/overheads/[id]:DELETE] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
