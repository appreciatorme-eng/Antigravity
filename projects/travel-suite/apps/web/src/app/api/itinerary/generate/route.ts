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
      Act as an expert travel planner creating ULTRA-DETAILED, professional itineraries.
      Create a comprehensive, highly detailed ${days}-day itinerary for: "${prompt}".

      CRITICAL REQUIREMENTS FOR EXTREME DETAIL:

      1. STRUCTURE:
         - Exactly ${days} days in the "days" array; day_number must be 1..${days}
         - 4-8 activities per day (more activities = more detail)
         - Each day has a unique, specific theme (e.g., "Arrival & Historic Center", "Art Museums & Galleries", "Mountain Adventure & Scenic Views")

      2. ACTIVITY DESCRIPTIONS - MUST BE ULTRA-DETAILED:
         - Write 3-5 sentence descriptions for EACH activity
         - Include specific sub-locations within the main location (e.g., "Visit the Main Hall, then explore the East Gallery")
         - Provide multiple options when relevant (e.g., "Option 1: Visit X if weather permits, Option 2: Visit Y as alternative")
         - Mention specific things to see/do (e.g., "Don't miss the historic chandelier in the main lobby")
         - Add contextual information (e.g., "This museum houses over 5,000 artifacts from the Ming Dynasty")
         - Include practical details in description (e.g., "Photography allowed without flash", "Guided tours available in English at 10 AM and 2 PM")

      3. TIME BREAKDOWNS:
         - Use specific times (e.g., "09:00 AM", "11:30 AM", "02:00 PM")
         - For longer activities, break into sub-times in the description:
           Example: "Early Morning (08:00): Start at X, Mid-Morning (10:00): Move to Y, Late Morning (11:30): Visit Z"

      4. LOCATION SPECIFICITY:
         - Provide exact location names with neighborhoods/areas (e.g., "MoMA, Midtown Manhattan" not just "MoMA")
         - Include distances from previous stops (e.g., "15-minute walk from previous location")
         - Mention nearby landmarks for context (e.g., "Located near Central Park South entrance")

      5. TRANSPORTATION DETAILS:
         - Specify exact transport modes with details (e.g., "Take Metro Line 2 (Red Line) from Station A to Station B, 3 stops, 12 minutes" instead of just "Metro, 12 min")
         - Include walking directions when relevant (e.g., "Walk south on 5th Avenue for 10 minutes")
         - Mention costs (e.g., "Taxi approximately $15-20, or Subway $2.75")

      6. COSTS - BE SPECIFIC:
         - Provide price ranges (e.g., "$25-35 per person" not "$30")
         - Mention what's included (e.g., "$45 includes entrance + audio guide")
         - Note free options (e.g., "Free entry on Thursdays after 5 PM")
         - Include meal costs in food activities (e.g., "Lunch $20-30 per person for mains + drink")

      7. DURATION - BE REALISTIC:
         - Provide time ranges (e.g., "2-3 hours" not "2h")
         - Explain why (e.g., "Allow 2-3 hours to fully explore all floors and special exhibitions")

      8. PRACTICAL TIPS:
         - Add 8-12 practical tips covering:
           * Best times to visit specific attractions
           * Booking requirements (e.g., "Book Statue of Liberty tickets 2 weeks in advance")
           * Local etiquette or customs
           * What to bring/wear (e.g., "Wear comfortable shoes for 2+ miles of walking")
           * Photography rules
           * Accessibility information
           * Local SIM cards or WiFi options
           * Best local food markets or restaurants by area

      9. FOOD RECOMMENDATIONS:
         - Include 2-3 meal suggestions per day as separate activities
         - Specify cuisine type, price range, and what to order (e.g., "Try the Margherita pizza ($18) and tiramisu ($8)")
         - Mention ambiance (e.g., "Cozy family-run trattoria with outdoor seating")

      10. COORDINATES:
         - Provide accurate lat/lng for each location (do NOT use 0,0)
         - Use real coordinates for the actual place

      EXAMPLE OF REQUIRED DETAIL LEVEL:

      Bad (too brief):
      {
        "time": "09:00 AM",
        "title": "Visit MoMA",
        "description": "Explore the Museum of Modern Art.",
        "location": "MoMA",
        "duration": "2h",
        "cost": "$25"
      }

      Good (extremely detailed - THIS IS WHAT I NEED):
      {
        "time": "09:00 AM",
        "title": "Museum of Modern Art (MoMA) - Complete Tour",
        "description": "Begin your art-filled day at the Museum of Modern Art (MoMA), one of the world's premier modern art museums housing over 200,000 works. Early Morning (09:00-10:30): Start on the 5th floor with the permanent collection featuring Van Gogh's 'Starry Night' and Picasso's 'Les Demoiselles d'Avignon'. Mid-Morning (10:30-11:30): Explore the 4th floor contemporary galleries showcasing rotating exhibitions - check current exhibits online before visiting. Late Morning (11:30-12:00): Visit the sculpture garden (weather permitting) for a peaceful break. The museum offers free audio guides included with admission. Photography allowed without flash. Weekday mornings (before 11 AM) are least crowded. Members enter free; consider membership if visiting multiple NYC museums.",
        "location": "MoMA, 11 W 53rd St, Midtown Manhattan",
        "coordinates": { "lat": 40.7614, "lng": -73.9776 },
        "duration": "2.5-3 hours",
        "cost": "$25 general admission (free for children under 16, $18 seniors 65+)",
        "transport": "From your hotel in Times Square area: Walk east on 42nd St to 5th Ave, then north to 53rd St (approximately 15-minute walk, 0.8 miles). Alternative: Take M5 bus northbound on 5th Ave, 5 minutes, $2.75 MetroCard."
      }

      OUTPUT FORMAT:
      - Valid JSON matching the provided schema
      - NO markdown formatting
      - Each description must be 3-5 detailed sentences minimum
      - Each activity must provide genuine value and specific actionable information
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
