// GET/PATCH /api/superadmin/accounts/:orgId — account command center detail and state updates.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
    buildBusinessImpact,
    getAccountDetail,
    type AccountActivationStage,
    type AccountHealthBand,
    type AccountLifecycleStage,
    upsertGodAccountState,
} from "@/lib/platform/god-accounts";
import { recordOrgActivityEvent } from "@/lib/platform/org-memory";
import { getClientIpFromRequest, logPlatformActionWithTarget } from "@/lib/platform/audit";
import { logError } from "@/lib/observability/logger";

type PatchBody = {
    owner_id?: string | null;
    lifecycle_stage?: AccountLifecycleStage;
    activation_stage?: AccountActivationStage;
    health_score?: number;
    health_band?: AccountHealthBand;
    next_action?: string | null;
    next_action_due_at?: string | null;
    last_contacted_at?: string | null;
    renewal_at?: string | null;
    first_proposal_sent_at?: string | null;
    last_proposal_sent_at?: string | null;
    last_reviewed_at?: string | null;
    last_review_summary?: string | null;
    playbook?: string | null;
    notes?: string | null;
};

function normalizeNullableText(value: unknown): string | null {
    if (value === null) return null;
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function describePatch(patch: PatchBody): { title: string; detail: string } {
    const labels: Record<string, string> = {
        owner_id: "owner",
        lifecycle_stage: "lifecycle",
        activation_stage: "activation stage",
        health_score: "health score",
        health_band: "health band",
        next_action: "next action",
        next_action_due_at: "next action due date",
        last_contacted_at: "last contacted",
        renewal_at: "renewal date",
        first_proposal_sent_at: "first proposal sent",
        last_proposal_sent_at: "last proposal sent",
        last_reviewed_at: "last reviewed",
        last_review_summary: "review summary",
        playbook: "playbook",
        notes: "notes",
    };
    const changedFields = Object.keys(patch)
        .map((key) => labels[key] ?? key)
        .slice(0, 6);

    return {
        title: "Updated account operating state",
        detail: changedFields.length > 0
            ? `Changed ${changedFields.join(", ")}.`
            : "Account operating fields were updated.",
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { orgId } = await params;

    try {
        const detail = await getAccountDetail(auth.adminClient as never, orgId);
        if (!detail) return apiError("Account not found", 404);
        return NextResponse.json({
            ...detail,
            business_impact: buildBusinessImpact(detail.account_state, detail.snapshot),
        });
    } catch (error) {
        logError("[superadmin/accounts/:orgId GET]", error);
        return apiError("Failed to load account detail", 500);
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

    const patch: PatchBody = {};
    if (body.owner_id !== undefined) patch.owner_id = body.owner_id;
    if (body.lifecycle_stage !== undefined) patch.lifecycle_stage = body.lifecycle_stage;
    if (body.activation_stage !== undefined) patch.activation_stage = body.activation_stage;
    if (body.health_score !== undefined) patch.health_score = body.health_score;
    if (body.health_band !== undefined) patch.health_band = body.health_band;
    if (body.next_action !== undefined) patch.next_action = normalizeNullableText(body.next_action);
    if (body.next_action_due_at !== undefined) patch.next_action_due_at = normalizeNullableText(body.next_action_due_at);
    if (body.last_contacted_at !== undefined) patch.last_contacted_at = normalizeNullableText(body.last_contacted_at);
    if (body.renewal_at !== undefined) patch.renewal_at = normalizeNullableText(body.renewal_at);
    if (body.first_proposal_sent_at !== undefined) patch.first_proposal_sent_at = normalizeNullableText(body.first_proposal_sent_at);
    if (body.last_proposal_sent_at !== undefined) patch.last_proposal_sent_at = normalizeNullableText(body.last_proposal_sent_at);
    if (body.last_reviewed_at !== undefined) patch.last_reviewed_at = normalizeNullableText(body.last_reviewed_at);
    if (body.last_review_summary !== undefined) patch.last_review_summary = normalizeNullableText(body.last_review_summary);
    if (body.playbook !== undefined) patch.playbook = normalizeNullableText(body.playbook);
    if (body.notes !== undefined) patch.notes = normalizeNullableText(body.notes);

    if (Object.keys(patch).length === 0) return apiError("No fields to update", 400);

    try {
        const state = await upsertGodAccountState(auth.adminClient as never, orgId, patch);
        const detail = await getAccountDetail(auth.adminClient as never, orgId);
        await logPlatformActionWithTarget(
            auth.userId,
            `Updated account state for org ${orgId}`,
            "org_management",
            "organization",
            orgId,
            { patch },
            getClientIpFromRequest(request),
        );
        const memoryEvent = describePatch(patch);
        await recordOrgActivityEvent(auth.adminClient as never, {
            org_id: orgId,
            actor_id: auth.userId,
            event_type: "account_state_updated",
            title: memoryEvent.title,
            detail: memoryEvent.detail,
            entity_type: "organization",
            entity_id: orgId,
            source: "business_os",
            metadata: { patch },
        });
        return NextResponse.json({
            account_state: state,
            business_impact: detail ? buildBusinessImpact(detail.account_state, detail.snapshot) : null,
        });
    } catch (error) {
        logError("[superadmin/accounts/:orgId PATCH]", error);
        return apiError("Failed to update account state", 500);
    }
}
