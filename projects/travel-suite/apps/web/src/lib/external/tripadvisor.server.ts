// TripAdvisor Content API client — server-side only
// Docs: https://tripadvisor-content-api.readme.io/reference/overview

const TA_BASE = 'https://api.content.tripadvisor.com/api/v1';

export interface TripAdvisorLocation {
    location_id: string;
    name: string;
    rating?: number;
    num_reviews?: number;
    web_url?: string;
    address_obj?: {
        city?: string;
        country?: string;
    };
}

export interface TripAdvisorReview {
    id: number;
    rating: number;
    title: string;
    text: string;
    published_date: string;
    user?: { username?: string };
}

export async function getTripAdvisorLocationDetails(
    apiKey: string,
    locationId: string
): Promise<TripAdvisorLocation> {
    const url = `${TA_BASE}/location/${locationId}/details?key=${apiKey}&language=en&currency=USD`;
    const res = await fetch(url, {
        headers: { Accept: 'application/json', Referer: 'https://tripbuilt.app' },
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`TripAdvisor location details failed (${res.status}): ${errText}`);
    }

    return res.json() as Promise<TripAdvisorLocation>;
}

export async function getTripAdvisorReviews(
    apiKey: string,
    locationId: string,
    limit = 5
): Promise<TripAdvisorReview[]> {
    const url = `${TA_BASE}/location/${locationId}/reviews?key=${apiKey}&language=en&limit=${limit}`;
    const res = await fetch(url, {
        headers: { Accept: 'application/json', Referer: 'https://tripbuilt.app' },
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`TripAdvisor reviews fetch failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { data?: TripAdvisorReview[] };
    return data.data ?? [];
}
