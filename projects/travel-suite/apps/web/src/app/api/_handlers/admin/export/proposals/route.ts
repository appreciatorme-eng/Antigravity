// Export proposals as CSV for the authenticated admin's organization.

import { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";
import { generateCsv, csvResponse } from "@/lib/export/csv";

type ProposalExportRow = {
  id: string;
  title: string;
  total_price: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  clients: { profiles: { full_name: string | null } | null } | null;
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
      .from("proposals")
      .select(`
        id,
        title,
        total_price,
        status,
        created_at,
        updated_at,
        clients:client_id ( profiles:id ( full_name ) )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      return apiError(safeErrorMessage(error, "Failed to load proposals"), 500);
    }

    const rows = ((data || []) as unknown as ProposalExportRow[]).map((p) => {
      const client = Array.isArray(p.clients) ? p.clients[0] : p.clients;
      const profile = client
        ? (Array.isArray(client.profiles) ? client.profiles[0] : client.profiles)
        : null;
      const amountInr = p.total_price != null ? (p.total_price / 100).toFixed(2) : "0.00";

      return [
        p.id,
        p.title,
        profile?.full_name || "",
        amountInr,
        p.status || "",
        p.created_at || "",
        p.updated_at || "",
      ] as (string | number | null)[];
    });

    const headers = [
      "ID",
      "Title",
      "Client Name",
      "Amount (INR)",
      "Status",
      "Created At",
      "Updated At",
    ];

    const csv = generateCsv(headers, rows);
    return csvResponse(csv, "proposals-export.csv");
  } catch (error) {
    logError("[/api/admin/export/proposals:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
