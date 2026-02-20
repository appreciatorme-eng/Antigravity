import React, { useState } from 'react';
import { Activity, Day } from '@/types/itinerary';
import { ItineraryTemplateProps } from './types';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Clock, DollarSign, MapPin, Check } from 'lucide-react';

export const SafariStoryView: React.FC<ItineraryTemplateProps> = ({ itinerary }) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const brandColor = itinerary.branding?.primaryColor || '#d97706'; // amber-600

  const toggleDay = (dayIndex: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex);
    } else {
      newExpanded.add(dayIndex);
    }
    setExpandedDays(newExpanded);
  };

  const getTotalDuration = () => {
    return itinerary.days?.length || 0;
  };

  const getActivityIcon = (activity: Activity) => {
    const type = activity.type?.toLowerCase() || '';
    if (type.includes('transport') || type.includes('transfer')) {
      return '🚗';
    } else if (type.includes('food') || type.includes('meal')) {
      return '🍽️';
    } else if (type.includes('accommodation') || type.includes('hotel')) {
      return '🏨';
    } else if (type.includes('activity') || type.includes('tour')) {
      return '🎯';
    }
    return '📍';
  };

  return (
    <div className="max-w-6xl mx-auto bg-white">
      {/* Hero Section */}
      <div
        className="relative min-h-[400px] bg-gradient-to-br from-amber-900 via-slate-800 to-slate-900 text-white p-12 flex flex-col justify-center items-center"
        style={{
          background: `linear-gradient(to bottom right, ${brandColor}22, #0f172a)`,
        }}
      >
        {/* Logo */}
        {itinerary.branding?.logoUrl && (
          <img
            src={itinerary.branding.logoUrl}
            alt="Brand Logo"
            className="h-16 mb-8 object-contain filter brightness-0 invert"
          />
        )}

        {/* Title & Destination */}
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl font-serif font-bold mb-4 tracking-wide">
            {itinerary.trip_title || itinerary.title || 'Safari Adventure'}
          </h1>

          {itinerary.destination && (
            <div className="flex items-center justify-center gap-2 text-xl mb-6 opacity-90">
              <MapPin className="w-5 h-5" />
              <span className="font-light">{itinerary.destination}</span>
            </div>
          )}

          {/* Duration Badge */}
          <Badge
            className="px-6 py-2 text-base font-normal"
            style={{ backgroundColor: brandColor }}
          >
            {getTotalDuration()} Day Journey
          </Badge>
        </div>

        {/* Decorative Element */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: brandColor }} />
      </div>

      {/* Story Introduction */}
      {itinerary.summary && (
        <div className="px-12 py-12 bg-slate-50 border-l-4" style={{ borderColor: brandColor }}>
          <p className="text-lg italic text-slate-700 leading-relaxed max-w-4xl mx-auto">
            {itinerary.summary}
          </p>
        </div>
      )}

      {/* Timeline & Days */}
      <div className="px-12 py-12">
        <h2 className="text-3xl font-serif font-bold mb-10 text-slate-900">Your Journey</h2>

        <div className="space-y-6">
          {itinerary.days?.map((day: Day, dayIndex: number) => {
            const isExpanded = expandedDays.has(dayIndex);

            return (
              <div key={dayIndex} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(dayIndex)}
                  className="w-full p-6 flex items-center gap-6 bg-white hover:bg-slate-50 transition-colors text-left"
                >
                  {/* Day Number Circle */}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    {dayIndex + 1}
                  </div>

                  {/* Day Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-serif font-bold text-slate-900 mb-1">
                      Day {dayIndex + 1}
                      {day.date && (
                        <span className="text-base font-normal text-slate-500 ml-3">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </h3>
                    {day.theme && (
                      <p className="text-slate-600 font-medium">{day.theme}</p>
                    )}
                    {day.summary && !isExpanded && (
                      <p className="text-slate-500 text-sm mt-1 line-clamp-1">{day.summary}</p>
                    )}
                  </div>

                  {/* Chevron Icon */}
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-slate-400" />
                  )}
                </button>

                {/* Day Content */}
                {isExpanded && (
                  <div className="p-6 pt-0 bg-slate-50">
                    {day.summary && (
                      <p className="text-slate-700 mb-6 italic pl-22">{day.summary}</p>
                    )}

                    {/* Activities Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-22">
                      {day.activities?.map((activity: Activity, actIndex: number) => (
                        <div
                          key={actIndex}
                          className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-slate-200"
                        >
                          {/* Activity Image */}
                          {activity.imageUrl && (
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={activity.imageUrl}
                                alt={activity.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                              {/* Time Badge Overlay */}
                              {activity.time && (
                                <div className="absolute top-3 right-3">
                                  <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {activity.time}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Activity Details */}
                          <div className="p-4">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xl">{getActivityIcon(activity)}</span>
                              <h4 className="font-bold text-slate-900 flex-1 leading-tight">
                                {activity.title || activity.name}
                              </h4>
                            </div>

                            {activity.description && (
                              <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                                {activity.description}
                              </p>
                            )}

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {activity.duration && (
                                <Badge variant="outline" className="font-normal">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {activity.duration}
                                </Badge>
                              )}
                              {activity.cost && (
                                <Badge variant="outline" className="font-normal">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  {activity.cost}
                                </Badge>
                              )}
                              {activity.location && (
                                <Badge variant="outline" className="font-normal">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {activity.location}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips Section */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <div className="px-12 py-12 bg-slate-50">
          <h2 className="text-3xl font-serif font-bold mb-6 text-slate-900">Travel Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {itinerary.tips.map((tip: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: brandColor }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-slate-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-12 py-8 text-center text-white"
        style={{ backgroundColor: brandColor }}
      >
        <p className="text-lg font-serif">
          Your adventure awaits. Let's make it unforgettable.
        </p>
      </div>
    </div>
  );
};

export default SafariStoryView;
