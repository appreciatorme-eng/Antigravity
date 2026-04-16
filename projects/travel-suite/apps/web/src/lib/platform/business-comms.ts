import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient;

export type CommsSequenceType =
    | "activation_rescue"
    | "viewed_not_approved"
    | "collections"
    | "incident_recovery"
    | "renewal_prep";

export type CommsSequenceStatus = "active" | "paused" | "completed";
export type CommsChannel = "email" | "whatsapp" | "in_app" | "mixed";

export type GodCommsSequence = {
    id: string;
    org_id: string;
    owner_id: string | null;
    sequence_type: CommsSequenceType;
    status: CommsSequenceStatus;
    channel: CommsChannel;
    step_index: number;
    last_sent_at: string | null;
    next_follow_up_at: string | null;
    promise: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string | null;
    updated_at: string | null;
};

export type CommitmentSource = "support" | "sales" | "collections" | "incident" | "ops";
export type CommitmentSeverity = "low" | "medium" | "high" | "critical";
export type CommitmentStatus = "open" | "met" | "breached" | "cancelled";

export type GodCommitment = {
    id: string;
    org_id: string;
    owner_id: string | null;
    source: CommitmentSource;
    title: string;
    detail: string | null;
    severity: CommitmentSeverity;
    status: CommitmentStatus;
    promised_at: string | null;
    due_at: string | null;
    resolved_at: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string | null;
    updated_at: string | null;
};

export type CommitmentCounts = {
    open: number;
    breached: number;
};

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

function normalizeSequenceType(value: unknown): CommsSequenceType {
    switch (value) {
        case "viewed_not_approved":
        case "collections":
        case "incident_recovery":
        case "renewal_prep":
            return value;
        default:
            return "activation_rescue";
    }
}

function normalizeSequenceStatus(value: unknown): CommsSequenceStatus {
    if (value === "paused" || value === "completed") return value;
    return "active";
}

function normalizeChannel(value: unknown): CommsChannel {
    switch (value) {
        case "email":
        case "whatsapp":
        case "in_app":
            return value;
        default:
            return "mixed";
    }
}

function normalizeCommitmentSource(value: unknown): CommitmentSource {
    switch (value) {
        case "support":
        case "sales":
        case "collections":
        case "incident":
            return value;
        default:
            return "ops";
    }
}

function normalizeCommitmentSeverity(value: unknown): CommitmentSeverity {
    if (value === "low" || value === "high" || value === "critical") return value;
    return "medium";
}

function normalizeCommitmentStatus(value: unknown): CommitmentStatus {
    if (value === "met" || value === "breached" || value === "cancelled") return value;
    return "open";
}

function normalizeCommsSequence(row: Record<string, unknown>): GodCommsSequence {
    return {
        id: String(row.id),
        org_id: String(row.org_id),
        owner_id: typeof row.owner_id === "string" && row.owner_id.trim() ? row.owner_id : null,
        sequence_type: normalizeSequenceType(row.sequence_type),
        status: normalizeSequenceStatus(row.status),
        channel: normalizeChannel(row.channel),
        step_index: Number.isFinite(Number(row.step_index)) ? Number(row.step_index) : 0,
        last_sent_at: normalizeIso(row.last_sent_at),
        next_follow_up_at: normalizeIso(row.next_follow_up_at),
        promise: cleanText(row.promise),
        metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? row.metadata as Record<string, unknown>
            : null,
        created_at: normalizeIso(row.created_at),
        updated_at: normalizeIso(row.updated_at),
    };
}

function normalizeCommitment(row: Record<string, unknown>): GodCommitment {
    return {
        id: String(row.id),
        org_id: String(row.org_id),
        owner_id: typeof row.owner_id === "string" && row.owner_id.trim() ? row.owner_id : null,
        source: normalizeCommitmentSource(row.source),
        title: typeof row.title === "string" ? row.title : "Commitment",
        detail: cleanText(row.detail),
        severity: normalizeCommitmentSeverity(row.severity),
        status: normalizeCommitmentStatus(row.status),
        promised_at: normalizeIso(row.promised_at),
        due_at: normalizeIso(row.due_at),
        resolved_at: normalizeIso(row.resolved_at),
        metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? row.metadata as Record<string, unknown>
            : null,
        created_at: normalizeIso(row.created_at),
        updated_at: normalizeIso(row.updated_at),
    };
}

