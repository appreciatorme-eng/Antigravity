// GET /api/payments/track/[token]
// Returns payment link status (reads from localStorage on client, this is a stub)
// In production: reads from Supabase payment_links table

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params

  // Simulate payment check — in production, query Razorpay/Supabase
  const mockStatus = {
    token,
    status: 'pending' as const,
    viewCount: 0,
    lastViewedAt: null,
    paidAt: null,
    amount: 5000000, // ₹50,000 in paise
    currency: 'INR',
  }

  return Response.json(mockStatus)
}

// POST /api/payments/track/[token]
// Records a view or payment event
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const body = await request.json() as { event?: string; metadata?: Record<string, string> }
  const { event, metadata } = body // event: 'viewed' | 'paid'

  return Response.json({
    success: true,
    token: params.token,
    event,
    timestamp: new Date().toISOString(),
  })
}
