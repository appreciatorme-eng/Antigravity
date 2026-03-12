/**
 * Subscription Cancel API
 *
 * Endpoint:
 * - POST /api/subscriptions/cancel - Cancel current subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from "@/lib/api-response";
import { createClient } from '@/lib/supabase/server';
import { paymentService } from '@/lib/payments/payment-service';
import { PaymentServiceError, paymentErrorHttpStatus } from '@/lib/payments/errors';
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from '@/lib/integrations';

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
      return apiError('Unauthorized', 401);
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError('Organization not found', 404);
    }

    // Parse request body
    const body = await request.json();
    const { cancel_at_period_end = true } = body;

    // Get current subscription
    const currentSubscription = await paymentService.getCurrentSubscription(
      profile.organization_id
    );

    if (!currentSubscription) {
      return apiError('No active subscription found', 404);
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
    if (error instanceof PaymentServiceError) {
      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: paymentErrorHttpStatus(error) }
      );
    }
    return apiError("Failed to cancel subscription", 500);
  }
}
