import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from "@/lib/api/response";
import { GoogleGenerativeAI, SchemaType, type Schema, type SingleRequestOptions } from '@google/generative-ai';
import { z } from 'zod';
import Groq from "groq-sdk";
import { getCachedItinerary, saveItineraryToCache, extractCacheParams } from '@/lib/itinerary-cache';
import { getSemanticMatch, saveSemanticMatch } from '@/lib/semantic-cache';
import { isEmbeddingV2Configured } from '@/lib/embeddings-v2';
import { searchTemplates, assembleItinerary, saveAttributionTracking } from '@/lib/rag-itinerary';
import { geocodeLocation, getCityCenter } from '@/lib/geocoding-with-cache';
import { populateItineraryImages } from '@/lib/image-search';
import { getOrgAiUsageSnapshot, trackOrgAiUsage } from '@/lib/ai/cost-guardrails';
import {
    getSharedCachedItinerary,
    promoteSharedItineraryCache,
    trackSharedCacheSourceEvent,
} from "@/lib/shared-itinerary-cache";
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createClient as createServerClient } from "@/lib/supabase/server";
import { logError, logWarn } from "@/lib/observability/logger";

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
} catch {
    logWarn("Ratelimit initialization failed (likely build step)");
}

const FORCE_LOW_COST_MODE = ["1", "true", "yes"].includes(
    (process.env.AI_LOW_COST_MODE || "").toLowerCase()
);
const ESTIMATED_COST_GROQ_USD = Number(process.env.AI_ESTIMATED_COST_GROQ_USD || "0.006");
const ESTIMATED_COST_GEMINI_FLASH_USD = Number(process.env.AI_ESTIMATED_COST_GEMINI_FLASH_USD || "0.012");

function toSafeCost(value: number, fallback: number): number {
    if (Number.isFinite(value) && value >= 0) return value;
    return fallback;
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
        }
    } catch (err) {
        logError('Geocoding failed for fallback, using default coords', err);
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

/**
 * Validate that a cached itinerary matches the requested destination.
 * Returns false if the destination doesn't match (prevents serving wrong results).
 */
function validateCachedDestination(
    cached: Record<string, unknown>,
    requestedDestination: string,
): boolean {
    const cachedDest = (typeof cached.destination === 'string'
        ? cached.destination : '').toLowerCase().trim();
    const requested = requestedDestination.toLowerCase().trim();
    if (!requested || !cachedDest) return false;
    return cachedDest.includes(requested) || requested.includes(cachedDest);
}

/**
 * Ensure a cached itinerary has activity images populated.
 * Runs populateItineraryImages() if any day has activities without images.
 */
async function ensureCachedImages(
    itinerary: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const days = Array.isArray(itinerary.days) ? itinerary.days as Array<{ activities?: Array<Record<string, unknown>> }> : [];
    const hasImages = days.some((day) =>
        (Array.isArray(day.activities) ? day.activities : []).some(
            (a: Record<string, unknown>) => !!a.image
        )
    );
    if (hasImages) return itinerary;

    try {
        const withImages = await populateItineraryImages(
            itinerary as unknown as Parameters<typeof populateItineraryImages>[0]
        );
        return { ...itinerary, ...withImages };
    } catch {
        return itinerary; // Non-blocking: return original if image fetch fails
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

        const itineraryDays = Array.isArray(itinerary.days) ? itinerary.days : [];

        for (const day of itineraryDays) {
            const activities = Array.isArray(day.activities) ? day.activities : [];
            for (const activity of activities) {
                // Skip if activity already has valid coordinates
                const existingLat = activity.coordinates?.lat;
                const existingLng = activity.coordinates?.lng;
                if (
                    typeof existingLat === 'number' &&
                    typeof existingLng === 'number' &&
                    existingLat !== 0 &&
                    existingLng !== 0 &&
                    Math.abs(existingLat) <= 90 &&
                    Math.abs(existingLng) <= 180
                ) {
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
                    }
                }
            }
        }

        return itinerary;
    } catch (error) {
        logError('Geocoding error (non-blocking)', error);
        return itinerary; // Return original itinerary if geocoding fails
    }
}

// Schema for input validation
const RequestSchema = z.object({
    prompt: z.string().min(2, "Prompt must be at least 2 characters"),
    days: z.number().min(1).max(14).default(3),
});


