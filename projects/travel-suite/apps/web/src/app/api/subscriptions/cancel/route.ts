/**
 * Subscription Cancel API
 *
 * Endpoint:
 * - POST /api/subscriptions/cancel - Cancel current subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(request: NextRequest) {
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
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { cancel_at_period_end = true } = body;

    // Get current subscription
    const currentSubscription = await paymentService.getCurrentSubscription(
      profile.organization_id
    );

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel subscription
    await paymentService.cancelSubscription(
      currentSubscription.id,
      cancel_at_period_end
    );

    // Fetch updated subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', currentSubscription.id)
      .single();

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/cancel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
