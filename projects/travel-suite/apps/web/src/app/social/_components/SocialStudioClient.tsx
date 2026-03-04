"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { SocialTemplate } from "@/lib/social/types";
import { GlassModal } from "@/components/glass/GlassModal";

// New components
import { ContentBar } from "./ContentBar";
import { BackgroundPicker } from "./BackgroundPicker";
import { CanvasMode } from "./CanvasMode";
import { ToolbarActions, type ToolbarAction } from "./ToolbarActions";
import { TemplateGallery } from "./TemplateGallery";

// Existing components (now accessed via toolbar modals)
import { MagicPrompter } from "./MagicPrompter";
import { CarouselBuilder } from "./CarouselBuilder";
import { MediaLibrary } from "./MediaLibrary";
import { ReviewsToInsta } from "./ReviewsToInsta";
import { PosterExtractor } from "./PosterExtractor";
import { CaptionEngine, CaptionTone } from "./CaptionEngine";
import { PostHistory } from "./PostHistory";
import { SocialAnalytics } from "./SocialAnalytics";
import { PlatformStatusBar } from "./PlatformStatusBar";

interface Props {
    initialOrgData: {
        name: string;
        logo_url: string | null;
        primary_color: string | null;
        phone: string | null;
        email?: string | null;
        website?: string | null;
    }
}

