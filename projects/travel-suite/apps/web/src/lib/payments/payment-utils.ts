// Pure payment utilities: severity mapping, state resolution, client factory, error wrapping.

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logError } from '@/lib/observability/logger';
import {
  toPaymentServiceError,
  type PaymentErrorCode,
  type PaymentOperation,
} from './errors';
import type { PaymentExecutionContext, PaymentSupabaseClient } from './payment-types';

export function severityForCode(code: PaymentErrorCode): 'low' | 'medium' | 'high' | 'critical' {
  if (code === 'payments_config_error') return 'critical';
  if (code === 'payments_webhook_signature_invalid') return 'high';
  if (code === 'payments_provider_error' || code === 'payments_db_error') return 'high';
  if (code === 'payments_not_found' || code === 'payments_invalid_input') return 'medium';
  return 'low';
}

export function resolveCompanyState(defaultState?: string | null): string {
  const configured =
    process.env.GST_COMPANY_STATE ||
    process.env.NEXT_PUBLIC_GST_COMPANY_STATE ||
    defaultState;
  return (configured || 'MAHARASHTRA').toUpperCase();
}

export async function getPaymentClient(context: PaymentExecutionContext): Promise<PaymentSupabaseClient> {
  return context === 'admin' ? createAdminClient() : createClient();
}

export function wrapPaymentError(
  error: unknown,
  fallback: {
    code: PaymentErrorCode;
    operation: PaymentOperation;
    context: PaymentExecutionContext;
    message: string;
    tags?: Record<string, string | number | boolean | undefined>;
  }
): never {
  const wrapped = toPaymentServiceError(error, {
    code: fallback.code,
    operation: fallback.operation,
    message: fallback.message,
    tags: {
      context: fallback.context,
      severity: severityForCode(fallback.code),
      ...(fallback.tags || {}),
    },
  });

  logError(`Payment service ${fallback.operation} failed`, wrapped, {
    payment_error_code: wrapped.code,
    payment_operation: wrapped.operation,
    payment_context: fallback.context,
    payment_alert_severity: wrapped.tags.severity || severityForCode(wrapped.code),
    ...(fallback.tags || {}),
  });

  throw wrapped;
}
