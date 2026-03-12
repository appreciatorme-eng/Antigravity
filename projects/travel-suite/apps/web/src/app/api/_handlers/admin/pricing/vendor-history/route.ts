import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";

const QuerySchema = z.object({
  vendor: z.string().min(1),
  category: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      vendor: url.searchParams.get("vendor") || "",
      category: url.searchParams.get("category") || "",
    });
    if (!parsed.success) {
      return apiError("vendor and category params required", 400);
    }

    type HistoryRow = {
      vendor_name: string; category: string; cost_amount: number;
      trip_id: string; created_at: string;
    };

    const db = admin.adminClient;
    const { data, error } = await db
      .from("trip_service_costs")
      .select("vendor_name, category, cost_amount, trip_id, created_at")
      .eq("organization_id", admin.organizationId)
      .ilike("vendor_name", parsed.data.vendor)
      .eq("category", parsed.data.category)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[/api/admin/pricing/vendor-history:GET] DB error:", error);
      return apiError(safeErrorMessage(error, "Request failed"), 500);
    }

    const rows = (data || []) as HistoryRow[];
    const tripIds = [...new Set(rows.map((d) => d.trip_id))];
    const tripMap = new Map<string, string>();
    if (tripIds.length > 0) {
      const { data: trips } = await db
        .from("trips")
        .select("id, name")
        .in("id", tripIds);
      for (const t of (trips || []) as Array<{ id: string; name: string }>) {
        tripMap.set(t.id, t.name || "Untitled");
      }
    }

    const history = rows.map((d) => ({
      vendor_name: d.vendor_name,
      category: d.category,
      cost_amount: Number(d.cost_amount),
      trip_title: tripMap.get(d.trip_id) || "Unknown Trip",
      created_at: d.created_at,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[/api/admin/pricing/vendor-history:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
