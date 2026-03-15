// GET + POST /api/superadmin/announcements — list all and create new announcements.

import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logPlatformAction } from "@/lib/platform/audit";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import type { Database } from "@/lib/database.types";

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
type PlatformAnnouncementRow = Pick<
    Database["public"]["Tables"]["platform_announcements"]["Row"],
    "announcement_type" | "body" | "created_at" | "delivery_channels" | "id" | "recipient_count" | "scheduled_at" | "sent_at" | "sent_by" | "status" | "target_org_ids" | "target_segment" | "title" | "updated_at"
>;

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;
    const page = Math.max(0, Number(request.nextUrl.searchParams.get("page") || 0));
    const limit = Math.min(50, Math.max(10, Number(request.nextUrl.searchParams.get("limit") || 20)));

    try {
        const result = await adminClient
            .from("platform_announcements")
            .select(PLATFORM_ANNOUNCEMENT_SELECT, { count: "exact" })
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
        return apiError("Failed to load announcements", 500);
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;
    if (!passesMutationCsrfGuard(request)) {
        return NextResponse.json(
            { error: "CSRF validation failed for admin mutation" },
            { status: 403 }
        );
    }

    const { adminClient, userId } = auth;

    let body: Record<string, unknown>;
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

    const { title, body: msgBody, announcement_type, target_segment, target_org_ids, delivery_channels } = body;
    if (!title || !msgBody || !announcement_type) {
        return apiError("title, body, announcement_type are required", 400);
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
            .select(PLATFORM_ANNOUNCEMENT_SELECT)
            .single();
        const announcement = result.data as unknown as PlatformAnnouncementRow | null;

        if (result.error) throw result.error;

        await logPlatformAction(userId, "announcement_created", "announcement", {
            announcement_id: announcement?.id, title,
        });

        return apiSuccess(announcement, { status: 201 });
    } catch (err) {
        console.error("[superadmin/announcements POST]", err);
        return apiError("Failed to create announcement", 500);
    }
}
