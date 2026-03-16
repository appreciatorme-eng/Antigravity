import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  INVOICE_PAYMENT_SELECT,
  INVOICE_SELECT,
  UpdateInvoiceSchema,
  calculateInvoiceTotals,
  calculateTaxBreakdown,
  normalizeInvoiceMetadata,
  normalizeIsoDate,
} from "@/lib/invoices/module";
import type { Database, Json } from "@/lib/database.types";
import { sanitizeText } from "@/lib/security/sanitize";
import { logError } from "@/lib/observability/logger";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoicePaymentRow = Database["public"]["Tables"]["invoice_payments"]["Row"];
type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];
type InvoiceStatus = NonNullable<InvoiceUpdate["status"]>;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeStatusAfterTotals(
  requestedStatus: InvoiceUpdate["status"] | undefined,
  totalAmount: number,
  paidAmount: number
): InvoiceStatus {
  if (requestedStatus) return requestedStatus as InvoiceStatus;
  if (paidAmount <= 0) return "issued";
  if (paidAmount >= totalAmount) return "paid";
  return "partially_paid";
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadInvoiceForOrg(
  adminClient: ReturnType<(typeof import("@/lib/supabase/admin"))["createAdminClient"]>,
  id: string,
  organizationId: string
) {
  if (!UUID_REGEX.test(id)) return { invoice: null, error: null };

  const { data: invoiceData, error } = await adminClient
    .from("invoices")
    .select(INVOICE_SELECT)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) return { invoice: null, error };
  const invoice = invoiceData as InvoiceRow | null;
  return { invoice, error: null };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const adminClient = auth.adminClient;

    const { invoice, error } = await loadInvoiceForOrg(adminClient, id, auth.organizationId!);
    if (error) {
      logError("Failed to fetch invoice", error);
      return jsonError("Failed to fetch invoice", 500);
    }
    if (!invoice) return jsonError("Invoice not found", 404);

    const { data: paymentsData, error: paymentsError } = await adminClient
      .from("invoice_payments")
      .select(INVOICE_PAYMENT_SELECT)
      .eq("invoice_id", id)
      .eq("organization_id", auth.organizationId!)
      .order("payment_date", { ascending: false });

    if (paymentsError) {
      logError("Failed to fetch invoice payments", paymentsError);
      return jsonError("Failed to fetch invoice payments", 500);
    }
    const payments = paymentsData as unknown as InvoicePaymentRow[] | null;

    const normalized = normalizeInvoiceMetadata(invoice.metadata);
    return NextResponse.json({
      invoice: {
        ...invoice,
        amount: invoice.total_amount,
        notes: normalized.notes,
        line_items: normalized.line_items,
        organization_snapshot: normalized.organization_snapshot,
        client_snapshot: normalized.client_snapshot,
        invoice_payments: payments || [],
      },
    });
  } catch (error) {
    logError("[/api/invoices/[id]:GET] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const adminClient = auth.adminClient;
    const { invoice, error } = await loadInvoiceForOrg(adminClient, id, auth.organizationId!);
    if (error) {
      logError("Failed to fetch invoice for update", error);
      return jsonError("Failed to fetch invoice", 500);
    }
    if (!invoice) return jsonError("Invoice not found", 404);

    const rawBody = await request.json().catch(() => null);
    const parsed = UpdateInvoiceSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice update payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingMeta = normalizeInvoiceMetadata(invoice.metadata);
    const updates: InvoiceUpdate = {};

    const dueDate = normalizeIsoDate(parsed.data.due_date);
    if (dueDate === undefined) {
      return jsonError("Invalid due_date value", 400);
    }
    if (dueDate !== undefined) updates.due_date = dueDate;

    const notesProvided = parsed.data.notes !== undefined;
    const normalizedNotes = notesProvided
      ? sanitizeText(parsed.data.notes, { maxLength: 4000, preserveNewlines: true }) || null
      : null;

    const placeOfSupplyProvided = parsed.data.place_of_supply !== undefined;
    if (placeOfSupplyProvided) {
      updates.place_of_supply =
        sanitizeText(parsed.data.place_of_supply, { maxLength: 120 }) || null;
    }

    if (parsed.data.sac_code !== undefined) {
      updates.sac_code = sanitizeText(parsed.data.sac_code, { maxLength: 24 }) || null;
    }

    let finalStatus: InvoiceUpdate["status"] | undefined = parsed.data.status;
    let metadataLineItems = normalizeInvoiceMetadata(invoice.metadata).line_items;

    if (parsed.data.items) {
      const totals = calculateInvoiceTotals(parsed.data.items);
      const taxBreakdown = calculateTaxBreakdown(
        totals.taxTotal,
        null,
        (updates.place_of_supply || invoice.place_of_supply) ?? null
      );

      updates.subtotal_amount = totals.subtotal;
      updates.tax_amount = totals.taxTotal;
      updates.total_amount = totals.grandTotal;
      updates.subtotal = totals.subtotal;
      updates.cgst = taxBreakdown.cgst;
      updates.sgst = taxBreakdown.sgst;
      updates.igst = taxBreakdown.igst;
      updates.balance_amount = Math.max(0, totals.grandTotal - Number(invoice.paid_amount || 0));

      finalStatus = normalizeStatusAfterTotals(
        parsed.data.status,
        totals.grandTotal,
        Number(invoice.paid_amount || 0)
      );
      metadataLineItems = totals.items;
    }

    if (finalStatus) updates.status = finalStatus;

    const nextMetadata: Json = {
      line_items: metadataLineItems.map((item) => ({ ...item })),
      notes: notesProvided ? normalizedNotes : existingMeta.notes ?? null,
      organization_snapshot: existingMeta.organization_snapshot as unknown as Json,
      client_snapshot: existingMeta.client_snapshot as unknown as Json,
      last_updated_via: "invoice_module_v1",
      last_updated_at: new Date().toISOString(),
    };
    updates.metadata = nextMetadata;

    const { data: updatedInvoiceData, error: updateError } = await adminClient
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", auth.organizationId!)
      .select(INVOICE_SELECT)
      .single();

    const updatedInvoice = updatedInvoiceData as InvoiceRow | null;
    if (updateError || !updatedInvoice) {
      logError("Failed to update invoice", updateError);
      return jsonError("Failed to update invoice", 500);
    }

    const normalized = normalizeInvoiceMetadata(updatedInvoice.metadata);
    return NextResponse.json({
      invoice: {
        ...updatedInvoice,
        amount: updatedInvoice.total_amount,
        notes: normalized.notes,
        line_items: normalized.line_items,
        organization_snapshot: normalized.organization_snapshot,
        client_snapshot: normalized.client_snapshot,
      },
    });
  } catch (error) {
    logError("[/api/invoices/[id]:PUT] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const adminClient = auth.adminClient;

    const { invoice, error } = await loadInvoiceForOrg(adminClient, id, auth.organizationId!);
    if (error) {
      logError("Failed to fetch invoice for delete", error);
      return jsonError("Failed to fetch invoice", 500);
    }
    if (!invoice) return jsonError("Invoice not found", 404);

    if (invoice.status === "paid" || Number(invoice.paid_amount || 0) > 0) {
      return jsonError("Cannot delete an invoice with recorded payments", 400);
    }

    const { error: deleteError } = await adminClient
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("organization_id", auth.organizationId!);

    if (deleteError) {
      logError("Failed to delete invoice", deleteError);
      return jsonError("Failed to delete invoice", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("[/api/invoices/[id]:DELETE] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
