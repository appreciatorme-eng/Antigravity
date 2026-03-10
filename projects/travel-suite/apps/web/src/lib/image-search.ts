/**
 * Free high-quality image fetching using Wikipedia API and smart fallbacks.
 * Designed to provide "million-dollar" aesthetics for the premium itinerary templates.
 */

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

// A curated list of stunning scenic fallback images from Unsplash
const LUXURY_FALLBACKS = [
    "https://images.unsplash.com/photo-1542314831-c6a4d1409322?q=80&w=2560&auto=format&fit=crop", // Luxury Resort pool
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2560&auto=format&fit=crop", // Beautiful sunset resort
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop", // Pristine beach
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2560&auto=format&fit=crop", // Mountain lake
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=2560&auto=format&fit=crop", // Paris vibes
    "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?q=80&w=2560&auto=format&fit=crop", // Coastal luxury
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2560&auto=format&fit=crop", // Dubai skyline
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=2560&auto=format&fit=crop", // Beautiful city architecture
];

/**
 * Deterministically pick a beautiful fallback based on exactly string length
 */
const getDeterministicFallback = (title: string) => {
    const defaultIdx = title.length % LUXURY_FALLBACKS.length;
    return LUXURY_FALLBACKS[defaultIdx];
};

export async function getWikiImage(query: string, titleStr: string): Promise<string> {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&pithumbsize=1200&format=json&origin=*`;

        // Timeout the fetch so bad connections don't hang the itinerary generation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();

            if (data?.query?.pages) {
                const pages = Object.values(data.query.pages) as Array<{ thumbnail?: { source: string; width: number } }>;
                if (pages.length > 0 && pages[0].thumbnail?.source) {
                    const imgUrl = pages[0].thumbnail.source;
                    // Filter out very weird portrait SVGs and extremely small icons
                    if (imgUrl.toLowerCase().includes('.svg') || imgUrl.toLowerCase().includes('portrait') || pages[0].thumbnail.width < 300) {
                        return getDeterministicFallback(titleStr);
                    }
                    return imgUrl;
                }
            }
        }
    } catch (e) {
        console.error(`Wiki image search failed for "${query}":`, (e as Error).message);
    }

    // As a final fallback, use a free stunning luxury resort/mountain/travel image
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
                            const searchQuery = `${activity.title} ${destination}`;
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
        console.log(`🖼️ [Images] Populated photos for up to ${activitiesCount} activities (max ${WIKI_CONCURRENCY_LIMIT} concurrent).`);

        return { ...itinerary, days: updatedDays };
    } catch (error) {
        console.error('Image fetching error (non-blocking):', error);
        return itinerary;
    }
}
