import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { getBusinessOsAccountDetail } from "@/lib/platform/business-os";
import { createOrgMemoryNote, recordOrgActivityEvent } from "@/lib/platform/org-memory";

type PostBody = {
    category?: "context" | "handoff" | "promise" | "support";
    title?: string;
    body?: string;
    pinned?: boolean;
};

function cleanText(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { orgId } = await params;

    try {
        const detail = await getBusinessOsAccountDetail(auth.adminClient as never, orgId);
        if (!detail) return apiError("Account not found", 404);
        return NextResponse.json({ org_memory: detail.org_memory });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/memory GET]", error);
        return apiError("Failed to load org memory", 500);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { orgId } = await params;

    let body: PostBody;
    try {
        body = await request.json() as PostBody;
    } catch {
        return apiError("Invalid JSON", 400);
    }

    const title = cleanText(body.title);
    const noteBody = cleanText(body.body);
    if (!title || !noteBody) return apiError("title and body are required", 400);

    try {
        const note = await createOrgMemoryNote(auth.adminClient as never, {
            org_id: orgId,
            author_id: auth.userId,
            category: body.category ?? "context",
            title,
            body: noteBody,
            pinned: Boolean(body.pinned),
        });
        if (!note) return apiError("Failed to create note", 500);

        await recordOrgActivityEvent(auth.adminClient as never, {
            org_id: orgId,
            actor_id: auth.userId,
            event_type: "memory_note_created",
            title: `Added ${note.category} note`,
            detail: title,
            entity_type: "memory_note",
            entity_id: note.id,
            source: "business_os",
            metadata: {
                category: note.category,
                pinned: note.pinned,
            },
        });

        return NextResponse.json({ note }, { status: 201 });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/memory POST]", error);
        return apiError("Failed to create org memory note", 500);
    }
}
