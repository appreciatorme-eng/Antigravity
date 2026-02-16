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
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
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
    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

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

async function handlePaymentCaptured(payload: any) {
  const payment = payload.payment.entity;
  console.log('[Webhook] Payment captured:', payment.id);

  // Extract organization ID from notes
  const organizationId = payment.notes?.organization_id;
  const invoiceId = payment.notes?.invoice_id;

  if (invoiceId) {
    // Record payment against invoice
    await paymentService.recordPayment({
      invoiceId,
      amount: payment.amount / 100, // Convert paise to rupees
      paymentMethod: payment.method,
      razorpayPaymentId: payment.id,
      razorpayOrderId: payment.order_id,
    });
  }
}

async function handlePaymentFailed(payload: any) {
  const payment = payload.payment.entity;
  console.log('[Webhook] Payment failed:', payment.id);

  const organizationId = payment.notes?.organization_id;
  const subscriptionId = payment.notes?.subscription_id;

  await paymentService.handlePaymentFailed(
    organizationId,
    subscriptionId,
    payment.id,
    payment.error_code || 'unknown',
    payment.error_description || 'Payment failed'
  );
}

async function handleSubscriptionCharged(payload: any) {
  const subscription = payload.subscription.entity;
  const payment = payload.payment.entity;

  console.log('[Webhook] Subscription charged:', subscription.id);

  await paymentService.handleSubscriptionCharged(
    subscription.id,
    payment.id,
    payment.amount / 100 // Convert paise to rupees
  );
}

async function handleSubscriptionCancelled(payload: any) {
  const subscription = payload.subscription.entity;
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

async function handleSubscriptionPaused(payload: any) {
  const subscription = payload.subscription.entity;
  console.log('[Webhook] Subscription paused:', subscription.id);

  const supabase = await createClient();

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ status: 'paused' })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleInvoicePaid(payload: any) {
  const invoice = payload.invoice.entity;
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
