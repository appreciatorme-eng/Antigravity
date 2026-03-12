import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

type TripRow = Database['public']['Tables']['trips']['Row'];
type TripServiceCostRow = Database['public']['Tables']['trip_service_costs']['Row'];

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

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
    const nextMonth = mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, "0")}-01`;
    const orgId = admin.organizationId;
    const db = admin.adminClient;

    const { data: monthTrips, error: tripErr } = await db
      .from("trips")
      .select("id, name, destination, start_date, end_date, status, pax_count, client_id, gst_pct, tcs_pct")
      .eq("organization_id", orgId)
      .gte("start_date", monthStart)
      .lt("start_date", nextMonth)
      .order("start_date", { ascending: true });

    if (tripErr) {
      return apiError(tripErr.message, 500);
    }

    const tripRows = (monthTrips || []) as Pick<TripRow, 'id' | 'name' | 'destination' | 'start_date' | 'end_date' | 'status' | 'pax_count' | 'client_id' | 'gst_pct' | 'tcs_pct'>[];
    const tripIds = tripRows.map((t) => t.id);

    let allCosts: TripServiceCostRow[] = [];
    if (tripIds.length > 0) {
      const { data } = await db
        .from("trip_service_costs")
        .select("*")
        .eq("organization_id", orgId)
        .in("trip_id", tripIds);
      allCosts = (data || []) as TripServiceCostRow[];
    }

    // Fetch client names in one query
    // The live DB clients table has a 'name' column not present in generated types
    type ClientNameRow = { id: string; name: string | null };
    const clientIds = [...new Set(tripRows.map((t) => t.client_id).filter(Boolean))] as string[];
    const clientMap = new Map<string, string>();
    if (clientIds.length > 0) {
      const { data: clients } = await (admin.adminClient as unknown as SupabaseClient)
        .from("clients")
        .select("id, name")
        .in("id", clientIds);
      for (const c of (clients || []) as unknown as ClientNameRow[]) {
        clientMap.set(c.id, c.name || "Unknown");
      }
    }

    const costsByTrip = new Map<string, TripServiceCostRow[]>();
    for (const c of allCosts) {
      const arr = costsByTrip.get(c.trip_id) || [];
      arr.push(c);
      costsByTrip.set(c.trip_id, arr);
    }

    const trips = tripRows.map((t) => {
      const tripCosts = costsByTrip.get(t.id) || [];
      const totalCost = tripCosts.reduce((s: number, c: TripServiceCostRow) => s + Number(c.cost_amount), 0);
      const totalPrice = tripCosts.reduce((s: number, c: TripServiceCostRow) => s + Number(c.price_amount), 0);
      const totalCommission = tripCosts.reduce((s: number, c: TripServiceCostRow) => s + Number(c.commission_amount || 0), 0);
      const gstPct = Number(t.gst_pct ?? 5);
      const tcsPct = Number(t.tcs_pct ?? 1);
      const gstAmount = Math.round(totalPrice * gstPct / 100 * 100) / 100;
      const tcsAmount = Math.round(totalPrice * tcsPct / 100 * 100) / 100;
      return {
        id: t.id,
        title: t.name || "Untitled",
        destination: t.destination,
        start_date: t.start_date,
        end_date: t.end_date,
        status: t.status,
        pax_count: t.pax_count || 1,
        client_name: clientMap.get(t.client_id ?? "") || null,
        costs: tripCosts,
        totalCost,
        totalPrice,
        profit: totalPrice - totalCost,
        totalCommission,
        gstPct,
        tcsPct,
        gstAmount,
        tcsAmount,
      };
    });

    return NextResponse.json({ trips });
  } catch (error) {
    console.error("[/api/admin/pricing/trips:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
