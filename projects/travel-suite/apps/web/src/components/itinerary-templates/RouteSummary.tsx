"use client";

import { useMemo } from "react";
import {
    MapPin, Navigation, Clock, Car, Footprints, Ship,
    Utensils, Camera, Trees, Waves, ShoppingBag,
    Coffee, Sunset, Landmark,
} from "lucide-react";
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
    const minutes = Math.round((km / 30) * 60);
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Activity type detection ─────────────────────────────────────────────────
type ActivityType = "food" | "sightseeing" | "nature" | "culture" | "shopping" | "beach" | "transport" | "coffee" | "sunset" | "default";

function detectActivityType(title: string): ActivityType {
    const t = title.toLowerCase();
    if (/breakfast|lunch|dinner|meal|eat|dine|restaurant|food/.test(t)) return "food";
    if (/coffee|tea|cafe|chai/.test(t)) return "coffee";
    if (/sunset|sunrise/.test(t)) return "sunset";
    if (/beach|shore|coast|marine/.test(t)) return "beach";
    if (/temple|church|mosque|palace|fort|museum|heritage|monument|historical/.test(t)) return "culture";
    if (/trek|hike|mountain|hill|waterfall|park|garden|plantation|forest|wildlife|safari|backwater/.test(t)) return "nature";
    if (/market|shop|bazaar|mall/.test(t)) return "shopping";
    if (/drive|transfer|return|depart|arrive|airport|station|boat|ferry|cruise/.test(t)) return "transport";
    if (/view|point|dam|lake|river/.test(t)) return "sightseeing";
    return "default";
}

function renderActivityIcon(type: ActivityType) {
    const cls = "w-4 h-4 text-white";
    switch (type) {
        case "food": return <Utensils className={cls} />;
        case "coffee": return <Coffee className={cls} />;
        case "sunset": return <Sunset className={cls} />;
        case "beach": return <Waves className={cls} />;
        case "culture": return <Landmark className={cls} />;
        case "nature": return <Trees className={cls} />;
        case "shopping": return <ShoppingBag className={cls} />;
        case "transport": return <Car className={cls} />;
        case "sightseeing": return <Camera className={cls} />;
        default: return <MapPin className={cls} />;
    }
}

function getActivityColor(type: ActivityType): string {
    switch (type) {
        case "food": return "#f97316";
        case "coffee": return "#92400e";
        case "sunset": return "#f59e0b";
        case "beach": return "#06b6d4";
        case "culture": return "#8b5cf6";
        case "nature": return "#22c55e";
        case "shopping": return "#ec4899";
        case "transport": return "#64748b";
        case "sightseeing": return "#3b82f6";
        default: return "#6b7280";
    }
}

// ── Transport mode detection ────────────────────────────────────────────────
type TransportMode = "walk" | "drive" | "boat";

function detectTransportMode(km: number, title: string): TransportMode {
    const t = title.toLowerCase();
    if (/boat|ferry|cruise|houseboat|backwater/.test(t)) return "boat";
    if (km < 1) return "walk";
    return "drive";
}


// ── Types ───────────────────────────────────────────────────────────────────
interface Stop {
    number: number;
    title: string;
    location: string;
    time: string;
    coords: [number, number] | null;
    dayNumber: number;
    dayTheme: string;
    activityType: ActivityType;
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
                coords: hasCoords ? [act.coordinates!.lat, act.coordinates!.lng] : null,
                dayNumber: day.day_number ?? day.day ?? 0,
                dayTheme: day.theme || day.title || "",
                activityType: detectActivityType(act.title || act.name || ""),
            });
        }
    }
    return stops;
}

