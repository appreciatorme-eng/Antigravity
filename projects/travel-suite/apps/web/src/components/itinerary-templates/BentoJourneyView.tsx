"use client";
import React from 'react';
import { Activity, Day } from '@/types/itinerary';
import { ItineraryTemplateProps } from './types';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const BentoJourneyView: React.FC<ItineraryTemplateProps> = ({ itinerary, client }) => {
    const brandColor = itinerary.branding?.primaryColor || '#6366f1'; // Indigo 

    return (
        <div className="bg-[#f0f2f5] min-h-screen text-slate-900 font-sans p-4 md:p-8 xl:p-12">
            {/* Minimalist Header */}
            <div className="max-w-7xl mx-auto mb-16 pt-8 text-center md:text-left">
                <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 border-slate-300 text-slate-500 font-medium tracking-widest uppercase text-xs">
                    Immersive Travel Grid
                </Badge>
                <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 mb-4">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-950 leading-[0.95] max-w-4xl">
                            {itinerary.trip_title || itinerary.title}
                        </h1>
                        {client && (
                            <h2 className="text-xl md:text-2xl font-medium tracking-wide text-slate-500 mt-4 uppercase">
                                For: {client.name}
                            </h2>
                        )}
                    </div>
                </div>
                {itinerary.summary && (
                    <p className="text-xl md:text-2xl font-light leading-snug text-slate-600 max-w-3xl mt-6">
                        {itinerary.summary}
                    </p>
                )}
            </div>

            {/* Bento Grid Layout */}
            <div className="max-w-7xl mx-auto space-y-24">
                {itinerary.days?.map((day: Day, dayIndex: number) => (
                    <div key={dayIndex} className="relative">
                        {/* Day Header */}
                        <div className="mb-8 flex flex-col md:flex-row gap-4 items-baseline justify-between border-b border-slate-200 pb-6">
                            <div className="flex items-center gap-4">
                                <span
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                                    style={{ backgroundColor: brandColor }}
                                >
                                    {day.day_number}
                                </span>
                                <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                                    {day.theme}
                                </h3>
                            </div>
                            {day.date && (
                                <p className="text-sm font-medium tracking-widest uppercase text-slate-400">
                                    {new Date(day.date).toLocaleDateString()}
                                </p>
                            )}
                        </div>

                        {/* Activities Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[250px] lg:auto-rows-[300px]">
                            {day.activities?.map((activity: Activity, actIndex: number) => {
                                const image = activity.image || activity.imageUrl;

                                // Dynamic spanning to create a Bento box feel
                                // Every 1st and arguably 6th item should be large, others small
                                const isHero = actIndex % 5 === 0;
                                const spanClasses = isHero
                                    ? "md:col-span-2 lg:col-span-2 md:row-span-2"
                                    : "md:col-span-1 lg:col-span-1 md:row-span-1";

                                return (
                                    <div
                                        key={actIndex}
                                        className={`group relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-500 ease-out border border-white/20 ${spanClasses}`}
                                    >
                                        {/* Background Image / Fill */}
                                        {image ? (
                                            <>
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                                                    style={{ backgroundImage: `url(${image})` }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 bg-slate-100" />
                                        )}

                                        {/* Card Content Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col justify-end h-full text-white">

                                            {/* Time Badge - top right in layout */}
                                            {activity.time && (
                                                <div className="absolute top-6 right-6">
                                                    <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-widest text-white border border-white/20">
                                                        {activity.time}
                                                    </span>
                                                </div>
                                            )}

                                            <div className={`transform transition-transform duration-500 will-change-transform ${isHero ? 'translate-y-8 group-hover:translate-y-0' : 'translate-y-0'}`}>
                                                <h4 className={`${isHero ? 'text-3xl md:text-5xl' : 'text-xl md:text-2xl'} font-bold mb-3 leading-tight tracking-tight`}>
                                                    {activity.title}
                                                </h4>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {activity.location && (
                                                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-none shadow-none rounded-lg px-2.5 py-1 font-medium">
                                                            <MapPin className="w-3 h-3 mr-1" /> {activity.location}
                                                        </Badge>
                                                    )}
                                                    {activity.duration && !isHero && (
                                                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-none shadow-none rounded-lg px-2.5 py-1 font-medium">
                                                            <Clock className="w-3 h-3 mr-1" /> {activity.duration}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <p className={`font-light text-white/80 leading-relaxed ${isHero ? 'text-lg line-clamp-3 md:line-clamp-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100' : 'text-sm line-clamp-2'} `}>
                                                    {activity.description}
                                                </p>

                                                {isHero && activity.transport && (
                                                    <div className="mt-6 pt-6 border-t border-white/20 flex items-center gap-3 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                                        <Navigation className="w-4 h-4" />
                                                        <span className="font-medium text-sm">Transport: {activity.transport}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Preparation Details */}
            {itinerary.tips && itinerary.tips.length > 0 && (
                <div className="max-w-7xl mx-auto mt-24 pt-16 border-t border-slate-300">
                    <h2 className="text-2xl font-bold tracking-tight mb-8 text-slate-800 uppercase">
                        Traveler Insights
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itinerary.tips.map((tip: string, index: number) => (
                            <div key={index} className="bg-white p-6 rounded-[1.5rem] shadow-sm flex flex-col gap-4 border border-slate-100">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner" style={{ backgroundColor: brandColor }}>
                                    {index + 1}
                                </div>
                                <p className="text-slate-600 font-medium leading-relaxed">
                                    {tip}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BentoJourneyView;
