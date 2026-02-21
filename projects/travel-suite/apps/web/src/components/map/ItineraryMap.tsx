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

interface Activity {
    title: string;
    location?: string;
    start_time?: string;
    end_time?: string;
    coordinates?: Coordinate;
}

interface ItineraryMapProps {
    activities: Activity[];
    destination?: string;
}

// ── Haversine distance ────────────────────────────────────────────────────────
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

// ── Numbered pin icon ─────────────────────────────────────────────────────────
function makeNumberedIcon(n: number) {
    return L.divIcon({
        className: "",
        html: `
            <div style="
                width:36px; height:36px; border-radius:50%;
                background:#1b140a; border:2.5px solid #c4a870;
                display:flex; align-items:center; justify-content:center;
                color:#f5e7c6; font-weight:800; font-size:13px;
                box-shadow:0 6px 14px rgba(20,16,12,0.4);
                font-family:sans-serif;
            ">${n}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
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
function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions.map(([lat, lng]) => L.latLng(lat, lng)));
            map.fitBounds(bounds, { padding: [55, 55], maxZoom: 14, animate: true });
        }
    }, [map, positions]);
    return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ItineraryMap({ activities, destination }: ItineraryMapProps) {
    const valid = useMemo(
        () =>
            activities.filter(
                (a) =>
                    a.coordinates &&
                    typeof a.coordinates.lat === "number" &&
                    typeof a.coordinates.lng === "number" &&
                    a.coordinates.lat !== 0 &&
                    a.coordinates.lng !== 0
            ),
        [activities]
    );

    // [lat, lng] tuples for Leaflet (note: Leaflet uses lat,lng order)
    const positions = useMemo<[number, number][]>(
        () => valid.map((a) => [a.coordinates!.lat, a.coordinates!.lng]),
        [valid]
    );

    const totalKm = useMemo(
        () => totalDistanceKm(positions),
        [positions]
    );

    // Leaflet Polyline uses [lat, lng] which is the same as positions
    const routeLine = positions;

    if (valid.length === 0) {
        const cityCenter = getCityCoords(destination);
        if (cityCenter) {
            return (
                <MapContainer
                    center={cityCenter}
                    zoom={12}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom={false}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </MapContainer>
            );
        }

        return (
            <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 rounded-lg border border-dashed border-gray-200 p-6">
                <MapPin className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-medium">No map locations found</p>
                <p className="text-xs opacity-70">Add activities with locations to see them on the map.</p>
            </div>
        );
    }

    const center = positions[0] ?? getCityCoords(destination) ?? [20, 0];

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Route distance badge */}
            <div
                style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    zIndex: 1000,
                    background: "rgba(27,20,10,0.9)",
                    color: "#f5e7c6",
                    borderRadius: 9999,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(20,16,12,0.3)",
                    backdropFilter: "blur(4px)",
                    pointerEvents: "none",
                }}
            >
                Route: {totalKm.toFixed(1)} km
            </div>

            <MapContainer
                center={center as [number, number]}
                zoom={10}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom={false}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />

                {/* Auto-fit bounds to all markers */}
                <FitBounds positions={positions} />

                {/* Route polyline */}
                {routeLine.length > 1 && (
                    <Polyline
                        positions={routeLine}
                        pathOptions={{
                            color: "#c4a870",
                            weight: 3,
                            opacity: 0.85,
                            dashArray: "8, 6",
                        }}
                    />
                )}

                {/* Activity markers */}
                {valid.map((act, idx) => (
                    <Marker
                        key={idx}
                        position={[act.coordinates!.lat, act.coordinates!.lng]}
                        icon={makeNumberedIcon(idx + 1)}
                    >
                        <Popup>
                            <div style={{ minWidth: 180, maxWidth: 240, padding: "2px 0" }}>
                                <h4 style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: "#1b140a" }}>
                                    {act.title}
                                </h4>
                                {(act.start_time || act.end_time) && (
                                    <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#6f5b3e" }}>
                                        {act.start_time || "--:--"} – {act.end_time || "--:--"}
                                    </p>
                                )}
                                {act.location && (
                                    <p style={{ margin: 0, fontSize: 11, color: "#555", display: "flex", gap: 4, alignItems: "flex-start" }}>
                                        📍 {act.location}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
