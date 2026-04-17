import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import {
    createCommsSequence,
    loadCommsSequences,
    updateCommsSequence,
    type CommsChannel,
    type CommsSequenceStatus,
    type CommsSequenceType,
} from "@/lib/platform/business-comms";
import { runBusinessOsEventAutomation } from "@/lib/platform/business-os";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { recordOrgActivityEvent } from "@/lib/platform/org-memory";

type PostBody = {
    owner_id?: string | null;
    sequence_type?: CommsSequenceType;
    status?: CommsSequenceStatus;
    channel?: CommsChannel;
    step_index?: number;
    last_sent_at?: string | null;
    next_follow_up_at?: string | null;
    promise?: string | null;
    metadata?: Record<string, unknown> | null;
};

type PatchBody = PostBody & { id?: string };

const SEQUENCE_TYPES = new Set<CommsSequenceType>([
    "activation_rescue",
    "viewed_not_approved",
    "collections",
    "incident_recovery",
    "renewal_prep",
]);

const SEQUENCE_STATUS = new Set<CommsSequenceStatus>(["active", "paused", "completed"]);
const CHANNELS = new Set<CommsChannel>(["email", "whatsapp", "in_app", "mixed"]);

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
    const status = (request.nextUrl.searchParams.get("status")?.trim() ?? "all") as CommsSequenceStatus | "all";

    try {
        const sequences = await loadCommsSequences(auth.adminClient as never, orgId, status);
        return NextResponse.json({ sequences, total: sequences.length });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/comms GET]", error);
        return apiError("Failed to load communication sequences", 500);
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

    if (!body.sequence_type || !SEQUENCE_TYPES.has(body.sequence_type)) {
        return apiError("Invalid sequence_type", 400);
    }
    if (body.status && !SEQUENCE_STATUS.has(body.status)) return apiError("Invalid status", 400);
    if (body.channel && !CHANNELS.has(body.channel)) return apiError("Invalid channel", 400);

    try {
        const sequence = await createCommsSequence(auth.adminClient as never, {
            org_id: orgId,
            owner_id: body.owner_id ?? null,
            sequence_type: body.sequence_type,
            status: body.status ?? "active",
            channel: body.channel ?? "mixed",
            step_index: Number.isFinite(Number(body.step_index)) ? Number(body.step_index) : 0,
            last_sent_at: cleanText(body.last_sent_at),
            next_follow_up_at: cleanText(body.next_follow_up_at),
            promise: cleanText(body.promise),
            metadata: body.metadata ?? null,
        });

        await logPlatformAction(
            auth.userId,
            "Created communication sequence",
            "org_management",
            {
                org_id: orgId,
                sequence_id: sequence.id,
                sequence_type: sequence.sequence_type,
                status: sequence.status,
            },
            getClientIpFromRequest(request),
        );
        await recordOrgActivityEvent(auth.adminClient as never, {
            org_id: orgId,
            actor_id: auth.userId,
            event_type: "comms_sequence_created",
            title: `Started ${sequence.sequence_type.replaceAll("_", " ")} sequence`,
            detail: sequence.promise ?? `Channel: ${sequence.channel}`,
            entity_type: "comms_sequence",
            entity_id: sequence.id,
            source: "business_os",
            metadata: { status: sequence.status, channel: sequence.channel },
        });

        const automation = await runBusinessOsEventAutomation(auth.adminClient as never, {
            orgId,
            currentUserId: auth.userId,
            trigger: "comms_updated",
        });
        return NextResponse.json({ sequence, automation }, { status: 201 });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/comms POST]", error);
        return apiError("Failed to create communication sequence", 500);
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
    if (body.status && !SEQUENCE_STATUS.has(body.status)) return apiError("Invalid status", 400);
    if (body.channel && !CHANNELS.has(body.channel)) return apiError("Invalid channel", 400);

    try {
        const sequence = await updateCommsSequence(auth.adminClient as never, id, {
            owner_id: body.owner_id,
            status: body.status,
            channel: body.channel,
            step_index: body.step_index,
            last_sent_at: body.last_sent_at !== undefined ? cleanText(body.last_sent_at) : undefined,
            next_follow_up_at: body.next_follow_up_at !== undefined ? cleanText(body.next_follow_up_at) : undefined,
            promise: body.promise !== undefined ? cleanText(body.promise) : undefined,
            metadata: body.metadata,
        });
        if (!sequence) return apiError("Sequence not found", 404);

        await logPlatformAction(
            auth.userId,
            "Updated communication sequence",
            "org_management",
            {
                org_id: orgId,
                sequence_id: sequence.id,
                status: sequence.status,
                step_index: sequence.step_index,
            },
            getClientIpFromRequest(request),
        );
        await recordOrgActivityEvent(auth.adminClient as never, {
            org_id: orgId,
            actor_id: auth.userId,
            event_type: "comms_sequence_updated",
            title: `Updated ${sequence.sequence_type.replaceAll("_", " ")} sequence`,
            detail: `${sequence.status} • next follow-up ${sequence.next_follow_up_at ?? "not set"}`,
            entity_type: "comms_sequence",
            entity_id: sequence.id,
            source: "business_os",
            metadata: { step_index: sequence.step_index, channel: sequence.channel },
        });

        const automation = await runBusinessOsEventAutomation(auth.adminClient as never, {
            orgId,
            currentUserId: auth.userId,
            trigger: "comms_updated",
        });
        return NextResponse.json({ sequence, automation });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/comms PATCH]", error);
        return apiError("Failed to update communication sequence", 500);
    }
}
