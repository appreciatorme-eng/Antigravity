"use client";

import { Compass, Sparkles, MapPin, CalendarDays } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";

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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Planner</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">Itinerary Planner</h1>
                    <p className="text-text-secondary mt-1">Mock planner workflow and AI output.</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <div className="lg:col-span-1">
                    <GlassCard padding="lg" rounded="2xl" className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-wide text-primary mb-2 block">Destination</label>
                            <GlassInput
                                icon={MapPin}
                                defaultValue="Kyoto, Japan"
                                placeholder="Enter destination"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-primary mb-2 block">Dates</label>
                            <GlassInput
                                icon={CalendarDays}
                                defaultValue="Mar 12 - Mar 17"
                                placeholder="Select dates"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-primary mb-2 block">Prompt</label>
                            <textarea
                                className="w-full rounded-xl border border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors text-secondary dark:text-white placeholder:text-text-secondary"
                                rows={4}
                                defaultValue="Luxury cultural immersion with slow mornings and guided temple visits."
                                placeholder="Describe your ideal trip..."
                            />
                        </div>
                        <GlassButton variant="primary" fullWidth>
                            <Sparkles className="w-4 h-4" />
                            Generate Itinerary
                        </GlassButton>
                    </GlassCard>
                </div>

                {/* Generated Plan */}
                <div className="lg:col-span-2">
                    <GlassCard padding="lg" rounded="2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-serif text-secondary dark:text-white">Generated Plan</h2>
                            <span className="text-xs text-text-secondary">Mock output</span>
                        </div>
                        <div className="space-y-4">
                            {mockItinerary.map((day) => (
                                <div
                                    key={day.day}
                                    className="rounded-xl border border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-sm p-5"
                                >
                                    <p className="text-sm font-semibold text-secondary dark:text-white mb-3">
                                        Day {day.day}: {day.title}
                                    </p>
                                    <ul className="space-y-2">
                                        {day.activities.map((activity) => (
                                            <li
                                                key={activity}
                                                className="text-sm text-text-secondary flex items-start gap-2"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                                {activity}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
