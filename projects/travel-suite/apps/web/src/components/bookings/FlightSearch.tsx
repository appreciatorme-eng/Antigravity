"use client";

import React, { useMemo, useState } from "react";
import { ArrowRightLeft, CalendarDays, Loader2, Plane, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FlightDetails } from "@/types/itinerary";
import { guessIataCode, normalizeIataCode } from "@/lib/airport";
import { LocationAutocomplete, LocationSuggestion } from "@/components/bookings/LocationAutocomplete";

type TripType = "one_way" | "round_trip";

interface FlightSegment {
    carrierCode: string;
    number: string;
    departure: {
        iataCode: string;
        at: string;
    };
    arrival: {
        iataCode: string;
        at: string;
    };
}

interface FlightOffer {
    id: string;
    validatingAirlineCodes?: string[];
    itineraries: Array<{
        duration: string;
        segments: FlightSegment[];
    }>;
    price: {
        total: string;
        currency: string;
    };
}

interface FlightSearchProps {
    onSelect: (flight: FlightDetails) => void;
    initialDate?: string;
    initialOrigin?: string;
    initialDestination?: string;
}

function resolveCode(input: string, selected: LocationSuggestion | null) {
    const fromSelected = normalizeIataCode(selected?.iataCode);
    if (fromSelected) return fromSelected;
    return normalizeIataCode(guessIataCode(input)) ?? "";
}

function formatDuration(pt: string) {
    if (!pt) return "";
    return pt
        .replace("PT", "")
        .replace("H", "h ")
        .replace("M", "m")
        .trim();
}

