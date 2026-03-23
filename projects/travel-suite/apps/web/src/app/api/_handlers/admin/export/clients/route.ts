// Export clients as CSV for the authenticated admin's organization.

import { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";
import { generateCsv, csvResponse } from "@/lib/export/csv";

type ClientExportRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
};

type TripSummary = {
  client_id: string | null;
  trip_service_costs: { price_amount: number | null }[];
};

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Organization not configured", 400);
    }

    const orgId = resolveScopedOrgWithDemo(req, admin.organizationId)!;
    const db = admin.adminClient;

    // Fetch client profiles scoped to org with role=client
    const { data: clients, error: clientsError } = await db
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .eq("organization_id", orgId)
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (clientsError) {
      return apiError(safeErrorMessage(clientsError, "Failed to load clients"), 500);
    }

    const clientRows = (clients || []) as ClientExportRow[];

    // Fetch trips with costs for all clients in this org
    const { data: trips } = await db
      .from("trips")
      .select("client_id, trip_service_costs ( price_amount )")
      .eq("organization_id", orgId);

    const tripData = (trips || []) as unknown as TripSummary[];

    // Aggregate trips and spend per client
    const clientStats = new Map<string, { tripCount: number; totalSpentPaise: number }>();
    for (const trip of tripData) {
      if (!trip.client_id) continue;
      const stats = clientStats.get(trip.client_id) || { tripCount: 0, totalSpentPaise: 0 };
      stats.tripCount += 1;
      const costs = trip.trip_service_costs || [];
      for (const c of costs) {
        stats.totalSpentPaise += c.price_amount || 0;
      }
      clientStats.set(trip.client_id, stats);
    }

    const rows = clientRows.map((c) => {
      const stats = clientStats.get(c.id) || { tripCount: 0, totalSpentPaise: 0 };
      return [
        c.id,
        c.full_name || "",
        c.email || "",
        c.phone || "",
        stats.tripCount,
        (stats.totalSpentPaise / 100).toFixed(2),
        c.created_at || "",
      ] as (string | number | null)[];
    });

    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Total Trips",
      "Total Spent (INR)",
      "Created At",
    ];

    const csv = generateCsv(headers, rows);
    return csvResponse(csv, "clients-export.csv");
  } catch (error) {
    logError("[/api/admin/export/clients:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
