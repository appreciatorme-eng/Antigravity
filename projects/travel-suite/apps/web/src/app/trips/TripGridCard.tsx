"use client";

import Link from "next/link";
import {
    MapPin,
    Calendar,
    User,
    ArrowUpRight,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { cn } from "@/lib/utils";
import { formatINRShort } from "@/lib/india/formats";
import type { EnrichedTrip } from "./types";
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

interface TripGridCardProps {
    trip: EnrichedTrip;
}

export function TripGridCard({ trip }: TripGridCardProps) {
    const styles = getStatusStyles(trip.status || "");
    const readiness = computeReadiness(trip);
    const countdown = formatDepartureCountdown(trip.days_until_departure);
    const urgencyColor = departureUrgencyColor(trip.days_until_departure);
    const urgencyBg = departureUrgencyBg(trip.days_until_departure);
    const showCountdown = trip.days_until_departure !== null && trip.days_until_departure >= 0 && trip.days_until_departure <= 7;

    return (
        <Link href={`/trips/${trip.id}`} className="group">
            <GlassCard padding="lg" className="h-full flex flex-col border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group-hover:-translate-y-2">
                <div className="flex justify-between items-start mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                        {showCountdown && (
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                                urgencyColor, urgencyBg
                            )}>
                                {countdown}
                            </span>
                        )}
                        <div className={cn(
                            "px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest",
                            styles.color
                        )}>
                            {styles.label}
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-secondary dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors truncate">
                        {trip.itineraries?.trip_title || trip.destination || "Untitled Trip"}
                    </h3>

                    <div className="space-y-2.5 mt-4">
                        <div className="flex items-center gap-3 text-text-muted">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{formatDate(trip.start_date || "")}</span>
                        </div>
                        <div className="flex items-center gap-3 text-text-muted">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest truncate">{trip.profiles?.full_name || "Guest"}</span>
                        </div>
                    </div>

                    {trip.invoice.payment_status !== "none" && (
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-sm font-bold text-secondary dark:text-white tabular-nums">
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
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex items-center gap-1.5"
                            title={`Driver: ${readinessLabel(readiness.driver)} | Hotel: ${readinessLabel(readiness.accommodation)} | Payment: ${readinessLabel(readiness.payment)}`}
                        >
                            <span className={cn("w-2 h-2 rounded-full", readinessDotColor(readiness.driver))} />
                            <span className={cn("w-2 h-2 rounded-full", readinessDotColor(readiness.accommodation))} />
                            <span className={cn("w-2 h-2 rounded-full", readinessDotColor(readiness.payment))} />
                        </div>
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-50">#{trip.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-primary group-hover:translate-x-1 transition-transform">
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                </div>
            </GlassCard>
        </Link>
    );
}
