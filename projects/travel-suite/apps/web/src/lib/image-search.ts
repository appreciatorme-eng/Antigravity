/**
 * Free high-quality image fetching using Wikipedia API and smart fallbacks.
 * Designed to provide "million-dollar" aesthetics for the premium itinerary templates.
 */

import { logEvent, logError } from '@/lib/observability/logger';

/** Minimal shape the image populator needs -- compatible with ItineraryResult and ItineraryLike. */
interface ItineraryForImages {
    destination?: string;
    image_search_version?: number;
    days: Array<{
        activities: Array<{
            title: string;
            location?: string;
            image?: string;
            imageUrl?: string;
        }>;
    }>;
    [key: string]: unknown;
}

export const IMAGE_SEARCH_VERSION = 2;

// Curated scenic fallback images — expanded to 20 for better hash distribution
export const LUXURY_FALLBACKS = [
    "/unsplash-img/photo-1542314831-c6a4d1409322?q=80&w=2560&auto=format&fit=crop", // Luxury Resort pool
    "/unsplash-img/photo-1510798831971-661eb04b3739?q=80&w=2560&auto=format&fit=crop", // Sunset resort
    "/unsplash-img/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop", // Pristine beach
    "/unsplash-img/photo-1476514525535-07fb3b4ae5f1?q=80&w=2560&auto=format&fit=crop", // Mountain lake
    "/unsplash-img/photo-1499856871958-5b9627545d1a?q=80&w=2560&auto=format&fit=crop", // Paris vibes
    "/unsplash-img/photo-1496417263034-38ec4f0b665a?q=80&w=2560&auto=format&fit=crop", // Coastal luxury
    "/unsplash-img/photo-1512453979798-5ea266f8880c?q=80&w=2560&auto=format&fit=crop", // Dubai skyline
    "/unsplash-img/photo-1449844908441-8829872d2607?q=80&w=2560&auto=format&fit=crop", // City architecture
    "/unsplash-img/photo-1469474968028-56623f02e42e?q=80&w=2560&auto=format&fit=crop", // Mountain valley
    "/unsplash-img/photo-1501785888041-af3ef285b470?q=80&w=2560&auto=format&fit=crop", // Lake reflection
    "/unsplash-img/photo-1506929562872-bb421503ef21?q=80&w=2560&auto=format&fit=crop", // Tropical beach
    "/unsplash-img/photo-1433838552652-f9a46b332c40?q=80&w=2560&auto=format&fit=crop", // Rolling hills
    "/unsplash-img/photo-1528164344705-47542687000d?q=80&w=2560&auto=format&fit=crop", // Asian temple
    "/unsplash-img/photo-1530789253388-582c481c54b0?q=80&w=2560&auto=format&fit=crop", // Mediterranean coast
    "/unsplash-img/photo-1493246507139-91e8fad9978e?q=80&w=2560&auto=format&fit=crop", // Northern lights
    "/unsplash-img/photo-1520250497591-112f2f40a3f4?q=80&w=2560&auto=format&fit=crop", // Luxury villa
    "/unsplash-img/photo-1517760444937-f6397edcbbcd?q=80&w=2560&auto=format&fit=crop", // Canyon views
    "/unsplash-img/photo-1504280390367-361c6d9f38f4?q=80&w=2560&auto=format&fit=crop", // Camping nature
    "/unsplash-img/photo-1543158266-0066955047b1?q=80&w=2560&auto=format&fit=crop", // Sunrise mountains
    "/unsplash-img/photo-1544735716-392fe2489ffa?q=80&w=2560&auto=format&fit=crop", // Greek islands
];

/**
 * Deterministically pick a fallback using djb2 hash (character codes)
 * to distribute evenly — avoids collisions from the old length-only approach.
 */
