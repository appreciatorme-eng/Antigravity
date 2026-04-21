import "server-only";

import { GoogleGenerativeAI, SchemaType, type Schema, type SingleRequestOptions } from "@google/generative-ai";
import Groq from "groq-sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getCachedItinerary, saveItineraryToCache, extractCacheParams } from "@/lib/itinerary-cache";
import { getSemanticMatch, saveSemanticMatch } from "@/lib/semantic-cache";
import { isEmbeddingV2Configured } from "@/lib/embeddings-v2";
import { searchTemplates, assembleItinerary, saveAttributionTracking } from "@/lib/rag-itinerary";
import { geocodeLocation, getCityCenter } from "@/lib/geocoding-with-cache";
import { populateItineraryImages } from "@/lib/image-search";
import { getOrgAiUsageSnapshot, trackOrgAiUsage } from "@/lib/ai/cost-guardrails";
import {
  getSharedCachedItinerary,
  promoteSharedItineraryCache,
  trackSharedCacheSourceEvent,
} from "@/lib/shared-itinerary-cache";
import { logError, logWarn } from "@/lib/observability/logger";

export type CoordinatesLike = {
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

export type GeneratedItineraryLike = Record<string, unknown> & {
  trip_title?: string;
  destination?: string;
  duration_days?: number;
  summary?: string;
  budget?: string;
  interests?: string[];
  days?: DayLike[];
  base_template_id?: string;
  cache_source?: string;
  shared_cache_id?: string;
};

export type GenerateItineraryInput = {
  prompt: string;
  days: number;
  userId: string;
  organizationId: string | null;
  source?: string;
};

let ratelimit: Ratelimit | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
    });
  }
} catch {
  logWarn("Ratelimit initialization failed (likely build step)");
}

const FORCE_LOW_COST_MODE = ["1", "true", "yes"].includes(
  (process.env.AI_LOW_COST_MODE || "").toLowerCase(),
);
const ESTIMATED_COST_GROQ_USD = Number(process.env.AI_ESTIMATED_COST_GROQ_USD || "0.006");
const ESTIMATED_COST_GEMINI_FLASH_USD = Number(process.env.AI_ESTIMATED_COST_GEMINI_FLASH_USD || "0.012");

function toSafeCost(value: number, fallback: number): number {
  if (Number.isFinite(value) && value >= 0) return value;
  return fallback;
}

