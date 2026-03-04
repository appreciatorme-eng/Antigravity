"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    ArrowLeft,
    Download,
    Zap,
    Smartphone,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Save,
    Send,
    X,
    Check,
} from "lucide-react";
import { SocialTemplate } from "@/lib/social/types";
import {
    CenterLayout,
    ElegantLayout,
    SplitLayout,
    BottomLayout,
    ReviewLayout,
    CarouselSlideLayout,
    ServiceShowcaseLayout,
    HeroServicesLayout,
    InfoSplitLayout,
    GradientHeroLayout,
    DiagonalSplitLayout,
    MagazineCoverLayout,
    DuotoneLayout,
    BoldTypographyLayout,
} from "@/components/social/templates/layouts/LayoutRenderer";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CanvasModeProps {
    template: SocialTemplate;
    templateData: any;
    backgrounds: string[];
    selectedBackground: string;
    connections: { instagram: boolean; facebook: boolean };
    onTemplateDataChange: (updater: (prev: any) => any) => void;
    onBackgroundChange: (url: string) => void;
    onClose: () => void;
}

// ---------------------------------------------------------------------------
// Layout helpers (ported from TemplateGallery)
// ---------------------------------------------------------------------------

function renderLayout(preset: SocialTemplate, templateData: any) {
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
}

