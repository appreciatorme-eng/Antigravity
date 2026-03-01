import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isMockSocialPublishingEnabled(): boolean {
    const explicit = process.env.SOCIAL_PUBLISH_MOCK_ENABLED?.trim().toLowerCase();
    if (explicit === "true") return true;
    if (explicit === "false") return false;
    return process.env.NODE_ENV !== "production";
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isMockSocialPublishingEnabled()) {
            return NextResponse.json(
                {
                    error:
                        'Social publishing provider is not configured. Set SOCIAL_PUBLISH_MOCK_ENABLED=true only for test/dev environments.',
                },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { postId, platforms } = body; // platforms is an array of connection_ids or 'instagram' / 'facebook'

        if (!postId || !platforms || platforms.length === 0) {
            return NextResponse.json({ error: 'Post ID and platforms are required' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        // Get the post
        const { data: post, error: postError } = await supabase
            .from('social_posts')
            .select('*')
            .eq('id', postId)
            .eq('organization_id', profile.organization_id)
            .single();

        if (postError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (!post.rendered_image_url && (!post.rendered_image_urls || post.rendered_image_urls.length === 0)) {
            return NextResponse.json({ error: 'Post has no rendered image to publish' }, { status: 400 });
        }

        // Get connections for the platforms requested
        const { data: connections, error: connError } = await supabase
            .from('social_connections')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .in('platform', platforms);

        if (connError || !connections || connections.length === 0) {
            return NextResponse.json({ error: 'No social connections found for requested platforms' }, { status: 400 });
        }

        // Mock publishing path for local/testing environments only.
        const publishResults: any[] = [];

        for (const conn of connections) {
            try {
                // MOCK PUBLISHING: Replace with real Meta Graph API call
                console.log(`Publishing post ${postId} to ${conn.platform} page ${conn.platform_page_id}...`);

                // Simulate success
                const platformPostId = `mock_${conn.platform}_${Date.now()}`;
                const platformPostUrl = `https://${conn.platform}.com/p/${platformPostId}`;

                publishResults.push({
                    platform: conn.platform,
                    status: 'success',
                    platformPostId,
                    platformPostUrl
                });
            } catch (err: any) {
                publishResults.push({
                    platform: conn.platform,
                    status: 'failed',
                    error: err.message
                });
            }
        }

        // Update post status to published if at least one platform succeeded
        if (publishResults.some(r => r.status === 'success')) {
            await supabase
                .from('social_posts')
                .update({ status: 'published' })
                .eq('id', postId);
        }

        return NextResponse.json({ success: true, results: publishResults });
    } catch (error: any) {
        console.error('Error publishing post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
