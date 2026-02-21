"use client";

import React from 'react';
import { Plane, Hotel, Plus, Trash2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlightDetails, HotelDetails, Logistics, ItineraryResult } from '@/types/itinerary';

interface LogisticsManagerProps {
    data: ItineraryResult;
    onChange: (newData: ItineraryResult) => void;
}

export function LogisticsManager({ data, onChange }: LogisticsManagerProps) {
    const createEmptyFlight = (): FlightDetails => ({
        id: Math.random().toString(36).substr(2, 9),
        airline: '',
        flight_number: '',
        departure_airport: '',
        arrival_airport: '',
        departure_time: '',
        arrival_time: ''
    });

    const createEmptyHotel = (): HotelDetails => ({
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        address: '',
        check_in: '',
        check_out: ''
    });

    const addFlight = () => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const flights = logistics.flights || [];
        onChange({ ...data, logistics: { ...logistics, flights: [...flights, createEmptyFlight()] } });
    };

    const updateFlight = (idx: number, field: keyof FlightDetails, val: string) => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const flights = [...(logistics.flights || [])];
        flights[idx] = { ...flights[idx], [field]: val };
        onChange({ ...data, logistics: { ...logistics, flights } });
    };

    const removeFlight = (idx: number) => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const flights = [...(logistics.flights || [])];
        flights.splice(idx, 1);
        onChange({ ...data, logistics: { ...logistics, flights } });
    };

    const addHotel = () => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const hotels = logistics.hotels || [];
        onChange({ ...data, logistics: { ...logistics, hotels: [...hotels, createEmptyHotel()] } });
    };

    const updateHotel = (idx: number, field: keyof HotelDetails, val: string) => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const hotels = [...(logistics.hotels || [])];
        hotels[idx] = { ...hotels[idx], [field]: val };
        onChange({ ...data, logistics: { ...logistics, hotels } });
    };

    const removeHotel = (idx: number) => {
        const logistics = data.logistics || { flights: [], hotels: [] };
        const hotels = [...(logistics.hotels || [])];
        hotels.splice(idx, 1);
        onChange({ ...data, logistics: { ...logistics, hotels } });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-500" /> Logistics (Flights & Accommodations)
            </h2>

            {/* Flights */}
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-950/20 p-4 border border-blue-100 dark:border-blue-900/50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Plane className="w-4 h-4" /> Flights
                    </h3>
                    <Button variant="outline" size="sm" onClick={addFlight} className="border-blue-200 hover:bg-blue-50 text-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Flight
                    </Button>
                </div>
                {(data.logistics?.flights || []).map((flight, idx) => (
                    <div key={flight.id} className="grid md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-4 rounded-lg items-start shadow-sm">
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-xs text-gray-500">Airline</label>
                            <Input value={flight.airline} onChange={e => updateFlight(idx, 'airline', e.target.value)} placeholder="E.g. Delta" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs text-gray-500">Flight #</label>
                            <Input value={flight.flight_number} onChange={e => updateFlight(idx, 'flight_number', e.target.value)} placeholder="DL 123" />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-xs text-gray-500">Departure</label>
                            <Input value={flight.departure_airport} onChange={e => updateFlight(idx, 'departure_airport', e.target.value)} placeholder="JFK" />
                            <Input value={flight.departure_time} onChange={e => updateFlight(idx, 'departure_time', e.target.value)} placeholder="Departure Time" />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-xs text-gray-500">Arrival</label>
                            <Input value={flight.arrival_airport} onChange={e => updateFlight(idx, 'arrival_airport', e.target.value)} placeholder="LHR" />
                            <Input value={flight.arrival_time} onChange={e => updateFlight(idx, 'arrival_time', e.target.value)} placeholder="Arrival Time" />
                        </div>
                        <div className="md:col-span-1 pt-6 text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeFlight(idx)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                {(!data.logistics?.flights || data.logistics.flights.length === 0) && (
                    <p className="text-center text-sm text-gray-400 py-4 border-2 border-dashed rounded-lg">No flights added yet.</p>
                )}
            </div>

            {/* Hotels */}
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20 p-4 border border-emerald-100 dark:border-emerald-900/50 rounded-lg">
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <Hotel className="w-4 h-4" /> Hotels & Accommodations
                    </h3>
                    <Button variant="outline" size="sm" onClick={addHotel} className="border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Hotel
                    </Button>
                </div>
                {(data.logistics?.hotels || []).map((hotel, idx) => (
                    <div key={hotel.id} className="grid md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 p-4 rounded-lg items-start shadow-sm">
                        <div className="md:col-span-4 space-y-2">
                            <label className="text-xs text-gray-500">Hotel Name</label>
                            <Input value={hotel.name} onChange={e => updateHotel(idx, 'name', e.target.value)} placeholder="The Plaza" />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                            <label className="text-xs text-gray-500">Address / Location</label>
                            <Input value={hotel.address} onChange={e => updateHotel(idx, 'address', e.target.value)} placeholder="123 5th Ave" />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-xs text-gray-500">Dates</label>
                            <Input value={hotel.check_in} onChange={e => updateHotel(idx, 'check_in', e.target.value)} placeholder="Check in" />
                            <Input value={hotel.check_out} onChange={e => updateHotel(idx, 'check_out', e.target.value)} placeholder="Check out" />
                        </div>
                        <div className="md:col-span-1 pt-6 text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeHotel(idx)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                {(!data.logistics?.hotels || data.logistics.hotels.length === 0) && (
                    <p className="text-center text-sm text-gray-400 py-4 border-2 border-dashed rounded-lg">No hotels added yet.</p>
                )}
            </div>
        </div>
    );
}
