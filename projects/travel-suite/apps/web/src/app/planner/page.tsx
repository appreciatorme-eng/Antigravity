"use client";

import { useState } from "react";
import {
    Loader2, MapPin, Calendar, Wallet, Sparkles, Plane,
    ChevronDown, Cloud, Share2, FolderOpen, ArrowRight,
    Zap, BookOpen, Users, Star, BadgeCheck
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import DownloadPDFButton from "@/components/pdf/DownloadPDFButton";
import SaveItineraryButton from "./SaveItineraryButton";
import ShareTripModal from "@/components/ShareTripModal";
import WeatherWidget from "@/components/WeatherWidget";
import CurrencyConverter from "@/components/CurrencyConverter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Day, ItineraryResult } from "@/types/itinerary";
import { SafariStoryView, UrbanBriefView, ProfessionalView, LuxuryResortView, VisualJourneyView, BentoJourneyView, TemplateSwitcher, ItineraryTemplateId } from "@/components/itinerary-templates";
import ItineraryBuilder from "@/components/ItineraryBuilder";
import { InteractivePricing } from "@/components/InteractivePricing";
import { LogisticsManager } from "@/components/planner/LogisticsManager";
import { PricingManager } from "@/components/planner/PricingManager";
import { PlannerTabs, PlannerTab } from "@/components/planner/PlannerTabs";
import { useItineraries } from "@/lib/queries/itineraries";
import { PastItineraryCard } from "./PastItineraryCard";
import { cn } from "@/lib/utils";

// Dynamic import for Leaflet (SSR incompatible)
const ItineraryMap = dynamic(() => import("@/components/map/ItineraryMap"), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

const BUDGET_OPTIONS = [
    { value: "Budget-Friendly", label: "💰 Budget", desc: "Hostels, local food" },
    { value: "Moderate", label: "⚖️ Moderate", desc: "3-star, mixed dining" },
    { value: "Luxury", label: "💎 Luxury", desc: "5-star, fine dining" },
    { value: "Ultra-High End", label: "👑 Ultra", desc: "Palace hotels, VIP" },
];

const INTEREST_OPTIONS = [
    '🎨 Art & Culture', '🍽️ Food & Dining', '🏞️ Nature & Scenery',
    '🛍️ Shopping', '🏰 History & Heritage', '👨‍👩‍👧‍👦 Family-Friendly',
    '🐯 Wildlife & Safari', '🙏 Pilgrimage & Temples', '🏖️ Beach & Islands',
    '🏔️ Adventure & Trekking', '🧘 Yoga & Wellness', '💼 Business & MICE',
];

const HOW_IT_WORKS = [
    { icon: "✍️", step: "1", label: "Describe the trip", desc: "Enter destination, duration & budget" },
    { icon: "⚡", step: "2", label: "AI generates plan", desc: "Full day-by-day itinerary in ~15 sec" },
    { icon: "✏️", step: "3", label: "Review & personalise", desc: "Edit activities, add pricing & logistics" },
    { icon: "📤", step: "4", label: "Save & share", desc: "Assign to client, send shareable link" },
];

export default function PlannerPage() {
    const { data: pastItineraries, isLoading: isLoadingItineraries } = useItineraries();
    const [prompt, setPrompt] = useState("");
    const [days, setDays] = useState(5);
    const [budget, setBudget] = useState("Moderate");
    const [interests, setInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ItineraryResult | null>(null);
    const [error, setError] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<ItineraryTemplateId>('safari_story');
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<PlannerTab>('itinerary');

    const [images, setImages] = useState<Record<string, string | null>>({});
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]));

    const activityImageKey = (dayNumber: number, idx: number) => `${dayNumber}-${idx}`;

    const getImageQueryCandidates = (itineraryData: ItineraryResult, act: Activity) => {
        const rawLocation = (act.location || "").trim();
        const primaryLocation = rawLocation.split(",")[0]?.trim() || rawLocation;
        const destination = itineraryData.destination?.trim();
        const title = (act.title || "").trim();

        const candidates = [
            [title, rawLocation].filter(Boolean).join(" ").trim(),
            [title, destination].filter(Boolean).join(" ").trim(),
            [primaryLocation, destination].filter(Boolean).join(" ").trim(),
            primaryLocation,
            destination,
        ].filter((q) => q && q.length >= 3);

        return Array.from(new Set(candidates));
    };

    const fetchImagesForItinerary = async (itineraryData: ItineraryResult) => {
        const IMAGE_SOURCES = [
            { name: 'unsplash', endpoint: '/api/images/unsplash' },
            { name: 'pexels', endpoint: '/api/images/pexels' },
            { name: 'wikimedia', endpoint: '/api/images' },
            { name: 'pixabay', endpoint: '/api/images/pixabay' }
        ];

        const jobs: Array<{ key: string; candidates: string[] }> = [];
        const imageMap: Record<string, string | null> = {};
        itineraryData.days.forEach((day) => {
            day.activities.forEach((act, idx) => {
                const key = activityImageKey(day.day_number, idx);
                const candidates = getImageQueryCandidates(itineraryData, act);
                if (candidates.length === 0) {
                    imageMap[key] = null;
                    return;
                }
                jobs.push({ key, candidates });
            });
        });

        const concurrency = 6;
        let i = 0;

        async function worker() {
            while (i < jobs.length) {
                const job = jobs[i++];
                try {
                    let found: string | null = null;
                    for (const q of job.candidates) {
                        if (found) break;
                        for (const source of IMAGE_SOURCES) {
                            try {
                                const resp = await fetch(`${source.endpoint}?query=${encodeURIComponent(q)}`);
                                const data = await resp.json().catch(() => ({}));
                                if (resp.ok && typeof data?.url === "string" && data.url && data.url.length > 0) {
                                    found = data.url;
                                    break;
                                }
                            } catch (sourceErr) {
                                console.warn(`${source.name} failed for query "${q}":`, sourceErr);
                            }
                        }
                    }
                    imageMap[job.key] = found;
                } catch (err) {
                    console.error("Failed to load image for", job.key, err);
                    imageMap[job.key] = null;
                }
            }
        }

        await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker()));
        setImages(imageMap);
    };

    const toggleInterest = (interest: string) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const toggleDay = (dayNumber: number) => {
        setExpandedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dayNumber)) {
                newSet.delete(dayNumber);
            } else {
                newSet.add(dayNumber);
            }
            return newSet;
        });
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        setError("");
        setResult(null);
        setImages({});

        const interestString = interests.length > 0
            ? ` focusing on ${interests.join(", ")}`
            : "";
        const finalPrompt = `Create a ${budget} ${days}-day itinerary for ${prompt}${interestString}.
Make it practical and specific:
- Use realistic start times and include 4-6 activities per day
- Mention neighborhoods/areas, how to get there (walk/metro/taxi), and approximate travel time between stops
- Add expected duration and estimated cost where relevant
- Include 1-2 food/coffee suggestions per day
- Add short booking/entry tips where needed
- Keep it geographically efficient (cluster nearby places)`;

        try {
            const res = await fetch("/api/itinerary/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: finalPrompt, days }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate");

            setResult(data);
            fetchImagesForItinerary(data);

        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to generate itinerary. Try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const hasPastItineraries = pastItineraries && pastItineraries.length > 0;

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 pb-24">

            {/* ═══ HERO — shown only when no result ═══ */}
            {!result && (
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 dark:from-emerald-950 dark:via-emerald-900 dark:to-teal-900">
                    {/* Subtle dot grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
                    />
                    {/* Glowing orb */}
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-300/10 rounded-full blur-2xl" />

                    <div className="relative max-w-4xl mx-auto px-6 py-14 text-center">
                        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5 text-xs font-bold text-white/90 tracking-widest uppercase mb-6">
                            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Trip Planner
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight tracking-tight">
                            Create stunning itineraries<br className="hidden md:block" /> your clients will love
                        </h1>
                        <p className="text-emerald-100 text-lg font-light max-w-2xl mx-auto mb-10 leading-relaxed">
                            Type a destination, let AI draft a complete day-by-day plan, then personalise, save, and share it with your client — all in under a minute.
                        </p>

                        {/* 4-step workflow */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                            {HOW_IT_WORKS.map((s, i) => (
                                <div key={s.step} className="relative flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-4 text-left">
                                    <div className="text-2xl">{s.icon}</div>
                                    <div className="w-full">
                                        <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-0.5">Step {s.step}</div>
                                        <div className="text-sm font-bold text-white leading-tight">{s.label}</div>
                                        <div className="text-xs text-white/60 mt-0.5 leading-snug">{s.desc}</div>
                                    </div>
                                    {i < HOW_IT_WORKS.length - 1 && (
                                        <div className="hidden md:block absolute -right-1.5 top-1/2 -translate-y-1/2 text-white/30 text-lg">›</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-full">

                {/* ═══ FORM — shown only when no result ═══ */}
                {!result && (
                    <div className="max-w-2xl mx-auto px-6 py-10 -mt-6 relative z-10">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-emerald-500/10 border border-gray-100 dark:border-slate-800 overflow-hidden">

                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50/30 dark:from-emerald-950/40 dark:to-teal-900/10 border-b border-emerald-100/60 dark:border-emerald-900/40 px-8 py-6 flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-secondary dark:text-white tracking-tight">Generate a new trip plan</h2>
                                    <p className="text-sm text-text-muted mt-0.5">Build a professional itinerary for your client in under a minute</p>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="px-8 py-8 space-y-8">

                                {/* Destination */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                        Where is your client heading?
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full h-14 text-base bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl px-5 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-secondary dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/50 transition-all"
                                        placeholder="e.g. Rajasthan, Maldives, Dubai, Bali, Kerala..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !loading && prompt && handleGenerate()}
                                        autoFocus
                                    />
                                    <p className="text-xs text-text-muted pl-1">
                                        Enter a country, state, city, or region. Be as specific as you like — "North Goa beaches" works too!
                                    </p>
                                </div>

                                {/* Duration + Budget */}
                                <div className="grid grid-cols-5 gap-6">
                                    {/* Duration */}
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                            Duration
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setDays(d => Math.max(1, d - 1))}
                                                className="w-10 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-secondary dark:text-white font-bold text-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 transition-all"
                                            >−</button>
                                            <div className="flex-1 h-12 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl flex items-center justify-center">
                                                <span className="text-xl font-bold text-secondary dark:text-white">{days}</span>
                                                <span className="text-sm text-text-muted ml-1">days</span>
                                            </div>
                                            <button
                                                onClick={() => setDays(d => Math.min(21, d + 1))}
                                                className="w-10 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-secondary dark:text-white font-bold text-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 transition-all"
                                            >+</button>
                                        </div>
                                        <p className="text-xs text-text-muted pl-1">Domestic 3–7 days · International 7–14</p>
                                    </div>

                                    {/* Budget */}
                                    <div className="col-span-3 space-y-2">
                                        <label className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-emerald-500" />
                                            Client's budget style
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {BUDGET_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setBudget(option.value)}
                                                    className={cn(
                                                        "py-2 px-3 rounded-xl text-xs font-bold transition-all border text-left",
                                                        budget === option.value
                                                            ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                                                            : "bg-white dark:bg-slate-900 text-secondary dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700"
                                                    )}
                                                >
                                                    <div>{option.label}</div>
                                                    <div className={cn("text-[10px] font-medium mt-0.5", budget === option.value ? "text-white/70" : "text-text-muted")}>
                                                        {option.desc}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Interests */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                        <Plane className="w-4 h-4 text-emerald-500" />
                                        What interests your client?
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">optional</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {INTEREST_OPTIONS.map((tag) => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleInterest(tag)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
                                                    interests.includes(tag)
                                                        ? "bg-secondary text-white border-secondary shadow-sm"
                                                        : "bg-gray-50 dark:bg-slate-800/70 text-secondary/70 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-secondary/40 hover:bg-secondary/5"
                                                )}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-text-muted pl-1">
                                        Selecting interests helps the AI tailor activities, food, and experiences to your client&apos;s preferences.
                                    </p>
                                </div>

                                {/* Generate Button */}
                                <div className="pt-1 space-y-3">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || !prompt}
                                        className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                                    >
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

                                    {loading && (
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-xs text-text-muted mb-2">
                                                <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                                                Building your day-by-day plan, activities, food spots, transport tips &amp; estimated costs...
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
                                                <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse" style={{ width: "60%" }} />
                                            </div>
                                        </div>
                                    )}

                                    {!loading && (
                                        <div className="flex items-center justify-center gap-6 text-[11px] text-text-muted">
                                            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" />~15 seconds</span>
                                            <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-blue-500" />Day-by-day plan</span>
                                            <span className="flex items-center gap-1.5"><BadgeCheck className="w-3 h-3 text-emerald-500" />Costs &amp; tips included</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ RESULT — shown when itinerary is generated ═══ */}
                {result && (
                    <>
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Sticky action bar */}
                            <div className="flex justify-between items-center p-4 rounded-2xl shadow-glass border sticky top-4 z-20 backdrop-blur-glass bg-white/80 border-slate-200/50 dark:bg-slate-900/60 dark:border-slate-800 print:hidden animate-fade-in-up mx-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => setResult(null)}
                                    className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all font-semibold rounded-xl"
                                >
                                    ← Start Over
                                </Button>
                                <div className="flex gap-2 flex-wrap justify-end">
                                    <SaveItineraryButton
                                        itineraryData={result}
                                        destination={prompt}
                                        days={days}
                                        budget={budget}
                                        interests={interests}
                                        templateId={selectedTemplate}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="border-primary/20 hover:bg-primary/5 text-primary"
                                    >
                                        {isEditing ? '👀 Preview Design' : '🖊️ Edit Itinerary'}
                                    </Button>
                                    <button
                                        onClick={() => setIsShareOpen(true)}
                                        className="px-4 py-2 bg-whatsapp hover:bg-whatsapp:hover text-white rounded-xl shadow-button flex items-center gap-2 transition-smooth text-sm font-bold"
                                    >
                                        <Share2 className="w-4 h-4" /> Share Trip
                                    </button>
                                    <DownloadPDFButton
                                        data={result}
                                        fileName={`${result.trip_title.replace(/\s+/g, '_')}_Itinerary.pdf`}
                                    />
                                </div>
                            </div>

                            <PlannerTabs activeTab={activeTab} onTabChange={setActiveTab} />

                            {activeTab === 'itinerary' && (
                                <div className="space-y-8 animate-fade-in-up px-6">
                                    <div className="text-center space-y-4">
                                        <Badge variant="outline" className="px-4 py-1 text-base border-primary/20 bg-primary/5 text-primary">
                                            {result.duration_days} Days in {result.destination}
                                        </Badge>
                                        <h2 className="text-4xl font-serif text-secondary leading-tight">{result.trip_title}</h2>
                                        <p className="text-xl text-gray-600 dark:text-slate-200 font-light max-w-2xl mx-auto leading-relaxed">{result.summary}</p>
                                    </div>

                                    <div className="grid lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 h-80 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10 relative">
                                            <ItineraryMap
                                                destination={result.destination}
                                                activities={result.days.flatMap((day: Day) =>
                                                    day.activities.map(act => ({
                                                        ...act,
                                                        coordinates: act.coordinates && act.coordinates.lat !== 0 ? act.coordinates : undefined
                                                    }))
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-6">
                                            <Card className="border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/40 shadow-md h-full">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-300">Currency Converter</CardTitle>
                                                </CardHeader>
                                                <CardContent className="pt-4">
                                                    <CurrencyConverter destination={result.destination} compact />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>

                                    <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-sky-200 dark:border-sky-800/30 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-2xl text-gray-800 dark:text-slate-100 flex items-center gap-3">
                                                <Cloud className="w-7 h-7 text-sky-600" />
                                                Weather Forecast for {result.destination}
                                            </CardTitle>
                                            <CardDescription>Plan your activities around the weather</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <WeatherWidget destination={result.destination} days={result.duration_days} compact={false} />
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white dark:bg-slate-950 shadow-lg print:hidden">
                                        <CardContent className="pt-6">
                                            <TemplateSwitcher currentTemplate={selectedTemplate} onTemplateChange={setSelectedTemplate} />
                                        </CardContent>
                                    </Card>

                                    <div id="itinerary-pdf-content" className="w-full mt-16 animate-fade-in-up">
                                        {isEditing ? (
                                            <ItineraryBuilder data={result!} onChange={setResult} />
                                        ) : (
                                            <>
                                                {selectedTemplate === 'safari_story' && <SafariStoryView itinerary={result!} />}
                                                {selectedTemplate === 'urban_brief' && <UrbanBriefView itinerary={result!} />}
                                                {selectedTemplate === 'professional' && <ProfessionalView itinerary={result!} />}
                                                {selectedTemplate === 'luxury_resort' && <LuxuryResortView itinerary={result!} />}
                                                {selectedTemplate === 'visual_journey' && <VisualJourneyView itinerary={result!} />}
                                                {selectedTemplate === 'bento_journey' && <BentoJourneyView itinerary={result!} />}

                                                {!(['safari_story', 'urban_brief', 'professional', 'luxury_resort', 'visual_journey', 'bento_journey'] as string[]).includes(selectedTemplate) && (
                                                    <div className="space-y-6 max-w-4xl mx-auto">
                                                        {result!.days.map((day: Day, dayIndex: number) => {
                                                            const isExpanded = expandedDays.has(day.day_number);
                                                            const isLastDay = dayIndex === result.days.length - 1;
                                                            return (
                                                                <div key={day.day_number} className="relative">
                                                                    {!isLastDay && (
                                                                        <div className="absolute left-[30px] top-[60px] bottom-[-24px] w-[2px] border-l-2 border-dashed border-gray-300 dark:border-gray-600 hidden md:block" />
                                                                    )}
                                                                    <div className="absolute left-[22px] top-[20px] w-[18px] h-[18px] rounded-full bg-[#124ea2] border-4 border-white dark:border-slate-950 shadow-md z-10 hidden md:block" />
                                                                    <div className="md:ml-16">
                                                                        <button
                                                                            onClick={() => toggleDay(day.day_number)}
                                                                            className="w-full bg-gradient-to-r from-[#124ea2] to-[#1a5fc7] text-white px-6 py-4 rounded-t-xl flex items-center justify-between hover:from-[#0f3d82] hover:to-[#124ea2] transition-all shadow-md group"
                                                                        >
                                                                            <h3 className="text-lg font-bold uppercase tracking-wide">DAY {day.day_number}</h3>
                                                                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                                            <div className="bg-white dark:bg-slate-950/40 rounded-b-xl shadow-lg border-x border-b border-gray-200 dark:border-white/10 p-6">
                                                                                <p className="text-[#18974e] font-semibold text-base mb-6 flex items-center gap-2">
                                                                                    <span className="w-2 h-2 rounded-full bg-[#18974e]"></span>
                                                                                    {day.theme}
                                                                                </p>
                                                                                <div className="space-y-8">
                                                                                    {day.activities.map((act: Activity, idx: number) => {
                                                                                        const imgKey = activityImageKey(day.day_number, idx);
                                                                                        const imgUrl = images[imgKey];
                                                                                        return (
                                                                                            <div key={idx} className="group relative">
                                                                                                <div className="relative h-64 rounded-xl overflow-hidden shadow-md mb-4">
                                                                                                    {imgUrl === undefined ? (
                                                                                                        <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                                                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
                                                                                                        </div>
                                                                                                    ) : imgUrl ? (
                                                                                                        <>
                                                                                                            <img
                                                                                                                src={imgUrl}
                                                                                                                alt={act.title}
                                                                                                                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                                                                                                loading="lazy"
                                                                                                                referrerPolicy="no-referrer"
                                                                                                                onError={(e) => {
                                                                                                                    e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                                                                                                                    e.currentTarget.onerror = null;
                                                                                                                }}
                                                                                                            />
                                                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                                                                            <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-800 dark:text-slate-100 shadow-lg">{act.time}</div>
                                                                                                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                                                                                                <h4 className="text-2xl font-bold text-white mb-2">{act.title}</h4>
                                                                                                                <div className="flex items-center gap-2 text-white/90 text-sm"><MapPin className="w-4 h-4" />{act.location}</div>
                                                                                                            </div>
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                                                                            <span className="text-gray-400 dark:text-gray-500">No image available</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="space-y-3 px-2">
                                                                                                    <p className="text-gray-700 dark:text-slate-200 leading-relaxed">{act.description}</p>
                                                                                                    <div className="flex flex-wrap gap-2">
                                                                                                        {act.duration && <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">⏱️ {act.duration}</Badge>}
                                                                                                        {act.cost && <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">💰 {act.cost}</Badge>}
                                                                                                        {act.transport && <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">🚇 {act.transport}</Badge>}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {result!.pricing && (
                                        <div className="mt-16 bg-white/60 dark:bg-slate-950/40 py-12 border-t border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                                            <InteractivePricing pricing={result!.pricing} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'logistics' && (
                                <div className="space-y-8 animate-fade-in-up px-6">
                                    <div className="bg-gray-50/50 dark:bg-slate-900/30 p-8 rounded-3xl border border-gray-100 dark:border-white/5 mx-auto max-w-7xl shadow-sm">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Logistics & Bookings</h3>
                                                    <p className="text-gray-500 dark:text-gray-400">Manage flights, hotels, and transportation for {result.destination}</p>
                                                </div>
                                                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1">Professional Mode</Badge>
                                            </div>
                                            <LogisticsManager data={result!} onChange={setResult} />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6 px-6">
                                        <Card className="h-full">
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <MapPin className="w-5 h-5 text-blue-600" /> Location Context
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="h-64">
                                                <ItineraryMap
                                                    destination={result.destination}
                                                    activities={result.days.flatMap((day: Day) =>
                                                        day.activities.map(act => ({
                                                            ...act,
                                                            coordinates: act.coordinates && act.coordinates.lat !== 0 ? act.coordinates : undefined
                                                        }))
                                                    )}
                                                />
                                            </CardContent>
                                        </Card>
                                        <WeatherWidget destination={result.destination} days={result.duration_days} compact={true} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pricing' && (
                                <div className="space-y-8 animate-fade-in-up px-6">
                                    <div className="bg-emerald-50/30 dark:bg-slate-900/30 p-8 rounded-3xl border border-emerald-100 dark:border-white/5 mx-auto max-w-7xl shadow-sm">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Investment Breakdown</h3>
                                                    <p className="text-gray-500 dark:text-gray-400">Configure client pricing, margins, and optional add-ons</p>
                                                </div>
                                                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-1">Financial Data</Badge>
                                            </div>
                                            <PricingManager data={result!} onChange={setResult} />
                                        </div>
                                    </div>

                                    {result!.pricing && (
                                        <div className="mt-8 bg-white/60 dark:bg-slate-950/40 py-12 px-6 border-t border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                                            <div className="text-center mb-10">
                                                <h4 className="text-xl font-bold text-gray-800 dark:text-white">Client-Facing Preview</h4>
                                                <p className="text-gray-500">This is how the interactive pricing will appear to your customers</p>
                                            </div>
                                            <InteractivePricing pricing={result!.pricing} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Error toast */}
                {error && (
                    <div className="fixed bottom-6 right-6 p-4 bg-white dark:bg-slate-950/70 border border-red-200 dark:border-red-500/30 text-red-600 rounded-xl shadow-2xl animate-in slide-in-from-right duration-500 flex items-center gap-3 z-50">
                        <span className="text-2xl">⚠️</span>
                        {error}
                        <button onClick={() => setError("")} className="ml-2 hover:bg-red-50 p-1 rounded-full">×</button>
                    </div>
                )}

                {/* Share modal */}
                {result && (
                    <ShareTripModal
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        tripTitle={result.trip_title}
                        rawItineraryData={result}
                        initialTemplateId={selectedTemplate}
                    />
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SAVED ITINERARIES — always at the bottom of the page
                New itineraries appear here immediately after saving above
            ════════════════════════════════════════════════════════════════ */}
            <div id="saved-itineraries-section" className="max-w-7xl mx-auto px-6 mt-20">
                {/* Section divider */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent" />
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <FolderOpen className="w-4 h-4 text-text-muted" />
                        <span className="text-xs font-black uppercase tracking-widest text-text-muted">Saved Itineraries</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent" />
                </div>

                {/* Section header */}
                <div className="flex items-start justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary dark:text-white tracking-tight">Your Saved Itineraries</h2>
                        <p className="text-sm text-text-muted mt-1 max-w-xl">
                            After generating a trip and hitting <span className="font-bold text-emerald-600">Save Trip</span>, it appears here automatically.
                            Assign a client, set a price, and share with one click.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {hasPastItineraries && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700">
                                {pastItineraries.length} saved
                            </span>
                        )}
                        {hasPastItineraries && (
                            <Link
                                href="/trips"
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary/5 dark:bg-secondary/10 text-secondary dark:text-white text-sm font-bold hover:bg-secondary/10 dark:hover:bg-secondary/20 border border-secondary/10 transition-colors"
                            >
                                View All Trips <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Loading skeletons */}
                {isLoadingItineraries && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-gray-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!isLoadingItineraries && !hasPastItineraries && (
                    <div className="flex flex-col items-center justify-center py-16 px-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-center bg-white/40 dark:bg-slate-900/20">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-5 border border-emerald-100 dark:border-emerald-900">
                            <FolderOpen className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-bold text-secondary dark:text-white mb-2">No saved itineraries yet</h3>
                        <p className="text-sm text-text-muted max-w-sm leading-relaxed mb-5">
                            Generate a trip using the form above and click <span className="font-bold text-emerald-600">Save Trip</span> — it will appear here so you can assign it to a client and share it instantly.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-text-muted">
                            {["✨ Generate", "💾 Save", "👤 Assign Client", "📤 Share Link"].map((step, i, arr) => (
                                <span key={step} className="flex items-center gap-2">
                                    <span className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 font-semibold">{step}</span>
                                    {i < arr.length - 1 && <span className="text-gray-300 dark:text-slate-600">→</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Itinerary grid */}
                {!isLoadingItineraries && hasPastItineraries && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pastItineraries.map((itinerary: any) => (
                            <PastItineraryCard key={itinerary.id} itinerary={itinerary} />
                        ))}
                    </div>
                )}

                {/* Bottom tip when itineraries exist */}
                {!isLoadingItineraries && hasPastItineraries && (
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-muted">
                        <Star className="w-3 h-3 text-amber-400" />
                        <span>Tip: Assign a client to an itinerary, then use the Share button to send them a live preview link — no WhatsApp forward needed!</span>
                    </div>
                )}
            </div>
        </main>
    );
}
