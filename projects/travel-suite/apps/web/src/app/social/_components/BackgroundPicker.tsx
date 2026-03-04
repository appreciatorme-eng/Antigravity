"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ImageIcon,
    Wand2,
    Upload,
    Loader2,
    Search,
    X,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import {
    generateBackgroundPrompt,
    type AiImageStyle,
} from "@/lib/social/ai-prompts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BackgroundPickerProps {
    templateData: {
        destination: string;
        heroImage?: string;
        [key: string]: unknown;
    };
    selectedBackground: string;
    availableBackgrounds: string[];
    onBackgroundChange: (url: string) => void;
    onBackgroundsGenerated: (urls: string[]) => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type ActiveSource = "ai" | "stock" | "upload";

interface UnsplashResult {
    id: string;
    url: string;
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

const SECTION_ANIMATION = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.2 },
};

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
}: BackgroundPickerProps) {
    const [activeSource, setActiveSource] = useState<ActiveSource>("ai");
    const [aiStyle, setAiStyle] = useState<AiImageStyle>("cinematic");
    const [generatingAi, setGeneratingAi] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [unsplashQuery, setUnsplashQuery] = useState("");
    const [unsplashResults, setUnsplashResults] = useState<UnsplashResult[]>([]);
    const [searchingUnsplash, setSearchingUnsplash] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
            onBackgroundsGenerated(urls);
            onBackgroundChange(urls[0]);
        } catch {
            setAiError("Failed to generate images. Please try again.");
        } finally {
            setGeneratingAi(false);
        }
    };

    // -----------------------------------------------------------------------
    // Unsplash Search
    // -----------------------------------------------------------------------

    const fetchUnsplashImages = async () => {
        if (!unsplashQuery.trim()) return;
        setSearchingUnsplash(true);
        try {
            const response = await fetch(
                `/api/images/unsplash?query=${encodeURIComponent(unsplashQuery)}&per_page=8`
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
    };

    const handleUnsplashSelect = (result: UnsplashResult) => {
        onBackgroundChange(result.url);
        onBackgroundsGenerated([result.url]);
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

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
                    No backgrounds yet -- generate or upload one below
                </p>
            )}

            {/* 2. Source Action Buttons */}
            <div className="flex flex-wrap gap-2">
                {/* Generate AI Backgrounds */}
                <button
                    onClick={() => {
                        setActiveSource("ai");
                        handleGenerateAiImages();
                    }}
                    disabled={generatingAi}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg disabled:opacity-60"
                >
                    {generatingAi ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-4 h-4" />
                            Generate Background
                        </>
                    )}
                </button>

                {/* Stock Photos */}
                <button
                    onClick={() =>
                        setActiveSource(
                            activeSource === "stock" ? "ai" : "stock"
                        )
                    }
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeSource === "stock"
                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    }`}
                >
                    <Search className="w-4 h-4" />
                    Stock Photos
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

            {/* 3. AI Style Selector (visible when source is "ai") */}
            <AnimatePresence>
                {activeSource === "ai" && (
                    <motion.div {...SECTION_ANIMATION}>
                        <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Style:
                            </span>
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
            {aiError && !generatingAi && (
                <div className="text-center py-3 px-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {aiError}
                    </p>
                    <button
                        onClick={handleGenerateAiImages}
                        className="mt-2 text-[10px] font-bold text-red-600 hover:text-red-700 underline"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
}
