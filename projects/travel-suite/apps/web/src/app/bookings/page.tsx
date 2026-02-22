"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Plane, Hotel, Sparkles, Globe, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";
import { FlightSearch } from '@/components/bookings/FlightSearch';
import { HotelSearch } from '@/components/bookings/HotelSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlightDetails, HotelDetails } from '@/types/itinerary';

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
        type: 'flight' | 'hotel';
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

    const importToItinerary = async (type: "flight" | "hotel", payload: FlightDetails | HotelDetails, displayName: string) => {
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
                body: JSON.stringify(
                    type === "flight"
                        ? { type, flight: payload }
                        : { type, hotel: payload }
                ),
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
        <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-20">
            {/* Hero Section */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/5 pt-16 pb-20 px-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-6xl mx-auto relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4 max-w-2xl">
                            <Badge className="bg-primary/10 text-primary border-none text-xs font-bold uppercase tracking-widest px-3 py-1">
                                Powered by Amadeus API
                            </Badge>
                            <h1 className="text-5xl md:text-6xl font-serif text-secondary tracking-tight">
                                Travel <span className="text-primary italic">Concierge</span>
                            </h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400 font-light max-w-lg leading-relaxed">
                                Experience professional-grade booking tools. Search live inventory for flights and luxury accommodations worldwide.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col items-center text-center space-y-2">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase">Global Reach</span>
                                <span className="text-sm font-semibold">400+ Airlines</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 flex flex-col items-center text-center space-y-2">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase">Verified</span>
                                <span className="text-sm font-semibold">Live Availability</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-10">
                <Card className="mb-6 border-gray-100 dark:border-white/10 bg-white dark:bg-slate-900/70 shadow-lg">
                    <CardContent className="p-5 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
                            <div className="flex-1 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Import Destination</p>
                                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Select itinerary to receive selected flight/hotel details
                                </label>
                                <select
                                    value={selectedItineraryId}
                                    onChange={(event) => setSelectedItineraryId(event.target.value)}
                                    disabled={loadingItineraries || itineraries.length === 0}
                                    className="w-full h-11 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                >
                                    {loadingItineraries && <option>Loading itineraries...</option>}
                                    {!loadingItineraries && itineraries.length === 0 && (
                                        <option value="">No saved itineraries found</option>
                                    )}
                                    {itineraries.map((itinerary) => (
                                        <option key={itinerary.id} value={itinerary.id}>
                                            {itinerary.trip_title} · {itinerary.destination}
                                        </option>
                                    ))}
                                </select>
                                {itineraries.length === 0 && !loadingItineraries && (
                                    <p className="text-xs text-gray-500">
                                        Save an itinerary first from the planner to enable imports.
                                    </p>
                                )}
                                {importError && (
                                    <p className="text-xs text-red-500">{importError}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedItineraryId ? (
                                    <Link
                                        href={`/trips/${selectedItineraryId}`}
                                        className="inline-flex h-11 items-center rounded-lg border border-gray-200 dark:border-white/10 px-4 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Open Itinerary
                                    </Link>
                                ) : (
                                    <Link
                                        href="/planner"
                                        className="inline-flex h-11 items-center rounded-lg border border-gray-200 dark:border-white/10 px-4 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Create Itinerary
                                    </Link>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="flights" className="space-y-8">
                    <TabsList className="bg-white dark:bg-slate-900 p-1.5 h-16 rounded-2xl shadow-xl border border-gray-100 dark:border-white/5 w-full md:w-auto overflow-hidden">
                        <TabsTrigger
                            value="flights"
                            className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2"
                        >
                            <Plane className="w-4 h-4" />
                            <span className="font-semibold">Flight Search</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="hotels"
                            className="rounded-xl px-8 h-full data-[state=active]:bg-secondary data-[state=active]:text-white transition-all gap-2"
                        >
                            <Hotel className="w-4 h-4" />
                            <span className="font-semibold">Hotel Search</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="flights" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-2xl shadow-blue-900/5 bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10 p-8 border-b border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                        <Plane className="w-4 h-4 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl font-serif">Aviation Portal</CardTitle>
                                </div>
                                <CardDescription className="text-base">Find and compare the best flight deals across global carriers.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <FlightSearch onSelect={handleFlightSelect} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hotels" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-2xl shadow-emerald-900/5 bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10 p-8 border-b border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                                        <Hotel className="w-4 h-4 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl font-serif">Global Stays</CardTitle>
                                </div>
                                <CardDescription className="text-base">Search millions of properties, from boutique hotels to luxury resorts.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <HotelSearch onSelect={handleHotelSelect} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Success Toast / Notification */}
            {lastImported && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Successfully Selected!</p>
                            <p className="text-xs opacity-70">
                                &quot;{lastImported.name}&quot; was imported to &quot;{lastImported.itineraryTitle}&quot;.
                            </p>
                        </div>
                        <div className="ml-4 pl-4 border-l border-white/20">
                            <Link
                                href={selectedItineraryId ? `/trips/${selectedItineraryId}` : "/trips"}
                                className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                            >
                                {importing ? "Importing..." : "Open Trip"} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Secondary Sections */}
            <div className="max-w-6xl mx-auto px-6 mt-16 grid md:grid-cols-3 gap-8">
                <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm rounded-2xl p-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-bold">Transparent Pricing</h4>
                    <p className="text-sm text-gray-500">No hidden fees. We fetch live data directly from Amadeus so you get the best rates.</p>
                </Card>
                <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm rounded-2xl p-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-bold">AI Recommendations</h4>
                    <p className="text-sm text-gray-500">Our system analyzes your interests to highlight hotels you&apos;ll actually love.</p>
                </Card>
                <Card className="bg-white/50 dark:bg-white/5 border-none shadow-sm rounded-2xl p-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-bold">24/7 Connectivity</h4>
                    <p className="text-sm text-gray-500">Direct integration with the world&apos;s leading GDS systems for instant confirmation.</p>
                </Card>
            </div>
        </main>
    );
}
