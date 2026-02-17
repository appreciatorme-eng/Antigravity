"use client";

import { useEffect, useMemo, useRef } from "react";
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, useMap } from "@/components/ui/map";
import maplibregl from "maplibre-gl";
import { MapPin } from "lucide-react";

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
}

function haversineDistanceKm(a: [number, number], b: [number, number]) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(b[1] - a[1]);
    const dLng = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);

    const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return earthRadiusKm * c;
}

function totalDistanceKmForRoute(route: [number, number][]) {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
        total += haversineDistanceKm(route[i], route[i + 1]);
    }
    return total;
}

// Simple route optimization (nearest-neighbor + 2-opt). This only affects map rendering,
// not the day-by-day itinerary ordering.
function optimizeRouteIndices(points: [number, number][], startIndex = 0) {
    const n = points.length;
    if (n <= 2) return Array.from({ length: n }, (_, i) => i);

    const unvisited = new Set<number>(Array.from({ length: n }, (_, i) => i));
    unvisited.delete(startIndex);

    const order: number[] = [startIndex];
    while (unvisited.size) {
        const lastIdx = order[order.length - 1]!;
        let bestIdx: number | null = null;
        let bestDist = Infinity;
        for (const idx of unvisited) {
            const d = haversineDistanceKm(points[lastIdx]!, points[idx]!);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = idx;
            }
        }
        if (bestIdx === null) break;
        unvisited.delete(bestIdx);
        order.push(bestIdx);
    }

    // 2-opt improvement for small-to-medium routes
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
                    const current = haversineDistanceKm(a, b) + haversineDistanceKm(c, d);
                    const swapped = haversineDistanceKm(a, c) + haversineDistanceKm(b, d);
                    if (swapped + 1e-9 < current) {
                        const reversed = order.slice(i, k + 1).reverse();
                        order.splice(i, reversed.length, ...reversed);
                        improved = true;
                    }
                }
            }
        }
    }

    return order;
}

// Child component to handle map bounds when map instance is ready
function MapBoundsController({ bounds }: { bounds: maplibregl.LngLatBounds }) {
    const { map } = useMap();
    const initializedRef = useRef(false);

    useEffect(() => {
        if (map && !bounds.isEmpty() && !initializedRef.current) {
            try {
                map.fitBounds(bounds, {
                    padding: { top: 70, bottom: 70, left: 70, right: 70 },
                    maxZoom: 14,
                    duration: 1500
                });
                initializedRef.current = true;
            } catch (error) {
                console.error("Error fitting bounds:", error);
            }
        }
    }, [map, bounds]);

    return null;
}

function MapRouteLine({ coordinates }: { coordinates: [number, number][] }) {
    const { map, isLoaded } = useMap();
    const sourceId = "itinerary-route";
    const layerId = "itinerary-route-line";

    useEffect(() => {
        if (!map || !isLoaded) return;

        const data = {
            type: "Feature" as const,
            geometry: {
                type: "LineString" as const,
                coordinates,
            },
            properties: {},
        };

        if (map.getSource(sourceId)) {
            const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
            source.setData(data);
            return;
        }

        map.addSource(sourceId, {
            type: "geojson",
            data,
        });

        map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
                "line-color": "#c4a870",
                "line-width": 3,
                "line-opacity": 0.8,
                "line-dasharray": [1.5, 1.5],
            },
        });

        return () => {
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
        };
    }, [map, isLoaded, coordinates]);

    return null;
}

