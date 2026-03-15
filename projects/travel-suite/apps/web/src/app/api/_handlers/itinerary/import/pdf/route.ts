import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { PDFParse } from 'pdf-parse';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { safeErrorMessage } from '@/lib/security/safe-error';

export const dynamic = 'force-dynamic';

const groqSystemPrompt = `You are an expert data extraction bot for a premium B2B Travel Agency SaaS. 
I am going to give you raw text extracted from a PDF brochure of a tour/itinerary. 
You must read the raw text, understand the itinerary, and export it strictly into this robust JSON format. 
DO NOT INCLUDE MARKDOWN. 
Return ONLY valid raw JSON and absolutely nothing else.

{
  "trip_title": "string (extract the title of the tour from the text)",
  "destination": "string (extract the primary city/state or country)",
  "duration_days": number,
  "summary": "string (a brief 2-3 sentence summary of the tour)",
  "budget": "string (estimate cost tier if not provided, e.g., 'Budget', 'Moderate', 'Luxury')",
  "interests": ["string"],
  "tips": ["string"],
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
          "cost": "string (e.g. 'Included', 'Self-pay')",
          "transport": "string (e.g. 'Volvo Bus', 'Tempo Traveler')",
          "coordinates": { "lat": number, "lng": number }
        }
      ]
    }
  ]
}

Note: For coordinates, if you know the exact lat/lng of the tourist attraction, provide it. Otherwise provide the coordinates of the destination city or generic 0,0.`;

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

        // Extract raw buffer from file upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse text from PDF
        const parser = new PDFParse({ data: buffer });
        const pdfData = await parser.getText();
        await parser.destroy();
        const rawText = pdfData.text.replace(/\s+/g, ' ').trim();

        if (!rawText || rawText.length < 50) {
            return apiError('Could not extract useful text from this PDF. It might be entirely images.', 422);
        }

        const truncatedText = rawText.slice(0, 20000);

        // Pass to Llama3 Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: groqSystemPrompt },
                { role: 'user', content: `Extract the itinerary from this raw PDF text:\n\n${truncatedText}` }
            ],
            model: 'llama3-70b-8192', // Use 70b as it is far smarter at layout extraction than 8b
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
        console.error("PDF Import Error:", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
