import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSocialOAuthState } from '@/lib/security/social-oauth-state';
import { safeErrorMessage } from '@/lib/security/safe-error';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://travelsuite-rust.vercel.app';
const LINKEDIN_REDIRECT_URI = `${APP_URL}/api/social/oauth/callback?provider=linkedin`;

const LINKEDIN_SCOPES = 'openid profile email w_member_social';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        if (!LINKEDIN_CLIENT_ID) {
            return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID not configured' }, { status: 500 });
        }

        const state = createSocialOAuthState(user.id);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: LINKEDIN_CLIENT_ID,
            redirect_uri: LINKEDIN_REDIRECT_URI,
            state,
            scope: LINKEDIN_SCOPES,
        });

        const oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
        return NextResponse.redirect(oauthUrl);
    } catch (error: unknown) {
        console.error('Error initiating LinkedIn OAuth:', error);
        return NextResponse.json(
            { error: safeErrorMessage(error, 'Failed to initiate LinkedIn OAuth') },
            { status: 500 }
        );
    }
}
