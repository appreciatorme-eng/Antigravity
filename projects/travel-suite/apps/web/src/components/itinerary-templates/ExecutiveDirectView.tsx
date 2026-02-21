"use client";
import React, { useState, useEffect } from 'react';
import { Activity, Day } from '@/types/itinerary';
import { ItineraryTemplateProps } from './types';
import { MapPin, Navigation, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ExecutiveDirectView: React.FC<ItineraryTemplateProps> = ({ itinerary }) => {
    const brandColor = itinerary.branding?.primaryColor || '#0ea5e9'; // Sky Blue
    const [activeImage, setActiveImage] = useState<string>('');
    const defaultHeroImage = itinerary.days?.[0]?.activities?.[0]?.image || itinerary.days?.[0]?.activities?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=2560&auto=format&fit=crop';

    useEffect(() => {
        setActiveImage(defaultHeroImage);
    }, [defaultHeroImage]);

    return (
        <div className="bg-white text-zinc-900 font-sans min-h-screen flex flex-col md:flex-row">
            {/* LEFT HALF - STICKY IMAGE PANEL (Hidden on small screens, shown full on desktop) */}
            <div className="w-full h-[50vh] md:w-[45vw] md:h-screen md:sticky md:top-0 order-1 md:order-1 overflow-hidden bg-zinc-100 flex-shrink-0 relative group">
                <img
                    src={activeImage}
                    alt="Current Itinerary Focus"
                    className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent pointer-events-none" />

                {itinerary.branding?.logoUrl && (
                    <img
                        src={itinerary.branding.logoUrl}
                        alt="Logo"
                        className="absolute top-8 left-8 h-12 w-auto filter brightness-0 invert drop-shadow-sm opacity-90"
                    />
                )}

                <div className="absolute bottom-12 left-8 md:left-12 max-w-sm">
                    <Badge variant="outline" className="text-white border-white/40 mb-4 bg-black/20 backdrop-blur-md">
                        Executive Program
                    </Badge>
                    <h2 className="text-4xl font-semibold text-white tracking-tight drop-shadow-sm leading-tight">
                        {itinerary.destination || 'Global Voyage'}
                    </h2>
                </div>
            </div>

            {/* RIGHT HALF - SCROLLING CONTENT */}
            <div className="w-full md:w-[55vw] order-2 md:order-2 px-6 py-12 md:px-20 md:py-24 bg-white">

                {/* Header Section */}
                <div className="mb-24">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-zinc-950 leading-[0.95]">
                        {itinerary.trip_title || itinerary.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-zinc-500 mb-8 border-b border-zinc-200 pb-8">
                        <span className="font-medium tracking-wide text-zinc-900 uppercase text-sm">
                            Duration: <span style={{ color: brandColor }}>{itinerary.duration_days} Days</span>
                        </span>
                        {itinerary.destination && (
                            <>
                                <span className="text-zinc-300">|</span>
                                <span className="flex items-center gap-1.5 font-medium tracking-wide uppercase text-sm">
                                    <MapPin className="w-4 h-4" /> {itinerary.destination}
                                </span>
                            </>
                        )}
                    </div>

                    {itinerary.summary && (
                        <p className="text-2xl font-light leading-snug text-zinc-600 max-w-2xl">
                            {itinerary.summary}
                        </p>
                    )}
                </div>

                {/* Days Overview */}
                <div className="space-y-0">
                    {itinerary.days?.map((day: Day, dayIndex: number) => (
                        <div key={dayIndex} className="border-t border-zinc-200 py-16 group/day">

                            <div className="flex flex-col md:flex-row gap-6 mb-12">
                                <div className="md:w-1/4">
                                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
                                        Day {day.day_number}
                                    </div>
                                    <h3
                                        className="text-3xl font-semibold text-zinc-900 leading-tight transition-colors"
                                        style={{ color: brandColor }}
                                    >
                                        {day.theme}
                                    </h3>
                                    {day.date && (
                                        <p className="text-sm font-mono text-zinc-500 mt-2">
                                            {new Date(day.date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className="md:w-3/4">
                                    {day.summary && (
                                        <p className="text-lg text-zinc-600 font-light leading-relaxed">
                                            {day.summary}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Activities Timeline Block */}
                            <div className="relative border-l border-zinc-200 ml-2 md:ml-4 pl-8 md:pl-16 space-y-16">
                                {day.activities?.map((activity: Activity, actIndex: number) => {
                                    const image = activity.image || activity.imageUrl;

                                    return (
                                        <div
                                            key={actIndex}
                                            className="relative group cursor-pointer"
                                            onMouseEnter={() => {
                                                if (image) setActiveImage(image);
                                            }}
                                        >
                                            {/* Node point */}
                                            <div
                                                className="absolute -left-[37px] md:-left-[69px] top-1.5 w-[9px] h-[9px] rounded-full border-2 border-white transition-colors duration-300"
                                                style={{ backgroundColor: brandColor, outlineColor: brandColor }}
                                            />

                                            <div className="flex flex-col xl:flex-row gap-6 items-start justify-between">
                                                <div className="flex-1 max-w-md">
                                                    {activity.time && (
                                                        <div className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: brandColor }}>
                                                            {activity.time}
                                                        </div>
                                                    )}

                                                    <h4 className="text-2xl font-bold text-zinc-900 mb-3 group-hover:text-zinc-600 transition-colors">
                                                        {activity.title}
                                                    </h4>

                                                    <p className="text-zinc-500 leading-relaxed font-light">
                                                        {activity.description}
                                                    </p>
                                                </div>

                                                {/* Meta blocks */}
                                                <div className="flex flex-col gap-3 min-w-[140px] pt-2">
                                                    {activity.location && (
                                                        <div className="bg-zinc-100 rounded-md px-4 py-2 text-xs font-semibold text-zinc-600 flex items-center justify-between">
                                                            <span>Location</span> <MapPin className="w-3 h-3 text-zinc-400" />
                                                        </div>
                                                    )}
                                                    {activity.transport && (
                                                        <div className="bg-zinc-100 rounded-md px-4 py-2 text-xs font-semibold text-zinc-600 flex items-center justify-between">
                                                            <span>Transit</span> <Navigation className="w-3 h-3 text-zinc-400" />
                                                        </div>
                                                    )}
                                                    {activity.duration && (
                                                        <div className="bg-zinc-100 rounded-md px-4 py-2 text-xs font-semibold text-zinc-600 flex items-center justify-between">
                                                            <span>Duration</span> <span className="text-zinc-400 font-mono tracking-tight">{activity.duration}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Arrow visual hint for interactive image updating */}
                                            {image && (
                                                <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight className="w-4 h-4" /> View Image Frame
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    ))}
                </div>

                {/* Requirements / Tips */}
                {itinerary.tips && itinerary.tips.length > 0 && (
                    <div className="mt-24 pt-16 border-t-[4px] border-zinc-900">
                        <h2 className="text-2xl font-bold tracking-tight mb-8 uppercase text-zinc-900">
                            Advisory Briefing
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {itinerary.tips.map((tip: string, index: number) => (
                                <div key={index} className="flex gap-4">
                                    <div className="mt-1" style={{ color: brandColor }}>
                                        <div className="w-2 h-2 rounded-full bg-current" />
                                    </div>
                                    <p className="text-zinc-600 font-light leading-relaxed text-sm">
                                        {tip}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExecutiveDirectView;
