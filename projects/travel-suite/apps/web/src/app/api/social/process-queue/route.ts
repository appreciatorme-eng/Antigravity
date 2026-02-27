import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        // Authenticate the request via secret or Vercel Cron header
        const authHeader = req.headers.get('authorization');
        const isCron = req.headers.get('x-vercel-cron') === '1';

        if (!isCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createAdminClient();

        // Find pending queue items older than now() that are not currently processing
        // and have attempts < 3
        const { data: pendingItems, error: fetchError } = await supabaseAdmin
            .from('social_post_queue')
            .select(`
                *,
                social_posts!inner (
                   *
                ),
                social_connections!inner (
                    platform_page_id,
                    access_token_encrypted
                )
            `)
            .eq('status', 'pending')
            .lt('scheduled_for', new Date().toISOString())
            .lt('attempts', 3)
            .order('scheduled_for', { ascending: true })
            .limit(10); // Batch size 10 to prevent timeouts

        if (fetchError) throw fetchError;

        if (!pendingItems || pendingItems.length === 0) {
            return NextResponse.json({ message: 'No pending items' });
        }

        // Mark items as processing immediately
        const processingIds = pendingItems.map(item => item.id);
        await supabaseAdmin
            .from('social_post_queue')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .in('id', processingIds);

        const results = [];

        for (const item of pendingItems) {
            try {
                // Determine platform publish capability
                const platform = item.platform;
                const pageId = item.social_connections.platform_page_id;
                // const accessToken = decrypt(item.social_connections.access_token_encrypted); // to implement later

                console.log(`[Cron] Processing social publish to ${platform} for page ${pageId}`);

                // MOCK PUBLISHING: Replace with real Meta API Request
                // e.g. POST https://graph.facebook.com/v20.0/${pageId}/photos
                const platformPostId = `cron_${platform}_${Date.now()}`;
                const platformPostUrl = `https://${platform}.com/p/${platformPostId}`;

                // Mark successful
                await supabaseAdmin
                    .from('social_post_queue')
                    .update({
                        status: 'sent',
                        platform_post_id: platformPostId,
                        platform_post_url: platformPostUrl,
                        attempts: item.attempts + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', item.id);

                // Check remaining queue items for same post
                const { count } = await supabaseAdmin
                    .from('social_post_queue')
                    .select('id', { count: 'exact', head: true })
                    .eq('post_id', item.post_id)
                    .in('status', ['pending', 'processing']);

                // If no more items pending/processing, mark post 'published'
                if (count === 0) {
                    await supabaseAdmin
                        .from('social_posts')
                        .update({ status: 'published' })
                        .eq('id', item.post_id);
                }

                results.push({ id: item.id, status: 'success' });
            } catch (err: any) {
                console.error(`Failed to publish item ${item.id}:`, err);

                // Keep pending if under max attempts
                const status = item.attempts + 1 >= 3 ? 'failed' : 'pending';

                await supabaseAdmin
                    .from('social_post_queue')
                    .update({
                        status,
                        error_message: err.message,
                        attempts: item.attempts + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', item.id);

                results.push({ id: item.id, status: 'failed', error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results
        });
    } catch (error: any) {
        console.error('Error processing social queue:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
