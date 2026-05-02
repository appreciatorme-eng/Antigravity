"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Lazy imports for Leaflet (SSR-safe via dynamic import in page.tsx)
import L from "leaflet";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
} from "react-leaflet";

// Leaflet type augmentation: _getIconUrl is a runtime property not in @types/leaflet
interface LeafletIconDefaultPrototype extends L.Icon.Default {
    _getIconUrl?: () => string;
}

// Fix Leaflet's default icon paths in Next.js / Webpack
if (typeof window !== "undefined") {
    delete (L.Icon.Default.prototype as LeafletIconDefaultPrototype)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
}

interface Coordinate {
    lat: number;
    lng: number;
}

interface DriverLocationSnapshot {
    latitude: number;
    longitude: number;
    recorded_at: string;
    speed?: number | null;
    heading?: number | null;
    accuracy?: number | null;
}

interface Activity {
    title: string;
    location?: string;
    start_time?: string;
    end_time?: string;
    coordinates?: Coordinate;
}

interface Day {
    day_number: number;
    activities: Activity[];
}

interface Accommodation {
    day_number: number;
    hotel_name: string;
    address?: string;
    check_in_time?: string;
    room_type?: string;
    is_fallback?: boolean;
    coordinates?: Coordinate;
}

interface ItineraryMapProps {
    activities?: Activity[];
    days?: Day[];
    accommodations?: Accommodation[];
    activeDay?: number;
    destination?: string;
    driverLocation?: DriverLocationSnapshot | null;
    className?: string;
}

type ResolvedStop = {
    key: string;
    label: string;
    title: string;
    start_time?: string;
    resolvedCoordinates?: Coordinate;
};

type ResolvedHotel = {
    key: string;
    day_number: number;
    hotel_name: string;
    address?: string;
    check_in_time?: string;
    room_type?: string;
    resolvedCoordinates: Coordinate;
};

// ── Haversine distance ───────────────────────────────────────────────────────
function haversineKm(a: [number, number], b: [number, number]) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function totalDistanceKm(route: [number, number][]) {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
        const a = route[i];
        const b = route[i + 1];
        if (a && b) total += haversineKm(a, b);
    }
    return total;
}

