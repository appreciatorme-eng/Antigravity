
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getAmadeusToken() {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Amadeus API credentials missing. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET.');
    }

    // Return cached token if still valid (with 30s buffer)
    if (cachedToken && Date.now() < tokenExpiry - 30000) {
        return cachedToken;
    }

    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Amadeus Auth Failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);

    return cachedToken;
}
