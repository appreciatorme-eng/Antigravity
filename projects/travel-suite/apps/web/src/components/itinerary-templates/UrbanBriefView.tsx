import React from 'react';
import { ChevronRight, MapPin, Clock, DollarSign, Users, Calendar } from 'lucide-react';
import { Activity, Day } from '@/types/itinerary';
import { ItineraryTemplateProps } from './types';
import { Badge } from '@/components/ui/badge';

export const UrbanBriefView: React.FC<ItineraryTemplateProps> = ({ itinerary }) => {
  const brandColor = '#124ea2';

  const totalDays = itinerary.days?.length || 0;
  const totalActivities = itinerary.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto bg-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Corporate Header with Brand Border */}
      <div className="border-t-4 pt-8 pb-6 px-8" style={{ borderTopColor: brandColor }}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="text-xs font-semibold tracking-wider mb-2" style={{ color: brandColor }}>
              TRAVEL ITINERARY
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {itinerary.trip_title || itinerary.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" style={{ color: brandColor }} />
                <span>{itinerary.destination}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" style={{ color: brandColor }} />
                <span>{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: brandColor }}>
              BRIEF
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Executive Summary
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {itinerary.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs font-semibold tracking-wider mb-3 text-gray-700">
              OVERVIEW
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {itinerary.summary || itinerary.description}
            </p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Duration</div>
            <div className="text-lg font-semibold text-gray-900">{totalDays} Days</div>
          </div>
          <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Activities</div>
            <div className="text-lg font-semibold text-gray-900">{totalActivities} Total</div>
          </div>
          <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Destination</div>
            <div className="text-lg font-semibold text-gray-900 truncate">{itinerary.destination}</div>
          </div>
        </div>
      </div>

      {/* Day Cards */}
      <div className="px-8 py-6">
        <div className="text-xs font-semibold tracking-wider mb-4 text-gray-700">
          DAILY SCHEDULE
        </div>

        <div className="space-y-4">
          {itinerary.days?.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="border border-gray-300 rounded-lg overflow-hidden"
            >
              {/* Day Header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: `${brandColor}10` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: brandColor }}
                  >
                    {day.day_number || day.day}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{day.theme || day.title || `Day ${day.day_number}`}</div>
                    {day.date && (
                      <div className="text-xs text-gray-600 mt-0.5">{day.date}</div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Activities */}
              {day.activities && day.activities.length > 0 && (
                <div className="divide-y divide-gray-200">
                  {day.activities.map((activity, actIndex) => (
                    <div key={actIndex} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-3">
                        {/* Activity Thumbnail */}
                        {activity.image ? (
                          <img
                            src={activity.image}
                            alt={activity.name}
                            className="w-6 h-6 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                              e.currentTarget.onerror = null;
                            }}
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: `${brandColor}20` }}
                          >
                            <MapPin className="w-3 h-3" style={{ color: brandColor }} />
                          </div>
                        )}

                        {/* Activity Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {activity.title || activity.name}
                            </h4>
                            {activity.time && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                <span>{activity.time}</span>
                              </div>
                            )}
                          </div>

                          {activity.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {activity.description}
                            </p>
                          )}

                          {/* Inline Metadata */}
                          <div className="flex items-center gap-3 text-xs">
                            {activity.location && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[200px]">{activity.location}</span>
                              </div>
                            )}
                            {activity.duration && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>{activity.duration}</span>
                              </div>
                            )}
                            {activity.cost && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <DollarSign className="w-3 h-3" />
                                <span>{activity.cost}</span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {activity.tags && activity.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {activity.tags.map((tag, tagIndex) => (
                                <Badge
                                  key={tagIndex}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 h-5"
                                  style={{
                                    backgroundColor: `${brandColor}15`,
                                    color: brandColor,
                                    border: 'none'
                                  }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <div className="px-8 py-6 bg-gray-50">
          <div className="text-xs font-semibold tracking-wider mb-4 text-gray-700">
            KEY INFORMATION
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {itinerary.tips.map((tip, index) => (
              <div key={index} className="flex gap-3 bg-white rounded p-3 border border-gray-200">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-8 py-6 border-b-4 border-t border-gray-200"
        style={{ borderBottomColor: brandColor }}
      >
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div>
            <span className="font-semibold">Travel Brief</span> • Generated {new Date().toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: brandColor }} className="font-semibold">
              {itinerary.destination}
            </span>
            <span>•</span>
            <span>{totalDays} Days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
