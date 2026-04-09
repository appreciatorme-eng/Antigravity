import type { ClientComment, ClientPreferences } from "@/types/feedback";
import type { SharePaymentSummary } from "@/lib/share/payment-config";

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
    client_id?: string | null;
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
    hero_image?: string | null;
    share_code?: string | null;
    share_status?: string | null;
    viewed_at?: string | null;
    approved_at?: string | null;
    approved_by?: string | null;
    self_service_status?: string | null;
    client_comments?: ClientComment[];
    client_preferences?: ClientPreferences | null;
    wishlist_items?: string[];
    share_payment_summary?: SharePaymentSummary | null;
    proposal_id?: string | null;
    proposal_status?: string | null;
    proposal_share_token?: string | null;
    proposal_title?: string | null;
    holiday_summary?: {
        holidayName: string;
        date: string;
        country: string;
        countryCode: string;
    } | null;
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
