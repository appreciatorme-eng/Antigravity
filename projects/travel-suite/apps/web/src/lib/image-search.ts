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
            image_source?: string;
            image_confidence?: "high" | "medium" | "low";
            image_query?: string;
            image_entity_id?: string;
        }>;
    }>;
    [key: string]: unknown;
}

export const IMAGE_SEARCH_VERSION = 6;
export type ImageConfidence = "high" | "medium" | "low";

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

function pickFallbackFromIndexes(seed: string, indexes: readonly number[]): string {
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
    }
    const idx = indexes[Math.abs(hash) % indexes.length] ?? 0;
    return LUXURY_FALLBACKS[idx];
}

const TROPICAL_FALLBACK_INDEXES = [2, 5, 10, 13, 19, 1] as const;
const CULTURAL_FALLBACK_INDEXES = [12, 4, 7, 6] as const;
const URBAN_FALLBACK_INDEXES = [4, 6, 7, 5] as const;
const NATURE_FALLBACK_INDEXES = [3, 8, 9, 14, 18] as const;
const RESORT_FALLBACK_INDEXES = [0, 1, 5, 15] as const;

const CONTEXTUAL_FALLBACK_FIRST_PATTERNS = [
    /\b(airport|transfer|transfers|pickup|drop|terminal|station|hotel to|to hotel|one way|round trip|return transfer|private transfer|shared transfer|joined transfer|en[- ]route)\b/i,
    /\b(show|fantasea|dolphin|cabaret|theme park|city tour)\b/i,
] as const;

export function getContextualFallback(queryOrTitle: string): string | null {
    const normalized = normalizeWhitespace(queryOrTitle).toLowerCase();
    if (!normalized) return null;

    if (/\b(phuket|krabi|thailand|phi phi|khai|maya bay|james bond|phang nga|island|beach|bay|snorkel|boat|canoe|marine)\b/i.test(normalized)) {
        return pickFallbackFromIndexes(normalized, TROPICAL_FALLBACK_INDEXES);
    }

    if (/\b(temple|palace|market|old town|museum|shrine|heritage|fort)\b/i.test(normalized)) {
        return pickFallbackFromIndexes(normalized, CULTURAL_FALLBACK_INDEXES);
    }

    if (/\b(airport|transfer|hotel|pickup|drop|station|terminal|city|downtown)\b/i.test(normalized)) {
        return pickFallbackFromIndexes(normalized, URBAN_FALLBACK_INDEXES);
    }

    if (/\b(resort|villa|spa|pool|stay|accommodation)\b/i.test(normalized)) {
        return pickFallbackFromIndexes(normalized, RESORT_FALLBACK_INDEXES);
    }

    if (/\b(mountain|lake|waterfall|national park|forest|valley|camp)\b/i.test(normalized)) {
        return pickFallbackFromIndexes(normalized, NATURE_FALLBACK_INDEXES);
    }

    return null;
}

export function shouldPreferContextualFallback(queryOrTitle: string): boolean {
    const normalized = normalizeWhitespace(queryOrTitle).toLowerCase();
    if (!normalized) return false;
    return CONTEXTUAL_FALLBACK_FIRST_PATTERNS.some((pattern) => pattern.test(normalized));
}

function shouldPreferUnsplashFirst(queryOrTitle: string): boolean {
    const normalized = normalizeWhitespace(queryOrTitle).toLowerCase();
    if (!normalized) return false;
    return /\b(phuket|krabi|thailand|phi phi|khai|maya bay|james bond|phang nga|island|beach|bay|airport|transfer|hotel|show|tour|sunset|boat|marine)\b/i.test(normalized);
}

/** Patterns that indicate a Wikipedia image is NOT a place/landmark photo. */
const BAD_IMAGE_PATTERNS = [
    '.svg', 'portrait', 'logo', 'coat_of_arms', 'flag_of', 'crest',
    'signature', 'autograph', 'headshot', 'mugshot', 'album_cover',
    'book_cover', 'movie_poster', 'seal_of', 'emblem', 'icon',
];

