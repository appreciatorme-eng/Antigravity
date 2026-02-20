import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocation } from '@/lib/geocoding-with-cache';

/**
 * Test endpoint to verify geocoding is working
 * GET /api/test-geocoding?location=Tokyo
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location') || 'Senso-ji Temple, Tokyo';

    // Check environment variables
    const hasMapboxToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔍 Geocoding test for:', location);
    console.log('Environment check:', {
        hasMapboxToken,
        hasSupabaseUrl,
        hasSupabaseKey,
    });

    try {
        const result = await geocodeLocation(location);

        return NextResponse.json({
            success: true,
            location,
            result,
            environment: {
                hasMapboxToken,
                hasSupabaseUrl,
                hasSupabaseKey,
                mapboxTokenLength: process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.length || 0,
            },
            message: result
                ? `Successfully geocoded: ${location}`
                : 'Geocoding returned null - check logs for details',
        });
    } catch (error) {
        console.error('Geocoding test error:', error);
        return NextResponse.json({
            success: false,
            location,
            error: error instanceof Error ? error.message : 'Unknown error',
            environment: {
                hasMapboxToken,
                hasSupabaseUrl,
                hasSupabaseKey,
            },
        }, { status: 500 });
    }
}
