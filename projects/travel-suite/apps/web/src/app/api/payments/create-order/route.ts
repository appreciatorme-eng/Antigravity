/**
 * Create Payment Order API
 *
 * Endpoint:
 * - POST /api/payments/create-order - Create Razorpay order for checkout
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
    const {
      amount,
      currency = 'INR',
      invoice_id,
      subscription_id,
      notes = {},
    } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const order = await paymentService.createOrder(
      amount,
      currency,
      profile.organization_id,
      {
        ...notes,
        invoice_id,
        subscription_id,
      }
    );

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error in POST /api/payments/create-order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
