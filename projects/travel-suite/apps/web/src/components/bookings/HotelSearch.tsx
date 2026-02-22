"use client";

import React, { useMemo, useState } from "react";
import { BedDouble, CalendarDays, Loader2, MapPin, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HotelDetails } from "@/types/itinerary";
import { LocationAutocomplete, LocationSuggestion } from "@/components/bookings/LocationAutocomplete";
import { guessIataCode, normalizeIataCode } from "@/lib/airport";

interface HotelSearchProps {
    onSelect: (hotel: HotelDetails) => void;
    initialCity?: string;
}

interface HotelResult {
    hotelId: string;
    name: string;
    iataCode: string;
    distance?: {
        value?: number;
        unit?: string;
    };
    address?: {
        cityName?: string;
        lines?: string[];
    };
}

function toDateInput(date: Date) {
    return date.toISOString().split("T")[0];
}

function resolveCityCode(location: string, selected: LocationSuggestion | null) {
    const fromSelected = normalizeIataCode(selected?.iataCode);
    if (fromSelected) return fromSelected;
    return normalizeIataCode(guessIataCode(location)) ?? "";
}

export function HotelSearch({ onSelect, initialCity }: HotelSearchProps) {
    const [location, setLocation] = useState(initialCity || "");
    const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
    const [checkIn, setCheckIn] = useState(toDateInput(new Date()));
    const [checkOut, setCheckOut] = useState(toDateInput(new Date(Date.now() + 86400000)));
    const [radius, setRadius] = useState(20);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<HotelResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    const cityCode = useMemo(() => resolveCityCode(location, selectedLocation), [location, selectedLocation]);

    const handleSearch = async () => {
        if (!location.trim()) {
            setError("Enter a city or destination to search hotels.");
            return;
        }
        if (!checkIn || !checkOut) {
            setError("Check-in and check-out dates are required.");
            return;
        }
        if (checkOut <= checkIn) {
            setError("Check-out must be after check-in date.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                location,
                cityCode,
                radius: String(radius),
                checkInDate: checkIn,
                checkOutDate: checkOut,
            });
            const res = await fetch(`/api/bookings/hotels/search?${params.toString()}`);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Unable to fetch hotels");
            }
            if (Array.isArray(data?.data) && data.data.length > 0) {
                setResults(data.data as HotelResult[]);
            } else {
                setResults([]);
                setError("No hotels found for this location.");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch hotels";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const importHotel = (hotelResult: HotelResult) => {
        const hotel: HotelDetails = {
            id: hotelResult.hotelId,
            name: hotelResult.name || "Hotel",
            address:
                hotelResult.address?.lines?.join(", ") ||
                hotelResult.address?.cityName ||
                hotelResult.iataCode ||
                location,
            check_in: checkIn,
            check_out: checkOut,
            source: "amadeus",
        };
        onSelect(hotel);
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 md:p-6 space-y-5 shadow-xl shadow-emerald-900/5">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-end">
                    <div className="xl:col-span-5">
                        <LocationAutocomplete
                            label="Location"
                            placeholder="City or destination (e.g. Chennai / Bali / Paris)"
                            kind="hotel"
                            value={location}
                            selected={selectedLocation}
                            onValueChange={(next) => {
                                setLocation(next);
                                setSelectedLocation(null);
                            }}
                            onSelectSuggestion={setSelectedLocation}
                        />
                    </div>

                    <label className="space-y-2 xl:col-span-2">
                        <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">Check-in</span>
                        <span className="relative block">
                            <input
                                type="date"
                                value={checkIn}
                                onChange={(event) => setCheckIn(event.target.value)}
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                            <CalendarDays className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </span>
                    </label>

                    <label className="space-y-2 xl:col-span-2">
                        <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">Check-out</span>
                        <span className="relative block">
                            <input
                                type="date"
                                value={checkOut}
                                onChange={(event) => setCheckOut(event.target.value)}
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                            <CalendarDays className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </span>
                    </label>

                    <label className="space-y-2 xl:col-span-1">
                        <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">Radius</span>
                        <select
                            value={radius}
                            onChange={(event) => setRadius(Number.parseInt(event.target.value, 10) || 20)}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400 appearance-none"
                        >
                            {[5, 10, 20, 30, 50].map((km) => (
                                <option key={km} value={km}>
                                    {km} km
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="xl:col-span-2 flex xl:justify-end">
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-12 w-full xl:w-auto px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                            Search Hotels
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-600 p-3 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {results.map((hotel) => (
                    <Card key={hotel.hotelId} className="border-slate-200 hover:border-emerald-300 transition-colors">
                        <CardContent className="p-5 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <BedDouble className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate">{hotel.name}</h4>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">
                                            {hotel.address?.lines?.join(", ") || hotel.address?.cityName || hotel.iataCode}
                                        </span>
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full border border-amber-200 bg-amber-50 text-amber-600 px-2 py-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            Curated
                                        </span>
                                        {hotel.distance?.value && (
                                            <span className="text-[11px] text-slate-500">
                                                {hotel.distance.value} {hotel.distance.unit || "KM"} away
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                onClick={() => importHotel(hotel)}
                            >
                                Select
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
