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
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from '@/lib/integrations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get current subscription
    const subscription = await paymentService.getCurrentSubscription(
      profile.organization_id
    );

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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization with details
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, organizations(name, billing_email, billing_state)')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const org = (profile as any).organizations;

    // Parse request body
    const body = await request.json();
    const {
      plan_id,
      billing_cycle = 'monthly',
    } = body;

    // Validate plan
    const validPlans = ['pro_monthly', 'pro_annual', 'enterprise'];
    if (!validPlans.includes(plan_id)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Calculate amount based on plan
    let amount = 0;
    if (plan_id === 'pro_monthly') {
      amount = 4999; // ₹4,999/month
    } else if (plan_id === 'pro_annual') {
      amount = 49990; // ₹49,990/year (save 2 months)
    } else if (plan_id === 'enterprise') {
      amount = 15000; // ₹15,000/month (custom pricing)
    }

    // Create subscription using payment service
    const subscriptionId = await paymentService.createSubscription({
      organizationId: profile.organization_id,
      planId: plan_id,
      billingCycle: billing_cycle,
      amount,
      customerEmail: org.billing_email || user.email || '',
      customerName: org.name,
      billingState: org.billing_state,
    });

    // Fetch created subscription
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
