// GET + POST /api/superadmin/announcements — list all and create new announcements.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logPlatformAction } from "@/lib/platform/audit";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;
    const page = Math.max(0, Number(request.nextUrl.searchParams.get("page") || 0));
    const limit = Math.min(50, Math.max(10, Number(request.nextUrl.searchParams.get("limit") || 20)));

    try {
        const result = await adminClient
            .from("platform_announcements")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        return NextResponse.json({
            announcements: result.data ?? [],
            total: result.count ?? 0,
            page,
            pages: Math.ceil((result.count ?? 0) / limit),
        });
    } catch (err) {
        console.error("[superadmin/announcements GET]", err);
        return NextResponse.json({ error: "Failed to load announcements" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient, userId } = auth;

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { title, body: msgBody, announcement_type, target_segment, target_org_ids, delivery_channels } = body;
    if (!title || !msgBody || !announcement_type) {
        return NextResponse.json({ error: "title, body, announcement_type are required" }, { status: 400 });
    }

    try {
        const result = await adminClient
            .from("platform_announcements")
            .insert({
                title: String(title),
                body: String(msgBody),
                announcement_type: String(announcement_type),
                target_segment: String(target_segment ?? "all"),
                target_org_ids: Array.isArray(target_org_ids) ? target_org_ids : [],
                delivery_channels: Array.isArray(delivery_channels) ? delivery_channels : ["in_app"],
                status: "draft",
                sent_by: userId,
            })
            .select()
            .single();

        if (result.error) throw result.error;

        await logPlatformAction(userId, "announcement_created", "announcement", {
            announcement_id: result.data.id, title,
        });

        return NextResponse.json(result.data, { status: 201 });
    } catch (err) {
        console.error("[superadmin/announcements POST]", err);
        return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
    }
}
