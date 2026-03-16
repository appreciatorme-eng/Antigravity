/**
 * Create Payment Order API
 *
 * Endpoint:
 * - POST /api/payments/create-order - Create Razorpay order for checkout
 */

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { paymentService } from '@/lib/payments/payment-service';
import { PaymentServiceError, paymentErrorHttpStatus } from '@/lib/payments/errors';
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from '@/lib/integrations';
import { apiError, apiSuccess } from '@/lib/api/response';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { z } from 'zod';
import { logError } from "@/lib/observability/logger";

const createOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(["INR", "USD"]).default("INR"),
  invoice_id: z.string().trim().optional().nullable(),
  subscription_id: z.string().trim().optional().nullable(),
  allow_partial: z.boolean().default(false),
  notes: z.record(z.string(), z.string()).optional().default({}),
});

const CREATE_ORDER_RATE_LIMIT_MAX = 10;
const CREATE_ORDER_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    if (!isPaymentsIntegrationEnabled()) {
      return apiError(
        getIntegrationDisabledMessage('payments'),
        503,
        { disabled: true }
      );
    }

    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { userId, organizationId } = auth;

    const rateLimit = await enforceRateLimit({
      identifier: userId,
      limit: CREATE_ORDER_RATE_LIMIT_MAX,
      windowMs: CREATE_ORDER_RATE_LIMIT_WINDOW_MS,
      prefix: 'api:payments:create-order',
    });
    if (!rateLimit.success) {
      return apiError('Too many payment order requests. Please retry later.', 429);
    }

    const supabase = await createClient();

    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return apiError('Invalid request body', 400);
    }

    const parsed = createOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Validation failed', 400);
    }

    const { amount, currency, invoice_id, subscription_id, allow_partial: allowPartial, notes } = parsed.data;
    const orderNotes = notes;

    if (invoice_id && subscription_id) {
      return apiError('Provide either invoice_id or subscription_id, not both', 400);
    }

    if (invoice_id) {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, organization_id, total_amount, status')
        .eq('id', invoice_id)
        .eq('organization_id', organizationId!)
        .maybeSingle();

      if (invoiceError || !invoice) {
        return apiError('Invoice not found', 404);
      }

      const invoiceTotal = Number(invoice.total_amount || 0);
      if (!allowPartial && invoiceTotal > 0 && amount < invoiceTotal) {
        return apiError('Amount is below invoice total', 400, {
          min_amount: invoiceTotal,
        });
      }
    }

    if (subscription_id) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('id, organization_id')
        .eq('id', subscription_id)
        .eq('organization_id', organizationId!)
        .maybeSingle();

      if (subscriptionError || !subscription) {
        return apiError('Subscription not found', 404);
      }
    }

    // Idempotency: if an invoice_id is provided, check for an existing non-failed order
    if (invoice_id) {
      const { data: existingEvent, error: existingEventError } = await supabase
        .from('payment_events')
        .select('external_id, status')
        .eq('invoice_id', invoice_id)
        .eq('event_type', 'order_created')
        .not('status', 'eq', 'failed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingEventError) {
        logError('Error checking existing order for invoice', existingEventError, {
          invoice_id,
        });
      }

      if (existingEvent?.external_id) {
        return apiSuccess({ order: { id: existingEvent.external_id }, deduplicated: true });
      }
    }

    // Create Razorpay order with receipt set to invoice_id for Razorpay-level deduplication
    const receiptId = invoice_id || undefined;
    const order = await paymentService.createOrder(
      amount,
      currency,
      organizationId!,
      {
        ...orderNotes,
        ...(invoice_id ? { invoice_id } : {}),
        ...(subscription_id ? { subscription_id } : {}),
      },
      receiptId
    );

    // Log order creation event for future idempotency checks
    if (invoice_id) {
      const { error: logEventError } = await supabase.from('payment_events').insert({
        organization_id: organizationId!,
        invoice_id,
        event_type: 'order_created',
        external_id: order.id,
        amount,
        currency,
        status: 'created',
        metadata: {
          razorpay_order_id: order.id,
          receipt: order.receipt,
        },
      });

      if (logEventError) {
        logError('Failed to log order creation event', logEventError, {
          invoice_id,
          razorpay_order_id: order.id,
        });
      }
    }

    return apiSuccess({ order });
  } catch (error) {
    logError('Error in POST /api/payments/create-order', error);

    if (error instanceof PaymentServiceError) {
      return apiError("Failed to create payment order", paymentErrorHttpStatus(error));
    }

    return apiError("Failed to create payment order", 500);
  }
}
