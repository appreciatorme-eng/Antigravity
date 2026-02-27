"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, MessageSquare, Wand2, Star, Palette, Loader2, Sparkles, Image as ImageIcon, BarChart3, Layers, Zap, History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { TemplateGallery } from "./TemplateGallery";
import { TemplateEditor } from "./TemplateEditor";
import { PosterExtractor } from "./PosterExtractor";
import { ReviewsToInsta } from "./ReviewsToInsta";
import { CaptionEngine, CaptionTone } from "./CaptionEngine";
import { MediaLibrary } from "./MediaLibrary";
import { SocialAnalytics } from "./SocialAnalytics";
import { MagicPrompter } from "./MagicPrompter";
import { CarouselBuilder } from "./CarouselBuilder";
import { PostHistory } from "./PostHistory";
import { PlatformStatusBar } from "./PlatformStatusBar";

type Tab = "templates" | "reviews" | "library" | "extractor" | "captions" | "analytics" | "prompter" | "carousel" | "history";

interface Props {
    initialOrgData: {
        name: string;
        logo_url: string | null;
        primary_color: string | null;
        phone: string | null;
    }
}

export const SocialStudioClient = ({ initialOrgData }: Props) => {
    const [activeTab, setActiveTab] = useState<Tab>("templates");

    // Platform connections (loaded by PlatformStatusBar)
    const [connections, setConnections] = useState({ instagram: false, facebook: false });

    // Template State initialized from org data
    const [templateData, setTemplateData] = useState({
        companyName: initialOrgData.name || "Agency Name",
        logoUrl: initialOrgData.logo_url || undefined,
        logoWidth: 200,
        destination: "Maldives 4N/5D",
        price: "₹45,999",
        offer: "Flat 20% OFF",
        season: "Summer Edition",
        contactNumber: initialOrgData.phone || "+91 00000 00000",
        heroImage: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&q=80&w=1080",
        services: ["Flights", "Hotels", "Holidays", "Visa"],
        bulletPoints: ["Airport Transfers", "City Tours", "Corporate Travel", "Night Out"],
        reviewText: "",
        reviewerName: "",
        reviewerTrip: ""
    });

    const [unsplashQuery, setUnsplashQuery] = useState("");
    const [unsplashResults, setUnsplashResults] = useState<{ id: string; url: string }[]>([]);
    const [searchingUnsplash, setSearchingUnsplash] = useState(false);

    const [extracting, setExtracting] = useState(false);
    const [captions, setCaptions] = useState<any>(null);
    const [captionTone, setCaptionTone] = useState<CaptionTone>("Luxury");
    const [generatingCaptions, setGeneratingCaptions] = useState(false);

    // Used by ReviewsToInsta to jump to templates with review pre-filled
    const [reviewFilterActive, setReviewFilterActive] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (type === "logo") setTemplateData(prev => ({ ...prev, logoUrl: url }));
            if (type === "hero") setTemplateData(prev => ({ ...prev, heroImage: url }));
            toast.success("Image added to templates!");
        }
    };

    const fetchUnsplashImages = async (queryOverride?: string) => {
        const queryToUse = queryOverride || unsplashQuery;
        if (!queryToUse) return;
        setSearchingUnsplash(true);
        try {
            const response = await fetch(`/api/unsplash?query=${encodeURIComponent(queryToUse)}`);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            const results = data.results.map((img: { id: string; urls: { regular: string } }) => ({
                id: img.id,
                url: img.urls.regular,
            }));
            setUnsplashResults(results);
            if (queryOverride && results.length > 0) {
                setTemplateData(prev => ({ ...prev, heroImage: results[0].url }));
            }
        } catch {
            toast.error("Failed to fetch images.");
        } finally {
            setSearchingUnsplash(false);
        }
    };

    const handleGenerateCaptions = async () => {
        setGeneratingCaptions(true);
        try {
            const resp = await fetch("/api/social/captions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateData, tone: captionTone }),
            });
            if (!resp.ok) throw new Error("Caption generation failed");
            const data = await resp.json();
            setCaptions(data);
        } catch {
            toast.error("Error generating captions.");
        } finally {
            setGeneratingCaptions(false);
        }
    };

    const TABS = [
        { id: "templates", label: "Marketing Studio", icon: Palette },
        { id: "prompter",  label: "AI Prompter",      icon: Zap },
        { id: "carousel",  label: "Carousel Builder",  icon: Layers },
        { id: "library",   label: "Media Library",     icon: ImageIcon },
        { id: "reviews",   label: "Reviews to Insta",  icon: Star },
        { id: "extractor", label: "Magic Analyzer",    icon: Wand2 },
        { id: "captions",  label: "AI Captions",       icon: MessageSquare },
        { id: "history",   label: "Post History",      icon: History },
        { id: "analytics", label: "Analytics",         icon: BarChart3 },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up pb-20 mt-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                            <Megaphone className="w-7 h-7" />
                        </div>
                        Social Studio 2.0
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium leading-relaxed">
                        Create high-converting, auto-branded social media marketing materials instantly.
                    </p>
                </div>
            </div>

            {/* Platform Status Bar */}
            <PlatformStatusBar onConnectionsLoaded={setConnections} />

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
                            activeTab === tab.id
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                        }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-white" : "text-indigo-500"}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.18 }}
                >
                    {activeTab === "templates" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2">
                            <TemplateEditor
                                templateData={templateData}
                                setTemplateData={setTemplateData}
                                unsplashQuery={unsplashQuery}
                                setUnsplashQuery={setUnsplashQuery}
                                unsplashResults={unsplashResults}
                                searchingUnsplash={searchingUnsplash}
                                onSearchUnsplash={() => fetchUnsplashImages()}
                                onImageUpload={handleImageUpload}
                                orgPrimaryColor={initialOrgData.primary_color}
                            />
                            <div className="lg:col-span-8">
                                <TemplateGallery
                                    templateData={templateData}
                                    connections={connections}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "prompter" && (
                        <MagicPrompter
                            onGenerated={(data) => {
                                setTemplateData(prev => ({
                                    ...prev,
                                    destination: data.destination,
                                    price: data.price,
                                    offer: data.offer,
                                    season: data.season,
                                    services: data.services || prev.services,
                                    bulletPoints: data.bulletPoints || prev.bulletPoints
                                }));
                                setUnsplashQuery(data.suggestedUnsplashQuery);
                                fetchUnsplashImages(data.suggestedUnsplashQuery);
                                setActiveTab("templates");
                            }}
                        />
                    )}

                    {activeTab === "carousel" && (
                        <CarouselBuilder
                            initialData={templateData}
                            onSave={(slides) => {
                                toast.success(`Saved carousel with ${slides.length} slides!`);
                                setActiveTab("templates");
                            }}
                        />
                    )}

                    {activeTab === "extractor" && (
                        <PosterExtractor
                            extracting={extracting}
                            onExtracted={(data) => {
                                setTemplateData(prev => ({
                                    ...prev,
                                    destination: data.destination || prev.destination,
                                    price: data.price || prev.price,
                                    offer: data.offer || prev.offer,
                                    season: data.season || prev.season,
                                    contactNumber: data.contactNumber || prev.contactNumber,
                                    companyName: data.companyName || prev.companyName,
                                }));
                                setActiveTab("templates");
                                toast.success("AI extracted content from poster!");
                            }}
                        />
                    )}

                    {activeTab === "reviews" && (
                        <ReviewsToInsta
                            onReviewSelected={(review) => {
                                setTemplateData(prev => ({
                                    ...prev,
                                    reviewText: review.text,
                                    reviewerName: review.name,
                                    reviewerTrip: review.trip
                                }));
                                setReviewFilterActive(true);
                                setActiveTab("templates");
                                toast.success("Review loaded — pick a Review template below!");
                            }}
                        />
                    )}

                    {activeTab === "captions" && (
                        <div className="max-w-4xl mx-auto mt-6 space-y-8 pb-20">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                        <MessageSquare className="w-6 h-6 text-indigo-500" /> AI Caption Engine
                                    </h2>
                                    <p className="text-slate-500 font-medium mt-1">High-converting copy based on your current template details.</p>
                                </div>
                                <Button
                                    size="lg"
                                    disabled={generatingCaptions}
                                    onClick={handleGenerateCaptions}
                                    className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-xl font-bold hover:shadow-indigo-500/25 shrink-0"
                                >
                                    {generatingCaptions
                                        ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        : <Sparkles className="w-5 h-5 mr-2" />
                                    }
                                    {captions ? "Regenerate" : "Generate Captions"}
                                </Button>
                            </div>

                            {/* Tone selector (always shown) */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Caption Tone</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: "Luxury" as CaptionTone,    emoji: "✨" },
                                        { key: "Budget" as CaptionTone,    emoji: "💰" },
                                        { key: "Adventure" as CaptionTone, emoji: "🏔️" },
                                        { key: "Family" as CaptionTone,    emoji: "👨‍👩‍👧" },
                                        { key: "Corporate" as CaptionTone, emoji: "💼" },
                                        { key: "Playful" as CaptionTone,   emoji: "🎉" },
                                    ].map(({ key, emoji }) => (
                                        <button
                                            key={key}
                                            onClick={() => { setCaptionTone(key); setCaptions(null); }}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                                captionTone === key
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                                            }`}
                                        >
                                            {emoji} {key}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {captions ? (
                                <CaptionEngine captions={captions} />
                            ) : (
                                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 shadow-sm animate-fade-in-up">
                                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-indigo-100">
                                        <MessageSquare className="w-10 h-10 text-indigo-500" strokeWidth={1.5} />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">Ready to write some magic?</p>
                                    <p className="text-slate-500 mt-3 max-w-sm mx-auto text-lg leading-relaxed font-medium">
                                        Pick a tone above, then click Generate to get custom {captionTone.toLowerCase()} copy.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "library" && (
                        <MediaLibrary onSelectImage={(url) => {
                            setTemplateData(prev => ({ ...prev, heroImage: url }));
                            setActiveTab("templates");
                        }} />
                    )}

                    {activeTab === "history" && <PostHistory />}

                    {activeTab === "analytics" && <SocialAnalytics />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
