// PATCH /api/superadmin/announcements/:id — update a draft announcement.

import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";

const PLATFORM_ANNOUNCEMENT_SELECT = [
    "announcement_type",
    "body",
    "created_at",
    "delivery_channels",
    "id",
    "recipient_count",
    "scheduled_at",
    "sent_at",
    "sent_by",
    "status",
    "target_org_ids",
    "target_segment",
    "title",
    "updated_at",
].join(", ");

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const { adminClient } = auth;

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

    try {
        // Only allow updating drafts
        const current = await adminClient
            .from("platform_announcements")
            .select("status")
            .eq("id", id)
            .single();

        if (!current.data) return apiError("Not found", 404);
        if (current.data.status !== "draft") {
            return apiError("Only draft announcements can be updated", 409);
        }

        const allowed = ["title", "body", "announcement_type", "target_segment", "target_org_ids", "delivery_channels", "scheduled_at"];
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const key of allowed) {
            if (key in body) updates[key] = body[key];
        }

        const result = await adminClient
            .from("platform_announcements")
            .update(updates)
            .eq("id", id)
            .select(PLATFORM_ANNOUNCEMENT_SELECT)
            .single();

        if (result.error) throw result.error;

        return apiSuccess(result.data);
    } catch (err) {
        logError(`[superadmin/announcements/${id} PATCH]`, err);
        return apiError("Failed to update announcement", 500);
    }
}