/** Fetch Wikipedia thumbnail — checks up to 5 results for a suitable landscape/place image. */
function normalizeImageReuseKey(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) return "";

    try {
        if (trimmed.startsWith("/")) {
            return trimmed.split("?")[0].toLowerCase();
        }

        const parsed = new URL(trimmed);
        return `${parsed.origin}${parsed.pathname}`.toLowerCase();
    } catch {
        return trimmed.split("?")[0].toLowerCase();
    }
}

function pickUniqueFallback(seed: string, usedImageKeys: Set<string>): string {
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
    }

    const start = Math.abs(hash) % LUXURY_FALLBACKS.length;
    for (let offset = 0; offset < LUXURY_FALLBACKS.length; offset++) {
        const candidate = LUXURY_FALLBACKS[(start + offset) % LUXURY_FALLBACKS.length];
        if (!usedImageKeys.has(normalizeImageReuseKey(candidate))) {
            return candidate;
        }
    }

    return LUXURY_FALLBACKS[start];
}

async function fetchWikiThumbnail(q: string, ms = 4000, blockedImageKeys?: Set<string>): Promise<string | null> {
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
            const candidateKey = normalizeImageReuseKey(p.thumbnail.source);
            if (blockedImageKeys?.has(candidateKey)) continue;
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
    /\bto pay\b/gi,
    /\bper person\b/gi,
    /\b(national park fee|entry tickets?|entry ticket)\b/gi,
    /\b(sharing transfers?|private transfers?|shared transfers?)\b/gi,
    /\b(joined speed boat|speed boat|speedboat|longtail boat|ferry ride|boat ride)\b/gi,
    /\b(local lunch buffet|local lunch|buffet lunch|lunch|dinner|breakfast)\b/gi,
    /\b(sea canoe|snorkeling|snorkelling|kayaking)\b/gi,
    /\b(full day|half day)\b/gi,
    /\b(tour|trip|excursion|experience|adventure)\b/gi,
    /\b(one way|round trip|return transfer|return)\b/gi,
    /\b(private|shared|joined)\b/gi,
];

const ROUTE_NOISE_PATTERNS = [
    /\bhotel\b/gi,
    /\btransfer(s)?\b/gi,
    /\bprivate\b/gi,
    /\bshared\b/gi,
    /\bjoined\b/gi,
    /\bone way\b/gi,
    /\breturn\b/gi,
    /\bround trip\b/gi,
    /\bhkt\b/gi,
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
    /^pay$/i,
    /^person$/i,
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

function cleanRoutePlacePart(value: string, destination?: string): string {
    let output = cleanImageQueryPart(value, destination);
    for (const pattern of ROUTE_NOISE_PATTERNS) {
        output = output.replace(pattern, ' ');
    }
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

function extractRoutePlaceCandidates(title: string, destination?: string): string[] {
    if (!/\bto\b/i.test(title)) return [];
    if (!/\b(transfer|pickup|drop|airport|hotel|station|terminal|one way|round trip|return|en[- ]route)\b/i.test(title)) {
        return [];
    }

    const [fromPart, toPart] = title.split(/\bto\b/i, 2);
    return uniqueQueries([
        cleanRoutePlacePart(toPart ?? '', destination),
        cleanRoutePlacePart(fromPart ?? '', destination),
    ]).filter((candidate) => !isGenericPlace(candidate, destination));
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
    const routePlaces = extractRoutePlaceCandidates(title, destinationText);
    const routePlaceSet = new Set(routePlaces.map((candidate) => candidate.toLowerCase()));
    const precisePlaceSet = new Set(
        [cleanedLocation, ...routePlaces]
            .map((candidate) => normalizeWhitespace(candidate).toLowerCase())
            .filter(Boolean),
    );
    const destinationSegments = destinationText
        .split(',')
        .map((part) => normalizeWhitespace(part))
        .filter(Boolean);
    const broadDestination = destinationSegments[destinationSegments.length - 1] ?? destinationText;
    const primaryPlace = extractPrimaryPlaceFromTitle(title, destinationText);
    const cleanedTitle = routePlaces.length > 0
        ? cleanRoutePlacePart(title, destinationText)
        : cleanImageQueryPart(title, destinationText);

    const baseCandidates = uniqueQueries([
        cleanedLocation,
        ...routePlaces,
        routePlaces.length > 0 ? '' : (primaryPlace ?? ''),
        routePlaces.length > 0 ? '' : cleanedTitle,
    ]).filter((candidate) =>
        routePlaceSet.has(candidate.toLowerCase()) || !isGenericPlace(candidate, destinationText)
    );

    const queries: string[] = [];

    for (const candidate of baseCandidates) {
        const candidateKey = candidate.toLowerCase();
        const alreadyIncludesDestination = destinationParts.some((part) => candidateKey.includes(part));
        const alreadyIncludesBroadDestination = broadDestination
            ? candidateKey.includes(broadDestination.toLowerCase())
            : false;
        const isSpecificLandmarkCandidate = PLACE_HINT_PATTERNS.some((pattern) => pattern.test(candidate));
        if (precisePlaceSet.has(candidateKey) && destinationText && !alreadyIncludesDestination && isSpecificLandmarkCandidate) {
            queries.push(`${candidate} ${destinationText}`);
        } else if (precisePlaceSet.has(candidateKey) && broadDestination && !alreadyIncludesBroadDestination) {
            queries.push(`${candidate} ${broadDestination}`);
        } else if (destinationText && !alreadyIncludesDestination) {
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
        || url.includes('wikimedia.org/')
        || url.includes('pexels.com/')
        || url.includes('pixabay.com/');
}

async function fetchUnsplashImage(query: string, ms = 5000, blockedImageKeys?: Set<string>): Promise<string | null> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) return null;

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
            {
                signal: ctrl.signal,
                headers: {
                    Authorization: `Client-ID ${accessKey}`,
                    "Accept-Version": "v1",
                },
                next: { revalidate: 3600 },
            },
        );
        clearTimeout(tid);
        if (!res.ok) return null;
        const data = await res.json() as { results?: Array<{ urls?: { regular?: string } }> };
        for (const photo of data.results ?? []) {
            const url = photo.urls?.regular;
            if (!url) continue;
            const proxiedUrl = url.replace("https://images.unsplash.com/", "/unsplash-img/");
            if (blockedImageKeys?.has(normalizeImageReuseKey(proxiedUrl))) continue;
            return proxiedUrl;
        }
        return null;
    } catch {
        clearTimeout(tid);
        return null;
    }
}

