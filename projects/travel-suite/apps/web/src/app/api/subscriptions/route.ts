/**
 * Subscription API Routes
 *
 * Endpoints:
 * - GET /api/subscriptions - Get current subscription
 * - POST /api/subscriptions - Create new subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { paymentService } from '@/lib/payments/payment-service';
import { z } from 'zod';
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from '@/lib/integrations';
import { sanitizeEmail, sanitizeText } from '@/lib/security/sanitize';

const PlanRequestSchema = z.object({
  plan_id: z.enum(['pro_monthly', 'pro_annual', 'enterprise']),
  billing_cycle: z.enum(['monthly', 'annual']).default('monthly'),
});

const DEFAULT_PLAN_AMOUNTS: Record<'pro_monthly' | 'pro_annual' | 'enterprise', number> = {
  pro_monthly: 4999,
  pro_annual: 49990,
  enterprise: 15000,
};

function getEnvPlanAmount(planId: 'pro_monthly' | 'pro_annual' | 'enterprise') {
  const envKey = `SUBSCRIPTION_PRICE_${planId.toUpperCase()}`;
  const raw = process.env[envKey];
  if (!raw) return null;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

async function resolvePlanAmount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: 'pro_monthly' | 'pro_annual' | 'enterprise',
  billingCycle: 'monthly' | 'annual'
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dbPlan, error } = await (supabase as any)
    // subscription_plans may not yet be present in generated DB types.
    .from('subscription_plans')
    .select('amount')
    .eq('plan_id', planId)
    .eq('billing_cycle', billingCycle)
    .eq('is_active', true)
    .maybeSingle();

  if (!error && dbPlan?.amount !== null && dbPlan?.amount !== undefined) {
    const amount = Number(dbPlan.amount);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }

  const envAmount = getEnvPlanAmount(planId);
  if (envAmount) return envAmount;

  return DEFAULT_PLAN_AMOUNTS[planId];
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const subscription = await paymentService.getCurrentSubscription(profile.organization_id);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error in GET /api/subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isPaymentsIntegrationEnabled()) {
      return NextResponse.json(
        {
          success: false,
          disabled: true,
          error: getIntegrationDisabledMessage('payments'),
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, organizations(name, billing_email, billing_state)')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const org = (profile as { organizations?: { name?: string | null; billing_email?: string | null; billing_state?: string | null } | null }).organizations;

    const body = await request.json();
    const parsed = PlanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid plan request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { plan_id, billing_cycle } = parsed.data;
    const amount = await resolvePlanAmount(supabase, plan_id, billing_cycle);
    const safeBillingState = sanitizeText(org?.billing_state, { maxLength: 64 }) || undefined;
    const safeCustomerEmail = sanitizeEmail(org?.billing_email) || sanitizeEmail(user.email) || '';
    const safeCustomerName = sanitizeText(org?.name, { maxLength: 120 }) || 'Travel Suite';

    const subscriptionId = await paymentService.createSubscription({
      organizationId: profile.organization_id,
      planId: plan_id,
      billingCycle: billing_cycle,
      amount,
      customerEmail: safeCustomerEmail,
      customerName: safeCustomerName,
      billingState: safeBillingState,
    });

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/subscriptions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
