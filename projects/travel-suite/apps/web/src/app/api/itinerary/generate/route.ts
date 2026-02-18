import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import { z } from 'zod';

function extractDestination(prompt: string): string {
    // Best-effort: try to extract the first "for <destination>" clause.
    const m = prompt.match(/\bfor\s+([^.\n"]{2,80})/i);
    return (m?.[1] || prompt).trim().slice(0, 80);
}

function buildFallbackItinerary(prompt: string, days: number) {
    const destination = extractDestination(prompt) || 'Destination';
    return {
        trip_title: `Trip to ${destination}`,
        destination,
        duration_days: days,
        summary:
            'A simple itinerary was generated because the AI planner was unavailable. You can retry to get a richer plan.',
        days: Array.from({ length: days }, (_, idx) => ({
            day_number: idx + 1,
            theme: 'Highlights',
            activities: [
                {
                    time: 'Morning',
                    title: 'Arrive and explore',
                    description: 'Start with a central library and museum.',
                    location: destination,
                    coordinates: { lat: 40.7128, lng: -74.0060 }, // Default near New York/General center to avoid 0,0
                },
                {
                    time: 'Afternoon',
                    title: 'Top attractions',
                    description: 'Visit a landmark and a park.',
                    location: destination,
                    coordinates: { lat: 40.7308, lng: -73.9973 },
                },
                {
                    time: 'Evening',
                    title: 'Dinner and views',
                    description: 'Enjoy a local dinner and a scenic view.',
                    location: destination,
                    coordinates: { lat: 40.7589, lng: -73.9851 },
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

// Schema for input validation
const RequestSchema = z.object({
    prompt: z.string().min(2, "Prompt must be at least 2 characters"),
    days: z.number().min(1).max(14).default(3),
});

// JSON Schema for Gemini Structure Output
const itinerarySchema: Schema = {
    description: "Travel itinerary",
    type: SchemaType.OBJECT,
    properties: {
        trip_title: { type: SchemaType.STRING, description: "A catchy title for the trip" },
        destination: { type: SchemaType.STRING, description: "Primary destination city/country" },
        duration_days: { type: SchemaType.NUMBER, description: "Total number of days" },
        summary: { type: SchemaType.STRING, description: "Brief overview of the vibe" },
        budget: { type: SchemaType.STRING, description: "Budget style (Budget-Friendly/Moderate/Luxury/Ultra-High End)" },
        interests: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Interests the itinerary is optimized for" },
        tips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Practical tips (booking, transport, timing)" },
        days: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    day_number: { type: SchemaType.NUMBER },
                    theme: { type: SchemaType.STRING, description: "Theme for the day (e.g., 'Historical Sightseeing')" },
                    activities: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                time: { type: SchemaType.STRING, description: "Specific start time like '09:00 AM' (preferred) or Morning/Afternoon/Evening" },
                                title: { type: SchemaType.STRING },
                                description: { type: SchemaType.STRING },
                                location: { type: SchemaType.STRING, description: "Name of the place" },
                                duration: { type: SchemaType.STRING, description: "Expected duration, e.g. '1.5h' or '2 hours'" },
                                cost: { type: SchemaType.STRING, description: "Cost estimate, e.g. '$25' or 'Free' or '€10-€20'" },
                                transport: { type: SchemaType.STRING, description: "How to get there from previous stop (walk/metro/taxi/ride-share) + approx time" },
                                coordinates: {
                                    type: SchemaType.OBJECT,
                                    description: "Lat/Lng mostly for map placement (estimate)",
                                    properties: {
                                        lat: { type: SchemaType.NUMBER },
                                        lng: { type: SchemaType.NUMBER }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    required: ["trip_title", "destination", "duration_days", "summary", "days"]
};

export async function POST(req: NextRequest) {
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

        const apiKey =
            process.env.GOOGLE_API_KEY ||
            process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            // Keep planner functional even if AI isn't configured.
            return NextResponse.json(buildFallbackItinerary(prompt, days));
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest", // Use newer model for better JSON adherence
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: itinerarySchema,
            },
        });

        const finalPrompt = `
      Act as an expert travel planner.
      Create a stunning, detailed ${days}-day itinerary for the following request: "${prompt}".

      Requirements:
      - Exactly ${days} days in the "days" array; day_number must be 1..${days}
      - 4-6 activities per day with realistic pacing and specific start times (prefer '09:00 AM')
      - Use real places and neighborhoods; keep it geographically efficient (cluster nearby places)
      - For each activity include:
          - duration (e.g., '1.5h')
          - cost estimate (e.g., '$20-30')
          - transport method from previous stop + time
          - precise coordinates (lat, lng) strictly for the location (do NOT guess 0,0)
      - Include 1-2 food/coffee suggestions per day (as activities)
      - Provide practical "tips" (booking/entry, best times, closures, local transport)
      - Each day MUST have a unique, descriptive theme (e.g., "Day 1: Arrival & Historic Center", "Day 2: Art & Modern Architecture"). Do NOT use "Highlights" for every day.

      Output must be valid JSON matching the provided schema. No markdown.
    `;

        let itinerary: any;
        try {
            // Occasionally the provider can hang; cap time so the UI doesn't spin forever.
            const result = await withTimeout(model.generateContent(finalPrompt), 45_000);
            const responseText = result.response.text();
            itinerary = JSON.parse(responseText);
        } catch (innerError) {
            console.error("AI Generation Error (fallback):", innerError);
            itinerary = buildFallbackItinerary(prompt, days);
        }

        // Defensive normalization for UI expectations.
        if (typeof itinerary.duration_days !== "number" || !Number.isFinite(itinerary.duration_days)) {
            itinerary.duration_days = days;
        }
        if (typeof itinerary.summary !== "string" || itinerary.summary.trim().length < 10) {
            itinerary.summary = buildFallbackItinerary(prompt, days).summary;
        }
        if (!Array.isArray(itinerary.days)) {
            itinerary.days = buildFallbackItinerary(prompt, days).days;
        }
        itinerary.days = itinerary.days.slice(0, days).map((d: any, idx: number) => ({
            ...d,
            day_number: idx + 1,
            theme: typeof d?.theme === "string" && d.theme.trim().length > 0 ? d.theme : "Highlights",
            activities: Array.isArray(d?.activities) ? d.activities : [],
        }));
        // If the model returned fewer days, pad with fallbacks.
        if (itinerary.days.length < days) {
            const pad = buildFallbackItinerary(prompt, days).days.slice(itinerary.days.length);
            itinerary.days = itinerary.days.concat(pad);
        }

        return NextResponse.json(itinerary);

    } catch (error) {
        console.error("AI Generation Error:", error);
        return NextResponse.json(buildFallbackItinerary(prompt, days));
    }
}
