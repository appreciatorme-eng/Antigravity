import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import { blockDemoMutation } from "@/lib/auth/demo-org-resolver";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { registerEInvoice } from "@/lib/india/e-invoice-service";
import { logError } from "@/lib/observability/logger";
import type { Database } from "@/lib/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

const E_INVOICE_GENERATE_RATE_LIMIT_MAX = 30;
const E_INVOICE_GENERATE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

interface GenerateEInvoiceRequest {
  invoice_id: string;
  seller_details?: {
    legal_name?: string;
    address1?: string;
    address2?: string;
    location?: string;
    pincode?: number;
    state_code?: string;
  };
  buyer_details?: {
    gstin?: string;
    legal_name?: string;
    address1?: string;
    address2?: string;
    location?: string;
    pincode?: number;
    state_code?: string;
  };
  items?: Array<{
    description?: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

/**
 * POST /api/admin/e-invoicing/generate
 * Manually generate e-invoice for an existing invoice
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
      limit: E_INVOICE_GENERATE_RATE_LIMIT_MAX,
      windowMs: E_INVOICE_GENERATE_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:e-invoicing:generate",
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

    const body = rawBody as GenerateEInvoiceRequest;
    const invoiceId = sanitizeText(body.invoice_id, { maxLength: 64 });
    if (!invoiceId) {
      return jsonError("invoice_id is required", 400);
    }

    const adminClient = auth.adminClient;
    const organizationId = auth.organizationId!;

    // Fetch invoice details
    const { data: invoiceData, error: invoiceError } = await adminClient
      .from("invoices")
      .select("id, organization_id, client_id, e_invoice_status, irn")
      .eq("id", invoiceId)
      .eq("organization_id", organizationId)
      .single();

    if (invoiceError || !invoiceData) {
      logError("Failed to fetch invoice for e-invoicing", invoiceError);
      return jsonError("Invoice not found", 404);
    }

    // Check if e-invoice already exists
    if (invoiceData.irn) {
      return jsonError("E-invoice already generated for this invoice", 409);
    }

    // Fetch organization details for seller information
    const { data: orgData, error: orgError } = await adminClient
      .from("organizations")
      .select(
        "legal_name, billing_address_line1, billing_address_line2, billing_city, billing_pincode, billing_state"
      )
      .eq("id", organizationId)
      .single();

    const organization = orgData as OrganizationRow | null;
    if (orgError || !organization) {
      logError("Failed to fetch organization for e-invoicing", orgError);
      return jsonError("Organization details not found", 404);
    }

    // Build seller details from organization or request
    const sellerDetails = {
      legalName:
        body.seller_details?.legal_name || organization.legal_name || "Unknown Seller",
      address1:
        body.seller_details?.address1 ||
        organization.billing_address_line1 ||
        "Address Not Set",
      address2: body.seller_details?.address2 || organization.billing_address_line2,
      location: body.seller_details?.location || organization.billing_city || "Unknown",
      pincode: body.seller_details?.pincode || organization.billing_pincode || 110001,
      stateCode: body.seller_details?.state_code || organization.billing_state || "07",
    };

    // Fetch buyer details from client profile if available
    let buyerDetails = {
      gstin: body.buyer_details?.gstin,
      legalName: body.buyer_details?.legal_name || "Customer",
      address1: body.buyer_details?.address1 || "Not Provided",
      address2: body.buyer_details?.address2,
      location: body.buyer_details?.location || "Unknown",
      pincode: body.buyer_details?.pincode || 110001,
      stateCode: body.buyer_details?.state_code || "07",
    };

    if (invoiceData.client_id) {
      const { data: clientData } = await adminClient
        .from("profiles")
        .select(
          "full_name, billing_address, billing_city, billing_state, billing_pincode, gstin"
        )
        .eq("id", invoiceData.client_id)
        .single();

      const client = clientData as ProfileRow | null;
      if (client) {
        buyerDetails = {
          gstin: body.buyer_details?.gstin || client.gstin || undefined,
          legalName: body.buyer_details?.legal_name || client.full_name || "Customer",
          address1: body.buyer_details?.address1 || client.billing_address || "Not Provided",
          address2: body.buyer_details?.address2,
          location: body.buyer_details?.location || client.billing_city || "Unknown",
          pincode: body.buyer_details?.pincode || client.billing_pincode || 110001,
          stateCode: body.buyer_details?.state_code || client.billing_state || "07",
        };
      }
    }

    // Register e-invoice
    const result = await registerEInvoice(
      {
        invoiceId,
        sellerDetails,
        buyerDetails,
        items: body.items,
      },
      { context: "admin_api" }
    );

    return NextResponse.json({
      success: true,
      irn: result.irn,
      ack_no: result.ackNo,
      qr_code: result.qrCode,
    });
  } catch (error) {
    logError("[/api/admin/e-invoicing/generate:POST] Unhandled error", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
