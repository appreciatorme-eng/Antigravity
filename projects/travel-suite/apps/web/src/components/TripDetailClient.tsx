"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Wallet, ArrowLeft, Link2, Loader2, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import ShareModal from "@/components/ShareModal";
import WeatherWidget from "@/components/WeatherWidget";
import CurrencyConverter from "@/components/CurrencyConverter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ItineraryResult } from "@/types/itinerary";
import ClientAssignmentBlock from "@/components/ClientAssignmentBlock";

import {
    SafariStoryView,
    UrbanBriefView,
    ProfessionalView,
    LuxuryResortView,
    VisualJourneyView,
    BentoJourneyView,
    ItineraryTemplateId,
} from "@/components/itinerary-templates";
import ItineraryTemplateClassic from "@/components/templates/ItineraryTemplateClassic";
import ItineraryTemplateModern from "@/components/templates/ItineraryTemplateModern";

const ItineraryMap = dynamic(() => import("@/components/map/ItineraryMap"), {
    ssr: false,
    loading: () => <div className="h-72 bg-gray-100 animate-pulse rounded-xl" />,
});

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
        clients?: any;
    };
}

const TEMPLATE_OPTIONS: { id: ItineraryTemplateId; label: string }[] = [
    { id: "safari_story", label: "Safari Story" },
    { id: "urban_brief", label: "Urban Brief" },
    { id: "professional", label: "Professional" },
    { id: "luxury_resort", label: "Luxury Resort" },
    { id: "visual_journey", label: "Visual Journey" },
    { id: "bento_journey", label: "Bento Grid" },
];

export default function TripDetailClient({ itinerary }: TripDetailClientProps) {
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ItineraryTemplateId>("safari_story");
    const tripData = itinerary.raw_data;
    const clientName = itinerary.clients?.profiles?.full_name || null;

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

                            {/* Template selector + share — kept together so intent is clear */}
                            <div className="flex items-center rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
                                {/* Small template dropdown */}
                                <div className="relative">
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value as ItineraryTemplateId)}
                                        className="appearance-none pl-3 pr-7 py-2 text-sm text-gray-700 font-medium bg-transparent border-r border-gray-200 cursor-pointer focus:outline-none"
                                    >
                                        {TEMPLATE_OPTIONS.map((t) => (
                                            <option key={t.id} value={t.id}>{t.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                </div>

                                {/* Create Magic Link */}
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Link2 className="w-4 h-4" />
                                    Create Magic Link
                                </button>
                            </div>

                            <PDFDownloadButton itinerary={tripData} clientName={clientName} showTemplateSelector={false} />
                        </div>
                    </div>

                    {/* Trip Info Card — full width now */}
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

                    {/* Template-Based Itinerary Display */}
                    <div id="itinerary-pdf-content" className="w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {selectedTemplate === "safari_story" && <SafariStoryView itinerary={tripData} />}
                        {selectedTemplate === "urban_brief" && <UrbanBriefView itinerary={tripData} />}
                        {selectedTemplate === "professional" && <ProfessionalView itinerary={tripData} />}
                        {selectedTemplate === "luxury_resort" && <LuxuryResortView itinerary={tripData} />}
                        {selectedTemplate === "visual_journey" && <VisualJourneyView itinerary={tripData} />}
                        {selectedTemplate === "bento_journey" && <BentoJourneyView itinerary={tripData} />}
                        {selectedTemplate === ("classic" as any) && <ItineraryTemplateClassic itineraryData={tripData} organizationName="GoBuddy Adventures" />}
                        {selectedTemplate === ("modern" as any) && <ItineraryTemplateModern itineraryData={tripData} organizationName="GoBuddy Adventures" />}
                    </div>
                </div>
            </main>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                itineraryId={itinerary.id}
                tripTitle={itinerary.trip_title}
                templateId={selectedTemplate}
            />
        </>
    );
}
