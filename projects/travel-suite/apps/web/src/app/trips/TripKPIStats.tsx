"use client";

import { useMemo } from "react";
import { IndianRupee, Plane, CalendarClock, Wallet } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import type { EnrichedTrip, TripKPIDrillAction } from "./types";

interface TripKPIStatsProps {
    trips: readonly EnrichedTrip[];
    loading: boolean;
    onDrillThrough?: (action: TripKPIDrillAction) => void;
}

export function TripKPIStats({ trips, loading, onDrillThrough }: TripKPIStatsProps) {
    const stats = useMemo(() => {
        const confirmedOrCompleted = trips.filter((t) =>
            ["confirmed", "completed", "in_progress"].includes(t.status || "")
        );
        const totalRevenue = confirmedOrCompleted.reduce(
            (sum, t) => sum + (t.invoice.total_amount || 0), 0
        );

        const activeTrips = trips.filter((t) =>
            ["confirmed", "in_progress"].includes(t.status || "")
        ).length;

        const upcomingDepartures = trips.filter((t) =>
            t.days_until_departure !== null &&
            t.days_until_departure >= 0 &&
            t.days_until_departure <= 7 &&
            ["confirmed", "pending"].includes(t.status || "")
        ).length;

        const collectionPending = trips
            .filter((t) => t.invoice.payment_status === "unpaid" || t.invoice.payment_status === "partial")
            .reduce((sum, t) => sum + (t.invoice.balance_amount || 0), 0);

        return { totalRevenue, activeTrips, upcomingDepartures, collectionPending };
    }, [trips]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
                label="Total Revenue"
                value={stats.totalRevenue}
                icon={IndianRupee}
                isCurrency
                color="text-emerald-500"
                bg="bg-emerald-500/10"
                loading={loading}
                trend={`${trips.length} trips`}
                trendUp
                onClick={onDrillThrough ? () => onDrillThrough("revenue") : undefined}
            />
            <KPICard
                label="Active Trips"
                value={stats.activeTrips}
                icon={Plane}
                color="text-sky-500"
                bg="bg-sky-500/10"
                loading={loading}
                onClick={onDrillThrough ? () => onDrillThrough("active") : undefined}
            />
            <KPICard
                label="Departing Soon"
                value={stats.upcomingDepartures}
                icon={CalendarClock}
                color="text-amber-500"
                bg="bg-amber-500/10"
                loading={loading}
                trend="Within 7 days"
                trendUp={stats.upcomingDepartures === 0}
                onClick={onDrillThrough ? () => onDrillThrough("departing_soon") : undefined}
            />
            <KPICard
                label="Collection Pending"
                value={stats.collectionPending}
                icon={Wallet}
                isCurrency
                color="text-rose-500"
                bg="bg-rose-500/10"
                loading={loading}
                trendUp={false}
                trend={stats.collectionPending > 0 ? "Needs follow-up" : undefined}
                onClick={onDrillThrough ? () => onDrillThrough("collection_pending") : undefined}
            />
        </div>
    );
}
