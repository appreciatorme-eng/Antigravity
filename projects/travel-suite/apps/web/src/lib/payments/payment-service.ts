/**
 * Payment Service
 *
 * Business logic layer for payment operations with Razorpay integration.
 * Handles subscriptions, invoices, payment methods, and GST calculations.
 */

import { razorpay } from './razorpay';
import type { Order } from './razorpay';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logError } from '@/lib/observability/logger';
import {
  PaymentServiceError,
  toPaymentServiceError,
  type PaymentErrorCode,
  type PaymentOperation,
} from './errors';
import { calculateGST } from '../tax/gst-calculator';

// Types for subscription plans
export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_annual' | 'enterprise';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

interface CreateSubscriptionOptions {
  organizationId: string;
  planId: SubscriptionPlan;
  billingCycle: 'monthly' | 'annual';
  amount: number; // in rupees (not paise)
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  gstin?: string;
  billingState?: string;
}

interface CreateInvoiceOptions {
  organizationId: string;
  clientId?: string;
  amount: number; // in rupees
  currency?: 'INR' | 'USD';
  description?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  placeOfSupply?: string; // State for GST calculation
  dueDate?: Date;
}

interface RecordPaymentOptions {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
}

type PaymentExecutionContext = 'user_session' | 'admin';

interface PaymentExecutionOptions {
  context?: PaymentExecutionContext;
}

type PaymentSupabaseClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

const OPEN_SUBSCRIPTION_STATUSES = ["active", "trialing", "incomplete", "past_due", "paused"] as const;

function severityForCode(code: PaymentErrorCode): 'low' | 'medium' | 'high' | 'critical' {
  if (code === 'payments_config_error') return 'critical';
  if (code === 'payments_webhook_signature_invalid') return 'high';
  if (code === 'payments_provider_error' || code === 'payments_db_error') return 'high';
  if (code === 'payments_not_found' || code === 'payments_invalid_input') return 'medium';
  return 'low';
}

export class PaymentService {
  private async getSupabaseClient(context: PaymentExecutionContext): Promise<PaymentSupabaseClient> {
    if (context === 'admin') {
      return createAdminClient();
    }

    return createClient();
  }

  private wrapPaymentError(
    error: unknown,
    fallback: {
      code: PaymentErrorCode;
      operation: PaymentOperation;
      context: PaymentExecutionContext;
      message: string;
      tags?: Record<string, string | number | boolean | undefined>;
    }
  ): never {
    const wrapped = toPaymentServiceError(error, {
      code: fallback.code,
      operation: fallback.operation,
      message: fallback.message,
      tags: {
        context: fallback.context,
        severity: severityForCode(fallback.code),
        ...(fallback.tags || {}),
      },
    });

    logError(`Payment service ${fallback.operation} failed`, wrapped, {
      payment_error_code: wrapped.code,
      payment_operation: wrapped.operation,
      payment_context: fallback.context,
      payment_alert_severity: wrapped.tags.severity || severityForCode(wrapped.code),
      ...(fallback.tags || {}),
    });

    throw wrapped;
  }

  private resolveCompanyState(defaultState?: string | null): string {
    const configured =
      process.env.GST_COMPANY_STATE ||
      process.env.NEXT_PUBLIC_GST_COMPANY_STATE ||
      defaultState;
    return (configured || 'MAHARASHTRA').toUpperCase();
  }

