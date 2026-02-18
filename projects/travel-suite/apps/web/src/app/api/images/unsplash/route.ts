import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
        // Return null if no API key configured (graceful degradation)
        return NextResponse.json({ url: null }, { status: 200 });
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
            {
                headers: {
                    'Authorization': `Client-ID ${accessKey}`,
                    'Accept-Version': 'v1'
                },
                next: { revalidate: 86400 } // Cache for 24 hours
            }
        );

        if (!response.ok) {
            console.error('Unsplash API error:', response.status);
            return NextResponse.json({ url: null }, { status: 200 });
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const photo = data.results[0];
            // Use regular quality image (not full resolution to save bandwidth)
            const imageUrl = photo.urls.regular;
            return NextResponse.json({ url: imageUrl });
        }

        return NextResponse.json({ url: null }, { status: 200 });

    } catch (error) {
        console.error('Unsplash fetch error:', error);
        return NextResponse.json({ url: null }, { status: 200 });
    }
}
