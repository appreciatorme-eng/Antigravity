"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
    ImageIcon,
    Wand2,
    Search,
    Check,
    Database,
    Crown,
    Sparkles,
} from "lucide-react";
import { AiTab } from "./AiTab";
import { StockTab } from "./StockTab";
import { UploadTab } from "./UploadTab";
import type { BackgroundPickerProps, ActiveSource } from "./background-picker-types";

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
    const [aiMode, setAiMode] = useState<"background" | "poster">("background");
    const [isGenerating, setIsGenerating] = useState(false);
    const [cachedUrls, setCachedUrls] = useState<Set<string>>(new Set());

    // -----------------------------------------------------------------------
    // Cached URL sync callbacks (AiTab reports back what it persists)
    // -----------------------------------------------------------------------

    const handleCachedUrlsReset = useCallback((urls: string[]) => {
        setCachedUrls(new Set(urls));
    }, []);

    const handleCachedUrlsAdd = useCallback((urls: string[]) => {
        setCachedUrls((prev) => new Set([...prev, ...urls]));
    }, []);

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
                <UploadTab onImageUpload={onImageUpload} />
            </div>

            {/* 3. AI Panel (visible when source is "ai") */}
            <AnimatePresence>
                {activeSource === "ai" && (
                    <AiTab
                        templateData={templateData}
                        aiMode={aiMode}
                        selectedBackground={selectedBackground}
                        onBackgroundChange={onBackgroundChange}
                        onBackgroundsGenerated={onBackgroundsGenerated}
                        onAiPosterGenerated={onAiPosterGenerated}
                        onCachedUrlsReset={handleCachedUrlsReset}
                        onCachedUrlsAdd={handleCachedUrlsAdd}
                        onGeneratingChange={setIsGenerating}
                    />
                )}
            </AnimatePresence>

            {/* 4. Stock Panel (visible when source is "stock") */}
            <AnimatePresence>
                {activeSource === "stock" && (
                    <StockTab
                        destination={templateData.destination}
                        selectedBackground={selectedBackground}
                        onBackgroundChange={onBackgroundChange}
                        onBackgroundsGenerated={onBackgroundsGenerated}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
