import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import { z } from 'zod';
import { getCachedItinerary, saveItineraryToCache, extractCacheParams } from '@/lib/itinerary-cache';
import { searchTemplates, assembleItinerary, saveAttributionTracking } from '@/lib/rag-itinerary';

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
            console.log(`✅ [TIER 1: CACHE HIT] ${destination}, ${days} days - API call avoided!`);
            return NextResponse.json(cachedItinerary);
        }

        console.log(`❌ [TIER 1: CACHE MISS] ${destination}, ${days} days - trying RAG templates...`);

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
                    // Extract cache params for consistency
                    const cacheParams = extractCacheParams(prompt, itinerary);

                    // Save to cache asynchronously
                    const cacheId = await saveItineraryToCache(
                        cacheParams.destination,
                        cacheParams.days,
                        cacheParams.budget,
                        cacheParams.interests,
                        itinerary
                    );

                    if (cacheId) {
                        console.log(`💾 RAG itinerary cached (ID: ${cacheId})`);

                        // Save attribution tracking
                        if (itinerary.base_template_id) {
                            await saveAttributionTracking(
                                cacheId,
                                itinerary.base_template_id,
                                undefined // requestingOrgId - could extract from auth
                            ).catch(err => {
                                console.error('Attribution tracking failed (non-blocking):', err);
                            });
                        }
                    }

                    return NextResponse.json(itinerary);
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
      Act as a professional tour guide creating EXTREMELY DETAILED itineraries.
      Create a comprehensive ${days}-day itinerary for: "${prompt}".

      CRITICAL REQUIREMENTS - FOLLOW EXACTLY:

      1. STRUCTURE:
         - Exactly ${days} days in the "days" array; day_number must be 1..${days}
         - 5-8 activities per day minimum
         - Each day has a unique theme (e.g., "Historic Temples & Traditional Gardens", "Modern Tokyo & Shopping Districts", "Art Museums & Cultural Experiences")

      2. ACTIVITY DESCRIPTIONS - MANDATORY MINIMUM 8-10 SENTENCES:
         ⚠️ CRITICAL: Each activity description MUST be 8-10 full sentences minimum. This is NON-NEGOTIABLE.

         Each description MUST include ALL of these elements:
         a) Opening sentence: What the attraction is and why it's significant (1 sentence)
         b) Historical/cultural context: Background information, when it was built, what makes it special (2-3 sentences)
         c) Detailed walkthrough: Specific areas to visit within the location, in order of your route through the place (2-3 sentences)
            - Example: "Start on the 3rd floor with the permanent collection. Then move to the 2nd floor special exhibition hall. Finally, visit the rooftop garden for panoramic views."
         d) What to see/experience: Specific artworks, exhibits, architectural features, or experiences not to miss (1-2 sentences)
         e) Practical visitor information: Best times, photography rules, available facilities, accessibility (1-2 sentences)
         f) Local tips: Insider knowledge, crowd avoidance, or special experiences (1 sentence)

         ❌ NEVER use "Option 1", "Option 2" format - write as a single cohesive detailed description
         ❌ NEVER write short descriptions - 8-10 sentences is MANDATORY
         ✅ Write naturally flowing paragraphs that guide visitors step-by-step through the experience

      3. LOCATION & COORDINATES - EXTREMELY IMPORTANT:
         ⚠️ CRITICAL: Use ACCURATE coordinates for the EXACT destination requested
         - For Tokyo: Use coordinates in range lat: 35.6-35.7, lng: 139.6-139.8
         - For Paris: Use coordinates in range lat: 48.8-48.9, lng: 2.2-2.4
         - For New York: Use coordinates in range lat: 40.7-40.8, lng: -74.0 to -73.9
         - For London: Use coordinates in range lat: 51.4-51.6, lng: -0.2 to 0.0
         - NEVER use wrong city coordinates or default to 0,0
         - Location field must include neighborhood/district (e.g., "Senso-ji Temple, Asakusa District, Tokyo" not just "Senso-ji")

      4. TIME & DURATION:
         - Use specific times (09:00 AM, 11:30 AM, 02:00 PM, 06:30 PM)
         - Duration as ranges with explanation (e.g., "2-3 hours allowing time to explore all floors and special exhibitions")
         - Within descriptions, include time flow naturally: "Arrive around 9 AM when crowds are lightest. Spend your first hour exploring the main hall. By 10:30 AM, head to the garden area."

      5. TRANSPORTATION - DETAILED ROUTES:
         - NEVER just say "Metro, 12 min" - provide full details
         - Good example: "Take the Ginza Line from Asakusa Station to Shibuya Station (6 stops, 20 minutes, ¥200). Exit at Hachiko Exit and walk 3 minutes south."
         - Include walking directions for nearby places: "Walk 10 minutes north along the river promenade"
         - Mention costs: "Taxi approximately ¥1,500-2,000, or JR Yamanote Line ¥160"

      6. COSTS - COMPREHENSIVE PRICING:
         - Provide detailed price ranges: "¥1,500-2,000 per person for general admission"
         - What's included: "¥3,500 includes entry, audio guide, and special exhibition access"
         - Discounts and free options: "Free entry on first Sunday of each month. Students ¥800 with ID. Seniors 65+ ¥1,000."
         - Meal costs: "Lunch approximately ¥1,500-2,500 per person for a set menu including miso soup, rice, and main dish"

      7. PRACTICAL TIPS (8-12 tips per itinerary):
         - Booking requirements: "Reserve online 3-5 days in advance during peak season (March-April, October-November)"
         - Best times: "Visit weekday mornings 9-11 AM to avoid tour groups. Avoid weekends and Japanese holidays."
         - What to wear/bring: "Wear shoes you can remove easily as you'll enter temples. Bring cash as many smaller shops don't accept cards."
         - Cultural etiquette: "Bow slightly when greeting. Speak quietly in temples. Don't eat while walking."
         - Photography: "Photos allowed in gardens but not inside main prayer halls. No flash photography."
         - Language: "English signage available at major attractions. Download Google Translate offline for emergencies."
         - Transportation: "Buy a PASMO or Suica IC card for ¥500 for easy metro/bus access throughout your stay."
         - Connectivity: "Rent a pocket WiFi at the airport (¥600-800/day) or buy a tourist SIM card"

      8. FOOD & DINING:
         - Include 2-3 meal activities per day with 8-10 sentence descriptions
         - Cuisine type and specialties: "This family-run ramen shop specializes in tonkotsu (pork bone) broth, simmered for 18 hours"
         - What to order: "Try the signature tonkotsu ramen (¥950) with extra chashu pork (¥200). Add a soft-boiled egg (¥100) and gyoza dumplings (¥350)."
         - How to order: "Use the vending machine at entrance to purchase meal tickets, then hand to staff"
         - Ambiance and seating: "Small 12-seat counter-only shop. Peak lunch hours 12-1 PM can have 20-minute wait."

      9. SEARCHABLE ACTIVITY TITLES:
         - Include the main attraction name clearly for image search
         - Good: "Senso-ji Temple and Nakamise Shopping Street"
         - Good: "Tokyo Skytree Observatory Deck"
         - Good: "Meiji Shrine and Yoyogi Park"
         - Bad: "Morning Temple Visit" (too vague for image search)

      EXAMPLE OF REQUIRED 8-10 SENTENCE DESCRIPTION:

      ❌ WRONG (too brief - only 2 sentences):
      {
        "time": "09:00 AM",
        "title": "Senso-ji Temple",
        "description": "Visit Tokyo's oldest temple. Explore the temple grounds and shop at Nakamise Street.",
        "location": "Senso-ji Temple, Asakusa",
        "coordinates": { "lat": 35.7148, "lng": 139.7967 },
        "duration": "2 hours",
        "cost": "Free (donations welcome)"
      }

      ✅ CORRECT (8-10 detailed sentences - THIS IS MANDATORY):
      {
        "time": "09:00 AM",
        "title": "Senso-ji Temple and Nakamise Shopping Street",
        "description": "Begin your Tokyo adventure at Senso-ji, the city's oldest and most significant Buddhist temple, founded in 628 AD and dedicated to Kannon, the bodhisattva of compassion. The temple has been a pilgrimage site for over 1,400 years and attracts over 30 million visitors annually, making it one of the world's most visited religious sites. Start your visit at the iconic Kaminarimon (Thunder Gate) with its massive 4-meter-high red lantern weighing 700kg, which marks the outer entrance to the temple complex. Walk through the 250-meter-long Nakamise Shopping Street, a colorful pedestrian arcade lined with over 90 traditional shops selling souvenirs, traditional snacks like ningyo-yaki (small cakes), and local crafts - this shopping street has been here since the Edo period. Continue to the Hozomon Gate, the inner gate featuring two fierce guardian statues, before entering the main temple complex. At the main hall (hondo), observe locals performing traditional rituals: purifying hands and mouth at the chozuya fountain, lighting incense at the large cauldron, and offering prayers. The temple offers free entry though donations are appreciated; arrive early around 9 AM on weekdays to experience the serene morning atmosphere before tour groups arrive around 11 AM. Photography is permitted in the temple grounds but please be respectful and avoid photographing people praying. Don't miss the five-story pagoda on the temple grounds, which is beautifully illuminated at night. Adjacent to the main temple, explore the peaceful Asakusa Shrine, a Shinto shrine that honors the three men who founded Senso-ji - it's much quieter than the main temple and offers a contemplative space.",
        "location": "Senso-ji Temple, 2-3-1 Asakusa, Taito City, Tokyo",
        "coordinates": { "lat": 35.7148, "lng": 139.7967 },
        "duration": "2-2.5 hours allowing time to explore temple grounds, shop at Nakamise Street, and visit adjacent Asakusa Shrine",
        "cost": "Free entry (donations welcome at temple). Shopping at Nakamise Street: budget ¥1,000-3,000 for snacks and souvenirs",
        "transport": "Take the Ginza Line to Asakusa Station (Exit 1), 2-minute walk to Kaminarimon Gate. From Tokyo Station: 20 minutes, ¥180 by metro"
      }

      FINAL CRITICAL REMINDERS:
      ⚠️ EVERY activity description MUST be 8-10 complete sentences minimum
      ⚠️ NEVER use "Option 1", "Option 2" - write as flowing narrative
      ⚠️ Use CORRECT coordinates for the destination (Tokyo = lat 35.6-35.7, lng 139.6-139.8)
      ⚠️ Include searchable attraction names in titles for accurate image matching
      ⚠️ Write naturally as a professional tour guide would explain the experience

      OUTPUT FORMAT:
      - Valid JSON matching the provided schema
      - NO markdown formatting
      - MANDATORY: 8-10 sentences per activity description
      - NO "Option 1/Option 2" format
      - Use correct city coordinates
      - Each activity provides genuine value and specific actionable information
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

        // CACHE SAVE - Save successful AI generation to cache
        // Extract cache params (destination, budget, interests) from generated itinerary
        const cacheParams = extractCacheParams(prompt, itinerary);

        // Save to cache asynchronously (don't block response)
        saveItineraryToCache(
            cacheParams.destination,
            cacheParams.days,
            cacheParams.budget,
            cacheParams.interests,
            itinerary
        ).then(cacheId => {
            if (cacheId) {
                console.log(`💾 Itinerary cached successfully (ID: ${cacheId}) for ${cacheParams.destination}`);
            }
        }).catch(err => {
            console.error('Cache save failed (non-blocking):', err);
        });

        return NextResponse.json(itinerary);

    } catch (error) {
        console.error("AI Generation Error:", error);
        return NextResponse.json(buildFallbackItinerary(prompt, days));
    }
}
