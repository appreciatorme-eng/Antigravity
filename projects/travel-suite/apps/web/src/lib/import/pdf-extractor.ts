/**
 * AI-Powered PDF Tour Extractor
 *
 * Uses Google Gemini to extract tour information from PDF files
 * Extracts: destination, duration, days, activities, hotels, pricing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedDay {
  day_number: number;
  title: string;
  description?: string;
  activities: ExtractedActivity[];
  accommodation?: ExtractedAccommodation;
}

export interface ExtractedActivity {
  time?: string;
  title: string;
  description?: string;
  location?: string;
  price?: number;
  is_optional?: boolean;
  is_premium?: boolean;
}

export interface ExtractedAccommodation {
  hotel_name: string;
  star_rating?: number;
  room_type?: string;
  price_per_night?: number;
  amenities?: string[];
}

export interface ExtractedTourData {
  name: string;
  destination: string;
  duration_days: number;
  description?: string;
  base_price?: number;
  days: ExtractedDay[];
  images?: string[]; // Image URLs if found in PDF
}

/**
 * Extract tour data from PDF file using Gemini AI
 */
export async function extractTourFromPDF(
  pdfFile: File | Blob,
  apiKey?: string
): Promise<{ success: boolean; data?: ExtractedTourData; error?: string }> {
  try {
    const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!key) {
      return {
        success: false,
        error: 'Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable',
      };
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert PDF to base64
    const arrayBuffer = await pdfFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `
You are a tour itinerary extraction expert. Extract ALL tour information from this PDF and return it as valid JSON.

Extract the following information:
1. Tour name/title
2. Destination (city, country)
3. Duration in days
4. Overall description
5. Base price (if mentioned)
6. Day-by-day breakdown with:
   - Day number
   - Day title (e.g., "Arrival & Desert Safari")
   - Day description
   - Activities (with time, title, description, location, price if mentioned)
   - Hotel/accommodation (name, star rating, room type, price per night if mentioned, amenities)

Important rules:
- Mark activities as "optional" if the PDF says "optional", "upgrade", or similar
- Mark activities as "premium" if the PDF says "premium", "luxury upgrade", or similar
- Extract prices as numbers only (no currency symbols)
- Extract times in "HH:MM AM/PM" format (e.g., "09:00 AM")
- Star ratings should be 1-5
- If no base price is found, omit the field
- Days should be sequential (1, 2, 3, etc.)

Return ONLY valid JSON in this exact structure (no markdown, no explanations):
{
  "name": "Tour name",
  "destination": "City, Country",
  "duration_days": 5,
  "description": "Overall tour description",
  "base_price": 2500,
  "days": [
    {
      "day_number": 1,
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

    const response = result.response;
    const text = response.text();

    // Clean up response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parse JSON
    const extractedData: ExtractedTourData = JSON.parse(jsonText);

    // Validate structure
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
    console.error('Error extracting tour from PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate extracted tour data
 */
export function validateExtractedTour(data: ExtractedTourData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.length < 3) {
    errors.push('Tour name is required and must be at least 3 characters');
  }

  if (!data.destination || data.destination.length < 3) {
    errors.push('Destination is required and must be at least 3 characters');
  }

  if (!data.duration_days || data.duration_days < 1 || data.duration_days > 365) {
    errors.push('Duration must be between 1 and 365 days');
  }

  if (!data.days || data.days.length === 0) {
    errors.push('At least one day is required');
  }

  if (data.days) {
    data.days.forEach((day, index) => {
      if (day.day_number !== index + 1) {
        errors.push(`Day ${index + 1} has incorrect day_number: ${day.day_number}`);
      }

      if (!day.title || day.title.length < 3) {
        errors.push(`Day ${day.day_number} title is required`);
      }

      if (!day.activities || day.activities.length === 0) {
        errors.push(`Day ${day.day_number} must have at least one activity`);
      }

      day.activities?.forEach((activity, actIndex) => {
        if (!activity.title || activity.title.length < 3) {
          errors.push(`Day ${day.day_number}, Activity ${actIndex + 1} title is required`);
        }
      });

      if (day.accommodation) {
        if (!day.accommodation.hotel_name || day.accommodation.hotel_name.length < 3) {
          errors.push(`Day ${day.day_number} accommodation name is required`);
        }

        if (day.accommodation.star_rating && (day.accommodation.star_rating < 1 || day.accommodation.star_rating > 5)) {
          errors.push(`Day ${day.day_number} star rating must be between 1 and 5`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
