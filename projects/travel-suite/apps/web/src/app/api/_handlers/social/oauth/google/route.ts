import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSocialOAuthState } from '@/lib/security/social-oauth-state';
import { logError } from "@/lib/observability/logger";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tripbuilt.com';
const GOOGLE_REDIRECT_URI = `${APP_URL}/api/social/oauth/callback?provider=google`;

const GOOGLE_SCOPES = [
    'email',
    'profile',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
].join(' ');

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        if (!GOOGLE_CLIENT_ID) {
            return NextResponse.redirect(new URL('/admin/settings?oauth_error=google_not_configured', req.url));
        }

        const state = createSocialOAuthState(user.id);

        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: GOOGLE_SCOPES,
            state,
            access_type: 'offline',
            prompt: 'consent',
        });

        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        return NextResponse.redirect(oauthUrl);
    } catch (error: unknown) {
        logError('Error initiating Google OAuth', error);
        return NextResponse.redirect(new URL('/admin/settings?oauth_error=google_failed', req.url));
    }
}
