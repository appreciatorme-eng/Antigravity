"use client";
import React, { useRef } from 'react';
import { Activity, Day } from '@/types/itinerary';
import { ItineraryTemplateProps } from './types';
import { MapPin, Clock, Navigation, CheckCircle2, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const VisualJourneyView: React.FC<ItineraryTemplateProps> = ({ itinerary }) => {
    const brandColor = itinerary.branding?.primaryColor || '#e11d48'; // Rose Red
    const mainRef = useRef<HTMLDivElement>(null);

    const scrollToFirstDay = () => {
        const firstDayElement = document.getElementById('day-0');
        if (firstDayElement) {
            firstDayElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div ref={mainRef} className="bg-slate-50 font-sans text-slate-900 overflow-hidden relative rounded-3xl shadow-2xl border border-slate-200 min-h-screen">
            {/* Cinematic Hero */}
            <div className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Fallback Hero Image from the first activity */}
                <img
                    src={itinerary.days?.[0]?.activities?.[0]?.image || itinerary.days?.[0]?.activities?.[0]?.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop"}
                    alt="Destination"
                    className="absolute inset-0 w-full h-full object-cover transform scale-105 duration-[20s] ease-out hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                <div className="relative z-10 text-center px-6 max-w-5xl mt-24">
                    <Badge className="mb-8 bg-white/20 text-white hover:bg-white/30 backdrop-blur-md rounded-full px-6 py-2 text-sm tracking-widest uppercase border border-white/30">
                        {itinerary.duration_days} Day Photo Journey
                    </Badge>
                    <h1 className="text-7xl md:text-9xl font-bold text-white mb-6 tracking-tighter shadow-sm leading-none drop-shadow-2xl">
                        {itinerary.destination || itinerary.trip_title}
                    </h1>
                    {itinerary.summary && (
                        <p className="text-xl md:text-3xl text-white/90 font-light max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                            {itinerary.summary}
                        </p>
                    )}
                </div>

                <button
                    onClick={scrollToFirstDay}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white animate-bounce bg-white/10 p-4 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20 transition"
                >
                    <ChevronDown className="w-8 h-8" />
                </button>
            </div>

            {/* Immersive Day Sections */}
            <div className="bg-slate-50 relative z-20">
                {itinerary.days?.map((day: Day, dayIndex: number) => {
                    const dayBgImage = day.activities?.find(a => a.image || a.imageUrl)?.image || day.activities?.find(a => a.image || a.imageUrl)?.imageUrl;

                    return (
                        <div key={dayIndex} id={`day-${dayIndex}`} className="min-h-screen border-b border-slate-200">
                            {/* Full Width Day Header with Parallax Feel Background */}
                            <div className="relative h-[50vh] flex items-end">
                                {dayBgImage ? (
                                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                                        <div
                                            className="absolute inset-0 w-full h-full bg-slate-200 bg-cover bg-center transform hover:scale-105 transition-transform duration-[10s]"
                                            style={{ backgroundImage: `url(${dayBgImage})` }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-slate-900" />
                                )}

                                <div className="relative z-10 p-12 md:p-24 w-full max-w-7xl mx-auto">
                                    <div className="flex items-center gap-6 mb-4">
                                        <div className="w-16 h-1 bg-white rounded-full opacity-80" />
                                        <h2 className="text-2xl md:text-3xl font-light text-white uppercase tracking-[0.3em]">
                                            Day {day.day_number}
                                        </h2>
                                    </div>
                                    <h3 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
                                        {day.theme}
                                    </h3>
                                    {day.date && (
                                        <p className="text-xl text-white/70 font-mono">
                                            {new Date(day.date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Activities Timeline (Immersive Large Cards) */}
                            <div className="max-w-7xl mx-auto px-6 py-24 space-y-32">
                                {day.summary && (
                                    <p className="text-2xl md:text-4xl text-slate-500 font-light leading-relaxed max-w-4xl border-l-8 pl-8 md:pl-12" style={{ borderColor: brandColor }}>
                                        {day.summary}
                                    </p>
                                )}

                                {day.activities?.map((activity: Activity, actIndex: number) => (
                                    <div key={actIndex} className={`flex flex-col md:flex-row gap-12 md:gap-24 items-center ${actIndex % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>

                                        {/* Huge Activity Photo */}
                                        <div className="w-full md:w-1/2 relative group">
                                            <div className="aspect-[4/5] md:aspect-square overflow-hidden rounded-3xl shadow-2xl">
                                                <img
                                                    src={activity.image || activity.imageUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"}
                                                    alt={activity.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
                                                />
                                            </div>
                                            {/* Floating Info Tag */}
                                            {activity.time && (
                                                <div className="absolute -top-6 -right-6 md:top-8 md:-right-12 bg-white text-slate-900 shadow-xl p-4 md:p-6 rounded-2xl rotate-3 hover:rotate-0 transition-all z-10 max-w-[200px]">
                                                    <Clock className="w-6 h-6 mb-2" style={{ color: brandColor }} />
                                                    <div className="font-bold text-xl">{activity.time}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Activity Story Text */}
                                        <div className="w-full md:w-1/2 space-y-8">
                                            <div>
                                                <Badge className="mb-6 px-4 py-2 text-sm text-white" style={{ backgroundColor: brandColor }}>
                                                    {activity.location || 'Activity'}
                                                </Badge>
                                                <h4 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                                                    {activity.title}
                                                </h4>
                                            </div>

                                            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-light">
                                                {activity.description}
                                            </p>

                                            <div className="flex flex-wrap gap-8 py-8 border-y border-slate-200 text-slate-500">
                                                {activity.duration && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Duration</span>
                                                        <span className="text-lg">{activity.duration}</span>
                                                    </div>
                                                )}
                                                {activity.cost && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Cost Focus</span>
                                                        <span className="text-lg font-mono bg-slate-100 px-3 py-1 rounded inline-block" style={{ color: brandColor }}>{activity.cost}</span>
                                                    </div>
                                                )}
                                                {activity.transport && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Transport</span>
                                                        <span className="text-lg flex items-center gap-2"><Navigation className="w-4 h-4" /> {activity.transport}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preparation Details */}
            {itinerary.tips && itinerary.tips.length > 0 && (
                <div className="bg-white py-32 px-6 border-t border-slate-200">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-5xl font-bold text-slate-900 mb-6">Before You Go</h2>
                            <div className="w-24 h-1 mx-auto rounded" style={{ backgroundColor: brandColor }} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {itinerary.tips.map((tip: string, index: number) => (
                                <div key={index} className="bg-slate-50 p-8 rounded-3xl flex gap-6 items-start hover:shadow-xl transition-shadow duration-300">
                                    <div className="bg-white p-3 rounded-2xl shadow-sm text-slate-900" style={{ color: brandColor }}>
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <p className="text-lg text-slate-600 font-medium leading-relaxed">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualJourneyView;
