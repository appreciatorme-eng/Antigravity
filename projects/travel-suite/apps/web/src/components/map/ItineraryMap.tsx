"use client";

import { useEffect, useMemo, useRef } from "react";
import { Map, MapControls, MapMarker, MarkerPopup, useMap } from "@/components/ui/map";
import maplibregl from "maplibre-gl";
import { MapPin } from "lucide-react";

interface Coordinate {
    lat: number;
    lng: number;
}

interface Activity {
    title: string;
    location: string;
    coordinates?: Coordinate;
}

interface ItineraryMapProps {
    activities: Activity[];
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
            type: "Feature",
            geometry: {
                type: "LineString",
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
    // Filter out activities without valid coordinates
    const validActivities = activities.filter(a =>
        a.coordinates &&
        typeof a.coordinates.lat === 'number' &&
        typeof a.coordinates.lng === 'number'
    );

    if (validActivities.length === 0) {
        return (
            <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 rounded-lg border border-dashed border-gray-200 p-6">
                <MapPin className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-medium">No map locations found</p>
                <p className="text-xs opacity-70">Add activities with locations to see them on the map.</p>
            </div>
        );
    }

    const routeCoordinates = useMemo<[number, number][]>(
        () => validActivities.map(act => [act.coordinates!.lng, act.coordinates!.lat]),
        [validActivities]
    );

    // Default center (will be overridden by fitBounds)
    const initialCenter: [number, number] = routeCoordinates[0];

    // Calculate bounds
    const bounds = new maplibregl.LngLatBounds();
    validActivities.forEach(a => {
        if (a.coordinates) {
            bounds.extend([a.coordinates.lng, a.coordinates.lat]);
        }
    });

    return (
        <Map
            center={initialCenter}
            zoom={10}
            className="h-full w-full rounded-lg overflow-hidden font-sans"
            theme="light"
        >
            <MapControls position="bottom-right" showCompass={false} />
            <MapBoundsController bounds={bounds} />
            {routeCoordinates.length > 1 && <MapRouteLine coordinates={routeCoordinates} />}

            {validActivities.map((act, idx) => (
                <MapMarker
                    key={idx}
                    longitude={act.coordinates!.lng}
                    latitude={act.coordinates!.lat}
                >
                    <div className="relative group cursor-pointer z-10 hover:z-50">
                        <div className="w-8 h-8 bg-white rounded-full shadow-md border-2 border-secondary flex items-center justify-center text-secondary font-bold text-xs transform transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white">
                            {idx + 1}
                        </div>
                        {/* Ripple effect */}
                        <div className="absolute -inset-2 bg-secondary/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />
                    </div>

                    <MarkerPopup offset={[0, -10]}>
                        <div className="p-2 min-w-[200px] max-w-[250px]">
                            <h4 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{act.title}</h4>
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
