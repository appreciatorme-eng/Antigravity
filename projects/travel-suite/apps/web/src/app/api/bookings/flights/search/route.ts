import { NextRequest, NextResponse } from 'next/server';
import { guessIataCode, normalizeIataCode } from '@/lib/airport';
import { getAmadeusToken, resolveAmadeusBaseUrl } from '@/lib/external/amadeus';

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime());
}

function resolveAirportCode(text: string, codeInput: string) {
  return normalizeIataCode(codeInput) || normalizeIataCode(guessIataCode(text)) || '';
}

export async function GET(request: NextRequest) {
  const origin = (request.nextUrl.searchParams.get('origin') || '').trim();
  const destination = (request.nextUrl.searchParams.get('destination') || '').trim();
  const originCodeInput = (request.nextUrl.searchParams.get('originCode') || '').trim();
  const destinationCodeInput = (request.nextUrl.searchParams.get('destinationCode') || '').trim();
  const departureDate = (request.nextUrl.searchParams.get('date') || '').trim();
  const returnDate = (request.nextUrl.searchParams.get('returnDate') || '').trim();
  const tripTypeRaw = (request.nextUrl.searchParams.get('tripType') || 'one_way').trim();
  const tripType = tripTypeRaw === 'round_trip' ? 'round_trip' : 'one_way';
  const adults = Math.min(parsePositiveInt(request.nextUrl.searchParams.get('adults'), 1), 9);

  const originCode = resolveAirportCode(origin, originCodeInput);
  const destinationCode = resolveAirportCode(destination, destinationCodeInput);

  if (!originCode || !destinationCode || !departureDate) {
    return NextResponse.json(
      {
        error: 'Origin, destination, and departure date are required',
      },
      { status: 400 }
    );
  }
  if (originCode === destinationCode) {
    return NextResponse.json({ error: 'Origin and destination must be different' }, { status: 400 });
  }
  if (!isValidDateInput(departureDate)) {
    return NextResponse.json({ error: 'Invalid departure date format. Use YYYY-MM-DD' }, { status: 400 });
  }
  if (tripType === 'round_trip') {
    if (!returnDate || !isValidDateInput(returnDate)) {
      return NextResponse.json(
        { error: 'Valid return date is required for round-trip search' },
        { status: 400 }
      );
    }
    if (returnDate <= departureDate) {
      return NextResponse.json({ error: 'Return date must be after departure date' }, { status: 400 });
    }
  }

  try {
    const token = await getAmadeusToken();
    const amadeusBaseUrl = resolveAmadeusBaseUrl();

    const params = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate,
      adults: String(adults),
      max: '30',
      currencyCode: 'USD',
    });

    if (tripType === 'round_trip' && returnDate) {
      params.set('returnDate', returnDate);
    }

    const response = await fetch(
      `${amadeusBaseUrl}/v2/shopping/flight-offers?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage =
        payload?.errors?.[0]?.detail ||
        payload?.errors?.[0]?.title ||
        payload?.error_description ||
        'Failed to fetch flight offers';
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    return NextResponse.json({
      data: Array.isArray(payload?.data) ? payload.data : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Flight search failed',
      },
      { status: 500 }
    );
  }
}
