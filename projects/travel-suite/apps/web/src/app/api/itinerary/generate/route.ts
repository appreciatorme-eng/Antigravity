import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { z } from 'zod';
import Groq from "groq-sdk";
import { getCachedItinerary, saveItineraryToCache, extractCacheParams } from '@/lib/itinerary-cache';
import { getSemanticMatch, saveSemanticMatch } from '@/lib/semantic-cache';
import { searchTemplates, assembleItinerary, saveAttributionTracking } from '@/lib/rag-itinerary';
import { geocodeLocation, getCityCenter } from '@/lib/geocoding-with-cache';
import { populateItineraryImages } from '@/lib/image-search';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient as createServerClient } from "@/lib/supabase/server";

// Allow up to 60s for AI generation + geocoding
export const maxDuration = 60;

type CoordinatesLike = {
    lat?: number;
    lng?: number;
};

type ActivityLike = Record<string, unknown> & {
    location?: string;
    coordinates?: CoordinatesLike;
};

type DayLike = Record<string, unknown> & {
    activities?: ActivityLike[];
    theme?: string;
};

type ItineraryLike = Record<string, unknown> & {
    trip_title?: string;
    destination?: string;
    duration_days?: number;
    summary?: string;
    budget?: string;
    interests?: string[];
    days?: DayLike[];
    base_template_id?: string;
};

// Initialize rate limiter globally if env vars are present
let ratelimit: Ratelimit | null = null;
// Use try/catch so missing/placeholder variables at build-time don't break Next.js
try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute per user
        });
    }
} catch (e) {
    console.warn("Ratelimit initialization failed (likely build step)");
}

