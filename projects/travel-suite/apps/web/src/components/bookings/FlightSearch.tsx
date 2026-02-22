"use client";

import React, { useState } from 'react';
import { Search, Plane, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FlightDetails } from '@/types/itinerary';

interface FlightSearchProps {
    onSelect: (flight: FlightDetails) => void;
    initialDate?: string;
    initialOrigin?: string;
    initialDestination?: string;
}

export function FlightSearch({ onSelect, initialDate, initialOrigin, initialDestination }: FlightSearchProps) {
    const [origin, setOrigin] = useState(initialOrigin || '');
    const [destination, setDestination] = useState(initialDestination || '');
    const [date, setDate] = useState(initialDate || '');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!origin || !destination || !date) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/bookings/flights/search?originCode=${origin}&destinationCode=${destination}&date=${date}`);
            const data = await res.json();
            if (data.data) {
                setResults(data.data);
            } else {
                setError(data.error || 'No flights found');
            }
        } catch (err) {
            setError('Failed to fetch flights');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (pt: string) => pt.replace('PT', '').toLowerCase();

    const importFlight = (offer: any) => {
        const segment = offer.itineraries[0].segments[0];
        const flight: FlightDetails = {
            id: offer.id,
            airline: segment.carrierCode, // In a real app, map code to name
            flight_number: `${segment.carrierCode}${segment.number}`,
            departure_airport: segment.departure.iataCode,
            arrival_airport: segment.arrival.iataCode,
            departure_time: segment.departure.at,
            arrival_time: segment.arrival.at,
            price: parseFloat(offer.price.total),
            currency: offer.price.currency,
            source: 'amadeus',
        };
        onSelect(flight);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Origin (IATA)</label>
                    <Input placeholder="DEL" value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} maxLength={3} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Destination (IATA)</label>
                    <Input placeholder="BOM" value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} maxLength={3} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Date</label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                    <Button onClick={handleSearch} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                        Search Flights
                    </Button>
                </div>
            </div>

            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {results.map((offer) => {
                    const itin = offer.itineraries[0];
                    const firstSeg = itin.segments[0];
                    const lastSeg = itin.segments[itin.segments.length - 1];

                    return (
                        <Card key={offer.id} className="hover:border-blue-200 transition-colors shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="text-center">
                                            <div className="text-xl font-bold">{firstSeg.departure.iataCode}</div>
                                            <div className="text-[10px] text-gray-400">{new Date(firstSeg.departure.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>

                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="text-[10px] text-gray-400 mb-1">{formatDuration(itin.duration)}</div>
                                            <div className="relative w-full border-t border-dashed border-gray-300 flex justify-center">
                                                <Plane className="w-4 h-4 absolute -top-2 bg-white px-1 text-gray-400" />
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1">{itin.segments.length - 1} stops</div>
                                        </div>

                                        <div className="text-center">
                                            <div className="text-xl font-bold">{lastSeg.arrival.iataCode}</div>
                                            <div className="text-[10px] text-gray-400">{new Date(lastSeg.arrival.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 border-l pl-6 border-gray-100">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-emerald-600">₹{parseFloat(offer.price.total).toLocaleString('en-IN')}</div>
                                            <div className="text-[10px] text-gray-400">Total for 1 Adult</div>
                                        </div>
                                        <Button size="sm" onClick={() => importFlight(offer)} className="bg-emerald-500 hover:bg-emerald-600">
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
