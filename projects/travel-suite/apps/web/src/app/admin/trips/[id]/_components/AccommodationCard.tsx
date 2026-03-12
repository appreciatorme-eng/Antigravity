"use client";

import { useRef } from "react";
import { Hotel, Phone } from "lucide-react";
import type { Accommodation, HotelSuggestion } from "./types";

interface AccommodationCardProps {
    activeDay: number;
    accommodation: Accommodation | undefined;
    hotelSuggestions: HotelSuggestion[];
    hotelLoading: boolean;
    onUpdateAccommodation: (dayNumber: number, field: keyof Accommodation, value: string) => void;
    onFillFromSuggestion: (dayNumber: number, suggestion: HotelSuggestion) => void;
    onFetchNearbyHotels: (dayNumber: number, searchTerm?: string) => void;
}

export function AccommodationCard({
    activeDay,
    accommodation,
    hotelSuggestions,
    hotelLoading,
    onUpdateAccommodation,
    onFillFromSuggestion,
    onFetchNearbyHotels,
}: AccommodationCardProps) {
    const hotelSearchDebounceRef = useRef<number | null>(null);

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Hotel className="h-5 w-5 text-secondary" />
                <h2 className="text-lg font-semibold">Accommodation</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hotel Name
                    </label>
                    <input
                        type="text"
                        value={accommodation?.hotel_name || ""}
                        onChange={(e) => {
                            const value = e.target.value;
                            onUpdateAccommodation(activeDay, "hotel_name", value);

                            if (hotelSearchDebounceRef.current) {
                                window.clearTimeout(hotelSearchDebounceRef.current);
                            }

                            if (value.trim().length >= 3) {
                                hotelSearchDebounceRef.current = window.setTimeout(() => {
                                    onFetchNearbyHotels(activeDay, value.trim());
                                }, 350);
                            }
                        }}
                        onFocus={() => {
                            if (!hotelSuggestions.length) {
                                onFetchNearbyHotels(activeDay);
                            }
                        }}
                        placeholder="Enter hotel name"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => onFetchNearbyHotels(activeDay)}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            {hotelLoading ? "Finding nearby hotels..." : "Auto-pick nearest hotel"}
                        </button>
                        {hotelSuggestions.length ? (
                            <span className="text-xs text-gray-500">
                                {hotelSuggestions.length} nearby options
                            </span>
                        ) : null}
                    </div>
                    {hotelSuggestions.length ? (
                        <div className="mt-2 max-h-36 overflow-auto rounded-lg border border-gray-200 bg-white">
                            {hotelSuggestions.map((hotel, i) => (
                                <button
                                    key={`${hotel.name}-${hotel.lat}-${hotel.lng}-${i}`}
                                    type="button"
                                    onClick={() => onFillFromSuggestion(activeDay, hotel)}
                                    className="w-full border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
                                >
                                    <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {hotel.address} &bull; {hotel.distanceKm.toFixed(1)} km
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                    </label>
                    <input
                        type="text"
                        value={accommodation?.address || ""}
                        onChange={(e) =>
                            onUpdateAccommodation(activeDay, "address", e.target.value)
                        }
                        placeholder="Hotel address"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-in Time
                        </label>
                        <input
                            type="time"
                            value={accommodation?.check_in_time || "15:00"}
                            onChange={(e) =>
                                onUpdateAccommodation(activeDay, "check_in_time", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Phone className="h-3 w-3 inline mr-1" />
                            Contact Phone
                        </label>
                        <input
                            type="tel"
                            value={accommodation?.contact_phone || ""}
                            onChange={(e) =>
                                onUpdateAccommodation(activeDay, "contact_phone", e.target.value)
                            }
                            placeholder="+1 234 567 8900"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
