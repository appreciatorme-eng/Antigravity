import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { getEInvoiceStatus } from "@/lib/india/e-invoice-service";
import { logError } from "@/lib/observability/logger";

const E_INVOICE_STATUS_RATE_LIMIT_MAX = 60;
const E_INVOICE_STATUS_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/admin/e-invoicing/status?invoice_id=xxx
 * Get the current status of an e-invoice from IRP
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const rateLimit = await enforceRateLimit({
      identifier: auth.userId,
      limit: E_INVOICE_STATUS_RATE_LIMIT_MAX,
      windowMs: E_INVOICE_STATUS_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:e-invoicing:status",
    });
    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
      const response = NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
      response.headers.set("retry-after", String(retryAfterSeconds));
      response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
      response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
      return response;
    }

    const searchParams = request.nextUrl.searchParams;
    const invoiceId = sanitizeText(searchParams.get("invoice_id"), { maxLength: 64 });

    if (!invoiceId) {
      return jsonError("invoice_id query parameter is required", 400);
    }

    const adminClient = auth.adminClient;
    const organizationId = auth.organizationId!;

    // Verify invoice exists and belongs to organization
    const { data: invoiceData, error: invoiceError } = await adminClient
      .from("invoices")
      .select("id, organization_id, irn, e_invoice_status")
      .eq("id", invoiceId)
      .eq("organization_id", organizationId)
      .single();

    if (invoiceError || !invoiceData) {
      logError("Failed to fetch invoice for e-invoice status", invoiceError);
      return jsonError("Invoice not found", 404);
    }

    if (!invoiceData.irn) {
      return jsonError("Invoice does not have an IRN", 400);
    }

    // Get status from IRP
    const statusResult = await getEInvoiceStatus(invoiceId, { context: "admin_api" });

    return NextResponse.json({
      success: true,
      invoice_id: invoiceId,
      irn: statusResult.irn,
      status: statusResult.status,
      ack_no: statusResult.ackNo,
      local_status: invoiceData.e_invoice_status,
    });
  } catch (error) {
    logError("[/api/admin/e-invoicing/status:GET] Unhandled error", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
