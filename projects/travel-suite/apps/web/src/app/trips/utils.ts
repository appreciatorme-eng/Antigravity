import {
    BadgeCheck,
    Clock,
    DraftingCompass,
    CheckCircle2,
    AlertCircle,
    Briefcase,
} from "lucide-react";
import type { EnrichedTrip, TripReadiness, ReadinessLevel, TripSortKey, QuickFilter } from "./types";
import type { ClientComment } from "@/types/feedback";

export function computeReadiness(trip: EnrichedTrip): TripReadiness {
    const totalDays = trip.itineraries?.duration_days || 0;

    const driverLevel = computeCoverageLevel(trip.driver_coverage?.covered_days ?? 0, totalDays);
    const accommodationLevel = computeCoverageLevel(trip.accommodation_coverage?.covered_days ?? 0, totalDays);
    const paymentLevel = computePaymentLevel(trip.invoice?.payment_status ?? "none");

    return { driver: driverLevel, accommodation: accommodationLevel, payment: paymentLevel };
}

function computeCoverageLevel(covered: number, total: number): ReadinessLevel {
    if (total === 0) return "gray";
    const ratio = covered / total;
    if (ratio >= 1) return "green";
    if (ratio > 0) return "amber";
    return "red";
}

function computePaymentLevel(status: string): ReadinessLevel {
    switch (status) {
        case "paid": return "green";
        case "partial": return "amber";
        case "unpaid": return "red";
        default: return "gray";
    }
}

export function formatDepartureCountdown(days: number | null): string {
    if (days === null) return "";
    if (days < 0) return `${Math.abs(days)}d ago`;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `In ${days} days`;
    return `${days}d`;
}

export function departureUrgencyColor(days: number | null): string {
    if (days === null) return "text-slate-400";
    if (days <= 1) return "text-red-600 dark:text-red-400";
    if (days <= 3) return "text-amber-600 dark:text-amber-400";
    if (days <= 7) return "text-blue-600 dark:text-blue-400";
    return "text-slate-500 dark:text-slate-400";
}

export function departureUrgencyBg(days: number | null): string {
    if (days === null) return "bg-slate-100 dark:bg-slate-800";
    if (days <= 1) return "bg-red-50 dark:bg-red-900/20";
    if (days <= 3) return "bg-amber-50 dark:bg-amber-900/20";
    if (days <= 7) return "bg-blue-50 dark:bg-blue-900/20";
    return "bg-slate-50 dark:bg-slate-800/50";
}

export function readinessDotColor(level: ReadinessLevel): string {
    switch (level) {
        case "green": return "bg-emerald-500";
        case "amber": return "bg-amber-500";
        case "red": return "bg-red-500";
        default: return "bg-slate-300 dark:bg-slate-600";
    }
}

export function readinessLabel(level: ReadinessLevel): string {
    switch (level) {
        case "green": return "Complete";
        case "amber": return "Partial";
        case "red": return "Missing";
        default: return "N/A";
    }
}

export function sortTrips(trips: readonly EnrichedTrip[], key: TripSortKey): EnrichedTrip[] {
    const sorted = [...trips];
    switch (key) {
        case "departure":
            return sorted.sort((a, b) => {
                if (!a.start_date && !b.start_date) return 0;
                if (!a.start_date) return 1;
                if (!b.start_date) return -1;
                return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
            });
        case "created":
            return sorted.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        case "value":
            return sorted.sort((a, b) =>
                (b.invoice?.total_amount || 0) - (a.invoice?.total_amount || 0)
            );
        case "client":
            return sorted.sort((a, b) => {
                const nameA = a.profiles?.full_name || "";
                const nameB = b.profiles?.full_name || "";
                return nameA.localeCompare(nameB);
            });
        default:
            return sorted;
    }
}

export function applyQuickFilters(
    trips: readonly EnrichedTrip[],
    activeFilters: ReadonlySet<QuickFilter>
): EnrichedTrip[] {
    if (activeFilters.size === 0) return [...trips];

    return trips.filter((trip) => {
        for (const filter of activeFilters) {
            switch (filter) {
                case "departing_this_week":
                    if (trip.days_until_departure === null || trip.days_until_departure < 0 || trip.days_until_departure > 7) return false;
                    if (!["confirmed", "pending"].includes(trip.status || "")) return false;
                    break;
                case "missing_driver": {
                    const totalDays = trip.itineraries?.duration_days || 0;
                    if (totalDays === 0 || (trip.driver_coverage?.covered_days ?? 0) >= totalDays) return false;
                    break;
                }
                case "payment_due":
                    if (trip.invoice?.payment_status !== "unpaid" && trip.invoice?.payment_status !== "partial") return false;
                    break;
            }
        }
        return true;
    });
}

export function getStatusStyles(status: string) {
    switch (status?.toLowerCase()) {
        case "confirmed":
            return {
                color: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
                icon: BadgeCheck,
                label: "Confirmed",
            };
        case "pending":
            return {
                color: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                icon: Clock,
                label: "Pending",
            };
        case "draft":
            return {
                color: "bg-gray-50 text-gray-500 border-gray-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800",
                icon: DraftingCompass,
                label: "Draft",
            };
        case "completed":
            return {
                color: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                icon: CheckCircle2,
                label: "Completed",
            };
        case "cancelled":
            return {
                color: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
                icon: AlertCircle,
                label: "Cancelled",
            };
        default:
            return {
                color: "bg-slate-50 text-slate-500 border-slate-100",
                icon: Briefcase,
                label: "Standard Operation",
            };
    }
}

export function formatDate(dateString: string): string {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function paymentBadgeVariant(status: string): "success" | "warning" | "danger" | "default" {
    switch (status) {
        case "paid": return "success";
        case "partial": return "warning";
        case "unpaid": return "danger";
        default: return "default";
    }
}

export function paymentBadgeLabel(status: string): string {
    switch (status) {
        case "paid": return "Paid";
        case "partial": return "Partial";
        case "unpaid": return "Due";
        default: return "No Invoice";
    }
}

export type TripCommercialStage = "draft" | "shared" | "viewed" | "approved" | "won";

export function deriveCommercialStage(trip: EnrichedTrip): TripCommercialStage {
    if (trip.status && trip.status !== "draft") return "won";
    if (trip.share_status === "approved") return "approved";
    if (trip.share_status === "viewed" || (trip.viewed_at && trip.share_code)) return "viewed";
    if (trip.share_code) return "shared";
    return "draft";
}

export function hasTripClientActivity(trip: EnrichedTrip): boolean {
    const comments: ClientComment[] = trip.client_comments ?? [];
    const prefs = trip.client_preferences;
    const wishlist = trip.wishlist_items ?? [];
    const selfService = trip.self_service_status;

    if (comments.some((comment) => !comment.resolved_at)) return true;
    if (prefs && Object.keys(prefs).length > 0) return true;
    if (wishlist.length > 0) return true;
    if (selfService === "updated") return true;

    return false;
}

export function formatDurationLabel(days: number | null | undefined): string {
    if (!days || days <= 0) return "Itinerary pending";
    if (days === 1) return "1 day";
    return `${days} days`;
}

export function formatRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return "Recently";
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 14) return "Last week";
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) return `${diffWeeks}w ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
}
