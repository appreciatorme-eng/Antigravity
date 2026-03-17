/* ------------------------------------------------------------------
 * GET /api/admin/reports/gstr-1?month=2026-03&format=json
 * Returns GSTR-1 compliant export for GST filing.
 * ------------------------------------------------------------------ */

import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import { exportGSTR1, formatGSTR1AsCSV } from "@/lib/india/gstr-export";

function parseMonthParam(raw: string | null): string | null {
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return raw;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;
    const { organizationId, adminClient } = authResult;

    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");
    const formatParam = url.searchParams.get("format") || "json";

    const period = parseMonthParam(monthParam);

    if (!period) {
      return apiError(
        "Invalid month parameter. Expected format: YYYY-MM (e.g., 2026-03)",
        400
      );
    }

    // Validate format parameter
    if (formatParam !== "json" && formatParam !== "csv") {
      return apiError(
        "Invalid format parameter. Expected: json or csv",
        400
      );
    }

    // Generate GSTR-1 export
    const gstr1Data = await exportGSTR1(adminClient, organizationId, period);

    // Return JSON format (default)
    if (formatParam === "json") {
      return NextResponse.json({ data: gstr1Data });
    }

    // Return CSV format
    if (formatParam === "csv") {
      const csvData = formatGSTR1AsCSV(gstr1Data);

      // Create a combined CSV with all sections
      const combinedCSV = `GSTR-1 Export - ${period}\nOrganization: ${gstr1Data.legalName} (${gstr1Data.gstin})\n\n` +
        `=== B2B INVOICES ===\n${csvData.b2b}\n\n` +
        `=== B2CL INVOICES (> ₹2.5L) ===\n${csvData.b2cl}\n\n` +
        `=== B2CS SUMMARY (≤ ₹2.5L) ===\n${csvData.b2cs}\n\n` +
        `=== HSN/SAC SUMMARY ===\n${csvData.hsn}\n\n` +
        `=== SUMMARY ===\n` +
        `Total Invoices,${gstr1Data.summary.totalInvoices}\n` +
        `Total B2B Invoices,${gstr1Data.summary.totalB2BInvoices}\n` +
        `Total B2CL Invoices,${gstr1Data.summary.totalB2CLInvoices}\n` +
        `Total B2CS Entries,${gstr1Data.summary.totalB2CSInvoices}\n` +
        `Total Taxable Value,${gstr1Data.summary.totalTaxableValue.toFixed(2)}\n` +
        `Total CGST,${gstr1Data.summary.totalCGST.toFixed(2)}\n` +
        `Total SGST,${gstr1Data.summary.totalSGST.toFixed(2)}\n` +
        `Total IGST,${gstr1Data.summary.totalIGST.toFixed(2)}\n` +
        `Total Tax Amount,${gstr1Data.summary.totalTaxAmount.toFixed(2)}\n`;

      return new NextResponse(combinedCSV, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="gstr1-${period}.csv"`,
        },
      });
    }

    return apiError("Unexpected error", 500);
  } catch (error) {
    logError("[/api/admin/reports/gstr-1:GET] Unhandled error", error);

    // Check if it's a known error from exportGSTR1
    if (error instanceof Error) {
      if (error.message.includes("GSTIN not configured")) {
        return apiError("Organization GSTIN not configured. Please configure GSTIN in organization settings.", 400);
      }
      if (error.message.includes("Organization not found")) {
        return apiError("Organization not found", 404);
      }
      if (error.message.includes("Invalid period format")) {
        return apiError(error.message, 400);
      }
    }

    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
