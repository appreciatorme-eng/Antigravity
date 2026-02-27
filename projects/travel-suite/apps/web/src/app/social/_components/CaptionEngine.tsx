"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Copy, Instagram, Linkedin, Hash, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type CaptionTone = "Luxury" | "Budget" | "Adventure" | "Family" | "Corporate" | "Playful";

export const CAPTION_TONES: { key: CaptionTone; emoji: string }[] = [
    { key: "Luxury",    emoji: "✨" },
    { key: "Budget",    emoji: "💰" },
    { key: "Adventure", emoji: "🏔️" },
    { key: "Family",    emoji: "👨‍👩‍👧" },
    { key: "Corporate", emoji: "💼" },
    { key: "Playful",   emoji: "🎉" },
];

interface HashtagPack {
    label: string;
    description: string;
    tags: string[];
    color: string;
}

function buildHashtagPacks(captions: any): HashtagPack[] {
    const rawTags: string[] = captions?.hashtags || [];
    const dest = (captions?.destination || "").toLowerCase().replace(/\s+/g, "");

    return [
        {
            label: "Broad Reach",
            description: "1M–50M posts",
            color: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
            tags: ["travel", "travelphotography", "wanderlust", "explore", "travelgram", "vacation", "holiday", "tourism", "instatravel", "travelblogger"],
        },
        {
            label: "Niche",
            description: "10K–500K posts",
            color: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
            tags: rawTags.length > 0 ? rawTags : ["tourpackage", "traveldeals", "holidaypackage", "travelsale", "booknow", "travelagency", "grouptravel"],
        },
        {
            label: "Local India",
            description: "Under 50K posts",
            color: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
            tags: [
                "indiatourism", "incredibleindia", "indiagram",
                dest ? `${dest}tourism` : "domestic travel",
                "indiatour", "travelindia", "delhitourism", "mumbaitourism",
            ].filter(Boolean),
        },
    ];
}

export const CaptionEngine = ({
    captions,
    selectedTone,
    onToneChange,
}: {
    captions: any;
    selectedTone?: CaptionTone;
    onToneChange?: (tone: CaptionTone) => void;
}) => {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(null), 2000);
    };

    const handleCopyPack = (tags: string[]) => {
        const text = tags.map(t => `#${t.replace(/^#/, "")}`).join(" ");
        navigator.clipboard.writeText(text);
        toast.success("Hashtag pack copied!");
    };

    if (!captions) return null;

    const hashtagPacks = buildHashtagPacks(captions);

    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Tone chips (shown if callback provided) */}
            {onToneChange && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Caption Tone</p>
                    <div className="flex flex-wrap gap-2">
                        {CAPTION_TONES.map(({ key, emoji }) => (
                            <button
                                key={key}
                                onClick={() => onToneChange(key)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                    selectedTone === key
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                                }`}
                            >
                                {emoji} {key}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Instagram caption */}
            <GlassCard className="p-6 space-y-4 shadow-sm border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-pink-500 font-bold mb-2 text-sm">
                    <Instagram className="w-5 h-5" /> Instagram Caption
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {captions.instagram}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors gap-2"
                    onClick={() => handleCopy(captions.instagram, "ig")}
                >
                    {copied === "ig" ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied === "ig" ? "Copied!" : "Copy for Instagram"}
                </Button>
            </GlassCard>

            {/* LinkedIn caption */}
            <GlassCard className="p-6 space-y-4 shadow-sm border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-blue-600 font-bold mb-2 text-sm">
                    <Linkedin className="w-5 h-5" /> LinkedIn Post
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {captions.linkedin}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors gap-2"
                    onClick={() => handleCopy(captions.linkedin, "li")}
                >
                    {copied === "li" ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied === "li" ? "Copied!" : "Copy for LinkedIn"}
                </Button>
            </GlassCard>

            {/* Hashtag packs */}
            <div className="space-y-3">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm px-1">
                    <Hash className="w-4 h-4 text-indigo-500" /> Hashtag Packs
                    <span className="text-xs text-slate-400 font-normal">— click pack to copy all</span>
                </p>
                <div className="grid grid-cols-1 gap-3">
                    {hashtagPacks.map(pack => (
                        <div
                            key={pack.label}
                            className={`p-4 rounded-2xl border cursor-pointer hover:opacity-90 transition-opacity ${pack.color}`}
                            onClick={() => handleCopyPack(pack.tags)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="font-bold text-sm">{pack.label}</p>
                                    <p className="text-[10px] opacity-70 font-medium">{pack.description}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold opacity-70">
                                    <Copy className="w-3.5 h-3.5" /> Copy all
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {pack.tags.map(tag => (
                                    <span key={tag} className="text-[11px] font-semibold opacity-80">
                                        #{tag.replace(/^#/, "")}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
