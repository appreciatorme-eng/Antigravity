import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusToken } from '@/lib/external/amadeus';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const originCode = searchParams.get('originCode');
        const destinationCode = searchParams.get('destinationCode');
        const date = searchParams.get('date');
        const adults = searchParams.get('adults') || '1';

        if (!originCode || !destinationCode || !date) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const token = await getAmadeusToken();

        const amadeusUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originCode}&destinationLocationCode=${destinationCode}&departureDate=${date}&adults=${adults}&max=5`;

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
