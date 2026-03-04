"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import { Download, Eye, Instagram, Linkedin, Lock, Loader2, Search, X, Zap, Smartphone, Square, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTemplatesByCategory, templates, searchTemplates, canAccessTemplate } from "@/lib/social/template-registry";
import { CenterLayout, ElegantLayout, SplitLayout, BottomLayout, ReviewLayout, CarouselSlideLayout, ServiceShowcaseLayout, HeroServicesLayout, InfoSplitLayout, GradientHeroLayout, DiagonalSplitLayout, MagazineCoverLayout, DuotoneLayout, BoldTypographyLayout } from "@/components/social/templates/layouts/LayoutRenderer";
import { SocialTemplate } from "@/lib/social/types";
import { getUpcomingFestivals } from "@/lib/social/indian-calendar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PublishKitDrawer } from "./PublishKitDrawer";

// Aspect ratio dimension map
const RATIO_DIMS: Record<string, { w: number; h: number; label: string }> = {
    square:   { w: 1080, h: 1080, label: "1:1" },
    portrait: { w: 1080, h: 1350, label: "4:5" },
    story:    { w: 1080, h: 1920, label: "Story" },
};

// TODO: pull from billing context in production
const USER_TIER = "Enterprise";

interface Props {
    templateData: any;
    connections?: { instagram: boolean; facebook: boolean };
    onTemplateSelect?: (template: SocialTemplate) => void;
}

