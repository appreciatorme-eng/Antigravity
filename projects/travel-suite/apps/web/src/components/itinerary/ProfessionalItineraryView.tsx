"use client";

/**
 * Professional Itinerary View Component
 * Matches WBB Kenya Safari PDF quality with:
 * - Cover page with hero image
 * - Timeline-connected day cards
 * - Rich activity descriptions (8-10 sentences)
 * - Inclusions/Exclusions section
 * - Dynamic operator branding
 * - Print-ready styling
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, DollarSign, Calendar, Check, X } from 'lucide-react';
import { ItineraryResult, Day, Activity } from '@/types/itinerary';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Props {
    itinerary: ItineraryResult;
    images?: Record<string, string | null>;
    organizationBranding?: {
        logo_url?: string;
        primary_color?: string;
        name?: string;
    };
}

export default function ProfessionalItineraryView({ itinerary, images = {}, organizationBranding }: Props) {
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // First day expanded
    const brandColor = organizationBranding?.primary_color || '#00d084';

    const toggleDay = (dayNumber: number) => {
        const newExpanded = new Set(expandedDays);
        if (newExpanded.has(dayNumber)) {
            newExpanded.delete(dayNumber);
        } else {
            newExpanded.add(dayNumber);
        }
        setExpandedDays(newExpanded);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 professional-itinerary">
            {/* Cover Page */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-2xl print:shadow-none print:rounded-none">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    }} />
                </div>

                <div className="relative p-12 md:p-16">
                    {/* Operator Logo (if provided) */}
                    {organizationBranding?.logo_url && (
                        <div className="mb-8 print:mb-6">
                            <img
                                src={organizationBranding.logo_url}
                                alt={organizationBranding.name || 'Operator Logo'}
                                className="h-12 md:h-16 object-contain filter brightness-0 invert"
                            />
                        </div>
                    )}

                    {/* Destination Badge */}
                    <Badge
                        variant="secondary"
                        className="mb-4 text-sm px-4 py-1 bg-white/20 border-white/30 text-white backdrop-blur-sm"
                    >
                        <MapPin className="w-3 h-3 mr-1" />
                        {itinerary.destination}
                    </Badge>

                    {/* Trip Title */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight">
                        {itinerary.trip_title}
                    </h1>

                    {/* Summary */}
                    <p className="text-lg md:text-xl text-gray-200 max-w-3xl leading-relaxed mb-8">
                        {itinerary.summary}
                    </p>

                    {/* Trip Metadata */}
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{itinerary.duration_days} Days</span>
                        </div>
                        {itinerary.budget && (
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-medium">{itinerary.budget}</span>
                            </div>
                        )}
                        {itinerary.interests && itinerary.interests.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {itinerary.interests.slice(0, 3).map((interest, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-white/10 border-white/30 text-white">
                                        {interest}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Day-by-Day Itinerary */}
            <div className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-6">
                    Day-by-Day Itinerary
                </h2>

                {/* Timeline Container */}
                <div className="relative">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 via-slate-200 to-transparent dark:from-slate-700 dark:via-slate-800 print:bg-slate-300" />

                    <div className="space-y-6">
                        {itinerary.days.map((day) => (
                            <DayCard
                                key={day.day_number}
                                day={day}
                                isExpanded={expandedDays.has(day.day_number)}
                                onToggle={() => toggleDay(day.day_number)}
                                images={images}
                                brandColor={brandColor}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Inclusions & Exclusions */}
            {(itinerary.tips && itinerary.tips.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6 print:break-inside-avoid">
                    {/* What's Included */}
                    <Card className="border-2 border-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                                    What&apos;s Included
                                </h3>
                            </div>
                            <ul className="space-y-3">
                                {itinerary.tips.slice(0, Math.ceil(itinerary.tips.length / 2)).map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-emerald-800 dark:text-emerald-200">
                                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* What's Not Included */}
                    <Card className="border-2 border-rose-100 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
                                    <X className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-rose-900 dark:text-rose-100">
                                    What&apos;s Not Included
                                </h3>
                            </div>
                            <ul className="space-y-3">
                                {itinerary.tips.slice(Math.ceil(itinerary.tips.length / 2)).map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-rose-800 dark:text-rose-200">
                                        <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Footer */}
            <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400 print:text-gray-600">
                <p>Generated with {organizationBranding?.name || 'Travel Suite'}</p>
                <p className="mt-1">
                    This itinerary is subject to availability and may be customized to your preferences
                </p>
            </div>
        </div>
    );
}

// Day Card Component
interface DayCardProps {
    day: Day;
    isExpanded: boolean;
    onToggle: () => void;
    images: Record<string, string | null>;
    brandColor: string;
}

function DayCard({ day, isExpanded, onToggle, images, brandColor }: DayCardProps) {
    const activityImageKey = (dayNumber: number, idx: number) => `${dayNumber}-${idx}`;

    return (
        <div className="relative pl-16 print:break-inside-avoid">
            {/* Timeline Dot */}
            <div
                className="absolute left-3 top-6 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 z-10 shadow-lg print:border-white"
                style={{ backgroundColor: brandColor }}
            />

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-slate-200 dark:border-slate-700 print:shadow-none">
                {/* Day Header - Always Visible */}
                <button
                    onClick={onToggle}
                    className="w-full text-left p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors print:hover:bg-transparent print:cursor-default"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge
                                    variant="outline"
                                    className="font-bold"
                                    style={{ borderColor: brandColor, color: brandColor }}
                                >
                                    Day {day.day_number}
                                </Badge>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {day.theme}
                                </h3>
                            </div>
                            {day.activities && day.activities.length > 0 && (
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {day.activities.length} {day.activities.length === 1 ? 'Activity' : 'Activities'}
                                </p>
                            )}
                        </div>
                        <div className="ml-4 print:hidden">
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                    </div>
                </button>

                {/* Day Content - Collapsible */}
                {(isExpanded || typeof window !== 'undefined' && window.matchMedia && window.matchMedia('print').matches) && (
                    <div className="px-6 pb-6 space-y-6">
                        <Separator />

                        {/* Activities */}
                        {day.activities && day.activities.map((activity, idx) => (
                            <ActivityCard
                                key={idx}
                                activity={activity}
                                image={images[activityImageKey(day.day_number, idx)] || null}
                                brandColor={brandColor}
                            />
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

// Activity Card Component
interface ActivityCardProps {
    activity: Activity;
    image: string | null;
    brandColor: string;
}

function ActivityCard({ activity, image, brandColor }: ActivityCardProps) {
    return (
        <div className="group print:break-inside-avoid">
            {/* Activity Image (if available) */}
            {image && (
                <div className="relative h-64 rounded-xl overflow-hidden mb-4 shadow-md">
                    <img
                        src={image}
                        alt={activity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-xl font-bold text-white mb-1">
                            {activity.title}
                        </h4>
                        {activity.location && (
                            <p className="text-sm text-white/90 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.location}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Activity Title (if no image) */}
            {!image && (
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {activity.title}
                    </h4>
                    {activity.location && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {activity.location}
                        </p>
                    )}
                </div>
            )}

            {/* Activity Metadata */}
            <div className="flex flex-wrap gap-3 mb-4 text-sm">
                {activity.time && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" style={{ color: brandColor }} />
                        <span>{activity.time}</span>
                    </div>
                )}
                {activity.duration && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4" style={{ color: brandColor }} />
                        <span>{activity.duration}</span>
                    </div>
                )}
                {activity.cost && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <DollarSign className="w-4 h-4" style={{ color: brandColor }} />
                        <span>{activity.cost}</span>
                    </div>
                )}
            </div>

            {/* Activity Description - 8-10 sentences minimum */}
            {activity.description && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {activity.description}
                    </p>
                </div>
            )}

            {/* Transport Info (if provided) */}
            {activity.transport && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                        <span className="font-semibold">Getting there:</span> {activity.transport}
                    </p>
                </div>
            )}
        </div>
    );
}
