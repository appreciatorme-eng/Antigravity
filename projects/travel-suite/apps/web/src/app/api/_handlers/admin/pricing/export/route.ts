// Pricing export — generate CSV report of trip costs for a given month.
// Exports all trip service costs with trip context, profit calculations, and margin analysis.

import { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

type CostRow = {
  id: string;
  trip_id: string;
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
};

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const orgId = resolveScopedOrgWithDemo(req, admin.organizationId)!;

    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month")?.trim() || "";
    const format = url.searchParams.get("format")?.trim() || "csv";

    // Validate month parameter (YYYY-MM format)
    if (!monthParam) {
      return apiError("Missing required parameter: month (format: YYYY-MM)", 400);
    }

    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(monthParam)) {
      return apiError("Invalid month format. Expected YYYY-MM (e.g., 2026-03)", 400);
    }

    // Validate format parameter
    if (format !== "csv") {
      return apiError("Only CSV format is currently supported", 400);
    }

    const db = admin.adminClient;

    // Calculate month date range
    const [year, month] = monthParam.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    // Fetch all trip_service_costs for the specified month
    const { data: costs, error: costsError } = await db
      .from("trip_service_costs")
      .select("id, trip_id, category, vendor_name, description, pax_count, cost_amount, price_amount, commission_pct, commission_amount, currency, notes, created_at")
      .eq("organization_id", orgId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (costsError) {
      return apiError(safeErrorMessage(costsError, "Failed to load trip service costs"), 500);
    }

    const costRows = (costs || []) as CostRow[];

    if (costRows.length === 0) {
      // Return empty CSV with headers
      const csv = "Date,Trip,Category,Vendor,Description,Cost,Price,Profit,Margin%\n";
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="trip-costs-${monthParam}.csv"`,
        },
      });
    }

    // Fetch trip data for all costs
    const tripIds = [...new Set(costRows.map((c) => c.trip_id))];
    const { data: trips } = await db
      .from("trips")
      .select("id, name, destination, start_date, pax_count")
      .in("id", tripIds);

    const tripMap = new Map<string, TripRow>();
    for (const t of (trips || []) as TripRow[]) {
      tripMap.set(t.id, t);
    }

    // Build CSV rows
    const csvRows: string[] = [];

    // CSV header
    csvRows.push("Date,Trip,Category,Vendor,Description,Cost,Price,Profit,Margin%");

    // CSV data rows
    for (const cost of costRows) {
      const trip = tripMap.get(cost.trip_id);
      const tripName = trip?.name || "Unknown Trip";
      const costAmt = Number(cost.cost_amount);
      const priceAmt = Number(cost.price_amount);
      const profit = priceAmt - costAmt;
      const marginPct = priceAmt > 0 ? ((profit / priceAmt) * 100).toFixed(1) : "0.0";

      // Format date as YYYY-MM-DD
      const date = new Date(cost.created_at).toISOString().split("T")[0];

      // Escape CSV fields (wrap in quotes if they contain commas, quotes, or newlines)
      const escapeCsv = (value: string | null | undefined): string => {
        if (!value) return "";
        const str = String(value);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const row = [
        date,
        escapeCsv(tripName),
        escapeCsv(cost.category),
        escapeCsv(cost.vendor_name),
        escapeCsv(cost.description),
        costAmt.toFixed(2),
        priceAmt.toFixed(2),
        profit.toFixed(2),
        marginPct,
      ].join(",");

      csvRows.push(row);
    }

    const csv = csvRows.join("\n") + "\n";

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="trip-costs-${monthParam}.csv"`,
      },
    });
  } catch (error) {
    logError("[/api/admin/pricing/export:GET] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
