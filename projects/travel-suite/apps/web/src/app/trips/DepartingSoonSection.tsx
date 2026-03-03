"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import type { EnrichedTrip } from "./types";
import {
    computeReadiness,
    formatDepartureCountdown,
    departureUrgencyColor,
    departureUrgencyBg,
    readinessDotColor,
} from "./utils";

interface DepartingSoonSectionProps {
    trips: readonly EnrichedTrip[];
}

export function DepartingSoonSection({ trips }: DepartingSoonSectionProps) {
    const departingSoon = useMemo(() => {
        return trips
            .filter((t) =>
                t.days_until_departure !== null &&
                t.days_until_departure >= 0 &&
                t.days_until_departure <= 7 &&
                ["confirmed", "pending"].includes(t.status || "")
            )
            .sort((a, b) => (a.days_until_departure ?? 99) - (b.days_until_departure ?? 99));
    }, [trips]);

    if (departingSoon.length === 0) return null;

    return (
        <GlassCard padding="none" className="border-amber-200 dark:border-amber-800/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-secondary dark:text-white">Departing Soon</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                        {departingSoon.length} trip{departingSoon.length !== 1 ? "s" : ""} within 7 days
                    </p>
                </div>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {departingSoon.map((trip) => {
                    const readiness = computeReadiness(trip);
                    const countdown = formatDepartureCountdown(trip.days_until_departure);
                    const urgencyColor = departureUrgencyColor(trip.days_until_departure);
                    const urgencyBg = departureUrgencyBg(trip.days_until_departure);

                    return (
                        <Link
                            key={trip.id}
                            href={`/trips/${trip.id}`}
                            className="flex items-center justify-between px-6 py-4 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors group"
                        >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-secondary dark:text-white truncate">
                                        {trip.itineraries?.trip_title || trip.destination || "Untitled Trip"}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted truncate">
                                        {trip.profiles?.full_name || "Guest"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                                <div className="flex items-center gap-1.5" title="Driver / Hotel / Payment">
                                    <span className={cn("w-2 h-2 rounded-full", readinessDotColor(readiness.driver))} />
                                    <span className={cn("w-2 h-2 rounded-full", readinessDotColor(readiness.accommodation))} />
                                    <span className={cn("w-2 h-2 rounded-full", readinessDotColor(readiness.payment))} />
                                </div>

                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg",
                                    urgencyColor, urgencyBg
                                )}>
                                    {countdown}
                                </span>

                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </GlassCard>
    );
}
