// Export invoices as CSV for the authenticated admin's organization.

import { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";
import { generateCsv, csvResponse } from "@/lib/export/csv";

type InvoiceExportRow = {
  invoice_number: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string | null;
  client_id: string | null;
};

type ProfileLookup = {
  id: string;
  full_name: string | null;
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
      .from("invoices")
      .select(
        "invoice_number, client_id, subtotal_amount, tax_amount, total_amount, status, due_date, paid_at, created_at",
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      return apiError(safeErrorMessage(error, "Failed to load invoices"), 500);
    }

    const invoiceRows = (data || []) as InvoiceExportRow[];

    // Resolve client names
    const clientIds = [...new Set(invoiceRows.map((i) => i.client_id).filter(Boolean))] as string[];
    const profileMap = new Map<string, string>();

    if (clientIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name")
        .in("id", clientIds);

      for (const p of (profiles || []) as ProfileLookup[]) {
        profileMap.set(p.id, p.full_name || "");
      }
    }

    const rows = invoiceRows.map((inv) => {
      const clientName = inv.client_id ? (profileMap.get(inv.client_id) || "") : "";
      // Amounts stored in paise -- convert to INR
      const amount = (inv.subtotal_amount / 100).toFixed(2);
      const tax = (inv.tax_amount / 100).toFixed(2);
      const total = (inv.total_amount / 100).toFixed(2);

      return [
        inv.invoice_number,
        clientName,
        amount,
        tax,
        total,
        inv.status,
        inv.due_date || "",
        inv.paid_at || "",
        inv.created_at || "",
      ] as (string | number | null)[];
    });

    const headers = [
      "Invoice Number",
      "Client Name",
      "Amount (INR)",
      "Tax (INR)",
      "Total (INR)",
      "Status",
      "Due Date",
      "Paid Date",
      "Created At",
    ];

    const csv = generateCsv(headers, rows);
    return csvResponse(csv, "invoices-export.csv");
  } catch (error) {
    logError("[/api/admin/export/invoices:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