export const TemplateGallery = ({ templateData, connections = { instagram: false, facebook: false }, onTemplateSelect }: Props) => {
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [aspectRatio, setAspectRatio] = useState<"square" | "portrait" | "story">("square");
    const [drawerTemplate, setDrawerTemplate] = useState<SocialTemplate | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [hdExporting, setHdExporting] = useState<string | null>(null);
    const [phoneMockupId, setPhoneMockupId] = useState<string | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<SocialTemplate | null>(null);

    const upcomingFestivals = getUpcomingFestivals();
    const dims = RATIO_DIMS[aspectRatio];

    // Filtered template list
    let PRESET_TEMPLATES: SocialTemplate[];
    if (searchQuery.trim()) {
        PRESET_TEMPLATES = searchTemplates(searchQuery.trim());
    } else if (activeCategory === "All") {
        PRESET_TEMPLATES = templates;
    } else {
        PRESET_TEMPLATES = getTemplatesByCategory(activeCategory);
    }

    const downloadImage = async (elementId: string, filename: string, templateId: string) => {
        try {
            setDownloading(templateId);
            const node = document.getElementById(elementId);
            if (!node) return;
            const dataUrl = await toPng(node, {
                quality: 1,
                pixelRatio: 2,
                width: dims.w,
                height: dims.h,
                style: { transform: "scale(1)", transformOrigin: "top left" },
            });
            const link = document.createElement("a");
            link.download = filename;
            link.href = dataUrl;
            link.click();
            toast.success("Downloaded! Ready for Instagram.");
        } catch {
            toast.error("Error generating image.");
        } finally {
            setDownloading(null);
        }
    };

    const handleSaveDraft = async (templateId: string, caption: string) => {
        const res = await fetch("/api/social/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                template_id: templateId,
                template_data: templateData,
                caption_instagram: caption,
                status: "draft",
                source: "manual",
            }),
        });
        if (!res.ok) throw new Error("Save failed");
    };

    const handleHdExport = async (templateId: string, preset: SocialTemplate) => {
        setHdExporting(templateId);
        try {
            const res = await fetch("/api/social/render-poster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateData,
                    layoutType: preset.layout,
                    backgroundUrl: templateData.heroImage,
                    aspectRatio,
                    format: "png",
                    quality: 95,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: "HD export failed" }));
                throw new Error(errData.error || "HD export failed");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `${preset.name.replace(/\s+/g, "-")}-HD.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("HD poster downloaded!");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "HD export failed";
            toast.error(message);
        } finally {
            setHdExporting(null);
        }
    };

    const renderLayout = (preset: SocialTemplate) => {
        const p = { templateData, preset };
        switch (preset.layout) {
            case "ElegantLayout":           return <ElegantLayout {...p} />;
            case "SplitLayout":             return <SplitLayout {...p} />;
            case "BottomLayout":            return <BottomLayout {...p} />;
            case "ReviewLayout":            return <ReviewLayout {...p} />;
            case "CarouselSlideLayout":     return <CarouselSlideLayout {...p} />;
            case "ServiceShowcaseLayout":   return <ServiceShowcaseLayout {...p} />;
            case "HeroServicesLayout":      return <HeroServicesLayout {...p} />;
            case "InfoSplitLayout":         return <InfoSplitLayout {...p} />;
            case "GradientHeroLayout":      return <GradientHeroLayout {...p} />;
            case "DiagonalSplitLayout":     return <DiagonalSplitLayout {...p} />;
            case "MagazineCoverLayout":     return <MagazineCoverLayout {...p} />;
            case "DuotoneLayout":           return <DuotoneLayout {...p} />;
            case "BoldTypographyLayout":    return <BoldTypographyLayout {...p} />;
            default:                        return <CenterLayout {...p} />;
        }
    };

    const renderBg = (preset: SocialTemplate) => {
        const selfBgLayouts = [
            "ServiceShowcaseLayout", "HeroServicesLayout", "InfoSplitLayout",
            "GradientHeroLayout", "DiagonalSplitLayout", "MagazineCoverLayout",
            "DuotoneLayout", "BoldTypographyLayout",
        ];
        if (selfBgLayouts.includes(preset.layout)) return "";
        // CarouselSlideLayout has its own built-in background
        if (preset.layout === "CarouselSlideLayout") return "";
        // Use template-specific palette if available
        if (preset.palette) return `${preset.palette.bg} ${preset.palette.text}`;
        if (preset.colorScheme === "dark")  return "bg-slate-900 text-white";
        if (preset.colorScheme === "light") return "bg-white text-slate-900";
        return "bg-gradient-to-br from-indigo-500 to-purple-600 text-white";
    };

    // Responsive preview: measure actual card width and scale 1080px canvas to fill it
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

    return (
        <div className="space-y-5 animate-fade-in-up">

            {/* ── Festival Urgency Banner ─────────────────────────────────── */}
            <AnimatePresence>
                {upcomingFestivals.length > 0 && !searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl cursor-pointer hover:border-amber-400 transition-colors group"
                        onClick={() => { setActiveCategory("Festival"); setSearchQuery(""); }}
                    >
                        <span className="text-2xl shrink-0">🎉</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm truncate">
                                {upcomingFestivals[0].name}
                                {(() => {
                                    const days = Math.ceil((new Date(upcomingFestivals[0].date).getTime() - Date.now()) / 86400000);
                                    return days > 0 ? ` is in ${days} day${days !== 1 ? "s" : ""}` : " is today!";
                                })()}
                                {upcomingFestivals.length > 1 && ` (+${upcomingFestivals.length - 1} more upcoming)`}
                            </p>
                            <p className="text-amber-600 dark:text-amber-400 text-xs font-medium mt-0.5">
                                Festival templates are ready — tap to filter →
                            </p>
                        </div>
                        <Zap className="w-5 h-5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Search ─────────────────────────────────────────────────── */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search templates… Dubai, Holi, Family, Flash Sale"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); if (e.target.value) setActiveCategory("All"); }}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* ── Categories + Aspect Ratio ──────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {["All", "Festival", "Destination", "Package Type", "Season", "Promotion", "Review", "Carousel", "Informational"].map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
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
                            onClick={() => setAspectRatio(r)}
                            title={`${RATIO_DIMS[r].label} — ${RATIO_DIMS[r].w}×${RATIO_DIMS[r].h}`}
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
                {PRESET_TEMPLATES.length} template{PRESET_TEMPLATES.length !== 1 ? "s" : ""}
                {searchQuery ? ` for "${searchQuery}"` : activeCategory !== "All" ? ` in ${activeCategory}` : " total"}
            </p>

            {/* ── Quick Preview Panel ─────────────────────────────── */}
            <AnimatePresence>
                {previewTemplate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Eye className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            Preview: {previewTemplate.name}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                            {previewTemplate.layout.replace("Layout", "")} · {previewTemplate.category}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPhoneMockupId(phoneMockupId === previewTemplate.id ? null : previewTemplate.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                                    >
                                        <Smartphone className="w-3.5 h-3.5" /> Phone
                                    </button>
                                    <button
                                        onClick={() => setPreviewTemplate(null)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Preview content */}
                            <div className="flex gap-5 items-start justify-center">
                                {/* Large preview (540px = 50% of 1080) */}
                                <div
                                    className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 ${renderBg(previewTemplate)}`}
                                    style={{ width: 540, height: dims.h * (540 / dims.w), flexShrink: 0 }}
                                >
                                    <div
                                        className={`origin-top-left overflow-hidden ${renderBg(previewTemplate)} relative`}
                                        style={{ width: dims.w, height: dims.h, transform: `scale(${540 / dims.w})` }}
                                    >
                                        {renderLayout(previewTemplate)}
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 justify-center pt-1">
                                <button
                                    onClick={() => downloadImage(`export-${previewTemplate.id}`, `${previewTemplate.name.replace(/\s+/g, "-")}.png`, previewTemplate.id)}
                                    disabled={downloading === previewTemplate.id}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    {downloading === previewTemplate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    Download
                                </button>
                                <button
                                    onClick={() => handleHdExport(previewTemplate.id, previewTemplate)}
                                    disabled={hdExporting === previewTemplate.id}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                >
                                    {hdExporting === previewTemplate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    HD Export
                                </button>
                                {onTemplateSelect && (
                                    <button
                                        onClick={() => { onTemplateSelect(previewTemplate); setPreviewTemplate(null); }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-900 transition-colors"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                        Open in Editor
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Template Grid ───────────────────────────────────────────── */}
            <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {PRESET_TEMPLATES.map((preset, idx) => {
                    const locked = !canAccessTemplate(preset.tier, USER_TIER);
                    const isLoading = downloading === preset.id;

                    return (
                        <motion.div
                            key={preset.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.035 }}
                            onClick={() => !locked && onTemplateSelect?.(preset)}
                            data-template-card
                            className={`group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex flex-col hover:shadow-xl transition-all duration-300 ${!locked && onTemplateSelect ? "cursor-pointer" : ""}`}
                        >
                            {/* OFFSCREEN HIGH-RES RENDER */}
                            <div
                                id={`export-${preset.id}`}
                                className={`absolute -z-50 overflow-hidden pointer-events-none ${renderBg(preset)} flex flex-col`}
                                style={{ width: dims.w, height: dims.h, left: -9999, top: 0 }}
                            >
                                {renderLayout(preset)}
                            </div>

                            {/* VISUAL PREVIEW (scaled CSS — fills card width) */}
                            <div
                                className="relative w-full overflow-hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                                style={{ height: previewH }}
                            >
                                <div
                                    className={`pointer-events-none origin-top-left overflow-hidden ${renderBg(preset)} flex flex-col absolute top-0 left-0`}
                                    style={{ width: dims.w, height: dims.h, transform: `scale(${scale})` }}
                                >
                                    {renderLayout(preset)}
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
                                                    onClick={(e) => { e.stopPropagation(); setDrawerTemplate(preset); }}
                                                >
                                                    <Instagram className="w-4 h-4 mr-1.5" /> Use This
                                                </Button>
                                                <button
                                                    title="Preview in phone"
                                                    onClick={(e) => { e.stopPropagation(); setPhoneMockupId(phoneMockupId === preset.id ? null : preset.id); }}
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
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-black/85 z-30 flex items-center justify-center p-4"
                                        onClick={() => setPhoneMockupId(null)}
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
                                                        {renderLayout(preset)}
                                                    </div>
                                                </div>
                                                {/* IG actions */}
                                                <div className="px-3 py-2 bg-white space-y-0.5">
                                                    <div className="flex gap-2.5 text-sm">
                                                        <span>♥</span><span>💬</span><span>✈</span>
                                                    </div>
                                                    <p className="text-[8px] font-bold text-slate-700">142 likes</p>
                                                    <p className="text-[7px] text-slate-500 line-clamp-2">
                                                        <span className="font-bold">{templateData?.companyName || "your_agency"}</span>{" "}
                                                        ✈️ {templateData?.destination} from {templateData?.price}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex justify-center mt-1 mb-0.5">
                                                <div className="w-10 h-1 bg-slate-600 rounded-full" />
                                            </div>
                                        </div>
                                        <button
                                            className="absolute top-3 right-3 p-2 bg-white/20 rounded-xl text-white hover:bg-white/30"
                                            onClick={() => setPhoneMockupId(null)}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
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
                                                onClick={(e) => { e.stopPropagation(); setPreviewTemplate(previewTemplate?.id === preset.id ? null : preset); }}
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                    previewTemplate?.id === preset.id
                                                        ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30"
                                                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                }`}
                                                title="Quick Preview"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); downloadImage(`export-${preset.id}`, `${preset.name.replace(/\s+/g, "-")}.png`, preset.id); }}
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
                                                    handleHdExport(preset.id, preset);
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
                    );
                })}
            </div>

            {PRESET_TEMPLATES.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 font-bold text-lg">No templates found</p>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Try a different search term or category.</p>
                </div>
            )}

            {/* Publish Kit Drawer */}
            <PublishKitDrawer
                isOpen={!!drawerTemplate}
                onClose={() => setDrawerTemplate(null)}
                template={drawerTemplate}
                templateData={templateData}
                connections={connections}
                onDownload={() => {
                    if (drawerTemplate) {
                        downloadImage(
                            `export-${drawerTemplate.id}`,
                            `${drawerTemplate.name.replace(/\s+/g, "-")}.png`,
                            drawerTemplate.id
                        );
                    }
                }}
                onSaveDraft={caption => {
                    if (drawerTemplate) return handleSaveDraft(drawerTemplate.id, caption);
                    return Promise.resolve();
                }}
            />
        </div>
    );
};
