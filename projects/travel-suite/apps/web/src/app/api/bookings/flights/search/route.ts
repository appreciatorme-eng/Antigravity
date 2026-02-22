import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusToken } from '@/lib/external/amadeus';
import { normalizeIataCode } from '@/lib/airport';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const originCode = normalizeIataCode(searchParams.get('originCode'));
        const destinationCode = normalizeIataCode(searchParams.get('destinationCode'));
        const date = searchParams.get('date')?.trim() || '';
        const adultsRaw = Number.parseInt(searchParams.get('adults') || '1', 10);
        const adults = Number.isFinite(adultsRaw) && adultsRaw > 0 && adultsRaw <= 9 ? adultsRaw : 1;

        if (!originCode || !destinationCode || !date) {
            return NextResponse.json({ error: 'Missing required parameters: originCode, destinationCode, date' }, { status: 400 });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
        }

        const token = await getAmadeusToken();

        const amadeusUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${encodeURIComponent(originCode)}&destinationLocationCode=${encodeURIComponent(destinationCode)}&departureDate=${encodeURIComponent(date)}&adults=${adults}&max=5`;

        const response = await fetch(amadeusUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Flight Search Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
