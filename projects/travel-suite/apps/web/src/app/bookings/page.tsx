"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Compass,
    Hotel,
    Plane,
    ShieldCheck,
    Sparkles,
    Waves,
} from "lucide-react";
import { FlightSearch } from "@/components/bookings/FlightSearch";
import { HotelSearch } from "@/components/bookings/HotelSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlightDetails, HotelDetails } from "@/types/itinerary";

interface ItineraryOption {
    id: string;
    trip_title: string;
    destination: string;
    duration_days: number | null;
    created_at: string | null;
}

export default function BookingsPage() {
    const [itineraries, setItineraries] = useState<ItineraryOption[]>([]);
    const [selectedItineraryId, setSelectedItineraryId] = useState("");
    const [loadingItineraries, setLoadingItineraries] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState("");
    const [lastImported, setLastImported] = useState<{
        type: "flight" | "hotel";
        name: string;
        itineraryTitle: string;
    } | null>(null);

    useEffect(() => {
        const loadItineraries = async () => {
            setLoadingItineraries(true);
            setImportError("");
            try {
                const res = await fetch("/api/itineraries");
                const json = await res.json();
                if (!res.ok) {
                    throw new Error(json.error || "Failed to load itineraries");
                }
                const nextItineraries: ItineraryOption[] = json.itineraries ?? [];
                setItineraries(nextItineraries);
                if (nextItineraries.length > 0) {
                    setSelectedItineraryId((prev) => prev || nextItineraries[0].id);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to load itineraries";
                setImportError(message);
            } finally {
                setLoadingItineraries(false);
            }
        };

        loadItineraries();
    }, []);

    const selectedItinerary = useMemo(
        () => itineraries.find((item) => item.id === selectedItineraryId) ?? null,
        [itineraries, selectedItineraryId]
    );

    const importToItinerary = async (
        type: "flight" | "hotel",
        payload: FlightDetails | HotelDetails,
        displayName: string
    ) => {
        if (!selectedItineraryId) {
            setImportError("Select an itinerary before importing bookings.");
            return;
        }

        setImporting(true);
        setImportError("");
        try {
            const res = await fetch(`/api/itineraries/${selectedItineraryId}/bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(type === "flight" ? { type, flight: payload } : { type, hotel: payload }),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || "Import failed");
            }

            setLastImported({
                type,
                name: displayName,
                itineraryTitle: selectedItinerary?.trip_title || "Selected itinerary",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Import failed";
            setImportError(message);
        } finally {
            setImporting(false);
        }
    };

    const handleFlightSelect = async (flight: FlightDetails) => {
        await importToItinerary("flight", flight, `${flight.airline} ${flight.flight_number}`);
        setTimeout(() => setLastImported(null), 5000);
    };

    const handleHotelSelect = async (hotel: HotelDetails) => {
        await importToItinerary("hotel", hotel, hotel.name);
        setTimeout(() => setLastImported(null), 5000);
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(1200px_500px_at_5%_-10%,rgba(16,185,129,0.18),transparent),radial-gradient(1000px_500px_at_95%_0%,rgba(14,116,144,0.14),transparent),linear-gradient(180deg,#f8fbff_0%,#f3f7fb_55%,#edf3f9_100%)] pb-24">
            <section className="relative overflow-hidden px-6 pt-14 pb-16">
                <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-emerald-300/30 blur-3xl" />
                <div className="pointer-events-none absolute top-10 -right-20 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />

                <div className="max-w-7xl mx-auto relative">
                    <div className="grid lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-8 space-y-5">
                            <Badge className="border-none bg-emerald-100 text-emerald-700 uppercase tracking-[0.14em] text-[10px] font-extrabold px-3 py-1.5">
                                Premium Booking Console
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-serif leading-[1.02] tracking-tight text-slate-900">
                                Flights and Hotels,
                                <span className="block text-emerald-600 italic">stitched into every itinerary</span>
                            </h1>
                            <p className="text-base md:text-lg text-slate-600 max-w-2xl">
                                Smart location suggestions, one-way and round-trip flight shopping, and hotel discovery by destination.
                                Select any result and push it directly into the client itinerary.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    <Compass className="w-3.5 h-3.5 text-emerald-500" />
                                    Global IATA + city autocomplete
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    <Waves className="w-3.5 h-3.5 text-cyan-500" />
                                    Round-trip fare discovery
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                    Import-ready travel records
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <div className="rounded-3xl border border-white/80 bg-white/75 backdrop-blur p-6 shadow-2xl shadow-slate-900/10 space-y-4">
                                <p className="text-xs uppercase tracking-[0.14em] font-bold text-slate-400">Import Target</p>
                                <label className="text-sm font-semibold text-slate-800">
                                    Choose itinerary to receive selected bookings
                                </label>
                                <select
                                    value={selectedItineraryId}
                                    onChange={(event) => setSelectedItineraryId(event.target.value)}
                                    disabled={loadingItineraries || itineraries.length === 0}
                                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
                                >
                                    {loadingItineraries && <option>Loading itineraries...</option>}
                                    {!loadingItineraries && itineraries.length === 0 && (
                                        <option value="">No saved itineraries found</option>
                                    )}
                                    {itineraries.map((itinerary) => (
                                        <option key={itinerary.id} value={itinerary.id}>
                                            {itinerary.trip_title} - {itinerary.destination}
                                        </option>
                                    ))}
                                </select>
                                {itineraries.length === 0 && !loadingItineraries && (
                                    <p className="text-xs text-slate-500">
                                        Save an itinerary from Planner first, then import bookings here.
                                    </p>
                                )}
                                {importError && <p className="text-xs text-rose-500">{importError}</p>}

                                <div className="flex gap-2 pt-2">
                                    <Link
                                        href={selectedItineraryId ? `/trips/${selectedItineraryId}` : "/trips"}
                                        className="flex-1 inline-flex justify-center items-center h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
                                    >
                                        Open Itinerary
                                    </Link>
                                    <Link
                                        href="/planner"
                                        className="flex-1 inline-flex justify-center items-center h-11 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                                    >
                                        Create New
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-6">
                <div className="max-w-7xl mx-auto">
                    <Tabs defaultValue="flights" className="space-y-8">
                        <TabsList className="h-14 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-lg shadow-slate-900/5">
                            <TabsTrigger
                                value="flights"
                                className="h-full rounded-xl px-6 gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-semibold"
                            >
                                <Plane className="w-4 h-4" />
                                Flights
                            </TabsTrigger>
                            <TabsTrigger
                                value="hotels"
                                className="h-full rounded-xl px-6 gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white font-semibold"
                            >
                                <Hotel className="w-4 h-4" />
                                Hotels
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="flights" className="focus-visible:outline-none">
                            <Card className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur shadow-2xl shadow-slate-900/10 overflow-hidden">
                                <CardHeader className="pb-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-white to-cyan-50/50">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                                            <Plane className="w-4 h-4" />
                                        </span>
                                        <CardTitle className="text-2xl font-serif text-slate-900">Aviation Desk</CardTitle>
                                    </div>
                                    <CardDescription className="text-slate-600">
                                        Search with city names or IATA codes, compare one-way and round-trip options, then import in one click.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <FlightSearch onSelect={handleFlightSelect} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="hotels" className="focus-visible:outline-none">
                            <Card className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur shadow-2xl shadow-slate-900/10 overflow-hidden">
                                <CardHeader className="pb-5 border-b border-slate-100 bg-gradient-to-r from-cyan-50/70 via-white to-emerald-50/40">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="h-9 w-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
                                            <Hotel className="w-4 h-4" />
                                        </span>
                                        <CardTitle className="text-2xl font-serif text-slate-900">Stay Finder</CardTitle>
                                    </div>
                                    <CardDescription className="text-slate-600">
                                        Search hotels by destination, adjust stay dates and radius, and push selected properties to your itinerary.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <HotelSearch onSelect={handleHotelSelect} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>

            {lastImported && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <div className="rounded-2xl border border-white/20 bg-slate-900 text-white px-5 py-4 shadow-2xl flex items-center gap-4">
                        <span className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                        </span>
                        <div>
                            <p className="text-sm font-bold">
                                {lastImported.type === "flight" ? "Flight imported" : "Hotel imported"}
                            </p>
                            <p className="text-xs text-white/70">
                                &quot;{lastImported.name}&quot; added to &quot;{lastImported.itineraryTitle}&quot;.
                            </p>
                        </div>
                        <Link
                            href={selectedItineraryId ? `/trips/${selectedItineraryId}` : "/trips"}
                            className="text-emerald-300 text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                            {importing ? "Importing..." : "Open trip"} <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
}
