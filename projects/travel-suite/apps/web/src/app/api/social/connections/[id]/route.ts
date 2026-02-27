import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;

        // Verify connection exists and belongs to this organization
        const { data: connection, error: getError } = await supabase
            .from('social_connections')
            .select('id')
            .eq('id', id)
            .eq('organization_id', profile.organization_id)
            .single();

        if (getError || !connection) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        const { error: deleteError } = await supabase
            .from('social_connections')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting social connection:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
