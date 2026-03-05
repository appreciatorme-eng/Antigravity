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
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
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

  const { data: monthTrips, error: tripErr } = await db
    .from("trips")
    .select("id, name, destination, start_date, end_date, status, pax_count, client_id")
    .eq("organization_id", orgId)
    .gte("start_date", monthStart)
    .lt("start_date", nextMonth)
    .order("start_date", { ascending: true });

  if (tripErr) {
    return NextResponse.json({ error: tripErr.message }, { status: 500 });
  }

  const tripIds = (monthTrips || []).map((t: any) => t.id);

  type CostRow = {
    id: string; trip_id: string; category: string; vendor_name: string | null;
    description: string | null; pax_count: number; cost_amount: number;
    price_amount: number; currency: string; notes: string | null;
    created_by: string | null; created_at: string; updated_at: string;
    organization_id: string;
  };
  let allCosts: CostRow[] = [];
  if (tripIds.length > 0) {
    const { data } = await db
      .from("trip_service_costs")
      .select("*")
      .eq("organization_id", orgId)
      .in("trip_id", tripIds);
    allCosts = (data || []) as CostRow[];
  }

  // Fetch client names in one query
  const clientIds = [...new Set((monthTrips || []).map((t: any) => t.client_id).filter(Boolean))] as string[];
  const clientMap = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: clients } = await admin.adminClient
      .from("clients")
      .select("id, name")
      .in("id", clientIds);
    for (const c of (clients || []) as any[]) {
      clientMap.set(c.id, c.name || "Unknown");
    }
  }

  const costsByTrip = new Map<string, CostRow[]>();
  for (const c of allCosts) {
    const arr = costsByTrip.get(c.trip_id) || [];
    arr.push(c);
    costsByTrip.set(c.trip_id, arr);
  }

  const trips = (monthTrips || []).map((t: any) => {
    const tripCosts = costsByTrip.get(t.id) || [];
    const totalCost = tripCosts.reduce((s: number, c: CostRow) => s + Number(c.cost_amount), 0);
    const totalPrice = tripCosts.reduce((s: number, c: CostRow) => s + Number(c.price_amount), 0);
    return {
      id: t.id,
      title: t.name || "Untitled",
      destination: t.destination,
      start_date: t.start_date,
      end_date: t.end_date,
      status: t.status,
      pax_count: t.pax_count || 1,
      client_name: clientMap.get(t.client_id) || null,
      costs: tripCosts,
      totalCost,
      totalPrice,
      profit: totalPrice - totalCost,
    };
  });

  return NextResponse.json({ trips });
}
