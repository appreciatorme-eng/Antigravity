"use client";
import React, { useState } from 'react';
import { ItineraryTemplateProps } from './types';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Navigation, ChevronDown, ChevronUp, Info, Plane } from 'lucide-react';

const ProfessionalView: React.FC<ItineraryTemplateProps> = ({
    itinerary,
    brandColor = '#124ea2',
    logoUrl,
    organizationName,
    client
}) => {
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]));

    const toggleDay = (dayNumber: number) => {
        setExpandedDays(prev => {
            const next = new Set(prev);
            if (next.has(dayNumber)) {
                next.delete(dayNumber);
            } else {
                next.add(dayNumber);
            }
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {logoUrl && (
                                <img
                                    src={logoUrl}
                                    alt={organizationName || 'Logo'}
                                    className="h-10 mb-4"
                                />
                            )}
                            <h1 className="text-4xl font-bold text-gray-900 mb-3">
                                {itinerary.trip_title}
                            </h1>
                            {client && (
                                <div className="mb-4 p-4 rounded-lg border border-gray-100 bg-gray-50/50 inline-block">
                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                                        Client Information
                                    </div>
                                    <div className="text-xl font-bold" style={{ color: brandColor }}>
                                        {client.name}
                                    </div>
                                    {(client.email || client.phone) && (
                                        <div className="flex gap-4 mt-1 text-sm text-gray-600 font-medium">
                                            {client.email && <span>{client.email}</span>}
                                            {client.email && client.phone && <span className="text-gray-300">|</span>}
                                            {client.phone && <span>{client.phone}</span>}
                                        </div>
                                    )}
                                </div>
                            )}
                            <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                                {itinerary.summary}
                            </p>
                        </div>
                        <Badge
                            variant="secondary"
                            className="ml-4 px-4 py-2 text-base font-semibold whitespace-nowrap"
                            style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                        >
                            {itinerary.duration_days} Days
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Logistics Section */}
            {itinerary.logistics && (
                <div className="max-w-5xl mx-auto px-6 pt-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Flights */}
                        {itinerary.logistics.flights && itinerary.logistics.flights.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Plane className="w-5 h-5" style={{ color: brandColor }} /> Air Travel
                                </h3>
                                <div className="space-y-4">
                                    {itinerary.logistics.flights.map(flight => (
                                        <div key={flight.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-gray-900">{flight.airline} <span className="text-gray-500 font-normal ml-1">{flight.flight_number}</span></div>
                                                <div className="text-sm font-medium text-gray-600 mt-1 flex items-center gap-2">
                                                    {flight.departure_airport} <Navigation className="w-3 h-3 text-gray-400 rotate-90" /> {flight.arrival_airport}
                                                </div>
                                            </div>
                                            <div className="mt-2 md:mt-0 md:text-right">
                                                <div className="font-semibold text-gray-900">{flight.departure_time}</div>
                                                <div className="text-sm text-gray-500">{flight.arrival_time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hotels */}
                        {itinerary.logistics.hotels && itinerary.logistics.hotels.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5" style={{ color: brandColor }} /> Accommodation
                                </h3>
                                <div className="space-y-4">
                                    {itinerary.logistics.hotels.map(hotel => (
                                        <div key={hotel.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-gray-900">{hotel.name}</div>
                                                <div className="text-sm text-gray-500 mt-1">{hotel.address}</div>
                                            </div>
                                            <div className="mt-2 md:mt-0 md:text-right text-sm">
                                                <div className="text-gray-700"><span className="text-gray-400 mr-2 text-xs font-bold uppercase tracking-wider">In</span> <span className="font-medium">{hotel.check_in}</span></div>
                                                <div className="text-gray-700 mt-0.5"><span className="text-gray-400 mr-2 text-xs font-bold uppercase tracking-wider">Out</span> <span className="font-medium">{hotel.check_out}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Timeline Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="space-y-8">
                    {itinerary.days.map((day, dayIndex) => {
                        const isExpanded = expandedDays.has(day.day_number);
                        const isLast = dayIndex === itinerary.days.length - 1;

                        return (
                            <div key={day.day_number} className="relative">
                                {/* Timeline vertical line */}
                                {!isLast && (
                                    <div
                                        className="absolute left-6 top-14 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-transparent"
                                        style={{
                                            backgroundImage: `linear-gradient(to bottom, ${brandColor}40, transparent)`
                                        }}
                                    />
                                )}

                                {/* Day Card */}
                                <div
                                    className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg"
                                    style={{
                                        background: isExpanded
                                            ? `linear-gradient(135deg, white 0%, ${brandColor}05 100%)`
                                            : 'white'
                                    }}
                                >
                                    {/* Day Header */}
                                    <button
                                        onClick={() => toggleDay(day.day_number)}
                                        className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-6">
                                            {/* Timeline Dot */}
                                            <div
                                                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                                                style={{ backgroundColor: brandColor }}
                                            >
                                                {day.day_number}
                                            </div>

                                            <div className="text-left">
                                                <div className="text-sm font-medium text-gray-500 mb-1">
                                                    Day {day.day_number}
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    {day.theme}
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <Badge
                                                variant="outline"
                                                className="px-3 py-1"
                                            >
                                                {day.activities.length} Activities
                                            </Badge>
                                            {isExpanded ? (
                                                <ChevronUp className="w-6 h-6 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Day Activities */}
                                    <div className={`px-8 pb-6 space-y-4 ${isExpanded ? 'block' : 'hidden [.pdf-exporting_&]:block'}`}>
                                        {day.activities.map((activity, activityIndex) => (
                                            <div
                                                key={activityIndex}
                                                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="md:flex">
                                                    {/* Activity Image */}
                                                    {activity.image && (
                                                        <div className="md:w-80 md:flex-shrink-0 h-48 md:h-auto">
                                                            <img
                                                                src={activity.image}
                                                                alt={activity.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                                                                    e.currentTarget.onerror = null;
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Activity Content */}
                                                    <div className="flex-1 p-6">
                                                        {/* Time Badge */}
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <Badge
                                                                variant="secondary"
                                                                className="font-medium"
                                                                style={{
                                                                    backgroundColor: `${brandColor}15`,
                                                                    color: brandColor
                                                                }}
                                                            >
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {activity.time}
                                                            </Badge>
                                                            {activity.duration && (
                                                                <span className="text-sm text-gray-500">
                                                                    {activity.duration}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Title */}
                                                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                                                            {activity.title}
                                                        </h3>

                                                        {/* Description */}
                                                        <p className="text-gray-700 leading-relaxed mb-4">
                                                            {activity.description}
                                                        </p>

                                                        {/* Activity Details */}
                                                        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                                                            {activity.location && (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <MapPin className="w-4 h-4" style={{ color: brandColor }} />
                                                                    <span>{activity.location}</span>
                                                                </div>
                                                            )}
                                                            {activity.cost && (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <DollarSign className="w-4 h-4" style={{ color: brandColor }} />
                                                                    <span>{activity.cost}</span>
                                                                </div>
                                                            )}
                                                            {activity.transport && (
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Navigation className="w-4 h-4" style={{ color: brandColor }} />
                                                                    <span>{activity.transport}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Travel Tips Section */}
                {itinerary.tips && itinerary.tips.length > 0 && (
                    <div className="mt-12 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <div
                            className="px-8 py-6 border-b border-gray-200"
                            style={{
                                background: `linear-gradient(135deg, ${brandColor}10 0%, white 100%)`
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Info
                                    className="w-6 h-6"
                                    style={{ color: brandColor }}
                                />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Essential Travel Tips
                                </h2>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid gap-4 md:grid-cols-2">
                                {itinerary.tips.map((tip, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200"
                                    >
                                        <div
                                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                            style={{ backgroundColor: brandColor }}
                                        >
                                            {index + 1}
                                        </div>
                                        <p className="text-gray-700 leading-relaxed flex-1">
                                            {tip}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessionalView;
