// Razorpay customer creation and retrieval for organizations.

import { razorpay } from './razorpay';
import { PaymentServiceError } from './errors';
import { getPaymentClient, wrapPaymentError } from './payment-utils';
import type { PaymentExecutionContext, PaymentExecutionOptions } from './payment-types';

/**
 * Create or get Razorpay customer for organization
 */
export async function ensureCustomer(
  organizationId: string,
  execution: PaymentExecutionOptions = {}
): Promise<string> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('razorpay_customer_id, name, gstin, owner_id')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'ensure_customer',
        message: orgError.message,
        tags: { context, organization_id: organizationId, severity: 'high' },
        cause: orgError,
      });
    }

    if (!org) {
      throw new PaymentServiceError({
        code: 'payments_not_found',
        operation: 'ensure_customer',
        message: 'Organization not found',
        tags: { context, organization_id: organizationId, severity: 'medium' },
      });
    }

    if (org.razorpay_customer_id) {
      return org.razorpay_customer_id;
    }

    let ownerEmail: string | undefined;
    if (org.owner_id) {
      const { data: ownerProfile, error: ownerProfileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', org.owner_id)
        .maybeSingle();

      if (ownerProfileError) {
        throw new PaymentServiceError({
          code: 'payments_db_error',
          operation: 'ensure_customer',
          message: ownerProfileError.message,
          tags: { context, organization_id: organizationId, severity: 'high' },
          cause: ownerProfileError,
        });
      }

      ownerEmail = ownerProfile?.email || undefined;
    }

    const customerEmail = ownerEmail ?? `no-reply+${organizationId}@example.com`;

    const customer = await razorpay.customers.create({
      name: org.name,
      email: customerEmail,
      gstin: org.gstin || undefined,
      notes: {
        organization_id: organizationId,
      },
    });

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ razorpay_customer_id: customer.id })
      .eq('id', organizationId);

    if (updateError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'ensure_customer',
        message: updateError.message,
        tags: { context, organization_id: organizationId, severity: 'high' },
        cause: updateError,
      });
    }

    return customer.id;
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_provider_error',
      operation: 'ensure_customer',
      context,
      message: 'Failed to ensure Razorpay customer',
      tags: { organization_id: organizationId },
    });
  }
}