function renderBg(preset: SocialTemplate): string {
    const selfBgLayouts = [
        "ServiceShowcaseLayout", "HeroServicesLayout", "InfoSplitLayout",
        "GradientHeroLayout", "DiagonalSplitLayout", "MagazineCoverLayout",
        "DuotoneLayout", "BoldTypographyLayout",
    ];
    if (selfBgLayouts.includes(preset.layout)) return "";
    if (preset.colorScheme === "dark")  return "bg-slate-900 text-white";
    if (preset.colorScheme === "light") return "bg-white text-slate-900";
    return "bg-gradient-to-br from-indigo-500 to-purple-600 text-white";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CanvasMode({
    template,
    templateData,
    backgrounds,
    selectedBackground,
    connections,
    onTemplateDataChange,
    onBackgroundChange,
    onClose,
}: CanvasModeProps) {
    // ── Internal state ──────────────────────────────────────────────────────
    const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(() =>
        Math.max(0, backgrounds.indexOf(selectedBackground)),
    );
    const [showPhoneMockup, setShowPhoneMockup] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [hdExporting, setHdExporting] = useState(false);
    const [showPublishDrawer, setShowPublishDrawer] = useState(false);

    // Keep background index in sync when selectedBackground changes externally
    useEffect(() => {
        const idx = backgrounds.indexOf(selectedBackground);
        if (idx >= 0) setActiveBackgroundIndex(idx);
    }, [selectedBackground, backgrounds]);

    // ── Background carousel navigation ──────────────────────────────────────
    const goToPrevBackground = useCallback(() => {
        setActiveBackgroundIndex((prev) => {
            const next = prev <= 0 ? backgrounds.length - 1 : prev - 1;
            onBackgroundChange(backgrounds[next]);
            return next;
        });
    }, [backgrounds, onBackgroundChange]);

    const goToNextBackground = useCallback(() => {
        setActiveBackgroundIndex((prev) => {
            const next = prev >= backgrounds.length - 1 ? 0 : prev + 1;
            onBackgroundChange(backgrounds[next]);
            return next;
        });
    }, [backgrounds, onBackgroundChange]);

    // ── Keyboard navigation ─────────────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowLeft") goToPrevBackground();
            if (e.key === "ArrowRight") goToNextBackground();
            if (e.key === "Escape") onClose();
        },
        [goToPrevBackground, goToNextBackground, onClose],
    );

    // ── Download (client-side html-to-image) ────────────────────────────────
    const handleDownload = async () => {
        setDownloading(true);
        try {
            const node = document.getElementById(`canvas-export-${template.id}`);
            if (!node) return;
            const { toPng } = await import("html-to-image");
            const dataUrl = await toPng(node, {
                quality: 1,
                pixelRatio: 2,
                width: 1080,
                height: 1080,
            });
            const link = document.createElement("a");
            link.download = `${template.name.replace(/\s+/g, "-")}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Downloaded!");
        } catch {
            toast.error("Error generating image.");
        } finally {
            setDownloading(false);
        }
    };

    // ── HD Export (server-side render) ───────────────────────────────────────
    const handleHdExport = async () => {
        setHdExporting(true);
        try {
            const res = await fetch("/api/social/render-poster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateData,
                    layoutType: template.layout,
                    backgroundUrl: templateData.heroImage,
                    aspectRatio: "square",
                    format: "png",
                    quality: 95,
                }),
            });
            if (!res.ok) throw new Error("HD export failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `${template.name.replace(/\s+/g, "-")}-HD.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("HD poster downloaded!");
        } catch {
            toast.error("HD export failed.");
        } finally {
            setHdExporting(false);
        }
    };

    // ── Save Draft ──────────────────────────────────────────────────────────
    const handleSaveDraft = async () => {
        try {
            await fetch("/api/social/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    template_id: template.id,
                    template_data: templateData,
                    status: "draft",
                    source: "canvas",
                }),
            });
            toast.success("Saved as draft!");
        } catch {
            toast.error("Failed to save draft.");
        }
    };

    // ── Shared input styles ─────────────────────────────────────────────────
    const labelCls =
        "text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1";
    const inputCls =
        "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-indigo-500 outline-none";

    // ── Preview scale ───────────────────────────────────────────────────────
    const PREVIEW_WIDTH = 600;
    const canvasScale = PREVIEW_WIDTH / 1080;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col overflow-hidden"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {template.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {template.layout.replace("Layout", "")} &middot; {template.category}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPhoneMockup((v) => !v)}
                        className={`p-2 rounded-xl transition-colors ${
                            showPhoneMockup
                                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        }`}
                        title="Phone Preview"
                    >
                        <Smartphone className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* ── Main content ────────────────────────────────────────────── */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0 overflow-hidden">
                {/* ── Left: Preview ────────────────────────────────────────── */}
                <div className="lg:col-span-3 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-8 overflow-auto">
                    {showPhoneMockup ? (
                        /* ── Phone mockup ──────────────────────────────────── */
                        <div className="relative w-[220px] bg-black rounded-[36px] p-[6px] shadow-2xl border-2 border-slate-700 mx-auto">
                            {/* Notch */}
                            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-10 border border-slate-600" />
                            <div className="rounded-[30px] overflow-hidden bg-white">
                                {/* Fake IG header */}
                                <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-100">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shrink-0" />
                                    <span className="text-[9px] font-bold text-slate-700 truncate flex-1">
                                        {templateData?.companyName || "your_agency"}
                                    </span>
                                </div>
                                {/* Scaled template */}
                                <div className="overflow-hidden" style={{ width: 208, height: 208 }}>
                                    <div
                                        className={`origin-top-left ${renderBg(template)} overflow-hidden`}
                                        style={{
                                            width: 1080,
                                            height: 1080,
                                            transform: `scale(${208 / 1080})`,
                                        }}
                                    >
                                        {renderLayout(template, templateData)}
                                    </div>
                                </div>
                                {/* IG actions */}
                                <div className="px-3 py-2 bg-white space-y-0.5">
                                    <div className="flex gap-3 text-sm">
                                        <span>&#9829;</span>
                                        <span>&#128172;</span>
                                        <span>&#9992;</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-700">142 likes</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── Full-size preview ─────────────────────────────── */
                        <div
                            className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
                            style={{
                                width: PREVIEW_WIDTH,
                                height: PREVIEW_WIDTH,
                            }}
                        >
                            <div
                                className={`origin-top-left ${renderBg(template)} overflow-hidden flex flex-col`}
                                style={{
                                    width: 1080,
                                    height: 1080,
                                    transform: `scale(${canvasScale})`,
                                }}
                            >
                                {renderLayout(template, templateData)}
                            </div>
                        </div>
                    )}

                    {/* ── Background carousel dots ────────────────────────── */}
                    {backgrounds.length > 1 && (
                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={goToPrevBackground}
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-500" />
                            </button>
                            <div className="flex items-center gap-2">
                                {backgrounds.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setActiveBackgroundIndex(idx);
                                            onBackgroundChange(backgrounds[idx]);
                                        }}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                                            idx === activeBackgroundIndex
                                                ? "bg-indigo-500 scale-125"
                                                : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                                        }`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={goToNextBackground}
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Right: Editing Panel ─────────────────────────────────── */}
                <div className="lg:col-span-2 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-6 space-y-6">
                    {/* ── Content Section ──────────────────────────────────── */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-xs">
                                &#9998;
                            </span>
                            Content
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Destination</label>
                                <input
                                    type="text"
                                    value={templateData.destination || ""}
                                    onChange={(e) =>
                                        onTemplateDataChange((prev) => ({
                                            ...prev,
                                            destination: e.target.value,
                                        }))
                                    }
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Price</label>
                                <input
                                    type="text"
                                    value={templateData.price || ""}
                                    onChange={(e) =>
                                        onTemplateDataChange((prev) => ({
                                            ...prev,
                                            price: e.target.value,
                                        }))
                                    }
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Offer</label>
                                <input
                                    type="text"
                                    value={templateData.offer || ""}
                                    onChange={(e) =>
                                        onTemplateDataChange((prev) => ({
                                            ...prev,
                                            offer: e.target.value,
                                        }))
                                    }
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Season</label>
                                <input
                                    type="text"
                                    value={templateData.season || ""}
                                    onChange={(e) =>
                                        onTemplateDataChange((prev) => ({
                                            ...prev,
                                            season: e.target.value,
                                        }))
                                    }
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Backgrounds Section ─────────────────────────────── */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center text-xs">
                                &#128444;
                            </span>
                            Backgrounds
                        </h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {backgrounds.map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setActiveBackgroundIndex(idx);
                                        onBackgroundChange(url);
                                    }}
                                    className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 transition-all ${
                                        idx === activeBackgroundIndex
                                            ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950"
                                            : "ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-400"
                                    }`}
                                >
                                    <img
                                        src={url}
                                        alt={`Background ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Export Section ───────────────────────────────────── */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-xs">
                                &#128228;
                            </span>
                            Export
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                {downloading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                Download
                            </button>
                            <button
                                onClick={handleHdExport}
                                disabled={hdExporting}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                            >
                                {hdExporting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4" />
                                )}
                                HD Export
                            </button>
                            <button
                                onClick={() => setShowPhoneMockup((v) => !v)}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-colors ${
                                    showPhoneMockup
                                        ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                                }`}
                            >
                                <Smartphone className="w-4 h-4" />
                                Phone Preview
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: integrate PublishKitDrawer
                                    setShowPublishDrawer(true);
                                    toast("Publish flow coming soon!");
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                Publish
                            </button>
                        </div>
                    </div>

                    {/* ── Connection status ────────────────────────────────── */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1">
                            {connections.instagram ? (
                                <Check className="w-3 h-3 text-green-500" />
                            ) : (
                                <X className="w-3 h-3 text-slate-300" />
                            )}
                            Instagram
                        </span>
                        <span className="flex items-center gap-1">
                            {connections.facebook ? (
                                <Check className="w-3 h-3 text-green-500" />
                            ) : (
                                <X className="w-3 h-3 text-slate-300" />
                            )}
                            Facebook
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Gallery
                </button>
                <button
                    onClick={handleSaveDraft}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    Save Draft
                </button>
            </div>

            {/* ── Offscreen render div for download/export ────────────────── */}
            <div
                id={`canvas-export-${template.id}`}
                className="absolute -z-50 pointer-events-none"
                style={{ width: 1080, height: 1080, left: -9999, top: 0 }}
            >
                <div className={`w-full h-full ${renderBg(template)} flex flex-col`}>
                    {renderLayout(template, templateData)}
                </div>
            </div>
        </motion.div>
    );
}
