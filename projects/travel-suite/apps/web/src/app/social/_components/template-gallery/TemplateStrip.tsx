"use client";

import { Star } from "lucide-react";
import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";
import { renderLayout, renderBg } from "./layout-helpers";
import type { Dimensions } from "./types";

export interface TemplateStripProps {
    readonly title: string;
    readonly variant: "recent" | "favorite";
    readonly items: readonly SocialTemplate[];
    readonly templateData: TemplateDataForRender;
    readonly dims: Dimensions;
    readonly onSelect: (preset: SocialTemplate) => void;
}

export function TemplateStrip({
    title,
    variant,
    items,
    templateData,
    dims,
    onSelect,
}: TemplateStripProps) {
    if (items.length === 0) return null;

    const isRecent = variant === "recent";

    const borderClass = isRecent
        ? "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
        : "border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600";

    const groupClass = isRecent ? "group/recent" : "group/fav";

    const nameHoverClass = isRecent
        ? "group-hover/recent:text-indigo-600 dark:group-hover/recent:text-indigo-400"
        : "group-hover/fav:text-amber-600 dark:group-hover/fav:text-amber-400";

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                {!isRecent && <Star className="w-3.5 h-3.5 text-amber-500" />}
                {title}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {items.map(preset => (
                    <button
                        key={`${variant}-${preset.id}`}
                        onClick={() => onSelect(preset)}
                        className={`flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border ${borderClass} rounded-xl hover:shadow-md transition-all shrink-0 ${groupClass}`}
                        style={{ width: 200 }}
                    >
                        {/* Mini color swatch */}
                        <div
                            className={`w-10 h-10 rounded-lg shrink-0 overflow-hidden ${renderBg(preset)}`}
                        >
                            <div
                                className={`origin-top-left ${renderBg(preset)} overflow-hidden`}
                                style={{
                                    width: dims.w,
                                    height: dims.h,
                                    transform: `scale(${40 / dims.w})`,
                                }}
                            >
                                {renderLayout(preset, templateData)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p
                                className={`text-sm font-bold text-slate-700 dark:text-slate-200 truncate ${nameHoverClass} transition-colors`}
                            >
                                {preset.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide truncate">
                                {preset.category}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
