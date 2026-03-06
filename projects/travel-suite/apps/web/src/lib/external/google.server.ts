// Google OAuth + Gmail + Business API client — server-side only
// Handles token exchange, refresh, and scoped API calls

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_API_BASE = 'https://www.googleapis.com';
const GMB_API_BASE = 'https://mybusinessaccountmanagement.googleapis.com/v1';

export interface GoogleTokens {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope?: string;
}

export interface GoogleUserInfo {
    email: string;
    name: string;
    picture: string;
    sub: string;
}

export async function exchangeGoogleCode(
    code: string,
    redirectUri: string
): Promise<GoogleTokens> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured');
    }

    const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google token exchange failed: ${errText}`);
    }

    return res.json() as Promise<GoogleTokens>;
}

export async function refreshGoogleToken(refreshToken: string): Promise<string> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured');
    }

    const body = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google token refresh failed: ${errText}`);
    }

    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) {
        throw new Error('No access_token in Google refresh response');
    }
    return data.access_token;
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const res = await fetch(`${GOOGLE_API_BASE}/oauth2/v3/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch Google user info: ${res.status}`);
    }

    return res.json() as Promise<GoogleUserInfo>;
}
