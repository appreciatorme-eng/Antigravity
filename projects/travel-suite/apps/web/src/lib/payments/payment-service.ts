/**
 * Payment Service
 *
 * Business logic layer for payment operations with Razorpay integration.
 * Handles subscriptions, invoices, payment methods, and GST calculations.
 */

import { razorpay } from './razorpay-stub';
import type { Order, Payment, Subscription, Customer, Invoice } from './razorpay-stub';
import { createClient } from '@/lib/supabase/server';
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

export class PaymentService {
  /**
   * Create or get Razorpay customer for organization
   */
  async ensureCustomer(organizationId: string): Promise<string> {
    const supabase = await createClient();

    // Check if customer already exists
    const { data: org } = await supabase
      .from('organizations')
      .select('razorpay_customer_id, name, billing_email, gstin')
      .eq('id', organizationId)
      .single();

    if (!org) {
      throw new Error('Organization not found');
    }

    // If customer already exists, return ID
    if (org.razorpay_customer_id) {
      return org.razorpay_customer_id;
    }

    // Create new Razorpay customer
    const customer = await razorpay.customers.create({
      name: org.name,
      email: org.billing_email || '',
      gstin: org.gstin || undefined,
      notes: {
        organization_id: organizationId,
      },
    });

    // Store customer ID in database
    await supabase
      .from('organizations')
      .update({ razorpay_customer_id: customer.id })
      .eq('id', organizationId);

    return customer.id;
  }

  /**
   * Create a subscription for an organization
   */
  async createSubscription(options: CreateSubscriptionOptions): Promise<string> {
    const supabase = await createClient();

    // Ensure Razorpay customer exists
    const customerId = await this.ensureCustomer(options.organizationId);

    // Calculate GST
    const companyState = 'MAHARASHTRA'; // TODO: Get from config
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
        status: 'active',
        billing_cycle: options.billingCycle,
        amount: options.amount,
        gst_amount: gst.totalGst,
        total_amount: totalAmount,
        currency: 'INR',
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        next_billing_date: currentPeriodEnd,
        trial_start: null, // TODO: Implement trial period
        trial_end: null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    // Log event
    await this.logPaymentEvent({
      organizationId: options.organizationId,
      subscriptionId: subscription.id,
      eventType: 'subscription.created',
      externalId: razorpaySubscription.id,
      amount: totalAmount,
      status: 'active',
      metadata: { razorpaySubscription },
    });

    return subscription.id;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<void> {
    const supabase = await createClient();

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel in Razorpay
    if (subscription.razorpay_subscription_id) {
      await razorpay.subscriptions.cancel(
        subscription.razorpay_subscription_id,
        cancelAtPeriodEnd
      );
    }

    // Update database
    const updates: any = {
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    };

    if (!cancelAtPeriodEnd) {
      updates.status = 'cancelled';
      updates.cancelled_at = new Date().toISOString();
    }

    await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId);

    // Log event
    await this.logPaymentEvent({
      organizationId: subscription.organization_id,
      subscriptionId: subscription.id,
      eventType: 'subscription.cancelled',
      externalId: subscription.razorpay_subscription_id,
      status: cancelAtPeriodEnd ? 'active' : 'cancelled',
      metadata: { cancelAtPeriodEnd },
    });
  }

