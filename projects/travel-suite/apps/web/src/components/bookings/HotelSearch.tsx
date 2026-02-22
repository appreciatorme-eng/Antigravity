"use client";

import React, { useState } from 'react';
import { Search, Hotel, Star, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { HotelDetails } from '@/types/itinerary';

interface HotelSearchProps {
    onSelect: (hotel: HotelDetails) => void;
    initialCity?: string;
}

export function HotelSearch({ onSelect, initialCity }: HotelSearchProps) {
    const [city, setCity] = useState(initialCity || '');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!city) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/bookings/hotels/search?cityCode=${city}`);
            const data = await res.json();
            if (data.data) {
                setResults(data.data);
            } else {
                setError(data.error || 'No hotels found');
            }
        } catch (err) {
            setError('Failed to fetch hotels');
        } finally {
            setLoading(false);
        }
    };

    const importHotel = (h: any) => {
        const hotel: HotelDetails = {
            id: h.hotelId,
            name: h.name,
            address: h.iataCode,
            check_in: new Date().toISOString().split('T')[0],
            check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            source: 'amadeus',
        };
        onSelect(hotel);
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">City Code (IATA)</label>
                    <Input placeholder="E.g. DEL, BOM, LHR" value={city} onChange={e => setCity(e.target.value.toUpperCase())} maxLength={3} />
                </div>
                <div className="flex items-end">
                    <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                        Search Hotels
                    </Button>
                </div>
            </div>

            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}

            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {results.map((h) => (
                    <Card key={h.hotelId} className="hover:border-blue-200 transition-colors shadow-sm cursor-pointer group" onClick={() => importHotel(h)}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <Hotel className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{h.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <MapPin className="w-3 h-3" /> {h.iataCode}
                                        <span className="flex items-center gap-0.5 text-amber-500 ml-2">
                                            <Star className="w-3 h-3 fill-current" />
                                            <Star className="w-3 h-3 fill-current" />
                                            <Star className="w-3 h-3 fill-current" />
                                            <Star className="w-3 h-3 fill-current" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" className="text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                Select
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
