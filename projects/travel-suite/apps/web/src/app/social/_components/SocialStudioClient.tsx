"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, MessageSquare, Wand2, Star, Palette, Loader2, Sparkles, Image as ImageIcon, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { TemplateGallery } from "./TemplateGallery";
import { TemplateEditor } from "./TemplateEditor";
import { PosterExtractor } from "./PosterExtractor";
import { ReviewsToInsta } from "./ReviewsToInsta";
import { CaptionEngine } from "./CaptionEngine";
import { MediaLibrary } from "./MediaLibrary";
import { SocialAnalytics } from "./SocialAnalytics";

type Tab = "templates" | "reviews" | "library" | "extractor" | "captions" | "analytics";

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
    const [generatingCaptions, setGeneratingCaptions] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (type === 'logo') setTemplateData(prev => ({ ...prev, logoUrl: url }));
            if (type === 'hero') setTemplateData(prev => ({ ...prev, heroImage: url }));
            toast.success("Image added to templates!");
        }
    };

    const fetchUnsplashImages = async () => {
        if (!unsplashQuery) return;
        setSearchingUnsplash(true);
        try {
            const response = await fetch(`/api/unsplash?query=${encodeURIComponent(unsplashQuery)}`);
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setUnsplashResults(
                data.results.map((img: { id: string; urls: { regular: string } }) => ({
                    id: img.id,
                    url: img.urls.regular,
                }))
            );
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
                body: JSON.stringify({ templateData }),
            });
            if (!resp.ok) throw new Error("Caption generation failed");
            const data = await resp.json();
            setCaptions(data);
        } catch (e) {
            toast.error("Error generating captions.");
        } finally {
            setGeneratingCaptions(false);
        }
    };

    const renderTabs = () => (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-2">
            {[
                { id: "templates", label: "Marketing Studio", icon: Palette },
                { id: "library", label: "Media Library", icon: ImageIcon },
                { id: "reviews", label: "Reviews to Insta", icon: Star },
                { id: "extractor", label: "Magic Poster Analyzer", icon: Wand2 },
                { id: "captions", label: "AI Captions", icon: MessageSquare },
                { id: "analytics", label: "Analytics", icon: BarChart3 }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md ${activeTab === tab.id
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                        }`}
                >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-indigo-500'}`} />
                    {tab.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in-up pb-20 mt-4">
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

            {renderTabs()}

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.2 }}
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
                                onSearchUnsplash={fetchUnsplashImages}
                                onImageUpload={handleImageUpload}
                            />
                            <div className="lg:col-span-8">
                                <TemplateGallery templateData={templateData} />
                            </div>
                        </div>
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
                                setActiveTab("templates");
                            }}
                        />
                    )}
                    {activeTab === "captions" && (
                        <div className="max-w-4xl mx-auto mt-6 space-y-8 pb-20">
                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><MessageSquare className="w-6 h-6 text-indigo-500" /> AI Caption Engine</h2>
                                    <p className="text-slate-500 font-medium mt-1">Generate high-converting copy based on your current template details.</p>
                                </div>
                                <Button size="lg" disabled={generatingCaptions} onClick={handleGenerateCaptions} className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-xl font-bold hover:shadow-indigo-500/25">
                                    {generatingCaptions ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                    {captions ? "Regenerate" : "Generate Captions"}
                                </Button>
                            </div>
                            {captions ? (
                                <CaptionEngine captions={captions} />
                            ) : (
                                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 shadow-sm animate-fade-in-up">
                                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-indigo-100">
                                        <MessageSquare className="w-10 h-10 text-indigo-500" strokeWidth={1.5} />
                                    </div>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">Ready to write some magic?</p>
                                    <p className="text-slate-500 mt-3 max-w-sm mx-auto text-lg leading-relaxed font-medium">Click generate to get customized, high-converting copy for your social media posts.</p>
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
                    {activeTab === "analytics" && (
                        <SocialAnalytics />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