  /**
   * Create an invoice
   */
  async createInvoice(options: CreateInvoiceOptions): Promise<string> {
    const supabase = await createClient();

    // Get organization details
    const { data: org } = await supabase
      .from('organizations')
      .select('name, billing_email, gstin, billing_state')
      .eq('id', options.organizationId)
      .single();

    if (!org) {
      throw new Error('Organization not found');
    }

    // Calculate GST
    const companyState = 'MAHARASHTRA'; // TODO: Get from config
    const customerState = options.placeOfSupply || org.billing_state || companyState;
    const gst = calculateGST(options.amount, companyState, customerState);

    const totalAmount = options.amount + gst.totalGst;

    // Create Razorpay invoice (optional, for payment link)
    const customerId = await this.ensureCustomer(options.organizationId);
    const razorpayInvoice = await razorpay.invoices.create({
      customer_id: customerId,
      type: 'invoice',
      amount: Math.round(totalAmount * 100), // Convert to paise
      currency: options.currency || 'INR',
      description: options.description || 'Invoice',
      line_items: options.items?.map(item => ({
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
        client_id: options.clientId,
        amount: totalAmount,
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
        due_date: options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    // Log event
    await this.logPaymentEvent({
      organizationId: options.organizationId,
      invoiceId: invoice.id,
      eventType: 'invoice.created',
      externalId: razorpayInvoice.id,
      amount: totalAmount,
      currency: options.currency || 'INR',
      status: 'issued',
      metadata: { razorpayInvoice },
    });

    return invoice.id;
  }

  /**
   * Record a payment against an invoice
   */
  async recordPayment(options: RecordPaymentOptions): Promise<void> {
    const supabase = await createClient();

    // Get invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', options.invoiceId)
      .single();

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(options.razorpayPaymentId);

    // Record payment
    const { error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: options.invoiceId,
        amount: options.amount,
        payment_method: options.paymentMethod,
        payment_date: new Date(),
        notes: {
          razorpay_payment_id: options.razorpayPaymentId,
          razorpay_order_id: options.razorpayOrderId,
          payment_details: payment,
        },
      });

    if (paymentError) {
      throw new Error(`Failed to record payment: ${paymentError.message}`);
    }

    // Update invoice status
    const newStatus =
      options.amount >= (invoice.amount || 0) ? 'paid' : 'partially_paid';

    await supabase
      .from('invoices')
      .update({
        status: newStatus,
        razorpay_payment_id: options.razorpayPaymentId,
      })
      .eq('id', options.invoiceId);

    // Log event
    await this.logPaymentEvent({
      organizationId: invoice.organization_id,
      invoiceId: options.invoiceId,
      eventType: 'payment.success',
      externalId: options.razorpayPaymentId,
      amount: options.amount,
      currency: 'INR',
      status: 'captured',
      metadata: { payment, paymentMethod: options.paymentMethod },
    });
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
  }

  /**
   * Verify payment signature from webhook
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';
    return razorpay.webhooks.validateSignature(body, signature, webhookSecret);
  }

  /**
   * Handle subscription charged event from webhook
   */
  async handleSubscriptionCharged(
    razorpaySubscriptionId: string,
    paymentId: string,
    amount: number
  ): Promise<void> {
    const supabase = await createClient();

    // Find subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('razorpay_subscription_id', razorpaySubscriptionId)
      .single();

    if (!subscription) {
      console.error('Subscription not found:', razorpaySubscriptionId);
      return;
    }

    // Create invoice for this billing cycle
    await this.createInvoice({
      organizationId: subscription.organization_id,
      amount: subscription.amount,
      description: `Subscription payment - ${subscription.plan_id}`,
    });

    // Log event
    await this.logPaymentEvent({
      organizationId: subscription.organization_id,
      subscriptionId: subscription.id,
      eventType: 'subscription.charged',
      externalId: paymentId,
      amount,
      currency: 'INR',
      status: 'success',
      metadata: { razorpaySubscriptionId },
    });
  }

  /**
   * Handle payment failure from webhook
   */
  async handlePaymentFailed(
    organizationId: string,
    subscriptionId: string | null,
    paymentId: string,
    errorCode: string,
    errorDescription: string
  ): Promise<void> {
    const supabase = await createClient();

    // Increment failed payment count if subscription
    if (subscriptionId) {
      await supabase.rpc('increment', {
        table_name: 'subscriptions',
        row_id: subscriptionId,
        column_name: 'failed_payment_count',
      });

      // Get subscription to check failure count
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('failed_payment_count')
        .eq('id', subscriptionId)
        .single();

      // Suspend subscription after 3 failed attempts
      if (subscription && subscription.failed_payment_count >= 3) {
        await supabase
          .from('subscriptions')
          .update({ status: 'paused' })
          .eq('id', subscriptionId);

        // TODO: Send notification to organization
      }
    }

    // Log event
    await this.logPaymentEvent({
      organizationId,
      subscriptionId: subscriptionId || undefined,
      eventType: 'payment.failed',
      externalId: paymentId,
      status: 'failed',
      errorCode,
      errorDescription,
      metadata: {},
    });
  }

  /**
   * Log payment event to audit trail
   */
  private async logPaymentEvent(options: {
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
    metadata: any;
  }): Promise<void> {
    const supabase = await createClient();

    await supabase.from('payment_events').insert({
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
  }

  /**
   * Get organization's current subscription
   */
  async getCurrentSubscription(organizationId: string): Promise<any | null> {
    const supabase = await createClient();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return subscription;
  }

  /**
   * Check if organization can access a feature based on subscription tier
   */
  async checkTierLimit(
    organizationId: string,
    feature: 'clients' | 'trips' | 'proposals' | 'users',
    limit: number
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('check_tier_limit', {
      p_organization_id: organizationId,
      p_feature: feature,
      p_limit: limit,
    });

    if (error) {
      console.error('Error checking tier limit:', error);
      return { allowed: true, current: 0, limit }; // Allow by default on error
    }

    // Get current count for the feature
    let current = 0;
    switch (feature) {
      case 'clients':
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);
        current = clientCount || 0;
        break;

      case 'trips':
        const { count: tripCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        current = tripCount || 0;
        break;

      case 'proposals':
        const { count: proposalCount } = await supabase
          .from('proposals')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        current = proposalCount || 0;
        break;

      case 'users':
        const { count: userCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);
        current = userCount || 0;
        break;
    }

    return {
      allowed: data as boolean,
      current,
      limit,
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
