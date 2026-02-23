let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export function resolveAmadeusBaseUrl() {
  const explicit = process.env.AMADEUS_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const envMode = (process.env.AMADEUS_ENV || 'production').trim().toLowerCase();
  if (envMode === 'test' || envMode === 'sandbox') {
    return 'https://test.api.amadeus.com';
  }

  return 'https://api.amadeus.com';
}

export async function getAmadeusToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  const amadeusBaseUrl = resolveAmadeusBaseUrl();

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials missing. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET.');
  }

  if (cachedToken && Date.now() < tokenExpiry - 30000) {
    return cachedToken;
  }

  const response = await fetch(`${amadeusBaseUrl}/v1/security/oauth2/token`, {
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
  tokenExpiry = Date.now() + data.expires_in * 1000;

  return cachedToken;
}

export interface AmadeusLocation {
  iataCode?: string;
  name?: string;
  subType?: 'CITY' | 'AIRPORT' | string;
  detailedName?: string;
  address?: {
    cityName?: string;
    countryCode?: string;
  };
}

export async function searchAmadeusLocations(
  keyword: string,
  subType: 'CITY' | 'AIRPORT' | 'CITY,AIRPORT' = 'CITY,AIRPORT',
  limit = 8
): Promise<AmadeusLocation[]> {
  const amadeusBaseUrl = resolveAmadeusBaseUrl();
  const token = await getAmadeusToken();
  const normalizedKeyword = keyword.trim();

  if (normalizedKeyword.length < 2) {
    return [];
  }

  const url = `${amadeusBaseUrl}/v1/reference-data/locations?subType=${encodeURIComponent(subType)}&keyword=${encodeURIComponent(normalizedKeyword)}&page[limit]=${Math.min(Math.max(limit, 1), 20)}&view=LIGHT`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Amadeus Location Search Failed: ${JSON.stringify(error)}`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.data) ? (payload.data as AmadeusLocation[]) : [];
}
