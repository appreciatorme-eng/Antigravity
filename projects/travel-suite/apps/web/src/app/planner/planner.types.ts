"use client";

import type { ClientComment, ClientPreferences } from "@/types/feedback";

export type ItineraryStage =
    | "all" | "draft" | "shared" | "viewed" | "feedback" | "approved" | "converted"
    | "active_leads" | "won" | "needs_attention";

/** Minimal itinerary shape used by planner views and client activity detection */
export interface ItineraryLike {
    id: string;
    share_code?: string | null;
    share_status?: string | null;
    trip_id?: string | null;
    client_comments?: ClientComment[];
    client_preferences?: ClientPreferences | null;
    wishlist_items?: string[];
    self_service_status?: string | null;
}

export function deriveStage(itinerary: {
    share_code?: string | null;
    share_status?: string | null;
    viewed_at?: string | null;
    trip_id?: string | null;
    trip_status?: string | null;
}): string {
    // Only mark as "converted" (Won) when the trip has progressed beyond draft
    if (itinerary.trip_id && itinerary.trip_status && itinerary.trip_status !== "draft") {
        return "converted";
    }
    if (itinerary.share_status === "approved") return "approved";
    if (itinerary.share_status === "commented") return "feedback";
    if (itinerary.share_status === "viewed") return "viewed";
    // Fallback: if viewed_at is set but status wasn't updated (legacy data), treat as viewed
    if (itinerary.viewed_at && itinerary.share_code) return "viewed";
    if (itinerary.share_code) return "shared";
    return "draft";
}

/** Check if an itinerary has unresolved client activity requiring operator attention */
export function hasClientActivity(itinerary: ItineraryLike): boolean {
    const comments: ClientComment[] = itinerary.client_comments ?? [];
    const prefs = itinerary.client_preferences;
    const wishlist = itinerary.wishlist_items ?? [];
    const selfService = itinerary.self_service_status;
    const stage = deriveStage(itinerary);

    const unresolvedComments = comments.filter((c) => !c.resolved_at);
    if (unresolvedComments.length > 0 && stage !== "converted") return true;
    if (prefs && Object.keys(prefs).length > 0 && stage !== "converted") return true;
    if (wishlist.length > 0 && stage !== "converted") return true;
    if (selfService === "updated") return true;

    return false;
}
