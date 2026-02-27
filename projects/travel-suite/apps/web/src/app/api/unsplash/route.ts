import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY is not set. Using mock data.");
    // Return mock data when no API key is present
    return NextResponse.json({
      results: [
        { id: "m1", urls: { regular: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=1080" } },
        { id: "m2", urls: { regular: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1080" } },
        { id: "m3", urls: { regular: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1080" } },
        { id: "m4", urls: { regular: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&q=80&w=1080" } },
        { id: "m5", urls: { regular: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1080" } },
        { id: "m6", urls: { regular: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&q=80&w=1080" } },
        { id: "m7", urls: { regular: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1080" } },
        { id: "m8", urls: { regular: "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?auto=format&fit=crop&q=80&w=1080" } }
      ]
    });
  }

  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Unsplash:", error);
    return NextResponse.json({ error: 'Failed to fetch images from Unsplash' }, { status: 500 });
  }
}
