import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusToken, searchAmadeusLocations } from '@/lib/external/amadeus';
import { guessIataCode, normalizeIataCode } from '@/lib/airport';

async function resolveCityCode(cityCodeRaw: string | null, locationRaw: string | null) {
    const direct = normalizeIataCode(cityCodeRaw);
    if (direct) return direct;

    const guessed = normalizeIataCode(guessIataCode(locationRaw));
    if (guessed) return guessed;

    const location = locationRaw?.trim() || '';
    if (location.length < 2) return null;

    const suggestions = await searchAmadeusLocations(location, "CITY", 5);
    const first = suggestions.find((item) => normalizeIataCode(item.iataCode));
    return normalizeIataCode(first?.iataCode);
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const cityCode = await resolveCityCode(searchParams.get('cityCode'), searchParams.get('location'));
        const radiusRaw = Number.parseInt(searchParams.get('radius') || '20', 10);
        const radius = Number.isFinite(radiusRaw) && radiusRaw > 0 && radiusRaw <= 100 ? radiusRaw : 20;

        if (!cityCode) {
            return NextResponse.json({ error: 'Missing or invalid location. Try city name or IATA code.' }, { status: 400 });
        }

        const token = await getAmadeusToken();

        // 1. Get List of Hotels in City
        const listUrl = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(cityCode)}&radius=${radius}&radiusUnit=KM&hotelSource=ALL`;

        const listResponse = await fetch(listUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!listResponse.ok) {
            const error = await listResponse.json();
            return NextResponse.json(error, { status: listResponse.status });
        }

        const data = await listResponse.json();

        // In a full implementation, we'd then call hotel-offers for specific dates.
        // For simplicity in this step, we return the hotel list.
        return NextResponse.json({
            ...data,
            query: {
                cityCode,
                radius,
            },
        });
    } catch (error) {
        console.error('Hotel Search Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
