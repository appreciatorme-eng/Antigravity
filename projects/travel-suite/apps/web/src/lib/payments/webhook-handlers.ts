// Razorpay webhook event handlers: subscription charged and payment failed.

import { PaymentServiceError } from './errors';
import { getPaymentClient, wrapPaymentError } from './payment-utils';
import { logPaymentEvent } from './payment-logger';
import { notifyOrganizationSubscriptionPaused } from './payment-notifications';
import { createInvoice } from './invoice-service';
import type { PaymentExecutionContext, PaymentExecutionOptions } from './payment-types';

/**
 * Handle subscription charged event from webhook
 */
export async function handleSubscriptionCharged(
  razorpaySubscriptionId: string,
  paymentId: string,
  amount: number,
  execution: PaymentExecutionOptions = {}
): Promise<void> {
  const context: PaymentExecutionContext = execution.context || 'admin';

  try {
    const supabase = await getPaymentClient(context);

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

    await createInvoice(
      {
        organizationId: subscription.organization_id,
        amount: subscription.amount,
        description: `Subscription payment - ${subscription.plan_id}`,
      },
      { context }
    );

    await logPaymentEvent(
      supabase,
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
    wrapPaymentError(error, {
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
export async function handlePaymentFailed(
  organizationId: string,
  subscriptionId: string | null,
  paymentId: string,
  errorCode: string,
  errorDescription: string,
  execution: PaymentExecutionOptions = {}
): Promise<void> {
  const context: PaymentExecutionContext = execution.context || 'admin';

  try {
    const supabase = await getPaymentClient(context);

    if (subscriptionId) {
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

          await notifyOrganizationSubscriptionPaused(
            supabase,
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

    await logPaymentEvent(
      supabase,
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
    wrapPaymentError(error, {
      code: 'payments_db_error',
      operation: 'handle_payment_failed',
      context,
      message: 'Failed to handle payment failure',
      tags: { organization_id: organizationId, subscription_id: subscriptionId || '', payment_id: paymentId },
    });
  }
}