export function extractDestination(prompt: string): string {
  const m = prompt.match(/\bfor\s+([^.\n"]{2,80})/i);
  const extracted = (m?.[1] || prompt).trim();

  const cleaned = extracted
    .replace(/\s+(focusing on|with|including|featuring).*$/i, "")
    .trim()
    .slice(0, 80);

  return cleaned;
}

export async function buildFallbackItinerary(prompt: string, days: number): Promise<GeneratedItineraryLike> {
  const destination = extractDestination(prompt) || "Destination";
  const themesByDay = [
    "Arrival & Initial Exploration",
    "Cultural Discovery",
    "Local Experiences",
    "Nature & Outdoor Activities",
    "Shopping & Markets",
    "Art & Architecture",
    "Culinary Journey",
    "Historical Sites",
    "Scenic Views & Relaxation",
    "Adventure Activities",
    "Local Neighborhoods",
    "Museums & Galleries",
    "Parks & Gardens",
    "Final Exploration & Departure",
  ];

  let cityCoordinates = { lat: 40.7128, lng: -74.0060 };
  try {
    const geocoded = await getCityCenter(destination);
    if (geocoded) {
      const [lng, lat] = geocoded;
      cityCoordinates = { lat, lng };
    }
  } catch (err) {
    logError("Geocoding failed for fallback, using default coords", err);
  }

  return {
    trip_title: `Trip to ${destination}`,
    destination,
    duration_days: days,
    summary:
      "A simple itinerary was generated because the AI planner was unavailable. You can retry to get a richer plan.",
    days: Array.from({ length: days }, (_, idx) => ({
      day_number: idx + 1,
      theme: themesByDay[idx % themesByDay.length],
      activities: [
        {
          time: "Morning",
          title: "Arrive and explore",
          description: "Start with a central library and museum.",
          location: destination,
          coordinates: cityCoordinates,
        },
        {
          time: "Afternoon",
          title: "Top attractions",
          description: "Visit a landmark and a park.",
          location: destination,
          coordinates: cityCoordinates,
        },
        {
          time: "Evening",
          title: "Dinner and views",
          description: "Enjoy a local dinner and a scenic view.",
          location: destination,
          coordinates: cityCoordinates,
        },
      ],
    })),
  };
}

function validateCachedDestination(
  cached: Record<string, unknown>,
  requestedDestination: string,
): boolean {
  const cachedDest = (typeof cached.destination === "string" ? cached.destination : "").toLowerCase().trim();
  const requested = requestedDestination.toLowerCase().trim();
  if (!requested || !cachedDest) return false;
  return cachedDest.includes(requested) || requested.includes(cachedDest);
}

async function ensureCachedImages(
  itinerary: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const days = Array.isArray(itinerary.days)
    ? (itinerary.days as Array<{ activities?: Array<Record<string, unknown>> }>)
    : [];
  const hasImages = days.some((day) =>
    (Array.isArray(day.activities) ? day.activities : []).some((a: Record<string, unknown>) => !!a.image),
  );
  if (hasImages) return itinerary;

  try {
    const withImages = await populateItineraryImages(
      itinerary as unknown as Parameters<typeof populateItineraryImages>[0],
    );
    return { ...itinerary, ...withImages };
  } catch {
    return itinerary;
  }
}

async function geocodeItineraryActivities(itinerary: GeneratedItineraryLike): Promise<GeneratedItineraryLike> {
  try {
    const destination = typeof itinerary.destination === "string" ? itinerary.destination : "";
    const cityProximity = await getCityCenter(destination);
    const itineraryDays = Array.isArray(itinerary.days) ? itinerary.days : [];

    for (const day of itineraryDays) {
      const activities = Array.isArray(day.activities) ? day.activities : [];
      for (const activity of activities) {
        const existingLat = activity.coordinates?.lat;
        const existingLng = activity.coordinates?.lng;
        if (
          typeof existingLat === "number" &&
          typeof existingLng === "number" &&
          existingLat !== 0 &&
          existingLng !== 0 &&
          Math.abs(existingLat) <= 90 &&
          Math.abs(existingLng) <= 180
        ) {
          continue;
        }

        if (activity.location) {
          const result = await geocodeLocation(activity.location, cityProximity || undefined);
          if (result) {
            activity.coordinates = result.coordinates;
          }
        }
      }
    }

    return itinerary;
  } catch (error) {
    logError("Geocoding error (non-blocking)", error);
    return itinerary;
  }
}

async function enforceUserRateLimit(userId: string): Promise<boolean> {
  if (!ratelimit) return true;
  const { success } = await ratelimit.limit(userId);
  return success;
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
                    lng: { type: SchemaType.NUMBER },
                  },
                  required: ["lat", "lng"],
                },
              },
              required: ["time", "title", "description", "location"],
            },
          },
        },
        required: ["day_number", "theme", "activities"],
      },
    },
  },
  required: ["trip_title", "destination", "duration_days", "summary", "days"],
};