export function FlightSearch({ onSelect, initialDate, initialOrigin, initialDestination }: FlightSearchProps) {
    const [tripType, setTripType] = useState<TripType>("one_way");
    const [originInput, setOriginInput] = useState(initialOrigin || "");
    const [destinationInput, setDestinationInput] = useState(initialDestination || "");
    const [originSuggestion, setOriginSuggestion] = useState<LocationSuggestion | null>(null);
    const [destinationSuggestion, setDestinationSuggestion] = useState<LocationSuggestion | null>(null);
    const [departureDate, setDepartureDate] = useState(initialDate || "");
    const [returnDate, setReturnDate] = useState("");
    const [adults, setAdults] = useState(1);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<FlightOffer[]>([]);
    const [error, setError] = useState<string | null>(null);

    const hasReturn = useMemo(
        () => tripType === "round_trip" && returnDate.trim().length > 0,
        [returnDate, tripType]
    );

    const handleSwap = () => {
        setOriginInput(destinationInput);
        setDestinationInput(originInput);
        setOriginSuggestion(destinationSuggestion);
        setDestinationSuggestion(originSuggestion);
    };

    const handleSearch = async () => {
        const originCode = resolveCode(originInput, originSuggestion);
        const destinationCode = resolveCode(destinationInput, destinationSuggestion);
        const depart = departureDate.trim();
        const ret = returnDate.trim();

        if (!originInput.trim() || !destinationInput.trim() || !depart) {
            setError("Origin, destination, and departure date are required.");
            return;
        }
        if (tripType === "round_trip" && !ret) {
            setError("Return date is required for round-trip.");
            return;
        }
        if (tripType === "round_trip" && ret <= depart) {
            setError("Return date must be after departure date.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                origin: originInput,
                destination: destinationInput,
                originCode,
                destinationCode,
                date: depart,
                tripType,
                adults: String(adults),
            });
            if (tripType === "round_trip") {
                params.set("returnDate", ret);
            }

            const res = await fetch(`/api/bookings/flights/search?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Unable to fetch flights");
            }

            if (Array.isArray(data?.data) && data.data.length > 0) {
                setResults(data.data as FlightOffer[]);
            } else {
                setResults([]);
                setError("No flights found for your route and dates.");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch flights";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const importFlight = (offer: FlightOffer) => {
        const outbound = offer.itineraries[0]?.segments[0];
        if (!outbound) return;

        const returnSegment = offer.itineraries[1]?.segments?.[0];
        const airlineCode = offer.validatingAirlineCodes?.[0] || outbound.carrierCode;
        const flight: FlightDetails = {
            id: offer.id,
            airline: airlineCode,
            flight_number: `${outbound.carrierCode}${outbound.number}${returnSegment ? "-RT" : ""}`,
            departure_airport: outbound.departure.iataCode,
            arrival_airport: outbound.arrival.iataCode,
            departure_time: outbound.departure.at,
            arrival_time: outbound.arrival.at,
            price: Number.parseFloat(offer.price.total) || 0,
            currency: offer.price.currency || "USD",
            source: "amadeus",
            confirmation: returnSegment
                ? `Return ${returnSegment.departure.iataCode}-${returnSegment.arrival.iataCode} ${new Date(returnSegment.departure.at).toLocaleString()}`
                : undefined,
        };
        onSelect(flight);
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 md:p-6 space-y-5 shadow-xl shadow-slate-900/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
                        <button
                            type="button"
                            onClick={() => setTripType("one_way")}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tripType === "one_way" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                            One-way
                        </button>
                        <button
                            type="button"
                            onClick={() => setTripType("round_trip")}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tripType === "round_trip" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                            Round trip
                        </button>
                    </div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400 font-semibold">
                        Live fares from Amadeus
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-end">
                    <div className="xl:col-span-4">
                        <LocationAutocomplete
                            label="From"
                            placeholder="City or IATA (e.g. Chennai / MAA)"
                            kind="flight"
                            value={originInput}
                            selected={originSuggestion}
                            onValueChange={(next) => {
                                setOriginInput(next);
                                setOriginSuggestion(null);
                            }}
                            onSelectSuggestion={setOriginSuggestion}
                        />
                    </div>

                    <div className="xl:col-span-4">
                        <LocationAutocomplete
                            label="To"
                            placeholder="City or IATA (e.g. Singapore / SIN)"
                            kind="flight"
                            value={destinationInput}
                            selected={destinationSuggestion}
                            onValueChange={(next) => {
                                setDestinationInput(next);
                                setDestinationSuggestion(null);
                            }}
                            onSelectSuggestion={setDestinationSuggestion}
                        />
                    </div>

                    <div className="xl:col-span-1 flex justify-center xl:justify-start">
                        <button
                            type="button"
                            onClick={handleSwap}
                            className="h-12 w-12 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors flex items-center justify-center"
                            aria-label="Swap origin and destination"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-3">
                        <label className="space-y-2 md:col-span-1 xl:col-span-1">
                            <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">Depart</span>
                            <span className="relative block">
                                <input
                                    type="date"
                                    value={departureDate}
                                    onChange={(event) => setDepartureDate(event.target.value)}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                                <CalendarDays className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            </span>
                        </label>

                        {tripType === "round_trip" && (
                            <label className="space-y-2 md:col-span-1 xl:col-span-1">
                                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">Return</span>
                                <span className="relative block">
                                    <input
                                        type="date"
                                        value={returnDate}
                                        onChange={(event) => setReturnDate(event.target.value)}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                                    />
                                    <CalendarDays className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                </span>
                            </label>
                        )}

                        <label className="space-y-2 md:col-span-1 xl:col-span-1">
                            <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-500">Adults</span>
                            <span className="relative block">
                                <select
                                    value={adults}
                                    onChange={(event) => setAdults(Number.parseInt(event.target.value, 10) || 1)}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-emerald-400 appearance-none"
                                >
                                    {[1, 2, 3, 4, 5, 6].map((count) => (
                                        <option key={count} value={count}>
                                            {count}
                                        </option>
                                    ))}
                                </select>
                                <Users className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            </span>
                        </label>
                    </div>

                    <div className="xl:col-span-12 flex justify-end">
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                            Search Flights
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-600 p-3 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {results.map((offer) => {
                    const outbound = offer.itineraries[0];
                    const outboundFirst = outbound?.segments[0];
                    const outboundLast = outbound?.segments[outbound.segments.length - 1];
                    const inbound = hasReturn ? offer.itineraries[1] : undefined;
                    const inboundFirst = inbound?.segments[0];
                    const inboundLast = inbound?.segments[inbound.segments.length - 1];

                    if (!outboundFirst || !outboundLast) return null;

                    return (
                        <Card key={offer.id} className="border-slate-200 hover:border-emerald-300 transition-colors">
                            <CardContent className="p-5">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                    <div className="lg:col-span-8 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-slate-900">{outboundFirst.departure.iataCode}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(outboundFirst.departure.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <span className="h-px bg-slate-200 flex-1" />
                                                    <Plane className="w-4 h-4" />
                                                    <span className="h-px bg-slate-200 flex-1" />
                                                </div>
                                                <p className="text-center text-xs text-slate-500 mt-1">
                                                    {formatDuration(outbound.duration)} · {Math.max(outbound.segments.length - 1, 0)} stop(s)
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-slate-900">{outboundLast.arrival.iataCode}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(outboundLast.arrival.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>

                                        {inbound && inboundFirst && inboundLast && (
                                            <div className="pt-3 border-t border-dashed border-slate-200 flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-slate-800">{inboundFirst.departure.iataCode}</p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {new Date(inboundFirst.departure.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 text-slate-300">
                                                        <span className="h-px bg-slate-200 flex-1" />
                                                        <ArrowRightLeft className="w-3 h-3" />
                                                        <span className="h-px bg-slate-200 flex-1" />
                                                    </div>
                                                    <p className="text-center text-[11px] text-slate-500 mt-1">
                                                        Return · {formatDuration(inbound.duration)}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-slate-800">{inboundLast.arrival.iataCode}</p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {new Date(inboundLast.arrival.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-5 flex items-center justify-between lg:justify-end gap-4">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-emerald-600">
                                                {offer.price.currency} {Number.parseFloat(offer.price.total).toLocaleString("en-IN")}
                                            </p>
                                            <p className="text-xs text-slate-500">Total for {adults} adult(s)</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => importFlight(offer)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4"
                                        >
                                            Select
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
