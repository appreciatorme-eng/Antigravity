import { NextRequest } from 'next/server';
import { ensureMockEndpointAllowed } from '@/lib/security/mock-endpoint-guard'

interface ConvertLeadBody {
  phone: string;
  name?: string;
  destination: string;
  travelers?: number;
  duration?: number;
  tier?: string;
  totalPrice?: number;
  message?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  const guard = ensureMockEndpointAllowed('/api/leads/convert:POST')
  if (guard) return guard

  let body: ConvertLeadBody;

  try {
    body = (await request.json()) as ConvertLeadBody;
  } catch {
    return Response.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { phone, name, destination, travelers, duration } = body;

  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    return Response.json(
      { error: 'phone and destination required' },
      { status: 400 }
    );
  }

  if (!destination || typeof destination !== 'string' || destination.trim() === '') {
    return Response.json(
      { error: 'phone and destination required' },
      { status: 400 }
    );
  }

  const now = Date.now();
  const clientId = `cl_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const tripId = `tr_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const bookingRef = `BK-${new Date().getFullYear()}-${String(
    Math.floor(Math.random() * 9000) + 1000
  )}`;

  const displayName = name?.trim() || phone;

  return Response.json({
    success: true,
    clientId,
    tripId,
    bookingRef,
    message: `Booking ${bookingRef} created for ${displayName} — ${destination} trip`,
    meta: {
      travelers: travelers ?? null,
      duration: duration ?? null,
      tier: body.tier ?? null,
      totalPrice: body.totalPrice ?? null,
    },
  });
}
