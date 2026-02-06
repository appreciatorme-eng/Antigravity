
"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet marker icons not showing in React
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

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

function MapBounds({ activities }: { activities: Activity[] }) {
    const map = useMap();

    useEffect(() => {
        if (!activities || activities.length === 0) return;

        const bounds = L.latLngBounds(activities.map(a => [a.coordinates!.lat, a.coordinates!.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [activities, map]);

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
        return <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg">No map data available</div>;
    }

    const center = [validActivities[0].coordinates!.lat, validActivities[0].coordinates!.lng] as [number, number];

    return (
        <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={false}
            className="h-full w-full rounded-lg z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validActivities.map((act, idx) => (
                <Marker
                    key={idx}
                    position={[act.coordinates!.lat, act.coordinates!.lng]}
                >
                    <Popup>
                        <strong className="text-secondary">{act.title}</strong><br />
                        <span className="text-gray-600">{act.location}</span>
                    </Popup>
                </Marker>
            ))}
            <MapBounds activities={validActivities} />
        </MapContainer>
    );
}
