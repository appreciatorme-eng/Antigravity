export interface TripInvoiceSummary {
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    payment_status: "paid" | "partial" | "unpaid" | "none";
}

export interface CoverageSummary {
    covered_days: number;
    total_days: number;
}

export interface EnrichedTrip {
    id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    destination: string;
    created_at: string;
    organization_id: string;
    profiles: {
        full_name: string;
        email: string;
    } | null;
    itineraries: {
        id: string | null;
        trip_title: string;
        duration_days: number;
        destination?: string | null;
    } | null;
    itinerary_id?: string | null;
    invoice: TripInvoiceSummary;
    driver_coverage: CoverageSummary;
    accommodation_coverage: CoverageSummary;
    has_itinerary: boolean;
    days_until_departure: number | null;
}

export type ReadinessLevel = "green" | "amber" | "red" | "gray";

export interface TripReadiness {
    driver: ReadinessLevel;
    accommodation: ReadinessLevel;
    payment: ReadinessLevel;
}

export type TripSortKey = "departure" | "created" | "value" | "client";

export type QuickFilter = "departing_this_week" | "missing_driver" | "payment_due";

export type TripKPIDrillAction = "revenue" | "active" | "departing_soon" | "collection_pending";

export const DRILL_LABELS: Record<TripKPIDrillAction, string> = {
    revenue: "Total Revenue",
    active: "Active Trips",
    departing_soon: "Departing Soon",
    collection_pending: "Collection Pending",
};

export const STATUS_OPTIONS = [
    { value: "all", label: "All Trips" },
    { value: "draft", label: "Draft" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
] as const;
