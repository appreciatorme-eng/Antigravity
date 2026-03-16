import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { InvoiceDocument, type InvoicePdfData } from "@/components/pdf/InvoiceDocument";
import { requireAdmin } from "@/lib/auth/admin";
import { INVOICE_SELECT, normalizeInvoiceMetadata } from "@/lib/invoices/module";
import {
  verifyInvoiceAccessSignature,
} from "@/lib/invoices/public-link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";
import { logError } from "@/lib/observability/logger";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

function mapInvoiceToPdfData(invoice: InvoiceRow): InvoicePdfData {
  const metadata = normalizeInvoiceMetadata(invoice.metadata);
  return {
    invoice_number: invoice.invoice_number,
    currency: invoice.currency,
    status: invoice.status,
    created_at: invoice.created_at || new Date().toISOString(),
    issued_at: invoice.issued_at,
    due_date: invoice.due_date,
    subtotal_amount: invoice.subtotal_amount,
    tax_amount: invoice.tax_amount,
    total_amount: invoice.total_amount,
    paid_amount: invoice.paid_amount,
    balance_amount: invoice.balance_amount,
    cgst: invoice.cgst,
    sgst: invoice.sgst,
    igst: invoice.igst,
    place_of_supply: invoice.place_of_supply,
    sac_code: invoice.sac_code,
    notes: metadata.notes,
    line_items: metadata.line_items,
    organization_snapshot: metadata.organization_snapshot,
    client_snapshot: metadata.client_snapshot,
  };
}

async function loadInvoice(adminClient: ReturnType<typeof createAdminClient>, id: string) {
  const { data: byIdData, error: byIdError } = await adminClient
    .from("invoices")
    .select(INVOICE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (byIdError) throw byIdError;
  const byId = byIdData as InvoiceRow | null;
  if (byId) return byId;

  const { data: byTripData, error: byTripError } = await adminClient
    .from("invoices")
    .select(INVOICE_SELECT)
    .eq("trip_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byTripError) throw byTripError;
  return byTripData as InvoiceRow | null;
}

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const paymentId = request.nextUrl.searchParams.get("payment_id");
    const signature = request.nextUrl.searchParams.get("signature");
    const adminClient = createAdminClient();
    const invoice = await loadInvoice(adminClient, id);

    if (!invoice) {
      return apiError("Invoice not found", 404);
    }

    let authorized = false;

    if (paymentId && signature) {
      authorized =
        !!invoice.razorpay_payment_id &&
        invoice.razorpay_payment_id === paymentId &&
        verifyInvoiceAccessSignature(invoice.id, paymentId, signature) &&
        (invoice.status === "paid" || invoice.status === "partially_paid");
    }

    if (!authorized) {
      const auth = await requireAdmin(request, { requireOrganization: true });
      if (!auth.ok) return auth.response;
      if (!auth.isSuperAdmin && auth.organizationId !== invoice.organization_id) {
        return apiError("Forbidden", 403);
      }
    }

    const document = React.createElement(InvoiceDocument, {
      invoice: mapInvoiceToPdfData(invoice),
      template: "executive",
    }) as unknown as React.ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(document);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${invoice.invoice_number}.pdf\"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    logError("[/api/bookings/[id]/invoice:GET] Unhandled error", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
