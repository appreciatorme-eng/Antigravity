import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
        // Return null if no API key configured (graceful degradation)
        return NextResponse.json({ url: null }, { status: 200 });
    }

    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
            {
                headers: {
                    'Authorization': apiKey
                },
                next: { revalidate: 86400 } // Cache for 24 hours
            }
        );

        if (!response.ok) {
            console.error('Pexels API error:', response.status);
            return NextResponse.json({ url: null }, { status: 200 });
        }

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
            const photo = data.photos[0];
            // Use large size for good quality
            const imageUrl = photo.src.large;
            return NextResponse.json({ url: imageUrl });
        }

        return NextResponse.json({ url: null }, { status: 200 });

    } catch (error) {
        console.error('Pexels fetch error:', error);
        return NextResponse.json({ url: null }, { status: 200 });
    }
}
