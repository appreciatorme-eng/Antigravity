"use client";

import { useMemo, useState } from "react";
import {
    MapPin, Clock, Car, Footprints,
    Utensils, Camera, Trees, Waves, ShoppingBag,
    Coffee, Sunset, Landmark, ChevronDown, Route,
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

function formatDist(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
}

function estimateTime(km: number): string {
    const m = Math.round((km / 30) * 60);
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h${r}m` : `${h}h`;
}

// ── Activity type detection ─────────────────────────────────────────────────
type ActivityType = "food" | "sightseeing" | "nature" | "culture" | "shopping" | "beach" | "transport" | "coffee" | "sunset" | "default";

function detectType(title: string): ActivityType {
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

function renderIcon(type: ActivityType, cls = "w-3.5 h-3.5") {
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

function typeColor(type: ActivityType): string {
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

function typeLabel(type: ActivityType): string {
    switch (type) {
        case "food": return "Dining";
        case "coffee": return "Café";
        case "sunset": return "Scenic";
        case "beach": return "Beach";
        case "culture": return "Culture";
        case "nature": return "Nature";
        case "shopping": return "Shopping";
        case "transport": return "Transfer";
        case "sightseeing": return "Sightseeing";
        default: return "Activity";
    }
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
    type: ActivityType;
    distFromPrev: number | null;
}

function buildStops(itinerary: ItineraryResult): Stop[] {
    const raw: Omit<Stop, "distFromPrev">[] = [];
    let counter = 1;
    for (const day of itinerary.days ?? []) {
        for (const act of day.activities ?? []) {
            const ok = act.coordinates &&
                typeof act.coordinates.lat === "number" &&
                typeof act.coordinates.lng === "number" &&
                act.coordinates.lat !== 0 && act.coordinates.lng !== 0;
            raw.push({
                number: counter++,
                title: act.title || act.name || "Activity",
                location: act.location || "",
                time: act.time || "",
                coords: ok ? [act.coordinates!.lat, act.coordinates!.lng] : null,
                dayNumber: day.day_number ?? day.day ?? 0,
                dayTheme: day.theme || day.title || "",
                type: detectType(act.title || act.name || ""),
            });
        }
    }
    return raw.map((s, i) => {
        if (i === 0 || !s.coords) return { ...s, distFromPrev: null };
        const prev = raw.slice(0, i).reverse().find((p) => p.coords !== null);
        if (!prev?.coords) return { ...s, distFromPrev: null };
        return { ...s, distFromPrev: haversineKm(prev.coords, s.coords) };
    });
}

// ── Day palettes ────────────────────────────────────────────────────────────
const PALETTES = [
    { from: "#0f766e", to: "#134e4a" },
    { from: "#1d4ed8", to: "#1e3a5f" },
    { from: "#7c3aed", to: "#4c1d95" },
    { from: "#c2410c", to: "#7c2d12" },
    { from: "#be185d", to: "#831843" },
    { from: "#15803d", to: "#14532d" },
    { from: "#b45309", to: "#78350f" },
];

interface DayData {
    dayNum: number;
    theme: string;
    stops: Stop[];
    totalKm: number;
    palette: { from: string; to: string };
}

// ── Component ───────────────────────────────────────────────────────────────
interface RouteSummaryProps {
    itinerary: ItineraryResult;
}

export function RouteSummary({ itinerary }: RouteSummaryProps) {
    const stops = useMemo(() => buildStops(itinerary), [itinerary]);
    const totalKm = useMemo(() => stops.reduce((s, x) => s + (x.distFromPrev ?? 0), 0), [stops]);

    const days: DayData[] = useMemo(() => {
        const map = new Map<number, Stop[]>();
        for (const s of stops) {
            const arr = map.get(s.dayNumber) ?? [];
            map.set(s.dayNumber, [...arr, s]);
        }
        return Array.from(map.entries()).map(([dayNum, dayStops], i) => ({
            dayNum,
            theme: dayStops[0]?.dayTheme || "",
            stops: dayStops,
            totalKm: dayStops.reduce((sum, s) => sum + (s.distFromPrev ?? 0), 0),
            palette: PALETTES[i % PALETTES.length],
        }));
    }, [stops]);

    const [openDay, setOpenDay] = useState<number | null>(null);

    if (stops.length === 0) return null;

    const toggleDay = (dayNum: number) => {
        setOpenDay((prev) => (prev === dayNum ? null : dayNum));
    };

    // Estimate total drive time
    const totalDriveMin = Math.round((totalKm / 30) * 60);
    const driveH = Math.floor(totalDriveMin / 60);
    const driveM = totalDriveMin % 60;
    const driveTimeStr = driveH > 0 ? (driveM > 0 ? `${driveH}h ${driveM}m` : `${driveH}h`) : `${driveM}m`;

    return (
        <div className="bg-[#FDFBF7] dark:bg-slate-950 border-t border-stone-200 dark:border-white/10">
            {/* Visual header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white px-6 py-14 md:py-20">
                {/* Decorative background elements */}
                <div className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
                />
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.04] bg-white blur-3xl" />
                <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full opacity-[0.03] bg-emerald-400 blur-3xl" />

                {/* Decorative route line SVG */}
                <svg className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 opacity-[0.06] h-40 md:h-56" viewBox="0 0 80 200" fill="none">
                    <path d="M40 0 C40 40, 10 50, 10 80 C10 110, 70 120, 70 150 C70 180, 40 190, 40 200" stroke="white" strokeWidth="2" strokeDasharray="6 4" />
                    <circle cx="40" cy="0" r="4" fill="white" />
                    <circle cx="10" cy="80" r="4" fill="white" />
                    <circle cx="70" cy="150" r="4" fill="white" />
                    <circle cx="40" cy="200" r="4" fill="white" />
                </svg>

                <div className="relative z-10 max-w-5xl mx-auto">
                    {/* Label */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] backdrop-blur-sm text-white/60 text-[11px] font-semibold tracking-[0.25em] uppercase mb-6 border border-white/[0.06]">
                        <Route className="w-3.5 h-3.5" />
                        Route Overview
                    </div>

                    {/* Destination */}
                    <h2 className="text-3xl md:text-5xl font-serif font-light mb-2 tracking-tight">
                        {itinerary.destination || "Your Journey"}
                    </h2>
                    <p className="text-white/30 text-sm mb-10">
                        {days.length}-day journey &middot; {stops.length} destinations
                    </p>

                    {/* Stat cards */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-md">
                        <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.06] text-center">
                            <p className="text-3xl md:text-4xl font-serif font-light">{stops.length}</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1">Stops</p>
                        </div>
                        <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.06] text-center">
                            <p className="text-3xl md:text-4xl font-serif font-light">{formatDist(totalKm)}</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1">Distance</p>
                        </div>
                        <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.06] text-center">
                            <p className="text-3xl md:text-4xl font-serif font-light">{driveTimeStr}</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1">Drive Time</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accordion day cards */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-3">
                {days.map((day) => {
                    const isOpen = openDay === day.dayNum;
                    // Count activity types for the summary chips
                    const typeCounts = new Map<ActivityType, number>();
                    for (const s of day.stops) {
                        typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + 1);
                    }

                    return (
                        <div
                            key={day.dayNum}
                            className="rounded-2xl overflow-hidden border border-stone-100 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm"
                        >
                            {/* Day header — always visible, tap to expand */}
                            <button
                                type="button"
                                onClick={() => toggleDay(day.dayNum)}
                                className="w-full text-left px-5 md:px-6 py-4 md:py-5 flex items-center gap-4 hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                {/* Day number circle */}
                                <div
                                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                    style={{ background: `linear-gradient(135deg, ${day.palette.from}, ${day.palette.to})` }}
                                >
                                    {day.dayNum}
                                </div>

                                {/* Day info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <h3 className="font-semibold text-stone-900 dark:text-white text-sm md:text-base truncate">
                                            {day.theme || `Day ${day.dayNum}`}
                                        </h3>
                                    </div>
                                    {/* Activity type chips — compact summary */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.from(typeCounts.entries()).map(([type, count]) => (
                                            <span
                                                key={type}
                                                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                                style={{ backgroundColor: `${typeColor(type)}12`, color: typeColor(type) }}
                                            >
                                                {renderIcon(type, "w-2.5 h-2.5")}
                                                {count > 1 ? `${count} ${typeLabel(type)}` : typeLabel(type)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats + chevron */}
                                <div className="flex-shrink-0 flex items-center gap-3">
                                    <div className="hidden md:flex items-center gap-4 text-xs text-stone-400 dark:text-gray-500">
                                        <span>{day.stops.length} stops</span>
                                        {day.totalKm > 0 && (
                                            <span>{formatDist(day.totalKm)}</span>
                                        )}
                                    </div>
                                    <ChevronDown
                                        className={`w-5 h-5 text-stone-300 dark:text-gray-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                                    />
                                </div>
                            </button>

                            {/* Expanded stops */}
                            <div
                                className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                            >
                                <div className="overflow-hidden">
                                    <div className="border-t border-stone-100 dark:border-white/5 px-5 md:px-6 py-4">
                                        {/* Mobile stats */}
                                        <div className="flex md:hidden items-center gap-4 text-xs text-stone-400 mb-4 pb-3 border-b border-stone-50 dark:border-white/5">
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{day.stops.length} stops</span>
                                            {day.totalKm > 0 && (
                                                <span className="flex items-center gap-1"><Car className="w-3 h-3" />{formatDist(day.totalKm)}</span>
                                            )}
                                        </div>

                                        {/* Stops timeline */}
                                        <div className="relative">
                                            {/* Vertical line */}
                                            <div
                                                className="absolute left-[17px] top-2 bottom-2 w-px"
                                                style={{ background: `linear-gradient(to bottom, ${day.palette.from}30, transparent)` }}
                                            />

                                            <div className="space-y-0">
                                                {day.stops.map((stop, idx) => {
                                                    const color = typeColor(stop.type);
                                                    const showTransport = idx > 0 && stop.distFromPrev !== null && stop.distFromPrev > 0;

                                                    return (
                                                        <div key={stop.number}>
                                                            {/* Transport connector */}
                                                            {showTransport && (
                                                                <div className="flex items-center gap-3 py-1 ml-1">
                                                                    <div className="w-[26px] flex justify-center">
                                                                        {stop.distFromPrev! < 1
                                                                            ? <Footprints className="w-3 h-3 text-stone-300" />
                                                                            : <Car className="w-3 h-3 text-stone-300" />}
                                                                    </div>
                                                                    <span className="text-[11px] text-stone-400 font-medium">
                                                                        {formatDist(stop.distFromPrev!)} · {estimateTime(stop.distFromPrev!)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Stop row */}
                                                            <div className="flex items-center gap-3 py-2">
                                                                {/* Icon dot */}
                                                                <div
                                                                    className="relative z-10 flex-shrink-0 w-[34px] h-[34px] rounded-lg flex items-center justify-center"
                                                                    style={{ backgroundColor: `${color}15` }}
                                                                >
                                                                    {renderIcon(stop.type, "w-4 h-4")}
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-medium text-stone-800 dark:text-white truncate">
                                                                            {stop.title}
                                                                        </p>
                                                                        {stop.location && (
                                                                            <p className="text-[11px] text-stone-400 truncate">
                                                                                {stop.location}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {stop.time && (
                                                                        <span className="flex-shrink-0 text-[11px] font-medium text-stone-400 flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {stop.time}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Expand all / collapse all */}
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={() => setOpenDay(openDay === null ? days[0]?.dayNum ?? null : null)}
                        className="text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium px-4 py-2"
                    >
                        {openDay !== null ? "Collapse" : "Expand a day to see stops"}
                    </button>
                </div>
            </div>
        </div>
    );
}
