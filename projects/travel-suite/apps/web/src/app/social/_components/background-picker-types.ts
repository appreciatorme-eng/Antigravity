import type { AiImageStyle, AiPosterStyle } from "@/lib/social/ai-prompts";
import type { DestinationImage } from "@/lib/social/destination-images";

// ---------------------------------------------------------------------------
// Shared Types
// ---------------------------------------------------------------------------

export interface BackgroundPickerProps {
    templateData: {
        destination: string;
        heroImage?: string;
        price?: string;
        offer?: string;
        companyName?: string;
        season?: string;
        contactNumber?: string;
        email?: string;
        website?: string;
        [key: string]: unknown;
    };
    selectedBackground: string;
    availableBackgrounds: string[];
    onBackgroundChange: (url: string) => void;
    onBackgroundsGenerated: (urls: string[]) => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAiPosterGenerated?: (url: string) => void;
}

export type ActiveSource = "ai" | "stock" | "upload";

export interface UnsplashResult {
    id: string;
    url: string;
}

export interface CachedImage {
    url: string;
    destination: string;
    style: string;
    timestamp: number;
    mode: "background" | "poster";
}

export type { AiImageStyle, AiPosterStyle, DestinationImage };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AI_STYLES: AiImageStyle[] = [
    "cinematic", "editorial", "vibrant", "luxury",
    "tropical", "dramatic", "heritage", "minimal",
];

export const STYLE_LABELS: Record<AiImageStyle, string> = {
    cinematic: "Cinematic",
    editorial: "Editorial",
    vibrant: "Vibrant",
    luxury: "Luxury",
    tropical: "Tropical",
    dramatic: "Dramatic",
    heritage: "Heritage",
    minimal: "Minimal",
};

export const POSTER_STYLES: AiPosterStyle[] = [
    "magazine_cover", "luxury_editorial", "bold_modern",
    "minimal_elegant", "vibrant_festival",
];

export const SECTION_ANIMATION = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.2 },
};

// ---------------------------------------------------------------------------
// Cache Constants
// ---------------------------------------------------------------------------

const BG_CACHE_KEY = "social-studio-bg-cache";
const POSTER_CACHE_KEY = "social-studio-poster-cache";
const MAX_BG_CACHE = 50;
const MAX_POSTER_CACHE = 20;

// ---------------------------------------------------------------------------
// Cache Helpers (immutable)
// ---------------------------------------------------------------------------

export function loadCachedImages(mode: "background" | "poster"): CachedImage[] {
    try {
        const key = mode === "poster" ? POSTER_CACHE_KEY : BG_CACHE_KEY;
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
        return [];
    }
}

export function saveCachedImage(img: CachedImage): void {
    const key = img.mode === "poster" ? POSTER_CACHE_KEY : BG_CACHE_KEY;
    const max = img.mode === "poster" ? MAX_POSTER_CACHE : MAX_BG_CACHE;
    const cache = loadCachedImages(img.mode);
    const updated = [img, ...cache.filter((c) => c.url !== img.url)].slice(0, max);
    localStorage.setItem(key, JSON.stringify(updated));
}

export function getCachedImagesForDestination(
    destination: string,
    mode: "background" | "poster",
): CachedImage[] {
    const cache = loadCachedImages(mode);
    const dest = destination.toLowerCase();
    return cache.filter((c) => c.destination.toLowerCase() === dest);
}
