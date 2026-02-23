"use client";

import { Compass, Sparkles, MapPin, CalendarDays } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";

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
                    <p className="text-text-secondary mt-1">Build itinerary drafts and refine plans for each trip.</p>
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
                            <span className="text-xs text-text-secondary">Live workspace data</span>
                        </div>
                        <div className="space-y-4">
                            <div className="rounded-xl border border-dashed border-white/30 bg-white/30 dark:bg-white/5 p-8 text-center">
                                <p className="text-sm font-medium text-secondary dark:text-white">No generated plan yet</p>
                                <p className="mt-1 text-xs text-text-secondary">
                                    Use the planner form to generate itinerary content from your configured AI provider.
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
