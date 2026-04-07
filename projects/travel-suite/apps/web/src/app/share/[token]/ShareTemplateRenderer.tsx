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
import { CheckCircle2, DownloadCloud, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ItineraryBrandedFooter, type OrganizationBranding } from "@/components/itinerary-templates/ItineraryBrandedFooter";
import { RouteSummary } from "@/components/itinerary-templates/RouteSummary";

interface ShareTemplateRendererProps {
    token: string;
    templateId: string;
    itinerary: ItineraryResult;
    organizationName: string;
    organizationBranding?: OrganizationBranding;
    client: { name: string; email?: string } | null;
}

export default function ShareTemplateRenderer({
    token,
    templateId,
    itinerary,
    organizationName,
    organizationBranding,
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

    // Merge organization branding into itinerary so templates render it natively in their hero
    const brandedItinerary: ItineraryResult = {
        ...itinerary,
        branding: {
            ...itinerary.branding,
            organizationName: organizationBranding?.name || organizationName,
            logoUrl: organizationBranding?.logoUrl ?? itinerary.branding?.logoUrl,
            primaryColor: organizationBranding?.primaryColor ?? itinerary.branding?.primaryColor,
        },
    };

    const commonProps = { itinerary: brandedItinerary, organizationName, organizationBranding, client };
    const legacyProps = { itineraryData: brandedItinerary, organizationName, client };
    const hasPackageScope =
        (Array.isArray(itinerary.inclusions) && itinerary.inclusions.length > 0) ||
        (Array.isArray(itinerary.exclusions) && itinerary.exclusions.length > 0);

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
            {/* Offline mode bar — minimal, non-intrusive */}
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

            {hasPackageScope && (
                <section className="border-t border-stone-200 bg-[#f7f4ee] px-6 py-14 text-stone-900">
                    <div className="mx-auto max-w-5xl">
                        <div className="mb-8 text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
                                Package Scope
                            </p>
                            <h2 className="mt-3 font-serif text-3xl text-stone-900">
                                What&apos;s Included, What&apos;s Not
                            </h2>
                            <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-600">
                                A clear view of what the shared package already covers and what should still be budgeted separately.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {itinerary.inclusions && itinerary.inclusions.length > 0 && (
                                <div className="rounded-[28px] border border-emerald-200 bg-white p-6 shadow-sm">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                                                Included
                                            </p>
                                            <h3 className="font-serif text-2xl text-stone-900">Covered In Your Package</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {itinerary.inclusions.map((item, index) => (
                                            <div
                                                key={`${item}-${index}`}
                                                className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-stone-700"
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {itinerary.exclusions && itinerary.exclusions.length > 0 && (
                                <div className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-sm">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                            <ShieldAlert className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                                                Excluded
                                            </p>
                                            <h3 className="font-serif text-2xl text-stone-900">To Arrange Separately</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {itinerary.exclusions.map((item, index) => (
                                            <div
                                                key={`${item}-${index}`}
                                                className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-stone-700"
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Route Summary — numbered stops with distances */}
            <RouteSummary itinerary={itinerary} />

            {/* Inject dynamic pricing module at the bottom if configured */}
            {(itinerary.pricing || itinerary.extracted_pricing) && (
                <div className="bg-gray-50 dark:bg-slate-950 py-12 border-t border-gray-200 dark:border-white/10">
                    <InteractivePricing pricing={itinerary.pricing ?? itinerary.extracted_pricing} />
                </div>
            )}

            {/* Client Approval & Feedback Section */}
            <div className="bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-white/5">
                <ApprovalManager
                    token={token}
                    clientName={client?.name || ""}
                />
            </div>

            {/* Organization Branding Footer & Disclaimer */}
            {organizationBranding && (
                <ItineraryBrandedFooter branding={organizationBranding} />
            )}
        </div>
    );
}
