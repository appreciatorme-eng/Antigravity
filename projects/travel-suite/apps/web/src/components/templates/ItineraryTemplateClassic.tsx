import type { ItineraryResult, Day, Activity } from "@/types/itinerary";
import { MapPin, Calendar, Wallet, Clock, Plane } from "lucide-react";
import ClientItineraryMap from "@/components/map/ClientItineraryMap";
import { ItineraryTemplateProps } from "./types";
import Link from "next/link";

export default function ItineraryTemplateClassic({ itineraryData, organizationName, client }: ItineraryTemplateProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex flex-col">
            {/* Shared Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <Plane className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-serif text-secondary">{organizationName || "Travel Adventures"}</span>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto w-full px-6 py-8 flex-1">
                {/* Trip Header */}
                <div className="mb-8">
                    {client && (
                        <div className="mb-4 text-emerald-700 font-medium">
                            <span className="text-sm uppercase tracking-wider opacity-60 block mb-1">Prepared for</span>
                            <div className="text-2xl font-serif">{client.name}</div>
                            {(client.email || client.phone) && (
                                <div className="text-xs mt-1 text-gray-500 font-normal">
                                    {client.email} {client.email && client.phone && "•"} {client.phone}
                                </div>
                            )}
                        </div>
                    )}
                    <h1 className="text-3xl md:text-4xl font-serif text-secondary mb-3">
                        {itineraryData.trip_title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-gray-600">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-primary" />
                            {itineraryData.destination}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {itineraryData.duration_days} days
                        </span>
                        {itineraryData.budget && (
                            <span className="flex items-center gap-1">
                                <Wallet className="w-4 h-4" />
                                {itineraryData.budget}
                            </span>
                        )}
                    </div>
                    {itineraryData.interests && itineraryData.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {itineraryData.interests.map((interest: string) => (
                                <span
                                    key={interest}
                                    className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                                >
                                    {interest}
                                </span>
                            ))}
                        </div>
                    )}
                    <p className="mt-4 text-gray-700">{itineraryData.summary}</p>
                </div>

                {/* Map */}
                {itineraryData.days && (
                    <div className="h-72 rounded-xl overflow-hidden shadow-md border border-gray-200 mb-8 z-0 relative">
                        <ClientItineraryMap
                            activities={itineraryData.days.flatMap((day: Day) => day.activities)}
                        />
                    </div>
                )}

                {/* Day by Day */}
                {itineraryData.days && (
                    <div className="space-y-6">
                        {itineraryData.days.map((day: Day) => (
                            <div
                                key={day.day_number}
                                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
                            >
                                <h2 className="text-xl font-bold text-secondary mb-4">
                                    Day {day.day_number}: {day.theme}
                                </h2>
                                <div className="space-y-4">
                                    {day.activities.map((activity: Activity, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg"
                                        >
                                            <div className="shrink-0 w-16 text-sm text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {activity.time}
                                            </div>
                                            {activity.image && (
                                                <div className="w-full sm:w-32 h-32 sm:h-24 rounded-lg overflow-hidden shrink-0 shadow-sm">
                                                    <img
                                                        src={activity.image}
                                                        alt={activity.title}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                                                            e.currentTarget.onerror = null;
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-800">
                                                    {activity.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {activity.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                                                    <span>{activity.location}</span>
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

                {/* Tips Section */}
                {itineraryData.tips && itineraryData.tips.length > 0 && (
                    <div className="mt-8 bg-amber-50 p-6 rounded-xl border border-amber-100">
                        <h3 className="font-bold text-amber-800 mb-3">Travel Tips</h3>
                        <ul className="space-y-2">
                            {itineraryData.tips.map((tip: string, idx: number) => (
                                <li key={idx} className="flex gap-2 text-amber-700 text-sm">
                                    <span>•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="mt-auto py-6 text-center text-sm text-gray-500 border-t border-gray-100 bg-white">
                <p>Created with ❤️ by {organizationName || "Travel Adventures"}</p>
            </footer>
        </div>
    );
}
