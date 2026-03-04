"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ImageIcon,
    Wand2,
    Upload,
    Loader2,
    Search,
    X,
    Check,
    Sparkles,
    Database,
    Camera,
    Crown,
} from "lucide-react";
import { toast } from "sonner";
import {
    generateBackgroundPrompt,
    generateFullPosterPrompt,
    POSTER_STYLE_LABELS,
    type AiImageStyle,
    type AiPosterStyle,
} from "@/lib/social/ai-prompts";
import {
    matchDestination,
    type DestinationImage,
} from "@/lib/social/destination-images";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BackgroundPickerProps {
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

type ActiveSource = "ai" | "stock" | "upload";

interface UnsplashResult {
    id: string;
    url: string;
}

interface CachedImage {
    url: string;
    destination: string;
    style: string;
    timestamp: number;
    mode: "background" | "poster";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AI_STYLES: AiImageStyle[] = [
    "cinematic", "editorial", "vibrant", "luxury",
    "tropical", "dramatic", "heritage", "minimal",
];

const STYLE_LABELS: Record<AiImageStyle, string> = {
    cinematic: "Cinematic",
    editorial: "Editorial",
    vibrant: "Vibrant",
    luxury: "Luxury",
    tropical: "Tropical",
    dramatic: "Dramatic",
    heritage: "Heritage",
    minimal: "Minimal",
};

const POSTER_STYLES: AiPosterStyle[] = [
    "magazine_cover", "luxury_editorial", "bold_modern",
    "minimal_elegant", "vibrant_festival",
];

const SECTION_ANIMATION = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.2 },
};

const BG_CACHE_KEY = "social-studio-bg-cache";
const POSTER_CACHE_KEY = "social-studio-poster-cache";
const MAX_BG_CACHE = 50;
const MAX_POSTER_CACHE = 20;

// ---------------------------------------------------------------------------
// Cache Helpers (immutable)
// ---------------------------------------------------------------------------

function loadCachedImages(mode: "background" | "poster"): CachedImage[] {
    try {
        const key = mode === "poster" ? POSTER_CACHE_KEY : BG_CACHE_KEY;
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
        return [];
    }
}

function saveCachedImage(img: CachedImage): void {
    const key = img.mode === "poster" ? POSTER_CACHE_KEY : BG_CACHE_KEY;
    const max = img.mode === "poster" ? MAX_POSTER_CACHE : MAX_BG_CACHE;
    const cache = loadCachedImages(img.mode);
    const updated = [img, ...cache.filter((c) => c.url !== img.url)].slice(0, max);
    localStorage.setItem(key, JSON.stringify(updated));
}

