"use client";

import { useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
    MapPin,
    ChevronDown, Cloud, Share2, FolderOpen, ArrowRight,
    Star,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import DownloadPDFButton from "@/components/pdf/DownloadPDFButton";
import SaveItineraryButton from "./SaveItineraryButton";
import ShareTripModal from "@/components/ShareTripModal";
import { AppImage } from "@/components/ui/AppImage";
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
import { useAnalytics } from "@/lib/analytics/events";
import { PastItineraryCard } from "./PastItineraryCard";
import { ItineraryFilterBar, matchesFilter } from "./ItineraryFilterBar";
import { NeedsAttentionQueue } from "./NeedsAttentionQueue";
import { PlannerHero } from "./PlannerHero";
import type { ClientComment, ClientPreferences } from "@/types/feedback";
import type { ItineraryLike, ItineraryStage } from "./planner.types";
import { logError } from "@/lib/observability/logger";

/** Shape returned by the itineraries API and consumed by PastItineraryCard */
interface PastItineraryItem extends ItineraryLike {
    trip_title: string;
    destination: string;
    duration_days: number;
    created_at: string;
    budget: string | null;
    client_id: string | null;
    summary?: string | null;
    interests?: string[] | null;
    client?: { full_name: string } | null;
    client_comments?: ClientComment[];
    client_preferences?: ClientPreferences | null;
    wishlist_items?: string[];
    approved_by?: string | null;
    approved_at?: string | null;
}

const ItineraryMap = dynamic(() => import("@/components/map/ItineraryMap"), {
    ssr: false,
    loading: () => <div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />,
});

export default function PlannerPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const analytics = useAnalytics();
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
    const [openingItineraryId, setOpeningItineraryId] = useState<string | null>(null);
    const [filterStage, setFilterStage] = useState<ItineraryStage>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const handleOpenItinerary = useCallback(async (itineraryId: string) => {
        setOpeningItineraryId(itineraryId);
        try {
            const { data, error: fetchError } = await supabase
                .from("itineraries")
                .select("raw_data, trip_title, destination, duration_days, budget, interests, template_id")
                .eq("id", itineraryId)
                .single();

            if (fetchError || !data?.raw_data) {
                toast({ title: "Failed to load itinerary", description: "Could not fetch itinerary data.", variant: "error" });
                return;
            }

            const itineraryData = data.raw_data as unknown as ItineraryResult;
            setResult(itineraryData);
            setPrompt(data.destination || itineraryData.destination || "");
            setDays(data.duration_days || itineraryData.duration_days || 5);
            if (data.budget) setBudget(data.budget);
            if (data.interests) setInterests(data.interests);
            if (data.template_id) setSelectedTemplate(data.template_id as ItineraryTemplateId);
            setActiveTab("itinerary");
            setIsEditing(false);
            const mainEl = document.querySelector("main");
            if (mainEl) {
                mainEl.scrollTo({ top: 0, behavior: "smooth" });
            } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        } catch (err) {
            logError("Error opening itinerary", err);
            toast({ title: "Load failed", description: "Something went wrong loading the itinerary.", variant: "error" });
        } finally {
            setOpeningItineraryId(null);
        }
    }, [supabase, toast]);

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
            { name: 'pixabay', endpoint: '/api/images/pixabay' },
        ];
        const jobs: Array<{ key: string; candidates: string[] }> = [];
        const imageMap: Record<string, string | null> = {};
        itineraryData.days.forEach((day) => {
            day.activities.forEach((act, idx) => {
                const key = activityImageKey(day.day_number, idx);
                const candidates = getImageQueryCandidates(itineraryData, act);
                if (candidates.length === 0) { imageMap[key] = null; return; }
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
                                if (resp.ok && typeof data?.url === "string" && data.url.length > 0) { found = data.url; break; }
                            } catch { /* skip failed source */ }
                        }
                    }
                    imageMap[job.key] = found;
                } catch { imageMap[job.key] = null; }
            }
        }
        await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker()));
        setImages(imageMap);
    };

    const toggleInterest = (interest: string) => {
        setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
    };

    const toggleDay = (dayNumber: number) => {
        setExpandedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dayNumber)) { newSet.delete(dayNumber); } else { newSet.add(dayNumber); }
            return newSet;
        });
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        setError("");
        setResult(null);
        setImages({});
        const interestString = interests.length > 0 ? ` focusing on ${interests.join(", ")}` : "";
        const finalPrompt = `Create a ${budget} ${days}-day itinerary for ${prompt}${interestString}.\nMake it practical and specific:\n- Use realistic start times and include 4-6 activities per day\n- Mention neighborhoods/areas, how to get there (walk/metro/taxi), and approximate travel time between stops\n- Add expected duration and estimated cost where relevant\n- Include 1-2 food/coffee suggestions per day\n- Add short booking/entry tips where needed\n- Keep it geographically efficient (cluster nearby places)`;
        try {
            const res = await fetch("/api/itinerary/generate", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: finalPrompt, days }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate");
            setResult(data);
            analytics.itineraryGenerated(data.destination || prompt);
            fetchImagesForItinerary(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to generate itinerary. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const hasPastItineraries = pastItineraries && pastItineraries.length > 0;

    const filteredItineraries = useMemo(() => {
        if (!pastItineraries) return [];
        let items = [...pastItineraries];
        if (filterStage !== "all") {
            items = items.filter((itin: PastItineraryItem) => matchesFilter(itin, filterStage));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            items = items.filter((itin: PastItineraryItem) => {
                const title = (itin.trip_title || "").toLowerCase();
                const dest = (itin.destination || "").toLowerCase();
                const client = (itin.client?.full_name || "").toLowerCase();
                return title.includes(q) || dest.includes(q) || client.includes(q);
            });
        }
        return items;
    }, [pastItineraries, filterStage, searchQuery]);

    const isFiltering = filterStage !== "all" || searchQuery.trim().length > 0;

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 pb-24">

            {/* ═══ HERO + FORM — shown only when no result ═══ */}
            {!result && (
                <PlannerHero
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    days={days}
                    onDaysChange={setDays}
                    budget={budget}
                    onBudgetChange={setBudget}
                    interests={interests}
                    onToggleInterest={toggleInterest}
                    loading={loading}
                    onGenerate={handleGenerate}
                />
            )}

            <div className="w-full max-w-full">

                {/* ═══ RESULT — shown when itinerary is generated ═══ */}
                {result && (
                    <>
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Sticky action bar */}
                            <div className="flex justify-between items-center p-4 rounded-2xl shadow-lg border sticky top-4 z-20 backdrop-blur-xl bg-white/90 border-slate-200/50 dark:bg-slate-900/80 dark:border-slate-800 print:hidden mx-6">
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
                                                    day.activities.map(act => ({ ...act, coordinates: act.coordinates && act.coordinates.lat !== 0 ? act.coordinates : undefined }))
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
                                                                                    <span className="w-2 h-2 rounded-full bg-[#18974e]" />
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
                                                                                                            <AppImage
                                                                                                                src={imgUrl}
                                                                                                                alt={act.title}
                                                                                                                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                                                                                                loading="lazy"
                                                                                                                referrerPolicy="no-referrer"
                                                                                                                fallbackSrc="/unsplash-img/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                                                                                                                fill
                                                                                                                sizes="(max-width: 768px) 100vw, 768px"
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
                                                <CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> Location Context</CardTitle>
                                            </CardHeader>
                                            <CardContent className="h-64">
                                                <ItineraryMap
                                                    destination={result.destination}
                                                    activities={result.days.flatMap((day: Day) => day.activities.map(act => ({ ...act, coordinates: act.coordinates && act.coordinates.lat !== 0 ? act.coordinates : undefined })))}
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
                    <div className="fixed bottom-6 right-6 p-4 bg-white dark:bg-slate-950/90 border border-red-200 dark:border-red-500/30 text-red-600 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-500 flex items-center gap-3 z-50 backdrop-blur-xl">
                        <span className="text-2xl">⚠️</span>
                        {error}
                        <button onClick={() => setError("")} className="ml-2 hover:bg-red-50 p-1.5 rounded-full transition-colors">×</button>
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
                SAVED ITINERARIES — always at the bottom
            ════════════════════════════════════════════════════════════════ */}
            <div id="saved-itineraries-section" className="max-w-7xl mx-auto px-6 mt-20">
                {/* Section divider */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                    <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <FolderOpen className="w-4 h-4 text-emerald-500" />
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Your Itineraries</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                </div>

                {/* Section header */}
                <div className="flex items-end justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            Itinerary Pipeline
                        </h2>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-lg">
                            Track every plan from draft to trip. Filter by stage, assign clients, set pricing, and share with one click.
                        </p>
                    </div>
                    {hasPastItineraries && (
                        <Link
                            href="/trips"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-100 transition-all shadow-md hover:shadow-lg"
                        >
                            View Trips <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {/* Loading skeletons */}
                {isLoadingItineraries && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!isLoadingItineraries && !hasPastItineraries && (
                    <div className="flex flex-col items-center justify-center py-20 px-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center bg-white/60 dark:bg-slate-900/20">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                            <FolderOpen className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No saved itineraries yet</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed mb-6">
                            Generate a trip using the form above and click <span className="font-bold text-emerald-600">Save Trip</span> — it will appear here.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                            {["✨ Generate", "💾 Save", "👤 Assign", "📤 Share"].map((step, i, arr) => (
                                <span key={step} className="flex items-center gap-2">
                                    <span className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold">{step}</span>
                                    {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter bar + itinerary grid */}
                {!isLoadingItineraries && hasPastItineraries && (
                    <div className="space-y-6">
                        {/* Priority attention queue */}
                        <NeedsAttentionQueue
                            itineraries={pastItineraries}
                            onOpenItinerary={handleOpenItinerary}
                            openingItineraryId={openingItineraryId}
                        />

                        <ItineraryFilterBar
                            itineraries={pastItineraries}
                            filterStage={filterStage}
                            onFilterChange={setFilterStage}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            filteredCount={filteredItineraries.length}
                        />

                        {filteredItineraries.length === 0 && isFiltering && (
                            <div className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center bg-white/40 dark:bg-slate-900/10">
                                <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                                <h3 className="text-base font-bold text-slate-700 dark:text-white mb-1">No matching itineraries</h3>
                                <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
                                    Try adjusting your filters or search query.
                                </p>
                            </div>
                        )}

                        {filteredItineraries.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredItineraries.map((itinerary: PastItineraryItem) => (
                                    <PastItineraryCard
                                        key={itinerary.id}
                                        itinerary={itinerary}
                                        onOpen={handleOpenItinerary}
                                        isLoading={openingItineraryId === itinerary.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom tip */}
                {!isLoadingItineraries && hasPastItineraries && (
                    <div className="mt-8 flex items-center justify-center gap-2.5 text-xs text-slate-400 dark:text-slate-500">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pro tip: Assign a client, then share a live preview link — no WhatsApp forwarding needed!</span>
                    </div>
                )}
            </div>
        </main>
    );
}
