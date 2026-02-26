"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Wallet, ArrowLeft, Link2, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import ShareModal from "@/components/ShareModal";
import WeatherWidget from "@/components/WeatherWidget";
import CurrencyConverter from "@/components/CurrencyConverter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ItineraryResult } from "@/types/itinerary";
import ClientAssignmentBlock from "@/components/ClientAssignmentBlock";

const TemplateLoading = () => (
    <div className="py-16 text-center text-sm text-gray-500">Loading itinerary view…</div>
);

const SafariStoryView = dynamic(
    () => import("@/components/itinerary-templates/SafariStoryView"),
    { loading: TemplateLoading }
);
const UrbanBriefView = dynamic(
    () => import("@/components/itinerary-templates/UrbanBriefView").then((mod) => mod.UrbanBriefView),
    { loading: TemplateLoading }
);
const ProfessionalView = dynamic(
    () => import("@/components/itinerary-templates/ProfessionalView"),
    { loading: TemplateLoading }
);
const LuxuryResortView = dynamic(
    () => import("@/components/itinerary-templates/LuxuryResortView"),
    { loading: TemplateLoading }
);
const VisualJourneyView = dynamic(
    () => import("@/components/itinerary-templates/VisualJourneyView"),
    { loading: TemplateLoading }
);
const BentoJourneyView = dynamic(
    () => import("@/components/itinerary-templates/BentoJourneyView"),
    { loading: TemplateLoading }
);
const ItineraryTemplateClassic = dynamic(
    () => import("@/components/templates/ItineraryTemplateClassic"),
    { loading: TemplateLoading }
);
const ItineraryTemplateModern = dynamic(
    () => import("@/components/templates/ItineraryTemplateModern"),
    { loading: TemplateLoading }
);

const PDFDownloadButton = dynamic(
    () => import("@/components/pdf/PDFDownloadButton"),
    { ssr: false, loading: () => <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> }
);

interface TripDetailClientProps {
    itinerary: {
        id: string;
        trip_title: string;
        destination: string;
        duration_days: number | null;
        budget?: string | null;
        interests?: string[] | null;
        summary?: string | null;
        raw_data: ItineraryResult;
        client_id?: string | null;
        clients?: {
            profiles?: {
                full_name?: string | null;
                email?: string | null;
                phone?: string | null;
            } | null;
        } | null;
        template_id?: string | null;
    };
}

function ItineraryView({ templateId, tripData, client }: { templateId: string; tripData: ItineraryResult; client?: { name: string; email?: string; phone?: string } | null }) {
    switch (templateId) {
        case "urban_brief": return <UrbanBriefView itinerary={tripData} client={client} />;
        case "professional": return <ProfessionalView itinerary={tripData} client={client} />;
        case "luxury_resort": return <LuxuryResortView itinerary={tripData} client={client} />;
        case "visual_journey": return <VisualJourneyView itinerary={tripData} client={client} />;
        case "bento_journey": return <BentoJourneyView itinerary={tripData} client={client} />;
        case "classic": return <ItineraryTemplateClassic itineraryData={tripData} organizationName="GoBuddy Adventures" />;
        case "modern": return <ItineraryTemplateModern itineraryData={tripData} organizationName="GoBuddy Adventures" />;
        case "safari_story":
        default: return <SafariStoryView itinerary={tripData} client={client} />;
    }
}

export default function TripDetailClient({ itinerary }: TripDetailClientProps) {
    const [showShareModal, setShowShareModal] = useState(false);
    const tripData = itinerary.raw_data;
    const clientProfiles = itinerary.clients?.profiles;
    const clientData = clientProfiles ? {
        name: clientProfiles.full_name || "Valued Client",
        email: clientProfiles.email || undefined,
        phone: clientProfiles.phone || undefined,
    } : null;
    const clientName = clientData?.name || null;
    const templateId = itinerary.template_id || "safari_story";

    return (
        <>
            <div className="space-y-8 pb-20">
                {/* Top Navigation Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <Link href="/trips">
                        <Button variant="ghost" className="gap-2 text-slate-500 hover:text-primary pl-0 hover:bg-transparent transition-all">
                            <ArrowLeft className="w-4 h-4" />
                            BACK TO OPERATIONS
                        </Button>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                        <ClientAssignmentBlock itineraryId={itinerary.id} initialClientId={itinerary.client_id} />
                        <Button
                            variant="outline"
                            onClick={() => setShowShareModal(true)}
                            className="bg-white dark:bg-slate-900 shadow-sm gap-2 text-slate-700 dark:text-slate-300 font-bold border-slate-200 dark:border-white/10"
                        >
                            <Link2 className="w-4 h-4" />
                            CREATE MAGIC LINK
                        </Button>
                        <PDFDownloadButton itinerary={tripData} clientName={clientName} showTemplateSelector={false} />
                    </div>
                </div>

                {/* Trip Info Card */}
                <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/60 dark:border-white/10 shadow-xl overflow-hidden rounded-[24px]">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                            <div className="flex-1 space-y-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase border border-primary/20">
                                            Mission Profile
                                        </span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                                        {itinerary.trip_title}
                                    </h1>
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                        {itinerary.destination.toUpperCase()}
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                                        <Calendar className="w-4 h-4 text-sky-500" />
                                        {itinerary.duration_days || 0} DAYS
                                    </div>
                                    {itinerary.budget && (
                                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                                            <Wallet className="w-4 h-4 text-purple-500" />
                                            {itinerary.budget.toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {itinerary.summary && (
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-lg max-w-3xl">
                                        {itinerary.summary}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 justify-center">
                                <WeatherWidget destination={itinerary.destination} days={itinerary.duration_days || 1} />
                                <CurrencyConverter destination={itinerary.destination} compact />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Render itinerary in the template it was saved with */}
                <div id="itinerary-pdf-content" className="w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <ItineraryView templateId={templateId} tripData={tripData} client={clientData} />
                </div>
            </div>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                itineraryId={itinerary.id}
                tripTitle={itinerary.trip_title}
                templateId={templateId}
                client={clientData}
            />
        </>
    );
}
