import 'server-only';

/**
 * AI-Powered URL Tour Scraper (server-only)
 *
 * Uses Google Gemini to extract tour information from website URLs.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedTourData } from './types';

function getGeminiKey(apiKey?: string) {
  return (
    apiKey ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    // Backwards compatibility with existing deployments; prefer non-public keys.
    process.env.NEXT_PUBLIC_GEMINI_API_KEY
  );
}

async function fetchHTMLContent(url: string): Promise<{ success: boolean; html?: string; error?: string }> {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        // Some sites block default user agents; keep this minimal.
        'User-Agent': 'Mozilla/5.0',
      },
    });

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
    return { success: true, html };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function extractTourFromURL(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; data?: ExtractedTourData; error?: string }> {
  try {
    try {
      new URL(url);
    } catch {
      return { success: false, error: 'Invalid URL format' };
    }

    const htmlResult = await fetchHTMLContent(url);
    if (!htmlResult.success || !htmlResult.html) {
      return { success: false, error: htmlResult.error || 'Failed to fetch HTML' };
    }

    const key = getGeminiKey(apiKey);
    if (!key) {
      return {
        success: false,
        error: 'Missing Gemini API key. Set GOOGLE_API_KEY (recommended) in your environment.',
      };
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a tour itinerary extraction expert. Extract ALL tour information from this HTML webpage and return it as valid JSON.

The HTML is from a tour operator's website. Extract the following information:
1. Tour name/title
2. Destination (city, country)
3. Duration in days
4. Overall description
5. Base price (total tour price if mentioned)
6. Day-by-day breakdown with activities and accommodation

Important rules:
- Mark activities as "optional" if described as optional, upgrade, or add-on
- Mark activities as "premium" if described as premium, luxury, or deluxe upgrade
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

HTML Content:
${htmlResult.html.substring(0, 50000)}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const extractedData: ExtractedTourData = JSON.parse(jsonText);

    if (!extractedData.name || !extractedData.destination || !extractedData.duration_days || !extractedData.days) {
      return { success: false, error: 'Invalid extracted data: missing required fields' };
    }

    return { success: true, data: extractedData };
  } catch (error) {
    console.error('Error extracting tour from URL:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getTourPreviewFromURL(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; preview?: { title: string; destination: string; duration: string }; error?: string }> {
  try {
    const htmlResult = await fetchHTMLContent(url);
    if (!htmlResult.success || !htmlResult.html) {
      return { success: false, error: htmlResult.error || 'Failed to fetch HTML' };
    }

    const key = getGeminiKey(apiKey);
    if (!key) {
      return {
        success: false,
        error: 'Missing Gemini API key. Set GOOGLE_API_KEY (recommended) in your environment.',
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
    const text = result.response.text();

    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const preview = JSON.parse(jsonText);

    return { success: true, preview };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