async function fetchPexelsImage(query: string, ms = 5000, blockedImageKeys?: Set<string>): Promise<string | null> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) return null;

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
            {
                signal: ctrl.signal,
                headers: {
                    Authorization: apiKey,
                },
                next: { revalidate: 3600 },
            },
        );
        clearTimeout(tid);
        if (!res.ok) return null;
        const data = await res.json() as { photos?: Array<{ src?: { large?: string } }> };
        for (const photo of data.photos ?? []) {
            const url = photo.src?.large;
            if (!url) continue;
            if (blockedImageKeys?.has(normalizeImageReuseKey(url))) continue;
            return url;
        }
        return null;
    } catch {
        clearTimeout(tid);
        return null;
    }
}

async function fetchPixabayImage(query: string, ms = 5000, blockedImageKeys?: Set<string>): Promise<string | null> {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey) return null;

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(
            `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3&safesearch=true`,
            {
                signal: ctrl.signal,
                next: { revalidate: 3600 },
            },
        );
        clearTimeout(tid);
        if (!res.ok) return null;
        const data = await res.json() as { hits?: Array<{ webformatURL?: string }> };
        for (const hit of data.hits ?? []) {
            const url = hit.webformatURL;
            if (!url) continue;
            if (blockedImageKeys?.has(normalizeImageReuseKey(url))) continue;
            return url;
        }
        return null;
    } catch {
        clearTimeout(tid);
        return null;
    }
}

function normalizeEntityText(value: string): string {
    return normalizeWhitespace(value)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

function getBigrams(value: string): string[] {
    const normalized = value.replace(/\s+/g, " ");
    if (normalized.length < 2) return [normalized];
    const result: string[] = [];
    for (let i = 0; i < normalized.length - 1; i++) {
        result.push(normalized.slice(i, i + 2));
    }
    return result;
}

function getStringSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 1;

    const aBigrams = getBigrams(a);
    const bBigrams = getBigrams(b);
    const bCounts = new Map<string, number>();
    for (const bigram of bBigrams) {
        bCounts.set(bigram, (bCounts.get(bigram) ?? 0) + 1);
    }

    let matches = 0;
    for (const bigram of aBigrams) {
        const count = bCounts.get(bigram) ?? 0;
        if (count > 0) {
            matches++;
            bCounts.set(bigram, count - 1);
        }
    }

    return (2 * matches) / (aBigrams.length + bBigrams.length);
}

