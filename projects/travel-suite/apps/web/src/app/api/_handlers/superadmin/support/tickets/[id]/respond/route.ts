// POST /api/superadmin/support/tickets/:id/respond — add admin response and update status.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logPlatformAction, getClientIpFromRequest } from "@/lib/platform/audit";
import { logError } from "@/lib/observability/logger";
import { saveWorkItemMeta } from "@/lib/platform/god-mode";
import { recordOrgActivityEvent } from "@/lib/platform/org-memory";

async function lookupTicketOrgId(adminClient: { from: (table: string) => any }, ticketId: string): Promise<string | null> {
    const result = await adminClient
        .from("support_tickets")
        .select("profiles!support_tickets_user_id_fkey(organization_id, organizations(id))")
        .eq("id", ticketId)
        .maybeSingle();

    const profile = result.data && typeof result.data === "object" && "profiles" in result.data
        ? (result.data.profiles as {
            organization_id?: string | null;
            organizations?: { id?: string | null } | null;
        } | null)
        : null;

    return profile?.organizations?.id ?? profile?.organization_id ?? null;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const { adminClient, userId } = auth;

    let body: { response?: string; new_status?: string };
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

    if (!body.response?.trim()) {
        return apiError("response is required", 400);
    }

    const allowedStatuses = ["open", "in_progress", "resolved", "closed"];
    const newStatus = body.new_status && allowedStatuses.includes(body.new_status)
        ? body.new_status
        : "resolved";

    try {
        const result = await adminClient
            .from("support_tickets")
            .update({
                admin_response: body.response.trim(),
                responded_at: new Date().toISOString(),
                responded_by: userId,
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select("id, status, responded_at")
            .single();

        if (result.error || !result.data) {
            return apiError("Ticket not found", 404);
        }

        await logPlatformAction(
            userId,
            "support_ticket_responded",
            "support",
            { ticket_id: id, new_status: newStatus },
            getClientIpFromRequest(request)
        );

        await saveWorkItemMeta(
            adminClient,
            "support_ticket",
            id,
            {
                owner_id: userId,
                escalation_level: (newStatus === "resolved" || newStatus === "closed") ? "normal" : undefined,
                sla_due_at: (newStatus === "resolved" || newStatus === "closed") ? null : undefined,
            },
            userId,
        );
        const orgId = await lookupTicketOrgId(adminClient, id);
        await recordOrgActivityEvent(adminClient as never, {
            org_id: orgId,
            actor_id: userId,
            event_type: "support_ticket_responded",
            title: "Responded to support ticket",
            detail: `${body.response.trim().slice(0, 180)}${body.response.trim().length > 180 ? "..." : ""}`,
            entity_type: "ticket",
            entity_id: id,
            source: "support_queue",
            metadata: {
                new_status: newStatus,
            },
        });

        return NextResponse.json({
            id: result.data.id,
            status: result.data.status,
            responded_at: result.data.responded_at,
        });
    } catch (err) {
        logError(`[superadmin/support/tickets/${id}/respond]`, err);
        return apiError("Failed to respond to ticket", 500);
    }
}
