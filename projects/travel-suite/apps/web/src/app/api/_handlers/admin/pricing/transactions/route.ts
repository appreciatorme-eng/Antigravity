// Pricing transactions — flat ledger of all service cost entries with trip context.
// Supports search, category, vendor filters and sort options.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

type CostRow = {
  id: string;
  trip_id: string | null;
  trip_name: string | null;
  category: string;
  vendor_name: string | null;
  description: string | null;
  pax_count: number;
  cost_amount: number;
  price_amount: number;
  commission_pct: number;
  commission_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
};

type TripRow = {
  id: string;
  name: string | null;
  destination: string | null;
  start_date: string | null;
  pax_count: number | null;
  client_id: string | null;
};

type ClientRow = { id: string; name: string | null };

const VALID_SORTS = new Set(["date", "profit", "cost", "price"]);

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const orgId = admin.organizationId!;

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const category = url.searchParams.get("category")?.trim() || "";
    const vendor = url.searchParams.get("vendor")?.trim() || "";
    const sort = VALID_SORTS.has(url.searchParams.get("sort") || "") ? url.searchParams.get("sort")! : "date";

    const db = admin.adminClient;

    let query = db
      .from("trip_service_costs")
      .select("id, trip_id, trip_name, category, vendor_name, description, pax_count, cost_amount, price_amount, commission_pct, commission_amount, currency, notes, created_at")
      .eq("organization_id", orgId);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (vendor) {
      query = query.ilike("vendor_name", `%${vendor}%`);
    }

    const orderColumn = sort === "cost" ? "cost_amount" : sort === "price" ? "price_amount" : "created_at";
    query = query.order(orderColumn, { ascending: false });

    const { data: costs, error: costsError } = await query;
    if (costsError) {
      return apiError(safeErrorMessage(costsError, "Failed to load trip service costs"), 500);
    }

    const costRows = (costs || []) as CostRow[];

    if (costRows.length === 0) {
      return NextResponse.json({ transactions: [], summary: { totalCost: 0, totalRevenue: 0, totalProfit: 0, totalCommission: 0, count: 0 } });
    }

    const tripIds = [...new Set(costRows.map((c) => c.trip_id).filter(Boolean))] as string[];

    let trips: TripRow[] = [];
    if (tripIds.length > 0) {
      const { data } = await db
        .from("trips")
        .select("id, name, destination, start_date, pax_count, client_id")
        .in("id", tripIds);
      trips = (data || []) as TripRow[];
    }

    const tripMap = new Map<string, TripRow>();
    for (const t of trips) {
      tripMap.set(t.id, t);
    }

    const clientIds = [...new Set(
      trips.map((t) => t.client_id).filter(Boolean) as string[]
    )];

    const clientMap = new Map<string, string>();
    if (clientIds.length > 0) {
      const { data: clientsData } = await admin.adminClient
        .from("clients")
        .select("id, name")
        .in("id", clientIds);
      for (const c of (clientsData || []) as unknown as ClientRow[]) {
        if (c.name) clientMap.set(c.id, c.name);
      }
    }

    let transactions = costRows.map((cost) => {
      const trip = cost.trip_id ? tripMap.get(cost.trip_id) : undefined;
      const clientName = trip?.client_id ? (clientMap.get(trip.client_id) ?? null) : null;
      const costAmt = Number(cost.cost_amount);
      const priceAmt = Number(cost.price_amount);
      const profit = priceAmt - costAmt;
      const marginPct = priceAmt > 0 ? Math.round((profit / priceAmt) * 100) : 0;

      return {
        id: cost.id,
        trip_id: cost.trip_id,
        trip_name: trip?.name || cost.trip_name || (cost.trip_id ? "Unknown Trip" : "Standalone"),
        destination: trip?.destination ?? null,
        client_name: clientName,
        start_date: trip?.start_date ?? cost.created_at,
        pax_count: trip?.pax_count ?? cost.pax_count ?? 1,
        category: cost.category,
        vendor_name: cost.vendor_name,
        description: cost.description,
        cost_amount: costAmt,
        price_amount: priceAmt,
        commission_pct: Number(cost.commission_pct || 0),
        commission_amount: Number(cost.commission_amount || 0),
        profit,
        margin_pct: marginPct,
        currency: cost.currency,
        notes: cost.notes,
        created_at: cost.created_at,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.trip_name.toLowerCase().includes(q) ||
          (t.destination ?? "").toLowerCase().includes(q) ||
          (t.vendor_name ?? "").toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          (t.client_name ?? "").toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if (sort === "profit") {
      transactions.sort((a, b) => b.profit - a.profit);
    }

    const totalCost = transactions.reduce((s, t) => s + t.cost_amount, 0);
    const totalRevenue = transactions.reduce((s, t) => s + t.price_amount, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalCommission = transactions.reduce((s, t) => s + t.commission_amount, 0);

    return NextResponse.json({
      transactions,
      summary: { totalCost, totalRevenue, totalProfit, totalCommission, count: transactions.length },
    });
  } catch (error) {
    logError("[/api/admin/pricing/transactions:GET] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
