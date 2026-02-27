"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { Palette, Upload, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateBrandPalette } from "@/lib/social/color-utils";

interface Props {
    templateData: any;
    setTemplateData: (data: any) => void;
    unsplashQuery: string;
    setUnsplashQuery: (q: string) => void;
    unsplashResults: any[];
    searchingUnsplash: boolean;
    onSearchUnsplash: () => void;
    onImageUpload: (e: any, type: string) => void;
    orgPrimaryColor?: string | null;
}

export const TemplateEditor = ({
    templateData,
    setTemplateData,
    unsplashQuery,
    setUnsplashQuery,
    unsplashResults,
    searchingUnsplash,
    onSearchUnsplash,
    onImageUpload,
    orgPrimaryColor,
}: Props) => {
    const [brandColorEnabled, setBrandColorEnabled] = useState(false);

    const palette = orgPrimaryColor ? generateBrandPalette(orgPrimaryColor) : null;

    const toggleBrandColor = () => {
        if (!palette) return;
        const next = !brandColorEnabled;
        setBrandColorEnabled(next);
        if (next) {
            setTemplateData({ ...templateData, brandPalette: palette });
        } else {
            const { brandPalette, ...rest } = templateData;
            setTemplateData(rest);
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
                                    {unsplashResults.map(img => (
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
                            <div className="relative border border-dashed border-slate-300 dark:border-slate-700/60 rounded-xl overflow-hidden bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors group">
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => onImageUpload(e, "hero")} />
                                <div className="py-3 text-center text-sm font-medium text-slate-500 group-hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                                    <Upload className="w-4 h-4" /> Or upload custom photo
                                </div>
                            </div>
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
