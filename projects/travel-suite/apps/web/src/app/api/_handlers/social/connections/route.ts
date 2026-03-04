import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        const { data: connections, error } = await supabase
            .from('social_connections')
            .select('id, platform, platform_page_id, token_expires_at, updated_at')
            .eq('organization_id', profile.organization_id);

        if (error) throw error;

        return NextResponse.json(connections);
    } catch (error: any) {
        console.error('Error fetching social connections:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
