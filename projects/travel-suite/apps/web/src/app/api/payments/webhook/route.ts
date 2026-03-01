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
import { PaymentServiceError, paymentErrorHttpStatus } from '@/lib/payments/errors';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestContext, getRequestId, logError, logEvent } from '@/lib/observability/logger';
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

type WebhookLogContext = ReturnType<typeof getRequestContext>;

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

function logWebhookHandlerEvent(
  level: 'info' | 'warn',
  message: string,
  context: WebhookLogContext,
  extra: Record<string, unknown> = {}
) {
  logEvent(level, message, {
    ...context,
    payment_operation: 'webhook_handler',
    ...extra,
  });
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const requestContext = getRequestContext(request, requestId);

  try {
    if (!isPaymentsIntegrationEnabled()) {
      logEvent('info', 'Payments webhook skipped because integration is disabled', {
        ...requestContext,
        payment_operation: 'webhook_ingest',
      });
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
      logEvent('warn', 'Payments webhook missing signature', {
        ...requestContext,
        payment_operation: 'verify_webhook_signature',
        payment_alert_severity: 'high',
      });
      return NextResponse.json(
        { error: 'Missing webhook signature', code: 'payments_webhook_signature_invalid' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    const isValid = paymentService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      logEvent('warn', 'Payments webhook signature validation failed', {
        ...requestContext,
        payment_operation: 'verify_webhook_signature',
        payment_alert_severity: 'high',
      });
      return NextResponse.json(
        { error: 'Invalid signature', code: 'payments_webhook_signature_invalid' },
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

    logEvent('info', 'Razorpay webhook received', {
      ...requestContext,
      payment_event_type: eventType,
      payment_operation: 'webhook_ingest',
    });

    // Handle different event types
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload, requestContext);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload, requestContext);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(payload, requestContext);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload, requestContext);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(payload, requestContext);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(payload, requestContext);
        break;

      default:
        logEvent('info', 'Razorpay webhook event ignored', {
          ...requestContext,
          payment_event_type: eventType,
          payment_operation: 'webhook_ignore',
        });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      logError('Payments webhook failed with payment service error', error, {
        ...requestContext,
        payment_error_code: error.code,
        payment_operation: error.operation,
        payment_alert_severity: error.tags.severity || 'high',
      });

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: paymentErrorHttpStatus(error) }
      );
    }

    logError('Payments webhook failed unexpectedly', error, {
      ...requestContext,
      payment_operation: 'webhook_ingest',
      payment_alert_severity: 'critical',
    });

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payload: RazorpayWebhookPayload, requestContext: WebhookLogContext) {
  const payment = getPaymentEntity(payload);
  if (!payment) {
    logWebhookHandlerEvent('warn', 'payment.captured missing payment entity', requestContext, {
      payment_event_type: 'payment.captured',
    });
    return;
  }

  logWebhookHandlerEvent('info', 'Payment captured', requestContext, {
    payment_event_type: 'payment.captured',
    payment_id: payment.id,
  });

  const invoiceId = payment.notes?.invoice_id;

  if (invoiceId) {
    // Record payment against invoice
    await paymentService.recordPayment(
      {
        invoiceId,
        amount: payment.amount / 100, // Convert paise to rupees
        paymentMethod: normalizePaymentMethod(payment.method),
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id,
      },
      { context: 'admin' }
    );
  }
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload, requestContext: WebhookLogContext) {
  const payment = getPaymentEntity(payload);
  if (!payment) {
    logWebhookHandlerEvent('warn', 'payment.failed missing payment entity', requestContext, {
      payment_event_type: 'payment.failed',
    });
    return;
  }

  logWebhookHandlerEvent('info', 'Payment failed', requestContext, {
    payment_event_type: 'payment.failed',
    payment_id: payment.id,
  });

  let organizationId = payment.notes?.organization_id || null;
  const subscriptionId = payment.notes?.subscription_id;
  if (!organizationId && subscriptionId) {
    const supabase = createAdminClient();
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('organization_id')
      .eq('id', subscriptionId)
      .maybeSingle();
    organizationId = subscription?.organization_id || null;
  }

  if (!organizationId) {
    logWebhookHandlerEvent('warn', 'payment.failed missing organization_id', requestContext, {
      payment_event_type: 'payment.failed',
      payment_id: payment.id,
    });
    return;
  }

  await paymentService.handlePaymentFailed(
    organizationId,
    subscriptionId || null,
    payment.id,
    payment.error_code || 'unknown',
    payment.error_description || 'Payment failed',
    { context: 'admin' }
  );
}

async function handleSubscriptionCharged(payload: RazorpayWebhookPayload, requestContext: WebhookLogContext) {
  const subscription = getSubscriptionEntity(payload);
  const payment = getPaymentEntity(payload);
  if (!subscription || !payment) {
    logWebhookHandlerEvent('warn', 'subscription.charged missing subscription/payment entity', requestContext, {
      payment_event_type: 'subscription.charged',
    });
    return;
  }

  logWebhookHandlerEvent('info', 'Subscription charged', requestContext, {
    payment_event_type: 'subscription.charged',
    payment_subscription_id: subscription.id,
    payment_id: payment.id,
  });

  await paymentService.handleSubscriptionCharged(
    subscription.id,
    payment.id,
    payment.amount / 100, // Convert paise to rupees
    { context: 'admin' }
  );
}

async function handleSubscriptionCancelled(payload: RazorpayWebhookPayload, requestContext: WebhookLogContext) {
  const subscription = getSubscriptionEntity(payload);
  if (!subscription) {
    logWebhookHandlerEvent('warn', 'subscription.cancelled missing subscription entity', requestContext, {
      payment_event_type: 'subscription.cancelled',
    });
    return;
  }

  logWebhookHandlerEvent('info', 'Subscription cancelled', requestContext, {
    payment_event_type: 'subscription.cancelled',
    payment_subscription_id: subscription.id,
  });

  const supabase = createAdminClient();

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionPaused(payload: RazorpayWebhookPayload, requestContext: WebhookLogContext) {
  const subscription = getSubscriptionEntity(payload);
  if (!subscription) {
    logWebhookHandlerEvent('warn', 'subscription.paused missing subscription entity', requestContext, {
      payment_event_type: 'subscription.paused',
    });
    return;
  }

  logWebhookHandlerEvent('info', 'Subscription paused', requestContext, {
    payment_event_type: 'subscription.paused',
    payment_subscription_id: subscription.id,
  });

  const supabase = createAdminClient();

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ status: 'paused' })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleInvoicePaid(payload: RazorpayWebhookPayload, requestContext: WebhookLogContext) {
  const invoice = getInvoiceEntity(payload);
  if (!invoice) {
    logWebhookHandlerEvent('warn', 'invoice.paid missing invoice entity', requestContext, {
      payment_event_type: 'invoice.paid',
    });
    return;
  }

  logWebhookHandlerEvent('info', 'Invoice paid', requestContext, {
    payment_event_type: 'invoice.paid',
    payment_invoice_id: invoice.id,
  });

  const supabase = createAdminClient();

  // Update invoice status
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      razorpay_payment_id: invoice.payment_id,
    })
    .eq('razorpay_invoice_id', invoice.id);
}
