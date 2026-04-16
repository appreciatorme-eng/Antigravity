import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages";

type AdminClient = SupabaseClient;

export type AccountLifecycleStage = "new" | "onboarding" | "active" | "watch" | "at_risk" | "churned";
export type AccountHealthBand = "healthy" | "watch" | "at_risk";
export type AccountActivationStage =
    | "signed_up"
    | "onboarding"
    | "first_proposal_sent"
    | "active"
    | "expansion"
    | "at_risk"
    | "churned";
export type GodWorkItemKind =
  | "collections"
  | "renewal"
  | "churn_risk"
  | "support_escalation"
  | "incident_followup"
  | "growth_followup";
export type GodWorkItemTargetType = "organization" | "invoice" | "proposal" | "ticket" | "error_event";
export type GodWorkItemStatus = "open" | "in_progress" | "blocked" | "snoozed" | "done";
export type GodWorkItemSeverity = "low" | "medium" | "high" | "critical";
export type AccountRiskFilter = "all" | "revenue" | "churn" | "support" | "incident";

export type GodAccountState = {
    org_id: string;
    owner_id: string | null;
    lifecycle_stage: AccountLifecycleStage;
    activation_stage: AccountActivationStage;
    health_score: number;
    health_band: AccountHealthBand;
    next_action: string | null;
    next_action_due_at: string | null;
    last_contacted_at: string | null;
    renewal_at: string | null;
    first_proposal_sent_at: string | null;
    last_proposal_sent_at: string | null;
    playbook: string | null;
    notes: string | null;
    created_at: string | null;
    updated_at: string | null;
};

export type AccountSnapshot = {
    overdue_balance: number;
    overdue_balance_label: string;
    overdue_invoice_count: number;
    expiring_proposal_value: number;
    expiring_proposal_value_label: string;
    expiring_proposal_count: number;
    open_support_count: number;
    urgent_support_count: number;
    open_error_count: number;
    fatal_error_count: number;
    ai_spend_mtd_usd: number;
    ai_requests_mtd: number;
    member_count: number;
    latest_org_activity: string | null;
    outstanding_balance: number;
    outstanding_balance_label: string;
    trip_count: number;
    proposal_count: number;
    proposal_sent_count: number;
    proposal_won_count: number;
    social_post_count: number;
    portal_touchpoints: number;
    first_proposal_sent_at: string | null;
    last_proposal_sent_at: string | null;
    time_to_first_proposal_days: number | null;
    days_since_last_proposal_sent: number | null;
    risk_flags: string[];
};

export type GodWorkItem = {
    id: string;
    kind: GodWorkItemKind;
    target_type: GodWorkItemTargetType;
    target_id: string;
    org_id: string | null;
    owner_id: string | null;
    owner_name: string | null;
    status: GodWorkItemStatus;
    severity: GodWorkItemSeverity;
    title: string;
    summary: string | null;
    due_at: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string | null;
    updated_at: string | null;
};

export type AccountRow = {
    org_id: string;
    name: string;
    slug: string;
    tier: string;
    created_at: string | null;
    account_state: GodAccountState;
    snapshot: AccountSnapshot;
    open_work_item_count: number;
    risk: Exclude<AccountHealthBand, "healthy"> | "revenue" | "incident" | "churn" | "healthy";
};

export type AccountDetail = {
    organization: {
        id: string;
        name: string;
        slug: string;
        tier: string;
        created_at: string | null;
        updated_at: string | null;
    };
    account_state: GodAccountState;
    snapshot: AccountSnapshot;
    owner: { id: string; name: string; email: string | null } | null;
    members: Array<{
        id: string;
        full_name: string | null;
        email: string | null;
        role: string | null;
        created_at: string | null;
        is_suspended: boolean;
    }>;
    recent_invoices: Array<{
        id: string;
        invoice_number: string | null;
        due_date: string | null;
        balance_amount: number;
        balance_amount_label: string;
        status: string | null;
    }>;
    expiring_proposals: Array<{
        id: string;
        title: string | null;
        expires_at: string | null;
        value: number;
        value_label: string;
        status: string | null;
    }>;
    work_items: GodWorkItem[];
};

