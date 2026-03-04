import { NextRequest, NextResponse } from 'next/server';
import { getCityCenter } from '@/lib/geocoding-with-cache';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAdmin } from '@/lib/auth/admin';
import { sanitizeText } from '@/lib/security/sanitize';

function isDebugEndpointEnabled() {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.ENABLE_DEBUG_ENDPOINT === 'true' || process.env.ENABLE_DEBUG_ENDPOINT === '1';
}

/**
 * Debug endpoint to verify geocoding and AI are working
 * GET /api/debug?city=Mumbai       - test geocoding
 * GET /api/debug?test=gemini       - test Gemini AI
 */
export async function GET(req: NextRequest) {
  if (!isDebugEndpointEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const admin = await requireAdmin(req, { requireOrganization: false });
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(req.url);
  const city = sanitizeText(searchParams.get('city') || 'Mumbai', { maxLength: 80 });
  const test = sanitizeText(searchParams.get('test'), { maxLength: 40 });

  if (test === 'gemini') {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'No Google API key configured' }, { status: 500 });
    }
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent('Return JSON: {"greeting":"hello","model":"gemini-2.5-flash"}');
      const text = result.response.text();
      return NextResponse.json({ success: true, model: 'gemini-2.5-flash', response: JSON.parse(text) });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          model: 'gemini-2.5-flash',
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }

  try {
    const coords = await getCityCenter(city);

    if (coords) {
      const [lng, lat] = coords;
      return NextResponse.json({
        success: true,
        city,
        coordinates: { lat, lng },
        message: `Successfully geocoded ${city}`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        city,
        message: 'Geocoding returned null',
      },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        city,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
