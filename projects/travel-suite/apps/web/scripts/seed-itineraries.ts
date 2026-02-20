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

// Top 50 Global Tourist Destinations
const destinations = [
    "Paris", "London", "Dubai", "Tokyo", "Rome", "New York City", "Istanbul",
    "Bangkok", "Barcelona", "Amsterdam", "Singapore", "Seoul", "Venice",
    "Los Angeles", "Las Vegas", "Miami", "Kyoto", "Bali", "Sydney", "Florence",
    "Madrid", "Vienna", "Prague", "Milan", "Athens", "Berlin", "Munich",
    "San Francisco", "Chicago", "Toronto", "Vancouver", "Montreal", "Cancun",
    "Mexico City", "Rio de Janeiro", "Buenos Aires", "Cape Town", "Cairo",
    "Marrakech", "Mumbai", "New Delhi", "Phuket", "Ho Chi Minh City", "Taipei",
    "Osaka", "Lisbon", "Porto", "Zurich", "Geneva", "Budapest"
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const groqSystemPrompt = `You are an expert travel planner. You MUST output valid JSON exactly adhering to this structure:
{
  "trip_title": "string",
  "destination": "string",
  "duration_days": number,
  "summary": "string",
  "budget": "string",
  "interests": ["string"],
  "tips": ["string"],
  "days": [
    {
      "day_number": number,
      "theme": "string",
      "activities": [
        {
          "time": "string",
          "title": "searchable landmark",
          "description": "3-4 sentences",
          "location": "string",
          "cost": "string",
          "transport": "string",
          "coordinates": { "lat": number, "lng": number }
        }
      ]
    }
  ]
}
Return ONLY valid raw JSON and absolutely nothing else.`;

async function seedDestination(destination: string, days: number = 3) {
    const prompt = `Create a ${days}-day travel itinerary for: "${destination}".
Requirements:
- Exactly ${days} days with 5-6 activities per day (include meals)
- ACCURATE lat/lng coordinates for each activity (NOT 0,0 or wrong city)
- Activity titles must be specific searchable landmark names
- Descriptions: 3-4 informative sentences each
- Include specific times, durations, costs, and transport directions
- Location must include neighborhood/district`;

    console.log(`\n======================================================`);
    console.log(`🌍 Starting Generation: ${destination} (${days} days)`);

    try {
        // 1. Generate Itinerary Using Groq (Llama 3)
        console.log(`   🧠 Generating itinerary via Groq...`);
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: groqSystemPrompt },
                { role: 'user', content: prompt }
            ],
            model: 'llama3-8b-8192',
            temperature: 0.5,
            max_completion_tokens: 8000,
            response_format: { type: 'json_object' }
        });

        const itineraryText = chatCompletion.choices[0]?.message?.content || "";
        const itineraryJson = JSON.parse(itineraryText);
        console.log(`   ✅ Itinerary generated successfully.`);

        // 2. Generate Prompt Embedding Using OpenAI
        console.log(`   🔢 Generating semantic embedding...`);
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: prompt,
            dimensions: 1536,
        });
        const embedding = embeddingResponse.data[0].embedding;

        // 3. Store in Supabase pgvector
        console.log(`   💾 Saving to Supabase pgvector...`);
        const { error } = await supabase.from('itinerary_embeddings').insert({
            query_text: prompt,
            destination: destination,
            duration_days: days,
            embedding: embedding,
            itinerary_data: itineraryJson,
            usage_count: 0
        });

        if (error) {
            console.error(`   ❌ Supabase Error for ${destination}:`, error.message);
        } else {
            console.log(`   🎉 Success! Pre-generated cache perfectly saved bounds for ${destination}.`);
        }

    } catch (e) {
        console.error(`   ❌ Task failed for ${destination}:`, e);
    }
}

async function runSeeder() {
    console.log("🚀 Initializing 'Pareto' Top 50 Itinerary Pre-Generation Seeding Engine");

    if (!process.env.GROQ_API_KEY || !process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("❌ Missing required API keys. Ensure .env file has GROQ, OPENAI, and SUPABASE keys.");
        process.exit(1);
    }

    // Process iteratively to respect rate limits (Groq allows fast gen, but OpenAI embeddings might rate limit)
    for (const desc of destinations) {
        await seedDestination(desc, 3);
        // await seedDestination(desc, 5); // Uncomment if we want both lengths

        // Wait 2 seconds to avoid spiking rate limits on APIs
        await sleep(2000);
    }

    console.log("\n✅ All top 50 destinations fully seeded successfully.");
    process.exit(0);
}

runSeeder();
