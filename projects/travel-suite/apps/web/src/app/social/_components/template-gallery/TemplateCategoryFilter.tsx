"use client";

import { Smartphone, Square } from "lucide-react";
import { RATIO_DIMS, type AspectRatio } from "./types";

const CATEGORIES = ["All", "Festival", "Destination", "Package Type", "Season", "Promotion", "Review", "Carousel", "Informational"];

export interface TemplateCategoryFilterProps {
    activeCategory: string;
    searchQuery: string;
    aspectRatio: AspectRatio;
    templateCount: number;
    onCategoryChange: (category: string) => void;
    onAspectRatioChange: (ratio: AspectRatio) => void;
}

export function TemplateCategoryFilter({
    activeCategory,
    searchQuery,
    aspectRatio,
    templateCount,
    onCategoryChange,
    onAspectRatioChange,
}: TemplateCategoryFilterProps) {
    return (
        <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => onCategoryChange(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                                activeCategory === cat && !searchQuery
                                    ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-0.5 shrink-0">
                    {(["square", "portrait", "story"] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => onAspectRatioChange(r)}
                            title={`${RATIO_DIMS[r].label} -- ${RATIO_DIMS[r].w}x${RATIO_DIMS[r].h}`}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                aspectRatio === r
                                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-slate-500"
                            }`}
                        >
                            {r === "square"   && <Square className="w-3 h-3" />}
                            {r === "portrait" && <div className="w-2 h-3 border-[1.5px] border-current rounded-[2px]" />}
                            {r === "story"    && <Smartphone className="w-3 h-3" />}
                            {RATIO_DIMS[r].label}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-slate-400 font-medium -mt-1">
                {templateCount} template{templateCount !== 1 ? "s" : ""}
                {searchQuery ? ` for "${searchQuery}"` : activeCategory !== "All" ? ` in ${activeCategory}` : " total"}
            </p>
        </>
    );
}
