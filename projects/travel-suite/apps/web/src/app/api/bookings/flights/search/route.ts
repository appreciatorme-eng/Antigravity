import { NextRequest, NextResponse } from 'next/server';
import { getAmadeusToken, searchAmadeusLocations } from '@/lib/external/amadeus';
import { guessIataCode, normalizeIataCode } from '@/lib/airport';

async function resolveLocationCode(rawCode: string | null, rawText: string | null) {
    const fromCode = normalizeIataCode(rawCode);
    if (fromCode) return fromCode;

    const guessed = normalizeIataCode(guessIataCode(rawText));
    if (guessed) return guessed;

    const text = rawText?.trim() || '';
    if (text.length < 2) return null;

    const suggestions = await searchAmadeusLocations(text, "CITY,AIRPORT", 5);
    const first = suggestions.find((item) => normalizeIataCode(item.iataCode));
    return normalizeIataCode(first?.iataCode);
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const originCode = await resolveLocationCode(searchParams.get('originCode'), searchParams.get('origin'));
        const destinationCode = await resolveLocationCode(searchParams.get('destinationCode'), searchParams.get('destination'));
        const date = searchParams.get('date')?.trim() || '';
        const returnDate = searchParams.get('returnDate')?.trim() || '';
        const tripType = searchParams.get('tripType') === 'round_trip' ? 'round_trip' : 'one_way';
        const adultsRaw = Number.parseInt(searchParams.get('adults') || '1', 10);
        const adults = Number.isFinite(adultsRaw) && adultsRaw > 0 && adultsRaw <= 9 ? adultsRaw : 1;

        if (!originCode || !destinationCode || !date) {
            return NextResponse.json({
                error: 'Missing required parameters. Provide origin/destination (IATA or city) and date.',
            }, { status: 400 });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
        }
        if (tripType === 'round_trip') {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
                return NextResponse.json({ error: 'Round-trip requires a valid returnDate in YYYY-MM-DD format.' }, { status: 400 });
            }
            if (returnDate <= date) {
                return NextResponse.json({ error: 'Return date must be after departure date.' }, { status: 400 });
            }
        }

        const token = await getAmadeusToken();

        const query = new URLSearchParams({
            originLocationCode: originCode,
            destinationLocationCode: destinationCode,
            departureDate: date,
            adults: String(adults),
            max: '8',
        });
        if (tripType === 'round_trip') {
            query.set('returnDate', returnDate);
        }
        const amadeusUrl = `https://test.api.amadeus.com/v2/shopping/flight-offers?${query.toString()}`;

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
        return NextResponse.json({
            ...data,
            query: {
                tripType,
                originCode,
                destinationCode,
                departureDate: date,
                returnDate: tripType === 'round_trip' ? returnDate : null,
            },
        });
    } catch (error) {
        console.error('Flight Search Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
