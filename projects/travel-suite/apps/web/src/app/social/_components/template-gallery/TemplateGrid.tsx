"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Eye, Instagram, Linkedin, Lock, Loader2, Zap, Smartphone, Maximize2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canAccessTemplate } from "@/lib/social/template-registry";
import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";
import { motion, AnimatePresence } from "framer-motion";
import { renderLayout, renderBg } from "./layout-helpers";
import type { Dimensions } from "./types";

// ── Intersection Observer hook for lazy rendering ─────────────────────
function useIntersectionObserver(options?: IntersectionObserverInit) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(element);
            }
        }, options);

        observer.observe(element);
        return () => observer.disconnect();
    }, [options]);

    return { ref, isVisible };
}

// Stable observer options (defined outside component to avoid re-creation)
const OBSERVER_OPTIONS: IntersectionObserverInit = { rootMargin: "200px" };

// ── LazyTemplateCard wrapper ──────────────────────────────────────────
interface LazyTemplateCardProps {
    children: (isVisible: boolean) => React.ReactNode;
    previewH: number;
    className?: string;
}

function LazyTemplateCard({ children, previewH, className }: LazyTemplateCardProps) {
    const { ref, isVisible } = useIntersectionObserver(OBSERVER_OPTIONS);

    return (
        <div ref={ref} className={className}>
            {isVisible ? (
                children(true)
            ) : (
                <div className="flex flex-col h-full">
                    {/* Skeleton preview area */}
                    <div
                        className="relative w-full overflow-hidden border-b border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 animate-pulse"
                        style={{ height: previewH }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    </div>
                    {/* Skeleton footer */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 mt-auto space-y-2">
                        <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── PhoneMockup sub-component ─────────────────────────────────────────
interface PhoneMockupProps {
    preset: SocialTemplate;
    templateData: TemplateDataForRender;
    dims: Dimensions;
    onClose: () => void;
}

function PhoneMockup({ preset, templateData, dims, onClose }: PhoneMockupProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 z-30 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative w-[190px] bg-black rounded-[32px] p-[5px] shadow-2xl border-[2px] border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                {/* Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-full z-10 border border-slate-600" />
                <div className="rounded-[27px] overflow-hidden bg-white">
                    {/* Fake IG header */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-b border-slate-100">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shrink-0" />
                        <span className="text-[8px] font-bold text-slate-700 truncate flex-1">
                            {templateData?.companyName || "your_agency"}
                        </span>
                        <span className="text-[7px] text-blue-500 font-bold shrink-0">Follow</span>
                    </div>
                    {/* Post */}
                    <div
                        className={`overflow-hidden relative ${renderBg(preset)}`}
                        style={{ width: 180, height: 180 }}
                    >
                        <div
                            className={`origin-top-left ${renderBg(preset)} overflow-hidden`}
                            style={{ width: dims.w, height: dims.h, transform: `scale(${180 / dims.w})` }}
                        >
                            {renderLayout(preset, templateData)}
                        </div>
                    </div>
                    {/* IG actions */}
                    <div className="px-3 py-2 bg-white space-y-0.5">
                        <div className="flex gap-2.5 text-sm">
                            <span>&#9829;</span><span>&#128172;</span><span>&#9992;</span>
                        </div>
                        <p className="text-[8px] font-bold text-slate-700">142 likes</p>
                        <p className="text-[7px] text-slate-500 line-clamp-2">
                            <span className="font-bold">{templateData?.companyName || "your_agency"}</span>{" "}
                            &#9992;&#65039; {templateData?.destination} from {templateData?.price}
                        </p>
                    </div>
                </div>
                <div className="flex justify-center mt-1 mb-0.5">
                    <div className="w-10 h-1 bg-slate-600 rounded-full" />
                </div>
            </div>
            <button
                className="absolute top-3 right-3 p-2 bg-white/20 rounded-xl text-white hover:bg-white/30"
                onClick={onClose}
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

// ── Main TemplateGrid component ───────────────────────────────────────
export interface TemplateGridProps {
    templates: readonly SocialTemplate[];
    templateData: TemplateDataForRender;
    templateUserTier: string;
    dims: Dimensions;
    favorites: Set<string>;
    downloading: string | null;
    hdExporting: string | null;
    phoneMockupId: string | null;
    previewTemplateId: string | null;
    onTemplateSelect: ((preset: SocialTemplate) => void) | undefined;
    onToggleFavorite: (id: string) => void;
    onDownload: (elementId: string, filename: string, templateId: string) => void;
    onHdExport: (templateId: string, preset: SocialTemplate) => void;
    onPhoneMockupToggle: (id: string | null) => void;
    onPreviewToggle: (preset: SocialTemplate | null) => void;
    onDrawerOpen: (preset: SocialTemplate) => void;
}

export function TemplateGrid({
    templates: PRESET_TEMPLATES,
    templateData,
    templateUserTier,
    dims,
    favorites,
    downloading,
    hdExporting,
    phoneMockupId,
    previewTemplateId,
    onTemplateSelect,
    onToggleFavorite,
    onDownload,
    onHdExport,
    onPhoneMockupToggle,
    onPreviewToggle,
    onDrawerOpen,
}: TemplateGridProps) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [cardWidth, setCardWidth] = useState(0);

    const measureCard = useCallback(() => {
        if (!gridRef.current) return;
        const firstCard = gridRef.current.querySelector<HTMLElement>("[data-template-card]");
        if (firstCard) setCardWidth(firstCard.offsetWidth);
    }, []);

    useEffect(() => {
        measureCard();
        const ro = new ResizeObserver(measureCard);
        if (gridRef.current) ro.observe(gridRef.current);
        return () => ro.disconnect();
    }, [measureCard]);

    const previewWidth = cardWidth || 300;
    const scale = previewWidth / dims.w;
    const previewH = dims.h * scale;

    if (PRESET_TEMPLATES.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 font-bold text-lg">No templates found</p>
                <p className="text-slate-400 text-sm mt-1 font-medium">Try a different search term or category.</p>
            </div>
        );
    }

    return (
        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {PRESET_TEMPLATES.map((preset, idx) => {
                const locked = !canAccessTemplate(preset.tier, templateUserTier);
                const isLoading = downloading === preset.id;
                const isFavorited = favorites.has(preset.id);

                return (
                    <LazyTemplateCard
                        key={preset.id}
                        previewH={previewH}
                        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex flex-col"
                    >
                        {(isVisible) => (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx, 12) * 0.035 }}
                                onClick={() => !locked && onTemplateSelect?.(preset)}
                                data-template-card
                                className={`group relative flex flex-col h-full hover:shadow-xl transition-all duration-300 ${!locked && onTemplateSelect ? "cursor-pointer" : ""}`}
                            >
                                {/* OFFSCREEN HIGH-RES RENDER (only when visible) */}
                                {isVisible && (
                                    <div
                                        id={`export-${preset.id}`}
                                        className={`absolute -z-50 overflow-hidden pointer-events-none ${renderBg(preset)} flex flex-col`}
                                        style={{ width: dims.w, height: dims.h, left: -9999, top: 0 }}
                                    >
                                        {renderLayout(preset, templateData)}
                                    </div>
                                )}

                                {/* VISUAL PREVIEW (scaled CSS -- fills card width) */}
                                <div
                                    className="relative w-full overflow-hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                                    style={{ height: previewH }}
                                >
                                    <div
                                        className={`pointer-events-none origin-top-left overflow-hidden ${renderBg(preset)} flex flex-col absolute top-0 left-0`}
                                        style={{ width: dims.w, height: dims.h, transform: `scale(${scale})` }}
                                    >
                                        {renderLayout(preset, templateData)}
                                    </div>

                                    {/* Tier lock */}
                                    {locked && (
                                        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 text-center shadow-xl mx-4">
                                                <Lock className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{preset.tier} Plan</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Upgrade to unlock</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Hover actions */}
                                    {!locked && (
                                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px] z-20">
                                            {onTemplateSelect ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                                        <Maximize2 className="w-6 h-6 text-white" />
                                                    </div>
                                                    <span className="text-white font-bold text-sm">Open in Editor</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-white text-black hover:bg-slate-100 font-bold shadow-xl"
                                                        onClick={(e) => { e.stopPropagation(); onDrawerOpen(preset); }}
                                                    >
                                                        <Instagram className="w-4 h-4 mr-1.5" /> Use This
                                                    </Button>
                                                    <button
                                                        title="Preview in phone"
                                                        onClick={(e) => { e.stopPropagation(); onPhoneMockupToggle(phoneMockupId === preset.id ? null : preset.id); }}
                                                        className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-colors"
                                                    >
                                                        <Smartphone className="w-4 h-4 text-white" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Phone mockup overlay */}
                                <AnimatePresence>
                                    {phoneMockupId === preset.id && (
                                        <PhoneMockup
                                            preset={preset}
                                            templateData={templateData}
                                            dims={dims}
                                            onClose={() => onPhoneMockupToggle(null)}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Card footer */}
                                <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{preset.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">
                                            {preset.layout.replace("Layout", "")} · {preset.category}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {locked ? (
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                                                {preset.tier}
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(preset.id); }}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        isFavorited
                                                            ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30"
                                                            : "text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    }`}
                                                    title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                                                >
                                                    <Star className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onPreviewToggle(previewTemplateId === preset.id ? null : preset); }}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        previewTemplateId === preset.id
                                                            ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30"
                                                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    }`}
                                                    title="Quick Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDownload(`export-${preset.id}`, `${preset.name.replace(/\s+/g, "-")}.png`, preset.id); }}
                                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    {isLoading
                                                        ? <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                                        : <Download className="w-4 h-4" />
                                                    }
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onHdExport(preset.id, preset);
                                                    }}
                                                    disabled={hdExporting === preset.id}
                                                    className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="HD Export (Server Rendered)"
                                                >
                                                    {hdExporting === preset.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Zap className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <div className="flex gap-0.5 opacity-40">
                                                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                                                    <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </LazyTemplateCard>
                );
            })}
        </div>
    );
}
