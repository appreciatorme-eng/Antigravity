import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { loadCommsSequences, updateCommsSequence, type CommsChannel } from "@/lib/platform/business-comms";
import { runBusinessOsEventAutomation } from "@/lib/platform/business-os";
import { getClientIpFromRequest, logPlatformActionWithTarget } from "@/lib/platform/audit";
import { recordOrgActivityEvent } from "@/lib/platform/org-memory";
import { logError } from "@/lib/observability/logger";

type ReplyDisposition = "positive" | "blocked" | "needs_follow_up" | "not_interested";

type PostBody = {
    reply_summary?: string;
    disposition?: ReplyDisposition;
    channel?: CommsChannel;
};

function cleanText(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function normalizeMetadata(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function parseDisposition(value: unknown): ReplyDisposition {
    switch (value) {
        case "positive":
        case "blocked":
        case "not_interested":
            return value;
        default:
            return "needs_follow_up";
    }
}

function parseChannel(value: unknown): CommsChannel {
    switch (value) {
        case "email":
        case "whatsapp":
        case "in_app":
            return value;
        default:
            return "mixed";
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string; id: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { orgId, id } = await params;
    let body: PostBody;
    try {
        body = await request.json() as PostBody;
    } catch {
        return apiError("Invalid JSON", 400);
    }

    const replySummary = cleanText(body.reply_summary);
    if (!replySummary) return apiError("reply_summary is required", 400);

    try {
        const sequenceList = await loadCommsSequences(auth.adminClient as never, orgId, "all");
        const commsSequence = sequenceList.find((item) => item.id === id) ?? null;
        if (!commsSequence) return apiError("Communication sequence not found", 404);

        const metadata = normalizeMetadata(commsSequence.metadata) ?? {};
        const updatedSequence = await updateCommsSequence(auth.adminClient as never, id, {
            channel: body.channel ? parseChannel(body.channel) : undefined,
            metadata: {
                ...metadata,
                send_state: "replied",
                customer_replied_at: new Date().toISOString(),
                customer_replied_by: auth.userId,
                reply_summary: replySummary,
                reply_disposition: parseDisposition(body.disposition),
                reply_channel: parseChannel(body.channel ?? commsSequence.channel),
            },
        });
        if (!updatedSequence) return apiError("Failed to update communication sequence", 500);

        await logPlatformActionWithTarget(
            auth.userId,
            `Recorded customer reply for org ${orgId}`,
            "automation",
            "organization",
            orgId,
            {
                comms_sequence_id: id,
                disposition: parseDisposition(body.disposition),
                channel: parseChannel(body.channel ?? commsSequence.channel),
            },
            getClientIpFromRequest(request),
        );
        await recordOrgActivityEvent(auth.adminClient as never, {
            org_id: orgId,
            actor_id: auth.userId,
            event_type: "comms_sequence_reply_recorded",
            title: "Recorded customer reply",
            detail: replySummary,
            entity_type: "comms_sequence",
            entity_id: id,
            source: "business_os",
            metadata: {
                disposition: parseDisposition(body.disposition),
                channel: parseChannel(body.channel ?? commsSequence.channel),
            },
        });

        const automation = await runBusinessOsEventAutomation(auth.adminClient as never, {
            orgId,
            currentUserId: auth.userId,
            trigger: "comms_updated",
        });

        return NextResponse.json({
            sequence: updatedSequence,
            automation,
        }, { status: 201 });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/comms/:id/reply POST]", error);
        return apiError("Failed to record communication reply", 500);
    }
}
