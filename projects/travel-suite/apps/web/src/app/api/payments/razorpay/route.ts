import { NextResponse } from 'next/server'

// POST /api/payments/razorpay
// Creates a mock Razorpay order
export async function POST(request: Request) {
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
    // In production: replace with real Razorpay SDK call
    // const Razorpay = require('razorpay')
    // const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    // return NextResponse.json(await rzp.orders.create({ amount: amount * 100, currency, receipt }))
  })
}

// GET /api/payments/razorpay?orderId=xxx — check order status
export async function GET(request: Request) {
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
