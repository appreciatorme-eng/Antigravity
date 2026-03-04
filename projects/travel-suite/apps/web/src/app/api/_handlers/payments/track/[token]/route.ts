import { ensureMockEndpointAllowed } from '@/lib/security/mock-endpoint-guard'

// GET /api/payments/track/[token]
// Returns mock payment link status (development only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const guard = ensureMockEndpointAllowed('/api/payments/track/[token]:GET')
  if (guard) return guard

  const { token } = await params

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
// Records a view or payment event (development only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const guard = ensureMockEndpointAllowed('/api/payments/track/[token]:POST')
  if (guard) return guard

  const { token } = await params
  const body = await request.json() as { event?: string; metadata?: Record<string, string> }
  const { event } = body

  return Response.json({
    success: true,
    token,
    event,
    timestamp: new Date().toISOString(),
  })
}
