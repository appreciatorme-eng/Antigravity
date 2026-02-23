import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusToken, resolveAmadeusBaseUrl, searchAmadeusLocations } from '@/lib/external/amadeus';
import { guessIataCode, normalizeIataCode } from '@/lib/airport';

type HotelResult = {
  hotelId: string;
  name: string;
  iataCode: string;
  nightlyPrice?: number | null;
  currency?: string | null;
  distance?: {
    value?: number;
    unit?: string;
  };
  address?: {
    cityName?: string;
    lines?: string[];
  };
};

async function resolveCityCode(cityCodeRaw: string | null, locationRaw: string | null) {
  const direct = normalizeIataCode(cityCodeRaw);
  if (direct) return direct;

  const guessed = normalizeIataCode(guessIataCode(locationRaw));
  if (guessed) return guessed;

  const location = locationRaw?.trim() || '';
  if (location.length < 2) return null;

  const suggestions = await searchAmadeusLocations(location, 'CITY', 5);
  const first = suggestions.find((item) => normalizeIataCode(item.iataCode));
  return normalizeIataCode(first?.iataCode);
}

function parseNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityCode = await resolveCityCode(searchParams.get('cityCode'), searchParams.get('location'));
    const radiusRaw = Number.parseInt(searchParams.get('radius') || '20', 10);
    const radius = Number.isFinite(radiusRaw) && radiusRaw > 0 && radiusRaw <= 100 ? radiusRaw : 20;
    const checkInDate = searchParams.get('checkInDate')?.trim() || '';
    const checkOutDate = searchParams.get('checkOutDate')?.trim() || '';

    if (!cityCode) {
      return NextResponse.json({ error: 'Missing or invalid location. Try city name or IATA code.' }, { status: 400 });
    }

    const token = await getAmadeusToken();
    const amadeusBaseUrl = resolveAmadeusBaseUrl();

    const listUrl = `${amadeusBaseUrl}/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(cityCode)}&radius=${radius}&radiusUnit=KM&hotelSource=ALL`;

    const listResponse = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!listResponse.ok) {
      const error = await listResponse.json().catch(() => ({}));
      return NextResponse.json(error, { status: listResponse.status });
    }

    const listPayload = await listResponse.json();
    const hotels: Array<Record<string, unknown>> = Array.isArray(listPayload?.data) ? listPayload.data : [];

    const hotelIds = hotels
      .slice(0, 20)
      .map((hotel) => String(hotel?.hotelId || '').trim())
      .filter(Boolean);

    const offersByHotelId: Record<string, { price: number | null; currency: string | null }> = {};

    if (hotelIds.length > 0 && checkInDate && checkOutDate) {
      const offersUrl = `${amadeusBaseUrl}/v3/shopping/hotel-offers?hotelIds=${encodeURIComponent(hotelIds.join(','))}&checkInDate=${encodeURIComponent(checkInDate)}&checkOutDate=${encodeURIComponent(checkOutDate)}&adults=1&roomQuantity=1&bestRateOnly=true`;
      const offersResponse = await fetch(offersUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (offersResponse.ok) {
        const offersPayload = await offersResponse.json().catch(() => ({}));
        for (const offerItem of offersPayload?.data || []) {
          const hotel = offerItem?.hotel;
          const hotelId = String(hotel?.hotelId || '').trim();
          const firstOffer = offerItem?.offers?.[0];
          const total = parseNumber(firstOffer?.price?.total);
          const currency = typeof firstOffer?.price?.currency === 'string' ? firstOffer.price.currency : null;
          if (hotelId) {
            offersByHotelId[hotelId] = { price: total, currency };
          }
        }
      }
    }

    const data: HotelResult[] = hotels.map((hotel) => {
      const distance = hotel.distance as { value?: unknown; unit?: unknown } | undefined;
      const address = hotel.address as
        | { cityName?: unknown; lines?: unknown }
        | undefined;
      const hotelId = String(hotel?.hotelId || '');
      const pricing = offersByHotelId[hotelId] || { price: null, currency: null };

      return {
        hotelId,
        name: String(hotel?.name || 'Hotel'),
        iataCode: cityCode,
        nightlyPrice: pricing.price,
        currency: pricing.currency,
        distance: {
          value: parseNumber(distance?.value) ?? undefined,
          unit: typeof distance?.unit === 'string' ? distance.unit : undefined,
        },
        address: {
          cityName: typeof address?.cityName === 'string' ? address.cityName : undefined,
          lines: Array.isArray(address?.lines)
            ? (address.lines as unknown[]).filter(Boolean).map(String)
            : undefined,
        },
      };
    });

    return NextResponse.json({
      data,
      query: {
        cityCode,
        radius,
        checkInDate: checkInDate || null,
        checkOutDate: checkOutDate || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Hotel search failed',
      },
      { status: 500 }
    );
  }
}
