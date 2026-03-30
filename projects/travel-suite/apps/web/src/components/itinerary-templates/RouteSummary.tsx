"use client";

import { useMemo } from "react";
import { MapPin, Navigation, Clock, ArrowDown } from "lucide-react";
import type { ItineraryResult } from "@/types/itinerary";

// ── Haversine distance (km) ──────────────────────────────────────────────────
function haversineKm(a: [number, number], b: [number, number]): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

function estimateDriveTime(km: number): string {
    // Rough estimate: 30 km/h city average (accounting for traffic in Indian cities)
    const minutes = Math.round((km / 30) * 60);
    if (minutes < 60) return `~${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

interface Stop {
    number: number;
    title: string;
    location: string;
    time: string;
    coords: [number, number] | null;
    dayNumber: number;
    dayTheme: string;
}

function extractStops(itinerary: ItineraryResult): Stop[] {
    const stops: Stop[] = [];
    let counter = 1;
    for (const day of itinerary.days ?? []) {
        for (const act of day.activities ?? []) {
            const hasCoords =
                act.coordinates &&
                typeof act.coordinates.lat === "number" &&
                typeof act.coordinates.lng === "number" &&
                act.coordinates.lat !== 0 &&
                act.coordinates.lng !== 0;
            stops.push({
                number: counter++,
                title: act.title || act.name || "Activity",
                location: act.location || "",
                time: act.time || "",
                coords: hasCoords
                    ? [act.coordinates!.lat, act.coordinates!.lng]
                    : null,
                dayNumber: day.day_number ?? day.day ?? 0,
                dayTheme: day.theme || day.title || "",
            });
        }
    }
    return stops;
}

interface RouteSummaryProps {
    itinerary: ItineraryResult;
}

export function RouteSummary({ itinerary }: RouteSummaryProps) {
    const stops = useMemo(() => extractStops(itinerary), [itinerary]);

    const stopsWithDistance = useMemo(() => {
        return stops.map((stop, idx) => {
            if (idx === 0 || !stop.coords) return { ...stop, distFromPrev: null };
            const prevWithCoords = stops
                .slice(0, idx)
                .reverse()
                .find((s) => s.coords !== null);
            if (!prevWithCoords?.coords) return { ...stop, distFromPrev: null };
            const km = haversineKm(prevWithCoords.coords, stop.coords);
            return { ...stop, distFromPrev: km };
        });
    }, [stops]);

    const totalDistance = useMemo(() => {
        return stopsWithDistance.reduce(
            (sum, s) => sum + (s.distFromPrev ?? 0),
            0
        );
    }, [stopsWithDistance]);

    // Group by day
    const dayGroups = useMemo(() => {
        const groups: Map<number, typeof stopsWithDistance> = new Map();
        for (const stop of stopsWithDistance) {
            const existing = groups.get(stop.dayNumber) ?? [];
            groups.set(stop.dayNumber, [...existing, stop]);
        }
        return groups;
    }, [stopsWithDistance]);

    if (stops.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-white/10 py-12 px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-4">
                        <Navigation className="w-3.5 h-3.5" />
                        ROUTE PLANNER
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        Day-by-Day Route Summary
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        {stops.length} stops &middot; {formatDistance(totalDistance)} total estimated distance
                    </p>
                </div>

                {/* Day groups */}
                <div className="space-y-8">
                    {Array.from(dayGroups.entries()).map(([dayNum, dayStops]) => {
                        const dayDistance = dayStops.reduce(
                            (sum, s) => sum + (s.distFromPrev ?? 0),
                            0
                        );
                        const theme = dayStops[0]?.dayTheme || "";

                        return (
                            <div key={dayNum} className="rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                                {/* Day header */}
                                <div className="bg-gray-50 dark:bg-slate-900 px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white text-sm">
                                            Day {dayNum}
                                        </span>
                                        {theme && (
                                            <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">
                                                &mdash; {theme}
                                            </span>
                                        )}
                                    </div>
                                    {dayDistance > 0 && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                            {formatDistance(dayDistance)} total
                                        </span>
                                    )}
                                </div>

                                {/* Stops list */}
                                <div className="divide-y divide-gray-50 dark:divide-white/5">
                                    {dayStops.map((stop, idx) => (
                                        <div key={stop.number}>
                                            {/* Distance connector */}
                                            {idx > 0 && stop.distFromPrev !== null && stop.distFromPrev > 0 && (
                                                <div className="flex items-center gap-3 px-5 py-1.5 bg-emerald-50/50 dark:bg-emerald-900/10">
                                                    <div className="w-8 flex justify-center">
                                                        <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
                                                    </div>
                                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {formatDistance(stop.distFromPrev)}
                                                        <span className="text-emerald-400 dark:text-emerald-600 ml-1.5">
                                                            ({estimateDriveTime(stop.distFromPrev)} drive)
                                                        </span>
                                                    </span>
                                                </div>
                                            )}

                                            {/* Stop row */}
                                            <div className="flex items-start gap-3 px-5 py-3.5">
                                                {/* Number badge */}
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold flex items-center justify-center border-2 border-emerald-500">
                                                    {stop.number}
                                                </div>

                                                {/* Stop details */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                                                        {stop.title}
                                                    </p>
                                                    {stop.location && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{stop.location}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Time */}
                                                {stop.time && (
                                                    <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        {stop.time}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary footer */}
                {totalDistance > 0 && (
                    <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-center gap-6 text-sm">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stops.length}
                            </p>
                            <p className="text-xs text-gray-400">Stops</p>
                        </div>
                        <div className="w-px h-10 bg-gray-200 dark:bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatDistance(totalDistance)}
                            </p>
                            <p className="text-xs text-gray-400">Total Distance</p>
                        </div>
                        <div className="w-px h-10 bg-gray-200 dark:bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {itinerary.days?.length ?? 0}
                            </p>
                            <p className="text-xs text-gray-400">Days</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
