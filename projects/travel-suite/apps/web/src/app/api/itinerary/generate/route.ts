import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { z } from 'zod';
import { getCachedItinerary, saveItineraryToCache, extractCacheParams } from '@/lib/itinerary-cache';
import { searchTemplates, assembleItinerary, saveAttributionTracking } from '@/lib/rag-itinerary';
import { geocodeLocation, getCityCenter } from '@/lib/geocoding-with-cache';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient as createServerClient } from "@/lib/supabase/server";

// Allow up to 60s for AI generation + geocoding
export const maxDuration = 60;

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
async function geocodeItineraryActivities(itinerary: any): Promise<any> {
    try {
        // Get city center for proximity bias
        const cityProximity = await getCityCenter(itinerary.destination);

        let geocodedCount = 0;
        let skippedCount = 0;

        for (const day of itinerary.days) {
            for (const activity of day.activities) {
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
        );

        if (cachedItinerary) {
            // Skip cached fallback itineraries (generated when AI was unavailable)
            const isFallback = typeof cachedItinerary.summary === 'string' &&
                cachedItinerary.summary.includes('AI planner was unavailable');

            // Skip cache if it has old New York fallback coordinates (40.7, -74.0 area)
            const hasValidCoordinates = cachedItinerary.days?.some((day: any) =>
                day.activities?.some((activity: any) => {
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

        console.log(`❌ [TIER 0: REDIS MISS] ${destination} - trying RAG templates...`);

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

        // TIER 3: GEMINI AI FALLBACK
        const apiKey =
            process.env.GOOGLE_API_KEY ||
            process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            // Keep planner functional even if AI isn't configured.
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

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: itinerarySchema,
            },
        });

        const finalPrompt = `Create a ${days}-day travel itinerary for: "${prompt}".

Requirements:
- Exactly ${days} days with 5-6 activities per day (include meals)
- ACCURATE lat/lng coordinates for each activity (NOT 0,0 or wrong city)
- Activity titles must be specific searchable landmark names
- Descriptions: 3-4 informative sentences each
- Include specific times, durations, costs, and transport directions
- Location must include neighborhood/district`;

        let itinerary: any;
        try {
            // Occasionally the provider can hang; cap time so the UI doesn't spin forever.
            const result = await withTimeout(model.generateContent(finalPrompt), 30_000);
            const responseText = result.response.text();

            // SDK strictly returns valid JSON matching the schema
            itinerary = JSON.parse(responseText.trim());
        } catch (innerError) {
            console.error("AI Generation Error (fallback):", innerError);
            itinerary = await buildFallbackItinerary(prompt, days);
        }

        // Defensive normalization for UI expectations.
        if (typeof itinerary.duration_days !== "number" || !Number.isFinite(itinerary.duration_days)) {
            itinerary.duration_days = days;
        }

        // Generate fallback once if needed for normalization
        const needsFallback = (typeof itinerary.summary !== "string" || itinerary.summary.trim().length < 10) ||
            !Array.isArray(itinerary.days) ||
            (Array.isArray(itinerary.days) && itinerary.days.length < days);

        let fallbackData: any = null;
        if (needsFallback) {
            fallbackData = await buildFallbackItinerary(prompt, days);
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

        itinerary.days = itinerary.days.slice(0, days).map((d: any, idx: number) => ({
            ...d,
            day_number: idx + 1,
            theme: typeof d?.theme === "string" && d.theme.trim().length > 0 ? d.theme : fallbackThemes[idx % fallbackThemes.length],
            activities: Array.isArray(d?.activities) ? d.activities : [],
        }));
        // If the model returned fewer days, pad with fallbacks.
        if (itinerary.days.length < days && fallbackData) {
            const pad = fallbackData.days.slice(itinerary.days.length);
            itinerary.days = itinerary.days.concat(pad);
        }

        // GEOCODE ACTIVITIES - Add accurate coordinates to all activities
        const geocodedItinerary = await geocodeItineraryActivities(itinerary);

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

        return NextResponse.json(geocodedItinerary);

    } catch (error) {
        console.error("AI Generation Error:", error);
        return NextResponse.json(await buildFallbackItinerary(prompt, days));
    }
}