type OrganizationRow = {
    id: string;
    name: string | null;
    slug: string | null;
    subscription_tier: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type ProfileRow = {
    id: string;
    organization_id: string | null;
    full_name?: string | null;
    email?: string | null;
    role?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    is_suspended?: boolean | null;
};

type OrganizationMetricRow = {
    id: string;
    created_at: string | null;
};

type InvoiceRow = {
    id: string;
    invoice_number: string | null;
    due_date: string | null;
    status: string | null;
    organization_id: string | null;
    balance_amount: number | null;
    total_amount: number | null;
    created_at: string | null;
};

type ProposalRow = {
    id: string;
    title: string | null;
    status: string | null;
    expires_at: string | null;
    total_price: number | null;
    client_selected_price: number | null;
    organization_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    viewed_at?: string | null;
    approved_at?: string | null;
    share_token?: string | null;
};

type SupportTicketRow = {
    id: string;
    organization_id: string | null;
    title?: string | null;
    user_id: string | null;
    priority: string | null;
    status: string | null;
    created_at: string | null;
    updated_at?: string | null;
};

type ErrorEventRow = {
    id: string;
    organization_id: string | null;
    status: string | null;
    level: string | null;
    created_at: string | null;
};

type AiUsageRow = {
    organization_id: string | null;
    estimated_cost_usd: number | null;
    ai_requests: number | null;
};

type TripRow = {
    id: string;
    organization_id: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type SocialPostRow = {
    id: string;
    organization_id: string | null;
    status: string | null;
    created_at: string | null;
};

function monthStartIso(): string {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function safeNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function asCurrency(amount: number): string {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function normalizeIso(value: unknown): string | null {
    if (typeof value !== "string" || !value.trim()) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeLifecycleStage(value: unknown): AccountLifecycleStage {
    if (value === "new" || value === "onboarding" || value === "watch" || value === "at_risk" || value === "churned") {
        return value;
    }
    return "active";
}

function normalizeActivationStage(value: unknown): AccountActivationStage {
    switch (value) {
        case "onboarding":
        case "first_proposal_sent":
        case "active":
        case "expansion":
        case "at_risk":
        case "churned":
            return value;
        default:
            return "signed_up";
    }
}

function normalizeHealthBand(value: unknown): AccountHealthBand {
    if (value === "watch" || value === "at_risk") return value;
    return "healthy";
}

function normalizeSeverity(value: unknown): GodWorkItemSeverity {
    if (value === "low" || value === "high" || value === "critical") return value;
    return "medium";
}

function normalizeStatus(value: unknown): GodWorkItemStatus {
    if (value === "in_progress" || value === "blocked" || value === "snoozed" || value === "done") return value;
    return "open";
}

function normalizeKind(value: unknown): GodWorkItemKind {
    switch (value) {
        case "renewal":
        case "churn_risk":
        case "support_escalation":
        case "incident_followup":
        case "growth_followup":
            return value;
        default:
            return "collections";
    }
}

function normalizeTargetType(value: unknown): GodWorkItemTargetType {
    switch (value) {
        case "organization":
        case "proposal":
        case "ticket":
        case "error_event":
            return value;
        default:
            return "invoice";
    }
}

function normalizedKey(value: unknown): string {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isOpenSupportStatus(status: string | null | undefined): boolean {
    const normalized = normalizedKey(status);
    return normalized === "open" || normalized === "in progress" || normalized === "in_progress";
}

function isUrgentSupportPriority(priority: string | null | undefined): boolean {
    const normalized = normalizedKey(priority);
    return normalized === "urgent" || normalized === "high";
}

function isSentProposalStatus(status: string | null | undefined): boolean {
    const normalized = normalizedKey(status);
    return Boolean(normalized) && normalized !== "draft";
}

function isWonProposalStatus(status: string | null | undefined): boolean {
    const normalized = normalizedKey(status);
    return ["approved", "accepted", "confirmed", "converted"].includes(normalized);
}

function daysBetween(startIso: string | null, endIso: string | null): number | null {
    if (!startIso || !endIso) return null;
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
    return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function defaultAccountState(orgId: string): GodAccountState {
    return {
        org_id: orgId,
        owner_id: null,
        lifecycle_stage: "active",
        activation_stage: "signed_up",
        health_score: 75,
        health_band: "healthy",
        next_action: null,
        next_action_due_at: null,
        last_contacted_at: null,
        renewal_at: null,
        first_proposal_sent_at: null,
        last_proposal_sent_at: null,
        playbook: null,
        notes: null,
        created_at: null,
        updated_at: null,
    };
}

function emptyAccountSnapshot(): AccountSnapshot {
    return {
        overdue_balance: 0,
        overdue_balance_label: asCurrency(0),
        overdue_invoice_count: 0,
        expiring_proposal_value: 0,
        expiring_proposal_value_label: asCurrency(0),
        expiring_proposal_count: 0,
        open_support_count: 0,
        urgent_support_count: 0,
        open_error_count: 0,
        fatal_error_count: 0,
        ai_spend_mtd_usd: 0,
        ai_requests_mtd: 0,
        member_count: 0,
        latest_org_activity: null,
        outstanding_balance: 0,
        outstanding_balance_label: asCurrency(0),
        trip_count: 0,
        proposal_count: 0,
        proposal_sent_count: 0,
        proposal_won_count: 0,
        social_post_count: 0,
        portal_touchpoints: 0,
        first_proposal_sent_at: null,
        last_proposal_sent_at: null,
        time_to_first_proposal_days: null,
        days_since_last_proposal_sent: null,
        risk_flags: [],
    };
}

function normalizeAccountState(row: Record<string, unknown> | null | undefined, orgId: string): GodAccountState {
    const base = defaultAccountState(orgId);
    if (!row) return base;
    return {
        org_id: orgId,
        owner_id: typeof row.owner_id === "string" && row.owner_id.trim() ? row.owner_id : null,
        lifecycle_stage: normalizeLifecycleStage(row.lifecycle_stage),
        activation_stage: normalizeActivationStage(row.activation_stage),
        health_score: Math.max(0, Math.min(100, Math.round(safeNumber(row.health_score || base.health_score)))),
        health_band: normalizeHealthBand(row.health_band),
        next_action: typeof row.next_action === "string" && row.next_action.trim() ? row.next_action.trim() : null,
        next_action_due_at: normalizeIso(row.next_action_due_at),
        last_contacted_at: normalizeIso(row.last_contacted_at),
        renewal_at: normalizeIso(row.renewal_at),
        first_proposal_sent_at: normalizeIso(row.first_proposal_sent_at),
        last_proposal_sent_at: normalizeIso(row.last_proposal_sent_at),
        playbook: typeof row.playbook === "string" && row.playbook.trim() ? row.playbook.trim() : null,
        notes: typeof row.notes === "string" && row.notes.trim() ? row.notes.trim() : null,
        created_at: normalizeIso(row.created_at),
        updated_at: normalizeIso(row.updated_at),
    };
}

function normalizeWorkItem(row: Record<string, unknown>, ownerLookup: Map<string, { name: string }>): GodWorkItem {
    const ownerId = typeof row.owner_id === "string" && row.owner_id.trim() ? row.owner_id : null;
    return {
        id: String(row.id),
        kind: normalizeKind(row.kind),
        target_type: normalizeTargetType(row.target_type),
        target_id: String(row.target_id),
        org_id: typeof row.org_id === "string" && row.org_id.trim() ? row.org_id : null,
        owner_id: ownerId,
        owner_name: ownerId ? ownerLookup.get(ownerId)?.name ?? null : null,
        status: normalizeStatus(row.status),
        severity: normalizeSeverity(row.severity),
        title: typeof row.title === "string" ? row.title : "Untitled work item",
        summary: typeof row.summary === "string" && row.summary.trim() ? row.summary.trim() : null,
        due_at: normalizeIso(row.due_at),
        metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? row.metadata as Record<string, unknown>
            : null,
        created_at: normalizeIso(row.created_at),
        updated_at: normalizeIso(row.updated_at),
    };
}

function riskFromSnapshot(state: GodAccountState, snapshot: AccountSnapshot): AccountRow["risk"] {
    if (snapshot.fatal_error_count > 0) return "incident";
    if (snapshot.overdue_balance > 0 || snapshot.expiring_proposal_count > 0) return "revenue";
    if (state.health_band === "at_risk" || snapshot.urgent_support_count > 0 || snapshot.open_support_count > 2) return "churn";
    if (state.health_band === "watch") return "watch";
    return "healthy";
}

function matchesRisk(snapshot: AccountSnapshot, state: GodAccountState, filter: AccountRiskFilter): boolean {
    if (filter === "all") return true;
    if (filter === "revenue") return snapshot.overdue_balance > 0 || snapshot.expiring_proposal_count > 0;
    if (filter === "support") return snapshot.open_support_count > 0 || snapshot.urgent_support_count > 0;
    if (filter === "incident") return snapshot.open_error_count > 0 || snapshot.fatal_error_count > 0;
    return state.health_band === "at_risk" || snapshot.urgent_support_count > 0 || snapshot.overdue_balance > 0;
}

async function loadOwnerLookup(db: AdminClient, ownerIds: string[]): Promise<Map<string, { name: string; email: string | null }>> {
    const uniqueIds = Array.from(new Set(ownerIds.filter(Boolean)));
    if (uniqueIds.length === 0) return new Map();
    const result = await db.from("profiles").select("id, full_name, email").in("id", uniqueIds);
    const lookup = new Map<string, { name: string; email: string | null }>();
    for (const owner of (result.data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
        lookup.set(owner.id, {
            name: owner.full_name?.trim() || owner.email?.trim() || "Unknown",
            email: owner.email,
        });
    }
    return lookup;
}

export async function loadGodAccountStateMap(db: AdminClient, orgIds: string[]): Promise<Map<string, GodAccountState>> {
    const uniqueIds = Array.from(new Set(orgIds.filter(Boolean)));
    const map = new Map<string, GodAccountState>();
    if (uniqueIds.length === 0) return map;
    const result = await db.from("god_account_state").select("*").in("org_id", uniqueIds);
    for (const orgId of uniqueIds) {
        map.set(orgId, defaultAccountState(orgId));
    }
    for (const row of (result.data ?? []) as Array<Record<string, unknown>>) {
        const orgId = String(row.org_id ?? "");
        if (!orgId) continue;
        map.set(orgId, normalizeAccountState(row, orgId));
    }
    return map;
}

async function loadOpenWorkItemCountMap(db: AdminClient, orgIds: string[]): Promise<Map<string, number>> {
    const uniqueIds = Array.from(new Set(orgIds.filter(Boolean)));
    const map = new Map<string, number>();
    if (uniqueIds.length === 0) return map;
    const result = await db
        .from("god_work_items")
        .select("org_id, status")
        .in("org_id", uniqueIds)
        .in("status", ["open", "in_progress", "blocked", "snoozed"]);
    for (const row of (result.data ?? []) as Array<{ org_id: string | null }>) {
        if (!row.org_id) continue;
        map.set(row.org_id, (map.get(row.org_id) ?? 0) + 1);
    }
    return map;
}

export async function loadGodWorkItems(
    db: AdminClient,
    filters: {
        orgIds?: string[];
        targetType?: GodWorkItemTargetType;
        targetId?: string;
        ownerId?: string | "unowned";
        status?: GodWorkItemStatus | "active" | "all";
        limit?: number;
    } = {},
): Promise<GodWorkItem[]> {
    let query = db.from("god_work_items").select("*").order("due_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
    if (filters.orgIds && filters.orgIds.length > 0) query = query.in("org_id", filters.orgIds);
    if (filters.targetType) query = query.eq("target_type", filters.targetType);
    if (filters.targetId) query = query.eq("target_id", filters.targetId);
    if (filters.ownerId === "unowned") query = query.is("owner_id", null);
    else if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
    if (filters.status === "active") query = query.in("status", ["open", "in_progress", "blocked", "snoozed"]);
    else if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
    if (filters.limit) query = query.limit(filters.limit);

    const result = await query;
    const rows = (result.data ?? []) as Array<Record<string, unknown>>;
    const ownerLookup = await loadOwnerLookup(
        db,
        rows
            .map((row) => (typeof row.owner_id === "string" ? row.owner_id : ""))
            .filter(Boolean),
    );
    return rows.map((row) => normalizeWorkItem(row, ownerLookup));
}

export async function createGodWorkItem(
    db: AdminClient,
    payload: Omit<GodWorkItem, "id" | "owner_name" | "created_at" | "updated_at">,
): Promise<GodWorkItem> {
    const insertPayload = {
        kind: payload.kind,
        target_type: payload.target_type,
        target_id: payload.target_id,
        org_id: payload.org_id,
        owner_id: payload.owner_id,
        status: payload.status,
        severity: payload.severity,
        title: payload.title,
        summary: payload.summary,
        due_at: payload.due_at,
        metadata: payload.metadata ?? {},
    };
    const result = await db.from("god_work_items").insert(insertPayload).select("*").single();
    const ownerLookup = await loadOwnerLookup(db, result.data?.owner_id ? [result.data.owner_id] : []);
    return normalizeWorkItem((result.data ?? {}) as Record<string, unknown>, ownerLookup);
}

export async function updateGodWorkItem(
    db: AdminClient,
    id: string,
    patch: Partial<Omit<GodWorkItem, "id" | "owner_name" | "created_at" | "updated_at">>,
): Promise<GodWorkItem | null> {
    const updatePayload: Record<string, unknown> = {};
    if (patch.owner_id !== undefined) updatePayload.owner_id = patch.owner_id;
    if (patch.status !== undefined) updatePayload.status = patch.status;
    if (patch.severity !== undefined) updatePayload.severity = patch.severity;
    if (patch.title !== undefined) updatePayload.title = patch.title;
    if (patch.summary !== undefined) updatePayload.summary = patch.summary;
    if (patch.due_at !== undefined) updatePayload.due_at = patch.due_at;
    if (patch.metadata !== undefined) updatePayload.metadata = patch.metadata;
    if (patch.kind !== undefined) updatePayload.kind = patch.kind;
    if (patch.target_type !== undefined) updatePayload.target_type = patch.target_type;
    if (patch.target_id !== undefined) updatePayload.target_id = patch.target_id;
    if (patch.org_id !== undefined) updatePayload.org_id = patch.org_id;
    const result = await db.from("god_work_items").update(updatePayload).eq("id", id).select("*").maybeSingle();
    if (!result.data) return null;
    const ownerLookup = await loadOwnerLookup(db, result.data.owner_id ? [result.data.owner_id] : []);
    return normalizeWorkItem(result.data as Record<string, unknown>, ownerLookup);
}

export async function upsertGodAccountState(
    db: AdminClient,
    orgId: string,
    patch: Partial<Omit<GodAccountState, "org_id" | "created_at" | "updated_at">>,
): Promise<GodAccountState> {
    const current = (await loadGodAccountStateMap(db, [orgId])).get(orgId) ?? defaultAccountState(orgId);
    const next = {
        org_id: orgId,
        owner_id: patch.owner_id === undefined ? current.owner_id : patch.owner_id,
        lifecycle_stage: patch.lifecycle_stage ?? current.lifecycle_stage,
        activation_stage: patch.activation_stage ?? current.activation_stage,
        health_score: patch.health_score === undefined ? current.health_score : Math.max(0, Math.min(100, Math.round(safeNumber(patch.health_score)))),
        health_band: patch.health_band ?? current.health_band,
        next_action: patch.next_action === undefined ? current.next_action : patch.next_action,
        next_action_due_at: patch.next_action_due_at === undefined ? current.next_action_due_at : patch.next_action_due_at,
        last_contacted_at: patch.last_contacted_at === undefined ? current.last_contacted_at : patch.last_contacted_at,
        renewal_at: patch.renewal_at === undefined ? current.renewal_at : patch.renewal_at,
        first_proposal_sent_at: patch.first_proposal_sent_at === undefined ? current.first_proposal_sent_at : patch.first_proposal_sent_at,
        last_proposal_sent_at: patch.last_proposal_sent_at === undefined ? current.last_proposal_sent_at : patch.last_proposal_sent_at,
        playbook: patch.playbook === undefined ? current.playbook : patch.playbook,
        notes: patch.notes === undefined ? current.notes : patch.notes,
    };
    const result = await db.from("god_account_state").upsert(next).select("*").single();
    return normalizeAccountState((result.data ?? null) as Record<string, unknown> | null, orgId);
}

export async function buildAccountMetricsMap(db: AdminClient, orgIds: string[]): Promise<Map<string, AccountSnapshot>> {
    const uniqueIds = Array.from(new Set(orgIds.filter(Boolean)));
    const map = new Map<string, AccountSnapshot>();
    if (uniqueIds.length === 0) return map;

    const monthStart = monthStartIso();
    const [orgsResult, profilesResult, invoicesResult, proposalsResult, aiUsageResult, errorEventsResult, tripsResult, socialPostsResult, supportTicketsResult] = await Promise.all([
        db.from("organizations").select("id, created_at").in("id", uniqueIds),
        db.from("profiles").select("id, organization_id, created_at, updated_at").in("organization_id", uniqueIds),
        db.from("invoices").select("id, invoice_number, organization_id, status, due_date, balance_amount, total_amount, created_at").in("organization_id", uniqueIds),
        db.from("proposals").select("id, title, organization_id, status, expires_at, total_price, client_selected_price, created_at, updated_at, viewed_at, approved_at, share_token").in("organization_id", uniqueIds),
        db.from("organization_ai_usage").select("organization_id, estimated_cost_usd, ai_requests").in("organization_id", uniqueIds).eq("month_start", monthStart),
        db.from("error_events").select("id, organization_id, status, level, created_at").in("organization_id", uniqueIds),
        db.from("trips").select("id, organization_id, status, created_at, updated_at").in("organization_id", uniqueIds),
        db.from("social_posts").select("id, organization_id, status, created_at").in("organization_id", uniqueIds),
        db.from("support_tickets").select("id, organization_id, title, user_id, priority, status, created_at, updated_at").in("organization_id", uniqueIds),
    ]);

    const organizations = (orgsResult.data ?? []) as OrganizationMetricRow[];
    const profiles = (profilesResult.data ?? []) as ProfileRow[];
    const invoices = (invoicesResult.data ?? []) as InvoiceRow[];
    const proposals = (proposalsResult.data ?? []) as ProposalRow[];
    const aiUsage = (aiUsageResult.data ?? []) as AiUsageRow[];
    const errorEvents = (errorEventsResult.data ?? []) as ErrorEventRow[];
    const trips = (tripsResult.data ?? []) as TripRow[];
    const socialPosts = (socialPostsResult.data ?? []) as SocialPostRow[];
    const supportTickets = (supportTicketsResult.data ?? []) as SupportTicketRow[];
    const orgCreatedAtMap = new Map<string, string | null>();
    for (const org of organizations) orgCreatedAtMap.set(org.id, normalizeIso(org.created_at));

    for (const orgId of uniqueIds) {
        map.set(orgId, emptyAccountSnapshot());
    }

    const nowMs = Date.now();
    const expiringThresholdMs = nowMs + (72 * 60 * 60 * 1000);
    const bumpActivity = (orgId: string, iso: string | null | undefined) => {
        if (!iso || !map.has(orgId)) return;
        const current = map.get(orgId)!;
        if (!current.latest_org_activity || new Date(iso).getTime() > new Date(current.latest_org_activity).getTime()) {
            current.latest_org_activity = iso;
        }
    };

    for (const profile of profiles) {
        if (!profile.organization_id) continue;
        const snapshot = map.get(profile.organization_id);
        if (!snapshot) continue;
        snapshot.member_count += 1;
        bumpActivity(profile.organization_id, profile.updated_at ?? profile.created_at ?? null);
    }

    for (const invoice of invoices) {
        if (!invoice.organization_id) continue;
        const snapshot = map.get(invoice.organization_id);
        if (!snapshot) continue;
        const amount = safeNumber(invoice.balance_amount ?? invoice.total_amount);
        snapshot.outstanding_balance += amount;
        if (invoice.due_date && new Date(invoice.due_date).getTime() < nowMs && amount > 0 && ["issued", "partially_paid", "overdue"].includes(invoice.status ?? "")) {
            snapshot.overdue_balance += amount;
            snapshot.overdue_invoice_count += 1;
        }
        bumpActivity(invoice.organization_id, invoice.created_at);
    }

    for (const proposal of proposals) {
        if (!proposal.organization_id) continue;
        const snapshot = map.get(proposal.organization_id);
        if (!snapshot) continue;
        snapshot.proposal_count += 1;
        const value = safeNumber(proposal.client_selected_price ?? proposal.total_price);
        const expiresMs = proposal.expires_at ? new Date(proposal.expires_at).getTime() : NaN;
        if (Number.isFinite(expiresMs) && expiresMs >= nowMs && expiresMs <= expiringThresholdMs && !["cancelled", "converted"].includes(proposal.status ?? "")) {
            snapshot.expiring_proposal_count += 1;
            snapshot.expiring_proposal_value += value;
        }
        if (isSentProposalStatus(proposal.status)) {
            snapshot.proposal_sent_count += 1;
            if (proposal.viewed_at) snapshot.portal_touchpoints += 1;
            const sentAt = normalizeIso(proposal.viewed_at ?? proposal.approved_at ?? proposal.updated_at ?? proposal.created_at);
            if (sentAt && (!snapshot.first_proposal_sent_at || new Date(sentAt).getTime() < new Date(snapshot.first_proposal_sent_at).getTime())) {
                snapshot.first_proposal_sent_at = sentAt;
            }
            if (sentAt && (!snapshot.last_proposal_sent_at || new Date(sentAt).getTime() > new Date(snapshot.last_proposal_sent_at).getTime())) {
                snapshot.last_proposal_sent_at = sentAt;
            }
        }
        if (isWonProposalStatus(proposal.status)) {
            snapshot.proposal_won_count += 1;
        }
        bumpActivity(proposal.organization_id, proposal.approved_at ?? proposal.viewed_at ?? proposal.updated_at ?? proposal.created_at);
    }

    for (const trip of trips) {
        if (!trip.organization_id) continue;
        const snapshot = map.get(trip.organization_id);
        if (!snapshot) continue;
        snapshot.trip_count += 1;
        bumpActivity(trip.organization_id, trip.updated_at ?? trip.created_at);
    }

    for (const post of socialPosts) {
        if (!post.organization_id) continue;
        const snapshot = map.get(post.organization_id);
        if (!snapshot) continue;
        snapshot.social_post_count += 1;
        bumpActivity(post.organization_id, post.created_at);
    }

    for (const row of aiUsage) {
        if (!row.organization_id) continue;
        const snapshot = map.get(row.organization_id);
        if (!snapshot) continue;
        snapshot.ai_spend_mtd_usd += safeNumber(row.estimated_cost_usd);
        snapshot.ai_requests_mtd += safeNumber(row.ai_requests);
    }

    for (const event of errorEvents) {
        if (!event.organization_id) continue;
        const snapshot = map.get(event.organization_id);
        if (!snapshot) continue;
        if (["open", "investigating"].includes(event.status ?? "")) {
            snapshot.open_error_count += 1;
            if (event.level === "fatal") snapshot.fatal_error_count += 1;
        }
        bumpActivity(event.organization_id, event.created_at);
    }

    for (const ticket of supportTickets) {
        const orgId = ticket.organization_id;
        if (!orgId) continue;
        const snapshot = map.get(orgId);
        if (!snapshot) continue;
        if (isOpenSupportStatus(ticket.status)) {
            snapshot.open_support_count += 1;
            if (isUrgentSupportPriority(ticket.priority)) snapshot.urgent_support_count += 1;
        }
        bumpActivity(orgId, ticket.updated_at ?? ticket.created_at ?? null);
    }

    for (const [orgId, snapshot] of map.entries()) {
        snapshot.overdue_balance = Number(snapshot.overdue_balance.toFixed(0));
        snapshot.overdue_balance_label = asCurrency(snapshot.overdue_balance);
        snapshot.expiring_proposal_value = Number(snapshot.expiring_proposal_value.toFixed(0));
        snapshot.expiring_proposal_value_label = asCurrency(snapshot.expiring_proposal_value);
        snapshot.ai_spend_mtd_usd = Number(snapshot.ai_spend_mtd_usd.toFixed(2));
        snapshot.outstanding_balance = Number(snapshot.outstanding_balance.toFixed(0));
        snapshot.outstanding_balance_label = asCurrency(snapshot.outstanding_balance);
        snapshot.time_to_first_proposal_days = daysBetween(orgCreatedAtMap.get(orgId) ?? null, snapshot.first_proposal_sent_at);
        snapshot.days_since_last_proposal_sent = snapshot.last_proposal_sent_at
            ? daysBetween(snapshot.last_proposal_sent_at, new Date().toISOString())
            : null;
        snapshot.risk_flags = [
            snapshot.overdue_invoice_count > 0 ? `${snapshot.overdue_invoice_count} overdue invoices` : null,
            snapshot.expiring_proposal_count > 0 ? `${snapshot.expiring_proposal_count} expiring proposals` : null,
            snapshot.urgent_support_count > 0 ? `${snapshot.urgent_support_count} urgent tickets` : null,
            snapshot.fatal_error_count > 0 ? `${snapshot.fatal_error_count} fatal incidents` : null,
            snapshot.ai_spend_mtd_usd >= 25 ? `$${snapshot.ai_spend_mtd_usd.toFixed(2)} AI spend MTD` : null,
            snapshot.proposal_sent_count === 0 ? "No proposals sent yet" : null,
            snapshot.proposal_sent_count > 0 && snapshot.trip_count === 0 ? "Proposal sent but no converted trip yet" : null,
            snapshot.proposal_sent_count > 0 && (snapshot.days_since_last_proposal_sent ?? 0) >= 14 ? `${snapshot.days_since_last_proposal_sent} days since last proposal` : null,
        ].filter(Boolean) as string[];
    }

    return map;
}

export async function listAccounts(
    db: AdminClient,
    filters: {
        owner?: string | "unowned";
        health_band?: AccountHealthBand | "all";
        lifecycle_stage?: AccountLifecycleStage | "all";
        risk?: AccountRiskFilter;
        search?: string;
        page?: number;
        limit?: number;
    } = {},
): Promise<{ accounts: AccountRow[]; total: number; page: number; pages: number }> {
    const page = Math.max(0, filters.page ?? 0);
    const limit = Math.min(5000, Math.max(10, filters.limit ?? 50));
    const risk = filters.risk ?? "all";
    const search = filters.search?.trim() ?? "";

    const organizations = await fetchAllPages<OrganizationRow>((from, to) => {
        let query = db
            .from("organizations")
            .select("id, name, slug, subscription_tier, created_at, updated_at")
            .order("created_at", { ascending: false })
            .range(from, to);
        if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
        return query;
    });

    const orgIds = organizations.map((org) => org.id);
    const [statesMap, metricsMap, workCountMap] = await Promise.all([
        loadGodAccountStateMap(db, orgIds),
        buildAccountMetricsMap(db, orgIds),
        loadOpenWorkItemCountMap(db, orgIds),
    ]);

    const rows = organizations.map((org) => {
        const state = statesMap.get(org.id) ?? defaultAccountState(org.id);
        const snapshot = metricsMap.get(org.id) ?? emptyAccountSnapshot();
        return {
            org_id: org.id,
            name: org.name?.trim() || "Unknown org",
            slug: org.slug?.trim() || "",
            tier: org.subscription_tier ?? "free",
            created_at: org.created_at,
            account_state: state,
            snapshot,
            open_work_item_count: workCountMap.get(org.id) ?? 0,
            risk: riskFromSnapshot(state, snapshot),
        } satisfies AccountRow;
    }).filter((row) => {
        if (filters.owner === "unowned" && row.account_state.owner_id) return false;
        if (filters.owner && filters.owner !== "unowned" && row.account_state.owner_id !== filters.owner) return false;
        if (filters.health_band && filters.health_band !== "all" && row.account_state.health_band !== filters.health_band) return false;
        if (filters.lifecycle_stage && filters.lifecycle_stage !== "all" && row.account_state.lifecycle_stage !== filters.lifecycle_stage) return false;
        if (!matchesRisk(row.snapshot, row.account_state, risk)) return false;
        return true;
    });

    const start = page * limit;
    const accounts = rows.slice(start, start + limit);
    return {
        accounts,
        total: rows.length,
        page,
        pages: Math.max(1, Math.ceil(rows.length / limit)),
    };
}

export async function getAccountDetail(db: AdminClient, orgId: string): Promise<AccountDetail | null> {
    const [orgResult, statesMap, metricsMap, membersResult, workItems, invoicesResult, proposalsResult] = await Promise.all([
        db.from("organizations").select("id, name, slug, subscription_tier, created_at, updated_at").eq("id", orgId).maybeSingle(),
        loadGodAccountStateMap(db, [orgId]),
        buildAccountMetricsMap(db, [orgId]),
        db.from("profiles").select("id, full_name, email, role, created_at, is_suspended").eq("organization_id", orgId).order("created_at", { ascending: true }),
        loadGodWorkItems(db, { orgIds: [orgId], status: "active", limit: 25 }),
        db.from("invoices").select("id, invoice_number, due_date, balance_amount, total_amount, status").eq("organization_id", orgId).order("due_date", { ascending: true }).limit(8),
        db.from("proposals").select("id, title, expires_at, total_price, client_selected_price, status").eq("organization_id", orgId).not("expires_at", "is", null).order("expires_at", { ascending: true }).limit(8),
    ]);

    const org = orgResult.data as OrganizationRow | null;
    if (!org) return null;

    const state = statesMap.get(orgId) ?? defaultAccountState(orgId);
    const snapshot = metricsMap.get(orgId) ?? emptyAccountSnapshot();
    const ownerLookup = await loadOwnerLookup(db, state.owner_id ? [state.owner_id] : []);
    const owner = state.owner_id ? ownerLookup.get(state.owner_id) : null;

    return {
        organization: {
            id: org.id,
            name: org.name?.trim() || "Unknown org",
            slug: org.slug?.trim() || "",
            tier: org.subscription_tier ?? "free",
            created_at: org.created_at,
            updated_at: org.updated_at,
        },
        account_state: state,
        snapshot,
        owner: owner && state.owner_id ? { id: state.owner_id, name: owner.name, email: owner.email } : null,
        members: ((membersResult.data ?? []) as Array<{
            id: string;
            full_name: string | null;
            email: string | null;
            role: string | null;
            created_at: string | null;
            is_suspended?: boolean | null;
        }>).map((member) => ({
            id: member.id,
            full_name: member.full_name,
            email: member.email,
            role: member.role,
            created_at: member.created_at,
            is_suspended: Boolean(member.is_suspended),
        })),
        recent_invoices: ((invoicesResult.data ?? []) as Array<{
            id: string;
            invoice_number: string | null;
            due_date: string | null;
            balance_amount: number | null;
            total_amount: number | null;
            status: string | null;
        }>).map((invoice) => {
            const amount = safeNumber(invoice.balance_amount ?? invoice.total_amount);
            return {
                id: invoice.id,
                invoice_number: invoice.invoice_number,
                due_date: invoice.due_date,
                balance_amount: amount,
                balance_amount_label: asCurrency(amount),
                status: invoice.status,
            };
        }),
        expiring_proposals: ((proposalsResult.data ?? []) as Array<{
            id: string;
            title: string | null;
            expires_at: string | null;
            total_price: number | null;
            client_selected_price: number | null;
            status: string | null;
        }>).map((proposal) => {
            const value = safeNumber(proposal.client_selected_price ?? proposal.total_price);
            return {
                id: proposal.id,
                title: proposal.title,
                expires_at: proposal.expires_at,
                value,
                value_label: asCurrency(value),
                status: proposal.status,
            };
        }),
        work_items: workItems,
    };
}

export async function loadWorkItemsForOrgAndTarget(
    db: AdminClient,
    params: { orgId?: string | null; targetType?: GodWorkItemTargetType; targetId?: string | null },
): Promise<GodWorkItem[]> {
    if (!params.orgId && !(params.targetType && params.targetId)) return [];
    let query = db
        .from("god_work_items")
        .select("*")
        .in("status", ["open", "in_progress", "blocked", "snoozed"])
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (params.orgId) query = query.eq("org_id", params.orgId);
    const result = await query;
    const rows = (result.data ?? []) as Array<Record<string, unknown>>;
    const filtered = params.targetType && params.targetId
        ? rows.filter((row) => String(row.target_type) === params.targetType || String(row.target_id) === params.targetId)
        : rows;
    const ownerLookup = await loadOwnerLookup(
        db,
        filtered
            .map((row) => (typeof row.owner_id === "string" ? row.owner_id : ""))
            .filter(Boolean),
    );
    return filtered.map((row) => normalizeWorkItem(row, ownerLookup));
}

export function buildBusinessImpact(accountState: GodAccountState, snapshot: AccountSnapshot) {
    return {
        owner_id: accountState.owner_id,
        health_band: accountState.health_band,
        lifecycle_stage: accountState.lifecycle_stage,
        activation_stage: accountState.activation_stage,
        renewal_at: accountState.renewal_at,
        first_proposal_sent_at: accountState.first_proposal_sent_at,
        last_proposal_sent_at: accountState.last_proposal_sent_at,
        next_action: accountState.next_action,
        next_action_due_at: accountState.next_action_due_at,
        outstanding_balance: snapshot.outstanding_balance,
        outstanding_balance_label: snapshot.outstanding_balance_label,
        overdue_invoice_count: snapshot.overdue_invoice_count,
        overdue_balance: snapshot.overdue_balance,
        overdue_balance_label: snapshot.overdue_balance_label,
        expiring_proposal_count: snapshot.expiring_proposal_count,
        expiring_proposal_value: snapshot.expiring_proposal_value,
        expiring_proposal_value_label: snapshot.expiring_proposal_value_label,
        open_support_count: snapshot.open_support_count,
        urgent_support_count: snapshot.urgent_support_count,
        open_error_count: snapshot.open_error_count,
        fatal_error_count: snapshot.fatal_error_count,
        ai_spend_mtd_usd: snapshot.ai_spend_mtd_usd,
        ai_requests_mtd: snapshot.ai_requests_mtd,
        trip_count: snapshot.trip_count,
        proposal_count: snapshot.proposal_count,
        proposal_sent_count: snapshot.proposal_sent_count,
        proposal_won_count: snapshot.proposal_won_count,
        social_post_count: snapshot.social_post_count,
        portal_touchpoints: snapshot.portal_touchpoints,
        time_to_first_proposal_days: snapshot.time_to_first_proposal_days,
        days_since_last_proposal_sent: snapshot.days_since_last_proposal_sent,
        latest_org_activity: snapshot.latest_org_activity,
        risk_flags: snapshot.risk_flags,
    };
}
