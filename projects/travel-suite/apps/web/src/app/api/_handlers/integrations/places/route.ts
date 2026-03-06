import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// POST /api/integrations/places — validate Maps key and mark org as enabled
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!GOOGLE_MAPS_API_KEY) {
            return NextResponse.json({ error: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not configured' }, { status: 500 });
        }

        // Validate the API key works by calling the Places text search API
        const testUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=hotel&key=${GOOGLE_MAPS_API_KEY}`;
        const testRes = await fetch(testUrl);
        const testData = (await testRes.json()) as { status?: string; error_message?: string };

        if (testData.status === 'REQUEST_DENIED') {
            return NextResponse.json(
                { error: `API key rejected: ${testData.error_message ?? 'REQUEST_DENIED'}` },
                { status: 400 }
            );
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

        await supabaseAdmin.from('organization_settings').upsert(
            {
                organization_id: profile.organization_id,
                google_places_enabled: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' }
        );

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Google Places activation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to activate Google Places' },
            { status: 500 }
        );
    }
}

// GET /api/integrations/places — check if Places is enabled for the org
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createAdminClient();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ enabled: false });
        }

        const { data: settings } = await supabaseAdmin
            .from('organization_settings')
            .select('google_places_enabled')
            .eq('organization_id', profile.organization_id)
            .single();

        return NextResponse.json({ enabled: settings?.google_places_enabled ?? false });
    } catch (error: unknown) {
        console.error('Google Places status check error:', error);
        return NextResponse.json({ enabled: false });
    }
}
