"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Wallet, Clock, ArrowLeft, Download, Share2, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import ShareModal from "@/components/ShareModal";
import WeatherWidget from "@/components/WeatherWidget";
import CurrencyConverter from "@/components/CurrencyConverter";

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
        duration_days: number;
        budget?: string;
        interests?: string[];
        summary?: string;
        raw_data: any;
    };
}

export default function TripDetailClient({ itinerary }: TripDetailClientProps) {
    const [showShareModal, setShowShareModal] = useState(false);

    const tripData = itinerary.raw_data as any;

    return (
        <>
            <main className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-emerald-50 via-white to-sky-50">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    {/* Top Navigation Bar */}
                    <div className="flex justify-between items-center mb-6">
                        <Link
                            href="/trips"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-secondary transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to Trips</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Share"
                            >
                                <Share2 className="w-5 h-5 text-gray-600" />
                            </button>
                            <PDFDownloadButton itinerary={tripData} />
                        </div>
                    </div>

                    {/* Trip Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-serif text-secondary mb-2">
                            {itinerary.trip_title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-gray-600">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-primary" />
                                {itinerary.destination}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {itinerary.duration_days} days
                            </span>
                            {itinerary.budget && (
                                <span className="flex items-center gap-1">
                                    <Wallet className="w-4 h-4" />
                                    {itinerary.budget}
                                </span>
                            )}
                        </div>
                        {itinerary.interests && itinerary.interests.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {itinerary.interests.map((interest: string) => (
                                    <span
                                        key={interest}
                                        className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        )}
                        {itinerary.summary && (
                            <p className="mt-4 text-gray-700">{itinerary.summary}</p>
                        )}
                    </div>

                    {/* Map */}
                    {tripData?.days && (
                        <div className="h-72 rounded-xl overflow-hidden shadow-md border border-gray-200 mb-6">
                            <ItineraryMap
                                activities={tripData.days.flatMap((day: any) => day.activities)}
                            />
                        </div>
                    )}

                    {/* Weather Widget */}
                    <div className="mb-8">
                        <WeatherWidget
                            destination={itinerary.destination}
                            days={itinerary.duration_days}
                        />
                    </div>

                    {/* Day by Day */}
                    {tripData?.days && (
                        <div className="space-y-6">
                            {tripData.days.map((day: any) => (
                                <div
                                    key={day.day_number}
                                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
                                >
                                    <h2 className="text-xl font-bold text-secondary mb-4">
                                        Day {day.day_number}: {day.theme}
                                    </h2>
                                    <div className="space-y-4">
                                        {day.activities.map((activity: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                                            >
                                                {activity.image && (
                                                    <img
                                                        src={activity.image}
                                                        alt={activity.title}
                                                        className="w-20 h-20 object-cover rounded-lg shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="font-medium text-gray-800">
                                                            {activity.title}
                                                        </h4>
                                                        <span className="text-sm text-gray-500 shrink-0 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {activity.time}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {activity.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {activity.location}
                                                        </span>
                                                        {activity.duration && (
                                                            <span>• {activity.duration}</span>
                                                        )}
                                                        {activity.cost && (
                                                            <span>• {activity.cost}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Currency Converter */}
                    <div className="mt-8">
                        <CurrencyConverter compact />
                    </div>

                    {/* Tips Section */}
                    {tripData?.tips && tripData.tips.length > 0 && (
                        <div className="mt-8 bg-amber-50 p-6 rounded-xl border border-amber-100">
                            <h3 className="font-bold text-amber-800 mb-3">Travel Tips</h3>
                            <ul className="space-y-2">
                                {tripData.tips.map((tip: string, idx: number) => (
                                    <li key={idx} className="flex gap-2 text-amber-700 text-sm">
                                        <span>•</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
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