  /**
   * Create or get Razorpay customer for organization
   */
  async ensureCustomer(
    organizationId: string,
    execution: PaymentExecutionOptions = {}
  ): Promise<string> {
    const context = execution.context || 'user_session';

    try {
      const supabase = await this.getSupabaseClient(context);

      // Check if customer already exists
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('razorpay_customer_id, name, gstin, owner_id')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'ensure_customer',
          message: orgError.message,
          tags: { context, organization_id: organizationId, severity: 'high' },
          cause: orgError,
        });
      }

      if (!org) {
        throw new PaymentServiceError({
          code: 'payments_not_found',
          operation: 'ensure_customer',
          message: 'Organization not found',
          tags: { context, organization_id: organizationId, severity: 'medium' },
        });
      }

      // If customer already exists, return ID
      if (org.razorpay_customer_id) {
        return org.razorpay_customer_id;
      }

      let ownerEmail: string | undefined;
      if (org.owner_id) {
        const { data: ownerProfile, error: ownerProfileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', org.owner_id)
          .maybeSingle();

        if (ownerProfileError) {
          throw new PaymentServiceError({
            code: 'payments_db_error',
            operation: 'ensure_customer',
            message: ownerProfileError.message,
            tags: { context, organization_id: organizationId, severity: 'high' },
            cause: ownerProfileError,
          });
        }

        ownerEmail = ownerProfile?.email || undefined;
      }

      const customerEmail = ownerEmail ?? `no-reply+${organizationId}@example.com`;

      // Create new Razorpay customer
      const customer = await razorpay.customers.create({
        name: org.name,
        email: customerEmail,
        gstin: org.gstin || undefined,
        notes: {
          organization_id: organizationId,
        },
      });

      // Store customer ID in database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ razorpay_customer_id: customer.id })
        .eq('id', organizationId);

      if (updateError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'ensure_customer',
          message: updateError.message,
          tags: { context, organization_id: organizationId, severity: 'high' },
          cause: updateError,
        });
      }

      return customer.id;
    } catch (error) {
      this.wrapPaymentError(error, {
        code: 'payments_provider_error',
        operation: 'ensure_customer',
        context,
        message: 'Failed to ensure Razorpay customer',
        tags: { organization_id: organizationId },
      });
    }
  }

  /**
   * Create a subscription for an organization
   */
  async createSubscription(
    options: CreateSubscriptionOptions,
    execution: PaymentExecutionOptions = {}
  ): Promise<string> {
    const context = execution.context || 'user_session';

    try {
      const supabase = await this.getSupabaseClient(context);

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('billing_state')
        .eq('id', options.organizationId)
        .maybeSingle();

      if (orgError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'create_subscription',
          message: orgError.message,
          tags: { context, organization_id: options.organizationId, severity: 'high' },
          cause: orgError,
        });
      }

      // Ensure Razorpay customer exists
      await this.ensureCustomer(options.organizationId, { context });

      // Calculate GST
      const companyState = this.resolveCompanyState(org?.billing_state);
      const gst = calculateGST(
        options.amount,
        companyState,
        options.billingState || companyState
      );

      const totalAmount = options.amount + gst.totalGst;

      // Create Razorpay subscription
      const razorpaySubscription = await razorpay.subscriptions.create({
        plan_id: `plan_${options.planId}`,
        customer_notify: 1,
        total_count: options.billingCycle === 'monthly' ? 12 : 1, // 12 monthly or 1 annual
        quantity: 1,
        notes: {
          organization_id: options.organizationId,
          plan: options.planId,
        },
      });

      // Calculate billing periods
      const now = new Date();
      const periodLength = options.billingCycle === 'monthly' ? 30 : 365; // days
      const currentPeriodStart = now;
      const currentPeriodEnd = new Date(now.getTime() + periodLength * 24 * 60 * 60 * 1000);

      // Store subscription in database
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert({
          organization_id: options.organizationId,
          plan_id: options.planId,
          razorpay_subscription_id: razorpaySubscription.id,
          razorpay_plan_id: `plan_${options.planId}`,
          status: 'incomplete',
          billing_cycle: options.billingCycle,
          amount: options.amount,
          gst_amount: gst.totalGst,
          total_amount: totalAmount,
          currency: 'INR',
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          next_billing_date: currentPeriodEnd.toISOString(),
          trial_start: null,
          trial_end: null,
        })
        .select()
        .single();

      if (error) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'create_subscription',
          message: error.message,
          tags: { context, organization_id: options.organizationId, severity: 'high' },
          cause: error,
        });
      }

      // Log event
      await this.logPaymentEvent(
        {
          organizationId: options.organizationId,
          subscriptionId: subscription.id,
          eventType: 'subscription.created',
          externalId: razorpaySubscription.id,
          amount: totalAmount,
          status: 'incomplete',
          metadata: { razorpaySubscription },
        },
        context
      );

      return subscription.id;
    } catch (error) {
      this.wrapPaymentError(error, {
        code: 'payments_provider_error',
        operation: 'create_subscription',
        context,
        message: 'Failed to create subscription',
        tags: { organization_id: options.organizationId, plan_id: options.planId },
      });
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true,
    execution: PaymentExecutionOptions = {}
  ): Promise<void> {
    const context = execution.context || 'user_session';

    try {
      const supabase = await this.getSupabaseClient(context);

      // Get subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (subscriptionError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'cancel_subscription',
          message: subscriptionError.message,
          tags: { context, subscription_id: subscriptionId, severity: 'high' },
          cause: subscriptionError,
        });
      }

      if (!subscription) {
        throw new PaymentServiceError({
          code: 'payments_not_found',
          operation: 'cancel_subscription',
          message: 'Subscription not found',
          tags: { context, subscription_id: subscriptionId, severity: 'medium' },
        });
      }

      // Cancel in Razorpay
      if (subscription.razorpay_subscription_id) {
        await razorpay.subscriptions.cancel(
          subscription.razorpay_subscription_id,
          cancelAtPeriodEnd
        );
      }

      // Update database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: any = {
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      };

      if (!cancelAtPeriodEnd) {
        updates.status = 'cancelled';
        updates.cancelled_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId);

      if (updateError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'cancel_subscription',
          message: updateError.message,
          tags: { context, subscription_id: subscriptionId, severity: 'high' },
          cause: updateError,
        });
      }

      // Log event
      await this.logPaymentEvent(
        {
          organizationId: subscription.organization_id,
          subscriptionId: subscription.id,
          eventType: 'subscription.cancelled',
          externalId: subscription.razorpay_subscription_id || undefined,
          status: cancelAtPeriodEnd ? 'active' : 'cancelled',
          metadata: { cancelAtPeriodEnd },
        },
        context
      );
    } catch (error) {
      this.wrapPaymentError(error, {
        code: 'payments_provider_error',
        operation: 'cancel_subscription',
        context,
        message: 'Failed to cancel subscription',
        tags: { subscription_id: subscriptionId },
      });
    }
  }

  /**
   * Create an invoice
   */
  async createInvoice(
    options: CreateInvoiceOptions,
    execution: PaymentExecutionOptions = {}
  ): Promise<string> {
    const context = execution.context || 'user_session';

    try {
      const supabase = await this.getSupabaseClient(context);

      // Get organization details
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

      // Calculate GST
      const companyState = this.resolveCompanyState(org.billing_state);
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

      // Create Razorpay invoice (optional, for payment link)
      const customerId = await this.ensureCustomer(options.organizationId, { context });
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

      // Store invoice in database
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
          sac_code: '998314', // SAC code for software services
          razorpay_invoice_id: razorpayInvoice.id,
          due_date: (options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days from now
        })
        .select()
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

      // Log event
      await this.logPaymentEvent(
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
      this.wrapPaymentError(error, {
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
  async recordPayment(
    options: RecordPaymentOptions,
    execution: PaymentExecutionOptions = {}
  ): Promise<void> {
    const context = execution.context || 'user_session';

    try {
      const supabase = await this.getSupabaseClient(context);

      // Idempotency guard: webhook retries should not create duplicate payment records.
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

      // Get invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', options.invoiceId)
        .single();

      if (invoiceError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'record_payment',
          message: invoiceError.message,
          tags: { context, invoice_id: options.invoiceId, severity: 'high' },
          cause: invoiceError,
        });
      }

      if (!invoice) {
        throw new PaymentServiceError({
          code: 'payments_not_found',
          operation: 'record_payment',
          message: 'Invoice not found',
          tags: { context, invoice_id: options.invoiceId, severity: 'medium' },
        });
      }

      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(options.razorpayPaymentId);

      // Record payment
      const { error: paymentError } = await supabase
        .from('invoice_payments')
        .insert({
          organization_id: invoice.organization_id,
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

      // Update invoice status
      const newStatus =
        options.amount >= (invoice.total_amount || 0) ? 'paid' : 'partially_paid';

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

      // Log event
      await this.logPaymentEvent(
        {
          organizationId: invoice.organization_id,
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
      this.wrapPaymentError(error, {
        code: 'payments_provider_error',
        operation: 'record_payment',
        context,
        message: 'Failed to record payment',
        tags: { invoice_id: options.invoiceId, payment_id: options.razorpayPaymentId },
      });
    }
  }

  /**
   * Create a payment order for checkout
   */
  async createOrder(
    amount: number, // in rupees
    currency: 'INR' | 'USD' = 'INR',
    organizationId?: string,
    notes?: Record<string, string>
  ): Promise<Order> {
    try {
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new PaymentServiceError({
          code: 'payments_invalid_input',
          operation: 'create_order',
          message: 'Amount must be greater than zero',
          tags: { severity: 'medium' },
        });
      }

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt: `rcpt_${Date.now()}`,
        notes: {
          ...notes,
          organization_id: organizationId || '',
        },
      });

      return order;
    } catch (error) {
      this.wrapPaymentError(error, {
        code: 'payments_provider_error',
        operation: 'create_order',
        context: 'user_session',
        message: 'Failed to create payment order',
        tags: { organization_id: organizationId || '' },
      });
    }
  }

  /**
   * Verify payment signature from webhook
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new PaymentServiceError({
        code: 'payments_config_error',
        operation: 'verify_webhook_signature',
        message: 'RAZORPAY_WEBHOOK_SECRET is not configured',
        tags: { context: 'admin', severity: 'critical', retryable: false },
      });
    }

    try {
      return razorpay.webhooks.validateSignature(body, signature, webhookSecret);
    } catch (error) {
      this.wrapPaymentError(error, {
        code: 'payments_webhook_signature_invalid',
        operation: 'verify_webhook_signature',
        context: 'admin',
        message: 'Failed to validate webhook signature',
        tags: { retryable: false },
      });
    }
  }

  /**
   * Handle subscription charged event from webhook
   */
  async handleSubscriptionCharged(
    razorpaySubscriptionId: string,
    paymentId: string,
    amount: number,
    execution: PaymentExecutionOptions = {}
  ): Promise<void> {
    const context = execution.context || 'admin';

    try {
      const supabase = await this.getSupabaseClient(context);

      // Find subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('razorpay_subscription_id', razorpaySubscriptionId)
        .single();

      if (subscriptionError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'handle_subscription_charged',
          message: subscriptionError.message,
          tags: { context, external_subscription_id: razorpaySubscriptionId, severity: 'high' },
          cause: subscriptionError,
        });
      }

      if (!subscription) {
        throw new PaymentServiceError({
          code: 'payments_not_found',
          operation: 'handle_subscription_charged',
          message: 'Subscription not found',
          tags: { context, external_subscription_id: razorpaySubscriptionId, severity: 'medium' },
        });
      }

      const periodLengthDays = subscription.billing_cycle === 'annual' ? 365 : 30;
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date(
        currentPeriodStart.getTime() + periodLengthDays * 24 * 60 * 60 * 1000
      );

      const { error: subscriptionUpdateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          failed_payment_count: 0,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          next_billing_date: currentPeriodEnd.toISOString(),
          razorpay_payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (subscriptionUpdateError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'handle_subscription_charged',
          message: subscriptionUpdateError.message,
          tags: { context, subscription_id: subscription.id, severity: 'high' },
          cause: subscriptionUpdateError,
        });
      }

      // Create invoice for this billing cycle
      await this.createInvoice(
        {
          organizationId: subscription.organization_id,
          amount: subscription.amount,
          description: `Subscription payment - ${subscription.plan_id}`,
        },
        { context }
      );

      // Log event
      await this.logPaymentEvent(
        {
          organizationId: subscription.organization_id,
          subscriptionId: subscription.id,
          eventType: 'subscription.charged',
          externalId: paymentId,
          amount,
          currency: 'INR',
          status: 'success',
          metadata: { razorpaySubscriptionId },
        },
        context
      );
    } catch (error) {
      this.wrapPaymentError(error, {
        code: 'payments_provider_error',
        operation: 'handle_subscription_charged',
        context,
        message: 'Failed to handle subscription charged webhook',
        tags: { external_subscription_id: razorpaySubscriptionId, payment_id: paymentId },
      });
    }
  }

  /**
   * Handle payment failure from webhook
   */
  async handlePaymentFailed(
    organizationId: string,
    subscriptionId: string | null,
    paymentId: string,
    errorCode: string,
    errorDescription: string,
    execution: PaymentExecutionOptions = {}
  ): Promise<void> {
    const context = execution.context || 'admin';

    try {
      const supabase = await this.getSupabaseClient(context);

      // Increment failed payment count if subscription
      if (subscriptionId) {
        // Get subscription to check failure count
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('failed_payment_count')
          .eq('id', subscriptionId)
          .single();

        if (subscriptionError) {
          throw new PaymentServiceError({
            code: 'payments_db_error',
            operation: 'handle_payment_failed',
            message: subscriptionError.message,
            tags: { context, subscription_id: subscriptionId, severity: 'high' },
            cause: subscriptionError,
          });
        }

        if (subscription) {
          const newCount = (subscription.failed_payment_count || 0) + 1;

          const { error: failedCountError } = await supabase
            .from('subscriptions')
            .update({ failed_payment_count: newCount })
            .eq('id', subscriptionId);

          if (failedCountError) {
            throw new PaymentServiceError({
              code: 'payments_db_error',
              operation: 'handle_payment_failed',
              message: failedCountError.message,
              tags: { context, subscription_id: subscriptionId, severity: 'high' },
              cause: failedCountError,
            });
          }

          // Suspend subscription after 3 failed attempts
          if (newCount >= 3) {
            const { error: pauseError } = await supabase
              .from('subscriptions')
              .update({ status: 'paused' })
              .eq('id', subscriptionId);

            if (pauseError) {
              throw new PaymentServiceError({
                code: 'payments_db_error',
                operation: 'handle_payment_failed',
                message: pauseError.message,
                tags: { context, subscription_id: subscriptionId, severity: 'high' },
                cause: pauseError,
              });
            }

            await this.notifyOrganizationSubscriptionPaused(
              {
                organizationId,
                subscriptionId,
                paymentId,
                failureCount: newCount,
                errorCode,
                errorDescription,
              },
              context
            );
          }
        }
      }

      // Log event
      await this.logPaymentEvent(
        {
          organizationId,
          subscriptionId: subscriptionId || undefined,
          eventType: 'payment.failed',
          externalId: paymentId,
          status: 'failed',
          errorCode,
          errorDescription,
          metadata: {},
        },
        context
      );
    } catch (error) {
      this.wrapPaymentError(error, {
        code: 'payments_db_error',
        operation: 'handle_payment_failed',
        context,
        message: 'Failed to handle payment failure',
        tags: { organization_id: organizationId, subscription_id: subscriptionId || '', payment_id: paymentId },
      });
    }
  }

  private async notifyOrganizationSubscriptionPaused(
    options: {
      organizationId: string;
      subscriptionId: string;
      paymentId: string;
      failureCount: number;
      errorCode: string;
      errorDescription: string;
    },
    context: PaymentExecutionContext = 'admin'
  ): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient(context);
      const nowIso = new Date().toISOString();
      const title = 'Subscription paused after repeated payment failures';
      const body = `Subscription ${options.subscriptionId} was paused after ${options.failureCount} failed attempts. Last payment: ${options.paymentId}. Error: ${options.errorCode} - ${options.errorDescription}.`;

      const { data: adminRecipients, error: recipientsError } = await supabase
        .from('profiles')
        .select('id,email')
        .eq('organization_id', options.organizationId)
        .eq('role', 'admin');

      if (recipientsError || !adminRecipients || adminRecipients.length === 0) {
        return;
      }

      await supabase.from('notification_logs').insert(
        adminRecipients.map((recipient) => ({
          recipient_id: recipient.id,
          recipient_type: 'admin',
          notification_type: 'subscription_paused',
          title,
          body,
          status: 'sent',
          sent_at: nowIso,
        }))
      );

      const queueItems = adminRecipients
        .filter((recipient) => typeof recipient.email === 'string' && recipient.email.trim().length > 0)
        .map((recipient) => ({
          user_id: recipient.id,
          recipient_email: recipient.email,
          recipient_type: 'admin',
          notification_type: 'subscription_paused',
          payload: {
            title,
            message: body,
            subscriptionId: options.subscriptionId,
            paymentId: options.paymentId,
            failureCount: options.failureCount,
          },
          channel_preference: 'email_only',
          status: 'pending',
          scheduled_for: nowIso,
        }));

      if (queueItems.length > 0) {
        const { error: queueError } = await supabase.from('notification_queue').insert(queueItems);
        if (queueError) {
          this.wrapPaymentError(queueError, {
            code: 'payments_db_error',
            operation: 'notify_subscription_paused',
            context,
            message: 'Failed to enqueue subscription pause notifications',
            tags: { organization_id: options.organizationId, subscription_id: options.subscriptionId },
          });
        }
      }
    } catch (error) {
      // Notification fan-out should not fail primary payment flow.
      logError('Failed to notify organization about paused subscription', error, {
        payment_operation: 'notify_subscription_paused',
        payment_context: context,
        organization_id: options.organizationId,
        subscription_id: options.subscriptionId,
      });
    }
  }

  /**
   * Log payment event to audit trail
   */
  private async logPaymentEvent(
    options: {
      organizationId: string;
      subscriptionId?: string;
      invoiceId?: string;
      eventType: string;
      externalId?: string;
      amount?: number;
      currency?: 'INR' | 'USD';
      status?: string;
      errorCode?: string;
      errorDescription?: string;
      metadata: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    context: PaymentExecutionContext = 'user_session'
  ): Promise<void> {
    const supabase = await this.getSupabaseClient(context);

    if (options.externalId) {
      const { data: existingEvent, error: existingEventError } = await supabase
        .from('payment_events')
        .select('id')
        .eq('event_type', options.eventType)
        .eq('external_id', options.externalId)
        .maybeSingle();

      if (existingEventError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'log_payment_event',
          message: existingEventError.message,
          tags: { context, organization_id: options.organizationId, severity: 'high' },
          cause: existingEventError,
        });
      }

      if (existingEvent?.id) {
        return;
      }
    }

    const { error: insertError } = await supabase.from('payment_events').insert({
      organization_id: options.organizationId,
      subscription_id: options.subscriptionId,
      invoice_id: options.invoiceId,
      event_type: options.eventType,
      external_id: options.externalId,
      amount: options.amount,
      currency: options.currency,
      status: options.status,
      error_code: options.errorCode,
      error_description: options.errorDescription,
      metadata: options.metadata,
    });

    if (insertError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'log_payment_event',
        message: insertError.message,
        tags: { context, organization_id: options.organizationId, severity: 'high' },
        cause: insertError,
      });
    }
  }

  /**
   * Get organization's current subscription
   */
  async getCurrentSubscription(
    organizationId: string,
    execution: PaymentExecutionOptions = {}
  ): Promise<any | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const context = execution.context || 'user_session';

    try {
      const supabase = await this.getSupabaseClient(context);

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', OPEN_SUBSCRIPTION_STATUSES as unknown as string[])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'get_current_subscription',
          message: error.message,
          tags: { context, organization_id: organizationId, severity: 'high' },
          cause: error,
        });
      }

      const rows = Array.isArray(subscription) ? subscription : [];
      const prioritized = rows.find((row) => row.status === 'active') || rows[0] || null;
      return prioritized;
    } catch (error) {
      this.wrapPaymentError(error, {
        code: 'payments_db_error',
        operation: 'get_current_subscription',
        context,
        message: 'Failed to fetch current subscription',
        tags: { organization_id: organizationId },
      });
    }
  }

  /**
   * Check if organization can access a feature based on subscription tier
   */
  async checkTierLimit(
    organizationId: string,
    feature: 'clients' | 'trips' | 'proposals' | 'users',
    limit: number,
    execution: PaymentExecutionOptions = {}
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const context = execution.context || 'user_session';

    try {
      const supabase = await this.getSupabaseClient(context);

      const { data, error } = await supabase.rpc('check_tier_limit', {
        p_organization_id: organizationId,
        p_feature: feature,
        p_limit: limit,
      });

      if (error) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'check_tier_limit',
          message: error.message,
          tags: { context, organization_id: organizationId, feature, severity: 'high' },
          cause: error,
        });
      }

      // Get current count for the feature
      let current = 0;
      switch (feature) {
        case 'clients': {
          const { count: clientCount } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId);
          current = clientCount || 0;
          break;
        }

        case 'trips': {
          const { count: tripCount } = await supabase
            .from('trips')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
          current = tripCount || 0;
          break;
        }

        case 'proposals': {
          const { count: proposalCount } = await supabase
            .from('proposals')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
          current = proposalCount || 0;
          break;
        }

        case 'users': {
          const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId);
          current = userCount || 0;
          break;
        }
      }

      return {
        allowed: data as boolean,
        current,
        limit,
      };
    } catch (error) {
      this.wrapPaymentError(error, {
        code: 'payments_db_error',
        operation: 'check_tier_limit',
        context,
        message: 'Failed to check tier limit',
        tags: { organization_id: organizationId, feature },
      });
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
