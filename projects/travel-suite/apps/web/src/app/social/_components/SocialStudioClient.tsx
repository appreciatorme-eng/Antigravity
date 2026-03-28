"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";
import { matchDestination } from "@/lib/social/destination-images";
import { GlassModal } from "@/components/glass/GlassModal";

// New components
import { ContentBar } from "./ContentBar";
import { BackgroundPicker } from "./BackgroundPicker";
import { GallerySlotPicker } from "./GallerySlotPicker";
import { CanvasMode } from "./CanvasMode";
import { ToolbarActions, type ToolbarAction } from "./ToolbarActions";
import { TemplateGallery } from "./TemplateGallery";

import { PlatformStatusBar } from "./PlatformStatusBar";
import { GuidedTour } from '@/components/tour/GuidedTour';
import { CaptionEngine, CaptionTone, CaptionPlatform } from "./CaptionEngine";

const MagicPrompter = dynamic(() => import("./MagicPrompter").then((mod) => mod.MagicPrompter));
const CarouselBuilder = dynamic(() => import("./CarouselBuilder").then((mod) => mod.CarouselBuilder));
const MediaLibrary = dynamic(() => import("./MediaLibrary").then((mod) => mod.MediaLibrary));
const ReviewsToInsta = dynamic(() => import("./ReviewsToInsta").then((mod) => mod.ReviewsToInsta));
const PosterExtractor = dynamic(() => import("./PosterExtractor").then((mod) => mod.PosterExtractor));
const PostHistory = dynamic(() => import("./PostHistory").then((mod) => mod.PostHistory));
const SocialAnalytics = dynamic(() => import("./SocialAnalytics").then((mod) => mod.SocialAnalytics));
const BulkExporter = dynamic(() => import("./BulkExporter").then((mod) => mod.BulkExporter));
const TripImporter = dynamic(() => import("./TripImporter").then((mod) => mod.TripImporter));
const CalendarView = dynamic(() => import("./CalendarView").then((mod) => mod.CalendarView));

interface Props {
    initialOrgData: {
        name: string;
        logo_url: string | null;
        primary_color: string | null;
        phone: string | null;
        email?: string | null;
        website?: string | null;
        subscription_tier?: string | null;
    }
}

