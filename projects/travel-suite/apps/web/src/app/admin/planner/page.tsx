"use client";

import { Compass, Sparkles, MapPin, CalendarDays } from "lucide-react";

const mockItinerary = [
    {
        day: 1,
        title: "Arrival & Gion Walk",
        activities: ["Check-in at boutique ryokan", "Evening stroll in Gion", "Kaiseki dinner"],
    },
    {
        day: 2,
        title: "Arashiyama Highlights",
        activities: ["Bamboo grove sunrise", "Tenryu-ji temple", "River cruise"],
    },
    {
        day: 3,
        title: "Fushimi Inari",
        activities: ["Torii gate hike", "Sake tasting", "Tea ceremony"],
    },
];

export default function PlannerPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Itinerary Planner</h1>
                    <p className="text-sm text-gray-500">Mock planner workflow and AI output.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                    <div>
                        <label className="text-xs uppercase text-gray-400">Destination</label>
                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <input className="flex-1 text-sm outline-none" defaultValue="Kyoto, Japan" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-400">Dates</label>
                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                            <CalendarDays className="w-4 h-4 text-gray-400" />
                            <input className="flex-1 text-sm outline-none" defaultValue="Mar 12 - Mar 17" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-400">Prompt</label>
                        <textarea
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                            rows={4}
                            defaultValue="Luxury cultural immersion with slow mornings and guided temple visits."
                        />
                    </div>
                    <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Generate Itinerary
                    </button>
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Generated Plan</h2>
                        <span className="text-xs text-gray-400">Mock output</span>
                    </div>
                    <div className="space-y-4">
                        {mockItinerary.map((day) => (
                            <div key={day.day} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-900">Day {day.day}: {day.title}</p>
                                <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                                    {day.activities.map((activity) => (
                                        <li key={activity}>{activity}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
