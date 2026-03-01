'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GlassCard } from '@/components/glass/GlassCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Helper to get days in a month
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

// Helper to get first day of the month (0 = Sunday, 1 = Monday, etc)
function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
    type CalendarTrip = {
        id: string;
        start_date: string | null;
        end_date: string | null;
        status: string | null;
        clients?: unknown;
    };

    const [currentDate, setCurrentDate] = useState(new Date());
    const [trips, setTrips] = useState<CalendarTrip[]>([]);

    const fetchTrips = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return;
        }

        // Get first and last day of the currently viewed month
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const { data, error } = await supabase
            .from('trips')
            .select(`
        *,
        clients(full_name),
        itineraries(destination)
      `)
            .eq('organization_id', profile.organization_id)
            .gte('end_date', firstDay.toISOString())
            .lte('start_date', lastDay.toISOString());

        if (!error && data) {
            setTrips(data as unknown as CalendarTrip[]);
        }
    }, [currentDate]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchTrips();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [fetchTrips]);

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // Build calendar grid
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Helper to check if a trip overlaps with a specific day
    const getTripsForDay = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Set to start/end of day to catch all overlaps
        const startOfDay = new Date(checkDate).setHours(0, 0, 0, 0);
        const endOfDay = new Date(checkDate).setHours(23, 59, 59, 999);

        return trips.filter(trip => {
            if (!trip.start_date || !trip.end_date) return false;
            const tripStart = new Date(trip.start_date).getTime();
            const tripEnd = new Date(trip.end_date).getTime();

            return tripStart <= endOfDay && tripEnd >= startOfDay;
        });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700 border-gray-200',
            active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            completed: 'bg-blue-100 text-blue-800 border-blue-200',
            cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
            proposed: 'bg-amber-100 text-amber-800 border-amber-200',
        };
        return colors[status] || colors.draft;
    };

    const getTripClientName = (trip: CalendarTrip): string => {
        if (!trip.clients || typeof trip.clients !== 'object') {
            return "Unknown";
        }
        const maybeRecord = trip.clients as Record<string, unknown>;
        const fullName = maybeRecord.full_name;
        return typeof fullName === "string" && fullName.length > 0 ? fullName : "Unknown";
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-serif text-secondary tracking-tight">Booking Calendar</h1>
                    <p className="text-text-secondary mt-2 text-lg">
                        Operational overview of upcoming and active itineraries.
                    </p>
                </div>
            </div>

            <GlassCard padding="lg" className="overflow-hidden">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-text-secondary" />
                        </button>
                        <h2 className="text-2xl font-serif text-secondary min-w-[200px] text-center">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-text-secondary" />
                        </button>
                    </div>
                    <div className="flex gap-2 text-sm text-text-secondary font-medium">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div> Proposed</div>
                        <div className="flex items-center gap-2 ml-4"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> Active</div>
                        <div className="flex items-center gap-2 ml-4"><div className="w-3 h-3 rounded-full bg-blue-400"></div> Completed</div>
                    </div>
                </div>

                {/* Days of Week label */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 border-b border-gray-200 rounded-t-2xl overflow-hidden">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="bg-gray-50/80 py-3 text-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 flex-1 border border-gray-200 rounded-b-xl overflow-hidden">
                    {days.map((day, idx) => {
                        const dayTrips = day ? getTripsForDay(day) : [];
                        const isToday = day &&
                            new Date().getDate() === day &&
                            new Date().getMonth() === currentDate.getMonth() &&
                            new Date().getFullYear() === currentDate.getFullYear();

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "min-h-[140px] bg-white p-2 transition-colors relative group",
                                    day ? "hover:bg-gray-50/50" : "bg-gray-50/30",
                                    isToday && "bg-primary/5"
                                )}
                            >
                                {day ? (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={cn(
                                                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                                isToday ? "bg-primary text-white" : "text-text-secondary"
                                            )}>
                                                {day}
                                            </span>
                                            {dayTrips.length > 0 && (
                                                <span className="text-xs text-text-muted font-medium bg-gray-100 px-1.5 rounded-md">
                                                    {dayTrips.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1.5 max-h-[100px] overflow-y-auto scrollbar-hide">
                                            {dayTrips.map(trip => {
                                                return (
                                                    <Link
                                                        key={trip.id}
                                                        href={`/trips/${trip.id}`}
                                                        className={cn(
                                                            "block px-2 py-1 text-xs rounded-md border truncate transition-all duration-300 transform hover:scale-[1.02]",
                                                            getStatusColor(trip.status || 'draft')
                                                        )}
                                                        title={getTripClientName(trip)}
                                                    >
                                                        <span className="font-bold truncate block">{getTripClientName(trip)}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </GlassCard>
        </div>
    );
}
