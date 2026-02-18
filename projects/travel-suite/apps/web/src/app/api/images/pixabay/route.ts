import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Pixabay API key is optional - they have a free tier without registration
    // but you get better rate limits with a key
    const apiKey = process.env.PIXABAY_API_KEY || '46894633-93d86ed033db5de7caf8a8e61';

    try {
        const response = await fetch(
            `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3&safesearch=true`,
            {
                next: { revalidate: 86400 } // Cache for 24 hours
            }
        );

        if (!response.ok) {
            console.error('Pixabay API error:', response.status);
            return NextResponse.json({ url: null }, { status: 200 });
        }

        const data = await response.json();

        if (data.hits && data.hits.length > 0) {
            const photo = data.hits[0];
            // Use webformatURL for good quality images
            const imageUrl = photo.webformatURL;
            return NextResponse.json({ url: imageUrl });
        }

        return NextResponse.json({ url: null }, { status: 200 });

    } catch (error) {
        console.error('Pixabay fetch error:', error);
        return NextResponse.json({ url: null }, { status: 200 });
    }
}
