import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import {
    createCommitment,
    loadCommitments,
    updateCommitment,
    type CommitmentSeverity,
    type CommitmentSource,
    type CommitmentStatus,
} from "@/lib/platform/business-comms";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { recordOrgActivityEvent } from "@/lib/platform/org-memory";

type PostBody = {
    owner_id?: string | null;
    source?: CommitmentSource;
    title?: string;
    detail?: string | null;
    severity?: CommitmentSeverity;
    promised_at?: string | null;
    due_at?: string;
    metadata?: Record<string, unknown> | null;
};

type PatchBody = {
    id?: string;
    owner_id?: string | null;
    source?: CommitmentSource;
    title?: string;
    detail?: string | null;
    severity?: CommitmentSeverity;
    status?: CommitmentStatus;
    due_at?: string;
    metadata?: Record<string, unknown> | null;
};

const SOURCES = new Set<CommitmentSource>(["support", "sales", "collections", "incident", "ops"]);
const SEVERITIES = new Set<CommitmentSeverity>(["low", "medium", "high", "critical"]);
const STATUSES = new Set<CommitmentStatus>(["open", "met", "breached", "cancelled"]);

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
    const status = (request.nextUrl.searchParams.get("status")?.trim() ?? "all") as CommitmentStatus | "all";

    try {
        const commitments = await loadCommitments(auth.adminClient as never, orgId, status);
        const now = Date.now();
        const breached = commitments.filter((commitment) => {
            if (commitment.status === "breached") return true;
            if (commitment.status !== "open" || !commitment.due_at) return false;
            return new Date(commitment.due_at).getTime() < now;
        });
        return NextResponse.json({
            commitments,
            breached_commitments: breached,
            total: commitments.length,
        });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/commitments GET]", error);
        return apiError("Failed to load commitments", 500);
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
    const dueAt = cleanText(body.due_at);
    if (!title || !dueAt) return apiError("title and due_at are required", 400);
    if (body.source && !SOURCES.has(body.source)) return apiError("Invalid source", 400);
    if (body.severity && !SEVERITIES.has(body.severity)) return apiError("Invalid severity", 400);

    try {
        const commitment = await createCommitment(auth.adminClient as never, {
            org_id: orgId,
            owner_id: body.owner_id ?? null,
            source: body.source ?? "ops",
            title,
            detail: cleanText(body.detail),
            severity: body.severity ?? "medium",
            promised_at: cleanText(body.promised_at),
            due_at: dueAt,
            metadata: body.metadata ?? null,
        });

        await logPlatformAction(
            auth.userId,
            "Created org commitment",
            "org_management",
            {
                org_id: orgId,
                commitment_id: commitment.id,
                severity: commitment.severity,
                due_at: commitment.due_at,
            },
            getClientIpFromRequest(request),
        );
        await recordOrgActivityEvent(auth.adminClient as never, {
            org_id: orgId,
            actor_id: auth.userId,
            event_type: "commitment_created",
            title: "Created commitment",
            detail: `${commitment.title} • due ${commitment.due_at ?? "unspecified"}`,
            entity_type: "commitment",
            entity_id: commitment.id,
            source: "business_os",
            metadata: { severity: commitment.severity, source: commitment.source },
        });

        return NextResponse.json({ commitment }, { status: 201 });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/commitments POST]", error);
        return apiError("Failed to create commitment", 500);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { orgId } = await params;
    let body: PatchBody;
    try {
        body = await request.json() as PatchBody;
    } catch {
        return apiError("Invalid JSON", 400);
    }
    const id = cleanText(body.id);
    if (!id) return apiError("id is required", 400);
    if (body.source && !SOURCES.has(body.source)) return apiError("Invalid source", 400);
    if (body.severity && !SEVERITIES.has(body.severity)) return apiError("Invalid severity", 400);
    if (body.status && !STATUSES.has(body.status)) return apiError("Invalid status", 400);

    try {
        const commitment = await updateCommitment(auth.adminClient as never, id, {
            owner_id: body.owner_id,
            source: body.source,
            title: body.title ? body.title.trim() : undefined,
            detail: body.detail !== undefined ? cleanText(body.detail) : undefined,
            severity: body.severity,
            status: body.status,
            due_at: cleanText(body.due_at) ?? undefined,
            metadata: body.metadata,
        });
        if (!commitment) return apiError("Commitment not found", 404);

        await logPlatformAction(
            auth.userId,
            "Updated org commitment",
            "org_management",
            {
                org_id: orgId,
                commitment_id: commitment.id,
                status: commitment.status,
                due_at: commitment.due_at,
            },
            getClientIpFromRequest(request),
        );
        await recordOrgActivityEvent(auth.adminClient as never, {
            org_id: orgId,
            actor_id: auth.userId,
            event_type: "commitment_updated",
            title: `Updated commitment: ${commitment.status}`,
            detail: `${commitment.title} • due ${commitment.due_at ?? "unspecified"}`,
            entity_type: "commitment",
            entity_id: commitment.id,
            source: "business_os",
            metadata: { severity: commitment.severity, status: commitment.status },
        });

        return NextResponse.json({ commitment });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/commitments PATCH]", error);
        return apiError("Failed to update commitment", 500);
    }
}
