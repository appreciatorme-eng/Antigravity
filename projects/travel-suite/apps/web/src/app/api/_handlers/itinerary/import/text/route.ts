import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/safe-error';
import { logError } from "@/lib/observability/logger";

const groqSystemPrompt = `You are an expert data extraction bot for a premium B2B Travel Agency SaaS serving Indian tour operators.
I am going to give you raw text from a travel itinerary or tour package brochure.
Extract ALL information and return it strictly in this JSON format.
DO NOT INCLUDE MARKDOWN. Return ONLY valid raw JSON.

{
  "trip_title": "string (title of the tour)",
  "destination": "string (primary city/state or country)",
  "duration_days": number,
  "summary": "string (2-3 sentence summary of the tour)",
  "budget": "string (e.g. 'Budget', 'Moderate', 'Luxury' — infer from price if available)",
  "interests": ["string (e.g. 'Adventure', 'Heritage', 'Beach', 'Wildlife')"],
  "tips": ["string (practical tips for the traveller)"],
  "inclusions": ["string (what is included — hotel, meals, transport, guide, etc.)"],
  "exclusions": ["string (what is NOT included — flights, visa, personal expenses, etc.)"],
  "pricing": {
    "per_person_cost": number (extract the per-person price if mentioned, else 0),
    "total_cost": number (extract total package price if mentioned, else 0),
    "currency": "string (e.g. 'INR', 'USD' — default to 'INR' for Indian packages)",
    "pax_count": number (number of people the package is priced for, default 2),
    "notes": "string (any pricing notes, e.g. 'price valid for group of 10+')"
  },
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
          "cost": "string (e.g. 'Included', 'Self-pay ₹500')",
          "transport": "string (e.g. 'Volvo Bus', 'Tempo Traveler', 'Flight')",
          "coordinates": { "lat": number, "lng": number }
        }
      ]
    }
  ]
}

PRICING EXTRACTION RULES:
- If the text says "₹12,000 per person" → per_person_cost: 12000, currency: "INR"
- If the text says "Package cost: ₹45,000 for 2 pax" → total_cost: 45000, pax_count: 2, per_person_cost: 22500
- If no price is found → per_person_cost: 0, total_cost: 0
- Always extract inclusions/exclusions — these are critical for the operator

For coordinates: provide exact lat/lng if you know the location, otherwise use the destination city coordinates.`;

export async function POST(req: Request) {
    try {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return apiError('AI extraction service is not configured', 503);
        }
        const groq = new Groq({ apiKey: groqApiKey });

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return apiError('Unauthorized', 401);
        }

        const rateLimitResult = await enforceRateLimit({
            identifier: user.id,
            limit: 10,
            windowMs: 60 * 1000,
            prefix: 'auth:import:text',
        });
        if (!rateLimitResult.success) {
            return apiError('Too many import requests. Please try again later.', 429);
        }

        const parsedBody = await req.json().catch(() => null);
        const text = typeof parsedBody?.text === 'string' ? parsedBody.text.trim() : '';

        if (!text || text.length < 50) {
            return apiError('Text must be at least 50 characters', 400);
        }

        if (text.length > 30000) {
            return apiError('Text is too long (max 30,000 characters)', 400);
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: groqSystemPrompt },
                { role: 'user', content: `Extract the itinerary from this text:\n\n${text}` }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_completion_tokens: 8000,
            response_format: { type: 'json_object' }
        });

        const itineraryText = chatCompletion.choices[0]?.message?.content || "";
        const itineraryJson = JSON.parse(itineraryText);

        return NextResponse.json({
            success: true,
            source: 'text',
            itinerary: itineraryJson
        });

    } catch (error: unknown) {
        logError("Text Import Error", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
