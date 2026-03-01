import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSocialOAuthState } from '@/lib/security/social-oauth-state';

const META_APP_ID = process.env.META_APP_ID;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:3000/api/social/oauth/callback'; // fallback for local

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        if (!META_APP_ID) {
            return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 });
        }

        // Generate state to verify callback
        const state = createSocialOAuthState(user.id);

        // Redirect URL for Facebook OAuth
        const scope = 'instagram_basic,instagram_content_publish,pages_manage_posts';
        const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&state=${state}&scope=${scope}`;

        return NextResponse.redirect(oauthUrl);
    } catch (error: unknown) {
        console.error('Error initiating Facebook OAuth:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to initiate OAuth flow' },
            { status: 500 }
        );
    }
}
