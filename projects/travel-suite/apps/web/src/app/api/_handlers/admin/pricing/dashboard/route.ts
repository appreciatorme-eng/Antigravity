import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    month: url.searchParams.get("month") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid month format (YYYY-MM)" }, { status: 400 });
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
  const db = admin.adminClient as any;

  const { data: monthTrips } = await db
    .from("trips")
    .select("id, name, destination, pax_count, status")
    .eq("organization_id", orgId)
    .gte("start_date", monthStart)
    .lt("start_date", nextMonth);

  const tripIds = (monthTrips || []).map((t: any) => t.id);

  type CostRow = { trip_id: string; category: string; cost_amount: number; price_amount: number };
  let costs: CostRow[] = [];
  if (tripIds.length > 0) {
    const { data } = await db
      .from("trip_service_costs")
      .select("trip_id, category, cost_amount, price_amount")
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
    (s: number, e: any) => s + Number(e.amount), 0
  );

  const totalInvestment = costs.reduce((s, c) => s + Number(c.cost_amount), 0);
  const totalRevenue = costs.reduce((s, c) => s + Number(c.price_amount), 0);
  const grossProfit = totalRevenue - totalInvestment;
  const netProfit = grossProfit - totalOverhead;
  const tripCount = tripIds.length;
  const marginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const avgProfitPerTrip = tripCount > 0 ? grossProfit / tripCount : 0;

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
  const topProfitableTrips = (monthTrips || [])
    .map((t: any) => {
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
    .sort((a: any, b: any) => b.profit - a.profit)
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

    const mTripIds = (mTrips || []).map((t: any) => t.id);
    let mRevenue = 0, mCost = 0;
    if (mTripIds.length > 0) {
      const { data: mCosts } = await db
        .from("trip_service_costs")
        .select("cost_amount, price_amount")
        .eq("organization_id", orgId)
        .in("trip_id", mTripIds);
      for (const c of (mCosts || []) as any[]) {
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
      (s: number, e: any) => s + Number(e.amount), 0
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
    },
    categoryBreakdown,
    topProfitableTrips,
    monthlyTrend,
  });
}
