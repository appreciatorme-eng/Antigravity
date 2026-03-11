/* ------------------------------------------------------------------
 * GET /api/whatsapp/proposal-drafts/:id
 * Fetches a WhatsApp proposal draft by ID for the calling org.
 * ------------------------------------------------------------------ */

import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.ok) return authResult.response;
        const { organizationId, adminClient } = authResult;

        if (!organizationId) {
            return apiError("Organization not configured", 400);
        }

        const { id } = await params;
        if (!id) {
            return apiError("Draft ID is required", 400);
        }

        const { data: row, error } = await adminClient
            .from("whatsapp_proposal_drafts")
            .select(
                "id, client_id, template_id, traveler_name, traveler_phone, traveler_email, destination, travel_dates, trip_start_date, trip_end_date, group_size, budget_inr, title, status",
            )
            .eq("id", id)
            .eq("organization_id", organizationId)
            .maybeSingle();

        if (error) {
            console.error("[proposal-drafts/:id] DB error:", error);
            return apiError("Failed to fetch proposal draft", 500);
        }

        if (!row) {
            return apiError("Proposal draft not found", 404);
        }

        const draft = {
            id: row.id,
            clientId: row.client_id,
            templateId: row.template_id,
            travelerName: row.traveler_name,
            travelerPhone: row.traveler_phone,
            travelerEmail: row.traveler_email,
            destination: row.destination,
            travelDates: row.travel_dates,
            tripStartDate: row.trip_start_date,
            tripEndDate: row.trip_end_date,
            groupSize: row.group_size,
            budgetInr: row.budget_inr,
            title: row.title,
            status: row.status,
        };

        return NextResponse.json({ data: { draft } });
    } catch (error) {
        console.error("[/api/whatsapp/proposal-drafts/:id:GET] Unhandled error:", error);
        return apiError("An unexpected error occurred. Please try again.", 500);
    }
}