export default function ItineraryMap({ activities }: ItineraryMapProps) {
    const validActivities = useMemo(
        () =>
            activities.filter(
                (a) =>
                    a.coordinates &&
                    typeof a.coordinates.lat === "number" &&
                    typeof a.coordinates.lng === "number"
            ),
        [activities]
    );

    const { optimizedActivities, routeCoordinates } = useMemo(() => {
        const coords: [number, number][] = validActivities.map((act) => [act.coordinates!.lng, act.coordinates!.lat]);
        const order = optimizeRouteIndices(coords, 0);
        const orderedActivities = order.map((idx) => validActivities[idx]!);
        const orderedCoords = order.map((idx) => coords[idx]!);
        return { optimizedActivities: orderedActivities, routeCoordinates: orderedCoords };
    }, [validActivities]);

    const segmentDistances = useMemo(() => {
        const segments: Array<{ from: number; to: number; distanceKm: number; mid: [number, number] }> = [];
        for (let i = 0; i < routeCoordinates.length - 1; i++) {
            const start = routeCoordinates[i];
            const end = routeCoordinates[i + 1];
            const distanceKm = haversineDistanceKm(start, end);
            const mid: [number, number] = [
                (start[0] + end[0]) / 2,
                (start[1] + end[1]) / 2,
            ];
            segments.push({ from: i + 1, to: i + 2, distanceKm, mid });
        }
        return segments;
    }, [routeCoordinates]);

    const totalDistanceKm = useMemo(() => totalDistanceKmForRoute(routeCoordinates), [routeCoordinates]);

    const bounds = useMemo(() => {
        const calculatedBounds = new maplibregl.LngLatBounds();
        validActivities.forEach((a) => {
            if (a.coordinates) {
                calculatedBounds.extend([a.coordinates.lng, a.coordinates.lat]);
            }
        });
        return calculatedBounds;
    }, [validActivities]);

    if (validActivities.length === 0) {
        return (
            <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 rounded-lg border border-dashed border-gray-200 p-6">
                <MapPin className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-medium">No map locations found</p>
                <p className="text-xs opacity-70">Add activities with locations to see them on the map.</p>
            </div>
        );
    }

    // Default center (will be overridden by fitBounds)
    const initialCenter: [number, number] = routeCoordinates[0];

    if (initialCenter) {
        for (const coordinate of routeCoordinates) {
            if (!Number.isFinite(coordinate[0]) || !Number.isFinite(coordinate[1])) {
                return null;
            }
        }
    }

    return (
        <Map
            center={initialCenter}
            zoom={10}
            className="h-full w-full rounded-lg overflow-hidden font-sans"
            theme="light"
        >
            <div className="absolute left-3 top-3 z-40 rounded-full bg-[#1b140a]/90 px-3 py-1.5 text-xs font-semibold text-[#f5e7c6] shadow-md backdrop-blur">
                Route: {totalDistanceKm.toFixed(1)} km
            </div>
            <MapControls position="bottom-right" showCompass={false} />
            <MapBoundsController bounds={bounds} />
            {routeCoordinates.length > 1 && <MapRouteLine coordinates={routeCoordinates} />}

            {segmentDistances.map((segment) => (
                <MapMarker
                    key={`segment-${segment.from}-${segment.to}`}
                    longitude={segment.mid[0]}
                    latitude={segment.mid[1]}
                    offset={[0, -8]}
                >
                    <MarkerContent>
                        <div className="rounded-full border border-[#c4a870] bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#1b140a] shadow-[0_6px_12px_rgba(20,16,12,0.2)]">
                            {segment.distanceKm.toFixed(1)} km
                        </div>
                    </MarkerContent>
                </MapMarker>
            ))}

            {optimizedActivities.map((act, idx) => (
                <MapMarker
                    key={idx}
                    longitude={act.coordinates!.lng}
                    latitude={act.coordinates!.lat}
                    offset={[0, -18]}
                >
                    <MarkerContent>
                        <div className="relative group cursor-pointer z-50">
                            <div className="w-10 h-10 rounded-full bg-[#1b140a] border-2 border-[#c4a870] shadow-[0_10px_18px_rgba(20,16,12,0.35)] flex items-center justify-center text-[#f5e7c6] font-extrabold text-sm transform transition-all duration-300 group-hover:scale-110">
                                {idx + 1}
                            </div>
                            <div className="absolute left-1/2 -bottom-2 w-3 h-3 bg-[#1b140a] border border-[#c4a870] rotate-45 -translate-x-1/2 shadow-[0_6px_12px_rgba(20,16,12,0.25)]" />
                            <div className="absolute -inset-3 bg-[#c4a870]/25 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />
                        </div>
                    </MarkerContent>

                    <MarkerPopup offset={[0, -10]}>
                        <div className="p-2 min-w-[200px] max-w-[250px]">
                            <h4 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{act.title}</h4>
                            {(act.start_time || act.end_time) && (
                                <p className="text-[11px] font-semibold text-[#6f5b3e] mb-1">
                                    {act.start_time || "--:--"} - {act.end_time || "--:--"}
                                </p>
                            )}
                            <div className="flex items-start gap-1.5 text-xs text-gray-600">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                                <span className="leading-snug">{act.location}</span>
                            </div>
                        </div>
                    </MarkerPopup>
                </MapMarker>
            ))}
        </Map>
    );
}
