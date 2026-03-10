import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeErrorMessage } from '@/lib/security/safe-error';
import { getTripAdvisorLocationDetails, getTripAdvisorReviews } from '@/lib/external/tripadvisor.server';

const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;

// POST /api/integrations/tripadvisor — save location ID and validate it
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!TRIPADVISOR_API_KEY) {
            return NextResponse.json({ error: 'TRIPADVISOR_API_KEY not configured' }, { status: 500 });
        }

        const body = (await req.json()) as { locationId?: string };
        const locationId = body.locationId?.trim();

        if (!locationId || !/^\d+$/.test(locationId)) {
            return NextResponse.json({ error: 'Invalid location ID — must be a numeric TripAdvisor location ID' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 403 });
        }

        // Validate by hitting the TripAdvisor API
        let locationDetails;
        try {
            locationDetails = await getTripAdvisorLocationDetails(TRIPADVISOR_API_KEY, locationId);
        } catch {
            return NextResponse.json({ error: 'Invalid location ID or TripAdvisor API error' }, { status: 400 });
        }

        await supabaseAdmin.from('organization_settings').upsert(
            {
                organization_id: profile.organization_id,
                tripadvisor_location_id: locationId,
                tripadvisor_connected_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' }
        );

        return NextResponse.json({
            success: true,
            locationName: locationDetails.name,
            rating: locationDetails.rating,
            numReviews: locationDetails.num_reviews,
        });
    } catch (error: unknown) {
        console.error('TripAdvisor connect error:', error);
        return NextResponse.json(
            { error: safeErrorMessage(error, "Request failed") },
            { status: 500 }
        );
    }
}

// GET /api/integrations/tripadvisor — fetch recent reviews for the org
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!TRIPADVISOR_API_KEY) {
            return NextResponse.json({ error: 'TRIPADVISOR_API_KEY not configured' }, { status: 500 });
        }

        const supabaseAdmin = createAdminClient();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 403 });
        }

        const { data: settings } = await supabaseAdmin
            .from('organization_settings')
            .select('tripadvisor_location_id')
            .eq('organization_id', profile.organization_id)
            .single();

        if (!settings?.tripadvisor_location_id) {
            return NextResponse.json({ reviews: [], connected: false });
        }

        const reviews = await getTripAdvisorReviews(TRIPADVISOR_API_KEY, settings.tripadvisor_location_id);
        return NextResponse.json({ reviews, connected: true });
    } catch (error: unknown) {
        console.error('TripAdvisor reviews fetch error:', error);
        return NextResponse.json(
            { error: safeErrorMessage(error, "Request failed") },
            { status: 500 }
        );
    }
}