// ── Day gradient palettes ───────────────────────────────────────────────────
const DAY_PALETTES = [
    { from: "#0f766e", to: "#134e4a", bg: "from-teal-700 to-teal-900" },
    { from: "#1d4ed8", to: "#1e3a5f", bg: "from-blue-700 to-blue-900" },
    { from: "#7c3aed", to: "#4c1d95", bg: "from-violet-600 to-violet-900" },
    { from: "#c2410c", to: "#7c2d12", bg: "from-orange-700 to-orange-900" },
    { from: "#be185d", to: "#831843", bg: "from-pink-700 to-pink-900" },
    { from: "#15803d", to: "#14532d", bg: "from-green-700 to-green-900" },
    { from: "#b45309", to: "#78350f", bg: "from-amber-700 to-amber-900" },
];

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
        return stopsWithDistance.reduce((sum, s) => sum + (s.distFromPrev ?? 0), 0);
    }, [stopsWithDistance]);

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
        <div className="bg-[#FDFBF7] dark:bg-slate-950 border-t border-stone-200 dark:border-white/10">
            {/* Hero header */}
            <div className="relative overflow-hidden bg-stone-900 text-white py-16 md:py-20 px-6">
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
                />
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs font-semibold tracking-[0.2em] uppercase mb-6">
                        <Navigation className="w-4 h-4" />
                        Your Journey
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif mb-4">
                        Route Overview
                    </h2>
                    <p className="text-white/50 text-base md:text-lg font-light">
                        {itinerary.destination || "Your adventure"} &middot; {itinerary.days?.length ?? 0} days
                    </p>

                    {/* Stats ribbon */}
                    <div className="mt-10 flex flex-wrap justify-center gap-8 md:gap-16">
                        <div>
                            <p className="text-4xl md:text-5xl font-serif font-light">{stops.length}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-1">Stops</p>
                        </div>
                        <div className="w-px bg-white/10 hidden md:block" />
                        <div>
                            <p className="text-4xl md:text-5xl font-serif font-light">{formatDistance(totalDistance)}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-1">Distance</p>
                        </div>
                        <div className="w-px bg-white/10 hidden md:block" />
                        <div>
                            <p className="text-4xl md:text-5xl font-serif font-light">{itinerary.days?.length ?? 0}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-1">Days</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Day journey cards */}
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 space-y-16">
                {Array.from(dayGroups.entries()).map(([dayNum, dayStops], dayIdx) => {
                    const palette = DAY_PALETTES[dayIdx % DAY_PALETTES.length];
                    const dayDistance = dayStops.reduce((sum, s) => sum + (s.distFromPrev ?? 0), 0);
                    const theme = dayStops[0]?.dayTheme || "";

                    return (
                        <div key={dayNum} className="relative">
                            {/* Day header card */}
                            <div
                                className="rounded-2xl p-6 md:p-8 text-white mb-0 relative overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 opacity-10"
                                    style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
                                />
                                <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.25em] text-white/50 font-semibold mb-2">
                                            Day {dayNum}
                                        </p>
                                        <h3 className="text-2xl md:text-3xl font-serif">
                                            {theme || `Day ${dayNum}`}
                                        </h3>
                                    </div>
                                    <div className="flex gap-6 text-sm text-white/70">
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            {dayStops.length} stops
                                        </span>
                                        {dayDistance > 0 && (
                                            <span className="flex items-center gap-1.5">
                                                <Car className="w-4 h-4" />
                                                {formatDistance(dayDistance)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative ml-6 md:ml-10 mt-2">
                                {/* Vertical line */}
                                <div
                                    className="absolute left-4 top-0 bottom-0 w-px"
                                    style={{ background: `linear-gradient(to bottom, ${palette.from}40, ${palette.from}10)` }}
                                />

                                <div className="space-y-0">
                                    {dayStops.map((stop, idx) => {
                                        const color = getActivityColor(stop.activityType);
                                        const isLast = idx === dayStops.length - 1;

                                        return (
                                            <div key={stop.number}>
                                                {/* Transport connector */}
                                                {idx > 0 && stop.distFromPrev !== null && stop.distFromPrev > 0 && (
                                                    <TransportConnector
                                                        distance={stop.distFromPrev}
                                                        title={stop.title}
                                                        accentColor={palette.from}
                                                    />
                                                )}

                                                {/* Stop card */}
                                                <div className="relative flex items-start gap-4 py-4">
                                                    {/* Timeline node */}
                                                    <div className="relative z-10 flex-shrink-0">
                                                        <div
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                                                            style={{ backgroundColor: color, boxShadow: `0 4px 14px ${color}30` }}
                                                        >
                                                            {renderActivityIcon(stop.activityType)}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className={`flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-stone-100 dark:border-white/10 p-4 shadow-sm hover:shadow-md transition-shadow ${isLast ? "" : ""}`}>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}15`, color }}>
                                                                        #{stop.number}
                                                                    </span>
                                                                    <h4 className="font-semibold text-stone-900 dark:text-white text-sm leading-tight truncate">
                                                                        {stop.title}
                                                                    </h4>
                                                                </div>
                                                                {stop.location && (
                                                                    <p className="text-xs text-stone-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                                                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                                                        <span className="truncate">{stop.location}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {stop.time && (
                                                                <div className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-stone-50 dark:bg-slate-800 text-stone-500 dark:text-gray-400">
                                                                    <Clock className="w-3 h-3" />
                                                                    {stop.time}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Transport connector between stops ────────────────────────────────────────
function TransportConnector({
    distance,
    title,
    accentColor,
}: {
    distance: number;
    title: string;
    accentColor: string;
}) {
    const mode = detectTransportMode(distance, title);
    const modeLabel = mode === "walk" ? "Walk" : mode === "boat" ? "Boat" : "Drive";

    const iconElement = (() => {
        switch (mode) {
            case "walk": return <Footprints className="w-3 h-3" style={{ color: accentColor }} />;
            case "boat": return <Ship className="w-3 h-3" style={{ color: accentColor }} />;
            default: return <Car className="w-3 h-3" style={{ color: accentColor }} />;
        }
    })();

    return (
        <div className="relative flex items-center gap-4 py-2 pl-1">
            {/* Icon on the timeline */}
            <div className="relative z-10 flex-shrink-0 w-9 flex justify-center">
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center border-2"
                    style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}08` }}
                >
                    {iconElement}
                </div>
            </div>

            {/* Distance info */}
            <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-semibold" style={{ color: accentColor }}>
                    {formatDistance(distance)}
                </div>
                <span className="text-stone-300 dark:text-gray-600">&middot;</span>
                <span className="text-stone-400 dark:text-gray-500">
                    {estimateDriveTime(distance)} {modeLabel.toLowerCase()}
                </span>
                {/* Visual distance bar */}
                <div className="hidden md:block w-20 h-1 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${Math.min(100, (distance / 50) * 100)}%`,
                            backgroundColor: `${accentColor}50`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
