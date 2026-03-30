"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
    Loader2,
    Search,
    X,
    Check,
    Camera,
} from "lucide-react";
import { toast } from "sonner";
import { matchDestination } from "@/lib/social/destination-images";
import {
    SECTION_ANIMATION,
    type UnsplashResult,
    type DestinationImage,
} from "./background-picker-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StockTabProps {
    destination: string;
    selectedBackground: string;
    onBackgroundChange: (url: string) => void;
    onBackgroundsGenerated: (urls: string[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StockTab({
    destination,
    selectedBackground,
    onBackgroundChange,
    onBackgroundsGenerated,
}: StockTabProps) {
    const [unsplashQuery, setUnsplashQuery] = useState(destination || "");
    const [unsplashResults, setUnsplashResults] = useState<UnsplashResult[]>([]);
    const [searchingUnsplash, setSearchingUnsplash] = useState(false);
    const initialSearchDoneRef = useRef(false);

    // -----------------------------------------------------------------------
    // Curated: Pre-matched destination images (instant, no API call)
    // -----------------------------------------------------------------------

    const curatedImages: DestinationImage[] = useMemo(
        () => matchDestination(destination),
        [destination],
    );

    const handleCuratedSelect = useCallback(
        (image: DestinationImage) => {
            onBackgroundChange(image.url);
            onBackgroundsGenerated([image.url]);
        },
        [onBackgroundChange, onBackgroundsGenerated],
    );

    // -----------------------------------------------------------------------
    // Unsplash Search
    // -----------------------------------------------------------------------

    const fetchUnsplashImagesForQuery = useCallback(
        async (query: string) => {
            if (!query.trim()) return;
            setSearchingUnsplash(true);
            try {
                const response = await fetch(
                    `/api/images/unsplash?query=${encodeURIComponent(query)}&per_page=8`,
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
        [],
    );

    const fetchUnsplashImages = async () => {
        await fetchUnsplashImagesForQuery(unsplashQuery);
    };

    const handleUnsplashSelect = (result: UnsplashResult) => {
        onBackgroundChange(result.url);
        onBackgroundsGenerated([result.url]);
    };

    // -----------------------------------------------------------------------
    // Auto-populate query from destination on mount (defer search to user action)
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (destination && !initialSearchDoneRef.current) {
            initialSearchDoneRef.current = true;
            setUnsplashQuery(destination);
            // Defer Unsplash fetch — curated images load instantly;
            // Unsplash results appear when user clicks search or changes destination.
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -----------------------------------------------------------------------
    // Auto-search when destination changes (debounced 500ms)
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (!destination) return;
        if (!initialSearchDoneRef.current) return;

        setUnsplashQuery(destination);

        const timer = setTimeout(() => {
            fetchUnsplashImagesForQuery(destination);
        }, 500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destination]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <motion.div {...SECTION_ANIMATION}>
            <div className="space-y-3 pt-1">
                {/* Search input row */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search Unsplash..."
                            value={unsplashQuery}
                            onChange={(e) => setUnsplashQuery(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && fetchUnsplashImages()
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
                        disabled={!unsplashQuery.trim() || searchingUnsplash}
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
                                    image.url === selectedBackground;
                                return (
                                    <button
                                        key={image.thumb}
                                        onClick={() =>
                                            handleCuratedSelect(image)
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
                                            loading="lazy"
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
                                        loading="lazy"
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
    );
}