export async function generateItineraryForActor(
  input: GenerateItineraryInput,
): Promise<GeneratedItineraryLike> {
  const { prompt, days, userId, organizationId } = input;

  if (!(await enforceUserRateLimit(userId))) {
    const error = new Error("Rate limit exceeded. Try again later.");
    (error as Error & { status?: number }).status = 429;
    throw error;
  }

  const usageSnapshot = await getOrgAiUsageSnapshot(userId);
  const lowCostMode = FORCE_LOW_COST_MODE || usageSnapshot.overCap;

  try {
    const destination = extractDestination(prompt);
    const sharedCacheLookup = {
      prompt,
      destination,
      days,
      organizationId,
    };

    const cachedItinerary = await getCachedItinerary(
      destination,
      days,
      undefined,
      undefined,
    ) as GeneratedItineraryLike | null;

    if (cachedItinerary) {
      const summary = typeof cachedItinerary.summary === "string" ? cachedItinerary.summary : "";
      const isFallback = summary.includes("AI planner was unavailable");
      const cachedDays = Array.isArray(cachedItinerary.days) ? cachedItinerary.days : [];
      const hasValidCoordinates = cachedDays.some((day) =>
        (Array.isArray(day.activities) ? day.activities : []).some((activity) => {
          const lat = activity.coordinates?.lat;
          const lng = activity.coordinates?.lng;
          if (!lat || !lng) return false;
          const isNewYork = lat >= 40.6 && lat <= 40.8 && lng >= -74.1 && lng <= -73.9;
          return !isNewYork;
        }),
      );
      const destinationMatch = validateCachedDestination(
        cachedItinerary as unknown as Record<string, unknown>,
        destination,
      );

      if (!isFallback && hasValidCoordinates && destinationMatch) {
        const withImages = await ensureCachedImages(cachedItinerary as unknown as Record<string, unknown>);
        Object.assign(cachedItinerary, withImages);
        void trackOrgAiUsage(userId, "cache_hit", 0);
        void trackSharedCacheSourceEvent({
          eventType: "hit",
          cacheSource: "org_exact",
          organizationId,
          destinationKey: destination.toLowerCase(),
          durationBucket: days <= 3 ? "1-3" : days <= 6 ? "4-6" : days <= 10 ? "7-10" : "11-14",
        });
        return {
          ...cachedItinerary,
          cache_source: "org_exact",
        };
      }
    }

    const promptHash = Buffer.from(prompt).toString("base64").substring(0, 50).replace(/[^a-zA-Z0-9]/g, "");
    const redisCacheKey = `itinerary_memo:${promptHash}:${days}`;

    let redisStore: Redis | null = null;
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redisStore = Redis.fromEnv();
        const cachedRedis = await redisStore.get(redisCacheKey);
        if (cachedRedis) {
          const redisPayload = (
            typeof cachedRedis === "string" ? JSON.parse(cachedRedis) : cachedRedis
          ) as Record<string, unknown>;

          if (validateCachedDestination(redisPayload, destination)) {
            const withImages = await ensureCachedImages(redisPayload);
            void trackOrgAiUsage(userId, "cache_hit", 0);
            void trackSharedCacheSourceEvent({
              eventType: "hit",
              cacheSource: "redis_exact",
              organizationId,
              destinationKey: destination.toLowerCase(),
              durationBucket: days <= 3 ? "1-3" : days <= 6 ? "4-6" : days <= 10 ? "7-10" : "11-14",
            });
            return {
              ...(withImages as GeneratedItineraryLike),
              cache_source: "redis_exact",
            };
          }
        }
      }
    } catch {
      logWarn("Redis fallback missed / connection issue");
    }

    try {
      const sharedMatch = await getSharedCachedItinerary(sharedCacheLookup);
      if (sharedMatch?.itinerary) {
        const sharedPayload = sharedMatch.itinerary as Record<string, unknown>;
        if (validateCachedDestination(sharedPayload, destination)) {
          const withImages = await ensureCachedImages(sharedPayload);
          void trackOrgAiUsage(userId, "cache_hit", 0);
          return {
            ...(withImages as GeneratedItineraryLike),
            cache_source: sharedMatch.source,
            shared_cache_id: sharedMatch.cacheId,
          };
        }
      }
    } catch (error) {
      logError("[TIER 0.75: SHARED CACHE ERROR]", error);
    }

    try {
      const semanticMatch = await getSemanticMatch(prompt, destination, days);
      if (semanticMatch) {
        const semanticPayload = semanticMatch as Record<string, unknown>;
        if (validateCachedDestination(semanticPayload, destination)) {
          const withImages = await ensureCachedImages(semanticPayload);
          void trackOrgAiUsage(userId, "cache_hit", 0);
          void trackSharedCacheSourceEvent({
            eventType: "hit",
            cacheSource: "semantic",
            organizationId,
            destinationKey: destination.toLowerCase(),
            durationBucket: days <= 3 ? "1-3" : days <= 6 ? "4-6" : days <= 10 ? "7-10" : "11-14",
          });
          return {
            ...(withImages as GeneratedItineraryLike),
            cache_source: "semantic",
          };
        }
      }
    } catch (error) {
      logError("[TIER 0.5: SEMANTIC CACHE ERROR]", error);
    }

    try {
      const templates = await searchTemplates({
        destination,
        days,
        budget: undefined,
        interests: undefined,
      });

      if (templates && templates.length > 0) {
        const itinerary = await assembleItinerary(templates, { destination, days });
        if (itinerary) {
          const geocodedItinerary = await geocodeItineraryActivities(itinerary as unknown as GeneratedItineraryLike);
          const withImages = await populateItineraryImages(
            geocodedItinerary as unknown as Parameters<typeof populateItineraryImages>[0],
          );
          Object.assign(geocodedItinerary, withImages);

          const cacheParams = extractCacheParams(prompt, geocodedItinerary);
          const cacheId = await saveItineraryToCache(
            cacheParams.destination,
            cacheParams.days,
            cacheParams.budget,
            cacheParams.interests,
            geocodedItinerary,
          );

          if (cacheId && geocodedItinerary.base_template_id) {
            await saveAttributionTracking(cacheId, geocodedItinerary.base_template_id, undefined).catch((err) => {
              logError("Attribution tracking failed (non-blocking)", err);
            });
          }

          void trackOrgAiUsage(userId, "rag_hit", 0);
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
            createdBy: userId,
          });

          return {
            ...geocodedItinerary,
            cache_source: "rag",
          };
        }
      }
    } catch (ragError) {
      logError("[TIER 2: RAG ERROR] RAG system error (non-blocking)", ragError);
    }

    const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!geminiApiKey && !groqApiKey) {
      logWarn("⚠️ No AI keys configured (GOOGLE_API_KEY / GROQ_API_KEY). Returning fallback itinerary.");
      void trackOrgAiUsage(userId, "fallback", 0);
      return {
        ...(await buildFallbackItinerary(prompt, days)),
        cache_source: "fallback",
      };
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
      void trackOrgAiUsage(userId, "fallback", 0);
      return {
        ...fallback,
        cache_source: "fallback",
      };
    }

    let itinerary: GeneratedItineraryLike | null = null;
    let aiGenerationCostUsd = 0;
    let aiGenerated = false;
    const finalPrompt = `Create a ${days}-day travel itinerary for: "${prompt}".

Requirements:
- Exactly ${days} days with 5-6 activities per day (include meals)
- ACCURATE lat/lng coordinates for each activity (NOT 0,0 or wrong city)
- Activity titles must be specific searchable landmark names
- Descriptions: 3-4 informative sentences each
- Include specific times, durations, costs in Indian Rupees (₹/INR), and transport directions
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
          "cost": "₹500 (always use Indian Rupees ₹)",
          "transport": "string",
          "coordinates": { "lat": number, "lng": number }
        }
      ]
    }
  ]
}
Return ONLY valid raw JSON and absolutely nothing else.`;

      if (groqApiKey) {
        const groqController = new AbortController();
        const groqTimeoutId = setTimeout(() => groqController.abort(), 30_000);
        try {
          const groq = new Groq({ apiKey: groqApiKey });
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: groqSystemPrompt },
              { role: "user", content: finalPrompt },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_completion_tokens: 8000,
            response_format: { type: "json_object" },
          }, { signal: groqController.signal });
          clearTimeout(groqTimeoutId);
          const responseContent = chatCompletion.choices[0]?.message?.content || "";
          itinerary = JSON.parse(responseContent) as GeneratedItineraryLike;
          aiGenerated = true;
          aiGenerationCostUsd = toSafeCost(ESTIMATED_COST_GROQ_USD, 0.006);
        } catch (groqError) {
          clearTimeout(groqTimeoutId);
          if ((groqError as Error).name === "AbortError") {
            logError("[GROQ] Timed out after 30s", groqError);
          } else {
            logError("[GROQ] Failed", groqError);
          }
        }
      }

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
          itinerary = JSON.parse(responseText.trim()) as GeneratedItineraryLike;
          aiGenerated = true;
          aiGenerationCostUsd = toSafeCost(ESTIMATED_COST_GEMINI_FLASH_USD, 0.012);
        } catch (geminiError) {
          clearTimeout(geminiTimeoutId);
          if ((geminiError as Error).name === "AbortError") {
            logError("[GEMINI] Timed out after 30s", geminiError);
          } else {
            logError("[GEMINI] Failed", geminiError);
          }
        }
      }

      if (!itinerary) {
        logWarn("⚠️ All AI providers failed or unavailable — using fallback itinerary.");
        itinerary = await buildFallbackItinerary(prompt, days);
      }
    } catch (innerError) {
      logError("AI Generation Error (outer catch)", innerError);
      itinerary = await buildFallbackItinerary(prompt, days);
    }

    if (!itinerary || typeof itinerary !== "object") {
      itinerary = await buildFallbackItinerary(prompt, days);
    }

    if (typeof itinerary.duration_days !== "number" || !Number.isFinite(itinerary.duration_days)) {
      itinerary.duration_days = days;
    }

    const needsFallback =
      (typeof itinerary.summary !== "string" || itinerary.summary.trim().length < 10) ||
      !Array.isArray(itinerary.days) ||
      (Array.isArray(itinerary.days) && itinerary.days.length < days);

    let fallbackData: GeneratedItineraryLike | null = null;
    if (needsFallback) {
      fallbackData = await buildFallbackItinerary(prompt, days);
    }

    if (typeof itinerary.summary !== "string" || itinerary.summary.trim().length < 10) {
      itinerary.summary = fallbackData?.summary || "A travel itinerary";
    }
    if (!Array.isArray(itinerary.days)) {
      itinerary.days = fallbackData?.days || [];
    }

    const fallbackThemes = [
      "Arrival & Initial Exploration",
      "Cultural Discovery",
      "Local Experiences",
      "Nature & Outdoor Activities",
      "Shopping & Markets",
      "Art & Architecture",
      "Culinary Journey",
      "Historical Sites",
      "Scenic Views & Relaxation",
      "Adventure Activities",
      "Local Neighborhoods",
      "Museums & Galleries",
      "Parks & Gardens",
      "Final Exploration & Departure",
    ];

    const itineraryDays = Array.isArray(itinerary.days) ? itinerary.days : [];
    itinerary.days = itineraryDays.slice(0, days).map((d: DayLike, idx: number) => ({
      ...d,
      day_number: idx + 1,
      theme: typeof d?.theme === "string" && d.theme.trim().length > 0 ? d.theme : fallbackThemes[idx % fallbackThemes.length],
      activities: Array.isArray(d?.activities) ? d.activities : [],
    }));

    if (itinerary.days.length < days && fallbackData) {
      const fallbackDays = Array.isArray(fallbackData.days) ? fallbackData.days : [];
      const pad = fallbackDays.slice(itinerary.days.length);
      itinerary.days = itinerary.days.concat(pad);
    }

    const geocodedItinerary = await geocodeItineraryActivities(itinerary);
    const withImages = await populateItineraryImages(
      geocodedItinerary as unknown as Parameters<typeof populateItineraryImages>[0],
    );
    Object.assign(geocodedItinerary, withImages);

    const isFallbackItinerary =
      typeof geocodedItinerary.summary === "string" &&
      geocodedItinerary.summary.includes("AI planner was unavailable");

    if (!isFallbackItinerary) {
      if (redisStore) {
        try {
          await redisStore.set(redisCacheKey, JSON.stringify(geocodedItinerary));
        } catch (redisError) {
          logError("Redis TTL error", redisError);
        }
      }

      const cacheParams = extractCacheParams(prompt, geocodedItinerary);
      saveItineraryToCache(
        cacheParams.destination,
        cacheParams.days,
        cacheParams.budget,
        cacheParams.interests,
        geocodedItinerary,
      ).catch((err) => {
        logError("Cache save failed (non-blocking)", err);
      });

      void promoteSharedItineraryCache({
        ...sharedCacheLookup,
        itineraryData: geocodedItinerary,
        sourceType: "generated",
        createdBy: userId,
      });
    }

    if (aiGenerated && !isFallbackItinerary) {
      void trackOrgAiUsage(userId, "ai_generation", aiGenerationCostUsd);
    } else if (isFallbackItinerary) {
      void trackOrgAiUsage(userId, "fallback", 0);
    }

    if (isEmbeddingV2Configured() && !isFallbackItinerary) {
      saveSemanticMatch(prompt, destination, days, geocodedItinerary).catch((error: unknown) =>
        logError("Semantic cache save failed", error),
      );
    }

    if (aiGenerated && !isFallbackItinerary) {
      void trackSharedCacheSourceEvent({
        eventType: "hit",
        cacheSource: "ai",
        organizationId,
        destinationKey: destination.toLowerCase(),
        durationBucket: days <= 3 ? "1-3" : days <= 6 ? "4-6" : days <= 10 ? "7-10" : "11-14",
      });
    }

    return {
      ...geocodedItinerary,
      cache_source: aiGenerated && !isFallbackItinerary ? "ai" : "fallback",
    };
  } catch (error) {
    logError("AI Generation Error", error);
    void trackOrgAiUsage(userId, "fallback", 0);
    return {
      ...(await buildFallbackItinerary(prompt, days)),
      cache_source: "fallback",
    };
  }
}
