"use client";
import React, { useState, useEffect } from 'react';
import { Activity, Day } from '@/types/itinerary';
import { ItineraryTemplateProps } from './types';
import { MapPin, Clock, DollarSign, Navigation, Info, ArrowUpRight, Plane } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const LuxuryResortView: React.FC<ItineraryTemplateProps> = ({ itinerary, client }) => {
    const brandColor = itinerary.branding?.primaryColor || '#ccb27a'; // Champagne Gold
    const [currentBg, setCurrentBg] = useState<string>('');

    // Default hero image or first available activity image
    const heroImage = itinerary.days?.[0]?.activities?.[0]?.image || itinerary.days?.[0]?.activities?.[0]?.imageUrl || '';

    useEffect(() => {
        if (!currentBg && heroImage) {
            setCurrentBg(heroImage);
        }
    }, [heroImage, currentBg]);

    const handleHover = (imageSrc?: string) => {
        if (imageSrc) setCurrentBg(imageSrc);
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white/20 font-sans overflow-hidden relative rounded-3xl shadow-2xl border border-white/10">
            {/* Dynamic Background Image */}
            <div
                className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
                style={{
                    backgroundImage: `url(${currentBg || "https://images.unsplash.com/photo-1542314831-c6a4d1409322?q=80&w=2560&auto=format&fit=crop"})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed', // Keep the parallax feel inside the container 
                    filter: 'brightness(0.3) blur(2px)' // dark and slightly blurred for text contrast
                }}
            />

            {/* Content Container */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">

                {/* Hero Section */}
                <div className="mb-32 max-w-3xl">
                    <p className="tracking-[0.4em] text-sm uppercase mb-4 opacity-70" style={{ color: brandColor }}>
                        VIP Experience
                    </p>
                    <h1 className="text-6xl md:text-8xl font-serif mb-6 leading-[1.1] tracking-tight">
                        {itinerary.trip_title || 'The Escape'}
                    </h1>
                    {client && (
                        <div className="mb-10 animate-in fade-in slide-in-from-left duration-1000">
                            <h2 className="text-2xl md:text-3xl font-serif mb-3 italic" style={{ color: brandColor }}>
                                Prepared exclusively for {client.name}
                            </h2>
                            {(client.email || client.phone) && (
                                <div className="flex gap-6 text-sm font-light tracking-[0.2em] opacity-50 uppercase">
                                    {client.email && <span>{client.email}</span>}
                                    {client.phone && <span>{client.phone}</span>}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-6 text-lg sm:text-xl font-light opacity-80 mb-8">
                        {itinerary.destination && (
                            <span className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" /> {itinerary.destination}
                            </span>
                        )}
                        <span>•</span>
                        <span>{itinerary.duration_days} Nights</span>
                    </div>

                    {itinerary.summary && (
                        <p className="text-xl leading-relaxed font-light text-white/70 max-w-2xl">
                            {itinerary.summary}
                        </p>
                    )}
                </div>

                {/* Logistics */}
                {itinerary.logistics && (
                    <div className="mb-24 space-y-8">
                        {/* Flights Glass Card */}
                        {itinerary.logistics.flights && itinerary.logistics.flights.length > 0 && (
                            <div className="rounded-3xl p-8 backdrop-blur-xl bg-black/40 border border-white/10">
                                <h3 className="text-2xl font-serif mb-6 flex items-center gap-3">
                                    <Plane className="w-6 h-6" style={{ color: brandColor }} /> Privé Flights
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {itinerary.logistics.flights.map(flight => (
                                        <div key={flight.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="font-serif text-xl">{flight.airline}</div>
                                                <div className="text-sm font-light tracking-widest text-white/50">{flight.flight_number}</div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-2xl font-light">{flight.departure_airport}</div>
                                                    <div className="text-sm text-white/50 mt-1">{flight.departure_time}</div>
                                                </div>
                                                <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-light">{flight.arrival_airport}</div>
                                                    <div className="text-sm text-white/50 mt-1">{flight.arrival_time}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hotels Glass Card */}
                        {itinerary.logistics.hotels && itinerary.logistics.hotels.length > 0 && (
                            <div className="rounded-3xl p-8 backdrop-blur-xl bg-black/40 border border-white/10">
                                <h3 className="text-2xl font-serif mb-6 flex items-center gap-3">
                                    <MapPin className="w-6 h-6" style={{ color: brandColor }} /> Exclusive Stays
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {itinerary.logistics.hotels.map(hotel => (
                                        <div key={hotel.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="font-serif text-xl mb-2">{hotel.name}</div>
                                            <div className="text-sm text-white/50 mb-6 font-light">{hotel.address}</div>
                                            <div className="flex justify-between border-t border-white/10 pt-4 text-sm font-light">
                                                <div><span className="uppercase tracking-widest text-[10px] text-white/40 block mb-1">Check In</span>{hotel.check_in}</div>
                                                <div className="text-right"><span className="uppercase tracking-widest text-[10px] text-white/40 block mb-1">Check Out</span>{hotel.check_out}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Days Grid - Glassmorphism style */}
                <div className="space-y-24">
                    {itinerary.days?.map((day: Day, dayIndex: number) => (
                        <div key={dayIndex} className="relative">

                            {/* Day Header */}
                            <div className="mb-12 border-b border-white/20 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-4xl font-serif text-white mb-2">
                                        Day {day.day_number}: <span className="font-light" style={{ color: brandColor }}>{day.theme}</span>
                                    </h2>
                                    {day.date && (
                                        <p className="text-white/50 tracking-widest text-sm uppercase">
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Activities Glass Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {day.activities?.map((activity: Activity, actIndex: number) => {
                                    const image = activity.image || activity.imageUrl;
                                    return (
                                        <div
                                            key={actIndex}
                                            className="group relative rounded-2xl overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                                            onMouseEnter={() => handleHover(image)}
                                        >
                                            {/* Thumbnail Image inside card */}
                                            {image && (
                                                <div className="h-48 w-full overflow-hidden">
                                                    <img
                                                        src={image}
                                                        alt={activity.title}
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-105"
                                                        onError={(e) => {
                                                            e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                                                            e.currentTarget.onerror = null;
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge className="bg-white/10 text-white hover:bg-white/20 border-0 font-light backdrop-blur-3xl">
                                                        <Clock className="w-3 h-3 mr-1.5 inline" /> {activity.time || 'Flexible'}
                                                    </Badge>
                                                    <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" style={{ color: brandColor }} />
                                                </div>

                                                <h3 className="text-2xl font-serif mb-3 pr-4 leading-tight">
                                                    {activity.title}
                                                </h3>

                                                <p className="text-white/60 text-sm leading-relaxed mb-6 line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                                                    {activity.description}
                                                </p>

                                                <div className="flex flex-wrap gap-4 text-xs font-light text-white/50 pt-4 border-t border-white/10">
                                                    {activity.duration && <span>{activity.duration}</span>}
                                                    {activity.cost && <span>{activity.cost}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    ))}
                </div>

                {/* Footer/Tips */}
                {itinerary.tips && itinerary.tips.length > 0 && (
                    <div className="mt-32 p-12 rounded-3xl backdrop-blur-xl bg-black/40 border border-white/10 inline-block w-full">
                        <div className="flex items-center gap-4 mb-8">
                            <Info className="w-8 h-8" style={{ color: brandColor }} />
                            <h2 className="text-3xl font-serif">Concierge Notes</h2>
                        </div>
                        <ul className="grid md:grid-cols-2 gap-8 text-white/70 font-light leading-relaxed">
                            {itinerary.tips.map((tip: string, i: number) => (
                                <li key={i} className="flex gap-4 items-start">
                                    <span style={{ color: brandColor }}>—</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LuxuryResortView;
