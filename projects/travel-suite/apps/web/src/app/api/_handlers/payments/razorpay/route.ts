import { NextResponse } from 'next/server'
import { ensureMockEndpointAllowed } from '@/lib/security/mock-endpoint-guard'

// POST /api/payments/razorpay
// Creates a mock Razorpay order (development only)
export async function POST(request: Request) {
  const guard = ensureMockEndpointAllowed('/api/payments/razorpay:POST')
  if (guard) return guard

  const body = await request.json()
  const { amount, currency = 'INR', receipt, notes } = body

  // Validate amount
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  // Mock Razorpay order response
  const orderId = `order_${Math.random().toString(36).slice(2, 16)}`

  return NextResponse.json({
    id: orderId,
    entity: 'order',
    amount: amount * 100, // Razorpay uses paise
    amount_paid: 0,
    amount_due: amount * 100,
    currency,
    receipt: receipt ?? `rcpt_${Date.now()}`,
    status: 'created',
    notes: notes ?? {},
    created_at: Math.floor(Date.now() / 1000),
  })
}

// GET /api/payments/razorpay?orderId=xxx — check order status (development only)
export async function GET(request: Request) {
  const guard = ensureMockEndpointAllowed('/api/payments/razorpay:GET')
  if (guard) return guard

  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 })
  }

  return NextResponse.json({
    id: orderId,
    status: 'paid',
    amount_paid: 0,
    payment_id: `pay_${Math.random().toString(36).slice(2, 16)}`,
  })
}
