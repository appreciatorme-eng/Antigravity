import { NextRequest, NextResponse } from 'next/server';
import { getCityCenter } from '@/lib/geocoding-with-cache';

/**
 * Debug endpoint to verify geocoding is working
 * GET /api/debug
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || 'Mumbai';

    try {
        console.log(`🔍 Testing geocoding for: ${city}`);

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
        console.error('Debug geocoding error:', error);
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