const NON_PLACE_ENTITY_PATTERNS = [
    /\b(actor|actress|singer|musician|band|album|film|movie|song|company|brand|software|footballer|cricketer|politician|novel|book|television|series)\b/i,
] as const;

const PLACE_ENTITY_PATTERNS = [
    /\b(temple|church|basilica|cathedral|beach|fort|museum|palace|mosque|shrine|market|station|airport|lake|hill|mount|park|monument|tower|bridge)\b/i,
] as const;

interface WikidataSearchEntity {
    id: string;
    label?: string;
    description?: string;
}

interface WikidataSearchResponse {
    search?: WikidataSearchEntity[];
}

interface WikidataEntityClaims {
    P18?: Array<{
        mainsnak?: {
            datavalue?: {
                value?: string;
            };
        };
    }>;
}

interface WikidataEntityDetails {
    claims?: WikidataEntityClaims;
    sitelinks?: {
        enwiki?: {
            title?: string;
        };
    };
}

interface WikidataEntityResponse {
    entities?: Record<string, WikidataEntityDetails>;
}

interface ResolvedImage {
    url: string;
    source: string;
    confidence: ImageConfidence;
    query: string;
    entityId?: string;
}

function scoreWikidataEntityMatch(
    query: string,
    entity: WikidataSearchEntity,
    location?: string,
    destination?: string,
): number {
    const normalizedQuery = normalizeEntityText(query);
    const normalizedLabel = normalizeEntityText(entity.label ?? "");
    const normalizedDescription = normalizeEntityText(entity.description ?? "");
    const normalizedLocation = normalizeEntityText(location ?? "");
    const destinationTokens = extractDestinationTokens(destination);
    const similarity = getStringSimilarity(normalizedQuery, normalizedLabel);

    let score = 0;

    if (!normalizedQuery || !normalizedLabel) return score;
    if (normalizedLabel === normalizedQuery) score += 120;
    if (normalizedLabel.startsWith(normalizedQuery) || normalizedQuery.startsWith(normalizedLabel)) score += 60;
    score += Math.round(similarity * 90);
    if (normalizedDescription.includes(normalizedQuery)) score += 40;
    if (PLACE_ENTITY_PATTERNS.some((pattern) => pattern.test(entity.label ?? "") || pattern.test(entity.description ?? ""))) score += 35;
    if (normalizedLocation && (normalizedLabel.includes(normalizedLocation) || normalizedDescription.includes(normalizedLocation))) score += 25;
    if (destinationTokens.some((token) => normalizedDescription.includes(token) || normalizedLabel.includes(token))) score += 25;
    if (NON_PLACE_ENTITY_PATTERNS.some((pattern) => pattern.test(entity.description ?? ""))) score -= 120;

    return score;
}

