"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Wand2,
    Loader2,
    Check,
    Crown,
    Database,
} from "lucide-react";
import { toast } from "sonner";
import {
    generateBackgroundPrompt,
    generateFullPosterPrompt,
    POSTER_STYLE_LABELS,
} from "@/lib/social/ai-prompts";
import {
    AI_STYLES,
    STYLE_LABELS,
    POSTER_STYLES,
    SECTION_ANIMATION,
    saveCachedImage,
    getCachedImagesForDestination,
    type AiImageStyle,
    type AiPosterStyle,
    type CachedImage,
    type BackgroundPickerProps,
} from "./background-picker-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AiTabProps {
    templateData: BackgroundPickerProps["templateData"];
    aiMode: "background" | "poster";
    selectedBackground: string;
    onBackgroundChange: (url: string) => void;
    onBackgroundsGenerated: (urls: string[]) => void;
    onAiPosterGenerated?: (url: string) => void;
    /** Called when cached URLs are fully replaced (on destination change) */
    onCachedUrlsReset: (urls: string[]) => void;
    /** Called when new URLs are added to cache incrementally */
    onCachedUrlsAdd: (urls: string[]) => void;
    /** Called when isGenerating state changes, so parent can disable buttons */
    onGeneratingChange: (generating: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiTab({
    templateData,
    aiMode,
    selectedBackground,
    onBackgroundChange,
    onBackgroundsGenerated,
    onAiPosterGenerated,
    onCachedUrlsReset,
    onCachedUrlsAdd,
    onGeneratingChange,
}: AiTabProps) {
    const [aiStyle, setAiStyle] = useState<AiImageStyle>("cinematic");
    const [posterStyle, setPosterStyle] = useState<AiPosterStyle>("magazine_cover");
    const [generatingAi, setGeneratingAi] = useState(false);
    const [generatingPoster, setGeneratingPoster] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [cachedBgImages, setCachedBgImages] = useState<CachedImage[]>([]);
    const [cachedPosterImages, setCachedPosterImages] = useState<CachedImage[]>([]);

    const isGenerating = generatingAi || generatingPoster;

    // Notify parent when generating state changes
    useEffect(() => {
        onGeneratingChange(isGenerating);
    }, [isGenerating, onGeneratingChange]);

    // -----------------------------------------------------------------------
    // Cache: Load cached images on mount and when destination changes
    // -----------------------------------------------------------------------

    useEffect(() => {
        const bgCached = getCachedImagesForDestination(templateData.destination, "background");
        const posterCached = getCachedImagesForDestination(templateData.destination, "poster");
        setCachedBgImages(bgCached);
        setCachedPosterImages(posterCached);
        onCachedUrlsReset([...bgCached, ...posterCached].map((c) => c.url));

        if (bgCached.length > 0) {
            onBackgroundsGenerated(bgCached.map((c) => c.url));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateData.destination]);

    // -----------------------------------------------------------------------
    // AI Background Generation
    // -----------------------------------------------------------------------

    const handleGenerateAiImages = useCallback(async () => {
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
                    errData.error || `AI generation failed (${res.status})`,
                );
                return;
            }

            const data = await res.json();
            const imgs: { url: string }[] = data.images || [];

            if (imgs.length === 0) {
                setAiError(
                    "No images returned. Try a different destination or style.",
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
            onCachedUrlsAdd(urls);

            onBackgroundsGenerated(urls);
            onBackgroundChange(urls[0]);
        } catch {
            setAiError("Failed to generate images. Please try again.");
        } finally {
            setGeneratingAi(false);
        }
    }, [templateData, aiStyle, onBackgroundsGenerated, onBackgroundChange, onCachedUrlsAdd]);

    // -----------------------------------------------------------------------
    // AI Poster Generation (Magazine-Cover Quality)
    // -----------------------------------------------------------------------

    const handleGenerateAiPoster = useCallback(async () => {
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
                    errData.error || `AI poster generation failed (${res.status})`,
                );
                return;
            }

            const data = await res.json();
            const imgs: { url: string }[] = data.images || [];

            if (imgs.length === 0) {
                setAiError(
                    "No poster returned. Try a different style or destination.",
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
            onCachedUrlsAdd([url]);

            if (onAiPosterGenerated) {
                onAiPosterGenerated(url);
            }

            toast.success("AI poster generated! Your canvas has been updated.");
        } catch {
            setAiError("Failed to generate poster. Please try again.");
        } finally {
            setGeneratingPoster(false);
        }
    }, [templateData, posterStyle, onAiPosterGenerated, onCachedUrlsAdd]);

    // -----------------------------------------------------------------------
    // Derived
    // -----------------------------------------------------------------------

    const activeCachedImages = aiMode === "poster" ? cachedPosterImages : cachedBgImages;

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <>
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

            {/* Error State */}
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
        </>
    );
}
