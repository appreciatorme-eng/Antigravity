import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import { blockDemoMutation } from "@/lib/auth/demo-org-resolver";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { cancelEInvoice } from "@/lib/india/e-invoice-service";
import { logError } from "@/lib/observability/logger";

const E_INVOICE_CANCEL_RATE_LIMIT_MAX = 30;
const E_INVOICE_CANCEL_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

interface CancelEInvoiceRequest {
  invoice_id: string;
  reason: string;
  remarks: string;
}

/**
 * POST /api/admin/e-invoicing/cancel
 * Cancel a previously generated e-invoice
 * Note: E-invoices can only be cancelled within 24 hours of generation
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    if (!passesMutationCsrfGuard(request)) {
      return jsonError("CSRF validation failed for admin mutation", 403);
    }

    const demoBlocked = blockDemoMutation(request);
    if (demoBlocked) return demoBlocked;

    const rateLimit = await enforceRateLimit({
      identifier: auth.userId,
      limit: E_INVOICE_CANCEL_RATE_LIMIT_MAX,
      windowMs: E_INVOICE_CANCEL_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:e-invoicing:cancel",
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

    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return jsonError("Invalid request body", 400);
    }

    const body = rawBody as CancelEInvoiceRequest;
    const invoiceId = sanitizeText(body.invoice_id, { maxLength: 64 });
    const reason = sanitizeText(body.reason, { maxLength: 120 });
    const remarks = sanitizeText(body.remarks, { maxLength: 500, preserveNewlines: true });

    if (!invoiceId) {
      return jsonError("invoice_id is required", 400);
    }
    if (!reason) {
      return jsonError("reason is required", 400);
    }
    if (!remarks) {
      return jsonError("remarks is required", 400);
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
      logError("Failed to fetch invoice for e-invoice cancellation", invoiceError);
      return jsonError("Invoice not found", 404);
    }

    if (!invoiceData.irn) {
      return jsonError("Invoice does not have an IRN - cannot cancel", 400);
    }

    if (invoiceData.e_invoice_status === "cancelled") {
      return jsonError("E-invoice is already cancelled", 409);
    }

    // Cancel e-invoice
    await cancelEInvoice(
      {
        invoiceId,
        reason,
        remarks,
      },
      { context: "admin" }
    );

    return NextResponse.json({
      success: true,
      message: "E-invoice cancelled successfully",
    });
  } catch (error) {
    logError("[/api/admin/e-invoicing/cancel:POST] Unhandled error", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