async function searchWikidataEntity(
    query: string,
    location?: string,
    destination?: string,
    blockedImageKeys?: Set<string>,
    ms = 5000,
): Promise<{ id: string; title?: string; imageUrl?: string } | null> {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(
            `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=5&origin=*`,
            { signal: ctrl.signal, next: { revalidate: 3600 } },
        );
        clearTimeout(tid);
        if (!res.ok) return null;
        const data = await res.json() as WikidataSearchResponse;
        const candidates = (data.search ?? [])
            .map((entity) => ({
                entity,
                score: scoreWikidataEntityMatch(query, entity, location, destination),
            }))
            .filter((entry) => entry.score >= 80)
            .sort((a, b) => b.score - a.score);

        const best = candidates[0]?.entity;
        if (!best?.id) return null;

        const detailsRes = await fetch(
            `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(best.id)}&props=claims|sitelinks&languages=en&format=json&origin=*`,
            { next: { revalidate: 3600 } },
        );
        if (!detailsRes.ok) return { id: best.id };

        const detailsData = await detailsRes.json() as WikidataEntityResponse;
        const entityData = detailsData.entities?.[best.id];
        const commonsFileName = entityData?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        const enwikiTitle = entityData?.sitelinks?.enwiki?.title;

        const imageUrl = commonsFileName
            ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commonsFileName)}?width=1200`
            : undefined;

        return {
            id: best.id,
            title: enwikiTitle,
            imageUrl: imageUrl && !blockedImageKeys?.has(normalizeImageReuseKey(imageUrl))
                ? imageUrl
                : undefined,
        };
    } catch {
        clearTimeout(tid);
        return null;
    }
}

function isTransferLikeTitle(title: string): boolean {
    return /\b(transfer|pickup|drop|airport|hotel to|to hotel|station|terminal|one way|round trip|return|en[- ]route)\b/i.test(title);
}

function buildEntitySearchQueries({
    title,
    location,
    destination,
}: {
    title: string;
    location?: string;
    destination?: string;
}): string[] {
    const destinationText = normalizeWhitespace(destination ?? "");
    const broadDestination = destinationText
        .split(',')
        .map((part) => normalizeWhitespace(part))
        .filter(Boolean)[0] ?? destinationText;
    const cleanedLocation = cleanImageQueryPart(location ?? "", destinationText);
    const primaryPlace = extractPrimaryPlaceFromTitle(title, destinationText);
    const queries = uniqueQueries([
        cleanedLocation,
        primaryPlace ?? "",
        cleanedLocation && broadDestination ? `${cleanedLocation} ${broadDestination}` : "",
        primaryPlace && broadDestination ? `${primaryPlace} ${broadDestination}` : "",
        ...buildImageSearchQueries({ title, location, destination }).slice(0, 3),
    ]).filter(Boolean);

    return queries;
}

async function fetchStockFallback(query: string, blockedImageKeys?: Set<string>): Promise<{ url: string; source: string } | null> {
    const pexels = await fetchPexelsImage(query, 5000, blockedImageKeys);
    if (pexels) return { url: pexels, source: "pexels" };

    const pixabay = await fetchPixabayImage(query, 5000, blockedImageKeys);
    if (pixabay) return { url: pixabay, source: "pixabay" };

    const unsplash = await fetchUnsplashImage(query, 5000, blockedImageKeys);
    if (unsplash) return { url: unsplash, source: "unsplash" };

    return null;
}

async function resolveActivityImage({
    title,
    location,
    destination,
    blockedImageKeys,
}: {
    title: string;
    location?: string;
    destination?: string;
    blockedImageKeys?: Set<string>;
}): Promise<ResolvedImage> {
    const searchQueries = buildImageSearchQueries({ title, location, destination });
    const entityQueries = buildEntitySearchQueries({ title, location, destination });
    const destinationText = normalizeWhitespace(destination ?? "");
    const broadDestination = destinationText
        .split(',')
        .map((part) => normalizeWhitespace(part))
        .filter(Boolean)[0] ?? destinationText;
    const transferLike = isTransferLikeTitle(title);

    if (!transferLike) {
        for (const candidate of entityQueries) {
            const entity = await searchWikidataEntity(candidate, location, destinationText, blockedImageKeys);
            if (!entity) continue;

            if (entity.imageUrl) {
                return {
                    url: entity.imageUrl,
                    source: "wikimedia-entity",
                    confidence: "high",
                    query: candidate,
                    entityId: entity.id,
                };
            }

            if (entity.title) {
                const wikiThumb = await fetchWikiThumbnail(entity.title, 4000, blockedImageKeys);
                if (wikiThumb) {
                    return {
                        url: wikiThumb,
                        source: "wikipedia-entity",
                        confidence: "high",
                        query: candidate,
                        entityId: entity.id,
                    };
                }
            }
        }
    }

    for (const candidate of searchQueries.slice(0, 3)) {
        const result = await fetchStockFallback(candidate, blockedImageKeys);
        if (result) {
            return {
                url: result.url,
                source: result.source,
                confidence: candidate !== destinationText && candidate !== broadDestination ? "medium" : "low",
                query: candidate,
            };
        }
    }

    for (const candidate of searchQueries) {
        const result = await fetchWikiThumbnail(candidate, 4000, blockedImageKeys);
        if (result) {
            return {
                url: result,
                source: "wikipedia-search",
                confidence: candidate !== destinationText && candidate !== broadDestination ? "medium" : "low",
                query: candidate,
            };
        }
    }

    const destinationQuery = destinationText || broadDestination || title;
    const destinationFallback = await fetchStockFallback(destinationQuery, blockedImageKeys);
    if (destinationFallback) {
        return {
            url: destinationFallback.url,
            source: destinationFallback.source,
            confidence: "low",
            query: destinationQuery,
        };
    }

    const contextualFallback = getContextualFallback(`${title} ${destinationText}`);
    const fallback =
        (contextualFallback && !blockedImageKeys?.has(normalizeImageReuseKey(contextualFallback))
            ? contextualFallback
            : null)
        ?? pickUniqueFallback(`${title} ${destinationText}`, blockedImageKeys ?? new Set<string>());
    return {
        url: fallback,
        source: "fallback",
        confidence: "low",
        query: destinationQuery,
    };
}

/** Multi-strategy Wikipedia image search with smarter query construction. */
export async function getWikiImage(query: string | readonly string[], titleStr: string): Promise<string> {
    const queries = uniqueQueries(
        (typeof query === 'string' ? [query] : Array.from(query)) as string[],
    );
    const combinedContext = `${queries.join(" ")} ${titleStr}`.trim();
    if (queries.length === 0) {
        return getContextualFallback(titleStr) ?? getDeterministicFallback(titleStr);
    }

    const preferUnsplashFirst = shouldPreferUnsplashFirst(combinedContext);

    if (preferUnsplashFirst) {
        for (const candidate of queries.slice(0, 4)) {
            const result = await fetchUnsplashImage(candidate);
            if (result) return result;
        }
    }

    for (const candidate of queries) {
        const result = await fetchWikiThumbnail(candidate);
        if (result) return result;
    }

    if (!preferUnsplashFirst) {
        for (const candidate of queries.slice(0, 4)) {
            const result = await fetchUnsplashImage(candidate);
            if (result) return result;
        }
    }

    return getContextualFallback(combinedContext) ?? getDeterministicFallback(titleStr);
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
        const refreshAutoGenerated = options?.refreshAutoGenerated ?? false;
        const usedImageKeys = new Set<string>();

        const updatedDays = [];
        for (const day of itinerary.days) {
            const updatedActivities = [];
            for (const activity of day.activities) {
                        const existingImage = activity.image || activity.imageUrl;
                        const existingConfidence = activity.image_confidence;
                        const existingImageKey = existingImage ? normalizeImageReuseKey(existingImage) : "";
                        if (
                            existingImage &&
                            (
                                !refreshAutoGenerated
                                || !isAutoGeneratedImageUrl(existingImage)
                                || existingConfidence === "high"
                            )
                        ) {
                            if (existingImageKey) usedImageKeys.add(existingImageKey);
                            updatedActivities.push(activity);
                            continue;
                        }

                        const resolved = await resolveActivityImage({
                            title: activity.title,
                            location: activity.location,
                            destination,
                            blockedImageKeys: usedImageKeys,
                        });

                        if (resolved.url) {
                            let finalUrl = resolved.url;
                            let finalSource = resolved.source;
                            let finalConfidence = resolved.confidence;
                            const resolvedKey = normalizeImageReuseKey(resolved.url);

                            if (usedImageKeys.has(resolvedKey)) {
                                finalUrl = pickUniqueFallback(`${activity.title} ${activity.location ?? destination}`, usedImageKeys);
                                finalSource = "fallback";
                                finalConfidence = "low";
                            }

                            const finalKey = normalizeImageReuseKey(finalUrl);
                            if (finalKey) usedImageKeys.add(finalKey);

                            updatedActivities.push({
                                ...activity,
                                imageUrl: finalUrl,
                                image: finalUrl,
                                image_source: finalSource,
                                image_confidence: finalConfidence,
                                image_query: resolved.query,
                                image_entity_id: resolved.entityId,
                            });
                        } else {
                            updatedActivities.push(activity);
                        }
            }
            updatedDays.push({ ...day, activities: updatedActivities });
        }

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
