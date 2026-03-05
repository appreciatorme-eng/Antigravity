// POST /api/superadmin/support/tickets/:id/respond — add admin response and update status.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logPlatformAction, getClientIpFromRequest } from "@/lib/platform/audit";

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
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.response?.trim()) {
        return NextResponse.json({ error: "response is required" }, { status: 400 });
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
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        await logPlatformAction(
            userId,
            "support_ticket_responded",
            "support",
            { ticket_id: id, new_status: newStatus },
            getClientIpFromRequest(request)
        );

        return NextResponse.json({
            id: result.data.id,
            status: result.data.status,
            responded_at: result.data.responded_at,
        });
    } catch (err) {
        console.error(`[superadmin/support/tickets/${id}/respond]`, err);
        return NextResponse.json({ error: "Failed to respond to ticket" }, { status: 500 });
    }
}