async function handleGenerateItineraryPost(req: NextRequest) {
    // 1. Authentication Check
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
        return apiError("Unauthorized", 401);
    }

    // 2. Rate Limiting Check
    if (ratelimit) {
        const { success } = await ratelimit.limit(user.id);
        if (!success) {
            return apiError("Rate limit exceeded. Try again later.", 429);
        }
    }

    let body: unknown = null;
    try {
        body = await req.json();
    } catch {
        return apiError("Invalid JSON body", 400);
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { prompt, days } = parsed.data;
    const usageSnapshot = await getOrgAiUsageSnapshot(user.id);
    const lowCostMode = FORCE_LOW_COST_MODE || usageSnapshot.overCap;
    const { data: operatorProfile } = await serverClient
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    const organizationId = operatorProfile?.organization_id ?? null;

    try {
        // Extract destination early for cache lookup
        const destination = extractDestination(prompt);
        const sharedCacheLookup = {
            prompt,
            destination,
            days,
            organizationId,
        };

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

            const destinationMatch = validateCachedDestination(
                cachedItinerary as unknown as Record<string, unknown>, destination
            );

            if (!isFallback && hasValidCoordinates && destinationMatch) {
                const withImages = await ensureCachedImages(
                    cachedItinerary as unknown as Record<string, unknown>
                );
                Object.assign(cachedItinerary, withImages);

                void trackOrgAiUsage(user.id, "cache_hit", 0);
                void trackSharedCacheSourceEvent({
                    eventType: "hit",
                    cacheSource: "org_exact",
                    organizationId,
                    destinationKey: destination.toLowerCase(),
                    durationBucket: days <= 3 ? "1-3" : days <= 6 ? "4-6" : days <= 10 ? "7-10" : "11-14",
                });
                return NextResponse.json({
                    ...cachedItinerary,
                    cache_source: "org_exact",
                });
            }
        }

        // REDIS CACHE LOOKUP - Check if we have this itinerary cached in fast memory forever
        const promptHash = Buffer.from(prompt).toString('base64').substring(0, 50).replace(/[^a-zA-Z0-9]/g, '');
        const redisCacheKey = `itinerary_memo:${promptHash}:${days}`;


        let redisStore: Redis | null = null;
        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                redisStore = Redis.fromEnv();
                const cachedRedis = await redisStore.get(redisCacheKey);
                if (cachedRedis) {
                    const redisPayload = (
                        typeof cachedRedis === 'string' ? JSON.parse(cachedRedis) : cachedRedis
                    ) as Record<string, unknown>;

                    // Validate destination matches before returning cached result
                    if (validateCachedDestination(redisPayload, destination)) {
                        const withImages = await ensureCachedImages(redisPayload);
                        void trackOrgAiUsage(user.id, "cache_hit", 0);
                        void trackSharedCacheSourceEvent({
                            eventType: "hit",
                            cacheSource: "redis_exact",
                            organizationId,
                            destinationKey: destination.toLowerCase(),
                            durationBucket: days <= 3 ? "1-3" : days <= 6 ? "4-6" : days <= 10 ? "7-10" : "11-14",
                        });
                        return NextResponse.json({
                            ...withImages,
                            cache_source: "redis_exact",
                        });
                    }
                }
            }
        } catch {
            logWarn("Redis fallback missed / connection issue");
        }
        // TIER 0.75: SHARED CACHE (Cross-org exact or canonical hit)
        try {
            const sharedMatch = await getSharedCachedItinerary(sharedCacheLookup);
            if (sharedMatch?.itinerary) {
                const sharedPayload = sharedMatch.itinerary as Record<string, unknown>;
                if (validateCachedDestination(sharedPayload, destination)) {
                    const withImages = await ensureCachedImages(sharedPayload);
                    void trackOrgAiUsage(user.id, "cache_hit", 0);
                    return NextResponse.json({
                        ...withImages,
                        cache_source: sharedMatch.source,
                        shared_cache_id: sharedMatch.cacheId,
                    });
                }
            }
        } catch (e) {
            logError('[TIER 0.75: SHARED CACHE ERROR]', e);
        }
        // TIER 0.5: SEMANTIC CACHE (Vector Match)
        try {
            const semanticMatch = await getSemanticMatch(prompt, destination, days);
            if (semanticMatch) {
                const semanticPayload = semanticMatch as Record<string, unknown>;
                if (validateCachedDestination(semanticPayload, destination)) {
                    const withImages = await ensureCachedImages(semanticPayload);
                    void trackOrgAiUsage(user.id, "cache_hit", 0);
                    void trackSharedCacheSourceEvent({
                        eventType: "hit",
                        cacheSource: "semantic",
                        organizationId,
                        destinationKey: destination.toLowerCase(),
                        durationBucket: days <= 3 ? "1-3" : days <= 6 ? "4-6" : days <= 10 ? "7-10" : "11-14",
                    });
                    return NextResponse.json({
                        ...withImages,
                        cache_source: "semantic",
                    });
                }
            }
        } catch (e) {
            logError('[TIER 0.5: SEMANTIC CACHE ERROR]', e);
        }
        // TIER 2: RAG TEMPLATE SEARCH (Unified Knowledge Base)
        try {
            const templates = await searchTemplates({
                destination,
                days,
                budget: undefined, // Could extract from prompt if needed
                interests: undefined
            });

            if (templates && templates.length > 0) {
                const itinerary = await assembleItinerary(templates, { destination, days });

                if (itinerary) {
                    // GEOCODE ACTIVITIES - Add accurate coordinates
                    const geocodedItinerary = await geocodeItineraryActivities(itinerary as unknown as ItineraryLike);

                    // POPULATE AMAZING IMAGES FOR PREMIUM TEMPLATES
                    const withImages = await populateItineraryImages(geocodedItinerary as unknown as Parameters<typeof populateItineraryImages>[0]);
                    Object.assign(geocodedItinerary, withImages);

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
                        // Save attribution tracking
                        if (geocodedItinerary.base_template_id) {
                            await saveAttributionTracking(
                                cacheId,
                                geocodedItinerary.base_template_id,
                                undefined // requestingOrgId - could extract from auth
                            ).catch(err => {
                                logError('Attribution tracking failed (non-blocking)', err);
                            });
                        }
                    }

                    void trackOrgAiUsage(user.id, "rag_hit", 0);
                    void trackSharedCacheSourceEvent({
                        eventType: "hit",
                        cacheSource: "rag",
                        organizationId,
                        destinationKey: destination.toLowerCase(),
                        durationBucket: days <= 3 ? "1-3" : days <= 6 ? "4-6" : days <= 10 ? "7-10" : "11-14",
                    });
                    void promoteSharedItineraryCache({
                        ...sharedCacheLookup,
                        itineraryData: geocodedItinerary,
                        sourceType: "rag",
                        createdBy: user.id,
                    });
                    return NextResponse.json({
                        ...geocodedItinerary,
                        cache_source: "rag",
                    });
                }
            }

        } catch (ragError) {
            logError('[TIER 2: RAG ERROR] RAG system error (non-blocking)', ragError);
        }

        // TIER 3: AI GENERATION — try Groq first, then Gemini, then fallback
        const geminiApiKey =
            process.env.GOOGLE_API_KEY ||
            process.env.GOOGLE_GEMINI_API_KEY;
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!geminiApiKey && !groqApiKey) {
            logWarn('⚠️ No AI keys configured (GOOGLE_API_KEY / GROQ_API_KEY). Returning fallback itinerary.');
            void trackOrgAiUsage(user.id, "fallback", 0);
            return NextResponse.json(await buildFallbackItinerary(prompt, days));
        }

        if (lowCostMode) {
            const fallback = await buildFallbackItinerary(prompt, days);
            if (usageSnapshot.overCap) {
                fallback.summary =
                    "A lightweight itinerary was generated because your organization reached its monthly AI usage cap. Increase cap in settings or retry next cycle.";
            } else if (FORCE_LOW_COST_MODE) {
                fallback.summary =
                    "A lightweight itinerary was generated because AI low-cost mode is enabled for this environment.";
            }
            void trackOrgAiUsage(user.id, "fallback", 0);
            return apiSuccess(fallback);
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
        let aiGenerationCostUsd = 0;
        let aiGenerated = false;
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
                const groqController = new AbortController();
                const groqTimeoutId = setTimeout(() => groqController.abort(), 30_000);
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
                    }, { signal: groqController.signal });
                    clearTimeout(groqTimeoutId);
                    const responseContent = chatCompletion.choices[0]?.message?.content || "";
                    itinerary = JSON.parse(responseContent) as ItineraryLike;
                    aiGenerated = true;
                    aiGenerationCostUsd = toSafeCost(ESTIMATED_COST_GROQ_USD, 0.006);
                } catch (groqError) {
                    clearTimeout(groqTimeoutId);
                    if ((groqError as Error).name === 'AbortError') {
                        logError('[GROQ] Timed out after 30s', groqError);
                    } else {
                        logError('[GROQ] Failed', groqError);
                    }
                    // Fall through to Gemini below
                }
            }

            // If Groq didn't produce a result, try Gemini
            if (!itinerary && geminiApiKey) {
                const geminiController = new AbortController();
                const geminiTimeoutId = setTimeout(() => geminiController.abort(), 30_000);
                try {
                    const genAI = new GoogleGenerativeAI(geminiApiKey);
                    const model = genAI.getGenerativeModel({
                        model: "gemini-2.0-flash",
                        generationConfig: {
                            responseMimeType: "application/json",
                            responseSchema: itinerarySchema,
                        },
                    });
                    const result = await model.generateContent(
                        { contents: [{ role: "user", parts: [{ text: finalPrompt }] }] },
                        { signal: geminiController.signal } satisfies SingleRequestOptions,
                    );
                    clearTimeout(geminiTimeoutId);
                    const responseText = result.response.text();
                    itinerary = JSON.parse(responseText.trim()) as ItineraryLike;
                    aiGenerated = true;
                    aiGenerationCostUsd = toSafeCost(ESTIMATED_COST_GEMINI_FLASH_USD, 0.012);
                } catch (geminiError) {
                    clearTimeout(geminiTimeoutId);
                    if ((geminiError as Error).name === 'AbortError') {
                        logError('[GEMINI] Timed out after 30s', geminiError);
                    } else {
                        logError('[GEMINI] Failed', geminiError);
                    }
                }
            }

            // If all AI providers failed, use fallback
            if (!itinerary) {
                logWarn('⚠️ All AI providers failed or unavailable — using fallback itinerary.');
                itinerary = await buildFallbackItinerary(prompt, days);
            }
        } catch (innerError) {
            logError("AI Generation Error (outer catch)", innerError);
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
        const withImages = await populateItineraryImages(geocodedItinerary as unknown as Parameters<typeof populateItineraryImages>[0]);
        Object.assign(geocodedItinerary, withImages);

        // CACHE SAVE - Only cache AI-generated itineraries (not fallbacks)
        const isFallbackItinerary = typeof geocodedItinerary.summary === 'string' &&
            geocodedItinerary.summary.includes('AI planner was unavailable');

        if (!isFallbackItinerary) {
            // Memory Save: Save to REDIS Forever
            if (redisStore) {
                try {
                    // Cache infinitely, Upstash allows max limit to naturally evict LRU items
                    await redisStore.set(redisCacheKey, JSON.stringify(geocodedItinerary));
                } catch {
                    logError("Failed to memorize to Redis", undefined);
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
            ).catch(err => {
                logError('Cache save failed (non-blocking)', err);
            });

            void promoteSharedItineraryCache({
                ...sharedCacheLookup,
                itineraryData: geocodedItinerary,
                sourceType: "generated",
                createdBy: user.id,
            });
        }

        if (aiGenerated && !isFallbackItinerary) {
            void trackOrgAiUsage(user.id, "ai_generation", aiGenerationCostUsd);
        } else if (isFallbackItinerary) {
            void trackOrgAiUsage(user.id, "fallback", 0);
        }

        // Save to semantic pgvector cache asynchronously
        if (isEmbeddingV2Configured() && !isFallbackItinerary) {
            saveSemanticMatch(prompt, destination, days, geocodedItinerary)
                .catch((e: unknown) => logError("Semantic cache save failed", e));
        }

        void trackSharedCacheSourceEvent({
            eventType: "hit",
            cacheSource: aiGenerated && !isFallbackItinerary ? "ai" : "org_exact",
            organizationId,
            destinationKey: destination.toLowerCase(),
            durationBucket: days <= 3 ? "1-3" : days <= 6 ? "4-6" : days <= 10 ? "7-10" : "11-14",
        });

        return NextResponse.json({
            ...geocodedItinerary,
            cache_source: aiGenerated && !isFallbackItinerary ? "ai" : "fallback",
        });

    } catch (error) {
        logError("AI Generation Error", error);
        void trackOrgAiUsage(user.id, "fallback", 0);
        return NextResponse.json(await buildFallbackItinerary(prompt, days));
    }
}

export async function POST(req: NextRequest) {
    return handleGenerateItineraryPost(req);
}
