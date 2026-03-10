// Subscription creation, cancellation, and tier limit enforcement.

import { razorpay } from './razorpay';
import { PaymentServiceError } from './errors';
import { getPaymentClient, resolveCompanyState, wrapPaymentError } from './payment-utils';
import { logPaymentEvent } from './payment-logger';
import { ensureCustomer } from './customer-service';
import { calculateGST } from '../tax/gst-calculator';
import type {
  CreateSubscriptionOptions,
  PaymentExecutionContext,
  PaymentExecutionOptions,
} from './payment-types';
import { OPEN_SUBSCRIPTION_STATUSES } from './payment-types';

/**
 * Create a subscription for an organization
 */
export async function createSubscription(
  options: CreateSubscriptionOptions,
  execution: PaymentExecutionOptions = {}
): Promise<string> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('billing_state')
      .eq('id', options.organizationId)
      .maybeSingle();

    if (orgError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_subscription',
        message: orgError.message,
        tags: { context, organization_id: options.organizationId, severity: 'high' },
        cause: orgError,
      });
    }

    await ensureCustomer(options.organizationId, { context });

    const companyState = resolveCompanyState(org?.billing_state);
    const gst = calculateGST(
      options.amount,
      companyState,
      options.billingState || companyState
    );

    const totalAmount = options.amount + gst.totalGst;

    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: `plan_${options.planId}`,
      customer_notify: 1,
      total_count: options.billingCycle === 'monthly' ? 12 : 1,
      quantity: 1,
      notes: {
        organization_id: options.organizationId,
        plan: options.planId,
      },
    });

    const now = new Date();
    const periodLength = options.billingCycle === 'monthly' ? 30 : 365;
    const currentPeriodStart = now;
    const currentPeriodEnd = new Date(now.getTime() + periodLength * 24 * 60 * 60 * 1000);

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        organization_id: options.organizationId,
        plan_id: options.planId,
        razorpay_subscription_id: razorpaySubscription.id,
        razorpay_plan_id: `plan_${options.planId}`,
        status: 'incomplete',
        billing_cycle: options.billingCycle,
        amount: options.amount,
        gst_amount: gst.totalGst,
        total_amount: totalAmount,
        currency: 'INR',
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        next_billing_date: currentPeriodEnd.toISOString(),
        trial_start: null,
        trial_end: null,
      })
      .select()
      .single();

    if (error) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'create_subscription',
        message: error.message,
        tags: { context, organization_id: options.organizationId, severity: 'high' },
        cause: error,
      });
    }

    await logPaymentEvent(
      supabase,
      {
        organizationId: options.organizationId,
        subscriptionId: subscription.id,
        eventType: 'subscription.created',
        externalId: razorpaySubscription.id,
        amount: totalAmount,
        status: 'incomplete',
        metadata: { razorpaySubscription },
      },
      context
    );

    return subscription.id;
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_provider_error',
      operation: 'create_subscription',
      context,
      message: 'Failed to create subscription',
      tags: { organization_id: options.organizationId, plan_id: options.planId },
    });
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true,
  execution: PaymentExecutionOptions = {}
): Promise<void> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subscriptionError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'cancel_subscription',
        message: subscriptionError.message,
        tags: { context, subscription_id: subscriptionId, severity: 'high' },
        cause: subscriptionError,
      });
    }

    if (!subscription) {
      throw new PaymentServiceError({
        code: 'payments_not_found',
        operation: 'cancel_subscription',
        message: 'Subscription not found',
        tags: { context, subscription_id: subscriptionId, severity: 'medium' },
      });
    }

    if (subscription.razorpay_subscription_id) {
      await razorpay.subscriptions.cancel(
        subscription.razorpay_subscription_id,
        cancelAtPeriodEnd
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    };

    if (!cancelAtPeriodEnd) {
      updates.status = 'cancelled';
      updates.cancelled_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId);

    if (updateError) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'cancel_subscription',
        message: updateError.message,
        tags: { context, subscription_id: subscriptionId, severity: 'high' },
        cause: updateError,
      });
    }

    await logPaymentEvent(
      supabase,
      {
        organizationId: subscription.organization_id,
        subscriptionId: subscription.id,
        eventType: 'subscription.cancelled',
        externalId: subscription.razorpay_subscription_id || undefined,
        status: cancelAtPeriodEnd ? 'active' : 'cancelled',
        metadata: { cancelAtPeriodEnd },
      },
      context
    );
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_provider_error',
      operation: 'cancel_subscription',
      context,
      message: 'Failed to cancel subscription',
      tags: { subscription_id: subscriptionId },
    });
  }
}

/**
 * Get organization's current subscription
 */
export async function getCurrentSubscription(
  organizationId: string,
  execution: PaymentExecutionOptions = {}
): Promise<any | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', OPEN_SUBSCRIPTION_STATUSES as unknown as string[])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'get_current_subscription',
        message: error.message,
        tags: { context, organization_id: organizationId, severity: 'high' },
        cause: error,
      });
    }

    const rows = Array.isArray(subscription) ? subscription : [];
    const prioritized = rows.find((row) => row.status === 'active') || rows[0] || null;
    return prioritized;
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_db_error',
      operation: 'get_current_subscription',
      context,
      message: 'Failed to fetch current subscription',
      tags: { organization_id: organizationId },
    });
  }
}

/**
 * Check if organization can access a feature based on subscription tier
 */
export async function checkTierLimit(
  organizationId: string,
  feature: 'clients' | 'trips' | 'proposals' | 'users',
  limit: number,
  execution: PaymentExecutionOptions = {}
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const context: PaymentExecutionContext = execution.context || 'user_session';

  try {
    const supabase = await getPaymentClient(context);

    const { data, error } = await supabase.rpc('check_tier_limit', {
      p_organization_id: organizationId,
      p_feature: feature,
      p_limit: limit,
    });

    if (error) {
      throw new PaymentServiceError({
        code: 'payments_db_error',
        operation: 'check_tier_limit',
        message: error.message,
        tags: { context, organization_id: organizationId, feature, severity: 'high' },
        cause: error,
      });
    }

    let current = 0;
    switch (feature) {
      case 'clients': {
        const { count: clientCount } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId);
        current = clientCount || 0;
        break;
      }

      case 'trips': {
        const { count: tripCount } = await supabase
          .from('trips')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        current = tripCount || 0;
        break;
      }

      case 'proposals': {
        const { count: proposalCount } = await supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        current = proposalCount || 0;
        break;
      }

      case 'users': {
        const { count: userCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId);
        current = userCount || 0;
        break;
      }
    }

    return {
      allowed: data as boolean,
      current,
      limit,
    };
  } catch (error) {
    wrapPaymentError(error, {
      code: 'payments_db_error',
      operation: 'check_tier_limit',
      context,
      message: 'Failed to check tier limit',
      tags: { organization_id: organizationId, feature },
    });
  }
}
