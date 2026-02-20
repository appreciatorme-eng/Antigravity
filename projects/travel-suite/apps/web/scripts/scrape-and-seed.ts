import * as cheerio from 'cheerio';
import Groq from "groq-sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

// 1. Initialize Clients
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Groq System Prompt for converting raw scraped text into Itinerary schemas
const groqSystemPrompt = `You are an expert data extraction bot. I am going to give you raw scraped text from a travel agency website for a specific tour. 
You must read the raw text, understand the itinerary, and export it strictly into this robust JSON format. 
DO NOT INCLUDE MARKDOWN. 
Return ONLY valid raw JSON and absolutely nothing else.

{
  "trip_title": "string (extract the title of the tour from the text)",
  "destination": "string (extract the primary city/state in India)",
  "duration_days": number,
  "summary": "string (a brief 2-sentence summary of the tour)",
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

Note: For coordinates, if you know the exact lat/lng of the tourist attraction in India, provide it. Otherwise provide the coordinates of the destination city.`;

async function fetchTourLinks(url: string): Promise<string[]> {
    console.log(`\n🔍 Scraping main tour catalog: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        const links = new Set<string>();

        // Look for anchor tags that contain "tour" or are inside specific grids.
        // GoBuddyAdventures typically uses standard ahrefs.
        $('a[href*="/tours/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.length > 25 && href !== 'https://gobuddyadventures.com/tours/') {
                links.add(href);
            }
        });

        console.log(`✅ Found ${links.size} unique tour pages to process.`);
        return Array.from(links);

    } catch (error) {
        console.error("❌ Failed to fetch tour links:", error);
        return [];
    }
}

async function scrapeAndSeedTour(tourUrl: string) {
    console.log(`\n======================================================`);
    console.log(`🌍 Processing Tour Page: ${tourUrl}`);

    try {
        // 1. Scrape the page text
        const response = await fetch(tourUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove nav, footers, head, scripts, styles to shrink token length
        $('nav, footer, header, script, style, noscript, svg, img, iframe').remove();

        // Extract raw text
        const rawText = $('body').text().replace(/\s+/g, ' ').trim();

        // Truncate to save tokens if it's extremely long (unlikely for single tour pages, but safe)
        const truncatedText = rawText.slice(0, 20000);

        console.log(`   📝 Scraped ${truncatedText.length} characters of raw text.`);

        // 2. Parse into exact schema with Groq LLama 3
        console.log(`   🧠 Extracting schema via Groq...`);
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: groqSystemPrompt },
                { role: 'user', content: `Extract the itinerary from this raw website text:\n\n${truncatedText}` }
            ],
            // Use 70b model for better complex extraction if available, otherwise 8b is fine.
            model: 'llama3-70b-8192',
            temperature: 0.1, // Strict factual extraction
            max_completion_tokens: 8000,
            response_format: { type: 'json_object' }
        });

        const itineraryText = chatCompletion.choices[0]?.message?.content || "";
        const itineraryJson = JSON.parse(itineraryText);

        const { destination, duration_days, trip_title } = itineraryJson;

        console.log(`   ✅ Extracted: "${trip_title}" (${duration_days} days in ${destination})`);

        // 3. Generate Semantic Embedding
        console.log(`   🔢 Generating semantic embedding for vector DB...`);
        const extractionPrompt = `${destination} ${duration_days} days tour: ${trip_title}. ${itineraryJson.summary}`;

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: extractionPrompt,
            dimensions: 1536,
        });
        const embedding = embeddingResponse.data[0].embedding;

        // 4. Store in Supabase pgvector
        console.log(`   💾 Saving to Supabase pgvector...`);
        const { error } = await supabase.from('itinerary_embeddings').insert({
            query_text: extractionPrompt,
            destination: destination,
            duration_days: duration_days,
            embedding: embedding,
            itinerary_data: itineraryJson,
            usage_count: 0
        });

        if (error) {
            console.error(`   ❌ Supabase Error for ${destination}:`, error.message);
        } else {
            console.log(`   🎉 Success! Scraped itinerary seeded into cache.`);
        }

    } catch (e) {
        console.error(`   ❌ Task failed for ${tourUrl}:`, e);
    }
}

async function runScraperSeeder() {
    console.log("🚀 Initializing Live Website scraper to Seed Pre-Generation Engine");

    if (!process.env.GROQ_API_KEY || !process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("❌ Missing required API keys. Ensure .env file has GROQ, OPENAI, and SUPABASE keys.");
        process.exit(1);
    }

    const CATALOG_URL = 'https://gobuddyadventures.com/tours/';
    const tourLinks = await fetchTourLinks(CATALOG_URL);

    if (tourLinks.length === 0) {
        console.error("Could not find any tour links on the website.");
        process.exit(1);
    }

    // Process iteratively to respect rate limits on Groq/OpenAI and not DDOS the target site
    for (const link of tourLinks) {
        await scrapeAndSeedTour(link);

        // Wait 3 seconds between site hits and API pushes
        await sleep(3000);
    }

    console.log(`\n✅ Finished scraping and seeding ${tourLinks.length} tours from GoBuddyAdventures.`);
    process.exit(0);
}

runScraperSeeder();
