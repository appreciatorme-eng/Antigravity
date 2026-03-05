// PATCH /api/superadmin/announcements/:id — update a draft announcement.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

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
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    try {
        // Only allow updating drafts
        const current = await adminClient
            .from("platform_announcements")
            .select("status")
            .eq("id", id)
            .single();

        if (!current.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (current.data.status !== "draft") {
            return NextResponse.json({ error: "Only draft announcements can be updated" }, { status: 409 });
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
            .select()
            .single();

        if (result.error) throw result.error;

        return NextResponse.json(result.data);
    } catch (err) {
        console.error(`[superadmin/announcements/${id} PATCH]`, err);
        return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
    }
}