function getCachedImagesForDestination(destination: string, mode: "background" | "poster"): CachedImage[] {
    const cache = loadCachedImages(mode);
    const dest = destination.toLowerCase();
    return cache.filter((c) => c.destination.toLowerCase() === dest);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BackgroundPicker({
    templateData,
    selectedBackground,
    availableBackgrounds,
    onBackgroundChange,
    onBackgroundsGenerated,
    onImageUpload,
    onAiPosterGenerated,
}: BackgroundPickerProps) {
    const [activeSource, setActiveSource] = useState<ActiveSource>("stock");
    const [aiStyle, setAiStyle] = useState<AiImageStyle>("cinematic");
    const [aiMode, setAiMode] = useState<"background" | "poster">("background");
    const [posterStyle, setPosterStyle] = useState<AiPosterStyle>("magazine_cover");
    const [generatingAi, setGeneratingAi] = useState(false);
    const [generatingPoster, setGeneratingPoster] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [unsplashQuery, setUnsplashQuery] = useState(
        templateData.destination || ""
    );
    const [unsplashResults, setUnsplashResults] = useState<UnsplashResult[]>(
        []
    );
    const [searchingUnsplash, setSearchingUnsplash] = useState(false);

    const [cachedBgImages, setCachedBgImages] = useState<CachedImage[]>([]);
    const [cachedPosterImages, setCachedPosterImages] = useState<CachedImage[]>([]);
    const [cachedUrls, setCachedUrls] = useState<Set<string>>(new Set());

    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialSearchDoneRef = useRef(false);

    const isGenerating = generatingAi || generatingPoster;

    // -----------------------------------------------------------------------
    // Curated: Pre-matched destination images (instant, no API call)
    // -----------------------------------------------------------------------

    const curatedImages: DestinationImage[] = useMemo(
        () => matchDestination(templateData.destination),
        [templateData.destination]
    );

    const handleCuratedSelect = useCallback(
        (image: DestinationImage) => {
            onBackgroundChange(image.url);
            onBackgroundsGenerated([image.url]);
        },
        [onBackgroundChange, onBackgroundsGenerated]
    );

    // -----------------------------------------------------------------------
    // Cache: Load cached images on mount and when destination changes
    // -----------------------------------------------------------------------

    useEffect(() => {
        const bgCached = getCachedImagesForDestination(templateData.destination, "background");
        const posterCached = getCachedImagesForDestination(templateData.destination, "poster");
        setCachedBgImages(bgCached);
        setCachedPosterImages(posterCached);
        setCachedUrls(new Set([...bgCached, ...posterCached].map((c) => c.url)));

        if (bgCached.length > 0) {
            onBackgroundsGenerated(bgCached.map((c) => c.url));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateData.destination]);

    // -----------------------------------------------------------------------
    // Stock: Auto-populate query from destination and search on mount
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (templateData.destination && !initialSearchDoneRef.current) {
            initialSearchDoneRef.current = true;
            setUnsplashQuery(templateData.destination);
            fetchUnsplashImagesForQuery(templateData.destination);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -----------------------------------------------------------------------
    // Stock: Auto-search when destination changes (debounced 500ms)
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (activeSource !== "stock") return;
        if (!templateData.destination) return;
        if (!initialSearchDoneRef.current) return;

        setUnsplashQuery(templateData.destination);

        const timer = setTimeout(() => {
            fetchUnsplashImagesForQuery(templateData.destination);
        }, 500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateData.destination, activeSource]);

    // -----------------------------------------------------------------------
    // AI Background Generation
    // -----------------------------------------------------------------------

    const handleGenerateAiImages = async () => {
        setGeneratingAi(true);
        setAiError(null);
        try {
            const prompt = generateBackgroundPrompt(templateData, aiStyle);
            const res = await fetch("/api/social/ai-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    width: 1080,
                    height: 1080,
                    count: 1,
                    mode: "background",
                }),
            });

            if (!res.ok) {
                const errData = await res
                    .json()
                    .catch(() => ({ error: "AI generation failed" }));
                setAiError(
                    errData.error || `AI generation failed (${res.status})`
                );
                return;
            }

            const data = await res.json();
            const imgs: { url: string }[] = data.images || [];

            if (imgs.length === 0) {
                setAiError(
                    "No images returned. Try a different destination or style."
                );
                return;
            }

            const urls = imgs.map((img) => img.url);

            for (const url of urls) {
                saveCachedImage({
                    url,
                    destination: templateData.destination,
                    style: aiStyle,
                    timestamp: Date.now(),
                    mode: "background",
                });
            }

            const freshCached = getCachedImagesForDestination(templateData.destination, "background");
            setCachedBgImages(freshCached);
            setCachedUrls((prev) => new Set([...prev, ...urls]));

            onBackgroundsGenerated(urls);
            onBackgroundChange(urls[0]);
        } catch {
            setAiError("Failed to generate images. Please try again.");
        } finally {
            setGeneratingAi(false);
        }
    };

    // -----------------------------------------------------------------------
    // AI Poster Generation (Magazine-Cover Quality)
    // -----------------------------------------------------------------------

    const handleGenerateAiPoster = async () => {
        setGeneratingPoster(true);
        setAiError(null);
        try {
            const prompt = generateFullPosterPrompt(templateData, posterStyle);
            const res = await fetch("/api/social/ai-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    width: 1080,
                    height: 1080,
                    count: 1,
                    mode: "poster",
                }),
            });

            if (!res.ok) {
                const errData = await res
                    .json()
                    .catch(() => ({ error: "AI poster generation failed" }));
                setAiError(
                    errData.error || `AI poster generation failed (${res.status})`
                );
                return;
            }

            const data = await res.json();
            const imgs: { url: string }[] = data.images || [];

            if (imgs.length === 0) {
                setAiError(
                    "No poster returned. Try a different style or destination."
                );
                return;
            }

            const url = imgs[0].url;

            saveCachedImage({
                url,
                destination: templateData.destination,
                style: posterStyle,
                timestamp: Date.now(),
                mode: "poster",
            });

            const freshCached = getCachedImagesForDestination(templateData.destination, "poster");
            setCachedPosterImages(freshCached);
            setCachedUrls((prev) => new Set([...prev, url]));

            if (onAiPosterGenerated) {
                onAiPosterGenerated(url);
            }

            toast.success("AI poster generated! Your canvas has been updated.");
        } catch {
            setAiError("Failed to generate poster. Please try again.");
        } finally {
            setGeneratingPoster(false);
        }
    };

    // -----------------------------------------------------------------------
    // Unsplash Search
    // -----------------------------------------------------------------------

    const fetchUnsplashImagesForQuery = useCallback(
        async (query: string) => {
            if (!query.trim()) return;
            setSearchingUnsplash(true);
            try {
                const response = await fetch(
                    `/api/images/unsplash?query=${encodeURIComponent(query)}&per_page=8`
                );
                if (!response.ok) throw new Error("Failed to fetch");

                const data = await response.json();
                const results: UnsplashResult[] = Array.isArray(data.results)
                    ? data.results
                    : data.url
                      ? [{ id: `single-${Date.now()}`, url: data.url }]
                      : [];

                setUnsplashResults(results);
            } catch {
                toast.error("Failed to fetch images.");
            } finally {
                setSearchingUnsplash(false);
            }
        },
        []
    );

    const fetchUnsplashImages = async () => {
        await fetchUnsplashImagesForQuery(unsplashQuery);
    };

    const handleUnsplashSelect = (result: UnsplashResult) => {
        onBackgroundChange(result.url);
        onBackgroundsGenerated([result.url]);
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    const activeCachedImages = aiMode === "poster" ? cachedPosterImages : cachedBgImages;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                Background
            </div>

            {/* 1. Background Thumbnails Strip */}
            {availableBackgrounds.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                    {availableBackgrounds.map((url) => {
                        const isSelected = url === selectedBackground;
                        const isCached = cachedUrls.has(url);
                        return (
                            <button
                                key={url}
                                onClick={() => onBackgroundChange(url)}
                                className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                                    isSelected
                                        ? "ring-2 ring-indigo-500 ring-offset-2"
                                        : "ring-1 ring-slate-200 dark:ring-slate-700"
                                }`}
                            >
                                <img
                                    src={url}
                                    alt="Background option"
                                    className="w-20 h-20 rounded-xl object-cover"
                                />
                                {isCached && (
                                    <span className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/60 text-[8px] font-bold text-amber-300">
                                        <Database className="w-2 h-2" />
                                        Cached
                                    </span>
                                )}
                                {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                                        <Check className="w-5 h-5 text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3 text-center">
                    No backgrounds yet -- search stock photos or upload one below
                </p>
            )}

            {/* 2. Source Action Buttons */}
            <div className="flex flex-wrap gap-2">
                {/* Stock Photos (Primary) */}
                <button
                    onClick={() => setActiveSource("stock")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeSource === "stock"
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:from-violet-700 hover:to-indigo-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    }`}
                >
                    <Search className="w-4 h-4" />
                    Stock Photos
                </button>

                {/* AI Background (Premium) */}
                <button
                    onClick={() => {
                        setActiveSource("ai");
                        setAiMode("background");
                    }}
                    disabled={isGenerating}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeSource === "ai" && aiMode === "background"
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    } disabled:opacity-60`}
                >
                    <Wand2 className="w-4 h-4" />
                    AI Background
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-extrabold text-white leading-none">
                        <Sparkles className="w-2.5 h-2.5" />
                        Premium
                    </span>
                </button>

                {/* AI Poster (Ultra) */}
                <button
                    onClick={() => {
                        setActiveSource("ai");
                        setAiMode("poster");
                    }}
                    disabled={isGenerating}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeSource === "ai" && aiMode === "poster"
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    } disabled:opacity-60`}
                >
                    <Crown className="w-4 h-4" />
                    AI Poster
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-[9px] font-extrabold text-white leading-none">
                        <Sparkles className="w-2.5 h-2.5" />
                        Ultra
                    </span>
                </button>

                {/* Upload */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                >
                    <Upload className="w-4 h-4" />
                    Upload
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onImageUpload}
                />
            </div>

            {/* 3. AI Panel (visible when source is "ai") */}
            <AnimatePresence>
                {activeSource === "ai" && (
                    <motion.div {...SECTION_ANIMATION}>
                        <div className="space-y-3 pt-1">
                            {/* Mode indicator */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
                                aiMode === "poster"
                                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                            }`}>
                                {aiMode === "poster" ? (
                                    <>
                                        <Crown className="w-3.5 h-3.5" />
                                        AI Poster Mode — Generates a complete designed poster with text baked in
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-3.5 h-3.5" />
                                        AI Background Mode — Generates a background photo for your template
                                    </>
                                )}
                            </div>

                            {/* Style selector */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {aiMode === "poster" ? "Poster Style:" : "Photo Style:"}
                                </span>

                                {aiMode === "poster" ? (
                                    // Poster styles (5 options, 3 columns)
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {POSTER_STYLES.map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => setPosterStyle(style)}
                                                className={`px-2 py-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                                                    posterStyle === style
                                                        ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-300 dark:ring-purple-700"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                                                }`}
                                            >
                                                {POSTER_STYLE_LABELS[style]}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    // Background styles (8 options, 4 columns)
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {AI_STYLES.map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => setAiStyle(style)}
                                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center ${
                                                    aiStyle === style
                                                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-700"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                                                }`}
                                            >
                                                {STYLE_LABELS[style]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Generate button */}
                            <button
                                onClick={aiMode === "poster" ? handleGenerateAiPoster : handleGenerateAiImages}
                                disabled={isGenerating}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${
                                    aiMode === "poster"
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                                        : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                                }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {aiMode === "poster" ? "Creating your poster..." : "Generating..."}
                                    </>
                                ) : (
                                    <>
                                        {aiMode === "poster" ? <Crown className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                                        {aiMode === "poster" ? "Generate AI Poster" : "Generate AI Background"}
                                    </>
                                )}
                            </button>

                            {/* Cached images for this mode */}
                            {activeCachedImages.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {aiMode === "poster" ? "Previously Generated Posters:" : "Previously Generated:"}
                                    </span>
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {activeCachedImages.map((cached) => {
                                            const isSelected =
                                                cached.url === selectedBackground;
                                            return (
                                                <button
                                                    key={`cached-${cached.url}`}
                                                    onClick={() => {
                                                        if (cached.mode === "poster" && onAiPosterGenerated) {
                                                            onAiPosterGenerated(cached.url);
                                                        } else {
                                                            onBackgroundChange(cached.url);
                                                            onBackgroundsGenerated([cached.url]);
                                                        }
                                                    }}
                                                    className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                                                        isSelected
                                                            ? "ring-2 ring-indigo-500 ring-offset-2"
                                                            : "ring-1 ring-slate-200 dark:ring-slate-700"
                                                    }`}
                                                >
                                                    <img
                                                        src={cached.url}
                                                        alt={`Cached ${cached.style} ${cached.mode}`}
                                                        className="w-20 h-20 rounded-xl object-cover"
                                                    />
                                                    <span className={`absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold ${
                                                        cached.mode === "poster"
                                                            ? "bg-purple-600/80 text-white"
                                                            : "bg-black/60 text-amber-300"
                                                    }`}>
                                                        {cached.mode === "poster" ? (
                                                            <Crown className="w-2 h-2" />
                                                        ) : (
                                                            <Database className="w-2 h-2" />
                                                        )}
                                                        {cached.mode === "poster"
                                                            ? (POSTER_STYLE_LABELS[cached.style as AiPosterStyle] || cached.style)
                                                            : (STYLE_LABELS[cached.style as AiImageStyle] || cached.style)
                                                        }
                                                    </span>
                                                    {isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                                                            <Check className="w-5 h-5 text-white drop-shadow-md" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Unsplash Search (visible when source is "stock") */}
            <AnimatePresence>
                {activeSource === "stock" && (
                    <motion.div {...SECTION_ANIMATION}>
                        <div className="space-y-3 pt-1">
                            {/* Search input row */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search Unsplash..."
                                        value={unsplashQuery}
                                        onChange={(e) =>
                                            setUnsplashQuery(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            fetchUnsplashImages()
                                        }
                                        className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                    />
                                    {unsplashQuery && (
                                        <button
                                            onClick={() => {
                                                setUnsplashQuery("");
                                                setUnsplashResults([]);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={fetchUnsplashImages}
                                    disabled={
                                        !unsplashQuery.trim() ||
                                        searchingUnsplash
                                    }
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-sm font-bold hover:bg-slate-900 disabled:opacity-50 transition-all"
                                >
                                    {searchingUnsplash ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Search className="w-3.5 h-3.5" />
                                    )}
                                    Search
                                </button>
                            </div>

                            {/* Curated Destination Images */}
                            {curatedImages.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        <Camera className="w-3 h-3" />
                                        Curated for {curatedImages[0].destination}
                                    </span>
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {curatedImages.map((image) => {
                                            const isSelected =
                                                image.url ===
                                                selectedBackground;
                                            return (
                                                <button
                                                    key={image.thumb}
                                                    onClick={() =>
                                                        handleCuratedSelect(
                                                            image
                                                        )
                                                    }
                                                    title={`${image.destination} by ${image.photographer}`}
                                                    className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                                                        isSelected
                                                            ? "ring-2 ring-emerald-500 ring-offset-2"
                                                            : "ring-1 ring-slate-200 dark:ring-slate-700"
                                                    }`}
                                                >
                                                    <img
                                                        src={image.thumb}
                                                        alt={`${image.destination} - ${image.tags.join(", ")}`}
                                                        className="w-20 h-20 rounded-xl object-cover"
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                                                            <Check className="w-5 h-5 text-white drop-shadow-md" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Unsplash Results */}
                            {unsplashResults.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {unsplashResults.map((result) => {
                                        const isSelected =
                                            result.url === selectedBackground;
                                        return (
                                            <button
                                                key={result.id}
                                                onClick={() =>
                                                    handleUnsplashSelect(result)
                                                }
                                                className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                                                    isSelected
                                                        ? "ring-2 ring-indigo-500 ring-offset-2"
                                                        : "ring-1 ring-slate-200 dark:ring-slate-700"
                                                }`}
                                            >
                                                <img
                                                    src={result.url}
                                                    alt="Unsplash result"
                                                    className="w-20 h-20 rounded-xl object-cover"
                                                />
                                                {isSelected && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                                                        <Check className="w-5 h-5 text-white drop-shadow-md" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 5. Error State */}
            {aiError && !isGenerating && (
                <div className="text-center py-3 px-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {aiError}
                    </p>
                    <button
                        onClick={aiMode === "poster" ? handleGenerateAiPoster : handleGenerateAiImages}
                        className="mt-2 text-[10px] font-bold text-red-600 hover:text-red-700 underline"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
}
