import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import * as cheerio from 'cheerio';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key' });

function isPrivateOrLocalHost(hostname: string): boolean {
    const normalized = hostname.trim().toLowerCase();
    if (!normalized) return true;
    if (normalized === 'localhost' || normalized.endsWith('.local')) return true;
    if (normalized === '::1') return true;
    if (normalized.startsWith('127.')) return true;
    if (normalized.startsWith('10.')) return true;
    if (normalized.startsWith('192.168.')) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
    return false;
}

const groqSystemPrompt = `You are an expert data extraction bot for a premium B2B Travel Agency SaaS. 
I am going to give you raw scraped text from a travel agency website for a specific tour. 
You must read the raw text, understand the itinerary, and export it strictly into this robust JSON format. 
DO NOT INCLUDE MARKDOWN. 
Return ONLY valid raw JSON and absolutely nothing else.

{
  "trip_title": "string (extract the title of the tour from the text)",
  "destination": "string (extract the primary city/state or country)",
  "duration_days": number,
  "summary": "string (a brief 2-3 sentence summary of the tour)",
  "budget": "string (estimate cost tier if not provided, e.g., 'Budget', 'Moderate', 'Luxury')",
  "interests": ["string"],
  "tips": ["string"],
  "days": [
    {
      "day_number": number,
      "theme": "string (e.g. 'Arrival in Manali')",
      "activities": [
        {
          "time": "string (e.g. 'Morning', '09:00 AM')",
          "title": "searchable landmark or activity name",
          "description": "3-4 sentences describing the activity",
          "location": "string (city and neighborhood)",
          "cost": "string (e.g. 'Included', 'Self-pay')",
          "transport": "string (e.g. 'Volvo Bus', 'Tempo Traveler')",
          "coordinates": { "lat": number, "lng": number }
        }
      ]
    }
  ]
}

Note: For coordinates, if you know the exact lat/lng of the tourist attraction, provide it. Otherwise provide the coordinates of the destination city or generic 0,0.`;

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const parsedBody = await req.json().catch(() => null);
        const url = typeof parsedBody?.url === 'string' ? parsedBody.url.trim() : '';

        if (!url) {
            return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json({ error: 'URL format is invalid' }, { status: 400 });
        }

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return NextResponse.json({ error: 'Only http/https URLs are supported' }, { status: 400 });
        }

        if (isPrivateOrLocalHost(parsedUrl.hostname)) {
            return NextResponse.json({ error: 'Local or private network URLs are not allowed' }, { status: 400 });
        }

        console.log(`\n🔍 Scraping URL import: ${url}`);

        // 1. Fetch & parse HTML
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: 400 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove noisy elements
        $('nav, footer, header, script, style, noscript, svg, img, iframe').remove();

        const rawText = $('body').text().replace(/\s+/g, ' ').trim();

        if (!rawText || rawText.length < 50) {
            return NextResponse.json({ error: 'Could not extract useful text from this URL' }, { status: 422 });
        }

        const truncatedText = rawText.slice(0, 20000);

        console.log(`   🧠 Sending ${truncatedText.length} chars to Groq...`);

        // 2. Pass to Llama3 Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: groqSystemPrompt },
                { role: 'user', content: `Extract the itinerary from this raw website text:\n\n${truncatedText}` }
            ],
            model: 'llama3-70b-8192', // Use 70b as it is far smarter at layout extraction than 8b
            temperature: 0.1,
            max_completion_tokens: 8000,
            response_format: { type: 'json_object' }
        });

        const itineraryText = chatCompletion.choices[0]?.message?.content || "";
        const itineraryJson = JSON.parse(itineraryText);

        console.log(`   ✅ Extracted: "${itineraryJson.trip_title}"`);

        return NextResponse.json({
            success: true,
            source: 'url',
            originalUrl: url,
            itinerary: itineraryJson
        });

    } catch (error: unknown) {
        console.error("URL Import Error:", error);
        const message = error instanceof Error ? error.message : 'Failed to import from URL';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
