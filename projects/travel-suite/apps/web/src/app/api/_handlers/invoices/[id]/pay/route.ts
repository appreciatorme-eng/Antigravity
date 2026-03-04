import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { RecordInvoicePaymentSchema } from "@/lib/invoices/module";

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
  const auth = await requireAdmin(request, { requireOrganization: true });
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const adminClient = auth.adminClient;

  const { data: invoice, error: invoiceError } = await adminClient
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId!)
    .maybeSingle();

  if (invoiceError) {
    console.error("Failed to fetch invoice for payment:", invoiceError);
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

  const { data: payment, error: paymentError } = await adminClient
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
    .select("*")
    .single();

  if (paymentError) {
    if (paymentError.code === "23505") {
      return jsonError("Payment reference already exists", 409);
    }
    console.error("Failed to record invoice payment:", paymentError);
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

  const { data: updatedInvoice, error: invoiceUpdateError } = await adminClient
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
    .select("*")
    .single();

  if (invoiceUpdateError || !updatedInvoice) {
    console.error("Failed to update invoice after payment:", invoiceUpdateError);
    return jsonError("Failed to finalize invoice payment", 500);
  }

  const { data: payments, error: paymentsError } = await adminClient
    .from("invoice_payments")
    .select("*")
    .eq("invoice_id", id)
    .eq("organization_id", auth.organizationId!)
    .order("payment_date", { ascending: false });

  if (paymentsError) {
    console.error("Failed to fetch invoice payments:", paymentsError);
    return jsonError("Failed to fetch invoice payments", 500);
  }

  return NextResponse.json({
    payment,
    invoice: {
      ...updatedInvoice,
      amount: updatedInvoice.total_amount,
      invoice_payments: payments || [],
    },
  });
}

