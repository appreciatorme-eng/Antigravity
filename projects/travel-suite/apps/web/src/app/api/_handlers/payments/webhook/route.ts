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
import { apiError, apiSuccess } from "@/lib/api/response";
import { revalidateTag } from 'next/cache';
import { paymentService } from '@/lib/payments/payment-service';
import type { PaymentMethod } from '@/lib/payments/payment-service';
import { sendPaymentReceipt } from '@/lib/email/notifications';
import { PaymentServiceError, paymentErrorHttpStatus } from '@/lib/payments/errors';
import { DEFAULT_PAYMENT_RECEIPT_GST_LABEL } from '@/lib/payments/payment-receipt-config';
import { captureServerAnalyticsEvent } from '@/lib/analytics/server';
import { buildInvoiceDownloadUrl } from '@/lib/invoices/public-link';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestContext, getRequestId, logError, logEvent } from '@/lib/observability/logger';
import { syncWonCommercialState } from '@/lib/admin/commercial-state-sync';
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from '@/lib/integrations';
import { trackFunnelEvent } from '@/lib/funnel/track';
import { runBusinessOsEventAutomation } from '@/lib/platform/business-os';
import { triggerEventAutopilot } from '@/lib/platform/event-autopilot';
import {
  autoCloseCollectionsSequence,
  autoCloseCollectionsWorkItems,
  syncCapturedPaymentLinks,
} from '@/lib/platform/business-os-payment-closure';

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
  const requestOrigin = request.nextUrl.origin;

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
      return apiError('Missing webhook signature', 400, {
        code: 'payments_webhook_signature_invalid',
      });
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
      return apiError('Invalid signature', 401, {
        code: 'payments_webhook_signature_invalid',
      });
    }

    // Parse webhook payload
    const parsed = JSON.parse(body) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return apiError('Invalid webhook payload', 400);
    }

    const eventType = asString((parsed as Record<string, unknown>).event);
    const payloadRaw = (parsed as Record<string, unknown>).payload;
    const payload: RazorpayWebhookPayload =
      payloadRaw && typeof payloadRaw === 'object' ? (payloadRaw as RazorpayWebhookPayload) : {};

    if (!eventType) {
      return apiError('Missing event type', 400);
    }

    logEvent('info', 'Razorpay webhook received', {
      ...requestContext,
      payment_event_type: eventType,
      payment_operation: 'webhook_ingest',
    });

    // --- Event deduplication (H-03) ---
    const razorpayEventId = request.headers.get('x-razorpay-event-id');
    if (!razorpayEventId) {
      logEvent('warn', 'Razorpay webhook missing x-razorpay-event-id header', {
        ...requestContext,
        payment_event_type: eventType,
        payment_operation: 'webhook_dedup',
      });
    }

    if (razorpayEventId) {
      const supabaseDedup = createAdminClient();
      const { data: existingEvent, error: dedupQueryError } = await supabaseDedup
        .from('payment_events')
        .select('id')
        .eq('external_id', razorpayEventId)
        .eq('event_type', 'webhook_received')
        .maybeSingle();

      if (dedupQueryError) {
        logError('Webhook dedup query failed, proceeding with processing', dedupQueryError, {
          ...requestContext,
          payment_event_type: eventType,
          payment_operation: 'webhook_dedup',
          razorpay_event_id: razorpayEventId,
        });
      } else if (existingEvent) {
        logEvent('info', 'Razorpay webhook deduplicated (already processed)', {
          ...requestContext,
          payment_event_type: eventType,
          payment_operation: 'webhook_dedup',
          razorpay_event_id: razorpayEventId,
        });
        return apiSuccess({ deduplicated: true });
      }
    }

    // Handle different event types
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload, requestContext, requestOrigin);
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

    // Record event for deduplication
    if (razorpayEventId) {
      const supabaseRecord = createAdminClient();
      const { error: recordError } = await supabaseRecord
        .from('payment_events')
        .insert({
          event_type: 'webhook_received',
          external_id: razorpayEventId,
          metadata: { razorpay_event_type: eventType },
        });

      if (recordError) {
        logError('Failed to record webhook event for deduplication', recordError, {
          ...requestContext,
          payment_event_type: eventType,
          payment_operation: 'webhook_dedup',
          razorpay_event_id: razorpayEventId,
        });
      }
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
        { error: "Webhook processing failed" },
        { status: paymentErrorHttpStatus(error) }
      );
    }

    logError('Payments webhook failed unexpectedly', error, {
      ...requestContext,
      payment_operation: 'webhook_ingest',
      payment_alert_severity: 'critical',
    });

    return apiError('Webhook processing failed', 500);
  }
}

