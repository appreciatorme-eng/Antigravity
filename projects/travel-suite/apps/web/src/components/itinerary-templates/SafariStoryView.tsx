"use client";
import React, { useState } from 'react';
import { Activity, Day } from '@/types/itinerary';
import { ItineraryTemplateProps } from './types';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Clock, MapPin, Compass, Check, Sun, Moon } from 'lucide-react';

export const SafariStoryView: React.FC<ItineraryTemplateProps> = ({ itinerary, client }) => {
  // Open the first day by default
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]));

  // Default to an earthy olive/khaki color if no brand color is provided
  const brandColor = itinerary.branding?.primaryColor || '#4b5320'; // Army green / Olive

  const toggleDay = (dayIndex: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayIndex)) {
        next.delete(dayIndex);
      } else {
        next.add(dayIndex);
      }
      return next;
    });
  };

  const getTotalDuration = () => itinerary.days?.length || 0;

  const getActivityIcon = (activity: Activity) => {
    const type = activity.title?.toLowerCase() || activity.description?.toLowerCase() || '';
    if (type.includes('drive') || type.includes('safari') || type.includes('game')) return '🚙';
    if (type.includes('camp') || type.includes('lodge') || type.includes('tent')) return '⛺';
    if (type.includes('flight') || type.includes('transfer')) return '🛩️';
    if (type.includes('dinner') || type.includes('lunch') || type.includes('breakfast')) return '🍽️';
    if (type.includes('walk') || type.includes('trek')) return '🥾';
    return '🧭';
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-stone-800">
      {/* 1. COVER PAGE / HERO SECTION (Print PDF feel) */}
      <div className="relative min-h-[500px] flex flex-col justify-center items-center text-center p-12 overflow-hidden border-b-[12px] border-[#4b5320]" style={{ borderColor: brandColor }}>
        {/* Vintage map / noise overlay effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>

        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: brandColor }}></div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <Compass className="w-12 h-12 mb-6 opacity-80" style={{ color: brandColor }} />
          <p className="tracking-[0.3em] uppercase text-sm font-semibold mb-6" style={{ color: brandColor }}>
            An Exclusive Expedition
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-stone-900 mb-6 leading-tight">
            {itinerary.trip_title || itinerary.title || 'Safari Adventure'}
          </h1>
          {client && (
            <div className="mb-8">
              <h2 className="text-3xl font-serif text-stone-600 italic" style={{ color: brandColor }}>
                Exclusively prepared for {client.name}
              </h2>
              <div className="flex justify-center gap-4 mt-2 text-stone-500 text-sm">
                {client.email && <span>{client.email}</span>}
                {client.email && client.phone && <span>•</span>}
                {client.phone && <span>{client.phone}</span>}
              </div>
            </div>
          )}

          {itinerary.destination && (
            <div className="flex items-center gap-2 text-xl text-stone-600 font-serif italic mb-8 border-t border-b border-stone-300 py-3 px-8">
              <MapPin className="w-5 h-5 opacity-70" />
              {itinerary.destination}
            </div>
          )}

          <div className="flex gap-4 items-center">
            <Badge variant="outline" className="px-6 py-2 text-base font-serif bg-white/50 border-stone-400 text-stone-800 backdrop-blur-sm">
              {getTotalDuration()} Days
            </Badge>
          </div>
        </div>
      </div>

      {/* 2. INTRODUCTION (The Prologue) */}
      {itinerary.summary && (
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-xl md:text-2xl font-serif text-stone-600 leading-relaxed italic">
            "{itinerary.summary}"
          </p>
          <div className="w-24 h-[1px] bg-stone-300 mx-auto mt-12"></div>
        </div>
      )}

      {/* 3. THE ITINERARY (Logbook Timeline) */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-serif text-center text-stone-900 mb-16 uppercase tracking-widest">
          Expedition Itinerary
        </h2>

        <div className="space-y-12">
          {itinerary.days?.map((day: Day, dayIndex: number) => {
            const isExpanded = expandedDays.has(dayIndex);
            const isLast = dayIndex === (itinerary.days?.length || 0) - 1;

            return (
              <div key={dayIndex} className="relative">
                {/* Timeline vertical line */}
                {!isLast && (
                  <div className="absolute left-6 top-16 bottom-[-3rem] w-px bg-stone-300 hidden md:block" />
                )}

                {/* Day Card */}
                <div className="relative bg-white border border-stone-200 shadow-sm transition-all duration-500 overflow-hidden"
                  style={{ boxShadow: isExpanded ? '0 10px 40px -10px rgba(0,0,0,0.05)' : 'none' }}>

                  {/* Day Header */}
                  <button
                    onClick={() => toggleDay(dayIndex)}
                    className="w-full px-6 py-6 md:py-8 md:px-10 flex items-center justify-between hover:bg-stone-50 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-6 md:gap-8">
                      {/* Day Number Logbook Tag */}
                      <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-none border border-current flex items-center justify-center font-serif text-xl md:text-2xl bg-[#FDFBF7] text-stone-800 transition-colors group-hover:bg-current group-hover:text-white"
                        style={{ color: brandColor }}>
                        {dayIndex + 1}
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] font-semibold text-stone-500 mb-1">
                          Day {dayIndex + 1}
                          {day.date && ` • ${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </div>
                        <h3 className="text-2xl md:text-3xl font-serif text-stone-900 group-hover:text-amber-900 transition-colors">
                          {day.theme || `Exploring ${itinerary.destination}`}
                        </h3>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                      <span className="text-sm font-serif italic text-stone-500">
                        {day.activities?.length || 0} stops
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
                    </div>
                  </button>

                  {/* Expanded Content (Magazine layout) */}
                  <div className={`transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden [.pdf-exporting_&]:max-h-[5000px] [.pdf-exporting_&]:opacity-100 [.pdf-exporting_&]:overflow-visible'}`}>
                    <div className="px-6 pb-10 md:px-10 md:pb-12 border-t border-stone-100 bg-stone-50/50">

                      {day.summary && (
                        <p className="text-stone-600 font-serif italic mb-10 mt-8 text-lg md:text-xl leading-relaxed border-l-4 pl-6" style={{ borderColor: brandColor }}>
                          {day.summary}
                        </p>
                      )}

                      <div className="space-y-6 mt-8">
                        {day.activities?.map((activity: Activity, actIndex: number) => (
                          <div key={actIndex} className="bg-white border border-stone-200 p-6 md:p-8 flex flex-col md:flex-row gap-8 hover:border-stone-300 transition-colors">

                            {/* Activity Image (Left) */}
                            {activity.image && (
                              <div className="md:w-1/3 shrink-0">
                                <div className="aspect-[4/3] w-full overflow-hidden border border-stone-200 bg-stone-100 p-2">
                                  <img
                                    src={activity.image}
                                    alt={activity.title}
                                    className="w-full h-full object-cover filter contrast-[1.05] grayscale-[0.1]"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Activity Details (Right) */}
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl opacity-80">{getActivityIcon(activity)}</span>
                                {activity.time && (
                                  <Badge variant="outline" className="font-serif tracking-widest text-[10px] uppercase border-stone-300 text-stone-600 bg-[#FDFBF7]">
                                    <Clock className="w-3 h-3 mr-1.5 inline" /> {activity.time}
                                  </Badge>
                                )}
                              </div>

                              <h4 className="text-xl md:text-2xl font-serif text-stone-900 mb-3">
                                {activity.title}
                              </h4>

                              <p className="text-stone-600 leading-relaxed text-sm md:text-base mb-6">
                                {activity.description}
                              </p>

                              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-auto pt-4 border-t border-stone-100 text-sm font-serif italic text-stone-500">
                                {activity.location && (
                                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {activity.location}</span>
                                )}
                                {activity.duration && (
                                  <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5" /> {activity.duration}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ESSENTIAL INFO / FIELD NOTES */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <div className="bg-stone-900 text-stone-300 py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif text-white mb-12 text-center uppercase tracking-widest">
              Field Notes & Preparations
            </h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              {itinerary.tips.map((tip: string, index: number) => (
                <div key={index} className="flex gap-4 items-start border-b border-stone-800 pb-4">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: brandColor }} />
                  <p className="leading-relaxed text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. FOOTER */}
      <div className="py-12 text-center bg-[#FDFBF7] border-t border-stone-200">
        <Compass className="w-6 h-6 mx-auto mb-4 text-stone-300" />
        <p className="font-serif italic text-stone-500">
          Curated specially for you {itinerary.branding?.organizationName ? `by ${itinerary.branding.organizationName}` : ''}
        </p>
      </div>
    </div>
  );
};

export default SafariStoryView;