function extractDestination(prompt: string): string {
    // Best-effort: try to extract the first "for <destination>" clause.
    const m = prompt.match(/\bfor\s+([^.\n"]{2,80})/i);
    const extracted = (m?.[1] || prompt).trim();

    // Clean up: remove anything after "focusing on" or similar phrases
    const cleaned = extracted
        .replace(/\s+(focusing on|with|including|featuring).*$/i, '')
        .trim()
        .slice(0, 80);

    return cleaned;
}

async function buildFallbackItinerary(prompt: string, days: number) {
    const destination = extractDestination(prompt) || 'Destination';
    const themesByDay = [
        'Arrival & Initial Exploration',
        'Cultural Discovery',
        'Local Experiences',
        'Nature & Outdoor Activities',
        'Shopping & Markets',
        'Art & Architecture',
        'Culinary Journey',
        'Historical Sites',
        'Scenic Views & Relaxation',
        'Adventure Activities',
        'Local Neighborhoods',
        'Museums & Galleries',
        'Parks & Gardens',
        'Final Exploration & Departure'
    ];

    // Try to geocode the destination for accurate coordinates
    let cityCoordinates = { lat: 40.7128, lng: -74.0060 }; // Default fallback
    try {
        const geocoded = await getCityCenter(destination);
        if (geocoded) {
            const [lng, lat] = geocoded; // getCityCenter returns [lng, lat]
            cityCoordinates = { lat, lng };
            console.log(`📍 Fallback itinerary using geocoded coords for ${destination}: ${lat}, ${lng}`);
        }
    } catch (err) {
        console.error('Geocoding failed for fallback, using default coords:', err);
    }

    return {
        trip_title: `Trip to ${destination}`,
        destination,
        duration_days: days,
        summary:
            'A simple itinerary was generated because the AI planner was unavailable. You can retry to get a richer plan.',
        days: Array.from({ length: days }, (_, idx) => ({
            day_number: idx + 1,
            theme: themesByDay[idx % themesByDay.length],
            activities: [
                {
                    time: 'Morning',
                    title: 'Arrive and explore',
                    description: 'Start with a central library and museum.',
                    location: destination,
                    coordinates: cityCoordinates,
                },
                {
                    time: 'Afternoon',
                    title: 'Top attractions',
                    description: 'Visit a landmark and a park.',
                    location: destination,
                    coordinates: cityCoordinates,
                },
                {
                    time: 'Evening',
                    title: 'Dinner and views',
                    description: 'Enjoy a local dinner and a scenic view.',
                    location: destination,
                    coordinates: cityCoordinates,
                },
            ],
        })),
    };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

/**
 * Geocode all activity locations in an itinerary
 * Adds accurate coordinates to activities that have locations but no/invalid coordinates
 */
async function geocodeItineraryActivities(itinerary: ItineraryLike): Promise<ItineraryLike> {
    try {
        // Get city center for proximity bias
        const destination = typeof itinerary.destination === 'string' ? itinerary.destination : '';
        const cityProximity = await getCityCenter(destination);

        let geocodedCount = 0;
        let skippedCount = 0;

        const itineraryDays = Array.isArray(itinerary.days) ? itinerary.days : [];

        for (const day of itineraryDays) {
            const activities = Array.isArray(day.activities) ? day.activities : [];
            for (const activity of activities) {
                // Skip if activity already has valid coordinates
                if (
                    activity.coordinates &&
                    activity.coordinates.lat !== 0 &&
                    activity.coordinates.lng !== 0 &&
                    Math.abs(activity.coordinates.lat) <= 90 &&
                    Math.abs(activity.coordinates.lng) <= 180
                ) {
                    skippedCount++;
                    continue;
                }

                // Geocode the location
                if (activity.location) {
                    const result = await geocodeLocation(
                        activity.location,
                        cityProximity || undefined
                    );

                    if (result) {
                        activity.coordinates = result.coordinates;
                        geocodedCount++;
                    }
                }
            }
        }

        console.log(`📍 Geocoding: ${geocodedCount} locations geocoded, ${skippedCount} already had coordinates`);
        return itinerary;
    } catch (error) {
        console.error('Geocoding error (non-blocking):', error);
        return itinerary; // Return original itinerary if geocoding fails
    }
}

// Schema for input validation
const RequestSchema = z.object({
    prompt: z.string().min(2, "Prompt must be at least 2 characters"),
    days: z.number().min(1).max(14).default(3),
});


export async function POST(req: NextRequest) {
    // 1. Authentication Check
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate Limiting Check
    if (ratelimit) {
        const { success } = await ratelimit.limit(user.id);
        if (!success) {
            return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
        }
    }

    let body: unknown = null;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { prompt, days } = parsed.data;

    try {
        // Extract destination early for cache lookup
        const destination = extractDestination(prompt);

        // CACHE LOOKUP - Check if we have this itinerary cached
        const cachedItinerary = await getCachedItinerary(
            destination,
            days,
            undefined, // budget - we'll get this from AI response
            undefined  // interests - we'll get this from AI response
        ) as ItineraryLike | null;

        if (cachedItinerary) {
            // Skip cached fallback itineraries (generated when AI was unavailable)
            const summary = typeof cachedItinerary.summary === 'string' ? cachedItinerary.summary : '';
            const isFallback = summary.includes('AI planner was unavailable');

            // Skip cache if it has old New York fallback coordinates (40.7, -74.0 area)
            const cachedDays = Array.isArray(cachedItinerary.days) ? cachedItinerary.days : [];
            const hasValidCoordinates = cachedDays.some((day) =>
                (Array.isArray(day.activities) ? day.activities : []).some((activity) => {
                    const lat = activity.coordinates?.lat;
                    const lng = activity.coordinates?.lng;
                    if (!lat || !lng) return false;
                    const isNewYork = lat >= 40.6 && lat <= 40.8 && lng >= -74.1 && lng <= -73.9;
                    return !isNewYork;
                })
            );

            if (!isFallback && hasValidCoordinates) {
                console.log(`✅ [TIER 1: CACHE HIT] ${destination}, ${days} days - API call avoided!`);
                return NextResponse.json(cachedItinerary);
            } else {
                console.log(`⚠️ [TIER 1: CACHE INVALID] ${destination} - ${isFallback ? 'is fallback itinerary' : 'has old NY coordinates'} - regenerating`);
            }
        }

        console.log(`❌ [TIER 1: DB CACHE MISS] ${destination}, ${days} days - trying Redis cache...`);

        // REDIS CACHE LOOKUP - Check if we have this itinerary cached in fast memory forever
        const promptHash = Buffer.from(prompt).toString('base64').substring(0, 50).replace(/[^a-zA-Z0-9]/g, '');
        const redisCacheKey = `itinerary_memo:${promptHash}:${days}`;

        if (ratelimit) {
            try {
                // We use ratelimit.redis (the internal redis client) to fetch the cache
                // But the property might be private depending on Upstash versions, 
                // so let's import and instantiate our own explicit Redis client to be safe.
            } catch (e) { }
        }

        let redisStore: Redis | null = null;
        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                redisStore = Redis.fromEnv();
                const cachedRedis = await redisStore.get(redisCacheKey);
                if (cachedRedis) {
                    console.log(`✅ [TIER 0: REDIS HIT] Fastest possible response!`);
                    return NextResponse.json(typeof cachedRedis === 'string' ? JSON.parse(cachedRedis) : cachedRedis);
                }
            }
        } catch (e) {
            console.warn("Redis fallback missed / connection issue");
        }

        console.log(`❌ [TIER 0: REDIS MISS] ${destination} - trying Semantic Cache...`);

        // TIER 0.5: SEMANTIC CACHE (Vector Match)
        try {
            const semanticMatch = await getSemanticMatch(prompt, destination, days);
            if (semanticMatch) {
                console.log(`✅ [TIER 0.5: SEMANTIC CACHE HIT] exact itinerary match saved API cost!`);
                return NextResponse.json(semanticMatch);
            }
        } catch (e) {
            console.error('[TIER 0.5: SEMANTIC CACHE ERROR]', e);
        }

        console.log(`❌ [TIER 0.5: SEMANTIC MISS] ${destination} - trying RAG templates...`);

        // TIER 2: RAG TEMPLATE SEARCH (Unified Knowledge Base)
        try {
            const templates = await searchTemplates({
                destination,
                days,
                budget: undefined, // Could extract from prompt if needed
                interests: undefined
            });

            if (templates && templates.length > 0) {
                console.log(`✅ [TIER 2: RAG HIT] Found ${templates.length} matching templates (top similarity: ${templates[0].similarity.toFixed(2)})`);

                const itinerary = await assembleItinerary(templates, { destination, days });

                if (itinerary) {
                    // GEOCODE ACTIVITIES - Add accurate coordinates
                    const geocodedItinerary = await geocodeItineraryActivities(itinerary);

                    // POPULATE AMAZING IMAGES FOR PREMIUM TEMPLATES
                    await populateItineraryImages(geocodedItinerary);

                    // Extract cache params for consistency
                    const cacheParams = extractCacheParams(prompt, geocodedItinerary);

                    // Save to cache asynchronously
                    const cacheId = await saveItineraryToCache(
                        cacheParams.destination,
                        cacheParams.days,
                        cacheParams.budget,
                        cacheParams.interests,
                        geocodedItinerary
                    );

                    if (cacheId) {
                        console.log(`💾 RAG itinerary cached (ID: ${cacheId})`);

                        // Save attribution tracking
                        if (geocodedItinerary.base_template_id) {
                            await saveAttributionTracking(
                                cacheId,
                                geocodedItinerary.base_template_id,
                                undefined // requestingOrgId - could extract from auth
                            ).catch(err => {
                                console.error('Attribution tracking failed (non-blocking):', err);
                            });
                        }
                    }

                    return NextResponse.json(geocodedItinerary);
                }
            }

            console.log(`❌ [TIER 2: RAG MISS] No matching templates found - falling back to Gemini AI...`);
        } catch (ragError) {
            console.error('[TIER 2: RAG ERROR] RAG system error (non-blocking):', ragError);
            console.log('Falling back to Gemini AI generation...');
        }

        // TIER 3: AI GENERATION — try Groq first, then Gemini, then fallback
        const geminiApiKey =
            process.env.GOOGLE_API_KEY ||
            process.env.GOOGLE_GEMINI_API_KEY;
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!geminiApiKey && !groqApiKey) {
            console.warn('⚠️ No AI keys configured (GOOGLE_API_KEY / GROQ_API_KEY). Returning fallback itinerary.');
            return NextResponse.json(await buildFallbackItinerary(prompt, days));
        }

        const itinerarySchema: Schema = {
            type: SchemaType.OBJECT,
            properties: {
                trip_title: { type: SchemaType.STRING },
                destination: { type: SchemaType.STRING },
                duration_days: { type: SchemaType.NUMBER },
                summary: { type: SchemaType.STRING },
                budget: { type: SchemaType.STRING },
                interests: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                tips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                days: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            day_number: { type: SchemaType.NUMBER },
                            theme: { type: SchemaType.STRING },
                            activities: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        time: { type: SchemaType.STRING },
                                        title: { type: SchemaType.STRING },
                                        description: { type: SchemaType.STRING },
                                        location: { type: SchemaType.STRING },
                                        duration: { type: SchemaType.STRING },
                                        cost: { type: SchemaType.STRING },
                                        transport: { type: SchemaType.STRING },
                                        coordinates: {
                                            type: SchemaType.OBJECT,
                                            properties: {
                                                lat: { type: SchemaType.NUMBER },
                                                lng: { type: SchemaType.NUMBER }
                                            },
                                            required: ["lat", "lng"]
                                        }
                                    },
                                    required: ["time", "title", "description", "location"]
                                }
                            }
                        },
                        required: ["day_number", "theme", "activities"]
                    }
                }
            },
            required: ["trip_title", "destination", "duration_days", "summary", "days"]
        };

        let itinerary: ItineraryLike | null = null;
        const finalPrompt = `Create a ${days}-day travel itinerary for: "${prompt}".

Requirements:
- Exactly ${days} days with 5-6 activities per day (include meals)
- ACCURATE lat/lng coordinates for each activity (NOT 0,0 or wrong city)
- Activity titles must be specific searchable landmark names
- Descriptions: 3-4 informative sentences each
- Include specific times, durations, costs, and transport directions
- Location must include neighborhood/district`;

        try {
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

            // ROUTER: Try Groq first (cheaper & faster) — use for ALL queries when key is present
            if (groqApiKey) {
                console.log(`⚡ [MODEL ROUTER: GROQ] Routing to Llama-3-8b via Groq...`);
                try {
                    const groq = new Groq({ apiKey: groqApiKey });
                    const chatCompletion = await groq.chat.completions.create({
                        messages: [
                            { role: 'system', content: groqSystemPrompt },
                            { role: 'user', content: finalPrompt }
                        ],
                        model: 'llama-3.3-70b-versatile',
                        temperature: 0.5,
                        max_completion_tokens: 8000,
                        response_format: { type: 'json_object' }
                    });
                    const responseContent = chatCompletion.choices[0]?.message?.content || "";
                    itinerary = JSON.parse(responseContent) as ItineraryLike;
                    console.log(`✅ [GROQ] Successfully generated itinerary.`);
                } catch (groqError) {
                    console.error(`❌ [GROQ] Failed:`, groqError);
                    // Fall through to Gemini below
                }
            }

            // If Groq didn't produce a result, try Gemini
            if (!itinerary && geminiApiKey) {
                console.log(`🧠 [MODEL ROUTER: GEMINI] Routing to Gemini 2.5-flash...`);
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: itinerarySchema,
                    },
                });
                const result = await withTimeout(model.generateContent(finalPrompt), 30_000);
                const responseText = result.response.text();
                itinerary = JSON.parse(responseText.trim()) as ItineraryLike;
                console.log(`✅ [GEMINI] Successfully generated itinerary.`);
            }

            // If all AI providers failed, use fallback
            if (!itinerary) {
                console.warn('⚠️ All AI providers failed or unavailable — using fallback itinerary.');
                itinerary = await buildFallbackItinerary(prompt, days);
            }
        } catch (innerError) {
            console.error("AI Generation Error (outer catch):", innerError);
            itinerary = await buildFallbackItinerary(prompt, days);
        }

        // Defensive normalization for UI expectations.
        if (!itinerary || typeof itinerary !== 'object') {
            itinerary = await buildFallbackItinerary(prompt, days) as ItineraryLike;
        }

        if (typeof itinerary.duration_days !== "number" || !Number.isFinite(itinerary.duration_days)) {
            itinerary.duration_days = days;
        }

        // Generate fallback once if needed for normalization
        const needsFallback = (typeof itinerary.summary !== "string" || itinerary.summary.trim().length < 10) ||
            !Array.isArray(itinerary.days) ||
            (Array.isArray(itinerary.days) && itinerary.days.length < days);

        let fallbackData: ItineraryLike | null = null;
        if (needsFallback) {
            fallbackData = await buildFallbackItinerary(prompt, days) as ItineraryLike;
        }

        if (typeof itinerary.summary !== "string" || itinerary.summary.trim().length < 10) {
            itinerary.summary = fallbackData?.summary || 'A travel itinerary';
        }
        if (!Array.isArray(itinerary.days)) {
            itinerary.days = fallbackData?.days || [];
        }
        const fallbackThemes = [
            'Arrival & Initial Exploration',
            'Cultural Discovery',
            'Local Experiences',
            'Nature & Outdoor Activities',
            'Shopping & Markets',
            'Art & Architecture',
            'Culinary Journey',
            'Historical Sites',
            'Scenic Views & Relaxation',
            'Adventure Activities',
            'Local Neighborhoods',
            'Museums & Galleries',
            'Parks & Gardens',
            'Final Exploration & Departure'
        ];

        const itineraryDays = Array.isArray(itinerary.days) ? itinerary.days : [];
        itinerary.days = itineraryDays.slice(0, days).map((d: DayLike, idx: number) => ({
            ...d,
            day_number: idx + 1,
            theme: typeof d?.theme === "string" && d.theme.trim().length > 0 ? d.theme : fallbackThemes[idx % fallbackThemes.length],
            activities: Array.isArray(d?.activities) ? d.activities : [],
        }));
        // If the model returned fewer days, pad with fallbacks.
        if (itinerary.days.length < days && fallbackData) {
            const fallbackDays = Array.isArray(fallbackData.days) ? fallbackData.days : [];
            const pad = fallbackDays.slice(itinerary.days.length);
            itinerary.days = itinerary.days.concat(pad);
        }

        // GEOCODE ACTIVITIES - Add accurate coordinates to all activities
        const geocodedItinerary = await geocodeItineraryActivities(itinerary);

        // POPULATE AMAZING IMAGES FOR PREMIUM TEMPLATES
        await populateItineraryImages(geocodedItinerary);

        // CACHE SAVE - Only cache AI-generated itineraries (not fallbacks)
        const isFallbackItinerary = typeof geocodedItinerary.summary === 'string' &&
            geocodedItinerary.summary.includes('AI planner was unavailable');

        if (!isFallbackItinerary) {
            // Memory Save: Save to REDIS Forever
            if (redisStore) {
                try {
                    // Cache infinitely, Upstash allows max limit to naturally evict LRU items
                    await redisStore.set(redisCacheKey, JSON.stringify(geocodedItinerary));
                    console.log(`💾 Memorized Itinerary to Redis: ${redisCacheKey}`);
                } catch (e) {
                    console.error("Failed to memorize to Redis");
                }
            }

            // DB Save
            const cacheParams = extractCacheParams(prompt, geocodedItinerary);
            saveItineraryToCache(
                cacheParams.destination,
                cacheParams.days,
                cacheParams.budget,
                cacheParams.interests,
                geocodedItinerary
            ).then(cacheId => {
                if (cacheId) {
                    console.log(`💾 Itinerary cached successfully in Postgres (ID: ${cacheId}) for ${cacheParams.destination}`);
                }
            }).catch(err => {
                console.error('Cache save failed (non-blocking):', err);
            });
        } else {
            console.log('⚠️ Skipping cache save for fallback itinerary');
        }

        // Save to semantic pgvector cache asynchronously
        if (process.env.OPENAI_API_KEY && !isFallbackItinerary) {
            saveSemanticMatch(prompt, destination, days, geocodedItinerary)
                .then(() => console.log('✅ [TIER 0.5: SEMANTIC CACHE STORED]'))
                .catch(e => console.error(e));
        }

        return NextResponse.json(geocodedItinerary);

    } catch (error) {
        console.error("AI Generation Error:", error);
        return NextResponse.json(await buildFallbackItinerary(prompt, days));
    }
}
