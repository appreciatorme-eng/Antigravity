/**
 * Free high-quality image fetching using Wikipedia API and smart fallbacks.
 * Designed to provide "million-dollar" aesthetics for the premium itinerary templates.
 */

import { logEvent, logError } from '@/lib/observability/logger';

/** Minimal shape the image populator needs -- compatible with ItineraryResult and ItineraryLike. */
interface ItineraryForImages {
    destination?: string;
    days: Array<{
        activities: Array<{
            title: string;
            image?: string;
            imageUrl?: string;
        }>;
    }>;
    [key: string]: unknown;
}

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

/** Multi-strategy Wikipedia image search with smarter query construction. */
export async function getWikiImage(query: string, titleStr: string): Promise<string> {
    if (!query?.trim()) return getDeterministicFallback(titleStr);

    // For dining activities, search for the restaurant/place name + city rather than
    // "Dinner at X City" which returns random people/unrelated results
    const isDining = DINING_PREFIX.test(titleStr);
    const cleanTitle = titleStr
        .replace(DINING_PREFIX, '')
        .replace(ACTIVITY_VERB_PREFIX, '')
        .trim();

    // Strategy 1: Clean title + destination (e.g., "The Kitchin Edinburgh")
    if (cleanTitle && cleanTitle !== titleStr) {
        const destination = query.replace(titleStr, '').trim();
        const q1 = destination ? `${cleanTitle} ${destination}` : cleanTitle;
        const r1 = await fetchWikiThumbnail(q1);
        if (r1) return r1;
    }

    // Strategy 2: Full query as-is (e.g., "Arthur's Seat Edinburgh, Scotland")
    const r2 = await fetchWikiThumbnail(query);
    if (r2) return r2;

    // Strategy 3: For dining, search for the neighborhood/area instead
    if (isDining && cleanTitle.length > 2) {
        const r3 = await fetchWikiThumbnail(cleanTitle);
        if (r3) return r3;
    }

    // Strategy 4: Just the title without verbs
    if (cleanTitle !== titleStr && cleanTitle.length > 2) {
        const r4 = await fetchWikiThumbnail(cleanTitle);
        if (r4) return r4;
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
export async function populateItineraryImages<T extends ItineraryForImages>(itinerary: T): Promise<T> {
    try {
        const destination = itinerary.destination || "destination";
        const semaphore = makeSemaphore(WIKI_CONCURRENCY_LIMIT);

        const updatedDays = await Promise.all(
            itinerary.days.map(async (day) => {
                const updatedActivities = await Promise.all(
                    day.activities.map(async (activity) => {
                        if (activity.image || activity.imageUrl) {
                            return activity;
                        }

                        const release = await semaphore();
                        try {
                            const searchQuery = `${activity.title} ${destination}`.trim();
                            const imgUrl = await getWikiImage(searchQuery, activity.title);
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

        return { ...itinerary, days: updatedDays };
    } catch (error) {
        logError('Image fetching error (non-blocking)', error);
        return itinerary;
    }
}
