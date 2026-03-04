import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeSocialOAuthState } from '@/lib/security/social-oauth-state';
import { encryptSocialToken } from '@/lib/security/social-token-crypto';

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:3000/api/social/oauth/callback';

type FacebookPage = {
    id?: string;
    access_token?: string;
};

function redirectWithError(req: Request, errorCode: string) {
    return NextResponse.redirect(new URL(`/social?error=${encodeURIComponent(errorCode)}`, req.url));
}

function redirectWithSuccess(req: Request) {
    return NextResponse.redirect(new URL('/social?success=oauth_complete', req.url));
}

export async function GET(req: Request) {
    try {
        if (!META_APP_ID || !META_APP_SECRET) {
            return redirectWithError(req, 'oauth_not_configured');
        }

        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const stateToken = url.searchParams.get('state');

        if (!code) {
            return redirectWithError(req, 'no_code_provided');
        }

        if (!stateToken) {
            return redirectWithError(req, 'invalid_state');
        }

        const state = await consumeSocialOAuthState(stateToken);
        if (!state.ok) {
            return redirectWithError(req, state.reason);
        }

        const userId = state.userId;
        const supabaseAdmin = createAdminClient();

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', userId)
            .single();

        if (!profile?.organization_id) {
            return redirectWithError(req, 'no_organization');
        }

        const tokenRes = await fetch(
            `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(
                META_REDIRECT_URI
            )}&client_secret=${META_APP_SECRET}&code=${code}`
        );

        if (!tokenRes.ok) {
            const errBody = await tokenRes.text();
            console.error('FB token error:', errBody);
            return redirectWithError(req, 'oauth_failed');
        }

        const tokenData = (await tokenRes.json()) as { access_token?: string };
        const shortLivedToken = tokenData.access_token;
        if (!shortLivedToken) {
            return redirectWithError(req, 'oauth_token_missing');
        }

        const longTokenRes = await fetch(
            `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
        );

        const longTokenData = (await longTokenRes.json()) as { access_token?: string };
        const longLivedToken = longTokenData.access_token || shortLivedToken;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 60);

        const pagesRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${longLivedToken}`);
        if (!pagesRes.ok) {
            console.error('Failed to fetch Facebook pages:', await pagesRes.text());
            return redirectWithError(req, 'oauth_pages_fetch_failed');
        }

        const pagesData = (await pagesRes.json()) as { data?: FacebookPage[] };
        const pages = Array.isArray(pagesData.data) ? pagesData.data : [];

        for (const page of pages) {
            if (!page.id || !page.access_token) {
                continue;
            }

            const encryptedPageToken = encryptSocialToken(page.access_token);

            await supabaseAdmin.from('social_connections').upsert(
                {
                    organization_id: profile.organization_id,
                    platform: 'facebook',
                    platform_page_id: page.id,
                    access_token_encrypted: encryptedPageToken,
                    token_expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'organization_id,platform,platform_page_id',
                }
            );

            const fbPageIgRes = await fetch(
                `https://graph.facebook.com/v20.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
            );

            if (!fbPageIgRes.ok) {
                continue;
            }

            const fbPageIgData = (await fbPageIgRes.json()) as {
                instagram_business_account?: { id?: string };
            };

            const igId = fbPageIgData.instagram_business_account?.id;
            if (!igId) {
                continue;
            }

            await supabaseAdmin.from('social_connections').upsert(
                {
                    organization_id: profile.organization_id,
                    platform: 'instagram',
                    platform_page_id: igId,
                    access_token_encrypted: encryptedPageToken,
                    token_expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'organization_id,platform,platform_page_id',
                }
            );
        }

        return redirectWithSuccess(req);
    } catch (error: unknown) {
        console.error('Callback error:', error);
        return redirectWithError(req, 'server_error');
    }
}
