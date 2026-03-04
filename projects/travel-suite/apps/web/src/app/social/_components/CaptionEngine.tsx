"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import {
    Copy,
    Instagram,
    Linkedin,
    MessageCircle,
    Globe,
    Hash,
    CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CaptionTone =
    | "Luxury"
    | "Budget"
    | "Adventure"
    | "Family"
    | "Corporate"
    | "Playful";

export type CaptionPlatform = "instagram" | "facebook" | "linkedin" | "whatsapp";

export const CAPTION_TONES: { key: CaptionTone; emoji: string }[] = [
    { key: "Luxury",    emoji: "\u2728" },
    { key: "Budget",    emoji: "\uD83D\uDCB0" },
    { key: "Adventure", emoji: "\uD83C\uDFD4\uFE0F" },
    { key: "Family",    emoji: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67" },
    { key: "Corporate", emoji: "\uD83D\uDCBC" },
    { key: "Playful",   emoji: "\uD83C\uDF89" },
];

/* ------------------------------------------------------------------ */
/*  Platform config                                                    */
/* ------------------------------------------------------------------ */

interface PlatformConfig {
    key: CaptionPlatform;
    label: string;
    icon: typeof Instagram;
    gradient: string;
    iconColor: string;
    charLimit: number;
}

const PLATFORMS: PlatformConfig[] = [
    {
        key: "instagram",
        label: "Instagram",
        icon: Instagram,
        gradient: "from-pink-500 to-purple-600",
        iconColor: "text-pink-500",
        charLimit: 2200,
    },
    {
        key: "facebook",
        label: "Facebook",
        icon: Globe,
        gradient: "from-blue-500 to-blue-700",
        iconColor: "text-blue-500",
        charLimit: 63206,
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        icon: Linkedin,
        gradient: "from-blue-600 to-blue-800",
        iconColor: "text-blue-600",
        charLimit: 3000,
    },
    {
        key: "whatsapp",
        label: "WhatsApp",
        icon: MessageCircle,
        gradient: "from-green-500 to-green-700",
        iconColor: "text-green-500",
        charLimit: 1000,
    },
];

/* ------------------------------------------------------------------ */
/*  Hashtag packs                                                      */
/* ------------------------------------------------------------------ */

interface HashtagPack {
    label: string;
    description: string;
    tags: string[];
    color: string;
}

function buildHashtagPacks(captions: Record<string, unknown>): HashtagPack[] {
    const rawTags: string[] = (captions?.hashtags as string[]) || [];
    const dest = ((captions?.destination as string) || "").toLowerCase().replace(/\s+/g, "");

    return [
        {
            label: "Broad Reach",
            description: "1M\u201350M posts",
            color: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
            tags: [
                "travel", "travelphotography", "wanderlust", "explore",
                "travelgram", "vacation", "holiday", "tourism",
                "instatravel", "travelblogger",
            ],
        },
        {
            label: "Niche",
            description: "10K\u2013500K posts",
            color: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
            tags: rawTags.length > 0
                ? rawTags
                : [
                    "tourpackage", "traveldeals", "holidaypackage",
                    "travelsale", "booknow", "travelagency", "grouptravel",
                ],
        },
        {
            label: "Local India",
            description: "Under 50K posts",
            color: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
            tags: [
                "indiatourism", "incredibleindia", "indiagram",
                dest ? `${dest}tourism` : "domestictravel",
                "indiatour", "travelindia", "delhitourism", "mumbaitourism",
            ].filter(Boolean),
        },
    ];
}

/* ------------------------------------------------------------------ */
/*  Character count progress bar                                       */
/* ------------------------------------------------------------------ */

function CharacterBar({ current, limit }: { current: number; limit: number }) {
    const pct = Math.min((current / limit) * 100, 100);
    const barColor =
        pct > 95 ? "bg-red-500" :
        pct > 80 ? "bg-yellow-500" :
        "bg-emerald-500";

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-400">
                    {current.toLocaleString()} / {limit.toLocaleString()} chars
                </span>
                <span className={
                    pct > 95 ? "text-red-500" :
                    pct > 80 ? "text-yellow-500" :
                    "text-emerald-500"
                }>
                    {pct.toFixed(0)}%
                </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export const CaptionEngine = ({
    captions,
    selectedTone,
    onToneChange,
    selectedPlatform,
    onPlatformChange,
}: {
    captions: Record<string, unknown>;
    selectedTone?: CaptionTone;
    onToneChange?: (tone: CaptionTone) => void;
    selectedPlatform?: CaptionPlatform;
    onPlatformChange?: (platform: CaptionPlatform) => void;
}) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activePlatform, setActivePlatform] = useState<CaptionPlatform>(
        selectedPlatform || "instagram"
    );

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

    const handlePlatformSelect = (platform: CaptionPlatform) => {
        setActivePlatform(platform);
        onPlatformChange?.(platform);
    };

    if (!captions) return null;

    const hashtagPacks = buildHashtagPacks(captions);
    const currentPlatform = PLATFORMS.find(p => p.key === activePlatform) || PLATFORMS[0];
    const captionText = (captions[activePlatform] as string) || "";

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

            {/* Platform tabs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">Platform</p>
                <div className="grid grid-cols-4 gap-2">
                    {PLATFORMS.map(({ key, label, icon: Icon, gradient, iconColor }) => (
                        <button
                            key={key}
                            onClick={() => handlePlatformSelect(key)}
                            className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                                activePlatform === key
                                    ? `bg-gradient-to-br ${gradient} text-white border-transparent shadow-lg`
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${activePlatform === key ? "text-white" : iconColor}`} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active platform caption */}
            <GlassCard className="p-6 space-y-4 shadow-sm border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold mb-2 text-sm">
                    <currentPlatform.icon className={`w-5 h-5 ${currentPlatform.iconColor}`} />
                    <span className="text-slate-700 dark:text-slate-200">
                        {currentPlatform.label} Caption
                    </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {captionText || "No caption generated for this platform yet."}
                </div>

                {captionText && (
                    <>
                        <CharacterBar
                            current={captionText.length}
                            limit={currentPlatform.charLimit}
                        />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors gap-2"
                            onClick={() => handleCopy(captionText, activePlatform)}
                        >
                            {copied === activePlatform
                                ? <CheckCheck className="w-4 h-4 text-emerald-500" />
                                : <Copy className="w-4 h-4" />}
                            {copied === activePlatform
                                ? "Copied!"
                                : `Copy for ${currentPlatform.label}`}
                        </Button>
                    </>
                )}
            </GlassCard>

            {/* All platforms quick-copy grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLATFORMS.filter(p => p.key !== activePlatform).map(({ key, label, icon: Icon, iconColor, charLimit }) => {
                    const text = (captions[key] as string) || "";
                    if (!text) return null;

                    return (
                        <div
                            key={key}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <Icon className={`w-4 h-4 ${iconColor}`} />
                                    <span className="text-slate-600 dark:text-slate-300">{label}</span>
                                </div>
                                <button
                                    onClick={() => handleCopy(text, key)}
                                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-indigo-500 transition-colors"
                                >
                                    {copied === key
                                        ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                                        : <Copy className="w-3.5 h-3.5" />}
                                    {copied === key ? "Copied" : "Copy"}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                {text}
                            </p>
                            <CharacterBar current={text.length} limit={charLimit} />
                        </div>
                    );
                })}
            </div>

            {/* Hashtag packs */}
            <div className="space-y-3">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm px-1">
                    <Hash className="w-4 h-4 text-indigo-500" /> Hashtag Packs
                    <span className="text-xs text-slate-400 font-normal">&mdash; click pack to copy all</span>
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
