"use client";

import { useState, useEffect } from "react";
import {
    Loader2, MapPin, Calendar, Wallet, Sparkles, Plane,
    ArrowRight, Zap, BookOpen, BadgeCheck, Globe, Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BUDGET_OPTIONS = [
    { value: "Budget-Friendly", label: "Budget", emoji: "💰", desc: "Hostels, local food" },
    { value: "Moderate", label: "Moderate", emoji: "⚖️", desc: "3-star, mixed dining" },
    { value: "Luxury", label: "Luxury", emoji: "💎", desc: "5-star, fine dining" },
    { value: "Ultra-High End", label: "Ultra", emoji: "👑", desc: "Palace hotels, VIP" },
];

const INTEREST_OPTIONS = [
    '🎨 Art & Culture', '🍽️ Food & Dining', '🏞️ Nature & Scenery',
    '🛍️ Shopping', '🏰 History & Heritage', '👨‍👩‍👧‍👦 Family-Friendly',
    '🐯 Wildlife & Safari', '🙏 Pilgrimage & Temples', '🏖️ Beach & Islands',
    '🏔️ Adventure & Trekking', '🧘 Yoga & Wellness', '💼 Business & MICE',
];

const PLACEHOLDER_DESTINATIONS = [
    "Rajasthan — Palaces & Desert",
    "Maldives — Overwater Villas",
    "Dubai — Luxury & Adventure",
    "Bali — Temples & Rice Terraces",
    "Kerala — Backwaters & Spice",
    "Switzerland — Alps & Lakes",
    "Japan — Zen & Cherry Blossoms",
    "North Goa — Beaches & Vibes",
];

interface PlannerHeroProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    days: number;
    onDaysChange: (value: number) => void;
    budget: string;
    onBudgetChange: (value: string) => void;
    interests: string[];
    onToggleInterest: (interest: string) => void;
    loading: boolean;
    onGenerate: () => void;
}

