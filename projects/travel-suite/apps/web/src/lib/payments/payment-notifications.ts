// Subscription-paused notification fan-out to organization admins.

import { logError } from '@/lib/observability/logger';
import type { PaymentExecutionContext, PaymentSupabaseClient } from './payment-types';

interface NotifySubscriptionPausedOptions {
  organizationId: string;
  subscriptionId: string;
  paymentId: string;
  failureCount: number;
  errorCode: string;
  errorDescription: string;
}

export async function notifyOrganizationSubscriptionPaused(
  supabase: PaymentSupabaseClient,
  options: NotifySubscriptionPausedOptions,
  context: PaymentExecutionContext = 'admin'
): Promise<void> {
  try {
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
        logError('Failed to enqueue subscription pause notifications', queueError, {
          payment_operation: 'notify_subscription_paused',
          payment_context: context,
          organization_id: options.organizationId,
          subscription_id: options.subscriptionId,
        });
      }
    }
  } catch (error) {
    logError('Failed to notify organization about paused subscription', error, {
      payment_operation: 'notify_subscription_paused',
      payment_context: context,
      organization_id: options.organizationId,
      subscription_id: options.subscriptionId,
    });
  }
}
