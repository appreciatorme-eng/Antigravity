// Payment audit trail: idempotent event logging to payment_events table.

import {
  PaymentServiceError,
} from './errors';
import type { PaymentExecutionContext, PaymentSupabaseClient } from './payment-types';

interface LogPaymentEventOptions {
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
  metadata: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function logPaymentEvent(
  supabase: PaymentSupabaseClient,
  options: LogPaymentEventOptions,
  context: PaymentExecutionContext = 'user_session'
): Promise<void> {
  if (options.externalId) {
    const { data: existingEvent, error: existingEventError } = await supabase
      .from('payment_events')
      .select('id')
      .eq('event_type', options.eventType)
      .eq('external_id', options.externalId)
      .maybeSingle();

    if (existingEventError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'log_payment_event',
        message: existingEventError.message,
        tags: { context, organization_id: options.organizationId, severity: 'high' },
        cause: existingEventError,
      });
    }

    if (existingEvent?.id) {
      return;
    }
  }

  const { error: insertError } = await supabase.from('payment_events').insert({
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

  if (insertError) {
    throw new PaymentServiceError({
      code: 'payments_db_error',
      operation: 'log_payment_event',
      message: insertError.message,
      tags: { context, organization_id: options.organizationId, severity: 'high' },
      cause: insertError,
    });
  }
}
