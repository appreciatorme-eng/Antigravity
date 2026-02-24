"use client";

import { useState } from "react";
import type { ItineraryResult } from "@/types/itinerary";
import { SafariStoryView } from "@/components/itinerary-templates/SafariStoryView";
import { UrbanBriefView } from "@/components/itinerary-templates/UrbanBriefView";
import ProfessionalView from "@/components/itinerary-templates/ProfessionalView";
import { LuxuryResortView } from "@/components/itinerary-templates/LuxuryResortView";
import { VisualJourneyView } from "@/components/itinerary-templates/VisualJourneyView";
import { BentoJourneyView } from "@/components/itinerary-templates/BentoJourneyView";
import ItineraryTemplateClassic from "@/components/templates/ItineraryTemplateClassic";
import ItineraryTemplateModern from "@/components/templates/ItineraryTemplateModern";
import { InteractivePricing } from "@/components/InteractivePricing";
import { ApprovalManager } from "@/components/planner/ApprovalManager";
import { DownloadCloud } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ShareTemplateRendererProps {
    token: string;
    templateId: string;
    itinerary: ItineraryResult;
    organizationName: string;
    client: { name: string; email?: string } | null;
}

export default function ShareTemplateRenderer({
    token,
    templateId,
    itinerary,
    organizationName,
    client,
}: ShareTemplateRendererProps) {
    const { toast } = useToast();
    const [caching, setCaching] = useState(false);

    const handleCacheForOffline = async () => {
        if (typeof window === "undefined") return;
        setCaching(true);
        try {
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: "CACHE_URLS",
                    urls: [window.location.href, `/api/share/${token}`],
                });
            }
            await fetch(`/api/share/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "mark_offline_ready" }),
            });
            toast({
                title: "Offline cache started",
                description: "This itinerary is now prepared for offline viewing.",
                variant: "success",
            });
        } catch {
            toast({
                title: "Offline cache failed",
                description: "Please retry with an active internet connection.",
                variant: "error",
            });
        } finally {
            setCaching(false);
        }
    };

    const commonProps = { itinerary, organizationName, client };
    const legacyProps = { itineraryData: itinerary, organizationName, client };

    const renderTemplate = () => {
        switch (templateId) {
            case "safari_story":
                return <SafariStoryView {...commonProps} />;
            case "urban_brief":
                return <UrbanBriefView {...commonProps} />;
            case "professional":
                return <ProfessionalView {...commonProps} />;
            case "luxury_resort":
                return <LuxuryResortView {...commonProps} />;
            case "visual_journey":
                return <VisualJourneyView {...commonProps} />;
            case "bento_journey":
                return <BentoJourneyView {...commonProps} />;
            case "modern":
                return <ItineraryTemplateModern {...legacyProps} />;
            case "classic":
            default:
                return <ItineraryTemplateClassic {...legacyProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="sticky top-0 z-40 bg-slate-900/95 text-slate-100 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between gap-3">
                <p className="text-xs md:text-sm">
                    Enable offline mode before travel to access this itinerary without internet.
                </p>
                <button
                    type="button"
                    onClick={() => void handleCacheForOffline()}
                    disabled={caching}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                    <DownloadCloud className="w-4 h-4" />
                    {caching ? "Preparing..." : "Save Offline"}
                </button>
            </div>
            <div className="flex-grow">
                {renderTemplate()}
            </div>

            {/* Inject dynamic pricing module at the bottom if configured */}
            {itinerary.pricing && (
                <div className="bg-gray-50 dark:bg-slate-950 py-12 border-t border-gray-200 dark:border-white/10">
                    <InteractivePricing pricing={itinerary.pricing} />
                </div>
            )}

            {/* Client Approval & Feedback Section */}
            <div className="bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-white/5">
                <ApprovalManager
                    token={token}
                    clientName={client?.name || ""}
                />
            </div>
        </div>
    );
}
