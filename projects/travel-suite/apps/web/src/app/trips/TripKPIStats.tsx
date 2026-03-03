"use client";

import { useMemo } from "react";
import { IndianRupee, Plane, CalendarClock, Wallet } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import type { EnrichedTrip } from "./types";

interface TripKPIStatsProps {
    trips: readonly EnrichedTrip[];
    loading: boolean;
}

export function TripKPIStats({ trips, loading }: TripKPIStatsProps) {
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
                color="text-emerald-600"
                bg="bg-emerald-100/50"
                loading={loading}
                trend={`${trips.length} trips`}
                trendUp
            />
            <KPICard
                label="Active Trips"
                value={stats.activeTrips}
                icon={Plane}
                color="text-blue-600"
                bg="bg-blue-100/50"
                loading={loading}
            />
            <KPICard
                label="Departing Soon"
                value={stats.upcomingDepartures}
                icon={CalendarClock}
                color="text-amber-600"
                bg="bg-amber-100/50"
                loading={loading}
                trend="Within 7 days"
                trendUp={stats.upcomingDepartures === 0}
            />
            <KPICard
                label="Collection Pending"
                value={stats.collectionPending}
                icon={Wallet}
                isCurrency
                color="text-rose-600"
                bg="bg-rose-100/50"
                loading={loading}
                trendUp={false}
                trend={stats.collectionPending > 0 ? "Needs follow-up" : undefined}
            />
        </div>
    );
}
