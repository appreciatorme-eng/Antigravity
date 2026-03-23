// Export trips as CSV for the authenticated admin's organization.

import { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";
import { generateCsv, csvResponse } from "@/lib/export/csv";

type TripExportRow = {
  id: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  created_at: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
  itineraries: { destination: string | null } | null;
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

    const { data, error } = await db
      .from("trips")
      .select(`
        id,
        destination,
        start_date,
        end_date,
        status,
        created_at,
        profiles:client_id ( full_name, email ),
        itineraries:itinerary_id ( destination ),
        trip_service_costs ( price_amount )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      return apiError(safeErrorMessage(error, "Failed to load trips"), 500);
    }

    const rows = ((data || []) as unknown as TripExportRow[]).map((t) => {
      const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
      const itinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : t.itineraries;
      const destination = t.destination || itinerary?.destination || "";
      const totalCostPaise = (t.trip_service_costs || []).reduce(
        (sum, c) => sum + (c.price_amount || 0),
        0,
      );
      const totalCostInr = (totalCostPaise / 100).toFixed(2);

      return [
        t.id,
        destination,
        t.start_date || "",
        t.end_date || "",
        t.status || "",
        profile?.full_name || "",
        profile?.email || "",
        totalCostInr,
        t.created_at || "",
      ] as (string | number | null)[];
    });

    const headers = [
      "ID",
      "Destination",
      "Start Date",
      "End Date",
      "Status",
      "Client Name",
      "Client Email",
      "Total Cost (INR)",
      "Created At",
    ];

    const csv = generateCsv(headers, rows);
    return csvResponse(csv, "trips-export.csv");
  } catch (error) {
    logError("[/api/admin/export/trips:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
