/**
 * AI-Powered URL Tour Scraper
 *
 * Uses Google Gemini to extract tour information from website URLs
 * Example: https://gobuddyadventures.com/tour/dubai
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedTourData } from './pdf-extractor';

/**
 * Fetch HTML content from URL
 */
async function fetchHTMLContent(url: string): Promise<{ success: boolean; html?: string; error?: string }> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return {
        success: false,
        error: 'URL does not return HTML content',
      };
    }

    const html = await response.text();

    return {
      success: true,
      html,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract tour data from URL using Gemini AI
 */
export async function extractTourFromURL(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; data?: ExtractedTourData; error?: string }> {
  try {
    // Validate URL
    try {
      new URL(url);
    } catch {
      return {
        success: false,
        error: 'Invalid URL format',
      };
    }

    // Fetch HTML content
    const htmlResult = await fetchHTMLContent(url);
    if (!htmlResult.success || !htmlResult.html) {
      return {
        success: false,
        error: htmlResult.error || 'Failed to fetch HTML',
      };
    }

    const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!key) {
      return {
        success: false,
        error: 'Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable',
      };
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a tour itinerary extraction expert. Extract ALL tour information from this HTML webpage and return it as valid JSON.

The HTML is from a tour operator's website. Extract the following information:
1. Tour name/title (look for main heading, page title, or tour name)
2. Destination (city, country)
3. Duration in days (look for "5 days", "3D/2N", etc.)
4. Overall description (tour overview or summary)
5. Base price (total tour price if mentioned)
6. Day-by-day breakdown with:
   - Day number (1, 2, 3, etc.)
   - Day title (e.g., "Arrival & Desert Safari")
   - Day description
   - Activities (with time if mentioned, title, description, location, price if mentioned)
   - Hotel/accommodation (name, star rating, room type, price per night if mentioned, amenities)

Important rules:
- Mark activities as "optional" if described as optional, upgrade, or add-on
- Mark activities as "premium" if described as premium, luxury, or deluxe upgrade
- Extract prices as numbers only (no currency symbols)
- Extract times in "HH:MM AM/PM" format (e.g., "09:00 AM")
- Star ratings should be 1-5
- If no base price is found, omit the field
- Days should be sequential (1, 2, 3, etc.)
- If the itinerary is scattered across the page, consolidate it properly
- Look for sections with headers like "Itinerary", "Day by Day", "Schedule", etc.

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

HTML Content:
${htmlResult.html.substring(0, 50000)}
`;

    const result = await model.generateContent(prompt);
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
    console.error('Error extracting tour from URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract tour preview from URL (lightweight, no full extraction)
 * Useful for showing a quick preview before full extraction
 */
export async function getTourPreviewFromURL(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; preview?: { title: string; destination: string; duration: string }; error?: string }> {
  try {
    const htmlResult = await fetchHTMLContent(url);
    if (!htmlResult.success || !htmlResult.html) {
      return {
        success: false,
        error: htmlResult.error || 'Failed to fetch HTML',
      };
    }

    const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!key) {
      return {
        success: false,
        error: 'Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable',
      };
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Extract just the basic tour information from this HTML. Return ONLY valid JSON:
{
  "title": "Tour name",
  "destination": "City, Country",
  "duration": "5 days" or "3D/2N" or similar
}

HTML Content (first 10000 chars):
${htmlResult.html.substring(0, 10000)}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const preview = JSON.parse(jsonText);

    return {
      success: true,
      preview,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