export const SocialStudioClient = ({ initialOrgData }: Props) => {
    // Platform connections
    const [connections, setConnections] = useState({ instagram: false, facebook: false });

    // Template data (same initial shape as before)
    const [templateData, setTemplateData] = useState({
        companyName: initialOrgData.name || "Agency Name",
        logoUrl: initialOrgData.logo_url || undefined,
        logoWidth: 200,
        destination: "Maldives 4N/5D",
        price: "₹45,999",
        offer: "Flat 20% OFF",
        season: "Summer Edition",
        contactNumber: initialOrgData.phone || "+91 00000 00000",
        email: initialOrgData.email || "info@yourcompany.com",
        website: initialOrgData.website || "www.yourcompany.com",
        heroImage: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&q=80&w=1080",
        services: ["Flights", "Hotels", "Holidays", "Visa"],
        bulletPoints: ["Airport Transfers", "City Tours", "Corporate Travel", "Night Out"],
        reviewText: "",
        reviewerName: "",
        reviewerTrip: ""
    });

    // Background management
    const [availableBackgrounds, setAvailableBackgrounds] = useState<string[]>([
        templateData.heroImage || ""
    ].filter(Boolean));

    // Canvas mode
    const [canvasTemplate, setCanvasTemplate] = useState<SocialTemplate | null>(null);

    // Toolbar action modals
    const [activeAction, setActiveAction] = useState<ToolbarAction | null>(null);

    // Captions state (needed for captions modal)
    const [captions, setCaptions] = useState<any>(null);
    const [captionTone, setCaptionTone] = useState<CaptionTone>("Luxury");
    const [generatingCaptions, setGeneratingCaptions] = useState(false);

    // Image upload handler
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (type === "logo") setTemplateData(prev => ({ ...prev, logoUrl: url }));
            if (type === "hero") {
                setTemplateData(prev => ({ ...prev, heroImage: url }));
                setAvailableBackgrounds(prev => [...prev, url]);
            }
            toast.success("Image added!");
        }
    }, []);

    // Background change handler
    const handleBackgroundChange = useCallback((url: string) => {
        setTemplateData(prev => ({ ...prev, heroImage: url }));
    }, []);

    // When AI generates new backgrounds
    const handleBackgroundsGenerated = useCallback((urls: string[]) => {
        setAvailableBackgrounds(prev => [...prev, ...urls]);
    }, []);

    // Caption generation
    const handleGenerateCaptions = useCallback(async () => {
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
    }, [templateData, captionTone]);

    // Toolbar action handler
    const handleActionSelect = useCallback((action: ToolbarAction) => {
        setActiveAction(action);
    }, []);

    // Close action modal
    const closeAction = useCallback(() => {
        setActiveAction(null);
    }, []);

    return (
        <div className="space-y-5 animate-fade-in-up pb-20 mt-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                            <Megaphone className="w-7 h-7" />
                        </div>
                        Social Studio
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium leading-relaxed">
                        Create stunning, auto-branded social media posters — choose a background, pick a template, export.
                    </p>
                </div>
            </div>

            {/* Platform Status Bar */}
            <PlatformStatusBar onConnectionsLoaded={setConnections} />

            {/* Toolbar Actions (replaces 9 tabs) */}
            <ToolbarActions onActionSelect={handleActionSelect} />

            {/* Content Bar (replaces sidebar form) */}
            <ContentBar
                templateData={templateData as any}
                setTemplateData={setTemplateData as any}
                orgPrimaryColor={initialOrgData.primary_color}
                onImageUpload={handleImageUpload}
            />

            {/* Background Picker */}
            <BackgroundPicker
                templateData={templateData}
                selectedBackground={templateData.heroImage || ""}
                availableBackgrounds={availableBackgrounds}
                onBackgroundChange={handleBackgroundChange}
                onBackgroundsGenerated={handleBackgroundsGenerated}
                onImageUpload={(e) => handleImageUpload(e, "hero")}
            />

            {/* Template Gallery (full width, 3 cols) */}
            <TemplateGallery
                templateData={templateData}
                connections={connections}
                onTemplateSelect={setCanvasTemplate}
            />

            {/* Canvas Mode (full-screen overlay) */}
            <AnimatePresence>
                {canvasTemplate && (
                    <CanvasMode
                        template={canvasTemplate}
                        templateData={templateData}
                        backgrounds={availableBackgrounds}
                        selectedBackground={templateData.heroImage || ""}
                        connections={connections}
                        onTemplateDataChange={setTemplateData}
                        onBackgroundChange={handleBackgroundChange}
                        onClose={() => setCanvasTemplate(null)}
                    />
                )}
            </AnimatePresence>

            {/* --- Toolbar Action Modals --- */}

            {/* AI Prompter */}
            {activeAction === "prompter" && (
                <GlassModal isOpen onClose={closeAction} title="AI Prompter" size="lg">
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
                            closeAction();
                            toast.success("Content generated! Templates updated.");
                        }}
                    />
                </GlassModal>
            )}

            {/* Carousel Builder */}
            {activeAction === "carousel" && (
                <GlassModal isOpen onClose={closeAction} title="Carousel Builder" size="xl">
                    <CarouselBuilder
                        initialData={templateData}
                        onSave={(slides) => {
                            toast.success(`Saved carousel with ${slides.length} slides!`);
                            closeAction();
                        }}
                    />
                </GlassModal>
            )}

            {/* Media Library */}
            {activeAction === "library" && (
                <GlassModal isOpen onClose={closeAction} title="Media Library" size="xl">
                    <MediaLibrary onSelectImage={(url) => {
                        setTemplateData(prev => ({ ...prev, heroImage: url }));
                        setAvailableBackgrounds(prev => [...prev, url]);
                        closeAction();
                        toast.success("Image selected! Templates updated.");
                    }} />
                </GlassModal>
            )}

            {/* Reviews to Instagram */}
            {activeAction === "reviews" && (
                <GlassModal isOpen onClose={closeAction} title="Reviews → Instagram" size="lg">
                    <ReviewsToInsta
                        onReviewSelected={(review) => {
                            setTemplateData(prev => ({
                                ...prev,
                                reviewText: review.text,
                                reviewerName: review.name,
                                reviewerTrip: review.trip
                            }));
                            closeAction();
                            toast.success("Review loaded! Pick a Review template below.");
                        }}
                    />
                </GlassModal>
            )}

            {/* Magic Analyzer / Poster Extractor */}
            {activeAction === "extractor" && (
                <GlassModal isOpen onClose={closeAction} title="Magic Analyzer" size="lg">
                    <PosterExtractor
                        extracting={false}
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
                            closeAction();
                            toast.success("AI extracted content from poster!");
                        }}
                    />
                </GlassModal>
            )}

            {/* AI Captions */}
            {activeAction === "captions" && (
                <GlassModal isOpen onClose={closeAction} title="AI Captions" size="lg">
                    <div className="space-y-6">
                        {/* Tone selector */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Caption Tone</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: "Luxury" as CaptionTone, emoji: "✨" },
                                    { key: "Budget" as CaptionTone, emoji: "💰" },
                                    { key: "Adventure" as CaptionTone, emoji: "🏔️" },
                                    { key: "Family" as CaptionTone, emoji: "👨‍👩‍👧" },
                                    { key: "Corporate" as CaptionTone, emoji: "💼" },
                                    { key: "Playful" as CaptionTone, emoji: "🎉" },
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

                        {/* Generate button */}
                        <button
                            disabled={generatingCaptions}
                            onClick={handleGenerateCaptions}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all"
                        >
                            {generatingCaptions ? "Generating..." : captions ? "Regenerate" : "Generate Captions"}
                        </button>

                        {/* Results */}
                        {captions && <CaptionEngine captions={captions} />}
                    </div>
                </GlassModal>
            )}

            {/* Post History */}
            {activeAction === "history" && (
                <GlassModal isOpen onClose={closeAction} title="Post History" size="xl">
                    <PostHistory />
                </GlassModal>
            )}

            {/* Analytics */}
            {activeAction === "analytics" && (
                <GlassModal isOpen onClose={closeAction} title="Analytics" size="xl">
                    <SocialAnalytics />
                </GlassModal>
            )}
        </div>
    );
};
