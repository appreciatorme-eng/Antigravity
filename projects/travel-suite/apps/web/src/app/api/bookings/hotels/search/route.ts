import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusToken } from '@/lib/external/amadeus';
import { normalizeIataCode } from '@/lib/airport';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const cityCode = normalizeIataCode(searchParams.get('cityCode')); // IATA city code

        if (!cityCode) {
            return NextResponse.json({ error: 'Missing or invalid cityCode parameter' }, { status: 400 });
        }

        const token = await getAmadeusToken();

        // 1. Get List of Hotels in City
        const listUrl = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${encodeURIComponent(cityCode)}&radius=5&radiusUnit=KM&hotelSource=ALL`;

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
        return NextResponse.json(data);
    } catch (error) {
        console.error('Hotel Search Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
