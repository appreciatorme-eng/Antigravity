import 'server-only';

/**
 * AI-Powered PDF Tour Extractor (server-only)
 *
 * Uses Google Gemini to extract tour information from PDF files.
 * IMPORTANT: Must not run in the browser because it requires an API key and uses Node Buffer.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError } from '@/lib/observability/logger';
import type { ExtractedTourData } from './types';

function getGeminiKey(apiKey?: string) {
  return (
    apiKey ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY
  );
}

/**
 * Extract tour data from PDF file using Gemini AI.
 */
export async function extractTourFromPDF(
  pdfFile: File | Blob,
  apiKey?: string
): Promise<{ success: boolean; data?: ExtractedTourData; error?: string }> {
  try {
    const key = getGeminiKey(apiKey);

    if (!key) {
      return {
        success: false,
        error: 'Missing Gemini API key. Set GOOGLE_API_KEY (recommended) in your environment.',
      };
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const arrayBuffer = await pdfFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `
You are a tour itinerary extraction expert. Read this brochure visually, including layout-heavy sections, tables, badges, callouts, and image text overlays. Extract ALL tour information from this PDF and return it as valid JSON.

Extract the following information:
1. Tour name/title
2. Destination (city, country)
3. Duration in days
4. Trip start date (YYYY-MM-DD if clearly stated)
5. Trip end date (YYYY-MM-DD if clearly stated)
6. Overall description
7. Budget category (if implied or stated)
8. Interests / themes
9. Travel tips
10. Inclusions
11. Exclusions
12. Package pricing:
   - per person cost
   - total package cost
   - currency
   - pax count
   - pricing notes
-13. Base price (if mentioned separately)
-14. Day-by-day breakdown with:
   - Day number
   - Day date (YYYY-MM-DD if clearly stated)
   - Day title (e.g., "Arrival & Desert Safari")
   - Day description
   - Activities (with time, title, description, location, price if mentioned)
   - Precise coordinates (lat, lng) strictly for the location (do NOT guess 0,0)
   - Hotel/accommodation (name, star rating, room type, price per night if mentioned, amenities)

Important rules:
- Mark activities as "optional" if the PDF says "optional", "upgrade", or similar
- Mark activities as "premium" if the PDF says "premium", "luxury upgrade", or similar
- Extract prices as numbers only (no currency symbols)
- Extract times in "HH:MM AM/PM" format (e.g., "09:00 AM")
- Star ratings should be 1-5
- If no base price is found, omit the field
- Do not invent itinerary days that are not supported by the brochure
- If pricing or package metadata is missing, omit it instead of guessing
- Days should be sequential (1, 2, 3, etc.)

Return ONLY valid JSON in this exact structure (no markdown, no explanations):
{
  "name": "Tour name",
  "destination": "City, Country",
  "duration_days": 5,
  "start_date": "2026-04-28",
  "end_date": "2026-05-03",
  "description": "Overall tour description",
  "base_price": 2500,
  "budget": "Budget | Moderate | Luxury",
  "interests": ["beach", "family", "wildlife"],
  "tips": ["Carry a light jacket for evenings"],
  "inclusions": ["Airport transfers", "Breakfast"],
  "exclusions": ["Flights", "Personal expenses"],
  "pricing": {
    "per_person_cost": 1250,
    "total_cost": 2500,
    "currency": "USD",
    "pax_count": 2,
    "notes": "Rate valid for twin sharing"
  },
  "days": [
    {
      "day_number": 1,
      "date": "2026-04-28",
      "title": "Day title",
      "description": "Day description",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Activity name",
          "description": "Activity description",
          "location": "Location name",
          "price": 50,
          "is_optional": false,
          "is_premium": false
        }
      ],
      "accommodation": {
        "hotel_name": "Hotel name",
        "star_rating": 4,
        "room_type": "One Bedroom Suite",
        "price_per_night": 150,
        "amenities": ["Bed & Breakfast", "Pool"]
      }
    }
  ]
}
`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text();

    // Clean up response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const extractedData: ExtractedTourData = JSON.parse(jsonText);

    if (!extractedData.name || !extractedData.destination || !extractedData.duration_days || !extractedData.days) {
      return {
        success: false,
        error: 'Invalid extracted data: missing required fields',
      };
    }

    return {
      success: true,
      data: extractedData,
    };
  } catch (error) {
    logError('Error extracting tour from PDF', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
