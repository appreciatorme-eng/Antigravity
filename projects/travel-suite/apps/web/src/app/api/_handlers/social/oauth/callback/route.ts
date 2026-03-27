import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { consumeSocialOAuthState } from '@/lib/security/social-oauth-state';
import { encryptSocialToken } from '@/lib/security/social-token-crypto';
import { exchangeGoogleCode, getGoogleUserInfo } from '@/lib/external/google.server';
import { exchangeLinkedInCode, getLinkedInProfile } from '@/lib/external/linkedin.server';
import { logError } from "@/lib/observability/logger";

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI ?? '';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tripbuilt.com';
const GOOGLE_REDIRECT_URI = `${APP_URL}/api/social/oauth/callback?provider=google`;
const LINKEDIN_REDIRECT_URI = `${APP_URL}/api/social/oauth/callback?provider=linkedin`;

type FacebookPage = {
    id?: string;
    access_token?: string;
};

function redirectWithError(req: Request, errorCode: string) {
    return NextResponse.redirect(new URL(`/social?error=${encodeURIComponent(errorCode)}`, req.url));
}

function redirectWithSuccess(req: Request, platform?: string) {
    // Gmail connects redirect to settings page, not social page
    if (platform === "google") {
        return NextResponse.redirect(new URL('/settings?setup=gmail&gmail=connected', req.url));
    }
    return NextResponse.redirect(new URL('/social?success=oauth_complete', req.url));
}

async function exchangeFacebookToken(params: Record<string, string>): Promise<Response> {
    return fetch('https://graph.facebook.com/v20.0/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
    });
}

async function handleFacebookCallback(req: Request, code: string, userId: string): Promise<Response> {
    if (!META_APP_ID || !META_APP_SECRET) {
        return redirectWithError(req, 'oauth_not_configured');
    }

    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

    if (!profile?.organization_id) {
        return redirectWithError(req, 'no_organization');
    }

    const tokenRes = await exchangeFacebookToken({
        client_id: META_APP_ID,
        redirect_uri: META_REDIRECT_URI,
        client_secret: META_APP_SECRET,
        code,
    });

    if (!tokenRes.ok) {
        logError('FB token error', await tokenRes.text());
        return redirectWithError(req, 'oauth_failed');
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    const shortLivedToken = tokenData.access_token;
    if (!shortLivedToken) {
        return redirectWithError(req, 'oauth_token_missing');
    }

    const longTokenRes = await exchangeFacebookToken({
        grant_type: 'fb_exchange_token',
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        fb_exchange_token: shortLivedToken,
    });

    const longTokenData = (await longTokenRes.json()) as { access_token?: string };
    const longLivedToken = longTokenData.access_token || shortLivedToken;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    const pagesRes = await fetch('https://graph.facebook.com/v20.0/me/accounts', {
        headers: { Authorization: `Bearer ${longLivedToken}` },
    });
    if (!pagesRes.ok) {
        logError('Failed to fetch Facebook pages', await pagesRes.text());
        return redirectWithError(req, 'oauth_pages_fetch_failed');
    }

    const pagesData = (await pagesRes.json()) as { data?: FacebookPage[] };
    const pages = Array.isArray(pagesData.data) ? pagesData.data : [];

    for (const page of pages) {
        if (!page.id || !page.access_token) continue;

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
            { onConflict: 'organization_id,platform,platform_page_id' }
        );

        const fbPageIgRes = await fetch(
            `https://graph.facebook.com/v20.0/${page.id}?fields=instagram_business_account`,
            { headers: { Authorization: `Bearer ${page.access_token}` } }
        );

        if (!fbPageIgRes.ok) continue;

        const fbPageIgData = (await fbPageIgRes.json()) as {
            instagram_business_account?: { id?: string };
        };

        const igId = fbPageIgData.instagram_business_account?.id;
        if (!igId) continue;

        await supabaseAdmin.from('social_connections').upsert(
            {
                organization_id: profile.organization_id,
                platform: 'instagram',
                platform_page_id: igId,
                access_token_encrypted: encryptedPageToken,
                token_expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id,platform,platform_page_id' }
        );
    }

    return redirectWithSuccess(req);
}

async function handleGoogleCallback(req: Request, code: string, userId: string): Promise<Response> {
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

    if (!profile?.organization_id) {
        return redirectWithError(req, 'no_organization');
    }

    let tokens;
    try {
        tokens = await exchangeGoogleCode(code, GOOGLE_REDIRECT_URI);
    } catch (err) {
        logError('Google code exchange error', err);
        return redirectWithError(req, 'oauth_failed');
    }

    if (!tokens.access_token) {
        return redirectWithError(req, 'oauth_token_missing');
    }

    let userInfo;
    try {
        userInfo = await getGoogleUserInfo(tokens.access_token);
    } catch (err) {
        logError('Google user info error', err);
        return redirectWithError(req, 'oauth_failed');
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in ?? 3600));

    const encryptedToken = encryptSocialToken(tokens.access_token);
    const encryptedRefresh = tokens.refresh_token ? encryptSocialToken(tokens.refresh_token) : null;

    await supabaseAdmin.from('social_connections').upsert(
        {
            organization_id: profile.organization_id,
            platform: 'google',
            platform_page_id: userInfo.email,
            access_token_encrypted: encryptedToken,
            refresh_token_encrypted: encryptedRefresh,
            token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,platform,platform_page_id' }
    );

    return redirectWithSuccess(req, "google");
}

async function handleLinkedInCallback(req: Request, code: string, userId: string): Promise<Response> {
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

    if (!profile?.organization_id) {
        return redirectWithError(req, 'no_organization');
    }

    let tokens;
    try {
        tokens = await exchangeLinkedInCode(code, LINKEDIN_REDIRECT_URI);
    } catch (err) {
        logError('LinkedIn code exchange error', err);
        return redirectWithError(req, 'oauth_failed');
    }

    if (!tokens.access_token) {
        return redirectWithError(req, 'oauth_token_missing');
    }

    let liProfile;
    try {
        liProfile = await getLinkedInProfile(tokens.access_token);
    } catch (err) {
        logError('LinkedIn profile fetch error', err);
        return redirectWithError(req, 'oauth_failed');
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in ?? 5184000));

    const encryptedToken = encryptSocialToken(tokens.access_token);

    await supabaseAdmin.from('social_connections').upsert(
        {
            organization_id: profile.organization_id,
            platform: 'linkedin',
            platform_page_id: liProfile.id,
            access_token_encrypted: encryptedToken,
            refresh_token_encrypted: null,
            token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,platform,platform_page_id' }
    );

    return redirectWithSuccess(req);
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const stateToken = url.searchParams.get('state');
        const provider = url.searchParams.get('provider') ?? 'facebook';

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

        if (provider === 'google') {
            return handleGoogleCallback(req, code, userId);
        }

        if (provider === 'linkedin') {
            return handleLinkedInCallback(req, code, userId);
        }

        return handleFacebookCallback(req, code, userId);
    } catch (error: unknown) {
        logError('Callback error', error);
        return redirectWithError(req, 'server_error');
    }
}
