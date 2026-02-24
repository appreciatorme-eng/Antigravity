/**
 * Razorpay Webhook Handler
 *
 * Handles webhook events from Razorpay:
 * - payment.captured
 * - payment.failed
 * - subscription.charged
 * - subscription.cancelled
 * - subscription.paused
 * - invoice.paid
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/payment-service';
import type { PaymentMethod } from '@/lib/payments/payment-service';
import { createClient } from '@/lib/supabase/server';
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from '@/lib/integrations';

interface RazorpayPaymentEntity {
  id: string;
  amount: number;
  method: string;
  order_id: string;
  notes: {
    organization_id?: string;
    invoice_id?: string;
    subscription_id?: string;
  };
  error_code?: string;
  error_description?: string;
}

interface RazorpaySubscriptionEntity {
  id: string;
}

interface RazorpayInvoiceEntity {
  id: string;
  payment_id?: string;
}

interface RazorpayWebhookPayload {
  payment?: { entity?: Record<string, unknown> };
  subscription?: { entity?: Record<string, unknown> };
  invoice?: { entity?: Record<string, unknown> };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizePaymentMethod(value: string): PaymentMethod {
  const normalized = value.toLowerCase();
  if (normalized === 'upi' || normalized === 'card' || normalized === 'netbanking' || normalized === 'wallet') {
    return normalized;
  }
  return 'card';
}

function getPaymentEntity(payload: RazorpayWebhookPayload): RazorpayPaymentEntity | null {
  const entity = payload.payment?.entity;
  if (!entity || typeof entity !== 'object') return null;

  const id = asString(entity.id);
  if (!id) return null;

  const notesCandidate =
    entity.notes && typeof entity.notes === 'object' ? (entity.notes as Record<string, unknown>) : {};

  return {
    id,
    amount: asNumber(entity.amount) || 0,
    method: asString(entity.method) || 'unknown',
    order_id: asString(entity.order_id) || '',
    notes: {
      organization_id: asString(notesCandidate.organization_id) || undefined,
      invoice_id: asString(notesCandidate.invoice_id) || undefined,
      subscription_id: asString(notesCandidate.subscription_id) || undefined,
    },
    error_code: asString(entity.error_code) || undefined,
    error_description: asString(entity.error_description) || undefined,
  };
}

function getSubscriptionEntity(payload: RazorpayWebhookPayload): RazorpaySubscriptionEntity | null {
  const entity = payload.subscription?.entity;
  if (!entity || typeof entity !== 'object') return null;
  const id = asString(entity.id);
  if (!id) return null;
  return { id };
}

function getInvoiceEntity(payload: RazorpayWebhookPayload): RazorpayInvoiceEntity | null {
  const entity = payload.invoice?.entity;
  if (!entity || typeof entity !== 'object') return null;
  const id = asString(entity.id);
  if (!id) return null;
  return {
    id,
    payment_id: asString(entity.payment_id) || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!isPaymentsIntegrationEnabled()) {
      return NextResponse.json(
        {
          received: false,
          disabled: true,
          error: getIntegrationDisabledMessage('payments'),
        },
        { status: 202 }
      );
    }

    // Get webhook signature from headers
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    const isValid = paymentService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const parsed = JSON.parse(body) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const eventType = asString((parsed as Record<string, unknown>).event);
    const payloadRaw = (parsed as Record<string, unknown>).payload;
    const payload: RazorpayWebhookPayload =
      payloadRaw && typeof payloadRaw === 'object' ? (payloadRaw as RazorpayWebhookPayload) : {};

    if (!eventType) {
      return NextResponse.json({ error: 'Missing event type' }, { status: 400 });
    }

    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(payload);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(payload);
        break;

      default:
        console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in POST /api/payments/webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const payment = getPaymentEntity(payload);
  if (!payment) {
    console.warn('[Webhook] payment.captured missing payment entity');
    return;
  }

  console.log('[Webhook] Payment captured:', payment.id);

  const invoiceId = payment.notes?.invoice_id;

  if (invoiceId) {
    // Record payment against invoice
    await paymentService.recordPayment({
      invoiceId,
      amount: payment.amount / 100, // Convert paise to rupees
      paymentMethod: normalizePaymentMethod(payment.method),
      razorpayPaymentId: payment.id,
      razorpayOrderId: payment.order_id,
    });
  }
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = getPaymentEntity(payload);
  if (!payment) {
    console.warn('[Webhook] payment.failed missing payment entity');
    return;
  }

  console.log('[Webhook] Payment failed:', payment.id);

  let organizationId = payment.notes?.organization_id || null;
  const subscriptionId = payment.notes?.subscription_id;
  if (!organizationId && subscriptionId) {
    const supabase = await createClient();
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('organization_id')
      .eq('id', subscriptionId)
      .maybeSingle();
    organizationId = subscription?.organization_id || null;
  }

  if (!organizationId) {
    console.warn('[Webhook] payment.failed missing organization_id');
    return;
  }

  await paymentService.handlePaymentFailed(
    organizationId,
    subscriptionId || null,
    payment.id,
    payment.error_code || 'unknown',
    payment.error_description || 'Payment failed'
  );
}

async function handleSubscriptionCharged(payload: RazorpayWebhookPayload) {
  const subscription = getSubscriptionEntity(payload);
  const payment = getPaymentEntity(payload);
  if (!subscription || !payment) {
    console.warn('[Webhook] subscription.charged missing subscription/payment entity');
    return;
  }

  console.log('[Webhook] Subscription charged:', subscription.id);

  await paymentService.handleSubscriptionCharged(
    subscription.id,
    payment.id,
    payment.amount / 100 // Convert paise to rupees
  );
}

async function handleSubscriptionCancelled(payload: RazorpayWebhookPayload) {
  const subscription = getSubscriptionEntity(payload);
  if (!subscription) {
    console.warn('[Webhook] subscription.cancelled missing subscription entity');
    return;
  }

  console.log('[Webhook] Subscription cancelled:', subscription.id);

  const supabase = await createClient();

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionPaused(payload: RazorpayWebhookPayload) {
  const subscription = getSubscriptionEntity(payload);
  if (!subscription) {
    console.warn('[Webhook] subscription.paused missing subscription entity');
    return;
  }

  console.log('[Webhook] Subscription paused:', subscription.id);

  const supabase = await createClient();

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ status: 'paused' })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleInvoicePaid(payload: RazorpayWebhookPayload) {
  const invoice = getInvoiceEntity(payload);
  if (!invoice) {
    console.warn('[Webhook] invoice.paid missing invoice entity');
    return;
  }

  console.log('[Webhook] Invoice paid:', invoice.id);

  const supabase = await createClient();

  // Update invoice status
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      razorpay_payment_id: invoice.payment_id,
    })
    .eq('razorpay_invoice_id', invoice.id);
}
