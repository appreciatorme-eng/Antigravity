"use client";

import { useEffect, useMemo } from "react";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

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

// Fix Leaflet's default icon paths in Next.js / Webpack
if (typeof window !== "undefined") {
    // @ts-expect-error _getIconUrl exists at runtime
    delete L.Icon.Default.prototype._getIconUrl;
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

interface ItineraryMapProps {
    activities?: Activity[];
    days?: Day[];
    activeDay?: number;
    destination?: string;
    driverLocation?: DriverLocationSnapshot | null;
    className?: string;
}

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
    for (let i = 0; i < route.length - 1; i++) total += haversineKm(route[i]!, route[i + 1]!);
    return total;
}

// ── Route optimisation: nearest-neighbour greedy + 2-opt refinement ───────────
function optimizeRouteIndices(points: [number, number][], startIndex = 0): number[] {
    const n = points.length;
    if (n <= 2) return Array.from({ length: n }, (_, i) => i);

    const unvisited = new Set<number>(Array.from({ length: n }, (_, i) => i));
    unvisited.delete(startIndex);
    const order: number[] = [startIndex];

    while (unvisited.size) {
        const last = order[order.length - 1]!;
        let bestIdx: number | null = null;
        let bestDist = Infinity;
        for (const idx of unvisited) {
            const d = haversineKm(points[last]!, points[idx]!);
            if (d < bestDist) { bestDist = d; bestIdx = idx; }
        }
        if (bestIdx === null) break;
        unvisited.delete(bestIdx);
        order.push(bestIdx);
    }

    // 2-opt improvement (effective for up to ~40 stops)
    if (order.length >= 4 && order.length <= 40) {
        let improved = true;
        let safety = 0;
        while (improved && safety++ < 80) {
            improved = false;
            for (let i = 1; i < order.length - 2; i++) {
                for (let k = i + 1; k < order.length - 1; k++) {
                    const a = points[order[i - 1]!]!;
                    const b = points[order[i]!]!;
                    const c = points[order[k]!]!;
                    const d = points[order[k + 1]!]!;
                    if (haversineKm(a, c) + haversineKm(b, d) + 1e-9 < haversineKm(a, b) + haversineKm(c, d)) {
                        order.splice(i, k - i + 1, ...order.slice(i, k + 1).reverse());
                        improved = true;
                    }
                }
            }
        }
    }

    return order;
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

// ── Fallback city coordinates ─────────────────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
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

// ── Main component ────────────────────────────────────────────────────────────
export default function ItineraryMap({
    activities = [],
    days = [],
    activeDay = 1,
    destination,
    driverLocation,
    className
}: ItineraryMapProps) {
    const activeActivities = useMemo(() => {
        if (days.length > 0) {
            return days.find(d => d.day_number === activeDay)?.activities || [];
        }
        return activities;
    }, [activities, days, activeDay]);

    const valid = useMemo(
        () =>
            activeActivities.filter(
                (a) =>
                    a.coordinates &&
                    typeof a.coordinates.lat === "number" &&
                    typeof a.coordinates.lng === "number" &&
                    a.coordinates.lat !== 0 &&
                    a.coordinates.lng !== 0
            ),
        [activeActivities]
    );

    const positions = useMemo<[number, number][]>(
        () => valid.map((a) => [a.coordinates!.lat, a.coordinates!.lng]),
        [valid]
    );

    const optimizedLine = useMemo<[number, number][]>(() => {
        if (positions.length <= 1) return positions;
        const order = optimizeRouteIndices(positions, 0);
        return order.map((i) => positions[i]!);
    }, [positions]);

    const totalKm = useMemo(() => totalDistanceKm(optimizedLine), [optimizedLine]);

    const driverPos = useMemo<[number, number] | null>(() => {
        if (!driverLocation) return null;
        return [driverLocation.latitude, driverLocation.longitude];
    }, [driverLocation]);

    if (valid.length === 0 && !driverPos) {
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

    const center = driverPos ?? positions[0] ?? getCityCoords(destination) ?? [20, 0];

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

                <FitBounds positions={positions} driverLocation={driverPos || undefined} />

                {optimizedLine.length > 1 && (
                    <>
                        <Polyline
                            positions={optimizedLine}
                            pathOptions={{ color: "#10b981", weight: 6, opacity: 0.15 }}
                        />
                        <Polyline
                            positions={optimizedLine}
                            pathOptions={{ color: "#10b981", weight: 3, opacity: 0.8, dashArray: "1, 10" }}
                        />
                    </>
                )}

                {valid.map((act, idx) => (
                    <Marker
                        key={idx}
                        position={[act.coordinates!.lat, act.coordinates!.lng]}
                        icon={makeNumberedIcon(idx + 1)}
                    >
                        <Popup>
                            <div className="p-1">
                                <h4 className="font-bold text-sm text-slate-900">{act.title}</h4>
                                {act.location && <p className="text-xs text-slate-500 mt-1">📍 {act.location}</p>}
                                {act.start_time && <p className="text-xs font-mono text-emerald-600 mt-1">{act.start_time}</p>}
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
