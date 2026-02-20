import { NextRequest, NextResponse } from 'next/server';
import { getCityCenter } from '@/lib/geocoding-with-cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Debug endpoint to verify geocoding and AI are working
 * GET /api/debug?city=Mumbai       - test geocoding
 * GET /api/debug?test=gemini       - test Gemini AI
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || 'Mumbai';
    const test = searchParams.get('test');

    // Test Gemini AI
    if (test === 'gemini') {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'No Google API key configured' }, { status: 500 });
        }
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { responseMimeType: 'application/json' },
            });
            const result = await model.generateContent('Return JSON: {"greeting":"hello","model":"gemini-2.0-flash"}');
            const text = result.response.text();
            return NextResponse.json({ success: true, model: 'gemini-2.0-flash', response: JSON.parse(text) });
        } catch (error) {
            return NextResponse.json({
                success: false,
                model: 'gemini-2.0-flash',
                error: error instanceof Error ? error.message : String(error),
            }, { status: 500 });
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
                env: {
                    hasMapboxToken: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
                    hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                    hasGoogleKey: !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY,
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                city,
                message: 'Geocoding returned null',
                env: {
                    hasMapboxToken: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
                    hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                    hasGoogleKey: !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY,
                }
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            city,
            error: error instanceof Error ? error.message : 'Unknown error',
            env: {
                hasMapboxToken: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
                hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasGoogleKey: !!process.env.GOOGLE_GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY,
            }
        }, { status: 500 });
    }
}
