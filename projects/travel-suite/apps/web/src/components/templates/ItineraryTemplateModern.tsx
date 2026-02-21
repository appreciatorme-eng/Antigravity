import type { ItineraryResult, Day, Activity } from "@/types/itinerary";
import { MapPin, Calendar, Clock, Plane, Compass } from "lucide-react";
import ClientItineraryMap from "@/components/map/ClientItineraryMap";
import { ItineraryTemplateProps } from "./types";

export default function ItineraryTemplateModern({ itineraryData, organizationName, client }: ItineraryTemplateProps) {
    return (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-900 flex flex-col">
            {/* Modern Hero Header */}
            <header className="relative bg-stone-900 text-white pb-12 pt-6">
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src={`https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80`}
                        alt={itineraryData.destination}
                        className="w-full h-full object-cover opacity-20"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
                </div>

                <div className="relative max-w-5xl mx-auto px-6 z-10">
                    <div className="flex items-center gap-2 mb-16 opacity-80">
                        <Compass className="w-6 h-6" />
                        <span className="text-xl font-light tracking-widest uppercase">{organizationName || "Travel Agency"}</span>
                    </div>

                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md text-stone-100 text-sm rounded-full mb-6 border border-white/20">
                            <MapPin className="w-4 h-4" />
                            <span className="tracking-wide uppercase text-xs font-semibold">{itineraryData.destination}</span>
                        </div>
                        {client && (
                            <div className="mb-4 animate-in fade-in slide-in-from-top duration-700">
                                <span className="text-stone-400 text-xs font-bold uppercase tracking-[0.3em] block mb-2">Tailored for</span>
                                <div className="text-2xl font-serif text-stone-100">{client.name}</div>
                                {(client.email || client.phone) && (
                                    <div className="text-[10px] mt-1 text-stone-500 font-medium tracking-widest uppercase">
                                        {client.email} {client.email && client.phone && "•"} {client.phone}
                                    </div>
                                )}
                            </div>
                        )}
                        <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
                            {itineraryData.trip_title}
                        </h1>
                        <p className="text-lg md:text-xl text-stone-300 font-light leading-relaxed mb-8">
                            {itineraryData.summary}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm font-medium tracking-wide uppercase text-stone-400">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-stone-100" />
                                {itineraryData.duration_days} Days
                            </span>
                            {itineraryData.budget && (
                                <span className="flex items-center gap-2">
                                    <span className="text-stone-100 font-bold">$</span>
                                    {itineraryData.budget}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto w-full px-6 py-12 flex-1 relative -top-8 z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-12">
                        {itineraryData.days && itineraryData.days.map((day: Day) => (
                            <section key={day.day_number} className="relative">
                                {/* Timeline Line */}
                                <div className="hidden md:block absolute top-10 bottom-0 left-[27px] w-px bg-stone-200" />

                                <div className="flex gap-6">
                                    {/* Day Number / Circle */}
                                    <div className="hidden md:flex flex-col items-center shrink-0">
                                        <div className="w-14 h-14 bg-white border-4 border-stone-100 rounded-full flex items-center justify-center shadow-sm z-10">
                                            <span className="font-serif text-xl font-bold text-stone-800">{day.day_number}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                                        <h2 className="text-2xl font-serif text-stone-800 mb-6">
                                            <span className="md:hidden font-bold mr-2 text-stone-400">Day {day.day_number}:</span>
                                            {day.theme}
                                        </h2>

                                        <div className="space-y-6">
                                            {day.activities.map((activity: Activity, idx: number) => (
                                                <div key={idx} className="group relative pl-4 border-l-2 border-transparent hover:border-stone-800 transition-colors">
                                                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-2">
                                                        <span className="text-sm font-semibold text-stone-400 w-20 shrink-0">
                                                            {activity.time}
                                                        </span>
                                                        <h4 className="font-bold text-lg text-stone-900">
                                                            {activity.title}
                                                        </h4>
                                                    </div>

                                                    <div className="md:pl-24">
                                                        {activity.image && (
                                                            <div className="w-full h-48 sm:h-56 rounded-xl border border-stone-100 overflow-hidden mb-4 shadow-sm">
                                                                <img
                                                                    src={activity.image}
                                                                    alt={activity.title}
                                                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                                                    loading="lazy"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                                                                        e.currentTarget.onerror = null;
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                        <p className="text-stone-600 leading-relaxed mb-3">
                                                            {activity.description}
                                                        </p>

                                                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                                                            {activity.location && (
                                                                <span className="bg-stone-100 text-stone-600 px-2.5 py-1 rounded">
                                                                    {activity.location}
                                                                </span>
                                                            )}
                                                            {activity.cost && activity.cost.toLowerCase() !== 'included' && (
                                                                <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded">
                                                                    {activity.cost}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* Sticky Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            {/* Map Card */}
                            {itineraryData.days && (
                                <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-100">
                                    <div className="h-64 rounded-xl overflow-hidden relative z-0">
                                        <ClientItineraryMap
                                            activities={itineraryData.days.flatMap((day: Day) => day.activities)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Interests Tags */}
                            {itineraryData.interests && itineraryData.interests.length > 0 && (
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                                    <h3 className="font-serif text-lg mb-4 text-stone-800">Trip Focus</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {itineraryData.interests.map((interest: string) => (
                                            <span
                                                key={interest}
                                                className="px-3 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-md"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tips Card */}
                            {itineraryData.tips && itineraryData.tips.length > 0 && (
                                <div className="bg-slate-900 text-stone-300 p-6 rounded-2xl shadow-sm">
                                    <h3 className="font-serif text-lg mb-4 text-white">Good to Know</h3>
                                    <ul className="space-y-3">
                                        {itineraryData.tips.map((tip: string, idx: number) => (
                                            <li key={idx} className="flex gap-3 text-sm leading-relaxed">
                                                <span className="text-slate-500">•</span>
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <footer className="mt-auto py-12 text-center border-t border-stone-200 bg-stone-100">
                <Compass className="w-8 h-8 mx-auto text-stone-300 mb-4" />
                <p className="text-sm text-stone-500 uppercase tracking-widest">
                    Crafted by {organizationName || "Travel Agency"}
                </p>
            </footer>
        </div>
    );
}