export const SocialStudioClient = ({ initialOrgData }: Props) => {
    // Platform connections
    const [connections, setConnections] = useState({ instagram: false, facebook: false });

    // Template data (same initial shape as before)
    const [templateData, setTemplateData] = useState<TemplateDataForRender>({
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
        heroImage: "/unsplash-img/photo-1512100356356-de1b84283e18?auto=format&fit=crop&q=80&w=1080",
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

    // AI Poster (bypasses template rendering — the AI image IS the poster)
    const [aiPosterUrl, setAiPosterUrl] = useState<string | null>(null);

    // Track which multi-image template is being previewed (for GallerySlotPicker)
    const [previewedTemplate, setPreviewedTemplate] = useState<SocialTemplate | null>(null);
    const isMultiImage = previewedTemplate?.isMultiImage ?? false;
    const imageSlotCount = previewedTemplate?.imageSlotCount ?? 3;

    // Toolbar action modals
    const [activeAction, setActiveAction] = useState<ToolbarAction | null>(null);

    // Captions state (needed for captions modal)
    const [captions, setCaptions] = useState<Record<string, unknown> | null>(null);
    const [captionTone, setCaptionTone] = useState<CaptionTone>("Luxury");
    const [captionPlatform, setCaptionPlatform] = useState<CaptionPlatform>("instagram");
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
                body: JSON.stringify({ templateData, tone: captionTone, platform: captionPlatform }),
            });
            if (!resp.ok) throw new Error("Caption generation failed");
            const data = await resp.json();
            setCaptions(data);
        } catch {
            toast.error("Error generating captions.");
        } finally {
            setGeneratingCaptions(false);
        }
    }, [templateData, captionTone, captionPlatform]);

    // Toolbar action handler
    const handleActionSelect = useCallback((action: ToolbarAction) => {
        setActiveAction(action);
    }, []);

    // Close action modal
    const closeAction = useCallback(() => {
        setActiveAction(null);
    }, []);

    // --- Auto-save draft (debounced 3s) ---
    const draftTimerRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        draftTimerRef.current = setTimeout(() => {
            localStorage.setItem("social-studio-draft", JSON.stringify({
                templateData,
                availableBackgrounds,
                aiPosterUrl,
                savedAt: Date.now(),
            }));
        }, 3000);
        return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
    }, [templateData, availableBackgrounds, aiPosterUrl]);

    // --- Restore draft on mount (once, if < 24h old) ---
    const draftRestoredRef = useRef(false);

    useEffect(() => {
        if (draftRestoredRef.current) return;
        draftRestoredRef.current = true;
        try {
            const raw = localStorage.getItem("social-studio-draft");
            if (!raw) return;
            const draft = JSON.parse(raw);
            const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
            if (Date.now() - draft.savedAt > TWENTY_FOUR_HOURS) return;
            if (draft.templateData) {
                setTemplateData((prev) => ({ ...prev, ...draft.templateData }));
            }
            if (draft.availableBackgrounds?.length) {
                setAvailableBackgrounds(draft.availableBackgrounds);
            }
            if (typeof draft.aiPosterUrl === "string" && draft.aiPosterUrl) {
                setAiPosterUrl(draft.aiPosterUrl);
            }
            toast.success("Draft restored from earlier session");
        } catch {
            /* ignore corrupt data */
        }
    }, []);

    // --- Auto-populate galleryImages from destination library ---
    const prevDestRef = useRef(templateData.destination);

    useEffect(() => {
        // Only trigger when destination actually changes (not on every render)
        if (prevDestRef.current === templateData.destination) return;
        prevDestRef.current = templateData.destination;

        const images = matchDestination(templateData.destination);
        if (images.length >= 2) {
            setTemplateData((prev) => ({
                ...prev,
                galleryImages: images.map((img) => img.url),
            }));
            // Also add to available backgrounds pool
            const newUrls = images.map((img) => img.url);
            setAvailableBackgrounds((prev) => {
                const merged = new Set([...prev, ...newUrls]);
                return Array.from(merged);
            });
        }
    }, [templateData.destination]);

    // Gallery image change handler for GallerySlotPicker
    const handleGalleryChange = useCallback((images: string[]) => {
        setTemplateData((prev) => ({ ...prev, galleryImages: images }));
    }, []);

    // AI Poster generated — set as poster URL and also update heroImage for preview
    const handleAiPosterGenerated = useCallback((url: string) => {
        setAiPosterUrl(url);
        setTemplateData(prev => ({ ...prev, heroImage: url }));
    }, []);

    // Template select handler — track previewed template + open canvas
    const handleTemplateSelect = useCallback((template: SocialTemplate) => {
        setPreviewedTemplate(template);
        setCanvasTemplate(template);
    }, []);

    const step1Done = !!(templateData.destination && templateData.price);
    const step2Done = !!(aiPosterUrl || availableBackgrounds.length > 1);
    const step3Done = !!canvasTemplate;

    return (
        <div className="space-y-5 animate-fade-in-up pb-20 mt-4">
            <GuidedTour />
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

            {/* 3-Step Workflow Guide */}
            <div className="flex items-center gap-2 px-1">
                {[
                    { n: 1, label: "Fill content", sub: "Destination, price, offer", done: step1Done },
                    { n: 2, label: "Pick background", sub: "Photo, AI, or upload", done: step2Done },
                    { n: 3, label: "Choose template", sub: "Click any card below", done: step3Done },
                ].map((step, i) => (
                    <div key={step.n} className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center gap-2.5 flex-1 px-3 py-2.5 rounded-xl border transition-all ${
                            step.done
                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        }`}>
                            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                step.done
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}>
                                {step.done
                                    ? <CheckCircle2 className="w-4 h-4" />
                                    : <Circle className="w-4 h-4" />
                                }
                            </div>
                            <div className="min-w-0">
                                <p className={`text-xs font-bold truncate ${step.done ? "text-emerald-700 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`}>
                                    {step.n}. {step.label}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{step.sub}</p>
                            </div>
                        </div>
                        {i < 2 && (
                            <div className={`w-6 h-0.5 shrink-0 rounded-full transition-all ${step.done ? "bg-emerald-300 dark:bg-emerald-700" : "bg-slate-200 dark:bg-slate-700"}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Platform Status Bar */}
            <PlatformStatusBar onConnectionsLoaded={setConnections} />

            {/* Toolbar Actions (replaces 9 tabs) */}
            <div data-tour="social-publish">
            <ToolbarActions onActionSelect={handleActionSelect} />
            </div>

            {/* Content Bar (replaces sidebar form) — TemplateDataForRender is a superset
                of ContentBar's local TemplateData; cast through unknown to bridge the gap */}
            <div data-tour="social-composer">
            <ContentBar
                templateData={templateData as unknown as React.ComponentProps<typeof ContentBar>["templateData"]}
                setTemplateData={setTemplateData as unknown as React.ComponentProps<typeof ContentBar>["setTemplateData"]}
                orgPrimaryColor={initialOrgData.primary_color}
                onImageUpload={handleImageUpload}
            />
            </div>

            {/* Background / Gallery Picker — conditional on multi-image */}
            {isMultiImage ? (
                <GallerySlotPicker
                    galleryImages={templateData.galleryImages || []}
                    slotCount={imageSlotCount}
                    destination={templateData.destination}
                    onGalleryChange={handleGalleryChange}
                    onImageUpload={(e) => handleImageUpload(e, "hero")}
                />
            ) : (
                <BackgroundPicker
                    templateData={templateData}
                    selectedBackground={templateData.heroImage || ""}
                    availableBackgrounds={availableBackgrounds}
                    onBackgroundChange={handleBackgroundChange}
                    onBackgroundsGenerated={handleBackgroundsGenerated}
                    onImageUpload={(e) => handleImageUpload(e, "hero")}
                    onAiPosterGenerated={handleAiPosterGenerated}
                />
            )}

            {/* Template Gallery (full width, 3 cols) */}
            <div data-tour="social-templates">
            <TemplateGallery
                templateData={templateData}
                connections={connections}
                userTier={initialOrgData.subscription_tier ?? "free"}
                onTemplateSelect={handleTemplateSelect}
            />
            </div>

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
                        aiPosterUrl={aiPosterUrl}
                        onClearAiPoster={() => setAiPosterUrl(null)}
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
                                destination: (data.destination as string) ?? prev.destination,
                                price: (data.price as string) ?? prev.price,
                                offer: (data.offer as string) ?? prev.offer,
                                season: (data.season as string) ?? prev.season,
                                services: (data.services as string[] | undefined) || prev.services,
                                bulletPoints: (data.bulletPoints as string[] | undefined) || prev.bulletPoints,
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

            {/* Import from Trip */}
            {activeAction === "trips" && (
                <GlassModal isOpen onClose={closeAction} title="Import from Trip" size="lg">
                    <TripImporter
                        onImport={(data) => {
                            setTemplateData(prev => ({ ...prev, ...data }));
                            if (data.heroImage) {
                                setAvailableBackgrounds(prev => [...prev, data.heroImage!]);
                            }
                            closeAction();
                            toast.success("Trip data imported! Templates updated.");
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
                        {captions && (
                            <CaptionEngine
                                captions={captions}
                                selectedPlatform={captionPlatform}
                                onPlatformChange={setCaptionPlatform}
                            />
                        )}
                    </div>
                </GlassModal>
            )}

            {/* Campaign Pack / Bulk Exporter */}
            {activeAction === "bulk" && (
                <GlassModal isOpen onClose={closeAction} title="Campaign Pack" size="lg">
                    <BulkExporter
                        templateData={templateData}
                        backgrounds={availableBackgrounds}
                        selectedBackground={templateData.heroImage || ""}
                        onComplete={(count) => {
                            closeAction();
                            toast.success(`Downloaded ${count} images as ZIP!`);
                        }}
                    />
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

            {/* Calendar */}
            {activeAction === "calendar" && (
                <GlassModal isOpen onClose={closeAction} title="Calendar" size="xl">
                    <CalendarView />
                </GlassModal>
            )}
        </div>
    );
};
