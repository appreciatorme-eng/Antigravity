// Invoice creation with GST and payment recording against invoices.

import { razorpay } from './razorpay';
import { PaymentServiceError } from './errors';
import { getPaymentClient, resolveCompanyState, wrapPaymentError } from './payment-utils';
import { logPaymentEvent } from './payment-logger';
import { ensureCustomer } from './customer-service';
import { calculateGST } from '../tax/gst-calculator';
import type { Database } from '@/lib/database.types';
import type {
  CreateInvoiceOptions,
  RecordPaymentOptions,
  PaymentExecutionContext,
  PaymentExecutionOptions,
} from './payment-types';

const CREATED_INVOICE_SELECT = 'id';
const RECORD_PAYMENT_INVOICE_SELECT = [
  'id',
  'organization_id',
  'total_amount',
].join(', ');
type InvoicePaymentSourceRow = Pick<
  Database['public']['Tables']['invoices']['Row'],
  'id' | 'organization_id' | 'total_amount'
>;

/**
 * Create an invoice
 */
export async function createInvoice(
  options: CreateInvoiceOptions,
  execution: PaymentExecutionOptions = {}
): Promise<string> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, gstin, billing_state')
      .eq('id', options.organizationId)
      .single();

    if (orgError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_invoice',
        message: orgError.message,
        tags: { context, organization_id: options.organizationId, severity: 'high' },
        cause: orgError,
      });
    }

    if (!org) {
      throw new PaymentServiceError({
        code: 'payments_not_found',
        operation: 'create_invoice',
        message: 'Organization not found',
        tags: { context, organization_id: options.organizationId, severity: 'medium' },
      });
    }

    const companyState = resolveCompanyState(org.billing_state);
    const customerState = options.placeOfSupply || org.billing_state || companyState;
    const gst = calculateGST(options.amount, companyState, customerState);

    const totalAmount = options.amount + gst.totalGst;
    const invoiceItems =
      options.items && options.items.length > 0
        ? options.items
        : [
            {
              description: options.description || 'Invoice',
              amount: totalAmount,
              quantity: 1,
            },
          ];

    const customerId = await ensureCustomer(options.organizationId, { context });
    const razorpayInvoice = await razorpay.invoices.create({
      customer_id: customerId,
      type: 'invoice',
      currency: options.currency || 'INR',
      description: options.description || 'Invoice',
      line_items: invoiceItems.map(item => ({
        name: item.description,
        amount: Math.round(item.amount * 100),
        quantity: item.quantity || 1,
      })),
    });

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        organization_id: options.organizationId,
        invoice_number: `INV-${Date.now()}`,
        client_id: options.clientId,
        total_amount: totalAmount,
        subtotal: options.amount,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        currency: options.currency || 'INR',
        status: 'pending',
        gstin: org.gstin,
        place_of_supply: customerState,
        sac_code: '998314',
        razorpay_invoice_id: razorpayInvoice.id,
        due_date: (options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
      })
      .select(CREATED_INVOICE_SELECT)
      .single();

    if (error) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_invoice',
        message: error.message,
        tags: { context, organization_id: options.organizationId, severity: 'high' },
        cause: error,
      });
    }

    await logPaymentEvent(
      supabase,
      {
        organizationId: options.organizationId,
        invoiceId: invoice.id,
        eventType: 'invoice.created',
        externalId: razorpayInvoice.id,
        amount: totalAmount,
        currency: options.currency || 'INR',
        status: 'issued',
        metadata: { razorpayInvoice },
      },
      context
    );

    return invoice.id;
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_provider_error',
      operation: 'create_invoice',
      context,
      message: 'Failed to create invoice',
      tags: { organization_id: options.organizationId },
    });
  }
}

/**
 * Record a payment against an invoice
 */
export async function recordPayment(
  options: RecordPaymentOptions,
  execution: PaymentExecutionOptions = {}
): Promise<void> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from('invoice_payments')
      .select('id, status')
      .eq('reference', options.razorpayPaymentId)
      .maybeSingle();

    if (existingPaymentError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'record_payment',
        message: existingPaymentError.message,
        tags: { context, invoice_id: options.invoiceId, severity: 'high' },
        cause: existingPaymentError,
      });
    }

    if (existingPayment?.id) {
      return;
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(RECORD_PAYMENT_INVOICE_SELECT)
      .eq('id', options.invoiceId)
      .single();
    const invoiceRow = invoice as unknown as InvoicePaymentSourceRow | null;

    if (invoiceError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'record_payment',
        message: invoiceError.message,
        tags: { context, invoice_id: options.invoiceId, severity: 'high' },
        cause: invoiceError,
      });
    }

    if (!invoiceRow) {
      throw new PaymentServiceError({
        code: 'payments_not_found',
        operation: 'record_payment',
        message: 'Invoice not found',
        tags: { context, invoice_id: options.invoiceId, severity: 'medium' },
      });
    }

    const payment = await razorpay.payments.fetch(options.razorpayPaymentId);

    const { error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        organization_id: invoiceRow.organization_id,
        invoice_id: options.invoiceId,
        amount: options.amount,
        method: options.paymentMethod,
        payment_date: new Date().toISOString(),
        reference: options.razorpayPaymentId,
        notes: JSON.stringify({
          razorpay_payment_id: options.razorpayPaymentId,
          razorpay_order_id: options.razorpayOrderId,
          payment_details: payment,
        }),
        currency: 'INR',
        status: 'captured'
      });

    if (paymentError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'record_payment',
        message: paymentError.message,
        tags: { context, invoice_id: options.invoiceId, severity: 'high' },
        cause: paymentError,
      });
    }

    const newStatus =
      options.amount >= (invoiceRow.total_amount || 0) ? 'paid' : 'partially_paid';

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: newStatus,
        razorpay_payment_id: options.razorpayPaymentId,
      })
      .eq('id', options.invoiceId);

    if (updateError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'record_payment',
        message: updateError.message,
        tags: { context, invoice_id: options.invoiceId, severity: 'high' },
        cause: updateError,
      });
    }

    await logPaymentEvent(
      supabase,
      {
        organizationId: invoiceRow.organization_id,
        invoiceId: options.invoiceId,
        eventType: 'payment.success',
        externalId: options.razorpayPaymentId,
        amount: options.amount,
        currency: 'INR',
        status: 'captured',
        metadata: { payment, paymentMethod: options.paymentMethod },
      },
      context
    );
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_provider_error',
      operation: 'record_payment',
      context,
      message: 'Failed to record payment',
      tags: { invoice_id: options.invoiceId, payment_id: options.razorpayPaymentId },
    });
  }
}