// ── Driver icon ──────────────────────────────────────────────────────────────
function makeDriverIcon(heading: number = 0) {
    return L.divIcon({
        className: "",
        html: `
            <div style="
                width:40px; height:40px; border-radius:12px;
                background:#10b981; border:3px solid white;
                display:flex; align-items:center; justify-content:center;
                color:white;
                box-shadow:0 8px 20px rgba(16,185,129,0.3);
                transform: rotate(${heading}deg);
                transition: transform 0.5s ease;
            ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.5 3.5c-2.5 0-5 2.5-5 5V12h5V8.5c0-2.5-2.5-5-5-5Z"/><path d="M10 10V5a2 2 0 0 1 4 0v5"/><path d="M19 17V11a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
                </svg>
            </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });
}

function makeNumberedIcon(n: number) {
    return L.divIcon({
        className: "",
        html: `
            <div style="
                width:32px; height:32px; border-radius:10px;
                background:#0a1628; border:2px solid #10b981;
                display:flex; align-items:center; justify-content:center;
                color:#f1f5f9; font-weight:900; font-size:12px;
                box-shadow:0 6px 16px rgba(0,0,0,0.3);
                font-family:inherit;
            ">${n}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
}

function makeHotelIcon() {
    return L.divIcon({
        className: "",
        html: `
            <div style="
                width:32px; height:32px; border-radius:50%;
                background:#7c3aed; border:2px solid #ffffff;
                display:flex; align-items:center; justify-content:center;
                color:#ffffff;
                box-shadow:0 6px 16px rgba(124,58,237,0.45);
            ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2 20v-9a2 2 0 0 1 2-2h6"/>
                    <path d="M22 20V8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v12"/>
                    <path d="M2 20h20"/>
                    <path d="M14 12h4"/>
                    <path d="M14 16h4"/>
                </svg>
            </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });
}

// ── Fallback city coordinates ─────────────────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
    thailand: [15.87, 100.9925],
    bangkok: [13.7563, 100.5018],
    phuket: [7.8804, 98.3923],
    "phuket airport": [8.1132, 98.3169],
    krabi: [8.0863, 98.9063],
    "krabi airport": [8.0991, 98.9862],
    "phi phi": [7.7407, 98.7784],
    "phi phi island": [7.7407, 98.7784],
    "maya bay": [7.6789, 98.7667],
    "james bond island": [8.2746, 98.5012],
    "khao phing kan": [8.2748, 98.5015],
    "phang nga": [8.4509, 98.5255],
    "phang nga bay": [8.2944, 98.5057],
    "khai island": [7.9348, 98.466],
    "khai islands": [7.9348, 98.466],
    "samet nangshe": [8.2456, 98.4505],
    "ao nang": [8.0327, 98.8236],
    "railay": [8.0059, 98.8372],
    "railey": [8.0059, 98.8372],
    "koh lanta": [7.6134, 99.0361],
    "koh samui": [9.512, 100.0136],
    pattaya: [12.9236, 100.8825],
    chiangmai: [18.7883, 98.9853],
    "chiang mai": [18.7883, 98.9853],
    chennai: [13.0827, 80.2707],
    mumbai: [19.076, 72.8777],
    delhi: [28.7041, 77.1025],
    bangalore: [12.9716, 77.5946],
    kolkata: [22.5726, 88.3639],
    hyderabad: [17.385, 78.4867],
    pune: [18.5204, 73.8567],
    jaipur: [26.9124, 75.7873],
    paris: [48.8566, 2.3522],
    london: [51.5074, -0.1278],
    dubai: [25.2048, 55.2708],
    tokyo: [35.6762, 139.6503],
    "new york": [40.7128, -74.006],
    singapore: [1.3521, 103.8198],
    rome: [41.9028, 12.4964],
    barcelona: [41.3851, 2.1734],
    amsterdam: [52.3676, 4.9041],
    bali: [-8.4095, 115.1889],
};

function getCityCoords(destination?: string): [number, number] | null {
    if (!destination) return null;
    const norm = destination.toLowerCase();
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
        if (norm.includes(city)) return coords;
    }
    return null;
}

const geocodeCache = new Map<string, Coordinate | null>();

function hasValidCoordinates(coordinates?: Coordinate): coordinates is Coordinate {
    return !!coordinates &&
        typeof coordinates.lat === "number" &&
        typeof coordinates.lng === "number" &&
        coordinates.lat !== 0 &&
        coordinates.lng !== 0;
}

function cleanActivityQuery(activity: Activity): string {
    const base = `${activity.location || ""} ${activity.title || ""}`
        .replace(/\([^)]*\)/g, " ")
        .replace(/\b(excluding|including|compulsory|sharing|transfers?|entry ticket|speed boat|joined speed boat|local lunch|dinner|lunch|cash on tour|per person|private transfer|one way)\b/gi, " ")
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (activity.location?.trim()) return activity.location.trim();
    return base;
}

function normalizeRouteStopLabel(raw: string): string {
    return raw
        .replace(/\([^)]*\)/g, " ")
        .replace(/\ben-route.*$/i, " ")
        .replace(/\s+-\s+.*$/g, " ")
        .replace(/\b(round trip|one way|private transfer|shared transfer|sharing transfers?|joined transfer|transfer|hotel pickup|drop off|pickup|ticket|entry ticket|regular seat)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function extractRouteStopQueries(activity: Activity): string[] {
    const locationText = activity.location?.trim();
    const titleText = activity.title?.trim() || "";
    const candidates = [locationText, titleText].filter(Boolean) as string[];

    for (const candidate of candidates) {
        if (!/\bto\b/i.test(candidate)) continue;

        const parts = candidate
            .split(/\bto\b/i)
            .map((part) => normalizeRouteStopLabel(part))
            .filter(Boolean);

        if (parts.length >= 2) {
            return parts.slice(0, 2);
        }
    }

    const fallback = cleanActivityQuery(activity);
    return fallback ? [fallback] : [];
}

function coordinatesAlmostEqual(a: Coordinate, b: Coordinate): boolean {
    return Math.abs(a.lat - b.lat) < 0.0005 && Math.abs(a.lng - b.lng) < 0.0005;
}

async function geocodeActivityLocation(query: string, destination?: string): Promise<Coordinate | null> {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return null;

    const cached = geocodeCache.get(normalizedQuery);
    if (cached !== undefined) return cached;

    const localMatch = getCityCoords(query) || getCityCoords(destination ? `${query}, ${destination}` : query);
    if (localMatch) {
        const resolved = { lat: localMatch[0], lng: localMatch[1] };
        geocodeCache.set(normalizedQuery, resolved);
        return resolved;
    }

    try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", "1");
        url.searchParams.set("q", destination ? `${query}, ${destination}` : query);

        const response = await fetch(url.toString(), {
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            geocodeCache.set(normalizedQuery, null);
            return null;
        }

        const data = await response.json();
        const first = Array.isArray(data) ? data[0] : null;
        const lat = Number(first?.lat);
        const lng = Number(first?.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            geocodeCache.set(normalizedQuery, null);
            return null;
        }

        const resolved = { lat, lng };
        geocodeCache.set(normalizedQuery, resolved);
        return resolved;
    } catch {
        geocodeCache.set(normalizedQuery, null);
        return null;
    }
}

// ── Auto-fit bounds on mount ──────────────────────────────────────────────────
function FitBounds({ positions, driverLocation }: { positions: [number, number][], driverLocation?: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        const allPoints = [...positions];
        if (driverLocation) allPoints.push(driverLocation);

        if (allPoints.length > 0) {
            const bounds = L.latLngBounds(allPoints.map(([lat, lng]) => L.latLng(lat, lng)));
            map.fitBounds(bounds, { padding: [55, 55], maxZoom: 14, animate: true });
        }
    }, [map, positions, driverLocation]);
    return null;
}

// ── Leaflet CSS runtime injection ─────────────────────────────────────────────
// Bundler CSS imports can fail silently with turbopack. This guarantees
// the critical tile-positioning rules are always present.
const LEAFLET_CSS_ID = "leaflet-critical-css";
function ensureLeafletCSS() {
    if (typeof document === "undefined") return;
    if (document.getElementById(LEAFLET_CSS_ID)) return;
    const style = document.createElement("style");
    style.id = LEAFLET_CSS_ID;
    style.textContent = `
        .leaflet-pane, .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow,
        .leaflet-tile-container, .leaflet-pane > svg, .leaflet-pane > canvas,
        .leaflet-zoom-box, .leaflet-image-layer, .leaflet-layer {
            position: absolute; left: 0; top: 0;
        }
        .leaflet-container { overflow: hidden; }
        .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow {
            -webkit-user-select: none; user-select: none; -webkit-user-drag: none;
        }
        .leaflet-tile {
            filter: none !important;
        }
        /* Critical: Override Tailwind preflight img { max-width: 100%; height: auto; }
           which breaks tile sizing — each 256x256 tile must render at full size.
           Also override mix-blend-mode: plus-lighter from Leaflet 1.9+ which makes
           tiles invisible on dark backgrounds. */
        .leaflet-container img.leaflet-tile,
        .leaflet-tile-pane img,
        .leaflet-container .leaflet-tile {
            max-width: none !important;
            max-height: none !important;
            width: 256px !important;
            height: 256px !important;
            padding: 0 !important;
            margin: 0 !important;
            mix-blend-mode: normal !important;
        }
        /* Tiles start hidden, become visible when loaded — don't force visibility */
        .leaflet-tile-loaded {
            visibility: visible !important;
        }
        .leaflet-tile-container { pointer-events: none; }
        .leaflet-control-container .leaflet-control-zoom { border-radius: 8px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .leaflet-control-zoom a { width: 32px; height: 32px; line-height: 32px; }
    `;
    document.head.appendChild(style);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ItineraryMap({
    activities = [],
    days = [],
    accommodations = [],
    activeDay = 1,
    destination,
    driverLocation,
    className
}: ItineraryMapProps) {
    // Ensure Leaflet CSS is present on mount
    useEffect(() => { ensureLeafletCSS(); }, []);
    const activeActivities = useMemo(() => {
        if (days.length > 0) {
            return days.find(d => d.day_number === activeDay)?.activities || [];
        }
        return activities;
    }, [activities, days, activeDay]);

    const activeAccommodations = useMemo<Accommodation[]>(() => {
        if (!accommodations || accommodations.length === 0) return [];
        const filtered = accommodations.filter((acc) => !acc.is_fallback && acc.hotel_name);
        const forActiveDay = filtered.filter((acc) => acc.day_number === activeDay);
        return forActiveDay.length > 0 ? forActiveDay : filtered;
    }, [accommodations, activeDay]);

    const [resolvedCoordinates, setResolvedCoordinates] = useState<Record<string, Coordinate>>({});

    useEffect(() => {
        let cancelled = false;

        const unresolved = activeActivities.flatMap((activity, index) => {
            if (hasValidCoordinates(activity.coordinates)) return [];

            return extractRouteStopQueries(activity).map((query, stopIndex) => ({
                query,
                key: `${activeDay}:${index}:${stopIndex}:${activity.title}`,
            }));
        });

        if (unresolved.length === 0) return;

        void (async () => {
            const nextEntries = await Promise.all(
                unresolved.map(async ({ key, query }) => {
                    const resolved = await geocodeActivityLocation(query, destination);
                    return resolved ? [key, resolved] as const : null;
                }),
            );

            if (cancelled) return;

            setResolvedCoordinates((previous) => {
                const merged = { ...previous };
                for (const entry of nextEntries) {
                    if (!entry) continue;
                    merged[entry[0]] = entry[1];
                }
                return merged;
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [activeActivities, activeDay, destination]);

    const resolvedStops = useMemo<ResolvedStop[]>(() => {
        const stops = activeActivities.flatMap((activity, activityIndex) => {
            if (hasValidCoordinates(activity.coordinates)) {
                return [{
                    key: `${activeDay}:${activityIndex}:0:${activity.title}`,
                    label: activity.location?.trim() || activity.title,
                    title: activity.title,
                    start_time: activity.start_time,
                    resolvedCoordinates: activity.coordinates,
                }];
            }

            return extractRouteStopQueries(activity).map((query, stopIndex) => ({
                key: `${activeDay}:${activityIndex}:${stopIndex}:${activity.title}`,
                label: query,
                title: activity.title,
                start_time: activity.start_time,
                resolvedCoordinates: resolvedCoordinates[`${activeDay}:${activityIndex}:${stopIndex}:${activity.title}`],
            }));
        });

        return stops.filter((stop) => hasValidCoordinates(stop.resolvedCoordinates));
    }, [activeActivities, activeDay, resolvedCoordinates]);

    const valid = useMemo<ResolvedStop[]>(
        () => {
            const compact: ResolvedStop[] = [];

            for (const stop of resolvedStops) {
                const previous = compact[compact.length - 1];
                if (
                    previous?.resolvedCoordinates &&
                    stop.resolvedCoordinates &&
                    coordinatesAlmostEqual(previous.resolvedCoordinates, stop.resolvedCoordinates)
                ) {
                    continue;
                }
                compact.push(stop);
            }

            return compact;
        },
        [resolvedStops]
    );

    const [resolvedHotelCoords, setResolvedHotelCoords] = useState<Record<string, Coordinate>>({});

    useEffect(() => {
        let cancelled = false;

        const unresolved = activeAccommodations.flatMap((acc) => {
            if (hasValidCoordinates(acc.coordinates)) return [];
            const query = acc.address?.trim()
                ? `${acc.hotel_name}, ${acc.address}`
                : destination
                    ? `${acc.hotel_name}, ${destination}`
                    : acc.hotel_name;
            return [{ key: `hotel:${acc.day_number}:${acc.hotel_name}`, query }];
        });

        if (unresolved.length === 0) return;

        void (async () => {
            const entries = await Promise.all(
                unresolved.map(async ({ key, query }) => {
                    const resolved = await geocodeActivityLocation(query, destination);
                    return resolved ? ([key, resolved] as const) : null;
                }),
            );
            if (cancelled) return;
            setResolvedHotelCoords((prev) => {
                const merged = { ...prev };
                for (const entry of entries) if (entry) merged[entry[0]] = entry[1];
                return merged;
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [activeAccommodations, destination]);

    const resolvedHotels = useMemo<ResolvedHotel[]>(() => {
        const hotels: ResolvedHotel[] = [];
        for (const acc of activeAccommodations) {
            const key = `hotel:${acc.day_number}:${acc.hotel_name}`;
            const coords = hasValidCoordinates(acc.coordinates)
                ? acc.coordinates
                : resolvedHotelCoords[key];
            if (!coords) continue;
            hotels.push({
                key,
                day_number: acc.day_number,
                hotel_name: acc.hotel_name,
                address: acc.address,
                check_in_time: acc.check_in_time,
                room_type: acc.room_type,
                resolvedCoordinates: coords,
            });
        }
        return hotels;
    }, [activeAccommodations, resolvedHotelCoords]);

    const positions = useMemo<[number, number][]>(
        () => valid.map((a) => [a.resolvedCoordinates!.lat, a.resolvedCoordinates!.lng]),
        [valid]
    );

    const orderedLine = useMemo<[number, number][]>(() => positions, [positions]);

    const totalKm = useMemo(() => totalDistanceKm(orderedLine), [orderedLine]);

    const hotelPositions = useMemo<[number, number][]>(
        () => resolvedHotels.map((h) => [h.resolvedCoordinates.lat, h.resolvedCoordinates.lng]),
        [resolvedHotels]
    );

    const allBoundsPositions = useMemo<[number, number][]>(
        () => [...positions, ...hotelPositions],
        [positions, hotelPositions]
    );

    const driverPos = useMemo<[number, number] | null>(() => {
        if (!driverLocation) return null;
        return [driverLocation.latitude, driverLocation.longitude];
    }, [driverLocation]);

    if (valid.length === 0 && resolvedHotels.length === 0 && !driverPos) {
        const cityCenter = getCityCoords(destination);
        if (cityCenter) {
            return (
                <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
                    <MapContainer
                        center={cityCenter}
                        zoom={12}
                        style={{ width: "100%", height: "100%" }}
                        scrollWheelZoom
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </MapContainer>
                </div>
            );
        }

        return (
            <div className={cn("h-full w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 rounded-lg border border-dashed border-gray-200 p-6", className)}>
                <MapPin className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-medium text-sm">No locations found</p>
                <p className="text-xs opacity-70">Add activities with coordinates to see them on the map.</p>
            </div>
        );
    }

    const center = driverPos ?? positions[0] ?? hotelPositions[0] ?? getCityCoords(destination) ?? [20, 0];

    return (
        <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Route distance badge */}
            {totalKm > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        zIndex: 1000,
                        background: "rgba(10, 22, 40, 0.85)",
                        color: "white",
                        borderRadius: 12,
                        padding: "6px 14px",
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        pointerEvents: "none",
                    }}
                >
                    Route Distance: {totalKm.toFixed(1)} km
                </div>
            )}

            <MapContainer
                center={center as [number, number]}
                zoom={10}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />

                <FitBounds positions={allBoundsPositions} driverLocation={driverPos || undefined} />

                {orderedLine.length > 1 && (
                    <>
                        <Polyline
                            positions={orderedLine}
                            pathOptions={{ color: "#10b981", weight: 6, opacity: 0.15 }}
                        />
                        <Polyline
                            positions={orderedLine}
                            pathOptions={{ color: "#10b981", weight: 3, opacity: 0.8, dashArray: "1, 10" }}
                        />
                    </>
                )}

                {valid.map((act, idx) => (
                    <Marker
                        key={idx}
                        position={[act.resolvedCoordinates!.lat, act.resolvedCoordinates!.lng]}
                        icon={makeNumberedIcon(idx + 1)}
                    >
                        <Popup>
                            <div className="p-1">
                                <h4 className="font-bold text-sm text-slate-900">{act.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">📍 {act.label}</p>
                                {act.start_time && <p className="text-xs font-mono text-emerald-600 mt-1">{act.start_time}</p>}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {resolvedHotels.map((hotel) => (
                    <Marker
                        key={hotel.key}
                        position={[hotel.resolvedCoordinates.lat, hotel.resolvedCoordinates.lng]}
                        icon={makeHotelIcon()}
                    >
                        <Popup>
                            <div className="p-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Day {hotel.day_number} · Hotel</p>
                                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{hotel.hotel_name}</h4>
                                {hotel.address && <p className="text-xs text-slate-500 mt-1">📍 {hotel.address}</p>}
                                {hotel.room_type && <p className="text-xs text-slate-500 mt-0.5">🛏 {hotel.room_type}</p>}
                                {hotel.check_in_time && <p className="text-xs font-mono text-emerald-600 mt-1">Check-in: {hotel.check_in_time}</p>}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {driverPos && (
                    <Marker
                        position={driverPos}
                        icon={makeDriverIcon(driverLocation?.heading || 0)}
                    >
                        <Popup>
                            <div className="p-1 text-center">
                                <h4 className="font-bold text-sm text-emerald-600">LIVE ASSET</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Driver Location</p>
                                <p className="text-xs mt-2 font-mono">{new Date(driverLocation!.recorded_at).toLocaleTimeString()}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
