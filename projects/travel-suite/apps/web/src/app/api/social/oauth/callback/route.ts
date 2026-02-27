import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:3000/api/social/oauth/callback';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const stateStr = url.searchParams.get('state');

        if (!code) {
            return NextResponse.redirect(new URL('/social?error=no_code_provided', req.url));
        }

        // Verify state
        if (!stateStr) {
            return NextResponse.redirect(new URL('/social?error=invalid_state', req.url));
        }

        const stateInfo = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf8'));
        const userId = stateInfo.userId;

        if (!userId) {
            return NextResponse.redirect(new URL('/social?error=invalid_state_user', req.url));
        }

        const supabaseAdmin = createAdminClient();

        // 1. Get organization ID
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', userId)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.redirect(new URL('/social?error=no_organization', req.url));
        }

        // 2. Exchange code for short-lived access token
        const tokenRes = await fetch(
            `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&client_secret=${META_APP_SECRET}&code=${code}`
        );

        if (!tokenRes.ok) {
            const errBody = await tokenRes.text();
            console.error('FB token error:', errBody);
            return NextResponse.redirect(new URL('/social?error=oauth_failed', req.url));
        }

        const tokenData = await tokenRes.json();
        const shortLivedToken = tokenData.access_token;

        // 3. Exchange short-lived token for long-lived token (60 days)
        const longTokenRes = await fetch(
            `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
        );

        const longTokenData = await longTokenRes.json();
        const longLivedToken = longTokenData.access_token || shortLivedToken;

        // Ensure token expires eventually (60 days approx based on long lived token)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60);

        // 4. Fetch user's pages
        const pagesRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${longLivedToken}`);
        const pagesData = await pagesRes.json();

        // For simplicity we create social_connections for Facebook pages.
        // If Instagram Professional account is linked, we would also query the IG account ID
        // e.g. /v20.0/{page-id}?fields=instagram_business_account&access_token={page_token}

        for (const page of (pagesData.data || [])) {
            // Upsert Facebook connection
            await supabaseAdmin.from('social_connections').upsert({
                organization_id: profile.organization_id,
                platform: 'facebook',
                platform_page_id: page.id,
                access_token_encrypted: page.access_token, // Ideally encrypted!
                token_expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'organization_id,platform,platform_page_id'
            });

            // Try resolving Instagram from Facebook Page
            const fbPageIgRes = await fetch(`https://graph.facebook.com/v20.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
            const fbPageIgData = await fbPageIgRes.json();

            if (fbPageIgData && fbPageIgData.instagram_business_account) {
                const igId = fbPageIgData.instagram_business_account.id;

                // Upsert Instagram connection
                await supabaseAdmin.from('social_connections').upsert({
                    organization_id: profile.organization_id,
                    platform: 'instagram',
                    platform_page_id: igId,
                    access_token_encrypted: page.access_token, // Uses FB page access token
                    token_expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'organization_id,platform,platform_page_id'
                });
            }
        }

        // Successfully authenticated!
        return NextResponse.redirect(new URL('/social?success=oauth_complete', req.url));

    } catch (error: any) {
        console.error('Callback error:', error);
        return NextResponse.redirect(new URL('/social?error=server_error', req.url));
    }
}
