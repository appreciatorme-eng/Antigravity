import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import type { Database } from "@/lib/database.types";

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

type TripRow = Database['public']['Tables']['trips']['Row'];
type CostRow = { trip_id: string; category: string; cost_amount: number; price_amount: number; commission_amount: number };
type OverheadAmountRow = { amount: number | null };

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
      return apiError("Invalid month format (YYYY-MM)", 400);
    }

    const now = new Date();
    const monthStr = parsed.data.month ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, mon] = monthStr.split("-").map(Number);
    const monthStart = `${year}-${String(mon).padStart(2, "0")}-01`;
    const nextMonth = mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, "0")}-01`;
    const orgId = resolveScopedOrgWithDemo(req, admin.organizationId)!;
    const db = admin.adminClient;

    const { data: monthTrips } = await db
      .from("trips")
      .select("id, name, destination, pax_count, status")
      .eq("organization_id", orgId)
      .gte("start_date", monthStart)
      .lt("start_date", nextMonth);

    const tripRows = (monthTrips || []) as Pick<TripRow, 'id' | 'name' | 'destination' | 'pax_count' | 'status'>[];
    const tripIds = tripRows.map((t) => t.id);

    let costs: CostRow[] = [];
    if (tripIds.length > 0) {
      const { data } = await db
        .from("trip_service_costs")
        .select("trip_id, category, cost_amount, price_amount, commission_amount")
        .eq("organization_id", orgId)
        .in("trip_id", tripIds);
      costs = (data || []) as CostRow[];
    }

    const { data: overheadData } = await db
      .from("monthly_overhead_expenses")
      .select("amount")
      .eq("organization_id", orgId)
      .eq("month_start", monthStart);

    const totalOverhead = (overheadData || []).reduce(
      (s: number, e: OverheadAmountRow) => s + Number(e.amount), 0
    );

    const totalInvestment = costs.reduce((s, c) => s + Number(c.cost_amount), 0);
    const totalRevenue = costs.reduce((s, c) => s + Number(c.price_amount), 0);
    const totalCommission = costs.reduce((s, c) => s + Number(c.commission_amount || 0), 0);
    const grossProfit = totalRevenue - totalInvestment;
    const netProfit = grossProfit - totalOverhead;
    const tripCount = tripIds.length;
    const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const avgProfitPerTrip = tripCount > 0 ? grossProfit / tripCount : 0;
    // Standard Indian tour package rates: 5% GST, 1% TCS (on total price)
    const totalGst = Math.round(totalRevenue * 5 / 100 * 100) / 100;
    const totalTcs = Math.round(totalRevenue * 1 / 100 * 100) / 100;

    const catMap = new Map<string, { totalCost: number; totalPrice: number }>();
    for (const c of costs) {
      const existing = catMap.get(c.category) || { totalCost: 0, totalPrice: 0 };
      existing.totalCost += Number(c.cost_amount);
      existing.totalPrice += Number(c.price_amount);
      catMap.set(c.category, existing);
    }
    const categoryBreakdown = Array.from(catMap.entries()).map(([category, vals]) => ({
      category,
      totalCost: vals.totalCost,
      totalPrice: vals.totalPrice,
      profit: vals.totalPrice - vals.totalCost,
    }));

    const tripProfitMap = new Map<string, { cost: number; revenue: number }>();
    for (const c of costs) {
      const existing = tripProfitMap.get(c.trip_id) || { cost: 0, revenue: 0 };
      existing.cost += Number(c.cost_amount);
      existing.revenue += Number(c.price_amount);
      tripProfitMap.set(c.trip_id, existing);
    }
    type ProfitableTrip = { tripId: string; tripTitle: string; destination: string | null; profit: number; paxCount: number | null; revenue: number; cost: number };
    const topProfitableTrips = tripRows
      .map((t) => {
        const p = tripProfitMap.get(t.id) || { cost: 0, revenue: 0 };
        return {
          tripId: t.id,
          tripTitle: t.name || "Untitled Trip",
          destination: t.destination,
          profit: p.revenue - p.cost,
          paxCount: t.pax_count || 1,
          revenue: p.revenue,
          cost: p.cost,
        };
      })
      .sort((a: ProfitableTrip, b: ProfitableTrip) => b.profit - a.profit)
      .slice(0, 5);

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, mon - 1 - i, 1);
      const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const mEndStr = `${mEnd.getFullYear()}-${String(mEnd.getMonth() + 1).padStart(2, "0")}-01`;
      const mLabel = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const { data: mTrips } = await db
        .from("trips")
        .select("id")
        .eq("organization_id", orgId)
        .gte("start_date", mStart)
        .lt("start_date", mEndStr);

      const mTripIds = (mTrips || []).map((t: Pick<TripRow, 'id'>) => t.id);
      let mRevenue = 0, mCost = 0;
      if (mTripIds.length > 0) {
        const { data: mCosts } = await db
          .from("trip_service_costs")
          .select("cost_amount, price_amount")
          .eq("organization_id", orgId)
          .in("trip_id", mTripIds);
        for (const c of (mCosts || []) as { cost_amount: number | null; price_amount: number | null }[]) {
          mCost += Number(c.cost_amount);
          mRevenue += Number(c.price_amount);
        }
      }

      const { data: mOh } = await db
        .from("monthly_overhead_expenses")
        .select("amount")
        .eq("organization_id", orgId)
        .eq("month_start", mStart);
      const mOverhead = (mOh || []).reduce(
        (s: number, e: OverheadAmountRow) => s + Number(e.amount), 0
      );

      monthlyTrend.push({
        month: mLabel,
        grossProfit: mRevenue - mCost,
        netProfit: mRevenue - mCost - mOverhead,
        revenue: mRevenue,
      });
    }

    return NextResponse.json({
      kpis: {
        totalInvestment, totalRevenue, grossProfit, totalOverhead,
        netProfit, marginPct, tripCount, avgProfitPerTrip,
        totalCommission, totalGst, totalTcs,
      },
      categoryBreakdown,
      topProfitableTrips,
      monthlyTrend,
    });
  } catch (error) {
    console.error("[/api/admin/pricing/dashboard:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
