import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { postId, scheduleDate, platforms } = body;

        if (!postId || !scheduleDate || !platforms || platforms.length === 0) {
            return NextResponse.json({ error: 'Post ID, scheduled date, and platforms are required' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        // Get post to verify ownership
        const { data: post, error: postError } = await supabase
            .from('social_posts')
            .select('*')
            .eq('id', postId)
            .eq('organization_id', profile.organization_id)
            .single();

        if (postError || !post) {
            return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
        }

        // Fetch connections
        const { data: connections, error: connError } = await supabase
            .from('social_connections')
            .select('id, platform')
            .eq('organization_id', profile.organization_id)
            .in('platform', platforms);

        if (connError || !connections || connections.length === 0) {
            return NextResponse.json({ error: 'Platform connections not found' }, { status: 400 });
        }

        const queueInserts = connections.map(conn => ({
            post_id: postId,
            platform: conn.platform,
            connection_id: conn.id,
            scheduled_for: new Date(scheduleDate).toISOString(),
            status: 'pending'
        }));

        const { data: scheduledItems, error } = await supabase
            .from('social_post_queue')
            .insert(queueInserts)
            .select();

        if (error) {
            throw error;
        }

        // Update post status to scheduled
        await supabase
            .from('social_posts')
            .update({ status: 'scheduled' })
            .eq('id', postId);

        return NextResponse.json({ success: true, count: scheduledItems.length, data: scheduledItems });
    } catch (error: any) {
        console.error('Error Scheduling Post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