export function getDeterministicFallback(title: string): string {
    let hash = 5381;
    for (let i = 0; i < title.length; i++) {
        hash = ((hash << 5) + hash + title.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % LUXURY_FALLBACKS.length;
    return LUXURY_FALLBACKS[idx];
}

/** Patterns that indicate a Wikipedia image is NOT a place/landmark photo. */
const BAD_IMAGE_PATTERNS = [
    '.svg', 'portrait', 'logo', 'coat_of_arms', 'flag_of', 'crest',
    'signature', 'autograph', 'headshot', 'mugshot', 'album_cover',
    'book_cover', 'movie_poster', 'seal_of', 'emblem', 'icon',
];

/** Fetch Wikipedia thumbnail — checks up to 5 results for a suitable landscape/place image. */
async function fetchWikiThumbnail(q: string, ms = 4000): Promise<string | null> {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=5&prop=pageimages&pithumbsize=1200&format=json&origin=*`;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.query?.pages) return null;
        const pages = Object.values(data.query.pages) as Array<{
            thumbnail?: { source: string; width: number; height: number };
            title?: string;
        }>;
        for (const p of pages) {
            if (!p.thumbnail?.source) continue;
            const s = p.thumbnail.source.toLowerCase();
            // Filter out non-place images
            if (BAD_IMAGE_PATTERNS.some((pat) => s.includes(pat))) continue;
            if (p.thumbnail.width < 300) continue;
            // Prefer landscape-ish images (width >= height) for cards
            const h = p.thumbnail.height || p.thumbnail.width;
            if (h > 0 && p.thumbnail.width / h < 0.6) continue; // skip very tall/portrait images
            return p.thumbnail.source;
        }
    } catch { /* timeout/network */ }
    return null;
}

/** Prefixes to strip from activity titles for cleaner Wikipedia searches. */
const ACTIVITY_VERB_PREFIX = /^(visit|explore|walk through|tour|experience|discover|head to|stop at|go to|check out|stroll through|wander|relax at|enjoy|take a)\s+/i;
const DINING_PREFIX = /^(lunch at|dinner at|breakfast at|brunch at|morning at|afternoon at|evening at|drinks at|coffee at|tea at|eat at|dine at|meal at)\s+/i;

const TITLE_NOISE_PATTERNS = [
    /\([^)]*(excluding|including|fee|cash on tour|compulsory|ticket|tickets|transfer|transfers)[^)]*\)/gi,
    /\b(excluding|including)\b[^+|/,-]*/gi,
    /\b(compulsory to pay cash on tour|cash on tour)\b/gi,
    /\b(national park fee|entry tickets?|entry ticket)\b/gi,
    /\b(sharing transfers?|private transfers?|shared transfers?)\b/gi,
    /\b(joined speed boat|speed boat|speedboat|longtail boat|ferry ride|boat ride)\b/gi,
    /\b(local lunch buffet|local lunch|buffet lunch|lunch|dinner|breakfast)\b/gi,
    /\b(sea canoe|snorkeling|snorkelling|kayaking)\b/gi,
    /\b(full day|half day)\b/gi,
    /\b(tour|trip|excursion|experience|adventure)\b/gi,
];

const GENERIC_PLACE_PATTERNS = [
    /^tbd$/i,
    /^activity$/i,
    /^destination$/i,
    /^arrival$/i,
    /^departure$/i,
    /^transfers?$/i,
    /^sharing transfers?$/i,
    /^private transfers?$/i,
    /^hotel$/i,
];

const PLACE_HINT_PATTERNS = [
    /\bisland\b/i,
    /\bbeach\b/i,
    /\bbay\b/i,
    /\btemple\b/i,
    /\bpark\b/i,
    /\bmarket\b/i,
    /\bpalace\b/i,
    /\bfort\b/i,
    /\bwaterfall\b/i,
    /\bmount\b/i,
    /\bmountain\b/i,
    /\blake\b/i,
    /\breef\b/i,
    /\bcove\b/i,
    /\bviewpoint\b/i,
    /\bmuseum\b/i,
    /\bold town\b/i,
    /\bphi phi\b/i,
    /\bjames bond\b/i,
    /\bkhai\b/i,
    /\bmaya bay\b/i,
];

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function extractDestinationTokens(destination?: string): string[] {
    if (!destination) return [];
    return destination
        .split(',')
        .map((part) => normalizeWhitespace(part).toLowerCase())
        .filter(Boolean);
}

function removeDestinationPrefix(value: string, destination?: string): string {
    let output = normalizeWhitespace(value);
    for (const token of extractDestinationTokens(destination)) {
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        output = output.replace(new RegExp(`^${escaped}\\s*[-,:|/]\\s*`, 'i'), '');
    }
    return normalizeWhitespace(output);
}

function cleanImageQueryPart(value: string, destination?: string): string {
    let output = removeDestinationPrefix(value, destination)
        .replace(ACTIVITY_VERB_PREFIX, '')
        .replace(DINING_PREFIX, '');

    for (const pattern of TITLE_NOISE_PATTERNS) {
        output = output.replace(pattern, ' ');
    }

    output = output
        .replace(/\bwith\b.*$/i, ' ')
        .replace(/\bby\b.*$/i, ' ')
        .replace(/[+|/]/g, ' ')
        .replace(/\s*-\s*/g, ' ')
        .replace(/\s*&\s*/g, ' & ')
        .replace(/[()]/g, ' ')
        .replace(/\b[a-z]{1,3}\s*\d{2,6}\b/gi, ' ')
        .replace(/[^\p{L}\p{N}&' -]/gu, ' ');

    return normalizeWhitespace(output);
}

function isGenericPlace(value: string, destination?: string): boolean {
    const normalized = normalizeWhitespace(value).toLowerCase();
    if (!normalized) return true;
    if (GENERIC_PLACE_PATTERNS.some((pattern) => pattern.test(normalized))) return true;
    return extractDestinationTokens(destination).includes(normalized);
}

function scorePlaceCandidate(candidate: string): number {
    const normalized = candidate.toLowerCase();
    let score = Math.min(normalized.length, 80);
    if (PLACE_HINT_PATTERNS.some((pattern) => pattern.test(normalized))) score += 60;
    if (normalized.includes('&')) score += 5;
    if (normalized.split(' ').length <= 1) score -= 10;
    return score;
}

function extractPrimaryPlaceFromTitle(title: string, destination?: string): string | null {
    const normalizedTitle = normalizeWhitespace(title);
    if (!normalizedTitle) return null;

    const parts = normalizedTitle
        .split(/\s*[+|/]\s*/)
        .flatMap((part) => part.split(/\s+-\s+/))
        .map((part) => cleanImageQueryPart(part, destination))
        .filter((part) => !isGenericPlace(part, destination));

    if (parts.length === 0) {
        const cleanedTitle = cleanImageQueryPart(normalizedTitle, destination);
        return isGenericPlace(cleanedTitle, destination) ? null : cleanedTitle;
    }

    return [...parts].sort((a, b) => scorePlaceCandidate(b) - scorePlaceCandidate(a))[0] ?? null;
}

function uniqueQueries(values: readonly string[]): string[] {
    const seen = new Set<string>();
    const output: string[] = [];
    for (const value of values) {
        const normalized = normalizeWhitespace(value);
        if (!normalized) continue;
        const key = normalized.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        output.push(normalized);
    }
    return output;
}

export function buildImageSearchQueries({
    title,
    location,
    destination,
}: {
    title: string;
    location?: string;
    destination?: string;
}): string[] {
    const destinationText = normalizeWhitespace(destination ?? '');
    const destinationParts = extractDestinationTokens(destinationText);
    const cleanedLocation = cleanImageQueryPart(location ?? '', destinationText);
    const primaryPlace = extractPrimaryPlaceFromTitle(title, destinationText);
    const cleanedTitle = cleanImageQueryPart(title, destinationText);

    const baseCandidates = uniqueQueries([
        cleanedLocation,
        primaryPlace ?? '',
        cleanedTitle,
    ]).filter((candidate) => !isGenericPlace(candidate, destinationText));

    const queries: string[] = [];

    for (const candidate of baseCandidates) {
        const candidateKey = candidate.toLowerCase();
        const alreadyIncludesDestination = destinationParts.some((part) => candidateKey.includes(part));
        if (destinationText && !alreadyIncludesDestination) {
            queries.push(`${candidate} ${destinationText}`);
        }
        queries.push(candidate);
    }

    if (destinationText) {
        queries.push(destinationText);
    }

    return uniqueQueries(queries);
}

export function isAutoGeneratedImageUrl(url?: string): boolean {
    if (!url) return false;
    return url.startsWith('/unsplash-img/')
        || url.includes('wikipedia.org/')
        || url.includes('wikimedia.org/');
}

/** Multi-strategy Wikipedia image search with smarter query construction. */
export async function getWikiImage(query: string | readonly string[], titleStr: string): Promise<string> {
    const queries = uniqueQueries(
        (typeof query === 'string' ? [query] : Array.from(query)) as string[],
    );
    if (queries.length === 0) return getDeterministicFallback(titleStr);

    for (const candidate of queries) {
        const result = await fetchWikiThumbnail(candidate);
        if (result) return result;
    }

    return getDeterministicFallback(titleStr);
}

const WIKI_CONCURRENCY_LIMIT = 5;

/** Lightweight semaphore — limits concurrent async tasks without a dep on p-limit. */
function makeSemaphore(concurrency: number) {
    let active = 0;
    const queue: Array<() => void> = [];

    function next() {
        if (queue.length > 0 && active < concurrency) {
            active++;
            const resolve = queue.shift()!;
            resolve();
        }
    }

    return async function acquire(): Promise<() => void> {
        if (active < concurrency) {
            active++;
            return () => { active--; next(); };
        }
        await new Promise<void>((resolve) => queue.push(resolve));
        return () => { active--; next(); };
    };
}

/**
 * Returns a new itinerary with 'imageUrl' and 'image' set on every activity
 * by searching Wikipedia for the real-life location. Immutable — does not
 * mutate the input; returns a deep-cloned structure with images applied.
 */
export async function populateItineraryImages<T extends ItineraryForImages>(
    itinerary: T,
    options?: {
        refreshAutoGenerated?: boolean;
    },
): Promise<T> {
    try {
        const destination = itinerary.destination || "destination";
        const semaphore = makeSemaphore(WIKI_CONCURRENCY_LIMIT);
        const refreshAutoGenerated = options?.refreshAutoGenerated ?? false;

        const updatedDays = await Promise.all(
            itinerary.days.map(async (day) => {
                const updatedActivities = await Promise.all(
                    day.activities.map(async (activity) => {
                        const existingImage = activity.image || activity.imageUrl;
                        if (
                            existingImage &&
                            (!refreshAutoGenerated || !isAutoGeneratedImageUrl(existingImage))
                        ) {
                            return activity;
                        }

                        const release = await semaphore();
                        try {
                            const searchQueries = buildImageSearchQueries({
                                title: activity.title,
                                location: activity.location,
                                destination,
                            });
                            const imgUrl = await getWikiImage(searchQueries, activity.title);
                            return imgUrl
                                ? { ...activity, imageUrl: imgUrl, image: imgUrl }
                                : activity;
                        } finally {
                            release();
                        }
                    }),
                );
                return { ...day, activities: updatedActivities };
            }),
        );

        const activitiesCount = updatedDays.reduce((n, d) => n + d.activities.length, 0);
        logEvent('info', `[Images] Populated photos for up to ${activitiesCount} activities (max ${WIKI_CONCURRENCY_LIMIT} concurrent)`);

        return {
            ...itinerary,
            days: updatedDays,
            image_search_version: IMAGE_SEARCH_VERSION,
        };
    } catch (error) {
        logError('Image fetching error (non-blocking)', error);
        return itinerary;
    }
}
