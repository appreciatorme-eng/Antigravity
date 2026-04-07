import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/safe-error';
import { logError } from "@/lib/observability/logger";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const groqSystemPrompt = `You are an expert data extraction bot for a premium B2B Travel Agency SaaS serving Indian tour operators.
I am going to give you raw text extracted from a PDF brochure of a tour/itinerary.
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

async function extractPdfText(buffer: Buffer): Promise<string> {
    // Dynamic import keeps initialization errors inside our try-catch
    // pdfjs-dist must be in serverExternalPackages to avoid bundling
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const uint8 = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
        data: uint8,
        // Serverless-safe options: disable all optional async features
        useSystemFonts: true,      // skip font file fetching
        disableFontFace: true,     // skip font face rendering
        isEvalSupported: false,    // no eval() needed for text
        disableRange: true,        // no range requests
        disableStream: true,       // no streaming
        disableAutoFetch: true,    // no auto-fetching
        cMapPacked: false,         // skip CMap loading
    });

    const pdf = await loadingTask.promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: Record<string, unknown>) => typeof item.str === 'string' ? item.str : '')
            .join(' ');
        if (pageText.trim()) {
            textParts.push(pageText);
        }
        page.cleanup();
    }

    await pdf.destroy();
    return textParts.join('\n').replace(/\s+/g, ' ').trim();
}

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
            prefix: 'auth:import:pdf',
        });
        if (!rateLimitResult.success) {
            return apiError('Too many import requests. Please try again later.', 429);
        }

        let formData: FormData;
        try {
            formData = await req.formData();
        } catch {
            return apiError('PDF file is required (multipart/form-data)', 400);
        }
        const fileEntry = formData.get('file');
        if (!(fileEntry instanceof File)) {
            return apiError('PDF file is required', 400);
        }
        const file = fileEntry;

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            return apiError('Only PDF files are supported', 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const rawText = await extractPdfText(buffer);

        if (!rawText || rawText.length < 50) {
            return apiError('Could not extract useful text from this PDF. It might be entirely images.', 422);
        }

        const truncatedText = rawText.slice(0, 20000);

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: groqSystemPrompt },
                { role: 'user', content: `Extract the itinerary from this raw PDF text:\n\n${truncatedText}` }
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
            source: 'pdf',
            filename: file.name,
            itinerary: itineraryJson
        });

    } catch (error: unknown) {
        logError("PDF Import Error", error);
        const message = safeErrorMessage(error, "Failed to process PDF. Please try again.");
        return apiError(message, 500);
    }
}
