"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Wallet, Clock, ArrowLeft, Share2, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import ShareModal from "@/components/ShareModal";
import WeatherWidget from "@/components/WeatherWidget";
import CurrencyConverter from "@/components/CurrencyConverter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ItineraryResult, Day, Activity } from "@/types/itinerary";
import ClientAssignmentBlock from "@/components/ClientAssignmentBlock";

import { SafariStoryView, UrbanBriefView, ProfessionalView, LuxuryResortView, VisualJourneyView, BentoJourneyView, TemplateSwitcher, ItineraryTemplateId } from "@/components/itinerary-templates";
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
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowShareModal(true)}
                                title="Share"
                                className="bg-white/80 backdrop-blur-sm shadow-sm"
                            >
                                <Share2 className="w-4 h-4 text-gray-700" />
                            </Button>
                            <PDFDownloadButton itinerary={tripData} clientName={clientName} />
                        </div>
                    </div>


                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <Card className="lg:col-span-2 bg-white/50 backdrop-blur-sm border-gray-200 shadow-sm print:hidden">
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
                                    <p className="text-gray-700 leading-relaxed font-light mb-6">
                                        {itinerary.summary}
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <WeatherWidget destination={itinerary.destination} days={itinerary.duration_days || 1} />
                                        <CurrencyConverter destination={itinerary.destination} compact />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-slate-950 shadow-lg print:hidden">
                            <CardContent className="pt-6">
                                <TemplateSwitcher
                                    currentTemplate={selectedTemplate}
                                    onTemplateChange={setSelectedTemplate}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div id="itinerary-pdf-content" className="w-full mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {/* Template-Based Itinerary Display */}
                        {selectedTemplate === 'safari_story' && (
                            <SafariStoryView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'urban_brief' && (
                            <UrbanBriefView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'professional' && (
                            <ProfessionalView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'luxury_resort' && (
                            <LuxuryResortView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'visual_journey' && (
                            <VisualJourneyView itinerary={tripData} />
                        )}
                        {selectedTemplate === 'bento_journey' && (
                            <BentoJourneyView itinerary={tripData} />
                        )}
                        {selectedTemplate === ('classic' as any) && (
                            <ItineraryTemplateClassic itineraryData={tripData} organizationName="GoBuddy Adventures" />
                        )}
                        {selectedTemplate === ('modern' as any) && (
                            <ItineraryTemplateModern itineraryData={tripData} organizationName="GoBuddy Adventures" />
                        )}
                    </div>
                </div>
            </main>


            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                itineraryId={itinerary.id}
                tripTitle={itinerary.trip_title}
            />
        </>
    );
}
