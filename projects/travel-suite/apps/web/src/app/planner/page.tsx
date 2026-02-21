"use client";

import { useState } from "react";
import { Loader2, MapPin, Calendar, Wallet, Sparkles, Plane, ChevronDown, Cloud, Share2 } from "lucide-react";
import dynamic from "next/dynamic";
import DownloadPDFButton from "@/components/pdf/DownloadPDFButton";
import SaveItineraryButton from "./SaveItineraryButton";
import ShareTripModal from "@/components/ShareTripModal";
import WeatherWidget from "@/components/WeatherWidget";
import CurrencyConverter from "@/components/CurrencyConverter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, Day, ItineraryResult } from "@/types/itinerary";
import { SafariStoryView, UrbanBriefView, ProfessionalView, LuxuryResortView, VisualJourneyView, BentoJourneyView, TemplateSwitcher, ItineraryTemplateId } from "@/components/itinerary-templates";

// Dynamic import for Leaflet (SSR incompatible)
const ItineraryMap = dynamic(() => import("@/components/map/ItineraryMap"), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

const BUDGET_OPTIONS = [
    { value: "Budget-Friendly", label: "💰 Budget-Friendly" },
    { value: "Moderate", label: "⚖️ Moderate" },
    { value: "Luxury", label: "💎 Luxury" },
    { value: "Ultra-High End", label: "👑 Ultra-High End" },
];

const INTEREST_OPTIONS = [
    '🎨 Art & Culture', '🍽️ Food & Dining', '🏞️ Nature',
    '🛍️ Shopping', '🏰 History', '👨‍👩‍👧‍👦 Family'
];


export default function PlannerPage() {
    const [prompt, setPrompt] = useState("");
    const [days, setDays] = useState(3);
    const [budget, setBudget] = useState("Moderate");
    const [interests, setInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ItineraryResult | null>(null);
    const [error, setError] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<ItineraryTemplateId>('safari_story');
    const [isShareOpen, setIsShareOpen] = useState(false);

    const [images, setImages] = useState<Record<string, string | null>>({});
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])); // All days expanded by default

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

                    // Try each query candidate
                    for (const q of job.candidates) {
                        if (found) break;

                        // Try each image source until we find an image
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

        // Construct a rich prompt from the form data
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

            // Trigger image fetch non-blocking
            fetchImagesForItinerary(data);

        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to generate itinerary. Try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground bg-gradient-to-br from-emerald-50 via-white to-sky-50 pb-20 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
            <div className="w-full max-w-full">
                <div className="max-w-4xl mx-auto px-6 pt-10 pb-4 text-center print:hidden">
                    <h1 className="text-4xl md:text-5xl font-serif text-secondary mb-3 tracking-tight">GoBuddy Planner</h1>
                    <p className="text-gray-500 dark:text-slate-300 text-lg font-light">Design your perfect trip with the power of AI</p>
                </div>

                {!result ? (
                    <div className="max-w-4xl mx-auto px-6 pb-10">
                        <Card className="border-gray-100 dark:border-white/10 shadow-xl bg-white/80 dark:bg-slate-950/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-sky-50/50 dark:from-white/5 dark:to-white/0 border-b border-gray-100 dark:border-white/10 pb-6">
                                <CardTitle className="text-xl flex items-center gap-2 text-secondary">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    Start your adventure
                                </CardTitle>
                                <CardDescription>
                                    Tell us where you want to go, and we&apos;ll handle the rest.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-8">
                                {/* Destination Input */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-slate-200 ml-1 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" /> Where to?
                                    </label>
                                    <Input
                                        type="text"
                                        className="h-14 text-lg bg-background/80 border-input placeholder:text-muted-foreground focus-visible:ring-primary pl-4"
                                        placeholder="e.g. Paris, Tokyo, New York"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Duration Input */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-200 ml-1 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" /> Duration (Days)
                                        </label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={14}
                                            value={days}
                                            onChange={(e) => setDays(Number(e.target.value))}
                                            className="h-12 bg-background/80 border-input placeholder:text-muted-foreground focus-visible:ring-primary"
                                        />
                                    </div>

                                    {/* Budget Input */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-gray-700 dark:text-slate-200 ml-1 flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-primary" /> Budget
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {BUDGET_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setBudget(option.value)}
                                                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border ${budget === option.value
                                                        ? 'bg-primary text-white border-primary shadow-md transform scale-[1.02]'
                                                        : 'bg-white/80 dark:bg-white/5 text-gray-600 dark:text-slate-200 border-gray-200 dark:border-white/10 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-white/10'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Interests Input */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-slate-200 ml-1 flex items-center gap-2">
                                        <Plane className="w-4 h-4 text-primary" /> Interests
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {INTEREST_OPTIONS.map((tag) => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleInterest(tag)}
                                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${interests.includes(tag)
                                                    ? 'bg-secondary text-white border-secondary shadow-sm transform scale-105'
                                                    : 'bg-white/80 dark:bg-white/5 text-gray-600 dark:text-slate-200 border-gray-200 dark:border-white/10 hover:border-secondary hover:text-secondary hover:bg-gray-50 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading || !prompt}
                                    className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin w-5 h-5 mr-2" />
                                            Crafting your Journey...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            Generate Dream Itinerary
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <>
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Actions Bar */}
                            <div className="flex justify-between items-center p-4 rounded-xl shadow-sm border sticky top-4 z-20 backdrop-blur-md bg-white/80 border-gray-100 dark:bg-slate-950/40 dark:border-white/10 print:hidden">
                                <Button
                                    variant="ghost"
                                    onClick={() => setResult(null)}
                                    className="text-gray-500 dark:text-slate-300 hover:text-secondary"
                                >
                                    ← Start Over
                                </Button>
                                <div className="flex gap-2">
                                    <SaveItineraryButton
                                        itineraryData={result}
                                        destination={prompt}
                                        days={days}
                                        budget={budget}
                                        interests={interests}
                                    />
                                    <button
                                        onClick={() => setIsShareOpen(true)}
                                        className="px-4 py-2 bg-white text-secondary hover:bg-gray-50 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2 transition-all text-sm font-medium"
                                    >
                                        <Share2 className="w-4 h-4" /> Share Trip
                                    </button>
                                    <DownloadPDFButton
                                        data={result}
                                        fileName={`${result.trip_title.replace(/\s+/g, '_')}_Itinerary.pdf`}
                                    />
                                </div>
                            </div>

                            {/* Itinerary Header */}
                            <div className="text-center space-y-4">
                                <Badge variant="outline" className="px-4 py-1 text-base border-primary/20 bg-primary/5 text-primary">
                                    {result.duration_days} Days in {result.destination}
                                </Badge>
                                <h2 className="text-4xl font-serif text-secondary leading-tight">{result.trip_title}</h2>
                                <p className="text-xl text-gray-600 dark:text-slate-200 font-light max-w-2xl mx-auto leading-relaxed">{result.summary}</p>
                            </div>

                            {/* Map & Currency Converter */}
                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 h-80 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10 relative">
                                    <ItineraryMap
                                        destination={result.destination}
                                        activities={result.days.flatMap((day: Day) =>
                                            day.activities.map(act => ({
                                                ...act,
                                                // Ensure coordinates exist. If missing, fall back to null/undefined so the map component filters them out safely
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

                            {/* Weather Forecast - Full Width Prominent Display */}
                            <Card className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-sky-200 dark:border-sky-800/30 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-2xl text-gray-800 dark:text-slate-100 flex items-center gap-3">
                                        <Cloud className="w-7 h-7 text-sky-600" />
                                        Weather Forecast for {result.destination}
                                    </CardTitle>
                                    <CardDescription>
                                        Plan your activities around the weather
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <WeatherWidget
                                        destination={result.destination}
                                        days={result.duration_days}
                                        compact={false}
                                    />
                                </CardContent>
                            </Card>

                            {/* Template Switcher */}
                            <Card className="bg-white dark:bg-slate-950 shadow-lg print:hidden">
                                <CardContent className="pt-6">
                                    <TemplateSwitcher
                                        currentTemplate={selectedTemplate}
                                        onTemplateChange={setSelectedTemplate}
                                    />
                                </CardContent>
                            </Card>
                        </div> {/* End inner animate container */}

                        {/* FULL WIDTH LAYOUT FOR TEMPLATES */}
                        <div id="itinerary-pdf-content" className="w-full mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            {/* Template-Based Itinerary Display */}
                            {selectedTemplate === 'safari_story' && (
                                <SafariStoryView itinerary={result!} />
                            )}
                            {selectedTemplate === 'urban_brief' && (
                                <UrbanBriefView itinerary={result!} />
                            )}
                            {selectedTemplate === 'professional' && (
                                <ProfessionalView itinerary={result!} />
                            )}
                            {selectedTemplate === 'luxury_resort' && (
                                <LuxuryResortView itinerary={result!} />
                            )}
                            {selectedTemplate === 'visual_journey' && (
                                <VisualJourneyView itinerary={result!} />
                            )}
                            {selectedTemplate === 'bento_journey' && (
                                <BentoJourneyView itinerary={result!} />
                            )}

                            {/* Classic Accordion (fallback) must remain constrained */}
                            {!(['safari_story', 'urban_brief', 'professional', 'luxury_resort', 'visual_journey', 'bento_journey'] as string[]).includes(selectedTemplate) && (
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    {result!.days.map((day: Day, dayIndex: number) => {
                                        const isExpanded = expandedDays.has(day.day_number);
                                        const isLastDay = dayIndex === result.days.length - 1;

                                        return (
                                            <div key={day.day_number} className="relative">
                                                {/* Timeline connector */}
                                                {!isLastDay && (
                                                    <div className="absolute left-[30px] top-[60px] bottom-[-24px] w-[2px] border-l-2 border-dashed border-gray-300 dark:border-gray-600 hidden md:block" />
                                                )}

                                                {/* Timeline circle indicator */}
                                                <div className="absolute left-[22px] top-[20px] w-[18px] h-[18px] rounded-full bg-[#124ea2] border-4 border-white dark:border-slate-950 shadow-md z-10 hidden md:block" />

                                                {/* Day card with left margin for timeline on desktop */}
                                                <div className="md:ml-16">
                                                    {/* Accordion Header */}
                                                    <button
                                                        onClick={() => toggleDay(day.day_number)}
                                                        className="w-full bg-gradient-to-r from-[#124ea2] to-[#1a5fc7] text-white px-6 py-4 rounded-t-xl flex items-center justify-between hover:from-[#0f3d82] hover:to-[#124ea2] transition-all shadow-md group"
                                                    >
                                                        <h3 className="text-lg font-bold uppercase tracking-wide">
                                                            DAY {day.day_number}
                                                        </h3>
                                                        <ChevronDown
                                                            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : '[.pdf-exporting_&]:rotate-180'}`}
                                                        />
                                                    </button>

                                                    {/* Collapsible Content */}
                                                    <div
                                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0 [.pdf-exporting_&]:max-h-[10000px] [.pdf-exporting_&]:opacity-100'
                                                            }`}
                                                    >
                                                        <div className="bg-white dark:bg-slate-950/40 rounded-b-xl shadow-lg border-x border-b border-gray-200 dark:border-white/10 p-6">
                                                            {/* Theme subtitle */}
                                                            <p className="text-[#18974e] font-semibold text-base mb-6 flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-[#18974e]"></span>
                                                                {day.theme}
                                                            </p>

                                                            {/* Activities */}
                                                            <div className="space-y-8">
                                                                {day.activities.map((act: Activity, idx: number) => {
                                                                    const imgKey = activityImageKey(day.day_number, idx);
                                                                    const imgUrl = images[imgKey];

                                                                    return (
                                                                        <div key={idx} className="group relative">
                                                                            {/* Large Feature Image with Overlay */}
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
                                                                                        {/* Gradient overlay */}
                                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                                                                        {/* Time badge */}
                                                                                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-800 dark:text-slate-100 shadow-lg">
                                                                                            {act.time}
                                                                                        </div>

                                                                                        {/* Title overlay at bottom */}
                                                                                        <div className="absolute bottom-0 left-0 right-0 p-6">
                                                                                            <h4 className="text-2xl font-bold text-white mb-2">
                                                                                                {act.title}
                                                                                            </h4>
                                                                                            <div className="flex items-center gap-2 text-white/90 text-sm">
                                                                                                <MapPin className="w-4 h-4" />
                                                                                                {act.location}
                                                                                            </div>
                                                                                        </div>
                                                                                    </>
                                                                                ) : (
                                                                                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                                                        <span className="text-gray-400 dark:text-gray-500">No image available</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Activity Details Below Image */}
                                                                            <div className="space-y-3 px-2">
                                                                                <p className="text-gray-700 dark:text-slate-200 leading-relaxed">
                                                                                    {act.description}
                                                                                </p>

                                                                                {/* Metadata badges */}
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {act.duration && (
                                                                                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                                                                            ⏱️ {act.duration}
                                                                                        </Badge>
                                                                                    )}
                                                                                    {act.cost && (
                                                                                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                                                                            💰 {act.cost}
                                                                                        </Badge>
                                                                                    )}
                                                                                    {act.transport && (
                                                                                        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                                                                                            🚇 {act.transport}
                                                                                        </Badge>
                                                                                    )}
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
                        </div>
                    </>
                )}

                {error && (
                    <div className="fixed bottom-6 right-6 p-4 bg-white dark:bg-slate-950/70 border border-red-200 dark:border-red-500/30 text-red-600 rounded-xl shadow-2xl animate-in slide-in-from-right duration-500 flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        {error}
                        <button onClick={() => setError("")} className="ml-2 hover:bg-red-50 p-1 rounded-full"><span className="sr-only">Dismiss</span>×</button>
                    </div>
                )}

                {/* Share Trip Modal — renders as overlay when opened */}
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
        </main>
    );
}