export async function loadCommsSequences(
    db: AdminClient,
    orgId: string,
    status: CommsSequenceStatus | "all" = "all",
): Promise<GodCommsSequence[]> {
    let query = db
        .from("god_comms_sequences")
        .select("*")
        .eq("org_id", orgId)
        .order("next_follow_up_at", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    const result = await query.limit(30);
    return ((result.data ?? []) as Array<Record<string, unknown>>).map((row) => normalizeCommsSequence(row));
}

export async function createCommsSequence(
    db: AdminClient,
    payload: {
        org_id: string;
        owner_id?: string | null;
        sequence_type: CommsSequenceType;
        status?: CommsSequenceStatus;
        channel?: CommsChannel;
        step_index?: number;
        last_sent_at?: string | null;
        next_follow_up_at?: string | null;
        promise?: string | null;
        metadata?: Record<string, unknown> | null;
    },
): Promise<GodCommsSequence> {
    const result = await db
        .from("god_comms_sequences")
        .insert({
            org_id: payload.org_id,
            owner_id: payload.owner_id ?? null,
            sequence_type: payload.sequence_type,
            status: payload.status ?? "active",
            channel: payload.channel ?? "mixed",
            step_index: payload.step_index ?? 0,
            last_sent_at: payload.last_sent_at ?? null,
            next_follow_up_at: payload.next_follow_up_at ?? null,
            promise: cleanText(payload.promise),
            metadata: payload.metadata ?? {},
        })
        .select("*")
        .single();
    return normalizeCommsSequence((result.data ?? {}) as Record<string, unknown>);
}

export async function updateCommsSequence(
    db: AdminClient,
    id: string,
    patch: Partial<{
        owner_id: string | null;
        status: CommsSequenceStatus;
        channel: CommsChannel;
        step_index: number;
        last_sent_at: string | null;
        next_follow_up_at: string | null;
        promise: string | null;
        metadata: Record<string, unknown> | null;
    }>,
): Promise<GodCommsSequence | null> {
    const result = await db
        .from("god_comms_sequences")
        .update({
            owner_id: patch.owner_id,
            status: patch.status,
            channel: patch.channel,
            step_index: patch.step_index,
            last_sent_at: patch.last_sent_at,
            next_follow_up_at: patch.next_follow_up_at,
            promise: patch.promise !== undefined ? cleanText(patch.promise) : undefined,
            metadata: patch.metadata,
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();
    if (!result.data) return null;
    return normalizeCommsSequence(result.data as Record<string, unknown>);
}

export async function loadCommitments(
    db: AdminClient,
    orgId: string,
    status: CommitmentStatus | "all" = "all",
): Promise<GodCommitment[]> {
    let query = db
        .from("god_commitments")
        .select("*")
        .eq("org_id", orgId)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    const result = await query.limit(40);
    return ((result.data ?? []) as Array<Record<string, unknown>>).map((row) => normalizeCommitment(row));
}

export async function createCommitment(
    db: AdminClient,
    payload: {
        org_id: string;
        owner_id?: string | null;
        source?: CommitmentSource;
        title: string;
        detail?: string | null;
        severity?: CommitmentSeverity;
        promised_at?: string | null;
        due_at: string;
        metadata?: Record<string, unknown> | null;
    },
): Promise<GodCommitment> {
    const result = await db
        .from("god_commitments")
        .insert({
            org_id: payload.org_id,
            owner_id: payload.owner_id ?? null,
            source: payload.source ?? "ops",
            title: payload.title.trim(),
            detail: cleanText(payload.detail),
            severity: payload.severity ?? "medium",
            promised_at: payload.promised_at ?? new Date().toISOString(),
            due_at: payload.due_at,
            metadata: payload.metadata ?? {},
        })
        .select("*")
        .single();
    return normalizeCommitment((result.data ?? {}) as Record<string, unknown>);
}

export async function updateCommitment(
    db: AdminClient,
    id: string,
    patch: Partial<{
        owner_id: string | null;
        source: CommitmentSource;
        title: string;
        detail: string | null;
        severity: CommitmentSeverity;
        status: CommitmentStatus;
        due_at: string;
        metadata: Record<string, unknown> | null;
    }>,
): Promise<GodCommitment | null> {
    const nextStatus = patch.status;
    const resolvedAt = nextStatus && nextStatus !== "open" ? new Date().toISOString() : undefined;
    const result = await db
        .from("god_commitments")
        .update({
            owner_id: patch.owner_id,
            source: patch.source,
            title: patch.title ? patch.title.trim() : undefined,
            detail: patch.detail !== undefined ? cleanText(patch.detail) : undefined,
            severity: patch.severity,
            status: patch.status,
            due_at: patch.due_at,
            resolved_at: resolvedAt,
            metadata: patch.metadata,
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();
    if (!result.data) return null;
    return normalizeCommitment(result.data as Record<string, unknown>);
}

export async function buildCommitmentCounts(db: AdminClient, orgIds: string[]): Promise<Map<string, CommitmentCounts>> {
    const uniqueOrgIds = Array.from(new Set(orgIds.filter(Boolean)));
    const map = new Map<string, CommitmentCounts>();
    if (uniqueOrgIds.length === 0) return map;
    for (const orgId of uniqueOrgIds) {
        map.set(orgId, { open: 0, breached: 0 });
    }

    const nowIso = new Date().toISOString();
    const [openResult, breachedResult] = await Promise.all([
        db
            .from("god_commitments")
            .select("org_id")
            .in("org_id", uniqueOrgIds)
            .eq("status", "open"),
        db
            .from("god_commitments")
            .select("org_id")
            .in("org_id", uniqueOrgIds)
            .or(`status.eq.breached,and(status.eq.open,due_at.lt.${nowIso})`),
    ]);

    for (const row of ((openResult.data ?? []) as Array<{ org_id: string | null }>)) {
        if (!row.org_id || !map.has(row.org_id)) continue;
        const current = map.get(row.org_id)!;
        current.open += 1;
        map.set(row.org_id, current);
    }

    for (const row of ((breachedResult.data ?? []) as Array<{ org_id: string | null }>)) {
        if (!row.org_id || !map.has(row.org_id)) continue;
        const current = map.get(row.org_id)!;
        current.breached += 1;
        map.set(row.org_id, current);
    }

    return map;
}
