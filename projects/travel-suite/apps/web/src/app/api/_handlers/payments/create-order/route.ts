/**
 * Create Payment Order API
 *
 * Endpoint:
 * - POST /api/payments/create-order - Create Razorpay order for checkout
 */

import { NextRequest } from 'next/server';
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

const createOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(["INR", "USD"]).default("INR"),
  invoice_id: z.string().trim().optional().nullable(),
  subscription_id: z.string().trim().optional().nullable(),
  allow_partial: z.boolean().default(false),
  notes: z.record(z.string()).optional().default({}),
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

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError('Unauthorized', 401);
    }

    const rateLimit = await enforceRateLimit({
      identifier: user.id,
      limit: CREATE_ORDER_RATE_LIMIT_MAX,
      windowMs: CREATE_ORDER_RATE_LIMIT_WINDOW_MS,
      prefix: 'api:payments:create-order',
    });
    if (!rateLimit.success) {
      return apiError('Too many payment order requests. Please retry later.', 429);
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError('Organization not found', 404);
    }

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
        .eq('organization_id', profile.organization_id)
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
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (subscriptionError || !subscription) {
        return apiError('Subscription not found', 404);
      }
    }

    // Create Razorpay order
    const order = await paymentService.createOrder(
      amount,
      currency,
      profile.organization_id,
      {
        ...orderNotes,
        ...(invoice_id ? { invoice_id } : {}),
        ...(subscription_id ? { subscription_id } : {}),
      }
    );

    return apiSuccess({ order });
  } catch (error) {
    console.error('Error in POST /api/payments/create-order:', error);

    if (error instanceof PaymentServiceError) {
      return apiError("Failed to create payment order", paymentErrorHttpStatus(error));
    }

    return apiError("Failed to create payment order", 500);
  }
}