async function handlePaymentCaptured(
  payload: RazorpayWebhookPayload,
  requestContext: WebhookLogContext,
  requestOrigin: string,
) {
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

  const supabase = createAdminClient();
  const invoiceId = payment.notes?.invoice_id;
  let paidInvoiceOrgId: string | null = null;
  let orgIdForFunnel = payment.notes?.organization_id || null;

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

    const { data: paidInvoice } = await supabase
      .from('invoices')
      .select('trip_id, status, organization_id')
      .eq('id', invoiceId)
      .maybeSingle();

    if (paidInvoice?.organization_id) {
      paidInvoiceOrgId = paidInvoice.organization_id;
      if (!orgIdForFunnel) {
        orgIdForFunnel = paidInvoice.organization_id;
      }
    }

    if (paidInvoice?.status === 'paid' && paidInvoice.trip_id && paidInvoice.organization_id) {
      void syncWonCommercialState({
        adminClient: supabase,
        organizationId: paidInvoice.organization_id,
        tripId: paidInvoice.trip_id,
        confirmDraftTrip: true,
      });
    }

    const { data: invoiceRow } = await supabase
      .from('invoices')
      .select('invoice_number, client_id, organization_id')
      .eq('id', invoiceId)
      .maybeSingle();

    if (invoiceRow?.client_id) {
      const [{ data: clientProfile }, { data: organization }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', invoiceRow.client_id)
          .maybeSingle(),
        supabase
          .from('organizations')
          .select('name')
          .eq('id', invoiceRow.organization_id)
          .maybeSingle(),
      ]);

      if (clientProfile?.email) {
        const paidAtLabel = new Intl.DateTimeFormat('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date());

        void sendPaymentReceipt({
          to: clientProfile.email,
          recipientName: clientProfile.full_name || 'Traveler',
          amountLabel: `₹${(payment.amount / 100).toLocaleString('en-IN')}`,
          paymentId: payment.id,
          bookingReference: invoiceRow.invoice_number || invoiceId,
          paidAt: paidAtLabel,
          operatorName: organization?.name || 'TripBuilt',
          gstLabel: DEFAULT_PAYMENT_RECEIPT_GST_LABEL,
          invoiceUrl: buildInvoiceDownloadUrl(requestOrigin, invoiceId, payment.id),
        });
      }
    }
  }

  const syncedPaymentLinkOrgId = await syncCapturedPaymentLinks(supabase, payment, {
    info: (message, extra) => logWebhookHandlerEvent("info", message, requestContext, extra),
    error: (message, error, extra) => logError(message, error, { ...requestContext, ...extra }),
  });
  if (!orgIdForFunnel && syncedPaymentLinkOrgId) {
    orgIdForFunnel = syncedPaymentLinkOrgId;
  }

  const orgIdsToClose = Array.from(new Set([paidInvoiceOrgId, syncedPaymentLinkOrgId].filter(Boolean) as string[]));
  for (const orgId of orgIdsToClose) {
    await autoCloseCollectionsSequence(supabase, orgId, payment.id, {
      info: (message, extra) => logWebhookHandlerEvent("info", message, requestContext, extra),
      error: (message, error, extra) => logError(message, error, { ...requestContext, ...extra }),
    });
    await autoCloseCollectionsWorkItems(supabase, orgId, payment.id, {
      info: (message, extra) => logWebhookHandlerEvent("info", message, requestContext, extra),
      error: (message, error, extra) => logError(message, error, { ...requestContext, ...extra }),
    });
    try {
      await runBusinessOsEventAutomation(supabase as never, {
        orgId,
        currentUserId: null,
        trigger: "collections_updated",
      });
    } catch (err) {
      logError("Failed to run Business OS event automation after payment capture", err, {
        ...requestContext,
        payment_event_type: "payment.captured",
        organization_id: orgId,
      });
    }
  }

  if (orgIdForFunnel) {
    trackFunnelEvent({
      supabase,
      organizationId: orgIdForFunnel,
      eventType: 'payment_completed',
      metadata: {
        razorpay_payment_id: payment.id,
        amount_inr: payment.amount / 100,
        ...(invoiceId ? { invoice_id: invoiceId } : {}),
      },
    });
  }

  void captureServerAnalyticsEvent({
    event: 'payment_completed',
    distinctId: orgIdForFunnel || payment.id,
    properties: {
      organization_id: orgIdForFunnel,
      payment_id: payment.id,
      order_id: payment.order_id,
      amount_inr: payment.amount / 100,
      method: payment.method,
    },
  });

  revalidateTag('revenue', 'max');
  revalidateTag('nav-counts', 'max');
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

  // Immediately trigger collections loop — don't wait for the daily cron
  triggerEventAutopilot(organizationId, 'payment_failed');

  revalidateTag('nav-counts', 'max');
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

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    logError('Failed to update subscription to cancelled', error, requestContext);
    logWebhookHandlerEvent('warn', 'Failed to update subscription to cancelled', requestContext, {
      payment_event_type: 'subscription.cancelled',
      payment_subscription_id: subscription.id,
      db_error: "database_write_failed",
    });
  }
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

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'paused' })
    .eq('razorpay_subscription_id', subscription.id);

  if (error) {
    logError('Failed to update subscription to paused', error, requestContext);
    logWebhookHandlerEvent('warn', 'Failed to update subscription to paused', requestContext, {
      payment_event_type: 'subscription.paused',
      payment_subscription_id: subscription.id,
      db_error: "database_write_failed",
    });
  }
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

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      razorpay_payment_id: invoice.payment_id,
    })
    .eq('razorpay_invoice_id', invoice.id);

  const { data: syncedInvoice } = await supabase
    .from('invoices')
    .select('trip_id, organization_id')
    .eq('razorpay_invoice_id', invoice.id)
    .maybeSingle();

  if (error) {
    logError('Failed to update invoice to paid', error, requestContext);
    logWebhookHandlerEvent('warn', 'Failed to update invoice to paid', requestContext, {
      payment_event_type: 'invoice.paid',
      payment_invoice_id: invoice.id,
      db_error: "database_write_failed",
    });
    return;
  }

  if (syncedInvoice?.trip_id && syncedInvoice.organization_id) {
    void syncWonCommercialState({
      adminClient: supabase,
      organizationId: syncedInvoice.organization_id,
      tripId: syncedInvoice.trip_id,
      confirmDraftTrip: true,
    });
  }
}
