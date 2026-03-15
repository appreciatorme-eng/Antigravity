/**
 * Subscription Cancel API
 *
 * Endpoint:
 * - POST /api/subscriptions/cancel - Cancel current subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { paymentService } from '@/lib/payments/payment-service';
import { PaymentServiceError, paymentErrorHttpStatus } from '@/lib/payments/errors';
import { SUBSCRIPTION_SELECT } from '@/lib/payments/subscription-service';
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from '@/lib/integrations';
import type { Database } from '@/lib/database.types';

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

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

    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { organizationId } = auth;
    const supabase = await createClient();

    const body = await request.json();
    const { cancel_at_period_end = true } = body;

    const currentSubscription = await paymentService.getCurrentSubscription(
      organizationId!
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
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select(SUBSCRIPTION_SELECT)
      .eq('id', currentSubscription.id)
      .single();
    const subscription = subscriptionData as unknown as SubscriptionRow | null;

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
