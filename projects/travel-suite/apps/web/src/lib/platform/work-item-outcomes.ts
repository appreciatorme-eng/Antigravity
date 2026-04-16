import type { SupabaseClient } from "@supabase/supabase-js";
import type { GodWorkItemKind } from "@/lib/platform/god-accounts";

type AdminClient = SupabaseClient;

export type WorkItemOutcomeType =
    | "recovered"
    | "no_change"
    | "worse"
    | "churned"
    | "payment_collected"
    | "proposal_sent"
    | "proposal_approved"
    | "trip_converted";

export type GodWorkItemOutcome = {
    id: string;
    work_item_id: string;
    org_id: string;
    outcome_type: WorkItemOutcomeType;
    note: string | null;
    metadata: Record<string, unknown> | null;
    recorded_by: string | null;
    recorded_at: string | null;
    created_at: string | null;
};

export type WorkItemOutcomeLearning = {
    kind: GodWorkItemKind;
    total: number;
    success: number;
    neutral: number;
    fail: number;
    success_rate: number;
};

const SUCCESS_OUTCOMES = new Set<WorkItemOutcomeType>([
    "recovered",
    "payment_collected",
    "proposal_sent",
    "proposal_approved",
    "trip_converted",
]);

const FAIL_OUTCOMES = new Set<WorkItemOutcomeType>(["worse", "churned"]);

function normalizeIso(value: unknown): string | null {
    if (typeof value !== "string" || !value.trim()) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cleanText(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function normalizeOutcomeType(value: unknown): WorkItemOutcomeType {
    switch (value) {
        case "recovered":
        case "no_change":
        case "worse":
        case "churned":
        case "payment_collected":
        case "proposal_sent":
        case "proposal_approved":
        case "trip_converted":
            return value;
        default:
            return "no_change";
    }
}

function normalizeOutcome(row: Record<string, unknown>): GodWorkItemOutcome {
    return {
        id: String(row.id),
        work_item_id: String(row.work_item_id),
        org_id: String(row.org_id),
        outcome_type: normalizeOutcomeType(row.outcome_type),
        note: cleanText(row.note),
        metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? row.metadata as Record<string, unknown>
            : null,
        recorded_by: typeof row.recorded_by === "string" && row.recorded_by.trim() ? row.recorded_by : null,
        recorded_at: normalizeIso(row.recorded_at),
        created_at: normalizeIso(row.created_at),
    };
}

export async function recordWorkItemOutcome(
    db: AdminClient,
    payload: {
        work_item_id: string;
        org_id: string;
        outcome_type: WorkItemOutcomeType;
        note?: string | null;
        metadata?: Record<string, unknown> | null;
        recorded_by?: string | null;
    },
): Promise<GodWorkItemOutcome> {
    const result = await db
        .from("god_work_item_outcomes")
        .insert({
            work_item_id: payload.work_item_id,
            org_id: payload.org_id,
            outcome_type: payload.outcome_type,
            note: cleanText(payload.note),
            metadata: payload.metadata ?? {},
            recorded_by: payload.recorded_by ?? null,
        })
        .select("*")
        .single();
    return normalizeOutcome((result.data ?? {}) as Record<string, unknown>);
}

export async function loadWorkItemOutcomes(
    db: AdminClient,
    filters: { workItemId?: string; orgId?: string; limit?: number } = {},
): Promise<GodWorkItemOutcome[]> {
    let query = db
        .from("god_work_item_outcomes")
        .select("*")
        .order("recorded_at", { ascending: false });
    if (filters.workItemId) query = query.eq("work_item_id", filters.workItemId);
    if (filters.orgId) query = query.eq("org_id", filters.orgId);
    if (filters.limit) query = query.limit(filters.limit);
    const result = await query;
    return ((result.data ?? []) as Array<Record<string, unknown>>).map((row) => normalizeOutcome(row));
}

export async function buildWorkItemOutcomeLearning(
    db: AdminClient,
    params: { orgIds?: string[]; sinceDays?: number } = {},
): Promise<WorkItemOutcomeLearning[]> {
    const sinceDays = Math.max(7, params.sinceDays ?? 30);
    const sinceIso = new Date(Date.now() - (sinceDays * 86_400_000)).toISOString();

    let outcomeQuery = db
        .from("god_work_item_outcomes")
        .select("work_item_id, outcome_type, recorded_at")
        .gte("recorded_at", sinceIso);

    if (params.orgIds && params.orgIds.length > 0) {
        outcomeQuery = outcomeQuery.in("org_id", params.orgIds);
    }

    const outcomeRows = (await outcomeQuery).data as Array<{
        work_item_id: string;
        outcome_type: string;
        recorded_at: string | null;
    }> | null;
    const rows = outcomeRows ?? [];
    if (rows.length === 0) return [];

    const uniqueWorkItemIds = Array.from(new Set(rows.map((row) => row.work_item_id)));
    const workItemResult = await db
        .from("god_work_items")
        .select("id, kind")
        .in("id", uniqueWorkItemIds);
    const kindByWorkItem = new Map<string, GodWorkItemKind>();
    for (const row of ((workItemResult.data ?? []) as Array<{ id: string; kind: string }>)) {
        const kind = row.kind === "renewal"
            || row.kind === "churn_risk"
            || row.kind === "support_escalation"
            || row.kind === "incident_followup"
            || row.kind === "growth_followup"
            ? row.kind
            : "collections";
        kindByWorkItem.set(row.id, kind);
    }

    const acc = new Map<GodWorkItemKind, { total: number; success: number; neutral: number; fail: number }>();

    for (const row of rows) {
        const kind = kindByWorkItem.get(row.work_item_id);
        if (!kind) continue;
        const entry = acc.get(kind) ?? { total: 0, success: 0, neutral: 0, fail: 0 };
        entry.total += 1;
        const outcome = normalizeOutcomeType(row.outcome_type);
        if (SUCCESS_OUTCOMES.has(outcome)) entry.success += 1;
        else if (FAIL_OUTCOMES.has(outcome)) entry.fail += 1;
        else entry.neutral += 1;
        acc.set(kind, entry);
    }

    return Array.from(acc.entries())
        .map(([kind, value]) => ({
            kind,
            total: value.total,
            success: value.success,
            neutral: value.neutral,
            fail: value.fail,
            success_rate: value.total > 0 ? Number((value.success / value.total).toFixed(3)) : 0,
        }))
        .sort((left, right) => right.total - left.total || right.success_rate - left.success_rate);
}
