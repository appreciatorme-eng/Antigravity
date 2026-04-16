// GET/POST/PATCH /api/superadmin/work-items — unified god mode queue management.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
    createGodWorkItem,
    loadGodWorkItems,
    type GodWorkItemKind,
    type GodWorkItemSeverity,
    type GodWorkItemStatus,
    type GodWorkItemTargetType,
    updateGodWorkItem,
} from "@/lib/platform/god-accounts";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { logError } from "@/lib/observability/logger";

type PostBody = {
    kind: GodWorkItemKind;
    target_type: GodWorkItemTargetType;
    target_id: string;
    org_id?: string | null;
    owner_id?: string | null;
    status?: GodWorkItemStatus;
    severity?: GodWorkItemSeverity;
    title: string;
    summary?: string | null;
    due_at?: string | null;
    metadata?: Record<string, unknown> | null;
};

type PatchBody = Partial<PostBody> & { id: string };

function cleanText(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    const orgId = cleanText(searchParams.get("org_id"));
    const owner = cleanText(searchParams.get("owner"));
    const targetType = cleanText(searchParams.get("target_type")) as GodWorkItemTargetType | null;
    const targetId = cleanText(searchParams.get("target_id"));
    const status = (searchParams.get("status")?.trim() ?? "active") as GodWorkItemStatus | "active" | "all";
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

    try {
        const workItems = await loadGodWorkItems(auth.adminClient as never, {
            orgIds: orgId ? [orgId] : undefined,
            ownerId: owner === "unowned" ? "unowned" : owner ?? undefined,
            targetType: targetType ?? undefined,
            targetId: targetId ?? undefined,
            status,
            limit,
        });
        return NextResponse.json({ work_items: workItems, total: workItems.length });
    } catch (error) {
        logError("[superadmin/work-items GET]", error);
        return apiError("Failed to load work items", 500);
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    let body: PostBody;
    try {
        body = await request.json() as PostBody;
    } catch {
        return apiError("Invalid JSON", 400);
    }

    if (!cleanText(body.title) || !cleanText(body.target_id)) {
        return apiError("title and target_id are required", 400);
    }

    try {
        const workItem = await createGodWorkItem(auth.adminClient as never, {
            kind: body.kind,
            target_type: body.target_type,
            target_id: body.target_id,
            org_id: body.org_id ?? null,
            owner_id: body.owner_id ?? null,
            status: body.status ?? "open",
            severity: body.severity ?? "medium",
            title: cleanText(body.title) ?? "Untitled work item",
            summary: cleanText(body.summary),
            due_at: cleanText(body.due_at),
            metadata: body.metadata ?? null,
        });
        await logPlatformAction(
            auth.userId,
            "Created god mode work item",
            "support",
            { work_item_id: workItem.id, kind: workItem.kind, target_type: workItem.target_type, target_id: workItem.target_id },
            getClientIpFromRequest(request),
        );
        return NextResponse.json({ work_item: workItem }, { status: 201 });
    } catch (error) {
        logError("[superadmin/work-items POST]", error);
        return apiError("Failed to create work item", 500);
    }
}

export async function PATCH(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    let body: PatchBody;
    try {
        body = await request.json() as PatchBody;
    } catch {
        return apiError("Invalid JSON", 400);
    }
    if (!cleanText(body.id)) return apiError("id is required", 400);

    try {
        const workItem = await updateGodWorkItem(auth.adminClient as never, body.id, {
            owner_id: body.owner_id,
            status: body.status,
            severity: body.severity,
            title: body.title ? cleanText(body.title) ?? undefined : undefined,
            summary: body.summary !== undefined ? cleanText(body.summary) : undefined,
            due_at: body.due_at !== undefined ? cleanText(body.due_at) : undefined,
            metadata: body.metadata,
            kind: body.kind,
            target_type: body.target_type,
            target_id: body.target_id,
            org_id: body.org_id,
        });
        if (!workItem) return apiError("Work item not found", 404);
        await logPlatformAction(
            auth.userId,
            "Updated god mode work item",
            "support",
            { work_item_id: workItem.id, status: workItem.status, owner_id: workItem.owner_id },
            getClientIpFromRequest(request),
        );
        return NextResponse.json({ work_item: workItem });
    } catch (error) {
        logError("[superadmin/work-items PATCH]", error);
        return apiError("Failed to update work item", 500);
    }
}
