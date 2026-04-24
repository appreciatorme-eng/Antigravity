"use client";

import type { ClientComment, ClientPreferences } from "@/types/feedback";

export type ItineraryStage =
    | "all" | "draft" | "shared" | "viewed" | "feedback" | "approved" | "partially_paid" | "fully_paid"
    | "active_leads" | "won" | "needs_attention";

/** Minimal itinerary shape used by planner views and client activity detection */
export interface ItineraryLike {
    id: string;
    share_code?: string | null;
    share_status?: string | null;
    trip_id?: string | null;
    proposal_id?: string | null;
    proposal_status?: string | null;
    proposal_share_token?: string | null;
    proposal_title?: string | null;
    financial_payment_status?: string | null;
    approved_at?: string | null;
    approved_by?: string | null;
    viewed_at?: string | null;
    client_comments?: ClientComment[];
    client_preferences?: ClientPreferences | null;
    wishlist_items?: string[];
    self_service_status?: string | null;
}

export function deriveStage(itinerary: {
    share_code?: string | null;
    share_status?: string | null;
    viewed_at?: string | null;
    approved_at?: string | null;
    approved_by?: string | null;
    trip_id?: string | null;
    trip_status?: string | null;
    proposal_status?: string | null;
    financial_payment_status?: string | null;
}): string {
    const paymentStatus = (itinerary.financial_payment_status || "").trim().toLowerCase();
    const shareStatus = (itinerary.share_status || "").trim().toLowerCase();
    const proposalStatus = (itinerary.proposal_status || "").trim().toLowerCase();
    const hasClientApproval = Boolean(itinerary.approved_at || itinerary.approved_by);

    if (paymentStatus === "paid") {
        return "fully_paid";
    }
    if (paymentStatus === "partially_paid") {
        return "partially_paid";
    }
    // A linked operational trip is not approval. Only explicit client approval
    // signals can move the planner card into the Approved stage.
    if (
        hasClientApproval ||
        ["approved", "accepted", "confirmed", "converted"].includes(proposalStatus)
    ) {
        return "approved";
    }
    if (shareStatus === "commented") return "feedback";
    if (shareStatus === "viewed" || shareStatus === "approved") return "viewed";
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
