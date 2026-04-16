import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { updateGodWorkItem } from "@/lib/platform/god-accounts";
import { logError } from "@/lib/observability/logger";
import { recordOrgActivityEvent } from "@/lib/platform/org-memory";
import { loadWorkItemOutcomes, recordWorkItemOutcome, type WorkItemOutcomeType } from "@/lib/platform/work-item-outcomes";

type WorkItemRow = {
    id: string;
    org_id: string | null;
    kind: string | null;
    status: string | null;
    title: string | null;
};

type PostBody = {
    outcome_type?: WorkItemOutcomeType;
    note?: string | null;
    mark_done?: boolean;
    metadata?: Record<string, unknown> | null;
};

const ALLOWED_OUTCOMES = new Set<WorkItemOutcomeType>([
    "recovered",
    "no_change",
    "worse",
    "churned",
    "payment_collected",
    "proposal_sent",
    "proposal_approved",
    "trip_converted",
]);

function cleanText(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

async function loadWorkItemRow(adminClient: { from: (table: string) => any }, id: string): Promise<WorkItemRow | null> {
    const result = await adminClient
        .from("god_work_items")
        .select("id, org_id, kind, status, title")
        .eq("id", id)
        .maybeSingle();
    if (!result.data) return null;
    return result.data as WorkItemRow;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 20)));

    try {
        const [item, outcomes] = await Promise.all([
            loadWorkItemRow(auth.adminClient as never, id),
            loadWorkItemOutcomes(auth.adminClient as never, { workItemId: id, limit }),
        ]);
        if (!item) return apiError("Work item not found", 404);
        return NextResponse.json({ work_item: item, outcomes, total: outcomes.length });
    } catch (error) {
        logError("[superadmin/work-items/:id/outcomes GET]", error);
        return apiError("Failed to load work item outcomes", 500);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    let body: PostBody;
    try {
        body = await request.json() as PostBody;
    } catch {
        return apiError("Invalid JSON", 400);
    }

    if (!body.outcome_type || !ALLOWED_OUTCOMES.has(body.outcome_type)) {
        return apiError("Invalid outcome_type", 400);
    }

    try {
        const item = await loadWorkItemRow(auth.adminClient as never, id);
        if (!item) return apiError("Work item not found", 404);
        if (!item.org_id) return apiError("Work item is missing org context", 400);

        const outcome = await recordWorkItemOutcome(auth.adminClient as never, {
            work_item_id: id,
            org_id: item.org_id,
            outcome_type: body.outcome_type,
            note: cleanText(body.note),
            metadata: body.metadata ?? null,
            recorded_by: auth.userId,
        });

        let updatedWorkItem = null;
        if (body.mark_done) {
            updatedWorkItem = await updateGodWorkItem(auth.adminClient as never, id, {
                status: "done",
            });
        }

        await logPlatformAction(
            auth.userId,
            "Recorded work item outcome",
            "org_management",
            {
                work_item_id: id,
                outcome_type: body.outcome_type,
                mark_done: Boolean(body.mark_done),
            },
            getClientIpFromRequest(request),
        );

        await recordOrgActivityEvent(auth.adminClient as never, {
            org_id: item.org_id,
            actor_id: auth.userId,
            event_type: "work_item_outcome_recorded",
            title: `Recorded ${body.outcome_type.replaceAll("_", " ")} outcome`,
            detail: `${item.title ?? "Work item"}${body.mark_done ? " • marked done" : ""}`,
            entity_type: "work_item",
            entity_id: id,
            source: "business_os",
            metadata: {
                kind: item.kind,
                previous_status: item.status,
                outcome_type: body.outcome_type,
                note: cleanText(body.note),
            },
        });

        return NextResponse.json({
            outcome,
            work_item: updatedWorkItem,
        }, { status: 201 });
    } catch (error) {
        logError("[superadmin/work-items/:id/outcomes POST]", error);
        return apiError("Failed to record work item outcome", 500);
    }
}