export function PlannerHero({
    prompt, onPromptChange,
    days, onDaysChange,
    budget, onBudgetChange,
    interests, onToggleInterest,
    loading, onGenerate,
}: PlannerHeroProps) {
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const [animatingPlaceholder, setAnimatingPlaceholder] = useState(true);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (prompt) { setAnimatingPlaceholder(false); return; }
         
        setAnimatingPlaceholder(true);
        const interval = setInterval(() => {
            setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_DESTINATIONS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [prompt]);

    const currentPlaceholder = PLACEHOLDER_DESTINATIONS[placeholderIdx];

    return (
        <div className="relative overflow-hidden">
            {/* Animated mesh background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-900 dark:via-teal-900 dark:to-slate-900" />
            <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%),
                    radial-gradient(circle at 40% 80%, rgba(0,208,132,0.2) 0%, transparent 50%)`,
            }} />
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }} />

            <div className="relative max-w-2xl mx-auto px-6 pt-10 pb-14">
                {/* Header copy */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">AI-Powered</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-serif text-white mb-3 leading-tight tracking-tight">
                        Craft the Perfect Trip
                    </h1>
                    <p className="text-emerald-100/70 text-sm font-light max-w-md mx-auto leading-relaxed">
                        Describe a destination → AI builds a complete day-by-day itinerary → Save, share, and convert
                    </p>
                </div>

                {/* ─── Form Card ─── */}
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-white/60 dark:border-slate-700/50 overflow-hidden">

                    {/* Destination Input — Premium */}
                    <div className="p-6 pb-5">
                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 flex items-center gap-2 mb-3">
                            <Globe className="w-3.5 h-3.5 text-emerald-500" />
                            Destination
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-focus-within:scale-110 transition-transform duration-300">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <input
                                type="text"
                                className="w-full h-16 text-lg bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-[4.5rem] pr-5 text-secondary dark:text-white focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20 transition-all duration-300 font-medium"
                                placeholder={animatingPlaceholder ? currentPlaceholder : "e.g. Rajasthan, Maldives, Dubai, Bali..."}
                                value={prompt}
                                onChange={(e) => onPromptChange(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !loading && prompt && onGenerate()}
                                autoFocus
                            />
                            {!prompt && animatingPlaceholder && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Compass className="w-4 h-4 text-slate-300 dark:text-slate-600 animate-spin" style={{ animationDuration: '8s' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                    {/* Duration + Budget row */}
                    <div className="p-6 pb-5 grid grid-cols-5 gap-6">
                        {/* Duration */}
                        <div className="col-span-2 space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                Duration
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onDaysChange(Math.max(1, days - 1))}
                                    className="w-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-secondary dark:text-white font-bold text-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-95 transition-all"
                                >−</button>
                                <div className="flex-1 h-12 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center gap-1.5">
                                    <span className="text-2xl font-black text-secondary dark:text-white tabular-nums">{days}</span>
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">days</span>
                                </div>
                                <button
                                    onClick={() => onDaysChange(Math.min(21, days + 1))}
                                    className="w-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-secondary dark:text-white font-bold text-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-95 transition-all"
                                >+</button>
                            </div>
                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600">Domestic 3–7 · International 7–14</p>
                        </div>

                        {/* Budget */}
                        <div className="col-span-3 space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                                Budget Style
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {BUDGET_OPTIONS.map((option) => {
                                    const isActive = budget === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => onBudgetChange(option.value)}
                                            className={cn(
                                                "relative py-2.5 px-3.5 rounded-xl text-left transition-all duration-200 border-2 group overflow-hidden",
                                                isActive
                                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]"
                                                    : "bg-slate-50 dark:bg-slate-800/80 text-secondary dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">{option.emoji}</span>
                                                <span className="text-xs font-bold">{option.label}</span>
                                            </div>
                                            <div className={cn("text-[10px] font-medium mt-0.5 ml-7", isActive ? "text-white/70" : "text-slate-400 dark:text-slate-500")}>
                                                {option.desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                    {/* Interests */}
                    <div className="p-6 pb-5 space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <Plane className="w-3.5 h-3.5 text-emerald-500" />
                            Interests
                            <span className="text-[9px] font-black tracking-widest text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">OPTIONAL</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {INTEREST_OPTIONS.map((tag) => {
                                const isActive = interests.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => onToggleInterest(tag)}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-full border-2 text-xs font-bold transition-all duration-200",
                                            isActive
                                                ? "bg-secondary dark:bg-emerald-600 text-white border-secondary dark:border-emerald-600 shadow-sm scale-[1.03]"
                                                : "bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-secondary dark:hover:text-slate-200"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Generate Button — Full width, inside card */}
                    <div className="p-6 pt-4 space-y-4">
                        <button
                            onClick={onGenerate}
                            disabled={loading || !prompt}
                            className={cn(
                                "relative w-full h-14 rounded-2xl text-white text-base font-bold flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden",
                                loading || !prompt
                                    ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                                    : "bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 hover:from-emerald-600 hover:via-emerald-600 hover:to-teal-600 shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg"
                            )}
                        >
                            {/* Shimmer effect */}
                            {!loading && prompt && (
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                            )}
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin w-5 h-5" />
                                    <span>Crafting your itinerary<span className="animate-pulse">...</span></span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate AI Itinerary
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        {/* Loading progress */}
                        {loading && (
                            <div className="space-y-2 animate-fade-in-up">
                                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                                    Building day-by-day plan, activities, food spots, transport tips &amp; costs...
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full animate-pulse" style={{ width: "60%" }} />
                                </div>
                            </div>
                        )}

                        {/* Feature badges */}
                        {!loading && (
                            <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" />~15 seconds</span>
                                <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-blue-500" />Day-by-day plan</span>
                                <span className="flex items-center gap-1.5"><BadgeCheck className="w-3 h-3 text-emerald-500" />Costs &amp; tips</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export { BUDGET_OPTIONS, INTEREST_OPTIONS };
