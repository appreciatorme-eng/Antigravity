/**
 * Invoice Payment API
 *
 * Endpoint:
 * - POST /api/invoices/[id]/pay - Record payment for invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { paymentService } from '@/lib/payments/payment-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      payment_method,
      razorpay_payment_id,
      razorpay_order_id,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    if (!razorpay_payment_id) {
      return NextResponse.json(
        { error: 'Razorpay payment ID is required' },
        { status: 400 }
      );
    }

    // Check if invoice exists and belongs to organization
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Record payment using payment service
    await paymentService.recordPayment({
      invoiceId: params.id,
      amount,
      paymentMethod: payment_method,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    });

    // Fetch updated invoice
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('*, clients(name, email), invoice_payments(*)')
      .eq('id', params.id)
      .single();

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error('Error in POST /api/invoices/[id]/pay:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record payment' },
      { status: 500 }
    );
  }
}
