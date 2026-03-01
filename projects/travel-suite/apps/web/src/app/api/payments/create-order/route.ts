/**
 * Create Payment Order API
 *
 * Endpoint:
 * - POST /api/payments/create-order - Create Razorpay order for checkout
 */

import { NextRequest, NextResponse } from 'next/server';
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

    // Parse request body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const amount = Number((body as { amount?: unknown }).amount);
    const currency = (body as { currency?: string }).currency === 'USD' ? 'USD' : 'INR';
    const invoice_id = typeof (body as { invoice_id?: unknown }).invoice_id === 'string'
      ? (body as { invoice_id: string }).invoice_id.trim()
      : null;
    const subscription_id = typeof (body as { subscription_id?: unknown }).subscription_id === 'string'
      ? (body as { subscription_id: string }).subscription_id.trim()
      : null;
    const allowPartial = (body as { allow_partial?: unknown }).allow_partial === true;
    const notesRaw = (body as { notes?: unknown }).notes;
    const notes =
      notesRaw && typeof notesRaw === 'object' && !Array.isArray(notesRaw)
        ? (notesRaw as Record<string, unknown>)
        : {};
    const orderNotes: Record<string, string> = {};
    for (const [key, value] of Object.entries(notes)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        orderNotes[key] = value;
      }
    }

    // Validate amount
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (invoice_id && subscription_id) {
      return NextResponse.json(
        { error: 'Provide either invoice_id or subscription_id, not both' },
        { status: 400 }
      );
    }

    if (invoice_id) {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, organization_id, total_amount, status')
        .eq('id', invoice_id)
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (invoiceError || !invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const invoiceTotal = Number(invoice.total_amount || 0);
      if (!allowPartial && invoiceTotal > 0 && amount < invoiceTotal) {
        return NextResponse.json(
          {
            error: 'Amount is below invoice total',
            min_amount: invoiceTotal,
          },
          { status: 400 }
        );
      }
    }

    if (subscription_id) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('id, organization_id')
        .eq('id', subscription_id)
        .eq('organization_id', profile.organization_id)
        .maybeSingle();

      if (subscriptionError || !subscription) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }
    }

    // Create Razorpay order
    const order = await paymentService.createOrder(
      amount,
      currency,
      profile.organization_id,
      {
        ...orderNotes,
        ...(invoice_id ? { invoice_id } : {}),
        ...(subscription_id ? { subscription_id } : {}),
      }
    );

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error in POST /api/payments/create-order:', error);

    if (error instanceof PaymentServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: paymentErrorHttpStatus(error) }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
