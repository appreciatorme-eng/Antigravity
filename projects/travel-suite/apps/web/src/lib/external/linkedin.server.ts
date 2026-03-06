// LinkedIn OAuth + Profile API client — server-side only
// LinkedIn tokens are 60 days; no refresh token issued

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

export interface LinkedInTokens {
    access_token: string;
    expires_in: number;
    scope?: string;
}

export interface LinkedInProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
}

export async function exchangeLinkedInCode(
    code: string,
    redirectUri: string
): Promise<LinkedInTokens> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not configured');
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
    });

    const res = await fetch(LINKEDIN_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LinkedIn token exchange failed: ${errText}`);
    }

    return res.json() as Promise<LinkedInTokens>;
}

export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
    const [profileRes, emailRes] = await Promise.all([
        fetch(`${LINKEDIN_API_BASE}/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${LINKEDIN_API_BASE}/emailAddress?q=members&projection=(elements*(handle~))`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        }),
    ]);

    if (!profileRes.ok) {
        throw new Error(`Failed to fetch LinkedIn profile: ${profileRes.status}`);
    }

    const profileData = (await profileRes.json()) as {
        id?: string;
        firstName?: { localized?: Record<string, string> };
        lastName?: { localized?: Record<string, string> };
        profilePicture?: { 'displayImage~'?: { elements?: Array<{ identifiers?: Array<{ identifier?: string }> }> } };
    };

    let email = '';
    if (emailRes.ok) {
        const emailData = (await emailRes.json()) as {
            elements?: Array<{ 'handle~'?: { emailAddress?: string } }>;
        };
        email = emailData.elements?.[0]?.['handle~']?.emailAddress ?? '';
    }

    const firstNameLocalized = profileData.firstName?.localized ?? {};
    const lastNameLocalized = profileData.lastName?.localized ?? {};
    const firstName = Object.values(firstNameLocalized)[0] ?? '';
    const lastName = Object.values(lastNameLocalized)[0] ?? '';

    const pictureElements = profileData.profilePicture?.['displayImage~']?.elements ?? [];
    const lastPicElement = pictureElements[pictureElements.length - 1];
    const profilePicture = lastPicElement?.identifiers?.[0]?.identifier;

    return {
        id: profileData.id ?? '',
        firstName,
        lastName,
        email,
        profilePicture,
    };
}
