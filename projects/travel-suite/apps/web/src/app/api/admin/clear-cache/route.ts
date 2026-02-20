import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin endpoint to clear itinerary cache
 * Use this to force regeneration with geocoding for all itineraries
 *
 * GET /api/admin/clear-cache
 * GET /api/admin/clear-cache?destination=Tokyo (clear specific destination)
 */
export async function GET(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({
            error: 'Supabase not configured'
        }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(req.url);
    const destination = searchParams.get('destination');

    try {
        let query = supabase.from('itinerary_cache').delete();

        if (destination) {
            // Clear specific destination only
            query = query.ilike('destination', destination);
            console.log(`🗑️ Clearing cache for destination: ${destination}`);
        } else {
            // Clear all cache
            query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            console.log('🗑️ Clearing ALL itinerary cache');
        }

        const { error, count } = await query;

        if (error) {
            console.error('Cache clear error:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: destination
                ? `Cache cleared for destination: ${destination}`
                : 'All cache cleared',
            clearedCount: count || 0
        });
    } catch (err) {
        console.error('Cache clear exception:', err);
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        }, { status: 500 });
    }
}
