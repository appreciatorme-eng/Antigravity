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
    () => import("@/components/itinerary-templates").then((mod) => mod.SafariStoryView),
    { loading: TemplateLoading }
);
const UrbanBriefView = dynamic(
    () => import("@/components/itinerary-templates").then((mod) => mod.UrbanBriefView),
    { loading: TemplateLoading }
);
const ProfessionalView = dynamic(
    () => import("@/components/itinerary-templates").then((mod) => mod.ProfessionalView),
    { loading: TemplateLoading }
);
const LuxuryResortView = dynamic(
    () => import("@/components/itinerary-templates").then((mod) => mod.LuxuryResortView),
    { loading: TemplateLoading }
);
const VisualJourneyView = dynamic(
    () => import("@/components/itinerary-templates").then((mod) => mod.VisualJourneyView),
    { loading: TemplateLoading }
);
const BentoJourneyView = dynamic(
    () => import("@/components/itinerary-templates").then((mod) => mod.BentoJourneyView),
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
            <main className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-emerald-50 via-white to-sky-50 pb-20">
                <div className="max-w-5xl mx-auto px-6 py-8">

                    {/* Top Navigation Bar */}
                    <div className="flex justify-between items-center mb-8">
                        <Link href="/trips">
                            <Button variant="ghost" className="gap-2 text-gray-600 hover:text-secondary pl-0 hover:bg-transparent">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Trips
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <ClientAssignmentBlock itineraryId={itinerary.id} initialClientId={itinerary.client_id} />
                            <Button
                                variant="outline"
                                onClick={() => setShowShareModal(true)}
                                className="bg-white/80 backdrop-blur-sm shadow-sm gap-2 text-gray-700 font-medium"
                            >
                                <Link2 className="w-4 h-4" />
                                Create Magic Link
                            </Button>
                            <PDFDownloadButton itinerary={tripData} clientName={clientName} showTemplateSelector={false} />
                        </div>
                    </div>

                    {/* Trip Info Card */}
                    <Card className="bg-white/50 backdrop-blur-sm border-gray-200 shadow-sm print:hidden mb-8">
                        <CardContent className="pt-6">
                            <div className="mb-6 text-center md:text-left">
                                <h1 className="text-4xl md:text-5xl font-serif text-secondary mb-4 tracking-tight leading-tight">
                                    {itinerary.trip_title}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-600 mb-6">
                                    <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full shadow-sm text-sm">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span className="font-medium">{itinerary.destination}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full shadow-sm text-sm">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span className="font-medium">{itinerary.duration_days || 0} days</span>
                                    </div>
                                    {itinerary.budget && (
                                        <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full shadow-sm text-sm">
                                            <Wallet className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{itinerary.budget}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-700 leading-relaxed font-light mb-6">{itinerary.summary}</p>
                                <div className="flex flex-wrap gap-4">
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
            </main>

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
