import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import type { Database } from "@/lib/database.types";
import {
  INVOICE_PAYMENT_SELECT,
  INVOICE_SELECT,
  RecordInvoicePaymentSchema,
} from "@/lib/invoices/module";
import { syncWonCommercialState } from "@/lib/admin/commercial-state-sync";
import { syncInvoicePaymentToCommercialLedger } from "@/lib/payments/commercial-payments";
import { logError } from "@/lib/observability/logger";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoicePaymentRow = Database["public"]["Tables"]["invoice_payments"]["Row"];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const adminClient = auth.adminClient;

    const { data: invoiceData, error: invoiceError } = await adminClient
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("id", id)
      .eq("organization_id", auth.organizationId!)
      .maybeSingle();

    const invoice = invoiceData as InvoiceRow | null;
    if (invoiceError) {
      logError("Failed to fetch invoice for payment", invoiceError);
      return jsonError("Failed to fetch invoice", 500);
    }
    if (!invoice) return jsonError("Invoice not found", 404);
    if (invoice.status === "cancelled") return jsonError("Cannot pay a cancelled invoice", 400);

    const rawBody = await request.json().catch(() => null);
    const parsed = RecordInvoicePaymentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const paymentDate = parsed.data.payment_date
      ? new Date(parsed.data.payment_date).toISOString()
      : new Date().toISOString();
    if (!Number.isFinite(new Date(paymentDate).getTime())) {
      return jsonError("Invalid payment_date value", 400);
    }

    const paymentStatus = parsed.data.status || "completed";
    const amount = roundCurrency(parsed.data.amount);

    const { data: paymentData, error: paymentError } = await adminClient
      .from("invoice_payments")
      .insert({
        organization_id: auth.organizationId!,
        invoice_id: id,
        amount,
        currency: invoice.currency,
        method: parsed.data.method || null,
        reference: parsed.data.reference || null,
        notes: parsed.data.notes || null,
        status: paymentStatus,
        payment_date: paymentDate,
        created_by: auth.userId,
      })
      .select(INVOICE_PAYMENT_SELECT)
      .single();

    const payment = paymentData as InvoicePaymentRow | null;
    if (paymentError) {
      if (paymentError.code === "23505") {
        return jsonError("Payment reference already exists", 409);
      }
      logError("Failed to record invoice payment", paymentError);
      return jsonError("Failed to record invoice payment", 500);
    }

    const shouldAffectBalance = paymentStatus === "completed";
    const updatedPaidAmount = shouldAffectBalance
      ? roundCurrency(Number(invoice.paid_amount || 0) + amount)
      : roundCurrency(Number(invoice.paid_amount || 0));
    const updatedBalance = roundCurrency(
      Math.max(0, Number(invoice.total_amount || 0) - updatedPaidAmount)
    );

    const nextStatus =
      updatedPaidAmount <= 0
        ? "issued"
        : updatedBalance <= 0
        ? "paid"
        : "partially_paid";

    const { data: updatedInvoiceData, error: invoiceUpdateError } = await adminClient
      .from("invoices")
      .update({
        paid_amount: updatedPaidAmount,
        balance_amount: updatedBalance,
        status: nextStatus,
        paid_at: updatedBalance <= 0 ? new Date().toISOString() : invoice.paid_at,
        razorpay_payment_id:
          parsed.data.reference && parsed.data.reference.startsWith("pay_")
            ? parsed.data.reference
            : invoice.razorpay_payment_id,
      })
      .eq("id", id)
      .eq("organization_id", auth.organizationId!)
      .select(INVOICE_SELECT)
      .single();

    const updatedInvoice = updatedInvoiceData as InvoiceRow | null;
    if (invoiceUpdateError || !updatedInvoice) {
      logError("Failed to update invoice after payment", invoiceUpdateError);
      return jsonError("Failed to finalize invoice payment", 500);
    }

    if (payment) {
      await syncInvoicePaymentToCommercialLedger({
        adminClient,
        organizationId: auth.organizationId!,
        payment,
        invoice: updatedInvoice,
      });
    }

    if (nextStatus === "paid" && invoice.trip_id) {
      void syncWonCommercialState({
        adminClient,
        organizationId: auth.organizationId!,
        tripId: invoice.trip_id,
        confirmDraftTrip: true,
      });
    }

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

    return NextResponse.json({
      payment,
      invoice: {
        ...updatedInvoice,
        amount: updatedInvoice.total_amount,
        invoice_payments: payments || [],
      },
    });
  } catch (error) {
    logError("[/api/invoices/[id]/pay:POST] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
