"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { Palette, Upload, Sparkles, ToggleLeft, ToggleRight, Wand2, ImageIcon, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateBrandPalette, type BrandPalette } from "@/lib/social/color-utils";
import { generateBackgroundPrompt, type AiImageStyle } from "@/lib/social/ai-prompts";

interface TemplateDataBase {
    companyName: string;
    destination: string;
    price: string;
    offer: string;
    season: string;
    contactNumber: string;
    email: string;
    website: string;
    logoUrl?: string;
    logoWidth: number;
    heroImage?: string;
    brandPalette?: BrandPalette;
}

interface UnsplashImage {
    id: string;
    url: string;
}

interface Props<TTemplateData extends TemplateDataBase> {
    templateData: TTemplateData;
    setTemplateData: Dispatch<SetStateAction<TTemplateData>>;
    unsplashQuery: string;
    setUnsplashQuery: (q: string) => void;
    unsplashResults: UnsplashImage[];
    searchingUnsplash: boolean;
    onSearchUnsplash: () => void;
    onImageUpload: (e: ChangeEvent<HTMLInputElement>, type: string) => void;
    orgPrimaryColor?: string | null;
}

export const TemplateEditor = <TTemplateData extends TemplateDataBase>({
    templateData,
    setTemplateData,
    unsplashQuery,
    setUnsplashQuery,
    unsplashResults,
    searchingUnsplash,
    onSearchUnsplash,
    onImageUpload,
    orgPrimaryColor,
}: Props<TTemplateData>) => {
    const [brandColorEnabled, setBrandColorEnabled] = useState(false);
    const [heroTab, setHeroTab] = useState<"stock" | "ai" | "upload">("stock");
    const [aiStyle, setAiStyle] = useState<AiImageStyle>("cinematic");
    const [aiImages, setAiImages] = useState<{ url: string; provider: string }[]>([]);
    const [generatingAi, setGeneratingAi] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const palette = orgPrimaryColor ? generateBrandPalette(orgPrimaryColor) : null;

    const handleGenerateAiImages = async () => {
        setGeneratingAi(true);
        setAiImages([]);
        setAiError(null);
        try {
            const prompt = generateBackgroundPrompt(templateData, aiStyle);
            const res = await fetch("/api/social/ai-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, width: 1080, height: 1080, count: 4 }),
            });
            const data = await res.json();
            const imgs = data.images || [];
            if (imgs.length === 0) {
                setAiError("AI generation took too long. Try again or use Stock Photos.");
            }
            setAiImages(imgs);
        } catch {
            setAiError("Failed to generate images. Please try again.");
            setAiImages([]);
        } finally {
            setGeneratingAi(false);
        }
    };

    const toggleBrandColor = () => {
        if (!palette) return;
        const next = !brandColorEnabled;
        setBrandColorEnabled(next);
        if (next) {
            setTemplateData({ ...templateData, brandPalette: palette });
        } else {
            const nextTemplateData = { ...templateData };
            delete nextTemplateData.brandPalette;
            setTemplateData(nextTemplateData);
        }
    };

    return (
        <div className="lg:col-span-4 space-y-4">
            <GlassCard className="p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-slate-900/40">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <Palette className="w-5 h-5 text-indigo-500" /> Dynamic Content
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Updates all variables across templates instantly</p>
                </div>

                {/* One-Click Stunning */}
                <button
                    onClick={() => {
                        setHeroTab("ai");
                        handleGenerateAiImages();
                    }}
                    disabled={generatingAi}
                    className="w-full relative overflow-hidden rounded-xl p-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl group"
                >
                    <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
                        {generatingAi ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating AI Backgrounds...</>
                        ) : (
                            <><Sparkles className="w-4 h-4 group-hover:animate-pulse" /> One-Click Stunning Poster</>
                        )}
                    </div>
                    <p className="text-[9px] text-white/60 mt-1 text-center font-medium">Auto-generates cinematic AI backgrounds from your destination</p>
                </button>

                {/* Brand Color Toggle */}
                {palette && (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Brand Theme
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Apply your org brand colors to templates</p>
                            </div>
                            <button onClick={toggleBrandColor} className="transition-transform hover:scale-105">
                                {brandColorEnabled
                                    ? <ToggleRight className="w-8 h-8 text-indigo-500" />
                                    : <ToggleLeft className="w-8 h-8 text-slate-400" />
                                }
                            </button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { color: palette.primary,      label: "Primary" },
                                { color: palette.primaryLight,  label: "Light" },
                                { color: palette.primaryDark,   label: "Dark" },
                                { color: palette.secondary,     label: "Accent" },
                                { color: palette.analogous1,    label: "Warm" },
                                { color: palette.analogous2,    label: "Cool" },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex flex-col items-center gap-1">
                                    <div
                                        className="w-7 h-7 rounded-lg shadow-sm border border-white/20 ring-1 ring-black/10"
                                        style={{ backgroundColor: color }}
                                        title={`${label}: ${color}`}
                                    />
                                    <span className="text-[8px] text-slate-400 font-medium">{label}</span>
                                </div>
                            ))}
                        </div>
                        {brandColorEnabled && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
                                Brand colors applied to all templates
                            </p>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-1.5 mt-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center justify-between">
                            Company Name <span className="text-[10px] font-medium opacity-50 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Global</span>
                        </label>
                        <GlassInput
                            value={templateData.companyName}
                            onChange={e => setTemplateData({ ...templateData, companyName: e.target.value })}
                            className="bg-white/50 border-slate-200 shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                        />
                    </div>

                    {/* Asset Pickers */}
                    <div className="py-4 space-y-5 border-y border-dashed border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 -mx-6 px-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex justify-between items-center">
                                Agency Logo (PNG)
                                {templateData.logoUrl && (
                                    <span
                                        className="text-red-500 hover:text-red-600 cursor-pointer text-[10px] font-bold normal-case tracking-normal"
                                        onClick={() => setTemplateData({ ...templateData, logoUrl: undefined })}
                                    >
                                        remove
                                    </span>
                                )}
                            </label>
                            <div className="relative border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-white hover:bg-slate-50 transition-colors shadow-sm group">
                                <input type="file" accept="image/png" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => onImageUpload(e, "logo")} />
                                <div className="py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 group-hover:text-indigo-600 transition-colors">
                                    <Upload className="w-4 h-4" />
                                    {templateData.logoUrl ? "Change Logo Image" : "Upload Transparent Logo"}
                                </div>
                            </div>
                            {templateData.logoUrl && (
                                <div className="mt-3 pl-1 animate-fade-in pb-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between tracking-wide mb-1.5">
                                        Scale Logo Size <span>{templateData.logoWidth}px</span>
                                    </label>
                                    <input
                                        type="range" min="100" max="600"
                                        value={templateData.logoWidth}
                                        onChange={e => setTemplateData({ ...templateData, logoWidth: Number(e.target.value) })}
                                        className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded w-max mb-2 block">
                                Hero / Background Photo
                            </label>

                            {/* Tab Switcher */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-0.5 mb-3">
                                {([
                                    { id: "stock" as const, label: "Stock Photos", icon: <Camera className="w-3 h-3" /> },
                                    { id: "ai" as const, label: "AI Generate", icon: <Wand2 className="w-3 h-3" /> },
                                    { id: "upload" as const, label: "Upload", icon: <Upload className="w-3 h-3" /> },
                                ]).map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setHeroTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                            heroTab === tab.id
                                                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Stock Photos Tab */}
                            {heroTab === "stock" && (
                                <>
                                    <div className="flex gap-2 mb-3">
                                        <GlassInput
                                            placeholder="Search Unsplash (e.g. Paris)..."
                                            value={unsplashQuery}
                                            onChange={e => setUnsplashQuery(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && onSearchUnsplash()}
                                            className="shadow-sm focus:border-indigo-400 bg-white"
                                        />
                                        <Button onClick={onSearchUnsplash} disabled={!unsplashQuery || searchingUnsplash} className="bg-slate-800 hover:bg-slate-900 text-white shadow-md font-semibold px-5">
                                            {searchingUnsplash ? "..." : "Search"}
                                        </Button>
                                    </div>
                                    {unsplashResults?.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2.5 mb-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-inner">
                                            {unsplashResults.map((img) => (
                                                <div
                                                    key={img.id}
                                                    className="aspect-video relative rounded-lg overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
                                                    onClick={() => setTemplateData({ ...templateData, heroImage: img.url })}
                                                >
                                                    <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500 rounded-lg pointer-events-none transition-colors" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* AI Generate Tab */}
                            {heroTab === "ai" && (
                                <div className="space-y-3">
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        AI generates stunning backgrounds from your destination. Powered by Pollinations AI (free).
                                    </p>

                                    {/* Style selector */}
                                    <div className="flex gap-1.5 flex-wrap">
                                        {(["cinematic", "vibrant", "luxury", "minimal"] as AiImageStyle[]).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setAiStyle(s)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold capitalize transition-all ${
                                                    aiStyle === s
                                                        ? "bg-indigo-600 text-white shadow-sm"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={handleGenerateAiImages}
                                        disabled={generatingAi}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg"
                                    >
                                        {generatingAi ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                                        ) : (
                                            <><Wand2 className="w-4 h-4 mr-2" /> Generate 4 AI Backgrounds</>
                                        )}
                                    </Button>

                                    {/* Generated images grid */}
                                    {aiImages.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-100 shadow-inner">
                                            {aiImages.map((img, i) => (
                                                <div
                                                    key={i}
                                                    className="aspect-video relative rounded-lg overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-shadow bg-slate-100"
                                                    onClick={() => setTemplateData({ ...templateData, heroImage: img.url })}
                                                >
                                                    <img
                                                        src={img.url}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        alt={`AI generated ${i + 1}`}
                                                    />
                                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500 rounded-lg pointer-events-none transition-colors" />
                                                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 rounded text-[8px] text-white font-bold backdrop-blur-sm">
                                                        AI
                                                    </div>
                                                    {templateData.heroImage === img.url && (
                                                        <div className="absolute inset-0 border-2 border-purple-500 rounded-lg pointer-events-none" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Error message */}
                                    {aiError && !generatingAi && aiImages.length === 0 && (
                                        <div className="text-center py-4 px-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{aiError}</p>
                                            <button
                                                onClick={handleGenerateAiImages}
                                                className="mt-2 text-[10px] font-bold text-red-600 hover:text-red-700 underline"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Upload Tab */}
                            {heroTab === "upload" && (
                                <div className="relative border border-dashed border-slate-300 dark:border-slate-700/60 rounded-xl overflow-hidden bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors group">
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => onImageUpload(e, "hero")} />
                                    <div className="py-6 text-center text-sm font-medium text-slate-500 group-hover:text-indigo-600 transition-colors flex flex-col items-center justify-center gap-2">
                                        <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                        <span>Click to upload custom photo</span>
                                        <span className="text-[10px] text-slate-400">PNG, JPG up to 10MB</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5 mt-4">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Destination / Headline</label>
                        <GlassInput value={templateData.destination} onChange={e => setTemplateData({ ...templateData, destination: e.target.value })} className="bg-white font-bold" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Price / Starting At</label>
                            <GlassInput value={templateData.price} onChange={e => setTemplateData({ ...templateData, price: e.target.value })} className="bg-white font-semibold text-emerald-600" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Special Offer</label>
                            <GlassInput value={templateData.offer} onChange={e => setTemplateData({ ...templateData, offer: e.target.value })} className="bg-white font-semibold text-rose-600" />
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Theme / Season / Event</label>
                        <GlassInput value={templateData.season} onChange={e => setTemplateData({ ...templateData, season: e.target.value })} placeholder="e.g. Summer Edition, Diwali Special" className="bg-white" />
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Contact Phone</label>
                        <div className="relative">
                            <GlassInput value={templateData.contactNumber} onChange={e => setTemplateData({ ...templateData, contactNumber: e.target.value })} className="bg-white pl-10 tracking-wide font-medium" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg select-none">☎</div>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Email Address</label>
                        <div className="relative">
                            <GlassInput value={templateData.email} onChange={e => setTemplateData({ ...templateData, email: e.target.value })} placeholder="info@youragency.com" className="bg-white pl-10 tracking-wide font-medium" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg select-none">✉</div>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Website URL</label>
                        <div className="relative">
                            <GlassInput value={templateData.website} onChange={e => setTemplateData({ ...templateData, website: e.target.value })} placeholder="www.youragency.com" className="bg-white pl-10 tracking-wide font-medium" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg select-none">🌐</div>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
