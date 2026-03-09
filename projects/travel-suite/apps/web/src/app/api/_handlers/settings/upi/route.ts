import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeErrorMessage } from '@/lib/security/safe-error';

// Validates standard UPI handle: localpart@provider (e.g. name@upi, name@okaxis)
const UPI_REGEX = /^[\w.\-+]+@[\w.\-]+$/;

// POST /api/settings/upi — save or update UPI ID for the org
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await req.json()) as { upiId?: string };
        const upiId = body.upiId?.trim() ?? '';

        if (!upiId) {
            return NextResponse.json({ error: 'upiId is required' }, { status: 400 });
        }

        if (!UPI_REGEX.test(upiId)) {
            return NextResponse.json(
                { error: 'Invalid UPI ID format. Expected format: name@upi or name@bank' },
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
                upi_id: upiId,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' }
        );

        return NextResponse.json({ success: true, upiId });
    } catch (error: unknown) {
        console.error('UPI save error:', error);
        return NextResponse.json(
            { error: safeErrorMessage(error, 'Failed to save UPI ID') },
            { status: 500 }
        );
    }
}

// GET /api/settings/upi — load saved UPI ID for the org
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
            return NextResponse.json({ upiId: null });
        }

        const { data: settings } = await supabaseAdmin
            .from('organization_settings')
            .select('upi_id')
            .eq('organization_id', profile.organization_id)
            .single();

        return NextResponse.json({ upiId: settings?.upi_id ?? null });
    } catch (error: unknown) {
        console.error('UPI load error:', error);
        return NextResponse.json({ upiId: null });
    }
}
