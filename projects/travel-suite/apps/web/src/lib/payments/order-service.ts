// Razorpay order creation and webhook signature verification.

import { razorpay } from './razorpay';
import type { Order } from './razorpay';
import { env } from '@/lib/config/env';
import { PaymentServiceError } from './errors';
import { wrapPaymentError } from './payment-utils';

/**
 * Create a payment order for checkout
 */
export async function createOrder(
  amount: number,
  currency: 'INR' | 'USD' = 'INR',
  organizationId?: string,
  notes?: Record<string, string>,
  receipt?: string
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
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        ...notes,
        organization_id: organizationId || '',
      },
    });

    return order;
  } catch (error) {
    wrapPaymentError(error, {
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
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const webhookSecret = env.razorpay.webhookSecret;
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
    wrapPaymentError(error, {
      code: 'payments_webhook_signature_invalid',
      operation: 'verify_webhook_signature',
      context: 'admin',
      message: 'Failed to validate webhook signature',
      tags: { retryable: false },
    });
  }
}
