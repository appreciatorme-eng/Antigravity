"use client";

import Link from "next/link";
import {
    MapPin,
    Calendar,
    User,
    Clock,
    ChevronRight,
} from "lucide-react";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { cn } from "@/lib/utils";
import { formatINRShort } from "@/lib/india/formats";
import { useUpdateTripStatus } from "@/lib/queries/trips";
import type { EnrichedTrip } from "./types";
import { STATUS_OPTIONS } from "./types";
import {
    getStatusStyles,
    formatDate,
    computeReadiness,
    formatDepartureCountdown,
    departureUrgencyColor,
    departureUrgencyBg,
    readinessDotColor,
    readinessLabel,
    paymentBadgeVariant,
    paymentBadgeLabel,
} from "./utils";

interface TripListRowProps {
    trip: EnrichedTrip;
}

export function TripListRow({ trip }: TripListRowProps) {
    const styles = getStatusStyles(trip.status || "");
    const readiness = computeReadiness(trip);
    const countdown = formatDepartureCountdown(trip.days_until_departure);
    const urgencyColor = departureUrgencyColor(trip.days_until_departure);
    const urgencyBg = departureUrgencyBg(trip.days_until_departure);
    const updateStatus = useUpdateTripStatus();

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.preventDefault();
        e.stopPropagation();
        updateStatus.mutate({ id: trip.id, status: e.target.value });
    };

    return (
        <Link
            href={`/trips/${trip.id}`}
            className="group flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-4 md:py-5 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 border-b border-gray-50 dark:border-slate-800 last:border-none relative overflow-hidden"
        >
            <div className="flex items-center gap-3 md:gap-6 relative z-10 flex-1 min-w-0">
                <div className="w-10 h-10 md:w-14 md:h-14 shrink-0 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/5">
                    <MapPin className="h-5 w-5 md:h-7 md:w-7 text-primary group-hover:rotate-12 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-3 mb-1">
                        <h3 className="text-sm md:text-lg font-bold text-secondary dark:text-white truncate tracking-tight">
                            {trip.itineraries?.trip_title || trip.destination || "Untitled Trip"}
                        </h3>
                        <GlassBadge variant="secondary" className="hidden md:inline-flex text-[8px] font-black uppercase tracking-widest h-5 px-1.5 border-gray-100 opacity-50 shrink-0">
                            #{trip.id.slice(0, 8)}
                        </GlassBadge>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 md:gap-x-5">
                        <div className="flex items-center gap-1.5 md:gap-2 text-text-muted">
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                <User className="h-2.5 w-2.5 md:h-3 md:w-3" />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{trip.profiles?.full_name || "Guest"}</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-1.5 text-text-muted">
                            <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{formatDate(trip.start_date || "")}</span>
                        </div>
                        {trip.itineraries?.duration_days && (
                            <div className="flex items-center gap-1 md:gap-1.5 text-primary">
                                <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{trip.itineraries.duration_days}D</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 relative z-10 shrink-0 mt-2 md:mt-0 ml-13 md:ml-0 flex-wrap">
                {trip.invoice.payment_status !== "none" && (
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-[10px] md:text-xs font-bold text-secondary dark:text-white tabular-nums">
                            {formatINRShort(trip.invoice.total_amount)}
                        </span>
                        <GlassBadge
                            variant={paymentBadgeVariant(trip.invoice.payment_status)}
                            size="sm"
                            className="text-[8px] font-black uppercase tracking-widest"
                        >
                            {paymentBadgeLabel(trip.invoice.payment_status)}
                        </GlassBadge>
                    </div>
                )}

                <div
                    className="flex items-center gap-1.5"
                    title={`Driver: ${readinessLabel(readiness.driver)} | Hotel: ${readinessLabel(readiness.accommodation)} | Payment: ${readinessLabel(readiness.payment)}`}
                >
                    <span className={cn("w-2 h-2 rounded-full", readinessDotColor(readiness.driver))} />
                    <span className={cn("w-2 h-2 rounded-full", readinessDotColor(readiness.accommodation))} />
                    <span className={cn("w-2 h-2 rounded-full", readinessDotColor(readiness.payment))} />
                </div>

                {countdown && (
                    <span className={cn(
                        "text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg whitespace-nowrap",
                        urgencyColor, urgencyBg
                    )}>
                        {countdown}
                    </span>
                )}

                <div
                    className="relative hidden md:block"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
                >
                    <select
                        value={trip.status || ""}
                        onChange={handleStatusChange}
                        className={cn(
                            "appearance-none cursor-pointer px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm pr-6 bg-no-repeat bg-right",
                            styles.color
                        )}
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundPosition: "right 8px center" }}
                    >
                        {STATUS_OPTIONS.filter((opt) => opt.value !== "all").map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-100 dark:border-slate-700 flex items-center justify-center transition-all group-hover:bg-secondary group-hover:text-white ml-auto md:ml-0">
                    <ChevronRight className="h-4 w-4" />
                </div>
            </div>

            <div className="absolute left-0 top-0 w-1.5 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
        </Link>
    );
}
