import type { SupabaseClient } from "@supabase/supabase-js";
import {
    buildBusinessImpact,
    createGodWorkItem,
    getAccountDetail,
    listAccounts,
    loadGodWorkItems,
    upsertGodAccountState,
    updateGodWorkItem,
    type AccountActivationStage,
    type AccountDetail,
    type AccountHealthBand,
    type AccountLifecycleStage,
    type AccountRiskFilter,
    type AccountRow,
    type AccountSnapshot,
    type GodAccountState,
    type GodWorkItemKind,
    type GodWorkItemSeverity,
    type GodWorkItem,
} from "@/lib/platform/god-accounts";
import { listOrgActivityEvents, listOrgMemoryNotes, recordOrgActivityEvent, type OrgActivityEvent, type OrgMemoryNote } from "@/lib/platform/org-memory";
import { buildWorkItemOutcomeLearning, recordWorkItemOutcome, type WorkItemOutcomeLearning, type WorkItemOutcomeType } from "@/lib/platform/work-item-outcomes";
import {
    createCommsSequence,
    createCommitment,
    buildCommsFollowupCounts,
    buildCommitmentCounts,
    loadCommsSequences,
    loadCommitments,
    updateCommitment,
    updateCommsSequence,
    type CommsChannel,
    type CommsSequenceType,
    type GodCommitment,
    type GodCommsSequence,
} from "@/lib/platform/business-comms";
import { sendFounderCriticalAlertOnce } from "@/lib/platform/founder-alerts";
import { ensureCollectionsPaymentLink } from "@/lib/payments/payment-links.server";

type AdminClient = SupabaseClient;

export type BusinessOsFilters = {
    owner?: string | "unowned";
    health_band?: AccountHealthBand | "all";
    lifecycle_stage?: AccountLifecycleStage | "all";
    risk?: AccountRiskFilter;
    search?: string;
    page?: number;
    limit?: number;
    selected_org_id?: string | null;
    only_my_accounts?: boolean;
    activation_risk?: boolean;
};

export type BusinessOsTimelineItem = {
    id: string;
    kind: "signup" | "proposal" | "trip" | "invoice" | "support" | "incident" | "announcement" | "admin_action" | "whatsapp";
    title: string;
    detail: string;
    at: string | null;
    href: string | null;
    tone: "neutral" | "warning" | "danger";
};

export type BusinessOsActivationStageStatus = "done" | "current" | "next";

export type BusinessOsActivationStep = {
    id: "signup" | "trip_created" | "proposal_drafted" | "proposal_sent" | "proposal_viewed" | "proposal_approved" | "trip_converted";
    label: string;
    status: BusinessOsActivationStageStatus;
    value: string;
    detail: string;
};

export type BusinessOsAiAction = {
    id: string;
    label: string;
    description: string;
    action_kind:
        | "draft_owner_assignment"
        | "draft_next_action"
        | "draft_note"
        | "draft_playbook"
        | "draft_outreach"
        | "draft_work_item"
        | "draft_summary"
        | "guarded_customer_communication"
        | "guarded_support_escalation"
        | "guarded_feature_flag_change"
        | "guarded_collections_writeoff";
    requires_approval: boolean;
    payload: Record<string, unknown>;
};

export type BusinessOsAiRecommendation = {
    what_changed: string;
    recommended_next_step: string;
    rationale: string;
    confidence_score: number;
    confidence_label: "low" | "medium" | "high";
    automation_posture: "monitor" | "draft_and_queue" | "approval_required";
    evidence: string[];
    playbook_draft: string;
    customer_save_outreach: string;
    collections_sequence: string;
    renewal_strategy: string;
    growth_experiment: string;
    growth_opportunities: string[];
    communication_drafts: BusinessOsCommunicationDraft[];
    safe_actions: BusinessOsAiAction[];
    guarded_actions: BusinessOsAiAction[];
};

export type BusinessOsCommunicationDraft = {
    id: string;
    org_id: string;
    account_name: string;
    priority_score: number;
    sequence_type: CommsSequenceType;
    channel: CommsChannel;
    title: string;
    reason: string;
    draft: string;
    requires_approval: boolean;
};

export type AutopilotApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export type AutopilotApproval = {
    id: string;
    org_id: string;
    account_name: string;
    priority_score: number;
    severity: "medium" | "high" | "critical";
    action_kind: Extract<BusinessOsAiAction["action_kind"], "guarded_customer_communication" | "guarded_support_escalation" | "guarded_feature_flag_change" | "guarded_collections_writeoff">;
    title: string;
    description: string;
    rationale: string;
    suggested_work_item_kind: GodWorkItemKind;
    status: AutopilotApprovalStatus;
    first_seen_at: string | null;
    decided_at: string | null;
    decided_by: string | null;
    payload: Record<string, unknown>;
};

export type BusinessOsAccountRow = AccountRow & {
    account_state: GodAccountState;
    priority_score: number;
    priority_reasons: string[];
    activation_risk: boolean;
    activation_risk_reasons: string[];
    margin_watch: boolean;
    margin_watch_reasons: string[];
    effective_activation_stage: AccountActivationStage;
    pending_approval_count: number;
};

export type BusinessOsAccountDetail = AccountDetail & {
    account_state: GodAccountState;
    business_impact: ReturnType<typeof buildBusinessImpact>;
    priority_score: number;
    priority_reasons: string[];
    activation_risk: boolean;
    activation_risk_reasons: string[];
    margin_watch: boolean;
    margin_watch_reasons: string[];
    activation_funnel: BusinessOsActivationStep[];
    operating_gaps: string[];
    changed_since_review: string[];
    timeline: BusinessOsTimelineItem[];
    recent_support_tickets: Array<{
        id: string;
        title: string;
        priority: string | null;
        status: string | null;
        updated_at: string | null;
        href: string;
    }>;
    recent_incidents: Array<{
        id: string;
        title: string;
        level: string | null;
        status: string | null;
        created_at: string | null;
        href: string;
    }>;
    comms_sequences: GodCommsSequence[];
    commitments: GodCommitment[];
    breached_commitments: GodCommitment[];
    pending_approvals: AutopilotApproval[];
    org_memory: {
        support_ready_summary: string;
        pending_items: string[];
        recent_events: OrgActivityEvent[];
        notes: OrgMemoryNote[];
    };
    ai: BusinessOsAiRecommendation;
};

export type BusinessOsDailyBrief = {
    headline: string;
    summary: string;
    queue_focus: string;
    priorities: string[];
    gaps: string[];
    generated_at: string;
};

export type BusinessOsPayload = {
    generated_at: string;
    current_user_id: string;
    operators: Array<{ id: string; name: string; email: string | null }>;
    filters: {
        owner: string | "unowned" | "all";
        health_band: AccountHealthBand | "all";
        lifecycle_stage: AccountLifecycleStage | "all";
        risk: AccountRiskFilter;
        search: string;
        activation_risk: boolean;
    };
    summary: {
        total_accounts: number;
        my_accounts: number;
        unowned_high_risk: number;
        activation_risk_accounts: number;
        revenue_risk_accounts: number;
        urgent_support_accounts: number;
        margin_watch_accounts: number;
        ops_loop_candidates: number;
        policy_violations: number;
        open_commitments: number;
        breached_commitments: number;
        pending_approvals: number;
        blocked_by_approval_accounts: number;
        communication_drafts: number;
        renewal_candidates: number;
        expansion_candidates: number;
    };
    ai_daily_brief: BusinessOsDailyBrief;
    founder_mode: FounderModeSnapshot;
    playbook_learning: WorkItemOutcomeLearning[];
    policy_violations: BusinessOsPolicyViolation[];
    communication_drafts: BusinessOsCommunicationDraft[];
    margin_watch: Array<{
        org_id: string;
        name: string;
        reasons: string[];
        ai_spend_mtd_usd: number;
        proposal_sent_count: number;
        proposal_approved_count: number;
        trip_count: number;
    }>;
    ops_loop_preview: {
        candidate_count: number;
        by_kind: Record<string, number>;
        suggestions: BusinessOsOpsSuggestion[];
    };
    accounts: BusinessOsAccountRow[];
    selected_org_id: string | null;
    selected_account: BusinessOsAccountDetail | null;
};

export type BusinessOsWorkspace = BusinessOsPayload;

export type BusinessOsOpsSuggestion = {
    automation_key: string;
    org_id: string;
    account_name: string;
    kind: GodWorkItemKind;
    severity: GodWorkItemSeverity;
    title: string;
    summary: string;
    due_at: string | null;
    target_type: "organization";
    target_id: string;
    reason: string;
};

export type BusinessOsPolicyViolation = {
    id: string;
    org_id: string;
    account_name: string;
    severity: "medium" | "high" | "critical";
    rule: string;
    detail: string;
};

export type BusinessOsOpsLoopResult = {
    generated_at: string;
    candidate_count: number;
    created_count: number;
    deduped_count: number;
    by_kind: Record<string, number>;
    suggestions: BusinessOsOpsSuggestion[];
    created_work_items: GodWorkItem[];
};

export type BusinessOsDailyAutopilotResult = {
    generated_at: string;
    run_key: string;
    idempotency_key: string;
    ops_loop: BusinessOsOpsLoopResult;
    owner_routes_applied: number;
    activation_sequences_created: number;
    activation_sequences_completed: number;
    activation_commitments_met: number;
    collections_sequences_created: number;
    collections_sequences_completed: number;
    send_queue_escalated: number;
    no_response_escalated: number;
    approvals_surfaced: number;
    approvals_expired: number;
    commitments_breached: number;
    promise_escalations: number;
    commitments_created: number;
    collections_auto_closed: number;
    outcomes_recorded: number;
};

export type AutopilotRun = {
    id: string;
    action: string;
    summary: string;
    trigger: "manual" | "scheduled" | "unknown";
    actor_name: string | null;
    created_at: string | null;
    run_key: string | null;
    idempotency_key: string | null;
    details: Record<string, unknown> | null;
};

export type AutopilotTraceEntry = {
    id: string;
    run_key: string | null;
    org_id: string;
    account_name: string | null;
    event_type: string;
    title: string;
    detail: string | null;
    reason: string | null;
    source: string;
    occurred_at: string | null;
    entity_type: string | null;
    entity_id: string | null;
    href: string;
    metadata: Record<string, unknown> | null;
};

export type AutopilotRoiScorecard = {
    window: "7d";
    generated_at: string;
    run_count: number;
    work_items_created: number;
    work_items_auto_closed: number;
    outcomes_recorded: number;
    approvals_surfaced: number;
    approvals_expired: number;
    promise_escalations: number;
    collections_auto_closed: number;
    estimated_hours_saved: number;
    estimated_cash_recovered_inr: number;
    notes: string[];
};

export type AutopilotTruthLock = {
    checked_at: string;
    coverage_pct: number;
    unresolved_checks: number;
    checks: Array<{
        id: string;
        label: string;
        status: "pass" | "warn";
        detail: string;
    }>;
};

export type AutopilotLoopSummary = {
    id: "ai_coo" | "ai_customer_success" | "ai_revenue_ops" | "ai_promise_watchdog" | "ai_production_operator";
    label: string;
    count: number;
    detail: string;
};

export type AutopilotRunHealthLoop = {
    id: AutopilotLoopSummary["id"];
    label: string;
    status: "healthy" | "degraded" | "stalled";
    last_run_at: string | null;
    last_run_trigger: "manual" | "scheduled" | "unknown";
    last_run_duration_ms: number | null;
    processed_count: number;
    detail: string;
};

export type AutopilotRunHealth = {
    generated_at: string;
    run_age_hours: number | null;
    alerts: string[];
    loops: AutopilotRunHealthLoop[];
};

export type FounderDigestSection = {
    id: "approvals" | "revenue" | "churn" | "automation";
    title: string;
    items: string[];
};

export type FounderDigest = {
    generated_at: string;
    headline: string;
    summary: string;
    sections: FounderDigestSection[];
    slack_text: string;
};

export type AutopilotSnapshot = {
    generated_at: string;
    daily_brief: BusinessOsDailyBrief;
    founder_digest: FounderDigest;
    daily_brief_history: Array<{
        id: string;
        headline: string;
        summary: string;
        generated_at: string | null;
        trigger: "manual" | "scheduled" | "unknown";
    }>;
    summary: {
        pending_approvals: number;
        stale_approvals: number;
        blocked_by_approval_accounts: number;
        policy_violations: number;
        autopilot_work_items: number;
        promise_watchdog_accounts: number;
        recent_runs: number;
        communication_drafts: number;
        renewal_candidates: number;
        expansion_candidates: number;
    };
    approval_watchdog: {
        pending: number;
        stale_24h: number;
        stale_48h: number;
        blocked_accounts: number;
    };
    founder_mode: FounderModeSnapshot;
    loops: AutopilotLoopSummary[];
    recent_runs: AutopilotRun[];
    approvals: AutopilotApproval[];
    policy_violations: BusinessOsPolicyViolation[];
    playbook_learning: WorkItemOutcomeLearning[];
    autopilot_work_items: GodWorkItem[];
    communication_drafts: BusinessOsCommunicationDraft[];
    renewal_candidates: FounderModeAction[];
    expansion_candidates: FounderModeAction[];
    promise_watchdog: Array<{
        org_id: string;
        account_name: string;
        priority_score: number;
        breached_commitments: number;
        overdue_followups: number;
        reasons: string[];
    }>;
    ops_loop_preview: BusinessOsPayload["ops_loop_preview"];
    roi_scorecard: AutopilotRoiScorecard;
    run_health: AutopilotRunHealth;
    run_traces: AutopilotTraceEntry[];
    truth_lock: AutopilotTruthLock;
};

export type FounderModeAction = {
    id: string;
    org_id: string;
    account_name: string;
    title: string;
    detail: string;
    priority_score: number;
    href: string;
};

export type FounderModeSnapshot = {
    headline: string;
    summary: string;
    approvals: AutopilotApproval[];
    highest_risk_accounts: Array<{
        org_id: string;
        account_name: string;
        priority_score: number;
        reasons: string[];
    }>;
    revenue_moves: FounderModeAction[];
    churn_risks: FounderModeAction[];
};

export type BusinessOsEventAutomationResult = {
    generated_at: string;
    org_id: string;
    trigger:
        | "account_state_updated"
        | "work_item_updated"
        | "collections_updated"
        | "comms_updated"
        | "commitment_updated"
        | "support_ticket_responded"
        | "work_item_outcome_recorded";
    state_updated: boolean;
    owner_routed: boolean;
    work_items_created: number;
    work_items_closed: number;
    sequences_created: number;
    sequences_completed: number;
    commitments_met: number;
    commitments_breached: number;
    promise_escalations: number;
    no_response_escalated: number;
    replies_processed: number;
    outcomes_recorded: number;
    notes: string[];
};

type SupportContextRow = {
    id: string;
    title: string | null;
    priority: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type IncidentContextRow = {
    id: string;
    title: string | null;
    level: string | null;
    status: string | null;
    created_at: string | null;
};

type AnnouncementRow = {
    id: string;
    title: string | null;
    target_segment: string | null;
    target_org_ids: string[] | null;
    sent_at: string | null;
    status: string | null;
};

type AuditLogRow = {
    id: string;
    action: string | null;
    category: string | null;
    target_type: string | null;
    target_id: string | null;
    created_at: string | null;
};

type TripTimelineRow = {
    id: string;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type ProposalTimelineRow = {
    id: string;
    title: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
    viewed_at: string | null;
    approved_at: string | null;
    expires_at: string | null;
};

type WhatsAppSessionRow = {
    id: string;
    state: string | null;
    last_message_at: string | null;
    handed_off_at: string | null;
    created_at: string | null;
};

type WhatsAppDraftRow = {
    id: string;
    title: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type CommsSequenceAutopilotRow = {
    id: string;
    org_id: string | null;
    sequence_type: string | null;
    status: string | null;
    metadata: unknown;
    last_sent_at: string | null;
    next_follow_up_at: string | null;
};

type CommitmentAutopilotRow = {
    id: string;
    org_id: string | null;
    status: string | null;
    title: string | null;
    severity: string | null;
    due_at: string | null;
    owner_id: string | null;
    metadata: unknown;
};

type CollectionsWorkItemAutopilotRow = {
    id: string;
    org_id: string | null;
    title: string | null;
};

type ActiveWorkItemAutopilotRow = {
    id: string;
    org_id: string | null;
    owner_id: string | null;
    kind: string | null;
    status: string | null;
    severity: string | null;
    due_at: string | null;
    metadata: unknown;
};

type ApprovalDecisionRow = {
    org_id: string;
    actor_id: string | null;
    event_type: string;
    metadata: unknown;
    occurred_at: string | null;
};

type ApprovalLifecycle = {
    first_seen_at: string | null;
    status: Exclude<AutopilotApprovalStatus, "pending"> | null;
    decided_at: string | null;
    decided_by: string | null;
};

type PlatformAuditAutopilotRow = {
    id: string;
    actor_id: string | null;
    action: string | null;
    details: unknown;
    created_at: string | null;
    profiles?: {
        full_name: string | null;
        email: string | null;
    } | {
        full_name: string | null;
        email: string | null;
    }[] | null;
};

type AutopilotTraceRow = {
    id: string;
    org_id: string;
    event_type: string;
    title: string;
    detail: string | null;
    entity_type: string | null;
    entity_id: string | null;
    source: string | null;
    metadata: unknown;
    occurred_at: string | null;
};

function normalizeText(value: string | null | undefined, fallback = "Unknown"): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : fallback;
}

function normalizeMetadata(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function normalizeKey(value: string | null | undefined): string {
    return (value || "").trim().toLowerCase();
}

function autopilotApprovalId(orgId: string, actionKind: AutopilotApproval["action_kind"], qualifier?: string | null): string {
    return qualifier?.trim()
        ? `${orgId}__${actionKind}__${qualifier.trim()}`
        : `${orgId}__${actionKind}`;
}

function parseAutopilotApprovalId(id: string): { orgId: string; actionKind: AutopilotApproval["action_kind"]; qualifier: string | null } | null {
    const [orgIdRaw, actionKindRaw, ...qualifierParts] = id.split("__");
    const orgId = orgIdRaw?.trim() ?? "";
    const actionKind = actionKindRaw?.trim() ?? "";
    const qualifier = qualifierParts.join("__").trim() || null;
    if (
        !orgId
        || (actionKind !== "guarded_customer_communication"
            && actionKind !== "guarded_support_escalation"
            && actionKind !== "guarded_feature_flag_change"
            && actionKind !== "guarded_collections_writeoff")
    ) {
        return null;
    }
    return {
        orgId,
        actionKind: actionKind as AutopilotApproval["action_kind"],
        qualifier,
    };
}

function diffDays(fromIso: string | null | undefined, toIso: string | null | undefined = new Date().toISOString()): number | null {
    if (!fromIso || !toIso) return null;
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
    return Math.max(0, Math.round((to - from) / 86_400_000));
}

function diffHours(fromIso: string | null | undefined, toIso: string | null | undefined = new Date().toISOString()): number | null {
    if (!fromIso || !toIso) return null;
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
    return Math.max(0, Math.round((to - from) / 3_600_000));
}

function formatRelativeDate(value: string | null | undefined): string {
    if (!value) return "No date";
    const age = diffDays(value);
    if (age === null) return "No date";
    if (age === 0) return "Today";
    if (age === 1) return "1 day ago";
    return `${age} days ago`;
}

function resolveActivationStage(state: GodAccountState, snapshot: AccountSnapshot, createdAt: string | null): AccountActivationStage {
    if (state.activation_stage === "churned") return "churned";
    if (state.activation_stage === "at_risk") return "at_risk";
    if (state.activation_stage !== "signed_up") return state.activation_stage;

    if (state.health_band === "at_risk" || snapshot.fatal_error_count > 0 || snapshot.overdue_balance > 0 || snapshot.urgent_support_count > 0) {
        return "at_risk";
    }
    if (snapshot.trip_count >= 3 || snapshot.social_post_count >= 4 || snapshot.ai_requests_mtd >= 250) {
        return "expansion";
    }
    if (snapshot.trip_count > 0 || snapshot.proposal_won_count > 0) {
        return "active";
    }
    if (snapshot.proposal_sent_count > 0) {
        return "first_proposal_sent";
    }
    const age = diffDays(createdAt);
    if (age !== null && age > 5) return "onboarding";
    return "signed_up";
}

function getActivationRiskReasons(snapshot: AccountSnapshot, createdAt: string | null): string[] {
    const reasons: string[] = [];
    const orgAge = diffDays(createdAt);

    if (snapshot.proposal_sent_count === 0 && orgAge !== null && orgAge >= 5) {
        reasons.push("No proposal sent yet");
    }
    if (snapshot.proposal_draft_count > 0 && snapshot.proposal_sent_count === 0) {
        reasons.push("Draft proposals exist but none were sent");
    }
    if (snapshot.whatsapp_proposal_draft_count > 0 && snapshot.proposal_sent_count === 0) {
        reasons.push("WhatsApp proposal drafts are waiting for conversion");
    }
    if (snapshot.active_whatsapp_session_count > 0 && snapshot.proposal_sent_count === 0) {
        reasons.push("Active WhatsApp conversations are not converting");
    }
    if (snapshot.ai_requests_mtd > 0 && snapshot.proposal_sent_count === 0) {
        reasons.push("AI usage started before proposal activation");
    }
    if (snapshot.proposal_sent_count > 0 && snapshot.trip_count === 0 && (snapshot.days_since_last_proposal_sent ?? 0) >= 7) {
        reasons.push("Proposal sent but no trip conversion signal");
    }
    if (snapshot.proposal_viewed_count > 0 && snapshot.proposal_approved_count === 0 && (snapshot.days_since_last_proposal_sent ?? 0) >= 5) {
        reasons.push("Proposal was viewed but not approved");
    }
    if (snapshot.proposal_sent_count > 0 && snapshot.portal_touchpoints === 0) {
        reasons.push("Proposal sent with no client portal activity");
    }

    return reasons;
}

function getPriorityScore(account: AccountRow, activationRiskReasons: string[], effectiveActivationStage: AccountActivationStage): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    if (account.snapshot.fatal_error_count > 0) {
        score += 110 + account.snapshot.fatal_error_count * 20;
        reasons.push(`${account.snapshot.fatal_error_count} fatal incidents`);
    }
    if (account.snapshot.overdue_balance > 0) {
        score += 70 + Math.min(40, Math.round(account.snapshot.overdue_balance / 25_000) * 5);
        reasons.push(account.snapshot.overdue_invoice_count > 0
            ? `${account.snapshot.overdue_invoice_count} overdue invoices`
            : "Outstanding overdue balance");
    }
    if (account.snapshot.urgent_support_count > 0) {
        score += 55 + account.snapshot.urgent_support_count * 10;
        reasons.push(`${account.snapshot.urgent_support_count} urgent tickets`);
    }
    if (account.snapshot.expiring_proposal_count > 0) {
        score += 40 + account.snapshot.expiring_proposal_count * 5;
        reasons.push(`${account.snapshot.expiring_proposal_count} proposals expiring soon`);
    }
    if (account.account_state.health_band === "at_risk") {
        score += 35;
        reasons.push("Health band is at risk");
    }
    if (!account.account_state.owner_id && score > 0) {
        score += 20;
        reasons.push("Unowned");
    }
    const lastReviewedAge = diffDays(account.account_state.last_reviewed_at);
    if (score > 0 && (lastReviewedAge === null || lastReviewedAge >= 7)) {
        score += 14;
        reasons.push(lastReviewedAge === null ? "Never reviewed in Business OS" : `Not reviewed for ${lastReviewedAge} days`);
    }
    const nextActionDelta = account.account_state.next_action_due_at
        ? Math.round((new Date(account.account_state.next_action_due_at).getTime() - Date.now()) / 86_400_000)
        : null;
    if (nextActionDelta !== null && nextActionDelta <= 2) {
        score += 18;
        reasons.push(nextActionDelta < 0 ? "Next action overdue" : "Next action due soon");
    }
    if (activationRiskReasons.length > 0) {
        score += 28;
        reasons.push(...activationRiskReasons);
    }
    if (effectiveActivationStage === "expansion") {
        score += 8;
        reasons.push("Expansion candidate");
    }

    return { score, reasons: Array.from(new Set(reasons)) };
}

function buildOperatingGaps(account: BusinessOsAccountRow): string[] {
    const gaps: string[] = [];
    const reviewAge = diffDays(account.account_state.last_reviewed_at);
    const nextActionAge = diffDays(account.account_state.next_action_due_at);

    if (!account.account_state.owner_id && account.priority_score >= 40) gaps.push("High-signal account does not have an owner");
    if (!account.account_state.next_action) gaps.push("No explicit next action is set");
    if (nextActionAge !== null && nextActionAge >= 1) gaps.push(`Next action is overdue by ${nextActionAge} day${nextActionAge === 1 ? "" : "s"}`);
    if (reviewAge === null) gaps.push("Account has never been reviewed in Business OS");
    else if (reviewAge >= 7) gaps.push(`Account has not been reviewed for ${reviewAge} days`);
    if (account.open_work_item_count > 0 && !account.account_state.owner_id) gaps.push("Open work exists without a clear owner");
    if (account.snapshot.proposal_draft_count > 0 && account.snapshot.proposal_sent_count === 0) gaps.push("Proposal drafts are accumulating before first send");
    if (account.snapshot.whatsapp_proposal_draft_count > 0 && account.snapshot.proposal_sent_count === 0) gaps.push("WhatsApp proposal drafts are not converting to sent proposals");
    if (account.snapshot.proposal_viewed_count > 0 && account.snapshot.proposal_approved_count === 0) gaps.push("Clients have viewed proposals without approval follow-through");
    if (account.snapshot.proposal_sent_count > 0 && account.snapshot.trip_count === 0 && (account.snapshot.days_since_last_proposal_sent ?? 0) >= 7) {
        gaps.push("Proposal activity is not converting into trips");
    }

    return gaps;
}

function getMarginWatchReasons(account: BusinessOsAccountRow): string[] {
    const reasons: string[] = [];
    if (account.snapshot.ai_spend_mtd_usd >= 25 && account.snapshot.proposal_approved_count === 0 && account.snapshot.trip_count === 0) {
        reasons.push(`AI spend is $${account.snapshot.ai_spend_mtd_usd.toFixed(2)} MTD without commercial conversion`);
    }
    if (account.snapshot.ai_requests_mtd >= 250 && account.snapshot.proposal_sent_count <= 1) {
        reasons.push("Heavy AI usage is not producing enough proposal output");
    }
    if (account.snapshot.proposal_sent_count >= 3 && account.snapshot.proposal_approved_count === 0) {
        reasons.push("Proposal volume is not turning into approvals");
    }
    if (account.snapshot.overdue_balance > 0 && account.snapshot.ai_spend_mtd_usd >= 10) {
        reasons.push("AI cost is accumulating on an account with overdue balance");
    }
    return reasons;
}

function buildActivationFunnel(account: BusinessOsAccountRow): BusinessOsActivationStep[] {
    const snapshot = account.snapshot;
    const completion = {
        signup: true,
        trip_created: snapshot.trip_count > 0,
        proposal_drafted: snapshot.proposal_draft_count > 0 || snapshot.whatsapp_proposal_draft_count > 0 || snapshot.proposal_sent_count > 0,
        proposal_sent: snapshot.proposal_sent_count > 0,
        proposal_viewed: snapshot.proposal_viewed_count > 0,
        proposal_approved: snapshot.proposal_approved_count > 0 || snapshot.proposal_won_count > 0,
        trip_converted: snapshot.trip_count > 0 && snapshot.proposal_sent_count > 0,
    } as const;

    const steps: Array<Omit<BusinessOsActivationStep, "status"> & { done: boolean }> = [
        {
            id: "signup",
            label: "Signup",
            value: formatRelativeDate(account.created_at),
            detail: "Organization created",
            done: completion.signup,
        },
        {
            id: "trip_created",
            label: "Trip created",
            value: snapshot.trip_count > 0 ? String(snapshot.trip_count) : "0",
            detail: snapshot.first_trip_created_at ? `First trip ${formatRelativeDate(snapshot.first_trip_created_at)}` : "No trip created yet",
            done: completion.trip_created,
        },
        {
            id: "proposal_drafted",
            label: "Proposal drafted",
            value: String(snapshot.proposal_draft_count + snapshot.whatsapp_proposal_draft_count + snapshot.proposal_sent_count),
            detail: snapshot.whatsapp_proposal_draft_count > 0
                ? `${snapshot.whatsapp_proposal_draft_count} WhatsApp drafts captured`
                : "No proposal draft signal yet",
            done: completion.proposal_drafted,
        },
        {
            id: "proposal_sent",
            label: "Proposal sent",
            value: String(snapshot.proposal_sent_count),
            detail: snapshot.first_proposal_sent_at
                ? `First send in ${snapshot.time_to_first_proposal_days ?? 0} days`
                : "First proposal milestone not reached",
            done: completion.proposal_sent,
        },
        {
            id: "proposal_viewed",
            label: "Proposal viewed",
            value: String(snapshot.proposal_viewed_count),
            detail: snapshot.proposal_viewed_count > 0 ? `${snapshot.portal_touchpoints} portal touchpoints` : "No client view signal yet",
            done: completion.proposal_viewed,
        },
        {
            id: "proposal_approved",
            label: "Proposal approved",
            value: String(snapshot.proposal_approved_count || snapshot.proposal_won_count),
            detail: snapshot.proposal_approved_count > 0 || snapshot.proposal_won_count > 0 ? "Commercial approval signal captured" : "Awaiting approval",
            done: completion.proposal_approved,
        },
        {
            id: "trip_converted",
            label: "Trip converted",
            value: String(snapshot.trip_count),
            detail: snapshot.trip_count > 0 ? `Last trip activity ${formatRelativeDate(snapshot.last_trip_activity_at)}` : "No converted trip yet",
            done: completion.trip_converted,
        },
    ];

    let currentMarked = false;
    return steps.map((step) => {
        if (step.done) return { ...step, status: "done" as const };
        if (!currentMarked) {
            currentMarked = true;
            return { ...step, status: "current" as const };
        }
        return { ...step, status: "next" as const };
    });
}

function buildChangedSinceReview(
    account: BusinessOsAccountRow,
    timeline: BusinessOsTimelineItem[],
): string[] {
    const reviewedAt = account.account_state.last_reviewed_at;
    if (!reviewedAt) {
        return account.priority_reasons.slice(0, 4);
    }

    const reviewedAtMs = new Date(reviewedAt).getTime();
    const changes = timeline
        .filter((item) => item.at && new Date(item.at).getTime() > reviewedAtMs)
        .slice(0, 5)
        .map((item) => `${item.title}: ${item.detail}`);

    if (changes.length > 0) return changes;
    return [`No major account events have landed since the last review on ${new Date(reviewedAt).toLocaleDateString()}.`];
}

function buildPendingItems(
    detail: AccountDetail,
    account: BusinessOsAccountRow,
    context?: {
        commsSequences?: GodCommsSequence[];
        commitments?: GodCommitment[];
    },
): string[] {
    const pending: string[] = [];
    if (detail.work_items.length > 0) pending.push(`${detail.work_items.length} open work items`);
    if (detail.snapshot.overdue_invoice_count > 0) pending.push(`${detail.snapshot.overdue_invoice_count} overdue invoices`);
    if (detail.snapshot.expiring_proposal_count > 0) pending.push(`${detail.snapshot.expiring_proposal_count} proposals expiring soon`);
    if (detail.snapshot.proposal_viewed_count > 0 && detail.snapshot.proposal_approved_count === 0) {
        pending.push(`${detail.snapshot.proposal_viewed_count} viewed proposals awaiting approval`);
    }
    if (detail.snapshot.urgent_support_count > 0) pending.push(`${detail.snapshot.urgent_support_count} urgent support tickets`);
    if (detail.snapshot.fatal_error_count > 0) pending.push(`${detail.snapshot.fatal_error_count} fatal incidents`);
    if (account.activation_risk) pending.push(account.activation_risk_reasons[0] ?? "Activation is stalled");
    if (detail.account_state.next_action) {
        pending.push(`Promised next step: ${detail.account_state.next_action}`);
    }

    const now = Date.now();
    const commitments = context?.commitments ?? [];
    const openCommitments = commitments.filter((commitment) => commitment.status === "open");
    const breachedCommitments = commitments.filter((commitment) => {
        if (commitment.status === "breached") return true;
        if (commitment.status !== "open" || !commitment.due_at) return false;
        return new Date(commitment.due_at).getTime() < now;
    });
    if (openCommitments.length > 0) pending.push(`${openCommitments.length} open commitments`);
    if (breachedCommitments.length > 0) pending.push(`${breachedCommitments.length} breached commitments`);

    const commsSequences = context?.commsSequences ?? [];
    const activeComms = commsSequences.filter((sequence) => sequence.status === "active");
    const overdueCommsFollowUps = activeComms.filter((sequence) => {
        if (!sequence.next_follow_up_at) return false;
        return new Date(sequence.next_follow_up_at).getTime() < now;
    });
    if (activeComms.length > 0) pending.push(`${activeComms.length} active comms sequences`);
    if (overdueCommsFollowUps.length > 0) pending.push(`${overdueCommsFollowUps.length} overdue comms follow-ups`);

    return pending;
}

function buildSupportReadySummary(detail: AccountDetail, account: BusinessOsAccountRow): string {
    const parts = [
        `${detail.organization.name} is ${account.account_state.owner_id ? "owned" : "unowned"} and currently ${account.account_state.health_band.replaceAll("_", " ")}`,
        detail.account_state.last_contacted_at ? `last contacted ${new Date(detail.account_state.last_contacted_at).toLocaleDateString()}` : "no last-contact timestamp recorded",
        detail.account_state.next_action ? `next step is "${detail.account_state.next_action}"` : "no next step is recorded",
        detail.snapshot.overdue_invoice_count > 0 ? `${detail.snapshot.overdue_invoice_count} overdue invoices are open` : "no overdue invoices are open",
        detail.snapshot.proposal_viewed_count > 0 && detail.snapshot.proposal_approved_count === 0
            ? `${detail.snapshot.proposal_viewed_count} proposals were viewed without approval`
            : `${detail.snapshot.proposal_sent_count} proposals have been sent`,
        detail.snapshot.urgent_support_count > 0 ? `${detail.snapshot.urgent_support_count} urgent support tickets need attention` : "no urgent support tickets are open",
    ];
    return parts.join(". ") + ".";
}

function buildWhatChanged(account: AccountRow, activationRiskReasons: string[], effectiveActivationStage: AccountActivationStage): string {
    const highlights: string[] = [];
    if (account.snapshot.latest_org_activity) highlights.push(`Latest activity on ${new Date(account.snapshot.latest_org_activity).toLocaleDateString()}`);
    if (account.snapshot.overdue_invoice_count > 0) highlights.push(`${account.snapshot.overdue_invoice_count} overdue invoices`);
    if (account.snapshot.expiring_proposal_count > 0) highlights.push(`${account.snapshot.expiring_proposal_count} proposals expiring within 72h`);
    if (account.snapshot.urgent_support_count > 0) highlights.push(`${account.snapshot.urgent_support_count} urgent support tickets`);
    if (account.snapshot.fatal_error_count > 0) highlights.push(`${account.snapshot.fatal_error_count} fatal incidents`);
    if (account.snapshot.whatsapp_proposal_draft_count > 0) highlights.push(`${account.snapshot.whatsapp_proposal_draft_count} WhatsApp proposal drafts`);
    if (account.snapshot.proposal_viewed_count > 0 && account.snapshot.proposal_approved_count === 0) {
        highlights.push(`${account.snapshot.proposal_viewed_count} proposals viewed with no approval yet`);
    }
    if (activationRiskReasons.length > 0) highlights.push(...activationRiskReasons);
    if (highlights.length === 0) highlights.push(`Activation stage is ${effectiveActivationStage.replaceAll("_", " ")}`);
    return highlights.join(". ") + ".";
}

function buildRecommendedNextStep(account: AccountRow, activationRiskReasons: string[], effectiveActivationStage: AccountActivationStage): { nextStep: string; rationale: string; playbook: string } {
    if (account.snapshot.fatal_error_count > 0) {
        return {
            nextStep: "Assign an incident owner, notify the account, and create a same-day recovery follow-up work item.",
            rationale: "Fatal incidents are the fastest route to churn and should override all other work.",
            playbook: "incident_recovery",
        };
    }
    if (account.snapshot.overdue_balance > 0) {
        return {
            nextStep: "Review the oldest unpaid invoice, confirm payer contact, and start a two-step collections sequence with a due date.",
            rationale: "Cash recovery is immediate business leverage and should be handled before low-severity growth work.",
            playbook: "collections",
        };
    }
    if (account.snapshot.expiring_proposal_count > 0) {
        return {
            nextStep: "Rescue the expiring proposal now: confirm the decision owner, tighten the offer if needed, and lock a reply date before the proposal window closes.",
            rationale: "Proposal expiry is near-term revenue leakage; saving the live deal has higher leverage than starting new pipeline motion.",
            playbook: "renewal_prep",
        };
    }
    if (account.snapshot.whatsapp_proposal_draft_count > 0 && account.snapshot.proposal_sent_count === 0) {
        return {
            nextStep: "Convert the WhatsApp proposal draft into a client-ready proposal, assign an owner, and send it within 24 hours.",
            rationale: "The account has already shown buying intent in WhatsApp; the operating miss is execution, not demand.",
            playbook: "activation_rescue",
        };
    }
    if (account.snapshot.proposal_viewed_count > 0 && account.snapshot.proposal_approved_count === 0) {
        return {
            nextStep: "Follow up on the viewed proposal with a decision-oriented message and confirm the blocker before it goes stale.",
            rationale: "Client attention has already happened, so the best leverage is tightening the approval loop rather than sending net-new material.",
            playbook: "low_adoption_follow_up",
        };
    }
    if (activationRiskReasons.length > 0) {
        return {
            nextStep: "Push the account to first proposal sent with a templated itinerary and a clear owner due date.",
            rationale: "Trip Built activation should be measured by first proposal sent; this account is stalled before that milestone.",
            playbook: "activation_rescue",
        };
    }
    if (effectiveActivationStage === "expansion") {
        return {
            nextStep: "Review upsell potential, assign a commercial owner, and draft an expansion conversation around repeat usage.",
            rationale: "Usage signals are strong enough to justify proactive revenue expansion rather than only support follow-up.",
            playbook: "upsell_candidate",
        };
    }
    if (
        account.snapshot.urgent_support_count > 0
        && (
            account.snapshot.overdue_balance > 0
            || account.snapshot.expiring_proposal_count > 0
            || (account.snapshot.days_since_last_proposal_sent ?? 0) >= 14
        )
    ) {
        return {
            nextStep: "Run a customer-save motion: respond on the support issue, stabilize the blocker, and pair it with a same-day commercial follow-up.",
            rationale: "Support pressure plus stalled or at-risk revenue is a churn pattern and should be handled as an integrated save motion.",
            playbook: "support_escalation",
        };
    }
    if (account.snapshot.urgent_support_count > 0 || account.snapshot.open_support_count > 0) {
        return {
            nextStep: "Own the support thread, define a recovery note, and set a next action due today.",
            rationale: "Support pressure is already visible and should be translated into a customer-save workflow.",
            playbook: "support_escalation",
        };
    }

    return {
        nextStep: "Refresh the next action, review adoption signals, and keep this account moving with an owner and due date.",
        rationale: "Healthy accounts still need explicit ownership to avoid silent stalls.",
        playbook: "low_adoption_follow_up",
    };
}

function buildCustomerSaveOutreach(account: AccountRow): string {
    if (account.snapshot.overdue_balance > 0) {
        return `Subject: Let's get ${account.name} back on track\n\nHi team,\n\nI noticed there is an overdue balance of ${account.snapshot.overdue_balance_label} and I want to help get the account back into a steady operating rhythm. If there is an issue with billing, approval, or travel planning workflow, reply with the blocker and we will help resolve it today.\n\nNext step we recommend: confirm the outstanding invoice owner, review current proposal status, and align on a payment date.\n\nTrip Built Ops`;
    }
    if (account.snapshot.expiring_proposal_count > 0) {
        return `Subject: Quick decision needed on your Trip Built proposal\n\nHi team,\n\nI noticed ${account.snapshot.expiring_proposal_count} proposal${account.snapshot.expiring_proposal_count === 1 ? "" : "s"} is close to expiry. If pricing, itinerary, or traveler fit is blocking approval, reply with the issue and we will tighten the proposal today before the window closes.\n\nTrip Built Ops`;
    }
    if (account.snapshot.urgent_support_count > 0 || account.snapshot.fatal_error_count > 0) {
        return `Subject: We are actively working on your Trip Built issue\n\nHi team,\n\nWe are prioritizing the issues affecting your workspace and have assigned an internal owner to drive resolution. We will send a direct status update today with the current ETA and any workaround that keeps proposals moving.\n\nTrip Built Ops`;
    }
    return `Subject: Quick check-in on your proposal workflow\n\nHi team,\n\nI wanted to check in because the account looks close to activation but has not crossed the first proposal milestone yet. If you want, we can help convert your existing trip draft into a client-ready proposal and set up the next best operating workflow for your team.\n\nTrip Built Ops`;
}

function buildCollectionsSequence(account: AccountRow): string {
    return [
        `Day 0: Send a direct payment follow-up referencing ${account.snapshot.overdue_invoice_count || 1} overdue invoices and total balance ${account.snapshot.overdue_balance_label}.`,
        "Day 2: If unpaid, call or message the account owner and log the promised payment date.",
        "Day 5: If still unpaid, convert the open issue into a named collections work item with owner and due date.",
        "Day 7: If risk remains, prepare a retention-safe escalation path before considering restrictions.",
    ].join("\n");
}

function buildRenewalStrategy(account: AccountRow, effectiveActivationStage: AccountActivationStage): string {
    if (effectiveActivationStage === "expansion") {
        return "Position renewal around repeat proposal throughput, AI usage, and automation leverage. Pair the renewal motion with an upsell discussion.";
    }
    if (account.snapshot.overdue_balance > 0 || account.snapshot.urgent_support_count > 0) {
        return "Do not push a commercial renewal until operational risk is stabilized. Focus on issue recovery, owner accountability, and adoption proof first.";
    }
    return "Anchor renewal prep around adoption proof: proposals sent, trips converted, AI usage, and repeat workflow depth.";
}

function buildGrowthExperiment(account: AccountRow): string {
    if (account.snapshot.whatsapp_proposal_draft_count > 0 && account.snapshot.proposal_sent_count === 0) {
        return "Run a WhatsApp-to-proposal recovery loop: convert one captured chat draft into a sent proposal within 24 hours and measure approval velocity.";
    }
    if (account.snapshot.proposal_sent_count === 0) {
        return "Run a first-proposal concierge experiment: give the team a ready-to-send proposal template and measure activation within 72 hours.";
    }
    if (account.snapshot.social_post_count === 0 && account.snapshot.trip_count > 0) {
        return "Test a post-trip review and social loop for this account by turning one finished itinerary into a ready-to-publish social asset.";
    }
    return "Test an expansion play by identifying a repeat-booking or referral prompt after the next successful proposal cycle.";
}

function buildGrowthOpportunities(account: AccountRow, effectiveActivationStage: AccountActivationStage): string[] {
    const opportunities: string[] = [];
    if (account.snapshot.whatsapp_session_count > 0 && account.snapshot.proposal_sent_count === 0) {
        opportunities.push("WhatsApp demand exists but is not turning into proposals");
    }
    if (effectiveActivationStage === "first_proposal_sent" && account.snapshot.trip_count === 0) {
        opportunities.push("Likely to convert with a tighter follow-up after proposal send");
    }
    if (account.snapshot.trip_count > 0 && account.snapshot.social_post_count === 0) {
        opportunities.push("Post-trip social workflow is unused");
    }
    if (account.snapshot.ai_requests_mtd > 0 && account.snapshot.proposal_sent_count > 0 && account.snapshot.trip_count > 0) {
        opportunities.push("Strong usage footprint suggests upsell potential");
    }
    if (account.snapshot.member_count >= 3 && !account.account_state.owner_id) {
        opportunities.push("Multi-user account without clear owner");
    }
    return opportunities.slice(0, 3);
}

function daysUntilDate(value: string | null | undefined): number | null {
    if (!value) return null;
    const diffMs = new Date(value).getTime() - Date.now();
    if (!Number.isFinite(diffMs)) return null;
    return Math.floor(diffMs / 86_400_000);
}

function buildDraftMessage(account: AccountRow, sequenceType: CommsSequenceType): string {
    switch (sequenceType) {
        case "collections":
            return `Subject: Quick payment alignment for ${account.name}\n\nHi team,\n\nWe still have ${account.snapshot.overdue_invoice_count || 1} overdue invoice${account.snapshot.overdue_invoice_count === 1 ? "" : "s"} totaling ${account.snapshot.overdue_balance_label}. Please confirm the billing owner and expected payment date today so we can keep planning and delivery moving smoothly.\n\nPayment link: (auto-attached on approval/send)\n\nTrip Built Ops`;
        case "viewed_not_approved":
            return `Subject: Quick decision follow-up on your Trip Built proposal\n\nHi team,\n\nI noticed the proposal was viewed but we have not captured approval yet. If there is a blocker on pricing, itinerary, or traveler fit, reply with the concern and we will tighten the proposal today.\n\nTrip Built Ops`;
        case "renewal_prep":
            return `Subject: Renewal planning for ${account.name}\n\nHi team,\n\nWe are preparing your next Trip Built operating plan and want to align around proposal throughput, trip volume, and workflow goals before renewal. Reply with your decision owner and preferred review window this week.\n\nTrip Built Ops`;
        case "incident_recovery":
            return `Subject: Recovery update for your Trip Built workspace\n\nHi team,\n\nWe are actively working the issue affecting your workspace and have assigned an internal recovery owner. We will send the next status update today with current progress and the short-term workaround if one is needed.\n\nTrip Built Ops`;
        default:
            return `Subject: Let’s get your first Trip Built proposal out\n\nHi team,\n\nYour account is close to activation but has not crossed the first proposal sent milestone yet. We can help turn the current trip draft into a client-ready proposal and tighten the workflow so the team can send it today.\n\nTrip Built Ops`;
    }
}

function appendPaymentLinkToDraft(draft: string, paymentLinkUrl: string | null): string {
    if (!paymentLinkUrl) return draft;
    if (draft.includes(paymentLinkUrl)) return draft;
    return `${draft}\n\n💳 Pay now: ${paymentLinkUrl}`;
}

function buildCommunicationDrafts(account: BusinessOsAccountRow): BusinessOsCommunicationDraft[] {
    const drafts: BusinessOsCommunicationDraft[] = [];
    const addDraft = (
        sequenceType: CommsSequenceType,
        config: { title: string; reason: string; channel?: CommsChannel },
    ) => {
        drafts.push({
            id: `${account.org_id}:${sequenceType}`,
            org_id: account.org_id,
            account_name: account.name,
            priority_score: account.priority_score,
            sequence_type: sequenceType,
            channel: config.channel ?? "mixed",
            title: config.title,
            reason: config.reason,
            draft: buildDraftMessage(account, sequenceType),
            requires_approval: true,
        });
    };

    if (account.snapshot.overdue_balance > 0) {
        addDraft("collections", {
            title: "Collections follow-up draft",
            reason: `${account.snapshot.overdue_invoice_count || 1} overdue invoice${account.snapshot.overdue_invoice_count === 1 ? "" : "s"} and ${account.snapshot.overdue_balance_label} still open`,
            channel: "email",
        });
    }
    if (account.snapshot.proposal_viewed_count > 0 && account.snapshot.proposal_approved_count === 0) {
        addDraft("viewed_not_approved", {
            title: "Viewed-not-approved follow-up draft",
            reason: `${account.snapshot.proposal_viewed_count} proposals were viewed without approval`,
            channel: "mixed",
        });
    }
    if (account.snapshot.expiring_proposal_count > 0) {
        addDraft("renewal_prep", {
            title: "Proposal rescue outreach draft",
            reason: `${account.snapshot.expiring_proposal_count} proposals are expiring within 72 hours`,
            channel: "email",
        });
    }
    if (account.activation_risk && account.snapshot.proposal_sent_count === 0) {
        addDraft("activation_rescue", {
            title: "Activation rescue outreach draft",
            reason: account.activation_risk_reasons[0] ?? "First proposal milestone is stalled",
            channel: account.snapshot.active_whatsapp_session_count > 0 ? "whatsapp" : "mixed",
        });
    }
    const renewalDays = daysUntilDate(account.account_state.renewal_at);
    if (renewalDays !== null && renewalDays <= 30) {
        addDraft("renewal_prep", {
            title: "Renewal prep outreach draft",
            reason: renewalDays < 0 ? "Renewal date is overdue" : `Renewal is due in ${renewalDays} day${renewalDays === 1 ? "" : "s"}`,
            channel: "email",
        });
    }
    if (account.snapshot.fatal_error_count > 0 || account.snapshot.urgent_support_count > 0) {
        addDraft("incident_recovery", {
            title: "Recovery status update draft",
            reason: account.snapshot.fatal_error_count > 0
                ? `${account.snapshot.fatal_error_count} fatal incidents are open`
                : `${account.snapshot.urgent_support_count} urgent support tickets are open`,
            channel: "mixed",
        });
    }

    return drafts.slice(0, 3);
}

function workItemKindForCommunicationSequenceType(sequenceType: CommsSequenceType): GodWorkItemKind {
    switch (sequenceType) {
        case "collections":
            return "collections";
        case "incident_recovery":
            return "incident_followup";
        case "renewal_prep":
            return "renewal";
        default:
            return "growth_followup";
    }
}

function parseSequenceType(value: unknown): CommsSequenceType {
    switch (value) {
        case "collections":
        case "viewed_not_approved":
        case "incident_recovery":
        case "renewal_prep":
            return value;
        default:
            return "activation_rescue";
    }
}

function parseCommsChannel(value: unknown): CommsChannel {
    switch (value) {
        case "email":
        case "whatsapp":
        case "in_app":
            return value;
        default:
            return "mixed";
    }
}

function outcomeTypeForSequenceCompletion(sequenceType: CommsSequenceType): WorkItemOutcomeType {
    switch (sequenceType) {
        case "collections":
            return "payment_collected";
        case "viewed_not_approved":
            return "proposal_approved";
        case "activation_rescue":
            return "proposal_sent";
        default:
            return "recovered";
    }
}

function outcomeTypeForWorkItemClosure(kind: GodWorkItemKind): WorkItemOutcomeType {
    switch (kind) {
        case "collections":
            return "payment_collected";
        case "growth_followup":
            return "proposal_sent";
        default:
            return "recovered";
    }
}

function parseReplyDisposition(value: unknown): "positive" | "blocked" | "needs_follow_up" | "not_interested" {
    switch (value) {
        case "positive":
        case "blocked":
        case "not_interested":
            return value;
        default:
            return "needs_follow_up";
    }
}

function outcomeTypeForReplyDisposition(
    disposition: ReturnType<typeof parseReplyDisposition>,
): WorkItemOutcomeType {
    switch (disposition) {
        case "positive":
            return "recovered";
        case "not_interested":
            return "churned";
        case "blocked":
            return "worse";
        default:
            return "no_change";
    }
}

function followupWorkItemForReply(
    sequenceType: CommsSequenceType,
    disposition: ReturnType<typeof parseReplyDisposition>,
): { kind: GodWorkItemKind; severity: GodWorkItemSeverity; title: string } | null {
    if (disposition === "positive") return null;
    if (disposition === "not_interested") {
        return {
            kind: "churn_risk",
            severity: "high",
            title: `Customer pushback after ${sequenceType.replaceAll("_", " ")} follow-up`,
        };
    }
    if (disposition === "blocked") {
        return sequenceType === "incident_recovery"
            ? {
                kind: "incident_followup",
                severity: "critical",
                title: "Customer reported blocker after recovery update",
            }
            : {
                kind: "support_escalation",
                severity: "high",
                title: `Customer blocker after ${sequenceType.replaceAll("_", " ")} follow-up`,
            };
    }
    return {
        kind: workItemKindForCommunicationSequenceType(sequenceType),
        severity: sequenceType === "incident_recovery" ? "critical" : "medium",
        title: `Customer replied to ${sequenceType.replaceAll("_", " ")} follow-up`,
    };
}

function selectAutoOwnerId(
    account: BusinessOsAccountRow,
    operatorIds: string[],
    currentUserId: string | null | undefined,
    trigger: BusinessOsEventAutomationResult["trigger"] | "daily_autopilot",
): string | null {
    if (account.account_state.owner_id) return account.account_state.owner_id;
    const current = currentUserId?.trim() || null;
    const fallback = operatorIds[0] ?? null;

    if (trigger === "support_ticket_responded" || account.snapshot.fatal_error_count > 0 || account.snapshot.urgent_support_count > 0) {
        return current ?? fallback;
    }
    if (account.snapshot.overdue_balance > 0) {
        return fallback ?? current;
    }
    if (account.activation_risk || account.priority_score >= 60 || account.open_work_item_count > 0) {
        return current ?? fallback;
    }
    return null;
}

async function applyAutoOwnerRouting(
    db: AdminClient,
    options: {
        account: BusinessOsAccountRow;
        ownerId: string;
        actorId: string | null;
        trigger: BusinessOsEventAutomationResult["trigger"] | "daily_autopilot";
    },
): Promise<boolean> {
    let changed = false;

    if (!options.account.account_state.owner_id) {
        await upsertGodAccountState(db, options.account.org_id, { owner_id: options.ownerId });
        changed = true;
    }

    const [workItemsResult, sequencesResult, commitmentsResult] = await Promise.all([
        db
            .from("god_work_items")
            .update({ owner_id: options.ownerId })
            .eq("org_id", options.account.org_id)
            .is("owner_id", null)
            .in("status", ["open", "in_progress", "blocked", "snoozed"])
            .select("id"),
        db
            .from("god_comms_sequences")
            .update({ owner_id: options.ownerId })
            .eq("org_id", options.account.org_id)
            .is("owner_id", null)
            .in("status", ["active", "paused"])
            .select("id"),
        db
            .from("god_commitments")
            .update({ owner_id: options.ownerId })
            .eq("org_id", options.account.org_id)
            .is("owner_id", null)
            .in("status", ["open", "breached"])
            .select("id"),
    ]);

    changed = changed
        || ((workItemsResult.data?.length ?? 0) > 0)
        || ((sequencesResult.data?.length ?? 0) > 0)
        || ((commitmentsResult.data?.length ?? 0) > 0);

    if (changed) {
        await recordOrgActivityEvent(db, {
            org_id: options.account.org_id,
            actor_id: options.actorId,
            event_type: "autopilot_owner_routed",
            title: "Autopilot assigned account owner",
            detail: "Owner routing was applied to the account and any unowned active work.",
            entity_type: "organization",
            entity_id: options.account.org_id,
            source: "business_os_autopilot",
            metadata: {
                owner_id: options.ownerId,
                trigger: options.trigger,
            },
        });
    }

    return changed;
}

function escalationSeverityForCommitment(
    account: BusinessOsAccountRow | undefined,
    commitment: Pick<CommitmentAutopilotRow, "due_at" | "severity">,
): GodWorkItemSeverity {
    const overdueDays = diffDays(commitment.due_at);
    const currentSeverity = commitment.severity === "critical" || commitment.severity === "high"
        ? commitment.severity
        : "medium";
    if (account?.snapshot.fatal_error_count || account?.snapshot.urgent_support_count) return "critical";
    if ((overdueDays ?? 0) >= 2 || currentSeverity === "critical") return "critical";
    return "high";
}

function workItemKindForCommitmentEscalation(metadata: Record<string, unknown> | null): GodWorkItemKind {
    const autopilotKind = typeof metadata?.autopilot_kind === "string" ? metadata.autopilot_kind : "";
    if (autopilotKind === "first_proposal_activation") return "growth_followup";
    if (autopilotKind.includes("collections")) return "collections";
    return "churn_risk";
}

function buildAiExplainability(account: BusinessOsAccountRow, activationRiskReasons: string[]): {
    confidence_score: number;
    confidence_label: BusinessOsAiRecommendation["confidence_label"];
    automation_posture: BusinessOsAiRecommendation["automation_posture"];
    evidence: string[];
} {
    let confidence = 35;
    if (account.snapshot.fatal_error_count > 0) confidence += 30;
    if (account.snapshot.overdue_balance > 0) confidence += 20;
    if (activationRiskReasons.length > 0) confidence += 12;
    if (account.snapshot.proposal_viewed_count > 0 && account.snapshot.proposal_approved_count === 0) confidence += 8;
    if (account.snapshot.urgent_support_count > 0) confidence += 12;
    if (!account.account_state.owner_id && account.priority_score >= 60) confidence += 8;
    confidence = Math.max(25, Math.min(96, confidence));

    const evidence = [
        ...account.priority_reasons,
        account.account_state.next_action ? `Current next action: ${account.account_state.next_action}` : "No next action is recorded",
        account.account_state.renewal_at ? `Renewal date: ${new Date(account.account_state.renewal_at).toLocaleDateString()}` : null,
    ].filter(Boolean).slice(0, 5) as string[];

    return {
        confidence_score: confidence,
        confidence_label: confidence >= 80 ? "high" : confidence >= 55 ? "medium" : "low",
        automation_posture: account.snapshot.fatal_error_count > 0 || account.snapshot.overdue_balance > 0
            ? "approval_required"
            : account.activation_risk || account.snapshot.proposal_viewed_count > 0
                ? "draft_and_queue"
                : "monitor",
        evidence,
    };
}

function buildFounderMode(accounts: BusinessOsAccountRow[], approvals: AutopilotApproval[]): FounderModeSnapshot {
    const highestRisk = accounts.slice(0, 5).map((account) => ({
        org_id: account.org_id,
        account_name: account.name,
        priority_score: account.priority_score,
        reasons: account.priority_reasons.slice(0, 3),
    }));

    const revenueMoves = accounts
        .filter((account) =>
            account.snapshot.overdue_balance > 0
            || account.snapshot.expiring_proposal_count > 0
            || (daysUntilDate(account.account_state.renewal_at) ?? 99) <= 30
            || account.margin_watch,
        )
        .sort((left, right) =>
            right.snapshot.overdue_balance - left.snapshot.overdue_balance
            || right.snapshot.expiring_proposal_value - left.snapshot.expiring_proposal_value
            || right.priority_score - left.priority_score,
        )
        .slice(0, 5)
        .map((account) => ({
            id: `revenue:${account.org_id}`,
            org_id: account.org_id,
            account_name: account.name,
            title: account.snapshot.overdue_balance > 0
                ? "Recover overdue cash"
                : (daysUntilDate(account.account_state.renewal_at) ?? 99) <= 30
                    ? "Prepare renewal motion"
                    : "Review expansion leverage",
            detail: account.snapshot.overdue_balance > 0
                ? `${account.snapshot.overdue_balance_label} overdue across ${account.snapshot.overdue_invoice_count || 1} invoices`
                : (daysUntilDate(account.account_state.renewal_at) ?? 99) <= 30
                    ? `Renewal due ${new Date(account.account_state.renewal_at ?? "").toLocaleDateString()}`
                    : account.margin_watch_reasons[0] ?? "Usage signals suggest expansion or pricing review",
            priority_score: account.priority_score,
            href: account.snapshot.overdue_balance > 0 || account.snapshot.expiring_proposal_count > 0
                ? "/god/collections"
                : "/god/business-os",
        }));

    const churnRisks = accounts
        .filter((account) =>
            account.snapshot.fatal_error_count > 0
            || account.snapshot.urgent_support_count > 0
            || account.activation_risk
            || account.account_state.health_band === "at_risk",
        )
        .sort((left, right) => right.priority_score - left.priority_score)
        .slice(0, 5)
        .map((account) => ({
            id: `churn:${account.org_id}`,
            org_id: account.org_id,
            account_name: account.name,
            title: account.snapshot.fatal_error_count > 0
                ? "Protect trust after incident"
                : account.snapshot.urgent_support_count > 0
                    ? "Own support recovery"
                    : account.activation_risk
                        ? "Recover activation"
                        : "Review at-risk posture",
            detail: account.priority_reasons.slice(0, 2).join(" • ") || "Account needs direct founder review",
            priority_score: account.priority_score,
            href: "/god/business-os",
        }));

    const pendingApprovals = approvals.filter((approval) => approval.status === "pending").slice(0, 5);
    return {
        headline: pendingApprovals.length > 0
            ? `${pendingApprovals.length} approval${pendingApprovals.length === 1 ? "" : "s"} need founder attention.`
            : highestRisk[0]
                ? `${highestRisk[0].account_name} is the top account exception right now.`
                : "No founder-only exceptions are urgent right now.",
        summary: `Focus on ${revenueMoves.length} revenue move${revenueMoves.length === 1 ? "" : "s"}, ${churnRisks.length} churn risk${churnRisks.length === 1 ? "" : "s"}, and only the approvals that unblock customer-impacting actions.`,
        approvals: pendingApprovals,
        highest_risk_accounts: highestRisk,
        revenue_moves: revenueMoves,
        churn_risks: churnRisks,
    };
}

function buildFounderDigest(input: {
    generatedAt?: string | null;
    founderMode: FounderModeSnapshot;
    dailyBrief: BusinessOsDailyBrief;
    approvals: AutopilotApproval[];
    communicationDrafts: BusinessOsCommunicationDraft[];
    promiseWatchdog: AutopilotSnapshot["promise_watchdog"];
    recentRuns: AutopilotRun[];
    sendQueueReady: number;
    sendQueueStale: number;
}): FounderDigest {
    const pendingApprovals = input.approvals.filter((approval) => approval.status === "pending");
    const pendingCommsApprovals = pendingApprovals.filter((approval) => approval.action_kind === "guarded_customer_communication");
    const approvalsSection = pendingApprovals
        .slice(0, 3)
        .map((approval) => `${approval.account_name}: ${approval.title}`);
    const revenueSection = input.founderMode.revenue_moves
        .slice(0, 3)
        .map((item) => `${item.account_name}: ${item.detail}`);
    const churnSection = input.founderMode.churn_risks
        .slice(0, 3)
        .map((item) => `${item.account_name}: ${item.detail}`);

    const automationSection: string[] = [];
    if (input.sendQueueReady > 0) {
        automationSection.push(`${input.sendQueueReady} approved communication${input.sendQueueReady === 1 ? "" : "s"} ready to send`);
    }
    if (input.sendQueueStale > 0) {
        automationSection.push(`${input.sendQueueStale} approved communication${input.sendQueueStale === 1 ? "" : "s"} stalled for more than 24 hours`);
    }
    if (pendingCommsApprovals.length > 0) {
        automationSection.push(`${pendingCommsApprovals.length} approved-send communication${pendingCommsApprovals.length === 1 ? "" : "s"} still need founder approval`);
    }
    if (input.promiseWatchdog[0]) {
        automationSection.push(`${input.promiseWatchdog[0].account_name}: ${input.promiseWatchdog[0].reasons.join(" • ")}`);
    }
    if (input.communicationDrafts.length > 0) {
        automationSection.push(`${input.communicationDrafts.length} customer communication draft${input.communicationDrafts.length === 1 ? "" : "s"} ready for review`);
    }
    if (input.recentRuns[0]) {
        automationSection.push(`Latest run: ${input.recentRuns[0].summary}`);
    } else {
        automationSection.push(input.dailyBrief.queue_focus);
    }

    const sections = [
        { id: "approvals", title: "Approvals", items: approvalsSection },
        { id: "revenue", title: "Revenue moves", items: revenueSection },
        { id: "churn", title: "Churn risks", items: churnSection },
        { id: "automation", title: "Automation watch", items: automationSection.slice(0, 4) },
    ] satisfies FounderDigestSection[];

    const slackText = [
        `*${input.founderMode.headline}*`,
        input.founderMode.summary,
        ...sections.filter((section) => section.items.length > 0).flatMap((section) => [
            `*${section.title}*`,
            ...section.items.map((item) => `• ${item}`),
        ]),
    ].join("\n");

    return {
        generated_at: input.generatedAt ?? new Date().toISOString(),
        headline: input.founderMode.headline,
        summary: input.founderMode.summary,
        sections: sections.filter((section) => section.items.length > 0),
        slack_text: slackText,
    };
}

function buildAiRecommendation(account: BusinessOsAccountRow, effectiveActivationStage: AccountActivationStage, activationRiskReasons: string[]): BusinessOsAiRecommendation {
    const { nextStep, rationale, playbook } = buildRecommendedNextStep(account, activationRiskReasons, effectiveActivationStage);
    const explainability = buildAiExplainability(account, activationRiskReasons);
    return {
        what_changed: buildWhatChanged(account, activationRiskReasons, effectiveActivationStage),
        recommended_next_step: nextStep,
        rationale,
        confidence_score: explainability.confidence_score,
        confidence_label: explainability.confidence_label,
        automation_posture: explainability.automation_posture,
        evidence: explainability.evidence,
        playbook_draft: `Recommended playbook: ${playbook.replaceAll("_", " ")}.\n\nOwner: ${account.account_state.owner_id ? "existing owner" : "assign operator"}\nDue: ${account.account_state.next_action_due_at ? "use current due date" : "set due date within 24 hours"}\n\nExecution focus: ${nextStep}`,
        customer_save_outreach: buildCustomerSaveOutreach(account),
        collections_sequence: buildCollectionsSequence(account),
        renewal_strategy: buildRenewalStrategy(account, effectiveActivationStage),
        growth_experiment: buildGrowthExperiment(account),
        growth_opportunities: buildGrowthOpportunities(account, effectiveActivationStage),
        communication_drafts: buildCommunicationDrafts(account),
        safe_actions: [
            {
                id: "draft-next-action",
                label: "Draft next action",
                description: "Generate a tighter owner-facing next action and due date.",
                action_kind: "draft_next_action",
                requires_approval: false,
                payload: {
                    next_action: nextStep,
                    suggested_due_at: account.account_state.next_action_due_at ?? new Date(Date.now() + 86_400_000).toISOString(),
                },
            },
            {
                id: "draft-playbook",
                label: "Draft playbook",
                description: "Prepare the account playbook in editable form.",
                action_kind: "draft_playbook",
                requires_approval: false,
                payload: {
                    playbook: playbook.replaceAll("_", " "),
                },
            },
            {
                id: "draft-summary",
                label: "Summarize risk",
                description: "Summarize current risk and operating posture for handoff.",
                action_kind: "draft_summary",
                requires_approval: false,
                payload: {
                    summary: buildWhatChanged(account, activationRiskReasons, effectiveActivationStage),
                },
            },
            {
                id: "draft-work-item",
                label: "Suggest work item",
                description: "Create an actionable follow-up work item draft.",
                action_kind: "draft_work_item",
                requires_approval: false,
                payload: {
                    title: nextStep,
                    summary: rationale,
                    severity: account.snapshot.fatal_error_count > 0 ? "critical" : account.snapshot.overdue_balance > 0 ? "high" : "medium",
                },
            },
            {
                id: "draft-outreach",
                label: "Draft outreach",
                description: "Prepare a customer-facing outreach draft without sending it.",
                action_kind: "draft_outreach",
                requires_approval: false,
                payload: {
                    body: buildCustomerSaveOutreach(account),
                },
            },
        ],
        guarded_actions: [
            {
                id: "guarded-customer-communication",
                label: "Approve customer send",
                description: "Requires approval before customer-facing communication is queued to send.",
                action_kind: "guarded_customer_communication",
                requires_approval: true,
                payload: {
                    reason: rationale,
                },
            },
            {
                id: "guarded-support-escalation",
                label: "Escalate support",
                description: "Requires approval before changing support severity.",
                action_kind: "guarded_support_escalation",
                requires_approval: true,
                payload: {
                    reason: rationale,
                },
            },
            {
                id: "guarded-feature-flag",
                label: "Propose feature flag change",
                description: "Requires approval before changing kill switches or flags.",
                action_kind: "guarded_feature_flag_change",
                requires_approval: true,
                payload: {
                    reason: rationale,
                },
            },
            {
                id: "guarded-writeoff",
                label: "Propose collections exception",
                description: "Requires approval before any write-off or customer-impacting finance action.",
                action_kind: "guarded_collections_writeoff",
                requires_approval: true,
                payload: {
                    reason: rationale,
                    balance: account.snapshot.overdue_balance,
                },
            },
        ],
    };
}

function buildApprovalCandidates(account: BusinessOsAccountRow): AutopilotApproval[] {
    const ai = buildAiRecommendation(account, account.effective_activation_stage, account.activation_risk_reasons);
    const approvals: AutopilotApproval[] = [];

    const addApproval = (
        actionKind: AutopilotApproval["action_kind"],
        config: {
            title: string;
            description: string;
            severity: AutopilotApproval["severity"];
            suggestedWorkItemKind: GodWorkItemKind;
        },
    ) => {
        const action = ai.guarded_actions.find((candidate) => candidate.action_kind === actionKind);
        if (!action) return;
        approvals.push({
            id: autopilotApprovalId(account.org_id, actionKind),
            org_id: account.org_id,
            account_name: account.name,
            priority_score: account.priority_score,
            severity: config.severity,
            action_kind: actionKind,
            title: config.title,
            description: config.description,
            rationale: ai.rationale,
            suggested_work_item_kind: config.suggestedWorkItemKind,
            status: "pending",
            first_seen_at: null,
            decided_at: null,
            decided_by: null,
            payload: action.payload,
        });
    };

    if (account.snapshot.urgent_support_count > 0 || account.snapshot.fatal_error_count > 0) {
        addApproval("guarded_support_escalation", {
            title: "Approve support escalation plan",
            description: "Escalate the account into an explicit recovery lane before customer trust degrades further.",
            severity: account.snapshot.fatal_error_count > 0 ? "critical" : "high",
            suggestedWorkItemKind: "support_escalation",
        });
    }

    if (account.snapshot.overdue_balance > 0) {
        addApproval("guarded_collections_writeoff", {
            title: "Approve collections exception review",
            description: "Review whether the overdue balance needs a customer-impacting finance exception or senior intervention.",
            severity: account.snapshot.overdue_balance >= 100000 ? "critical" : "high",
            suggestedWorkItemKind: "collections",
        });
    }

    if (account.snapshot.fatal_error_count > 0) {
        addApproval("guarded_feature_flag_change", {
            title: "Approve mitigation change review",
            description: "Review whether an incident mitigation or feature-flag change should be pushed for this account.",
            severity: "critical",
            suggestedWorkItemKind: "incident_followup",
        });
    }

    for (const draft of ai.communication_drafts) {
        approvals.push({
            id: autopilotApprovalId(account.org_id, "guarded_customer_communication", draft.sequence_type),
            org_id: account.org_id,
            account_name: account.name,
            priority_score: account.priority_score,
            severity: draft.sequence_type === "incident_recovery"
                ? "critical"
                : draft.sequence_type === "collections" || draft.sequence_type === "renewal_prep"
                    ? "high"
                    : "medium",
            action_kind: "guarded_customer_communication",
            title: `Approve send: ${draft.title}`,
            description: `${draft.reason}. Queue ${draft.channel} delivery once approved.`,
            rationale: ai.rationale,
            suggested_work_item_kind: workItemKindForCommunicationSequenceType(draft.sequence_type),
            status: "pending",
            first_seen_at: null,
            decided_at: null,
            decided_by: null,
            payload: {
                sequence_type: draft.sequence_type,
                channel: draft.channel,
                title: draft.title,
                reason: draft.reason,
                draft: draft.draft,
            },
        });
    }

    return approvals;
}

async function loadApprovalLifecycleMap(
    db: AdminClient,
    orgIds: string[],
): Promise<Map<string, ApprovalLifecycle>> {
    const uniqueOrgIds = Array.from(new Set(orgIds.filter(Boolean)));
    if (uniqueOrgIds.length === 0) return new Map();

    const result = await db
        .from("org_activity_events")
        .select("org_id, actor_id, event_type, metadata, occurred_at")
        .in("org_id", uniqueOrgIds)
        .eq("source", "business_os_autopilot_approval")
        .in("event_type", [
            "autopilot_approval_surfaced",
            "autopilot_approval_approved",
            "autopilot_approval_rejected",
            "autopilot_approval_expired",
        ])
        .order("occurred_at", { ascending: true })
        .limit(1000);

    const rows = (result.data ?? []) as ApprovalDecisionRow[];
    const actorIds = Array.from(new Set(rows.map((row) => row.actor_id ?? "").filter(Boolean)));
    const actorLookup = new Map<string, string>();

    if (actorIds.length > 0) {
        const actorResult = await db.from("profiles").select("id, full_name, email").in("id", actorIds);
        for (const actor of (actorResult.data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
            actorLookup.set(actor.id, actor.full_name?.trim() || actor.email?.trim() || "Unknown operator");
        }
    }

    const decisions = new Map<string, ApprovalLifecycle>();
    for (const row of rows) {
        const metadata = normalizeMetadata(row.metadata);
        const approvalId = typeof metadata?.approval_id === "string" ? metadata.approval_id : null;
        if (!approvalId) continue;
        const current = decisions.get(approvalId) ?? {
            first_seen_at: null,
            status: null,
            decided_at: null,
            decided_by: null,
        };
        if (row.event_type === "autopilot_approval_surfaced") {
            decisions.set(approvalId, {
                ...current,
                first_seen_at: current.first_seen_at ?? row.occurred_at,
            });
            continue;
        }
        const status = row.event_type === "autopilot_approval_approved"
            ? "approved"
            : row.event_type === "autopilot_approval_rejected"
                ? "rejected"
                : "expired";
        decisions.set(approvalId, {
            ...current,
            status,
            decided_at: row.occurred_at,
            decided_by: row.actor_id ? actorLookup.get(row.actor_id) ?? null : null,
        });
    }

    return decisions;
}

async function listAutopilotApprovalsInternal(
    db: AdminClient,
    accounts: BusinessOsAccountRow[],
    options: { includeResolved?: boolean } = {},
): Promise<AutopilotApproval[]> {
    const decisionMap = await loadApprovalLifecycleMap(db, accounts.map((account) => account.org_id));
    const approvals = accounts.flatMap((account) => buildApprovalCandidates(account)).map((approval) => {
        const decision = decisionMap.get(approval.id);
        const withLifecycle = {
            ...approval,
            first_seen_at: decision?.first_seen_at ?? approval.first_seen_at,
        };
        return decision?.status
            ? {
                ...withLifecycle,
                status: decision.status,
                decided_at: decision.decided_at,
                decided_by: decision.decided_by,
            }
            : withLifecycle;
    });

    return approvals
        .filter((approval) => options.includeResolved || approval.status === "pending")
        .sort((left, right) => {
            const statusWeight = (value: AutopilotApprovalStatus) => (value === "pending" ? 4 : value === "approved" ? 3 : value === "rejected" ? 2 : 1);
            const severityWeight = (value: AutopilotApproval["severity"]) => (value === "critical" ? 3 : value === "high" ? 2 : 1);
            return statusWeight(right.status) - statusWeight(left.status)
                || severityWeight(right.severity) - severityWeight(left.severity)
                || right.priority_score - left.priority_score
                || left.account_name.localeCompare(right.account_name);
        });
}

export function buildAutopilotAuditDetails(
    autopilot: BusinessOsDailyAutopilotResult,
    brief: BusinessOsDailyBrief,
    trigger: "manual" | "scheduled",
    durationMs?: number | null,
): Record<string, unknown> {
    const normalizedDurationMs = Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs ?? 0)) : null;
    return {
        trigger,
        run_key: autopilot.run_key,
        idempotency_key: autopilot.idempotency_key,
        summary: [
            `Created ${autopilot.ops_loop.created_count}/${autopilot.ops_loop.candidate_count} queue items (${autopilot.ops_loop.deduped_count} already covered).`,
            `Owner routes applied ${autopilot.owner_routes_applied}.`,
            `Activation seq +${autopilot.activation_sequences_created} / closed ${autopilot.activation_sequences_completed}.`,
            `Activation commitments +${autopilot.commitments_created} / met ${autopilot.activation_commitments_met}.`,
            `Collections seq +${autopilot.collections_sequences_created} / closed ${autopilot.collections_sequences_completed}.`,
            `Send queue escalations ${autopilot.send_queue_escalated}; no-response escalations ${autopilot.no_response_escalated}.`,
            `Approvals surfaced ${autopilot.approvals_surfaced}; expired ${autopilot.approvals_expired}.`,
            `Breached commitments ${autopilot.commitments_breached} / promise escalations ${autopilot.promise_escalations}.`,
            `Collections work auto-closed ${autopilot.collections_auto_closed}; outcomes recorded ${autopilot.outcomes_recorded}.`,
            normalizedDurationMs !== null ? `Run duration ${Math.round(normalizedDurationMs / 1000)}s.` : null,
        ].filter(Boolean).join(" "),
        duration_ms: normalizedDurationMs,
        brief_headline: brief.headline,
        brief_summary: brief.summary,
        priorities: brief.priorities,
        gaps: brief.gaps,
        created_work_items: autopilot.ops_loop.created_count,
        candidate_work_items: autopilot.ops_loop.candidate_count,
        deduped_work_items: autopilot.ops_loop.deduped_count,
        owner_routes_applied: autopilot.owner_routes_applied,
        activation_sequences_created: autopilot.activation_sequences_created,
        activation_sequences_completed: autopilot.activation_sequences_completed,
        activation_commitments_met: autopilot.activation_commitments_met,
        collections_sequences_created: autopilot.collections_sequences_created,
        collections_sequences_completed: autopilot.collections_sequences_completed,
        send_queue_escalated: autopilot.send_queue_escalated,
        no_response_escalated: autopilot.no_response_escalated,
        approvals_surfaced: autopilot.approvals_surfaced,
        approvals_expired: autopilot.approvals_expired,
        commitments_breached: autopilot.commitments_breached,
        promise_escalations: autopilot.promise_escalations,
        commitments_created: autopilot.commitments_created,
        collections_auto_closed: autopilot.collections_auto_closed,
        outcomes_recorded: autopilot.outcomes_recorded,
        estimated_cash_recovered_inr: autopilot.collections_auto_closed * 10000,
    };
}

async function hasAutopilotRunForKey(
    db: AdminClient,
    runKey: string,
    trigger: "manual" | "scheduled",
): Promise<boolean> {
    if (!runKey.trim()) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON path filters are not captured in generated types
    const rawDb = db as any;
    const action = trigger === "scheduled"
        ? "Autopilot: Scheduled Business OS run"
        : "Autopilot: Manual Business OS run";
    const result = await rawDb
        .from("platform_audit_log")
        .select("id")
        .eq("action", action)
        .filter("details->>run_key", "eq", runKey)
        .order("created_at", { ascending: false })
        .limit(1);
    return Array.isArray(result.data) && result.data.length > 0;
}

async function annotateAutopilotEventsWithRunKey(
    db: AdminClient,
    input: {
        runKey: string;
        trigger: "manual" | "scheduled";
        startedAt: string;
        orgIds: string[];
    },
): Promise<void> {
    if (!input.runKey || input.orgIds.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- broad event annotation query uses JSON path filters
    const rawDb = db as any;
    const result = await rawDb
        .from("org_activity_events")
        .select("id, metadata")
        .in("org_id", input.orgIds)
        .gte("occurred_at", input.startedAt)
        .or("source.eq.business_os_autopilot,source.eq.business_os_autopilot_approval,source.eq.business_os_ops_loop")
        .order("occurred_at", { ascending: true })
        .limit(600);

    const rows = (result.data ?? []) as Array<{ id: string; metadata: unknown }>;
    for (const row of rows) {
        const metadata = normalizeMetadata(row.metadata) ?? {};
        if (typeof metadata.run_key === "string" && metadata.run_key.trim()) continue;
        await rawDb
            .from("org_activity_events")
            .update({
                metadata: {
                    ...metadata,
                    run_key: input.runKey,
                    trigger: input.trigger,
                },
            })
            .eq("id", row.id);
    }
}

function estimateCashRecoveredInrFromRunDetails(details: Record<string, unknown> | null): number {
    const explicit = Number(details?.estimated_cash_recovered_inr ?? 0);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const collectionsAutoClosed = Number(details?.collections_auto_closed ?? 0);
    const collectionsSequencesCompleted = Number(details?.collections_sequences_completed ?? 0);
    if (!Number.isFinite(collectionsAutoClosed) && !Number.isFinite(collectionsSequencesCompleted)) return 0;
    // Conservative placeholder until payment-level mapping is added.
    return Math.max(0, (Number.isFinite(collectionsAutoClosed) ? collectionsAutoClosed : 0) * 10000
        + (Number.isFinite(collectionsSequencesCompleted) ? collectionsSequencesCompleted : 0) * 5000);
}

function buildAutopilotRoiScorecard(runs: AutopilotRun[]): AutopilotRoiScorecard {
    const windowStart = new Date(Date.now() - (7 * 86_400_000)).toISOString();
    const scoped = runs.filter((run) => run.created_at && run.created_at >= windowStart);
    const sum = (key: string) => scoped.reduce((total, run) => total + Number(run.details?.[key] ?? 0), 0);
    const workItemsCreated = sum("created_work_items");
    const workItemsAutoClosed = sum("collections_auto_closed")
        + sum("activation_sequences_completed")
        + sum("collections_sequences_completed");
    const outcomesRecorded = sum("outcomes_recorded");
    const approvalsSurfaced = sum("approvals_surfaced");
    const approvalsExpired = sum("approvals_expired");
    const promiseEscalations = sum("promise_escalations");
    const collectionsAutoClosed = sum("collections_auto_closed");
    const estimatedHoursSaved = Number(((workItemsCreated * 0.3) + (workItemsAutoClosed * 0.2) + (outcomesRecorded * 0.08)).toFixed(1));
    const estimatedCashRecoveredInr = scoped.reduce((total, run) => total + estimateCashRecoveredInrFromRunDetails(run.details), 0);

    const notes: string[] = [];
    if (approvalsExpired > 0) {
        notes.push(`${approvalsExpired} approval items went stale and were auto-escalated.`);
    }
    if (promiseEscalations > 0) {
        notes.push(`${promiseEscalations} promise-watchdog escalations protected follow-through.`);
    }
    if (collectionsAutoClosed > 0) {
        notes.push(`${collectionsAutoClosed} collections work items were auto-closed from resolved balances.`);
    }
    if (notes.length === 0) {
        notes.push("Autopilot stayed quiet this week; no major exception loops triggered.");
    }

    return {
        window: "7d",
        generated_at: new Date().toISOString(),
        run_count: scoped.length,
        work_items_created: workItemsCreated,
        work_items_auto_closed: workItemsAutoClosed,
        outcomes_recorded: outcomesRecorded,
        approvals_surfaced: approvalsSurfaced,
        approvals_expired: approvalsExpired,
        promise_escalations: promiseEscalations,
        collections_auto_closed: collectionsAutoClosed,
        estimated_hours_saved: estimatedHoursSaved,
        estimated_cash_recovered_inr: Math.round(estimatedCashRecoveredInr),
        notes,
    };
}

function detailNumber(details: Record<string, unknown> | null | undefined, key: string): number {
    const value = Number(details?.[key] ?? 0);
    return Number.isFinite(value) ? value : 0;
}

function buildAutopilotRunHealth(input: {
    runs: AutopilotRun[];
    accounts: BusinessOsAccountRow[];
    promiseWatchdogCount: number;
    staleApprovals48h: number;
    sendQueueStale: number;
}): AutopilotRunHealth {
    const latestRun = input.runs[0] ?? null;
    const runAgeHours = diffHours(latestRun?.created_at);
    const staleRun = runAgeHours === null || runAgeHours > 30;
    const latestDetails = latestRun?.details ?? null;
    const durationMsRaw = Number(latestDetails?.duration_ms ?? Number.NaN);
    const lastDurationMs = Number.isFinite(durationMsRaw) ? Math.max(0, Math.round(durationMsRaw)) : null;

    const risk = {
        ai_coo: input.accounts.filter((account) =>
            account.priority_score >= 60 && !account.account_state.owner_id,
        ).length,
        ai_customer_success: input.accounts.filter((account) => account.activation_risk).length,
        ai_revenue_ops: input.accounts.filter((account) =>
            account.snapshot.overdue_balance > 0 || account.snapshot.expiring_proposal_count > 0,
        ).length,
        ai_promise_watchdog: input.promiseWatchdogCount,
        ai_production_operator: input.accounts.filter((account) =>
            account.snapshot.proposal_draft_count > 0 && account.snapshot.proposal_sent_count === 0,
        ).length,
    } as const;

    const processed = {
        ai_coo: detailNumber(latestDetails, "owner_routes_applied") + detailNumber(latestDetails, "approvals_surfaced"),
        ai_customer_success: detailNumber(latestDetails, "activation_sequences_created")
            + detailNumber(latestDetails, "activation_sequences_completed")
            + detailNumber(latestDetails, "activation_commitments_met"),
        ai_revenue_ops: detailNumber(latestDetails, "collections_sequences_created")
            + detailNumber(latestDetails, "collections_sequences_completed")
            + detailNumber(latestDetails, "collections_auto_closed"),
        ai_promise_watchdog: detailNumber(latestDetails, "commitments_breached")
            + detailNumber(latestDetails, "promise_escalations")
            + detailNumber(latestDetails, "no_response_escalated"),
        ai_production_operator: detailNumber(latestDetails, "send_queue_escalated")
            + detailNumber(latestDetails, "no_response_escalated"),
    } as const;

    const loopLabel: Record<AutopilotLoopSummary["id"], string> = {
        ai_coo: "AI COO",
        ai_customer_success: "AI Customer Success",
        ai_revenue_ops: "AI Revenue Ops",
        ai_promise_watchdog: "AI Promise Watchdog",
        ai_production_operator: "AI Production Operator",
    };

    const loops = (Object.keys(loopLabel) as AutopilotLoopSummary["id"][]).map((id) => {
        const loopRisk = risk[id];
        const loopProcessed = staleRun ? 0 : processed[id];
        const status: AutopilotRunHealthLoop["status"] = staleRun
            ? "stalled"
            : (loopRisk > 0 && loopProcessed === 0)
                ? "degraded"
                : "healthy";
        return {
            id,
            label: loopLabel[id],
            status,
            last_run_at: latestRun?.created_at ?? null,
            last_run_trigger: latestRun?.trigger ?? "unknown",
            last_run_duration_ms: lastDurationMs,
            processed_count: loopProcessed,
            detail: `${loopProcessed} actions in latest run • ${loopRisk} accounts currently in risk scope.`,
        } satisfies AutopilotRunHealthLoop;
    });

    const alerts: string[] = [];
    if (!latestRun) {
        alerts.push("No autopilot runs have been recorded yet.");
    } else if (staleRun) {
        alerts.push(`Autopilot last run is stale (${runAgeHours ?? "unknown"}h ago).`);
    }
    if (lastDurationMs !== null && lastDurationMs > 180_000) {
        alerts.push(`Latest autopilot run took ${Math.round(lastDurationMs / 1000)}s, which is above the 180s budget.`);
    }
    if (input.staleApprovals48h > 0) {
        alerts.push(`${input.staleApprovals48h} approvals are stale for over 48 hours.`);
    }
    if (input.sendQueueStale > 0) {
        alerts.push(`${input.sendQueueStale} approved customer communications are stalled in the send queue.`);
    }
    const degradedLoops = loops.filter((loop) => loop.status === "degraded").map((loop) => loop.label);
    if (degradedLoops.length > 0) {
        alerts.push(`Degraded loops: ${degradedLoops.join(", ")}.`);
    }

    return {
        generated_at: new Date().toISOString(),
        run_age_hours: runAgeHours,
        alerts,
        loops,
    };
}

function buildAutopilotTruthLock(payload: {
    accounts: BusinessOsAccountRow[];
    approvals: AutopilotApproval[];
    runs: AutopilotRun[];
    policyViolations: BusinessOsPolicyViolation[];
    promiseWatchdog: AutopilotSnapshot["promise_watchdog"];
}): AutopilotTruthLock {
    const checks: AutopilotTruthLock["checks"] = [];
    const invalidPriority = payload.accounts.filter((account) => !Number.isFinite(account.priority_score)).length;
    checks.push({
        id: "priority_scores",
        label: "Account priority scores are numeric",
        status: invalidPriority === 0 ? "pass" : "warn",
        detail: invalidPriority === 0 ? "All account rows have computed priority scores." : `${invalidPriority} accounts have invalid priority score values.`,
    });
    const missingApprovalIds = payload.approvals.filter((approval) => !approval.id.trim()).length;
    checks.push({
        id: "approval_ids",
        label: "Approval queue rows have deterministic IDs",
        status: missingApprovalIds === 0 ? "pass" : "warn",
        detail: missingApprovalIds === 0 ? "All approvals have stable IDs for HITL actions." : `${missingApprovalIds} approvals are missing IDs.`,
    });
    const missingRunSummary = payload.runs.filter((run) => !run.summary.trim()).length;
    checks.push({
        id: "run_summaries",
        label: "Autopilot runs include summaries",
        status: missingRunSummary === 0 ? "pass" : "warn",
        detail: missingRunSummary === 0 ? "Every recorded run includes summary context." : `${missingRunSummary} runs are missing summaries.`,
    });
    checks.push({
        id: "policy_violation_source",
        label: "Policy violations come from shared account snapshot",
        status: "pass",
        detail: `${payload.policyViolations.length} policy violations computed from account/work-item state.`,
    });
    checks.push({
        id: "promise_watchdog_source",
        label: "Promise watchdog uses commitments and comms followups",
        status: "pass",
        detail: `${payload.promiseWatchdog.length} accounts in watchdog using commitment + follow-up counters.`,
    });

    const unresolved = checks.filter((check) => check.status === "warn").length;
    const coveragePct = checks.length === 0 ? 100 : Math.round(((checks.length - unresolved) / checks.length) * 100);
    return {
        checked_at: new Date().toISOString(),
        coverage_pct: coveragePct,
        unresolved_checks: unresolved,
        checks,
    };
}

function deriveTraceReason(metadata: Record<string, unknown> | null, detail: string | null): string | null {
    if (!metadata) return detail;
    if (typeof metadata.automation_reason === "string" && metadata.automation_reason.trim()) return metadata.automation_reason;
    if (typeof metadata.reason === "string" && metadata.reason.trim()) return metadata.reason;
    if (typeof metadata.autopilot_kind === "string" && metadata.autopilot_kind.trim()) return metadata.autopilot_kind.replaceAll("_", " ");
    return detail;
}

function buildOpsLoopSuggestions(
    account: BusinessOsAccountRow,
    existingKeys: Set<string>,
    breachedCommitmentCount = 0,
    overdueCommsFollowupCount = 0,
): BusinessOsOpsSuggestion[] {
    const suggestions: BusinessOsOpsSuggestion[] = [];

    const addSuggestion = (suggestion: Omit<BusinessOsOpsSuggestion, "org_id" | "account_name" | "target_type" | "target_id">) => {
        if (existingKeys.has(suggestion.automation_key)) return;
        suggestions.push({
            ...suggestion,
            org_id: account.org_id,
            account_name: account.name,
            target_type: "organization",
            target_id: account.org_id,
        });
    };

    if (account.snapshot.overdue_balance > 0) {
        addSuggestion({
            automation_key: `collections:${account.org_id}`,
            kind: "collections",
            severity: account.snapshot.overdue_balance >= 100000 ? "critical" : "high",
            title: "Recover overdue balance",
            summary: `Collections follow-up for ${account.snapshot.overdue_invoice_count || 1} overdue invoices totaling ${account.snapshot.overdue_balance_label}.`,
            due_at: new Date(Date.now() + 86_400_000).toISOString(),
            reason: `${account.snapshot.overdue_invoice_count || 1} overdue invoices and ${account.snapshot.overdue_balance_label} at risk`,
        });
    }

    if (account.snapshot.expiring_proposal_count > 0) {
        addSuggestion({
            automation_key: `proposal-expiry:${account.org_id}`,
            kind: "growth_followup",
            severity: account.snapshot.expiring_proposal_count >= 2 ? "high" : "medium",
            title: "Rescue expiring proposal pipeline",
            summary: `${account.snapshot.expiring_proposal_count} proposals are expiring soon and need an explicit decision-oriented follow-up.`,
            due_at: new Date().toISOString(),
            reason: `${account.snapshot.expiring_proposal_count} proposals are expiring within 72 hours`,
        });
    }

    if (account.snapshot.fatal_error_count > 0) {
        addSuggestion({
            automation_key: `incident:${account.org_id}`,
            kind: "incident_followup",
            severity: "critical",
            title: "Run incident recovery follow-up",
            summary: `Fatal incident recovery is required for ${account.snapshot.fatal_error_count} open fatal events.`,
            due_at: new Date().toISOString(),
            reason: `${account.snapshot.fatal_error_count} fatal incidents are still open`,
        });
    }

    if (account.snapshot.urgent_support_count > 0) {
        addSuggestion({
            automation_key: `support:${account.org_id}`,
            kind: "support_escalation",
            severity: account.snapshot.urgent_support_count >= 2 ? "critical" : "high",
            title: "Own urgent support recovery",
            summary: `Urgent support pressure needs an explicit owner and same-day recovery note.`,
            due_at: new Date().toISOString(),
            reason: `${account.snapshot.urgent_support_count} urgent support tickets are open`,
        });
    }

    if (
        account.snapshot.urgent_support_count > 0
        && (
            account.snapshot.overdue_balance > 0
            || account.snapshot.expiring_proposal_count > 0
            || (account.snapshot.days_since_last_proposal_sent ?? 0) >= 14
        )
    ) {
        addSuggestion({
            automation_key: `customer-save:${account.org_id}`,
            kind: "churn_risk",
            severity: account.snapshot.overdue_balance > 0 || account.snapshot.expiring_proposal_count > 0 ? "critical" : "high",
            title: "Run integrated customer-save motion",
            summary: "Support pressure is combining with commercial risk and needs a named save owner plus same-day follow-up.",
            due_at: new Date().toISOString(),
            reason: "Support pressure overlaps with stalled or at-risk revenue",
        });
    }

    if (account.activation_risk) {
        addSuggestion({
            automation_key: `activation:${account.org_id}`,
            kind: "growth_followup",
            severity: account.snapshot.whatsapp_proposal_draft_count > 0 ? "high" : "medium",
            title: "Recover first proposal milestone",
            summary: account.activation_risk_reasons.join(". ") || "Activation is stalled before first proposal send.",
            due_at: new Date(Date.now() + 86_400_000).toISOString(),
            reason: account.activation_risk_reasons[0] ?? "Activation is stalled",
        });
    }

    const reviewAge = diffDays(account.account_state.last_reviewed_at);
    if (account.priority_score >= 60 && (reviewAge === null || reviewAge >= 7)) {
        addSuggestion({
            automation_key: `review:${account.org_id}`,
            kind: "churn_risk",
            severity: "high",
            title: "Review high-risk account posture",
            summary: reviewAge === null
                ? "This high-risk account has never been reviewed in Business OS."
                : `This high-risk account has not been reviewed for ${reviewAge} days.`,
            due_at: new Date(Date.now() + 86_400_000).toISOString(),
            reason: reviewAge === null ? "No prior review recorded" : `Last review was ${reviewAge} days ago`,
        });
    }

    if (account.margin_watch) {
        addSuggestion({
            automation_key: `margin:${account.org_id}`,
            kind: "renewal",
            severity: "medium",
            title: "Review margin and upsell posture",
            summary: account.margin_watch_reasons.join(". "),
            due_at: new Date(Date.now() + (2 * 86_400_000)).toISOString(),
            reason: account.margin_watch_reasons[0] ?? "Usage and monetization are out of sync",
        });
    }

    if (breachedCommitmentCount > 0) {
        addSuggestion({
            automation_key: `commitment:${account.org_id}`,
            kind: "churn_risk",
            severity: breachedCommitmentCount >= 2 ? "critical" : "high",
            title: "Recover breached customer commitments",
            summary: `${breachedCommitmentCount} customer commitments are overdue and need escalation recovery.`,
            due_at: new Date().toISOString(),
            reason: `${breachedCommitmentCount} commitments are breached or overdue`,
        });
    }

    if (overdueCommsFollowupCount > 0) {
        addSuggestion({
            automation_key: `promise-watchdog:${account.org_id}`,
            kind: "churn_risk",
            severity: overdueCommsFollowupCount >= 2 ? "high" : "medium",
            title: "Resolve overdue customer follow-ups",
            summary: `${overdueCommsFollowupCount} active communication follow-ups are overdue and need owner action.`,
            due_at: new Date().toISOString(),
            reason: `${overdueCommsFollowupCount} overdue comms follow-ups detected`,
        });
    }

    return suggestions;
}

function buildPolicyViolations(
    account: BusinessOsAccountRow,
    activeKinds: Set<GodWorkItemKind>,
    breachedCommitmentCount = 0,
    overdueCommsFollowupCount = 0,
): BusinessOsPolicyViolation[] {
    const violations: BusinessOsPolicyViolation[] = [];

    if (!account.account_state.owner_id && account.priority_score >= 60) {
        violations.push({
            id: `${account.org_id}:owner`,
            org_id: account.org_id,
            account_name: account.name,
            severity: "high",
            rule: "High-risk accounts must have an owner",
            detail: "This account is high risk and still unowned.",
        });
    }

    if (account.snapshot.overdue_balance > 0 && !activeKinds.has("collections")) {
        violations.push({
            id: `${account.org_id}:collections`,
            org_id: account.org_id,
            account_name: account.name,
            severity: account.snapshot.overdue_balance >= 100000 ? "critical" : "high",
            rule: "Overdue accounts must have an active collections work item",
            detail: `${account.snapshot.overdue_invoice_count || 1} overdue invoices with no active collections follow-up.`,
        });
    }

    if (account.snapshot.fatal_error_count > 0 && !activeKinds.has("incident_followup")) {
        violations.push({
            id: `${account.org_id}:incident`,
            org_id: account.org_id,
            account_name: account.name,
            severity: "critical",
            rule: "Fatal incidents must have a recovery follow-up",
            detail: `${account.snapshot.fatal_error_count} fatal incidents are open without incident follow-up work.`,
        });
    }

    if (
        account.snapshot.proposal_viewed_count > 0
        && account.snapshot.proposal_approved_count === 0
        && !activeKinds.has("growth_followup")
        && !activeKinds.has("churn_risk")
    ) {
        violations.push({
            id: `${account.org_id}:proposal-followup`,
            org_id: account.org_id,
            account_name: account.name,
            severity: "medium",
            rule: "Viewed proposals need explicit follow-up",
            detail: "Client viewed proposals but no approval-focused follow-up work item is active.",
        });
    }

    if (account.snapshot.expiring_proposal_count > 0 && !activeKinds.has("growth_followup") && !activeKinds.has("renewal")) {
        violations.push({
            id: `${account.org_id}:proposal-expiry`,
            org_id: account.org_id,
            account_name: account.name,
            severity: account.snapshot.expiring_proposal_count >= 2 ? "high" : "medium",
            rule: "Expiring proposals require explicit rescue work",
            detail: `${account.snapshot.expiring_proposal_count} proposals are expiring soon without active rescue or renewal work.`,
        });
    }

    if (
        account.snapshot.urgent_support_count > 0
        && (account.snapshot.overdue_balance > 0 || account.snapshot.expiring_proposal_count > 0)
        && !activeKinds.has("churn_risk")
    ) {
        violations.push({
            id: `${account.org_id}:customer-save`,
            org_id: account.org_id,
            account_name: account.name,
            severity: "critical",
            rule: "Support pressure plus commercial risk requires a customer-save motion",
            detail: "Urgent support is open while revenue is also at risk, but no churn-save work item is active.",
        });
    }

    if (breachedCommitmentCount > 0 && !activeKinds.has("churn_risk") && !activeKinds.has("support_escalation")) {
        violations.push({
            id: `${account.org_id}:commitments`,
            org_id: account.org_id,
            account_name: account.name,
            severity: breachedCommitmentCount >= 2 ? "critical" : "high",
            rule: "Breached commitments require active escalation work",
            detail: `${breachedCommitmentCount} commitments are breached/overdue with no churn-risk or support escalation work item.`,
        });
    }

    if (overdueCommsFollowupCount > 0 && !activeKinds.has("churn_risk") && !activeKinds.has("support_escalation")) {
        violations.push({
            id: `${account.org_id}:promise-watchdog`,
            org_id: account.org_id,
            account_name: account.name,
            severity: overdueCommsFollowupCount >= 2 ? "high" : "medium",
            rule: "Overdue customer follow-ups require active escalation work",
            detail: `${overdueCommsFollowupCount} active communication follow-ups are overdue with no churn-risk/support escalation work item.`,
        });
    }

    return violations;
}

async function loadAccountContext(db: AdminClient, detail: AccountDetail): Promise<{
    recentSupportTickets: BusinessOsAccountDetail["recent_support_tickets"];
    recentIncidents: BusinessOsAccountDetail["recent_incidents"];
    timeline: BusinessOsTimelineItem[];
}> {
    const orgId = detail.organization.id;
    const [supportResult, incidentResult, announcementResult, auditResult, tripResult, proposalResult, whatsappSessionsResult, whatsappDraftsResult] = await Promise.all([
        db.from("support_tickets").select("id, title, priority, status, created_at, updated_at").eq("organization_id", orgId).order("updated_at", { ascending: false }).limit(5),
        db.from("error_events").select("id, title, level, status, created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
        db.from("platform_announcements").select("id, title, target_segment, target_org_ids, sent_at, status").in("status", ["sent", "scheduled"]).order("sent_at", { ascending: false }).limit(8),
        db.from("platform_audit_log").select("id, action, category, target_type, target_id, created_at").eq("target_type", "organization").eq("target_id", orgId).order("created_at", { ascending: false }).limit(6),
        db.from("trips").select("id, status, created_at, updated_at").eq("organization_id", orgId).order("updated_at", { ascending: false }).limit(5),
        db.from("proposals").select("id, title, status, created_at, updated_at, viewed_at, approved_at, expires_at").eq("organization_id", orgId).order("updated_at", { ascending: false }).limit(8),
        db.from("whatsapp_chatbot_sessions").select("id, state, last_message_at, handed_off_at, created_at").eq("organization_id", orgId).order("last_message_at", { ascending: false }).limit(5),
        db.from("whatsapp_proposal_drafts").select("id, title, status, created_at, updated_at").eq("organization_id", orgId).order("updated_at", { ascending: false }).limit(5),
    ]);

    const recentSupportTickets = ((supportResult.data ?? []) as SupportContextRow[]).map((ticket) => ({
        id: ticket.id,
        title: normalizeText(ticket.title, "Support ticket"),
        priority: ticket.priority,
        status: ticket.status,
        updated_at: ticket.updated_at ?? ticket.created_at,
        href: `/god/support?ticket=${ticket.id}`,
    }));

    const recentIncidents = ((incidentResult.data ?? []) as IncidentContextRow[]).map((incident) => ({
        id: incident.id,
        title: normalizeText(incident.title, "Incident"),
        level: incident.level,
        status: incident.status,
        created_at: incident.created_at,
        href: `/god/errors?event=${incident.id}`,
    }));

    const announcementTimeline = ((announcementResult.data ?? []) as AnnouncementRow[])
        .filter((announcement) => {
            if (announcement.target_segment === "all") return true;
            if (announcement.target_segment === detail.organization.tier) return true;
            if (announcement.target_segment === "specific_orgs") return Array.isArray(announcement.target_org_ids) && announcement.target_org_ids.includes(orgId);
            return false;
        })
        .slice(0, 3)
        .map((announcement) => ({
            id: `announcement:${announcement.id}`,
            kind: "announcement" as const,
            title: normalizeText(announcement.title, "Announcement"),
            detail: `Announcement sent to ${announcement.target_segment ?? "targeted"} accounts`,
            at: announcement.sent_at,
            href: "/god/announcements",
            tone: "neutral" as const,
        }));

    const tripTimeline = ((tripResult.data ?? []) as TripTimelineRow[]).map((trip) => ({
        id: `trip:${trip.id}`,
        kind: "trip" as const,
        title: "Trip activity",
        detail: `Trip is ${normalizeText(trip.status, "active")}`,
        at: trip.updated_at ?? trip.created_at,
        href: `/god/directory?org=${orgId}`,
        tone: normalizeKey(trip.status) === "cancelled" ? "warning" as const : "neutral" as const,
    }));

    const proposalTimeline = ((proposalResult.data ?? []) as ProposalTimelineRow[]).flatMap((proposal) => {
        const entries: BusinessOsTimelineItem[] = [
            {
                id: `proposal:${proposal.id}`,
                kind: "proposal",
                title: normalizeText(proposal.title, "Proposal"),
                detail: `Status ${normalizeText(proposal.status, "draft")}`,
                at: proposal.updated_at ?? proposal.created_at,
                href: `/god/collections?proposal=${proposal.id}`,
                tone: normalizeKey(proposal.status) === "draft" ? "neutral" : "warning",
            },
        ];
        if (proposal.viewed_at) {
            entries.push({
                id: `proposal-view:${proposal.id}`,
                kind: "proposal",
                title: normalizeText(proposal.title, "Proposal viewed"),
                detail: "Client viewed the proposal in the portal",
                at: proposal.viewed_at,
                href: `/god/collections?proposal=${proposal.id}`,
                tone: "warning",
            });
        }
        if (proposal.approved_at) {
            entries.push({
                id: `proposal-approve:${proposal.id}`,
                kind: "proposal",
                title: normalizeText(proposal.title, "Proposal approved"),
                detail: "Client approval signal captured",
                at: proposal.approved_at,
                href: `/god/collections?proposal=${proposal.id}`,
                tone: "neutral",
            });
        }
        return entries;
    });

    const whatsappTimeline = [
        ...((whatsappSessionsResult.data ?? []) as WhatsAppSessionRow[]).map((session) => ({
            id: `whatsapp-session:${session.id}`,
            kind: "whatsapp" as const,
            title: "WhatsApp session",
            detail: `${normalizeText(session.state, "active")} conversation${session.handed_off_at ? " handed off" : ""}`,
            at: session.last_message_at ?? session.created_at,
            href: `/god/directory?org=${orgId}`,
            tone: session.handed_off_at ? "neutral" as const : "warning" as const,
        })),
        ...((whatsappDraftsResult.data ?? []) as WhatsAppDraftRow[]).map((draft) => ({
            id: `whatsapp-draft:${draft.id}`,
            kind: "whatsapp" as const,
            title: normalizeText(draft.title, "WhatsApp proposal draft"),
            detail: `Draft status ${normalizeText(draft.status, "ready")}`,
            at: draft.updated_at ?? draft.created_at,
            href: `/god/directory?org=${orgId}`,
            tone: normalizeKey(draft.status) === "converted" ? "neutral" as const : "warning" as const,
        })),
    ];

    const timeline: BusinessOsTimelineItem[] = [
        {
            id: `signup:${detail.organization.id}`,
            kind: "signup" as const,
            title: "Organization created",
            detail: `${detail.organization.name} was created${detail.organization.tier ? ` on ${detail.organization.tier}` : ""}.`,
            at: detail.organization.created_at,
            href: `/god/directory?org=${detail.organization.id}`,
            tone: "neutral" as const,
        },
        ...proposalTimeline,
        ...detail.recent_invoices.map((invoice) => ({
            id: `invoice:${invoice.id}`,
            kind: "invoice" as const,
            title: invoice.invoice_number ? `Invoice ${invoice.invoice_number}` : "Invoice",
            detail: `${invoice.balance_amount_label} • status ${normalizeText(invoice.status, "unknown")}`,
            at: invoice.due_date,
            href: `/god/collections?invoice=${invoice.id}`,
            tone: (invoice.balance_amount > 0 ? "warning" : "neutral") as BusinessOsTimelineItem["tone"],
        })),
        ...recentSupportTickets.map((ticket) => ({
            id: `support:${ticket.id}`,
            kind: "support" as const,
            title: ticket.title,
            detail: `${normalizeText(ticket.priority, "normal")} priority • ${normalizeText(ticket.status, "open")}`,
            at: ticket.updated_at,
            href: ticket.href,
            tone: (normalizeKey(ticket.priority) === "urgent" ? "danger" : "warning") as BusinessOsTimelineItem["tone"],
        })),
        ...recentIncidents.map((incident) => ({
            id: `incident:${incident.id}`,
            kind: "incident" as const,
            title: incident.title,
            detail: `${normalizeText(incident.level, "unknown")} • ${normalizeText(incident.status, "open")}`,
            at: incident.created_at,
            href: incident.href,
            tone: (normalizeKey(incident.level) === "fatal" ? "danger" : "warning") as BusinessOsTimelineItem["tone"],
        })),
        ...tripTimeline,
        ...whatsappTimeline,
        ...announcementTimeline,
        ...((auditResult.data ?? []) as AuditLogRow[]).map((entry) => ({
            id: `audit:${entry.id}`,
            kind: "admin_action" as const,
            title: normalizeText(entry.action, "Admin action"),
            detail: normalizeText(entry.category, "platform update"),
            at: entry.created_at,
            href: "/god/audit-log",
            tone: "neutral" as const,
        })),
    ]
        .sort((left, right) => new Date(right.at ?? 0).getTime() - new Date(left.at ?? 0).getTime())
        .slice(0, 12);

    return {
        recentSupportTickets,
        recentIncidents,
        timeline,
    };
}

async function buildOrgMemory(
    db: AdminClient,
    detail: AccountDetail,
    account: BusinessOsAccountRow,
    context?: {
        commsSequences?: GodCommsSequence[];
        commitments?: GodCommitment[];
    },
): Promise<BusinessOsAccountDetail["org_memory"]> {
    const [recentEvents, notes] = await Promise.all([
        listOrgActivityEvents(db, detail.organization.id, 12),
        listOrgMemoryNotes(db, detail.organization.id, 8),
    ]);

    return {
        support_ready_summary: buildSupportReadySummary(detail, account),
        pending_items: buildPendingItems(detail, account, context),
        recent_events: recentEvents,
        notes,
    };
}

function enrichAccountRow(account: AccountRow): BusinessOsAccountRow {
    const effectiveActivationStage = resolveActivationStage(account.account_state, account.snapshot, account.created_at);
    const activationRiskReasons = getActivationRiskReasons(account.snapshot, account.created_at);
    const priority = getPriorityScore(account, activationRiskReasons, effectiveActivationStage);
    const provisional = {
        ...account,
        account_state: {
            ...account.account_state,
            activation_stage: effectiveActivationStage,
            first_proposal_sent_at: account.account_state.first_proposal_sent_at ?? account.snapshot.first_proposal_sent_at,
            last_proposal_sent_at: account.account_state.last_proposal_sent_at ?? account.snapshot.last_proposal_sent_at,
        },
        priority_score: priority.score,
        priority_reasons: priority.reasons,
        activation_risk: activationRiskReasons.length > 0,
        activation_risk_reasons: activationRiskReasons,
        margin_watch: false,
        margin_watch_reasons: [],
        effective_activation_stage: effectiveActivationStage,
        pending_approval_count: 0,
    } satisfies BusinessOsAccountRow;
    const marginWatchReasons = getMarginWatchReasons(provisional);
    return {
        ...provisional,
        margin_watch: marginWatchReasons.length > 0,
        margin_watch_reasons: marginWatchReasons,
        effective_activation_stage: effectiveActivationStage,
    };
}

function buildDailyBrief(accounts: BusinessOsAccountRow[], currentUserId: string): BusinessOsDailyBrief {
    const highestRisk = accounts.slice(0, 5);
    const unownedHighRisk = accounts.filter((account) => !account.account_state.owner_id && account.priority_score >= 60).length;
    const dueToday = accounts.filter((account) => account.account_state.next_action_due_at && diffDays(new Date().toISOString(), account.account_state.next_action_due_at) === 0).length;
    const myQueue = accounts.filter((account) => account.account_state.owner_id === currentUserId && account.priority_score > 0).length;
    const staleReviews = accounts.filter((account) => {
        const reviewAge = diffDays(account.account_state.last_reviewed_at);
        return account.priority_score >= 60 && (reviewAge === null || reviewAge >= 7);
    }).length;
    const whatsappActivationGaps = accounts.filter((account) =>
        account.snapshot.whatsapp_proposal_draft_count > 0 && account.snapshot.proposal_sent_count === 0,
    ).length;
    const marginWatch = accounts.filter((account) => account.margin_watch).length;

    return {
        headline: highestRisk.length > 0
            ? `${highestRisk[0].name} is the highest-risk account to handle first.`
            : "No critical accounts surfaced in the current Business OS filters.",
        summary: highestRisk.length > 0
            ? `The current operating load is concentrated in ${highestRisk.filter((account) => account.priority_score >= 60).length} high-risk accounts, with ${unownedHighRisk} of them still unowned and ${staleReviews} overdue for human review.`
            : "Current posture is stable. Focus on moving low-risk accounts toward stronger activation and repeat usage.",
        queue_focus: `My queue has ${myQueue} owned accounts with real priority. ${dueToday} accounts have next actions due today.`,
        priorities: highestRisk.map((account) => `${account.name}: ${account.priority_reasons.slice(0, 3).join(", ") || "review operating posture"}`),
        gaps: [
            unownedHighRisk > 0 ? `${unownedHighRisk} high-risk accounts do not have an owner.` : null,
            accounts.some((account) => account.activation_risk) ? `${accounts.filter((account) => account.activation_risk).length} accounts are still stuck before healthy activation.` : null,
            staleReviews > 0 ? `${staleReviews} high-risk accounts have not been reviewed in the last 7 days.` : null,
            whatsappActivationGaps > 0 ? `${whatsappActivationGaps} accounts have WhatsApp proposal drafts but no sent proposal.` : null,
            marginWatch > 0 ? `${marginWatch} accounts need margin review because usage and monetization are out of sync.` : null,
            accounts.every((account) => account.account_state.next_action) ? null : "Some accounts still lack an explicit next action.",
        ].filter(Boolean) as string[],
        generated_at: new Date().toISOString(),
    };
}

export async function buildBusinessOsPayload(
    db: AdminClient,
    currentUserId: string,
    filters: BusinessOsFilters = {},
): Promise<BusinessOsPayload> {
    const baseOwner = filters.only_my_accounts ? currentUserId : (filters.owner ?? undefined);
    const [listResult, operatorsResult] = await Promise.all([
        listAccounts(db, {
            owner: baseOwner,
            health_band: filters.health_band ?? "all",
            lifecycle_stage: filters.lifecycle_stage ?? "all",
            risk: filters.risk ?? "all",
            search: filters.search ?? "",
            page: filters.page ?? 0,
            limit: Math.min(200, Math.max(20, filters.limit ?? 80)),
        }),
        db.from("profiles").select("id, full_name, email").eq("role", "super_admin").order("full_name", { ascending: true }),
    ]);

    let enriched = listResult.accounts.map(enrichAccountRow);
    if (filters.activation_risk) {
        enriched = enriched.filter((account) => account.activation_risk);
    }

    enriched.sort((left, right) =>
        right.priority_score - left.priority_score
        || Number(Boolean(right.account_state.owner_id)) - Number(Boolean(left.account_state.owner_id))
        || left.name.localeCompare(right.name));

    const activeItems = await loadGodWorkItems(db, {
        orgIds: enriched.map((account) => account.org_id),
        status: "active",
        limit: 500,
    });
    const [commitmentCounts, commsFollowupCounts] = await Promise.all([
        buildCommitmentCounts(db, enriched.map((account) => account.org_id)),
        buildCommsFollowupCounts(db, enriched.map((account) => account.org_id)),
    ]);
    const activeKindsByOrg = new Map<string, Set<GodWorkItemKind>>();
    for (const item of activeItems) {
        if (!item.org_id) continue;
        const kinds = activeKindsByOrg.get(item.org_id) ?? new Set<GodWorkItemKind>();
        kinds.add(item.kind);
        activeKindsByOrg.set(item.org_id, kinds);
    }
    const existingAutomationKeys = new Set(
        activeItems
            .map((item) => {
                const key = item.metadata && typeof item.metadata.automation_key === "string" ? item.metadata.automation_key : null;
                return key;
            })
            .filter(Boolean) as string[],
    );
    const opsLoopSuggestions = enriched.flatMap((account) => buildOpsLoopSuggestions(
        account,
        existingAutomationKeys,
        commitmentCounts.get(account.org_id)?.breached ?? 0,
        commsFollowupCounts.get(account.org_id)?.overdue ?? 0,
    ));
    const policyViolations = enriched
        .flatMap((account) => buildPolicyViolations(
            account,
            activeKindsByOrg.get(account.org_id) ?? new Set<GodWorkItemKind>(),
            commitmentCounts.get(account.org_id)?.breached ?? 0,
            commsFollowupCounts.get(account.org_id)?.overdue ?? 0,
        ))
        .sort((left, right) => {
            const weight = (value: BusinessOsPolicyViolation["severity"]) => (value === "critical" ? 3 : value === "high" ? 2 : 1);
            return weight(right.severity) - weight(left.severity) || left.account_name.localeCompare(right.account_name);
        })
        .slice(0, 20);
    const opsLoopByKind = opsLoopSuggestions.reduce<Record<string, number>>((counts, suggestion) => {
        counts[suggestion.kind] = (counts[suggestion.kind] ?? 0) + 1;
        return counts;
    }, {});
    const playbookLearning = await buildWorkItemOutcomeLearning(db, {
        orgIds: enriched.map((account) => account.org_id),
        sinceDays: 30,
    });
    const pendingApprovals = await listAutopilotApprovalsInternal(db, enriched, { includeResolved: false });
    const pendingApprovalsByOrg = pendingApprovals.reduce<Map<string, AutopilotApproval[]>>((map, approval) => {
        const current = map.get(approval.org_id) ?? [];
        current.push(approval);
        map.set(approval.org_id, current);
        return map;
    }, new Map<string, AutopilotApproval[]>());
    enriched = enriched.map((account) => {
        const pendingCount = pendingApprovalsByOrg.get(account.org_id)?.length ?? 0;
        const approvalBoost = pendingCount > 0 ? Math.min(24, 8 + (pendingCount * 6)) : 0;
        const approvalReason = pendingCount > 0
            ? `${pendingCount} approval-gated action${pendingCount === 1 ? "" : "s"} blocking follow-through`
            : null;
        return {
            ...account,
            priority_score: Math.min(999, account.priority_score + approvalBoost),
            priority_reasons: approvalReason
                ? Array.from(new Set([approvalReason, ...account.priority_reasons]))
                : account.priority_reasons,
            pending_approval_count: pendingCount,
        };
    });
    enriched.sort((left, right) =>
        right.pending_approval_count - left.pending_approval_count
        || right.priority_score - left.priority_score
        || Number(Boolean(right.account_state.owner_id)) - Number(Boolean(left.account_state.owner_id))
        || left.name.localeCompare(right.name));
    const communicationDrafts = enriched
        .flatMap((account) => buildCommunicationDrafts(account))
        .sort((left, right) => right.priority_score - left.priority_score)
        .slice(0, 12);
    const founderMode = buildFounderMode(enriched, pendingApprovals);
    const renewalCandidates = enriched.filter((account) => (daysUntilDate(account.account_state.renewal_at) ?? 99) <= 30).length;
    const expansionCandidates = enriched.filter((account) => account.effective_activation_stage === "expansion" || account.margin_watch).length;
    const marginWatchAccounts = enriched
        .filter((account) => account.margin_watch)
        .slice(0, 8)
        .map((account) => ({
            org_id: account.org_id,
            name: account.name,
            reasons: account.margin_watch_reasons,
            ai_spend_mtd_usd: account.snapshot.ai_spend_mtd_usd,
            proposal_sent_count: account.snapshot.proposal_sent_count,
            proposal_approved_count: account.snapshot.proposal_approved_count,
            trip_count: account.snapshot.trip_count,
        }));

    const selectedOrgId = filters.selected_org_id
        ?? enriched[0]?.org_id
        ?? null;

    let selectedAccount: BusinessOsAccountDetail | null = null;
    if (selectedOrgId) {
        const detail = await getAccountDetail(db, selectedOrgId);
        if (detail) {
            const matchingRow = enriched.find((row) => row.org_id === selectedOrgId) ?? enrichAccountRow({
                org_id: detail.organization.id,
                name: detail.organization.name,
                slug: detail.organization.slug,
                tier: detail.organization.tier,
                created_at: detail.organization.created_at,
                account_state: detail.account_state,
                snapshot: detail.snapshot,
                open_work_item_count: detail.work_items.length,
                risk: "healthy",
            });
            const [context, commsSequences, commitments] = await Promise.all([
                loadAccountContext(db, detail),
                loadCommsSequences(db, detail.organization.id, "all"),
                loadCommitments(db, detail.organization.id, "all"),
            ]);
            const orgMemory = await buildOrgMemory(db, detail, matchingRow, {
                commsSequences,
                commitments,
            });
            const now = Date.now();
            const breachedCommitments = commitments.filter((commitment) => {
                if (commitment.status === "breached") return true;
                if (commitment.status !== "open" || !commitment.due_at) return false;
                return new Date(commitment.due_at).getTime() < now;
            });
            selectedAccount = {
                ...detail,
                account_state: matchingRow.account_state,
                business_impact: buildBusinessImpact(matchingRow.account_state, detail.snapshot),
                priority_score: matchingRow.priority_score,
                priority_reasons: matchingRow.priority_reasons,
                activation_risk: matchingRow.activation_risk,
                activation_risk_reasons: matchingRow.activation_risk_reasons,
                margin_watch: matchingRow.margin_watch,
                margin_watch_reasons: matchingRow.margin_watch_reasons,
                activation_funnel: buildActivationFunnel(matchingRow),
                operating_gaps: buildOperatingGaps(matchingRow),
                changed_since_review: buildChangedSinceReview(matchingRow, context.timeline),
                timeline: context.timeline,
                recent_support_tickets: context.recentSupportTickets,
                recent_incidents: context.recentIncidents,
                comms_sequences: commsSequences,
                commitments,
                breached_commitments: breachedCommitments,
                pending_approvals: pendingApprovalsByOrg.get(detail.organization.id) ?? [],
                org_memory: orgMemory,
                ai: buildAiRecommendation(matchingRow, matchingRow.effective_activation_stage, matchingRow.activation_risk_reasons),
            };
        }
    }

    return {
        generated_at: new Date().toISOString(),
        current_user_id: currentUserId,
        operators: ((operatorsResult.data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((operator) => ({
            id: operator.id,
            name: operator.full_name?.trim() || operator.email?.trim() || "Unknown operator",
            email: operator.email,
        })),
        filters: {
            owner: baseOwner ?? "all",
            health_band: filters.health_band ?? "all",
            lifecycle_stage: filters.lifecycle_stage ?? "all",
            risk: filters.risk ?? "all",
            search: filters.search ?? "",
            activation_risk: Boolean(filters.activation_risk),
        },
        summary: {
            total_accounts: enriched.length,
            my_accounts: enriched.filter((account) => account.account_state.owner_id === currentUserId).length,
            unowned_high_risk: enriched.filter((account) => !account.account_state.owner_id && account.priority_score >= 60).length,
            activation_risk_accounts: enriched.filter((account) => account.activation_risk).length,
            revenue_risk_accounts: enriched.filter((account) => account.snapshot.overdue_balance > 0 || account.snapshot.expiring_proposal_count > 0).length,
            urgent_support_accounts: enriched.filter((account) => account.snapshot.urgent_support_count > 0).length,
            margin_watch_accounts: enriched.filter((account) => account.margin_watch).length,
            ops_loop_candidates: opsLoopSuggestions.length,
            policy_violations: policyViolations.length,
            open_commitments: Array.from(commitmentCounts.values()).reduce((sum, value) => sum + value.open, 0),
            breached_commitments: Array.from(commitmentCounts.values()).reduce((sum, value) => sum + value.breached, 0),
            pending_approvals: pendingApprovals.length,
            blocked_by_approval_accounts: enriched.filter((account) => account.pending_approval_count > 0).length,
            communication_drafts: communicationDrafts.length,
            renewal_candidates: renewalCandidates,
            expansion_candidates: expansionCandidates,
        },
        ai_daily_brief: buildDailyBrief(enriched, currentUserId),
        founder_mode: founderMode,
        playbook_learning: playbookLearning,
        policy_violations: policyViolations,
        communication_drafts: communicationDrafts,
        margin_watch: marginWatchAccounts,
        ops_loop_preview: {
            candidate_count: opsLoopSuggestions.length,
            by_kind: opsLoopByKind,
            suggestions: opsLoopSuggestions,
        },
        accounts: enriched,
        selected_org_id: selectedOrgId,
        selected_account: selectedAccount,
    };
}

export async function getActivationRiskAccounts(db: AdminClient, limit = 10): Promise<BusinessOsAccountRow[]> {
    const { accounts } = await listAccounts(db, { limit: Math.max(20, limit * 3), page: 0 });
    return accounts
        .map(enrichAccountRow)
        .filter((account) => account.activation_risk)
        .sort((left, right) => right.priority_score - left.priority_score)
        .slice(0, limit);
}

export async function getUnownedHighRiskAccounts(db: AdminClient, limit = 10): Promise<BusinessOsAccountRow[]> {
    const { accounts } = await listAccounts(db, { limit: Math.max(20, limit * 3), page: 0 });
    return accounts
        .map(enrichAccountRow)
        .filter((account) => !account.account_state.owner_id && account.priority_score >= 60)
        .sort((left, right) => right.priority_score - left.priority_score)
        .slice(0, limit);
}

export async function getStalledAccounts(db: AdminClient, limit = 10): Promise<BusinessOsAccountRow[]> {
    const [workItems, listResult] = await Promise.all([
        loadGodWorkItems(db, { status: "active", limit: 200 }),
        listAccounts(db, { limit: 120, page: 0 }),
    ]);
    const stalledOrgIds = new Set(
        workItems
            .filter((item) => item.status === "blocked" || item.status === "snoozed")
            .map((item) => item.org_id)
            .filter(Boolean) as string[],
    );

    return listResult.accounts
        .map(enrichAccountRow)
        .filter((account) => {
            const nextActionAge = account.account_state.next_action_due_at
                ? diffDays(account.account_state.next_action_due_at)
                : null;
            return stalledOrgIds.has(account.org_id)
                || (nextActionAge !== null && nextActionAge >= 3)
                || (account.open_work_item_count > 0 && !account.account_state.owner_id);
        })
        .sort((left, right) => right.priority_score - left.priority_score)
        .slice(0, limit);
}

export async function getAccountsNeedingFirstProposal(db: AdminClient, limit = 10): Promise<BusinessOsAccountRow[]> {
    const accounts = await getActivationRiskAccounts(db, Math.max(12, limit * 2));
    return accounts
        .filter((account) => account.snapshot.proposal_sent_count === 0)
        .slice(0, limit);
}

export async function getUnreviewedHighRiskAccounts(db: AdminClient, limit = 10): Promise<BusinessOsAccountRow[]> {
    const { accounts } = await listAccounts(db, { limit: Math.max(20, limit * 4), page: 0 });
    return accounts
        .map(enrichAccountRow)
        .filter((account) => {
            const reviewAge = diffDays(account.account_state.last_reviewed_at);
            return account.priority_score >= 60 && (reviewAge === null || reviewAge >= 7);
        })
        .sort((left, right) => right.priority_score - left.priority_score)
        .slice(0, limit);
}

export async function getWhatsAppActivationGapAccounts(db: AdminClient, limit = 10): Promise<BusinessOsAccountRow[]> {
    const { accounts } = await listAccounts(db, { limit: Math.max(20, limit * 4), page: 0 });
    return accounts
        .map(enrichAccountRow)
        .filter((account) =>
            account.snapshot.whatsapp_proposal_draft_count > 0
            && account.snapshot.proposal_sent_count === 0,
        )
        .sort((left, right) => right.priority_score - left.priority_score)
        .slice(0, limit);
}

export async function getMarginWatchAccounts(db: AdminClient, limit = 10): Promise<BusinessOsAccountRow[]> {
    const { accounts } = await listAccounts(db, { limit: Math.max(20, limit * 4), page: 0 });
    return accounts
        .map(enrichAccountRow)
        .filter((account) => account.margin_watch)
        .sort((left, right) =>
            right.snapshot.ai_spend_mtd_usd - left.snapshot.ai_spend_mtd_usd
            || right.priority_score - left.priority_score,
        )
        .slice(0, limit);
}

export async function runBusinessOpsLoop(db: AdminClient): Promise<BusinessOsOpsLoopResult> {
    const payload = await buildBusinessOsPayload(db, "", { limit: 120 });
    const createdWorkItems: GodWorkItem[] = [];

    for (const suggestion of payload.ops_loop_preview.suggestions) {
        const workItem = await createGodWorkItem(db, {
            kind: suggestion.kind,
            target_type: "organization",
            target_id: suggestion.target_id,
            org_id: suggestion.org_id,
            owner_id: null,
            status: "open",
            severity: suggestion.severity,
            title: suggestion.title,
            summary: suggestion.summary,
            due_at: suggestion.due_at,
            metadata: {
                automation_key: suggestion.automation_key,
                automation_reason: suggestion.reason,
                source: "business_os_ops_loop",
            },
        });
        createdWorkItems.push(workItem);
        await recordOrgActivityEvent(db, {
            org_id: suggestion.org_id,
            actor_id: null,
            event_type: "ops_loop_work_item_created",
            title: suggestion.title,
            detail: suggestion.summary,
            entity_type: "work_item",
            entity_id: workItem.id,
            source: "business_os_ops_loop",
            metadata: {
                automation_key: suggestion.automation_key,
                reason: suggestion.reason,
                kind: suggestion.kind,
            },
        });
    }

    const candidateCount = payload.ops_loop_preview.candidate_count;
    return {
        generated_at: new Date().toISOString(),
        candidate_count: candidateCount,
        created_count: createdWorkItems.length,
        deduped_count: Math.max(0, candidateCount - createdWorkItems.length),
        by_kind: payload.ops_loop_preview.by_kind,
        suggestions: payload.ops_loop_preview.suggestions,
        created_work_items: createdWorkItems,
    };
}

export async function runBusinessDailyAutopilot(
    db: AdminClient,
    options: {
        limit?: number;
        maxActionsPerLoop?: number;
        trigger?: "manual" | "scheduled";
        runKey?: string;
        idempotencyKey?: string;
        enforceIdempotency?: boolean;
    } = {},
): Promise<BusinessOsDailyAutopilotResult> {
    const startedAt = new Date().toISOString();
    const trigger = options.trigger ?? "scheduled";
    const runKey = options.runKey?.trim() || `${trigger}:${startedAt.slice(0, 13)}`;
    const idempotencyKey = options.idempotencyKey?.trim() || runKey;
    if (options.enforceIdempotency ?? true) {
        const alreadyRan = await hasAutopilotRunForKey(db, runKey, trigger);
        if (alreadyRan) {
            return {
                generated_at: new Date().toISOString(),
                run_key: runKey,
                idempotency_key: idempotencyKey,
                ops_loop: {
                    generated_at: startedAt,
                    candidate_count: 0,
                    created_count: 0,
                    deduped_count: 0,
                    by_kind: {},
                    suggestions: [],
                    created_work_items: [],
                },
                owner_routes_applied: 0,
                activation_sequences_created: 0,
                activation_sequences_completed: 0,
                activation_commitments_met: 0,
                collections_sequences_created: 0,
                collections_sequences_completed: 0,
                send_queue_escalated: 0,
                no_response_escalated: 0,
                approvals_surfaced: 0,
                approvals_expired: 0,
                commitments_breached: 0,
                promise_escalations: 0,
                commitments_created: 0,
                collections_auto_closed: 0,
                outcomes_recorded: 0,
            };
        }
    }

    const limit = Math.min(160, Math.max(40, options.limit ?? 120));
    const maxActionsPerLoop = Math.min(60, Math.max(10, options.maxActionsPerLoop ?? 30));
    const [payload, opsLoop] = await Promise.all([
        buildBusinessOsPayload(db, "", { limit }),
        runBusinessOpsLoop(db),
    ]);

    const orgIds = payload.accounts.map((account) => account.org_id);
    if (orgIds.length === 0) {
        return {
            generated_at: new Date().toISOString(),
            run_key: runKey,
            idempotency_key: idempotencyKey,
            ops_loop: opsLoop,
            owner_routes_applied: 0,
            activation_sequences_created: 0,
            activation_sequences_completed: 0,
            activation_commitments_met: 0,
            collections_sequences_created: 0,
            collections_sequences_completed: 0,
            send_queue_escalated: 0,
            no_response_escalated: 0,
            approvals_surfaced: 0,
            approvals_expired: 0,
            commitments_breached: 0,
            promise_escalations: 0,
            commitments_created: 0,
            collections_auto_closed: 0,
            outcomes_recorded: 0,
        };
    }

    const [operatorsResult, sequencesResult, commitmentsResult, collectionsWorkItemsResult, activeWorkItemsResult] = await Promise.all([
        db.from("profiles").select("id").eq("role", "super_admin").order("full_name", { ascending: true }).limit(10),
        db
            .from("god_comms_sequences")
            .select("id, org_id, sequence_type, status, metadata, last_sent_at, next_follow_up_at")
            .in("org_id", orgIds)
            .in("status", ["active", "paused"]),
        db
            .from("god_commitments")
            .select("id, org_id, status, title, severity, due_at, owner_id, metadata")
            .in("org_id", orgIds)
            .eq("status", "open"),
        db
            .from("god_work_items")
            .select("id, org_id, title")
            .in("org_id", orgIds)
            .eq("kind", "collections")
            .in("status", ["open", "in_progress", "blocked", "snoozed"]),
        db
            .from("god_work_items")
            .select("id, org_id, owner_id, kind, status, severity, due_at, metadata")
            .in("org_id", orgIds)
            .in("status", ["open", "in_progress", "blocked", "snoozed"]),
    ]);

    const operatorIds = ((operatorsResult.data ?? []) as Array<{ id: string }>).map((row) => row.id);
    const sequenceRows = (sequencesResult.data ?? []) as CommsSequenceAutopilotRow[];
    const commitmentRows = (commitmentsResult.data ?? []) as CommitmentAutopilotRow[];
    const collectionsWorkItemRows = (collectionsWorkItemsResult.data ?? []) as CollectionsWorkItemAutopilotRow[];
    const activeWorkItemRows = (activeWorkItemsResult.data ?? []) as ActiveWorkItemAutopilotRow[];
    const accountByOrgId = new Map(payload.accounts.map((account) => [account.org_id, account]));

    const sequenceKeys = new Set<string>();
    for (const row of sequenceRows) {
        if (!row.org_id || !row.sequence_type) continue;
        if (row.status === "completed") continue;
        sequenceKeys.add(`${row.org_id}:${row.sequence_type}`);
    }

    const activationCommitmentOrgIds = new Set<string>();
    for (const row of commitmentRows) {
        if (!row.org_id || row.status !== "open") continue;
        const metadata = normalizeMetadata(row.metadata);
        const autopilotKind = typeof metadata?.autopilot_kind === "string"
            ? metadata.autopilot_kind
            : "";
        if (autopilotKind === "first_proposal_activation") {
            activationCommitmentOrgIds.add(row.org_id);
        }
    }

    let ownerRoutesApplied = 0;
    let activationSequencesCreated = 0;
    let activationSequencesCompleted = 0;
    let activationCommitmentsMet = 0;
    let collectionsSequencesCreated = 0;
    let collectionsSequencesCompleted = 0;
    let sendQueueEscalated = 0;
    let noResponseEscalated = 0;
    let approvalsSurfaced = 0;
    let approvalsExpired = 0;
    let commitmentsBreached = 0;
    let promiseEscalations = 0;
    let commitmentsCreated = 0;
    let collectionsAutoClosed = 0;
    let outcomesRecorded = 0;
    const closedWorkItemIds = new Set<string>();

    const unownedPriorityAccounts = payload.accounts.filter((account) =>
        !account.account_state.owner_id
        && (account.priority_score >= 60
            || account.snapshot.overdue_balance > 0
            || account.activation_risk
            || account.snapshot.urgent_support_count > 0
            || account.snapshot.fatal_error_count > 0),
    );
    for (const account of unownedPriorityAccounts) {
        if (ownerRoutesApplied >= maxActionsPerLoop) break;
        const ownerId = selectAutoOwnerId(account, operatorIds, null, "daily_autopilot");
        if (!ownerId) continue;
        const changed = await applyAutoOwnerRouting(db, {
            account,
            ownerId,
            actorId: null,
            trigger: "daily_autopilot",
        });
        if (changed) {
            ownerRoutesApplied += 1;
            accountByOrgId.set(account.org_id, {
                ...account,
                account_state: {
                    ...account.account_state,
                    owner_id: ownerId,
                },
            });
        }
    }

    const approvalLifecycle = await loadApprovalLifecycleMap(db, payload.accounts.map((account) => account.org_id));
    const pendingApprovals = payload.accounts.flatMap((account) => buildApprovalCandidates(account)).filter((approval) => {
        const lifecycle = approvalLifecycle.get(approval.id);
        return !lifecycle?.status;
    });

    for (const approval of pendingApprovals) {
        const lifecycle = approvalLifecycle.get(approval.id);
        if (!lifecycle?.first_seen_at) {
            approvalsSurfaced += 1;
            await recordOrgActivityEvent(db, {
                org_id: approval.org_id,
                actor_id: null,
                event_type: "autopilot_approval_surfaced",
                title: "Autopilot surfaced approval",
                detail: approval.title,
                entity_type: "organization",
                entity_id: approval.org_id,
                source: "business_os_autopilot_approval",
                metadata: {
                    approval_id: approval.id,
                    action_kind: approval.action_kind,
                    severity: approval.severity,
                },
            });
            continue;
        }

        const ageDays = diffDays(lifecycle.first_seen_at);
        if (ageDays === null || ageDays < 2) continue;

        const hasApprovalWork = activeWorkItemRows.some((item) => {
            if (item.org_id !== approval.org_id) return false;
            const metadata = normalizeMetadata(item.metadata);
            return metadata?.approval_id === approval.id;
        });
        if (!hasApprovalWork) {
            await createGodWorkItem(db, {
                kind: approval.suggested_work_item_kind,
                target_type: "organization",
                target_id: approval.org_id,
                org_id: approval.org_id,
                owner_id: accountByOrgId.get(approval.org_id)?.account_state.owner_id ?? operatorIds[0] ?? null,
                status: "open",
                severity: approval.severity,
                title: `Review expired approval: ${approval.title}`,
                summary: `${approval.description}\n\nAutopilot approval sat unresolved for more than 48 hours and was converted into an internal follow-up.`,
                due_at: new Date().toISOString(),
                metadata: {
                    source: "business_os_daily_autopilot",
                    autopilot_kind: "approval_expired_followup",
                    approval_id: approval.id,
                    action_kind: approval.action_kind,
                },
            });
        }
        approvalsExpired += 1;
        await recordOrgActivityEvent(db, {
            org_id: approval.org_id,
            actor_id: null,
            event_type: "autopilot_approval_expired",
            title: "Autopilot expired approval",
            detail: approval.title,
            entity_type: "organization",
            entity_id: approval.org_id,
            source: "business_os_autopilot_approval",
            metadata: {
                approval_id: approval.id,
                action_kind: approval.action_kind,
                first_seen_at: lifecycle.first_seen_at,
            },
        });
    }

    const activationAccounts = payload.accounts.filter((account) =>
        account.activation_risk
        && account.snapshot.proposal_sent_count === 0,
    );
    for (const account of activationAccounts) {
        if (activationSequencesCreated >= maxActionsPerLoop) break;
        const sequenceKey = `${account.org_id}:activation_rescue`;
        if (sequenceKeys.has(sequenceKey)) continue;
        const nextFollowUpAt = account.account_state.next_action_due_at ?? new Date(Date.now() + 86_400_000).toISOString();
        const sequence = await createCommsSequence(db, {
            org_id: account.org_id,
            owner_id: account.account_state.owner_id,
            sequence_type: "activation_rescue",
            status: "active",
            channel: "mixed",
            next_follow_up_at: nextFollowUpAt,
            promise: "Send first proposal to complete activation and confirm decision timeline.",
            metadata: {
                source: "business_os_daily_autopilot",
                autopilot_kind: "activation_rescue",
            },
        });
        sequenceKeys.add(sequenceKey);
        activationSequencesCreated += 1;
        await recordOrgActivityEvent(db, {
            org_id: account.org_id,
            actor_id: null,
            event_type: "autopilot_activation_sequence_created",
            title: "Autopilot created activation sequence",
            detail: `Activation rescue sequence scheduled for ${account.name}.`,
            entity_type: "comms_sequence",
            entity_id: sequence.id,
            source: "business_os_autopilot",
            metadata: {
                sequence_type: sequence.sequence_type,
                next_follow_up_at: sequence.next_follow_up_at,
            },
        });

        if (activationCommitmentOrgIds.has(account.org_id)) continue;
        if (commitmentsCreated >= maxActionsPerLoop) continue;
        const commitment = await createCommitment(db, {
            org_id: account.org_id,
            owner_id: account.account_state.owner_id,
            source: "ops",
            title: "First proposal must be sent",
            detail: "Activation target: send the first client proposal and capture follow-up owner/date.",
            severity: "high",
            due_at: nextFollowUpAt,
            metadata: {
                source: "business_os_daily_autopilot",
                autopilot_kind: "first_proposal_activation",
            },
        });
        activationCommitmentOrgIds.add(account.org_id);
        commitmentsCreated += 1;
        await recordOrgActivityEvent(db, {
            org_id: account.org_id,
            actor_id: null,
            event_type: "autopilot_activation_commitment_created",
            title: "Autopilot created activation commitment",
            detail: "First proposal commitment was added to avoid activation drift.",
            entity_type: "commitment",
            entity_id: commitment.id,
            source: "business_os_autopilot",
            metadata: {
                due_at: commitment.due_at,
                severity: commitment.severity,
            },
        });
    }

    const collectionsAccounts = payload.accounts.filter((account) => account.snapshot.overdue_balance > 0);
    for (const account of collectionsAccounts) {
        if (collectionsSequencesCreated >= maxActionsPerLoop) break;
        const sequenceKey = `${account.org_id}:collections`;
        if (sequenceKeys.has(sequenceKey)) continue;
        const nextFollowUpAt = account.account_state.next_action_due_at ?? new Date().toISOString();
        const sequence = await createCommsSequence(db, {
            org_id: account.org_id,
            owner_id: account.account_state.owner_id,
            sequence_type: "collections",
            status: "active",
            channel: "mixed",
            next_follow_up_at: nextFollowUpAt,
            promise: `Collect overdue balance (${account.snapshot.overdue_balance_label}) and confirm payment date.`,
            metadata: {
                source: "business_os_daily_autopilot",
                autopilot_kind: "collections_dunning",
                overdue_balance: account.snapshot.overdue_balance,
            },
        });
        sequenceKeys.add(sequenceKey);
        collectionsSequencesCreated += 1;
        await recordOrgActivityEvent(db, {
            org_id: account.org_id,
            actor_id: null,
            event_type: "autopilot_collections_sequence_created",
            title: "Autopilot created collections sequence",
            detail: `${account.snapshot.overdue_invoice_count} overdue invoices are queued for follow-up.`,
            entity_type: "comms_sequence",
            entity_id: sequence.id,
            source: "business_os_autopilot",
            metadata: {
                overdue_balance: account.snapshot.overdue_balance,
                next_follow_up_at: sequence.next_follow_up_at,
            },
        });
    }

    const activatedOrgIds = new Set(
        payload.accounts
            .filter((account) => account.snapshot.proposal_sent_count > 0)
            .map((account) => account.org_id),
    );
    for (const row of commitmentRows) {
        if (activationCommitmentsMet >= maxActionsPerLoop) break;
        if (!row.org_id || !activatedOrgIds.has(row.org_id)) continue;
        if (row.status !== "open") continue;
        const metadata = normalizeMetadata(row.metadata);
        const autopilotKind = typeof metadata?.autopilot_kind === "string" ? metadata.autopilot_kind : "";
        if (autopilotKind !== "first_proposal_activation") continue;
        const nextMetadata = {
            ...(metadata ?? {}),
            autopilot_resolved_at: new Date().toISOString(),
            autopilot_resolved_by: "business_os_daily_autopilot",
        };
        const commitment = await updateCommitment(db, row.id, {
            status: "met",
            metadata: nextMetadata,
        });
        if (!commitment) continue;
        activationCommitmentsMet += 1;

        const linkedWorkItem = activeWorkItemRows.find((item) => {
            if (item.org_id !== row.org_id || closedWorkItemIds.has(item.id)) return false;
            const workMetadata = normalizeMetadata(item.metadata);
            return workMetadata?.commitment_id === row.id;
        }) ?? null;
        if (linkedWorkItem) {
            await updateGodWorkItem(db, linkedWorkItem.id, { status: "done" });
            await recordWorkItemOutcome(db, {
                work_item_id: linkedWorkItem.id,
                org_id: row.org_id,
                outcome_type: "proposal_sent",
                note: "Auto-closed by Business OS daily autopilot after first proposal milestone was reached.",
                metadata: {
                    source: "business_os_daily_autopilot",
                    autopilot_kind: "activation_commitment_met",
                    commitment_id: row.id,
                },
                recorded_by: null,
            });
            closedWorkItemIds.add(linkedWorkItem.id);
            outcomesRecorded += 1;
        }
        await recordOrgActivityEvent(db, {
            org_id: row.org_id,
            actor_id: null,
            event_type: "autopilot_activation_commitment_met",
            title: "Autopilot marked activation commitment met",
            detail: "First proposal milestone reached; activation commitment resolved automatically.",
            entity_type: "commitment",
            entity_id: commitment.id,
            source: "business_os_autopilot",
            metadata: {
                status: commitment.status,
                due_at: commitment.due_at,
            },
        });
    }

    for (const row of sequenceRows) {
        if (activationSequencesCompleted >= maxActionsPerLoop) break;
        if (!row.org_id || !activatedOrgIds.has(row.org_id)) continue;
        if (row.sequence_type !== "activation_rescue" || row.status === "completed") continue;
        const sequence = await updateCommsSequence(db, row.id, {
            status: "completed",
            next_follow_up_at: null,
        });
        if (!sequence) continue;
        activationSequencesCompleted += 1;

        const linkedWorkItem = activeWorkItemRows.find((item) => {
            if (item.org_id !== row.org_id || closedWorkItemIds.has(item.id)) return false;
            const workMetadata = normalizeMetadata(item.metadata);
            return workMetadata?.comms_sequence_id === row.id;
        }) ?? null;
        if (linkedWorkItem) {
            await updateGodWorkItem(db, linkedWorkItem.id, { status: "done" });
            await recordWorkItemOutcome(db, {
                work_item_id: linkedWorkItem.id,
                org_id: row.org_id,
                outcome_type: outcomeTypeForSequenceCompletion("activation_rescue"),
                note: "Auto-closed by Business OS daily autopilot after the activation rescue sequence succeeded.",
                metadata: {
                    source: "business_os_daily_autopilot",
                    autopilot_kind: "sequence_completed",
                    sequence_id: row.id,
                    sequence_type: "activation_rescue",
                },
                recorded_by: null,
            });
            closedWorkItemIds.add(linkedWorkItem.id);
            outcomesRecorded += 1;
        }
        await recordOrgActivityEvent(db, {
            org_id: row.org_id,
            actor_id: null,
            event_type: "autopilot_activation_sequence_completed",
            title: "Autopilot completed activation sequence",
            detail: "Activation rescue sequence closed after first proposal milestone.",
            entity_type: "comms_sequence",
            entity_id: sequence.id,
            source: "business_os_autopilot",
            metadata: {
                status: sequence.status,
            },
        });
    }

    const zeroOverdueOrgIds = new Set(
        payload.accounts
            .filter((account) => account.snapshot.overdue_balance <= 0)
            .map((account) => account.org_id),
    );
    for (const row of sequenceRows) {
        if (collectionsSequencesCompleted >= maxActionsPerLoop) break;
        if (!row.org_id || !zeroOverdueOrgIds.has(row.org_id)) continue;
        if (row.sequence_type !== "collections" || row.status === "completed") continue;
        const sequence = await updateCommsSequence(db, row.id, {
            status: "completed",
            next_follow_up_at: null,
        });
        if (!sequence) continue;
        collectionsSequencesCompleted += 1;

        const linkedWorkItem = activeWorkItemRows.find((item) => {
            if (item.org_id !== row.org_id || closedWorkItemIds.has(item.id)) return false;
            const workMetadata = normalizeMetadata(item.metadata);
            return workMetadata?.comms_sequence_id === row.id;
        }) ?? null;
        if (linkedWorkItem) {
            await updateGodWorkItem(db, linkedWorkItem.id, { status: "done" });
            await recordWorkItemOutcome(db, {
                work_item_id: linkedWorkItem.id,
                org_id: row.org_id,
                outcome_type: outcomeTypeForSequenceCompletion("collections"),
                note: "Auto-closed by Business OS daily autopilot after the collections sequence resolved.",
                metadata: {
                    source: "business_os_daily_autopilot",
                    autopilot_kind: "sequence_completed",
                    sequence_id: row.id,
                    sequence_type: "collections",
                },
                recorded_by: null,
            });
            closedWorkItemIds.add(linkedWorkItem.id);
            outcomesRecorded += 1;
        }
        await recordOrgActivityEvent(db, {
            org_id: row.org_id,
            actor_id: null,
            event_type: "autopilot_collections_sequence_completed",
            title: "Autopilot completed collections sequence",
            detail: "Collections follow-up sequence closed after overdue balance cleared.",
            entity_type: "comms_sequence",
            entity_id: sequence.id,
            source: "business_os_autopilot",
            metadata: {
                status: sequence.status,
            },
        });
    }

    const sentNoResponseSequences = sequenceRows.filter((row) => {
        if (!row.org_id || row.status !== "active" || !row.last_sent_at || !row.next_follow_up_at) return false;
        const metadata = normalizeMetadata(row.metadata);
        if (metadata?.send_state !== "sent") return false;
        const nextFollowUpAt = new Date(row.next_follow_up_at).getTime();
        if (!Number.isFinite(nextFollowUpAt) || nextFollowUpAt > now) return false;
        const lastEscalatedAt = typeof metadata?.last_no_response_escalated_at === "string"
            ? new Date(metadata.last_no_response_escalated_at).getTime()
            : Number.NaN;
        return !Number.isFinite(lastEscalatedAt) || lastEscalatedAt <= now - 86_400_000;
    });

    for (const row of sentNoResponseSequences) {
        if (noResponseEscalated >= maxActionsPerLoop) break;
        if (!row.org_id) continue;
        const metadata = normalizeMetadata(row.metadata) ?? {};
        const ownerId = accountByOrgId.get(row.org_id)?.account_state.owner_id ?? null;
        const sequenceType = parseSequenceType(row.sequence_type);
        const existingWorkItem = activeWorkItemRows.find((item) => {
            if (item.org_id !== row.org_id) return false;
            const workMetadata = normalizeMetadata(item.metadata);
            return workMetadata?.comms_sequence_id === row.id
                || (workMetadata?.autopilot_kind === "no_response_followup" && workMetadata?.sequence_type === sequenceType);
        }) ?? null;

        if (existingWorkItem) {
            await updateGodWorkItem(db, existingWorkItem.id, {
                owner_id: existingWorkItem.owner_id ?? ownerId ?? undefined,
                status: existingWorkItem.status === "snoozed" ? "open" : undefined,
                severity: sequenceType === "incident_recovery" ? "critical" : "high",
                due_at: new Date().toISOString(),
                metadata: {
                    ...(normalizeMetadata(existingWorkItem.metadata) ?? {}),
                    autopilot_kind: "no_response_followup",
                    comms_sequence_id: row.id,
                    sequence_type: sequenceType,
                    no_response_count: Number(metadata.no_response_count ?? 0) + 1,
                    last_no_response_escalated_at: new Date().toISOString(),
                },
            });
        } else {
            await createGodWorkItem(db, {
                kind: workItemKindForCommunicationSequenceType(sequenceType),
                target_type: "organization",
                target_id: row.org_id,
                org_id: row.org_id,
                owner_id: ownerId,
                status: "open",
                severity: sequenceType === "incident_recovery" ? "critical" : "high",
                title: `No response after ${sequenceType.replaceAll("_", " ")} follow-up`,
                summary: typeof metadata.draft_reason === "string"
                    ? `${metadata.draft_reason}\n\nCustomer follow-up was sent, but no response was captured by the due date.`
                    : "Customer follow-up was sent, but no response was captured by the due date.",
                due_at: new Date().toISOString(),
                metadata: {
                    source: "business_os_daily_autopilot",
                    autopilot_kind: "no_response_followup",
                    comms_sequence_id: row.id,
                    sequence_type: sequenceType,
                    no_response_count: Number(metadata.no_response_count ?? 0) + 1,
                },
            });
        }

        await updateCommsSequence(db, row.id, {
            next_follow_up_at: new Date(Date.now() + 86_400_000).toISOString(),
            metadata: {
                ...metadata,
                no_response_count: Number(metadata.no_response_count ?? 0) + 1,
                no_response_detected_at: new Date().toISOString(),
                last_no_response_escalated_at: new Date().toISOString(),
                no_response_escalated_by: "business_os_daily_autopilot",
            },
        });
        noResponseEscalated += 1;
        await recordOrgActivityEvent(db, {
            org_id: row.org_id,
            actor_id: null,
            event_type: "autopilot_no_response_escalated",
            title: "Autopilot escalated no-response follow-up",
            detail: typeof metadata.draft_title === "string"
                ? `${metadata.draft_title} was sent but has no recorded response yet.`
                : "A sent communication has not received a recorded response by the follow-up date.",
            entity_type: "comms_sequence",
            entity_id: row.id,
            source: "business_os_autopilot",
            metadata: {
                sequence_type: sequenceType,
                no_response_count: Number(metadata.no_response_count ?? 0) + 1,
            },
        });
    }

    for (const row of commitmentRows) {
        if (commitmentsBreached >= maxActionsPerLoop) break;
        if (!row.org_id || row.status !== "open" || !row.due_at) continue;
        const overdueDays = diffDays(row.due_at);
        if (overdueDays === null || overdueDays < 0) continue;
        const metadata = normalizeMetadata(row.metadata);
        const account = accountByOrgId.get(row.org_id);
        const ownerId = account?.account_state.owner_id ?? operatorIds[0] ?? null;
        const escalatedSeverity = escalationSeverityForCommitment(account, row);
        const nextMetadata = {
            ...(metadata ?? {}),
            breach_count: Number(metadata?.breach_count ?? 0) + 1,
            breached_at: new Date().toISOString(),
            breached_by: "business_os_daily_autopilot",
        };
        const updatedCommitment = await updateCommitment(db, row.id, {
            status: "breached",
            severity: escalatedSeverity,
            owner_id: row.owner_id ?? ownerId ?? undefined,
            metadata: nextMetadata,
        });
        if (!updatedCommitment) continue;
        commitmentsBreached += 1;

        const existingWorkItem = activeWorkItemRows.find((item) => {
            if (item.org_id !== row.org_id) return false;
            const workMetadata = normalizeMetadata(item.metadata);
            return workMetadata?.commitment_id === row.id;
        }) ?? null;

        if (existingWorkItem) {
            await updateGodWorkItem(db, existingWorkItem.id, {
                owner_id: existingWorkItem.owner_id ?? ownerId ?? undefined,
                status: existingWorkItem.status === "snoozed" ? "open" : undefined,
                severity: escalatedSeverity,
                due_at: new Date().toISOString(),
                metadata: {
                    ...(normalizeMetadata(existingWorkItem.metadata) ?? {}),
                    escalation_count: Number((normalizeMetadata(existingWorkItem.metadata) ?? {}).escalation_count ?? 0) + 1,
                    last_escalated_at: new Date().toISOString(),
                },
            });
        } else {
            await createGodWorkItem(db, {
                kind: workItemKindForCommitmentEscalation(metadata),
                target_type: "organization",
                target_id: row.org_id,
                org_id: row.org_id,
                owner_id: ownerId,
                status: "open",
                severity: escalatedSeverity,
                title: row.title?.trim() ? `Escalate: ${row.title}` : "Escalate overdue commitment",
                summary: "A promised follow-up or commitment has been missed and needs immediate owner action.",
                due_at: new Date().toISOString(),
                metadata: {
                    source: "business_os_daily_autopilot",
                    autopilot_kind: "promise_watchdog_commitment",
                    commitment_id: row.id,
                },
            });
        }
        promiseEscalations += 1;
        await recordOrgActivityEvent(db, {
            org_id: row.org_id,
            actor_id: null,
            event_type: "autopilot_promise_escalated",
            title: "Autopilot escalated overdue commitment",
            detail: row.title?.trim() || "A commitment passed its due date and was escalated.",
            entity_type: "commitment",
            entity_id: row.id,
            source: "business_os_autopilot",
            metadata: {
                severity: escalatedSeverity,
                owner_id: ownerId,
                breach_count: nextMetadata.breach_count,
            },
        });
    }

    const now = Date.now();
    const staleSendReadySequences = sequenceRows.filter((row) => {
        if (!row.org_id || row.status !== "active" || row.last_sent_at) return false;
        const metadata = normalizeMetadata(row.metadata);
        if (metadata?.send_state !== "approved_pending_send") return false;
        const approvedAt = typeof metadata?.approved_at === "string" ? new Date(metadata.approved_at).getTime() : Number.NaN;
        if (!Number.isFinite(approvedAt)) return false;
        return approvedAt <= now - 86_400_000;
    });

    for (const row of staleSendReadySequences) {
        if (sendQueueEscalated >= maxActionsPerLoop) break;
        if (!row.org_id) continue;
        const metadata = normalizeMetadata(row.metadata) ?? {};
        const hasTrackedWorkItem = activeWorkItemRows.some((item) => {
            if (item.org_id !== row.org_id) return false;
            const workMetadata = normalizeMetadata(item.metadata);
            return workMetadata?.comms_sequence_id === row.id
                || (typeof metadata.approval_id === "string" && workMetadata?.approval_id === metadata.approval_id);
        });

        if (!hasTrackedWorkItem) {
            await createGodWorkItem(db, {
                kind: workItemKindForCommunicationSequenceType(parseSequenceType(row.sequence_type)),
                target_type: "organization",
                target_id: row.org_id,
                org_id: row.org_id,
                owner_id: null,
                status: "open",
                severity: parseSequenceType(row.sequence_type) === "incident_recovery" ? "critical" : "high",
                title: "Send approved customer communication",
                summary: typeof metadata.draft_reason === "string"
                    ? `${metadata.draft_reason}\n\nApproved communication has been waiting to send for over 24 hours.`
                    : "Approved communication has been waiting to send for over 24 hours.",
                due_at: new Date().toISOString(),
                metadata: {
                    source: "business_os_daily_autopilot",
                    autopilot_kind: "stale_send_queue",
                    comms_sequence_id: row.id,
                    approval_id: typeof metadata.approval_id === "string" ? metadata.approval_id : null,
                },
            });
        }

        await updateCommsSequence(db, row.id, {
            next_follow_up_at: new Date().toISOString(),
            metadata: {
                ...metadata,
                stale_detected_at: new Date().toISOString(),
                stale_detected_by: "business_os_daily_autopilot",
            },
        });
        sendQueueEscalated += 1;
        await recordOrgActivityEvent(db, {
            org_id: row.org_id,
            actor_id: null,
            event_type: "autopilot_send_queue_escalated",
            title: "Autopilot resurfaced send-ready communication",
            detail: typeof metadata.draft_title === "string"
                ? `${metadata.draft_title} has been approved but not sent for over 24 hours.`
                : "Approved customer communication has not been sent within 24 hours.",
            entity_type: "comms_sequence",
            entity_id: row.id,
            source: "business_os_autopilot",
            metadata: {
                approval_id: typeof metadata.approval_id === "string" ? metadata.approval_id : null,
                send_state: metadata.send_state,
            },
        });
    }

    for (const item of collectionsWorkItemRows) {
        if (collectionsAutoClosed >= maxActionsPerLoop) break;
        if (closedWorkItemIds.has(item.id)) continue;
        if (!item.org_id || !zeroOverdueOrgIds.has(item.org_id)) continue;
        const updated = await updateGodWorkItem(db, item.id, { status: "done" });
        if (!updated) continue;
        await recordWorkItemOutcome(db, {
            work_item_id: item.id,
            org_id: item.org_id,
            outcome_type: "payment_collected",
            note: "Auto-closed by Business OS daily autopilot after overdue balance cleared.",
            metadata: {
                source: "business_os_daily_autopilot",
                autopilot_kind: "collections_auto_close",
            },
            recorded_by: null,
        });
        outcomesRecorded += 1;
        collectionsAutoClosed += 1;
        closedWorkItemIds.add(item.id);
        await recordOrgActivityEvent(db, {
            org_id: item.org_id,
            actor_id: null,
            event_type: "autopilot_collections_work_item_closed",
            title: "Autopilot closed collections work item",
            detail: item.title ?? "Collections work item was marked done after payment recovery.",
            entity_type: "work_item",
            entity_id: item.id,
            source: "business_os_autopilot",
            metadata: {
                outcome_type: "payment_collected",
            },
        });
    }

    await annotateAutopilotEventsWithRunKey(db, {
        runKey,
        trigger,
        startedAt,
        orgIds,
    });

    const criticalLoad = commitmentsBreached + promiseEscalations + noResponseEscalated;
    if (criticalLoad > 0 || approvalsExpired > 0) {
        const lines: string[] = [];
        if (commitmentsBreached > 0) lines.push(`${commitmentsBreached} commitments breached`);
        if (promiseEscalations > 0) lines.push(`${promiseEscalations} promise escalations`);
        if (noResponseEscalated > 0) lines.push(`${noResponseEscalated} no-response escalations`);
        if (approvalsExpired > 0) lines.push(`${approvalsExpired} approvals expired`);

        await sendFounderCriticalAlertOnce({
            dedupeKey: `autopilot-critical:${runKey}`,
            minIntervalMinutes: 720,
            message: `Autopilot raised critical exceptions: ${lines.join(", ")}.\n\nOpen: tripbuilt.com/god/autopilot`,
            metadata: {
                run_key: runKey,
                trigger,
                commitments_breached: commitmentsBreached,
                promise_escalations: promiseEscalations,
                no_response_escalated: noResponseEscalated,
                approvals_expired: approvalsExpired,
            },
        });
    }

    return {
        generated_at: new Date().toISOString(),
        run_key: runKey,
        idempotency_key: idempotencyKey,
        ops_loop: opsLoop,
        owner_routes_applied: ownerRoutesApplied,
        activation_sequences_created: activationSequencesCreated,
        activation_sequences_completed: activationSequencesCompleted,
        activation_commitments_met: activationCommitmentsMet,
        collections_sequences_created: collectionsSequencesCreated,
        collections_sequences_completed: collectionsSequencesCompleted,
        send_queue_escalated: sendQueueEscalated,
        no_response_escalated: noResponseEscalated,
        approvals_surfaced: approvalsSurfaced,
        approvals_expired: approvalsExpired,
        commitments_breached: commitmentsBreached,
        promise_escalations: promiseEscalations,
        commitments_created: commitmentsCreated,
        collections_auto_closed: collectionsAutoClosed,
        outcomes_recorded: outcomesRecorded,
    };
}

export async function getBusinessOsAccountDetail(db: AdminClient, orgId: string): Promise<BusinessOsAccountDetail | null> {
    const payload = await buildBusinessOsPayload(db, "", { selected_org_id: orgId, limit: 80 });
    return payload.selected_account;
}

export async function draftAccountPlaybook(db: AdminClient, orgId: string): Promise<string> {
    const detail = await getBusinessOsAccountDetail(db, orgId);
    if (!detail) return "Account not found.";
    return detail.ai.playbook_draft;
}

export async function draftCustomerSaveOutreach(db: AdminClient, orgId: string): Promise<string> {
    const detail = await getBusinessOsAccountDetail(db, orgId);
    if (!detail) return "Account not found.";
    return detail.ai.customer_save_outreach;
}

export async function draftCollectionsSequence(db: AdminClient, orgId: string): Promise<string> {
    const detail = await getBusinessOsAccountDetail(db, orgId);
    if (!detail) return "Account not found.";
    return detail.ai.collections_sequence;
}

export async function draftRenewalStrategy(db: AdminClient, orgId: string): Promise<string> {
    const detail = await getBusinessOsAccountDetail(db, orgId);
    if (!detail) return "Account not found.";
    return detail.ai.renewal_strategy;
}

export async function draftGrowthExperiment(db: AdminClient, orgId: string): Promise<string> {
    const detail = await getBusinessOsAccountDetail(db, orgId);
    if (!detail) return "Account not found.";
    return detail.ai.growth_experiment;
}

export async function generateDailyOpsBrief(db: AdminClient, currentUserId: string): Promise<BusinessOsDailyBrief> {
    const payload = await buildBusinessOsPayload(db, currentUserId, { limit: 80 });
    return payload.ai_daily_brief;
}

export async function getAutopilotApprovals(
    db: AdminClient,
    currentUserId: string,
    options: { status?: AutopilotApprovalStatus | "all"; limit?: number } = {},
): Promise<AutopilotApproval[]> {
    const payload = await buildBusinessOsPayload(db, currentUserId, { limit: Math.max(60, options.limit ?? 120) });
    const approvals = await listAutopilotApprovalsInternal(db, payload.accounts, { includeResolved: true });
    const filtered = options.status && options.status !== "all"
        ? approvals.filter((approval) => approval.status === options.status)
        : approvals;
    return filtered.slice(0, Math.max(10, options.limit ?? 60));
}

export async function getAutopilotApprovalById(
    db: AdminClient,
    currentUserId: string,
    approvalId: string,
): Promise<AutopilotApproval | null> {
    const parsed = parseAutopilotApprovalId(approvalId);
    if (!parsed) return null;
    const approvals = await getAutopilotApprovals(db, currentUserId, { status: "all", limit: 180 });
    return approvals.find((approval) => approval.id === approvalId) ?? null;
}

export async function applyAutopilotApprovalDecision(
    db: AdminClient,
    options: {
        currentUserId: string;
        approvalId: string;
        decision: "approved" | "rejected";
    },
): Promise<{ approval: AutopilotApproval; work_item: GodWorkItem | null; comms_sequence: GodCommsSequence | null }> {
    const approval = await getAutopilotApprovalById(db, options.currentUserId, options.approvalId);
    if (!approval) throw new Error("Approval not found");
    if (approval.status !== "pending") {
        return { approval, work_item: null, comms_sequence: null };
    }

    let workItem: GodWorkItem | null = null;
    let commsSequence: GodCommsSequence | null = null;
    if (options.decision === "approved") {
        const existing = await loadGodWorkItems(db, {
            orgIds: [approval.org_id],
            status: "active",
            limit: 50,
        });
        let approvedDraftBody = typeof approval.payload.draft === "string" ? approval.payload.draft : null;
        const approvedDraftReason = typeof approval.payload.reason === "string" ? approval.payload.reason : approval.description;
        let approvedPaymentLinkUrl: string | null = null;
        let approvedPaymentLinkToken: string | null = null;
        let approvedPaymentLinkId: string | null = null;
        let approvedPaymentLinkStatus: string | null = null;
        workItem = existing.find((item) => {
            const metadata = normalizeMetadata(item.metadata);
            return typeof metadata?.approval_id === "string" && metadata.approval_id === approval.id;
        }) ?? null;

        if (approval.action_kind === "guarded_customer_communication") {
            const sequenceType = parseSequenceType(approval.payload.sequence_type);
            const channel = parseCommsChannel(approval.payload.channel);
            const dueAt = new Date(Date.now() + 86_400_000).toISOString();
            const accountDetail = await getAccountDetail(db, approval.org_id);
            const primaryContact = accountDetail?.members.find((member) => member.email && !member.is_suspended) ?? null;
            const existingSequences = await loadCommsSequences(db, approval.org_id, "all");
            const matchingSequence = existingSequences.find((sequence) =>
                sequence.sequence_type === sequenceType && sequence.status !== "completed",
            ) ?? null;

            if (sequenceType === "collections") {
                const overdueBalanceInr = Math.max(0, Number(accountDetail?.snapshot?.overdue_balance ?? 0));
                if (overdueBalanceInr > 0) {
                    try {
                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tripbuilt.com";
                        const link = await ensureCollectionsPaymentLink(db as never, {
                            organizationId: approval.org_id,
                            createdBy: options.currentUserId,
                            amountInr: overdueBalanceInr,
                            description: `Outstanding balance — ${accountDetail?.organization.name ?? approval.account_name}`,
                            clientName: primaryContact?.full_name ?? accountDetail?.organization.name ?? approval.account_name,
                            clientEmail: primaryContact?.email ?? undefined,
                            baseUrl,
                        });
                        approvedPaymentLinkUrl = link.paymentUrl;
                        approvedPaymentLinkToken = link.token;
                        approvedPaymentLinkId = link.id;
                        approvedPaymentLinkStatus = link.status;
                        approvedDraftBody = appendPaymentLinkToDraft(approvedDraftBody ?? approval.description, link.paymentUrl);
                    } catch {
                        // Do not block approval flow if link creation fails.
                        approvedPaymentLinkUrl = null;
                        approvedPaymentLinkToken = null;
                        approvedPaymentLinkId = null;
                        approvedPaymentLinkStatus = null;
                    }
                }
            }

            const metadata = {
                ...(normalizeMetadata(matchingSequence?.metadata) ?? {}),
                source: "business_os_autopilot_approval",
                approval_id: approval.id,
                action_kind: approval.action_kind,
                send_state: "approved_pending_send",
                approved_at: new Date().toISOString(),
                approved_by: options.currentUserId,
                draft_title: typeof approval.payload.title === "string" ? approval.payload.title : approval.title,
                draft_reason: approvedDraftReason,
                draft_body: approvedDraftBody ?? approval.description,
                primary_contact_name: primaryContact?.full_name ?? null,
                primary_contact_email: primaryContact?.email ?? null,
                payment_link_url: approvedPaymentLinkUrl,
                payment_link_token: approvedPaymentLinkToken,
                payment_link_id: approvedPaymentLinkId,
                payment_link_status: approvedPaymentLinkStatus,
            } satisfies Record<string, unknown>;

            commsSequence = matchingSequence
                ? await updateCommsSequence(db, matchingSequence.id, {
                    status: "active",
                    channel,
                    promise: typeof approval.payload.reason === "string" ? approval.payload.reason : approval.description,
                    next_follow_up_at: matchingSequence.next_follow_up_at ?? dueAt,
                    metadata,
                })
                : await createCommsSequence(db, {
                    org_id: approval.org_id,
                    owner_id: null,
                    sequence_type: sequenceType,
                    status: "active",
                    channel,
                    step_index: 0,
                    next_follow_up_at: dueAt,
                    promise: approvedDraftReason,
                    metadata,
                });
        }

        if (!workItem) {
            const dueAt = new Date(Date.now() + 86_400_000).toISOString();
            workItem = await createGodWorkItem(db, {
                kind: approval.suggested_work_item_kind,
                target_type: "organization",
                target_id: approval.org_id,
                org_id: approval.org_id,
                owner_id: null,
                status: "open",
                severity: approval.severity,
                title: approval.action_kind === "guarded_customer_communication"
                    ? `Send approved ${parseSequenceType(approval.payload.sequence_type).replaceAll("_", " ")} communication`
                    : approval.title,
                summary: approval.action_kind === "guarded_customer_communication"
                    ? [
                        approvedDraftReason,
                        commsSequence
                            ? `Comms sequence ${commsSequence.sequence_type.replaceAll("_", " ")} is queued and awaiting send.`
                            : "Approved customer communication should be sent and logged.",
                        approvedDraftBody ? `Draft:\n${approvedDraftBody}` : null,
                    ].filter(Boolean).join("\n\n")
                    : `${approval.description}\n\nRationale: ${approval.rationale}`,
                due_at: dueAt,
                metadata: {
                    source: "business_os_autopilot_approval",
                    approval_id: approval.id,
                    action_kind: approval.action_kind,
                    decision: "approved",
                    comms_sequence_id: commsSequence?.id ?? null,
                    send_state: approval.action_kind === "guarded_customer_communication" ? "approved_pending_send" : null,
                    payment_link_url: approvedPaymentLinkUrl,
                    payment_link_token: approvedPaymentLinkToken,
                    payment_link_id: approvedPaymentLinkId,
                    payment_link_status: approvedPaymentLinkStatus,
                },
            });
        }
    }

    await recordOrgActivityEvent(db, {
        org_id: approval.org_id,
        actor_id: options.currentUserId,
        event_type: options.decision === "approved" ? "autopilot_approval_approved" : "autopilot_approval_rejected",
        title: `${options.decision === "approved" ? "Approved" : "Rejected"} autopilot action`,
        detail: approval.title,
        entity_type: "organization",
        entity_id: approval.org_id,
        source: "business_os_autopilot_approval",
        metadata: {
            approval_id: approval.id,
            action_kind: approval.action_kind,
            work_item_id: workItem?.id ?? null,
            comms_sequence_id: commsSequence?.id ?? null,
        },
    });

    return {
        approval: {
            ...approval,
            status: options.decision,
            decided_at: new Date().toISOString(),
            decided_by: null,
        },
        work_item: workItem,
        comms_sequence: commsSequence,
    };
}

export async function buildAutopilotSnapshot(
    db: AdminClient,
    currentUserId: string,
): Promise<AutopilotSnapshot> {
    const payload = await buildBusinessOsPayload(db, currentUserId, { limit: 120 });
    const [approvals, activeWorkItems, commitmentCounts, commsFollowupCounts, sendQueueResult, runsResult, traceRowsResult] = await Promise.all([
        listAutopilotApprovalsInternal(db, payload.accounts, { includeResolved: true }),
        loadGodWorkItems(db, {
            orgIds: payload.accounts.map((account) => account.org_id),
            status: "active",
            limit: 300,
        }),
        buildCommitmentCounts(db, payload.accounts.map((account) => account.org_id)),
        buildCommsFollowupCounts(db, payload.accounts.map((account) => account.org_id)),
        db
            .from("god_comms_sequences")
            .select("org_id, metadata, last_sent_at")
            .in("org_id", payload.accounts.map((account) => account.org_id))
            .eq("status", "active"),
        db
            .from("platform_audit_log")
            .select("id, actor_id, action, details, created_at, profiles!platform_audit_log_actor_id_fkey(full_name, email)")
            .ilike("action", "Autopilot:%")
            .order("created_at", { ascending: false })
            .limit(12),
        db
            .from("org_activity_events")
            .select("id, org_id, event_type, title, detail, entity_type, entity_id, source, metadata, occurred_at")
            .in("org_id", payload.accounts.map((account) => account.org_id))
            .or("source.eq.business_os_autopilot,source.eq.business_os_autopilot_approval,source.eq.business_os_ops_loop")
            .order("occurred_at", { ascending: false })
            .limit(120),
    ]);

    const sendQueueRows = (sendQueueResult.data ?? []) as Array<{ org_id: string | null; metadata: unknown; last_sent_at: string | null }>;
    const sendQueueReady = sendQueueRows.filter((row) => {
        const metadata = normalizeMetadata(row.metadata);
        return metadata?.send_state === "approved_pending_send" && !row.last_sent_at;
    }).length;
    const sendQueueStale = sendQueueRows.filter((row) => {
        const metadata = normalizeMetadata(row.metadata);
        if (metadata?.send_state !== "approved_pending_send" || row.last_sent_at) return false;
        const approvedAt = typeof metadata?.approved_at === "string" ? new Date(metadata.approved_at).getTime() : Number.NaN;
        return Number.isFinite(approvedAt) && approvedAt <= Date.now() - 86_400_000;
    }).length;

    const autopilotWorkItems = activeWorkItems
        .filter((item) => {
            const metadata = normalizeMetadata(item.metadata);
            const source = typeof metadata?.source === "string" ? metadata.source : "";
            return source === "business_os_ops_loop"
                || source === "business_os_daily_autopilot"
                || source === "business_os_autopilot_approval"
                || typeof metadata?.autopilot_kind === "string";
        })
        .slice(0, 20);

    const promiseWatchdog = payload.accounts
        .map((account) => {
            const counts = commitmentCounts.get(account.org_id);
            const followups = commsFollowupCounts.get(account.org_id);
            const breachedCommitments = counts?.breached ?? 0;
            const overdueFollowups = followups?.overdue ?? 0;
            const reasons: string[] = [];
            if (breachedCommitments > 0) reasons.push(`${breachedCommitments} commitments breached or overdue`);
            if (overdueFollowups > 0) reasons.push(`${overdueFollowups} communication follow-ups overdue`);
            if (reasons.length === 0) return null;
            return {
                org_id: account.org_id,
                account_name: account.name,
                priority_score: account.priority_score,
                breached_commitments: breachedCommitments,
                overdue_followups: overdueFollowups,
                reasons,
            };
        })
        .filter(Boolean)
        .sort((left, right) =>
            (right?.breached_commitments ?? 0) - (left?.breached_commitments ?? 0)
            || (right?.overdue_followups ?? 0) - (left?.overdue_followups ?? 0)
            || (right?.priority_score ?? 0) - (left?.priority_score ?? 0),
        )
        .slice(0, 12) as AutopilotSnapshot["promise_watchdog"];

    const recentRuns = ((runsResult.data ?? []) as PlatformAuditAutopilotRow[]).map((row) => {
        const details = normalizeMetadata(row.details);
        const actor = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
            id: row.id,
            action: row.action?.trim() || "Autopilot run",
            summary: typeof details?.summary === "string" ? details.summary : "Autopilot run completed.",
            trigger: details?.trigger === "manual" || details?.trigger === "scheduled" ? details.trigger : "unknown",
            actor_name: actor?.full_name?.trim() || actor?.email?.trim() || null,
            created_at: row.created_at,
            run_key: typeof details?.run_key === "string" ? details.run_key : null,
            idempotency_key: typeof details?.idempotency_key === "string" ? details.idempotency_key : null,
            details,
        } satisfies AutopilotRun;
    });

    const dailyBriefHistory = recentRuns
        .filter((run) => typeof run.details?.brief_headline === "string")
        .map((run) => ({
            id: `brief:${run.id}`,
            headline: String(run.details?.brief_headline),
            summary: typeof run.details?.brief_summary === "string" ? run.details.brief_summary : run.summary,
            generated_at: run.created_at,
            trigger: run.trigger,
        }))
        .slice(0, 6);

    if (dailyBriefHistory.length === 0) {
        dailyBriefHistory.push({
            id: "brief:current",
            headline: payload.ai_daily_brief.headline,
            summary: payload.ai_daily_brief.summary,
            generated_at: payload.ai_daily_brief.generated_at,
            trigger: "unknown",
        });
    }

    const approvalWatchdog = {
        pending: approvals.filter((approval) => approval.status === "pending").length,
        stale_24h: approvals.filter((approval) =>
            approval.status === "pending" && (diffHours(approval.first_seen_at) ?? 0) >= 24,
        ).length,
        stale_48h: approvals.filter((approval) =>
            approval.status === "pending" && (diffHours(approval.first_seen_at) ?? 0) >= 48,
        ).length,
        blocked_accounts: new Set(
            approvals
                .filter((approval) => approval.status === "pending")
                .map((approval) => approval.org_id),
        ).size,
    };

    const accountNameByOrgId = new Map(payload.accounts.map((account) => [account.org_id, account.name]));
    const runTraces = ((traceRowsResult.data ?? []) as AutopilotTraceRow[])
        .map((row) => {
            const metadata = normalizeMetadata(row.metadata);
            const orgName = accountNameByOrgId.get(row.org_id) ?? null;
            return {
                id: row.id,
                run_key: typeof metadata?.run_key === "string" ? metadata.run_key : null,
                org_id: row.org_id,
                account_name: orgName,
                event_type: row.event_type,
                title: row.title,
                detail: row.detail,
                reason: deriveTraceReason(metadata, row.detail),
                source: row.source?.trim() || "business_os_autopilot",
                occurred_at: row.occurred_at,
                entity_type: row.entity_type,
                entity_id: row.entity_id,
                href: row.org_id
                    ? `/god/business-os?org=${encodeURIComponent(row.org_id)}`
                    : "/god/autopilot",
                metadata,
            } satisfies AutopilotTraceEntry;
        })
        .slice(0, 40);

    const roiScorecard = buildAutopilotRoiScorecard(recentRuns);
    const runHealth = buildAutopilotRunHealth({
        runs: recentRuns,
        accounts: payload.accounts,
        promiseWatchdogCount: promiseWatchdog.length,
        staleApprovals48h: approvalWatchdog.stale_48h,
        sendQueueStale,
    });
    const truthLock = buildAutopilotTruthLock({
        accounts: payload.accounts,
        approvals,
        runs: recentRuns,
        policyViolations: payload.policy_violations,
        promiseWatchdog,
    });

    const founderDigest = buildFounderDigest({
        generatedAt: payload.generated_at,
        founderMode: payload.founder_mode,
        dailyBrief: payload.ai_daily_brief,
        approvals,
        communicationDrafts: payload.communication_drafts,
        promiseWatchdog,
        recentRuns,
        sendQueueReady,
        sendQueueStale,
    });

    return {
        generated_at: new Date().toISOString(),
        daily_brief: payload.ai_daily_brief,
        founder_digest: founderDigest,
        daily_brief_history: dailyBriefHistory,
        summary: {
            pending_approvals: approvals.filter((approval) => approval.status === "pending").length,
            stale_approvals: approvalWatchdog.stale_24h,
            blocked_by_approval_accounts: approvalWatchdog.blocked_accounts,
            policy_violations: payload.policy_violations.length,
            autopilot_work_items: autopilotWorkItems.length,
            promise_watchdog_accounts: promiseWatchdog.length,
            recent_runs: recentRuns.length,
            communication_drafts: payload.communication_drafts.length,
            renewal_candidates: payload.founder_mode.revenue_moves.filter((item) => item.title === "Prepare renewal motion").length,
            expansion_candidates: payload.founder_mode.revenue_moves.filter((item) => item.title === "Review expansion leverage").length,
        },
        approval_watchdog: approvalWatchdog,
        founder_mode: payload.founder_mode,
        loops: [
            {
                id: "ai_coo",
                label: "AI COO",
                count: payload.accounts.filter((account) => account.priority_score >= 60).length,
                detail: "Ranks business risk, ownership gaps, and stale review posture.",
            },
            {
                id: "ai_customer_success",
                label: "AI Customer Success",
                count: payload.accounts.filter((account) => account.activation_risk).length,
                detail: "Tracks activation stalls, low adoption, and churn-save follow-up.",
            },
            {
                id: "ai_revenue_ops",
                label: "AI Revenue Ops",
                count: payload.accounts.filter((account) => account.snapshot.overdue_balance > 0 || account.snapshot.expiring_proposal_count > 0).length,
                detail: "Covers overdue invoices, expiring proposals, renewals, and expansion risk.",
            },
            {
                id: "ai_promise_watchdog",
                label: "AI Promise Watchdog",
                count: promiseWatchdog.length,
                detail: "Detects breached commitments and overdue communication follow-ups.",
            },
            {
                id: "ai_production_operator",
                label: "AI Production Operator",
                count: payload.accounts.filter((account) =>
                    account.snapshot.proposal_draft_count > 0
                    && account.snapshot.proposal_sent_count === 0,
                ).length,
                detail: "Flags drafted-but-unsent proposals and slow proposal throughput.",
            },
        ],
        recent_runs: recentRuns,
        approvals,
        policy_violations: payload.policy_violations,
        playbook_learning: payload.playbook_learning,
        autopilot_work_items: autopilotWorkItems,
        communication_drafts: payload.communication_drafts,
        renewal_candidates: payload.founder_mode.revenue_moves.filter((item) => item.title === "Prepare renewal motion"),
        expansion_candidates: payload.founder_mode.revenue_moves.filter((item) => item.title === "Review expansion leverage"),
        promise_watchdog: promiseWatchdog,
        ops_loop_preview: payload.ops_loop_preview,
        roi_scorecard: roiScorecard,
        run_health: runHealth,
        run_traces: runTraces,
        truth_lock: truthLock,
    };
}

function buildSuggestedAccountStatePatch(account: BusinessOsAccountRow): Partial<GodAccountState> {
    const desiredActivationStage = resolveActivationStage(account.account_state, account.snapshot, account.created_at);
    let desiredLifecycleStage: AccountLifecycleStage = "active";
    if (desiredActivationStage === "signed_up" || desiredActivationStage === "onboarding") desiredLifecycleStage = "onboarding";
    else if (desiredActivationStage === "at_risk" || account.snapshot.fatal_error_count > 0 || account.snapshot.overdue_balance > 0) desiredLifecycleStage = "at_risk";
    else if (account.snapshot.urgent_support_count > 0 || account.snapshot.expiring_proposal_count > 0) desiredLifecycleStage = "watch";

    const desiredHealthBand: AccountHealthBand = account.snapshot.fatal_error_count > 0
        || account.snapshot.overdue_balance > 0
        || account.snapshot.urgent_support_count > 0
        || desiredActivationStage === "at_risk"
        ? "at_risk"
        : account.snapshot.open_support_count > 0 || account.snapshot.expiring_proposal_count > 0
            ? "watch"
            : "healthy";

    const healthScore = Math.max(
        5,
        Math.min(
            95,
            88
                - account.snapshot.fatal_error_count * 20
                - account.snapshot.urgent_support_count * 8
                - Math.min(25, Math.round(account.snapshot.overdue_balance / 20_000) * 5)
                - (account.activation_risk ? 12 : 0)
                + (account.effective_activation_stage === "expansion" ? 6 : 0),
        ),
    );

    const patch: Partial<GodAccountState> = {};
    if (account.account_state.activation_stage !== desiredActivationStage) patch.activation_stage = desiredActivationStage;
    if (account.account_state.lifecycle_stage !== desiredLifecycleStage) patch.lifecycle_stage = desiredLifecycleStage;
    if (account.account_state.health_band !== desiredHealthBand) patch.health_band = desiredHealthBand;
    if (account.account_state.health_score !== healthScore) patch.health_score = healthScore;
    if (account.account_state.first_proposal_sent_at !== account.snapshot.first_proposal_sent_at) {
        patch.first_proposal_sent_at = account.snapshot.first_proposal_sent_at;
    }
    if (account.account_state.last_proposal_sent_at !== account.snapshot.last_proposal_sent_at) {
        patch.last_proposal_sent_at = account.snapshot.last_proposal_sent_at;
    }
    return patch;
}

function hasActiveSequence(sequences: GodCommsSequence[], sequenceType: CommsSequenceType): boolean {
    return sequences.some((sequence) => sequence.sequence_type === sequenceType && sequence.status !== "completed");
}

function buildEventSequenceCandidates(account: BusinessOsAccountRow): Array<{
    sequence_type: CommsSequenceType;
    channel: CommsChannel;
    promise: string;
    autopilot_kind: string;
}> {
    const candidates: Array<{ sequence_type: CommsSequenceType; channel: CommsChannel; promise: string; autopilot_kind: string }> = [];
    if (account.activation_risk && account.snapshot.proposal_sent_count === 0) {
        candidates.push({
            sequence_type: "activation_rescue",
            channel: account.snapshot.active_whatsapp_session_count > 0 ? "whatsapp" : "mixed",
            promise: "Send first proposal and confirm follow-up owner/date.",
            autopilot_kind: "activation_rescue",
        });
    }
    if (account.snapshot.proposal_viewed_count > 0 && account.snapshot.proposal_approved_count === 0) {
        candidates.push({
            sequence_type: "viewed_not_approved",
            channel: "mixed",
            promise: "Follow up on viewed proposal and capture blocker or decision date.",
            autopilot_kind: "viewed_not_approved",
        });
    }
    if (account.snapshot.overdue_balance > 0) {
        candidates.push({
            sequence_type: "collections",
            channel: "email",
            promise: `Recover ${account.snapshot.overdue_balance_label} overdue balance and confirm payment date.`,
            autopilot_kind: "collections_dunning",
        });
    }
    if (account.snapshot.expiring_proposal_count > 0) {
        candidates.push({
            sequence_type: "renewal_prep",
            channel: "email",
            promise: "Rescue the expiring proposal, confirm the decision owner, and lock a reply window before expiry.",
            autopilot_kind: "proposal_expiry_rescue",
        });
    }
    const renewalDays = daysUntilDate(account.account_state.renewal_at);
    if (renewalDays !== null && renewalDays <= 30) {
        candidates.push({
            sequence_type: "renewal_prep",
            channel: "email",
            promise: "Confirm renewal owner and commercial review date.",
            autopilot_kind: "renewal_owner_alignment",
        });
    }
    if (account.snapshot.fatal_error_count > 0 || account.snapshot.urgent_support_count > 0) {
        candidates.push({
            sequence_type: "incident_recovery",
            channel: "mixed",
            promise: account.snapshot.overdue_balance > 0 || account.snapshot.expiring_proposal_count > 0
                ? "Share a recovery update and pair it with a same-day commercial save follow-up."
                : "Share a direct recovery update and next ETA with the account.",
            autopilot_kind: account.snapshot.overdue_balance > 0 || account.snapshot.expiring_proposal_count > 0
                ? "customer_save_motion"
                : "incident_recovery",
        });
    }
    return candidates;
}

export async function runBusinessOsEventAutomation(
    db: AdminClient,
    options: {
        orgId: string;
        currentUserId: string | null;
        trigger: BusinessOsEventAutomationResult["trigger"];
        maxWorkItems?: number;
    },
): Promise<BusinessOsEventAutomationResult | null> {
    const detail = await getAccountDetail(db, options.orgId);
    if (!detail) return null;

    let account = enrichAccountRow({
        org_id: detail.organization.id,
        name: detail.organization.name,
        slug: detail.organization.slug,
        tier: detail.organization.tier,
        created_at: detail.organization.created_at,
        account_state: detail.account_state,
        snapshot: detail.snapshot,
        open_work_item_count: detail.work_items.length,
        risk: "healthy",
    });

    const notes: string[] = [];
    const statePatch = options.trigger === "account_state_updated"
        ? {
            ...(account.account_state.first_proposal_sent_at !== account.snapshot.first_proposal_sent_at
                ? { first_proposal_sent_at: account.snapshot.first_proposal_sent_at }
                : {}),
            ...(account.account_state.last_proposal_sent_at !== account.snapshot.last_proposal_sent_at
                ? { last_proposal_sent_at: account.snapshot.last_proposal_sent_at }
                : {}),
        }
        : buildSuggestedAccountStatePatch(account);
    let stateUpdated = false;
    if (Object.keys(statePatch).length > 0) {
        const nextState = await upsertGodAccountState(db, options.orgId, statePatch);
        stateUpdated = true;
        notes.push("Account state synced from live account signals.");
        await recordOrgActivityEvent(db, {
            org_id: options.orgId,
            actor_id: options.currentUserId,
            event_type: "autopilot_state_synced",
            title: "Autopilot synced account state",
            detail: "Lifecycle, activation, or health state changed based on current account signals.",
            entity_type: "organization",
            entity_id: options.orgId,
            source: "business_os_autopilot",
            metadata: { patch: statePatch, trigger: options.trigger },
        });
        account = enrichAccountRow({
            org_id: detail.organization.id,
            name: detail.organization.name,
            slug: detail.organization.slug,
            tier: detail.organization.tier,
            created_at: detail.organization.created_at,
            account_state: nextState,
            snapshot: detail.snapshot,
            open_work_item_count: detail.work_items.length,
            risk: "healthy",
        });
    }

    const [operatorsResult, sequences, commitments, activeWorkItems, commitmentCounts, commsCounts] = await Promise.all([
        db.from("profiles").select("id").eq("role", "super_admin").order("full_name", { ascending: true }).limit(10),
        loadCommsSequences(db, options.orgId, "all"),
        loadCommitments(db, options.orgId, "all"),
        loadGodWorkItems(db, { orgIds: [options.orgId], status: "active", limit: 50 }),
        buildCommitmentCounts(db, [options.orgId]),
        buildCommsFollowupCounts(db, [options.orgId]),
    ]);
    const operatorIds = ((operatorsResult.data ?? []) as Array<{ id: string }>).map((row) => row.id);

    let ownerRouted = false;
    let sequencesCreated = 0;
    let sequencesCompleted = 0;
    let commitmentsMet = 0;
    let commitmentsBreached = 0;
    let promiseEscalations = 0;
    let workItemsCreated = 0;
    let workItemsClosed = 0;
    let noResponseEscalated = 0;
    let repliesProcessed = 0;
    let outcomesRecorded = 0;

    const routedOwnerId = selectAutoOwnerId(account, operatorIds, options.currentUserId, options.trigger);
    if (routedOwnerId) {
        ownerRouted = await applyAutoOwnerRouting(db, {
            account,
            ownerId: routedOwnerId,
            actorId: options.currentUserId,
            trigger: options.trigger,
        });
        if (ownerRouted) {
            account = {
                ...account,
                account_state: {
                    ...account.account_state,
                    owner_id: routedOwnerId,
                },
            };
            notes.push("Auto owner routing applied.");
        }
    }

    for (const candidate of buildEventSequenceCandidates(account)) {
        if (hasActiveSequence(sequences, candidate.sequence_type)) continue;
        const sequence = await createCommsSequence(db, {
            org_id: options.orgId,
            owner_id: account.account_state.owner_id,
            sequence_type: candidate.sequence_type,
            channel: candidate.channel,
            status: "active",
            next_follow_up_at: account.account_state.next_action_due_at ?? new Date(Date.now() + 86_400_000).toISOString(),
            promise: candidate.promise,
            metadata: {
                source: "business_os_event_autopilot",
                trigger: options.trigger,
                autopilot_kind: candidate.autopilot_kind,
            },
        });
        sequences.push(sequence);
        sequencesCreated += 1;
        notes.push(`Opened ${candidate.sequence_type.replaceAll("_", " ")} sequence.`);
        await recordOrgActivityEvent(db, {
            org_id: options.orgId,
            actor_id: null,
            event_type: "autopilot_event_sequence_created",
            title: `Autopilot opened ${candidate.sequence_type.replaceAll("_", " ")} sequence`,
            detail: candidate.promise,
            entity_type: "comms_sequence",
            entity_id: sequence.id,
            source: "business_os_autopilot",
            metadata: { trigger: options.trigger, sequence_type: candidate.sequence_type, autopilot_kind: candidate.autopilot_kind },
        });
    }

    for (const sequence of sequences) {
        const metadata = normalizeMetadata(sequence.metadata);
        const autopilotKind = typeof metadata?.autopilot_kind === "string" ? metadata.autopilot_kind : "";
        const shouldComplete = (
            (sequence.sequence_type === "activation_rescue" && account.snapshot.proposal_sent_count > 0)
            || (sequence.sequence_type === "viewed_not_approved" && (account.snapshot.proposal_approved_count > 0 || account.snapshot.proposal_won_count > 0))
            || (sequence.sequence_type === "collections" && account.snapshot.overdue_balance <= 0)
            || (sequence.sequence_type === "renewal_prep" && autopilotKind === "proposal_expiry_rescue" && (
                account.snapshot.expiring_proposal_count === 0
                || account.snapshot.proposal_approved_count > 0
                || account.snapshot.proposal_won_count > 0
                || account.snapshot.trip_count > 0
            ))
            || (sequence.sequence_type === "incident_recovery" && account.snapshot.fatal_error_count === 0 && account.snapshot.urgent_support_count === 0)
        );
        if (!shouldComplete || sequence.status === "completed") continue;
        const updated = await updateCommsSequence(db, sequence.id, {
            status: "completed",
            next_follow_up_at: null,
        });
        if (!updated) continue;
        sequencesCompleted += 1;

        const linkedWorkItem = activeWorkItems.find((item) => {
            const workMetadata = normalizeMetadata(item.metadata);
            return item.status !== "done" && workMetadata?.comms_sequence_id === sequence.id;
        }) ?? null;
        if (linkedWorkItem) {
            await updateGodWorkItem(db, linkedWorkItem.id, { status: "done" });
            await recordWorkItemOutcome(db, {
                work_item_id: linkedWorkItem.id,
                org_id: options.orgId,
                outcome_type: outcomeTypeForSequenceCompletion(sequence.sequence_type),
                note: `Auto-closed by Business OS event autopilot after ${sequence.sequence_type.replaceAll("_", " ")} sequence resolved.`,
                metadata: {
                    source: "business_os_event_autopilot",
                    trigger: options.trigger,
                    sequence_id: sequence.id,
                    sequence_type: sequence.sequence_type,
                },
                recorded_by: null,
            });
            workItemsClosed += 1;
            outcomesRecorded += 1;
            linkedWorkItem.status = "done";
        }
        await recordOrgActivityEvent(db, {
            org_id: options.orgId,
            actor_id: null,
            event_type: "autopilot_event_sequence_completed",
            title: `Autopilot completed ${sequence.sequence_type.replaceAll("_", " ")} sequence`,
            detail: "The monitored condition resolved and the sequence was closed automatically.",
            entity_type: "comms_sequence",
            entity_id: sequence.id,
            source: "business_os_autopilot",
            metadata: { trigger: options.trigger, sequence_type: sequence.sequence_type },
        });
    }

    const repliedSequences = sequences.filter((sequence) => {
        if (sequence.status === "completed") return false;
        const metadata = normalizeMetadata(sequence.metadata);
        return metadata?.send_state === "replied" && typeof metadata?.reply_processed_at !== "string";
    });

    for (const sequence of repliedSequences) {
        const metadata = normalizeMetadata(sequence.metadata) ?? {};
        const disposition = parseReplyDisposition(metadata.reply_disposition);
        const updated = await updateCommsSequence(db, sequence.id, {
            status: "completed",
            next_follow_up_at: null,
            metadata: {
                ...metadata,
                reply_processed_at: new Date().toISOString(),
                reply_processed_by: "business_os_event_autopilot",
                trigger: options.trigger,
            },
        });
        if (!updated) continue;
        repliesProcessed += 1;

        const linkedWorkItem = activeWorkItems.find((item) => {
            const workMetadata = normalizeMetadata(item.metadata);
            return item.status !== "done"
                && (workMetadata?.comms_sequence_id === sequence.id
                    || (typeof metadata.approval_id === "string" && workMetadata?.approval_id === metadata.approval_id));
        }) ?? null;
        if (linkedWorkItem) {
            await updateGodWorkItem(db, linkedWorkItem.id, { status: "done" });
            await recordWorkItemOutcome(db, {
                work_item_id: linkedWorkItem.id,
                org_id: options.orgId,
                outcome_type: outcomeTypeForReplyDisposition(disposition),
                note: "Auto-recorded from customer reply captured on the communication sequence.",
                metadata: {
                    source: "business_os_event_autopilot",
                    trigger: options.trigger,
                    sequence_id: sequence.id,
                    sequence_type: sequence.sequence_type,
                    reply_disposition: disposition,
                },
                recorded_by: null,
            });
            workItemsClosed += 1;
            outcomesRecorded += 1;
            linkedWorkItem.status = "done";
        }

        const followup = followupWorkItemForReply(sequence.sequence_type, disposition);
        if (followup) {
            const replySummary = typeof metadata.reply_summary === "string" ? metadata.reply_summary : "Customer replied and needs follow-up.";
            const workItem = await createGodWorkItem(db, {
                kind: followup.kind,
                target_type: "organization",
                target_id: options.orgId,
                org_id: options.orgId,
                owner_id: account.account_state.owner_id,
                status: "open",
                severity: followup.severity,
                title: followup.title,
                summary: `${replySummary}\n\nDisposition: ${disposition.replaceAll("_", " ")}.`,
                due_at: new Date().toISOString(),
                metadata: {
                    source: "business_os_event_autopilot",
                    trigger: options.trigger,
                    autopilot_kind: "customer_reply_followup",
                    comms_sequence_id: sequence.id,
                    reply_disposition: disposition,
                },
            });
            activeWorkItems.push(workItem);
            workItemsCreated += 1;
        }

        notes.push(`Processed customer reply for ${sequence.sequence_type.replaceAll("_", " ")}.`);
        await recordOrgActivityEvent(db, {
            org_id: options.orgId,
            actor_id: null,
            event_type: "autopilot_event_reply_processed",
            title: "Autopilot processed customer reply",
            detail: typeof metadata.reply_summary === "string" ? metadata.reply_summary : updated.promise ?? "Customer reply captured.",
            entity_type: "comms_sequence",
            entity_id: updated.id,
            source: "business_os_autopilot",
            metadata: {
                trigger: options.trigger,
                sequence_type: updated.sequence_type,
                reply_disposition: disposition,
            },
        });
    }

    for (const commitment of commitments) {
        const metadata = normalizeMetadata(commitment.metadata);
        const autopilotKind = typeof metadata?.autopilot_kind === "string" ? metadata.autopilot_kind : "";
        if (autopilotKind !== "first_proposal_activation" || commitment.status !== "open" || account.snapshot.proposal_sent_count === 0) continue;
        const updated = await updateCommitment(db, commitment.id, {
            status: "met",
            metadata: {
                ...(metadata ?? {}),
                source: "business_os_event_autopilot",
                trigger: options.trigger,
            },
        });
        if (!updated) continue;
        commitmentsMet += 1;

        const linkedWorkItem = activeWorkItems.find((item) => {
            const workMetadata = normalizeMetadata(item.metadata);
            return item.status !== "done" && workMetadata?.commitment_id === commitment.id;
        }) ?? null;
        if (linkedWorkItem) {
            await updateGodWorkItem(db, linkedWorkItem.id, { status: "done" });
            await recordWorkItemOutcome(db, {
                work_item_id: linkedWorkItem.id,
                org_id: options.orgId,
                outcome_type: "proposal_sent",
                note: "Auto-closed by Business OS event autopilot after the first proposal commitment was met.",
                metadata: {
                    source: "business_os_event_autopilot",
                    trigger: options.trigger,
                    commitment_id: commitment.id,
                },
                recorded_by: null,
            });
            workItemsClosed += 1;
            outcomesRecorded += 1;
            linkedWorkItem.status = "done";
        }
        await recordOrgActivityEvent(db, {
            org_id: options.orgId,
            actor_id: null,
            event_type: "autopilot_event_commitment_met",
            title: "Autopilot marked commitment met",
            detail: updated.title,
            entity_type: "commitment",
            entity_id: updated.id,
            source: "business_os_autopilot",
            metadata: { trigger: options.trigger },
        });
    }

    for (const commitment of commitments) {
        if (commitment.status !== "open" || !commitment.due_at) continue;
        const overdueDays = diffDays(commitment.due_at);
        if (overdueDays === null || overdueDays < 0) continue;
        const metadata = normalizeMetadata(commitment.metadata);
        const escalatedSeverity = escalationSeverityForCommitment(account, {
            due_at: commitment.due_at,
            severity: commitment.severity,
        });
        const updated = await updateCommitment(db, commitment.id, {
            status: "breached",
            severity: escalatedSeverity,
            owner_id: commitment.owner_id ?? account.account_state.owner_id ?? undefined,
            metadata: {
                ...(metadata ?? {}),
                breach_count: Number(metadata?.breach_count ?? 0) + 1,
                breached_at: new Date().toISOString(),
                breached_by: "business_os_event_autopilot",
                trigger: options.trigger,
            },
        });
        if (!updated) continue;
        commitmentsBreached += 1;

        const existingPromiseItem = activeWorkItems.find((item) => {
            const workMetadata = normalizeMetadata(item.metadata);
            return workMetadata?.commitment_id === commitment.id;
        }) ?? null;
        if (existingPromiseItem) {
            await updateGodWorkItem(db, existingPromiseItem.id, {
                owner_id: existingPromiseItem.owner_id ?? account.account_state.owner_id ?? undefined,
                status: existingPromiseItem.status === "snoozed" ? "open" : undefined,
                severity: escalatedSeverity,
                due_at: new Date().toISOString(),
                metadata: {
                    ...(normalizeMetadata(existingPromiseItem.metadata) ?? {}),
                    escalation_count: Number((normalizeMetadata(existingPromiseItem.metadata) ?? {}).escalation_count ?? 0) + 1,
                    last_escalated_at: new Date().toISOString(),
                },
            });
        } else {
            const workItem = await createGodWorkItem(db, {
                kind: workItemKindForCommitmentEscalation(metadata),
                target_type: "organization",
                target_id: options.orgId,
                org_id: options.orgId,
                owner_id: account.account_state.owner_id,
                status: "open",
                severity: escalatedSeverity,
                title: updated.title?.trim() ? `Escalate: ${updated.title}` : "Escalate overdue commitment",
                summary: "A promise or due commitment is overdue and has been escalated by Business OS.",
                due_at: new Date().toISOString(),
                metadata: {
                    source: "business_os_event_autopilot",
                    trigger: options.trigger,
                    autopilot_kind: "promise_watchdog_commitment",
                    commitment_id: updated.id,
                },
            });
            activeWorkItems.push(workItem);
            workItemsCreated += 1;
        }
        promiseEscalations += 1;
        notes.push(`Escalated overdue commitment: ${updated.title}.`);
        await recordOrgActivityEvent(db, {
            org_id: options.orgId,
            actor_id: null,
            event_type: "autopilot_event_promise_escalated",
            title: "Autopilot escalated overdue commitment",
            detail: updated.title,
            entity_type: "commitment",
            entity_id: updated.id,
            source: "business_os_autopilot",
            metadata: { trigger: options.trigger, severity: escalatedSeverity },
        });
    }

    const overdueSentSequences = sequences.filter((sequence) => {
        if (sequence.status !== "active" || !sequence.last_sent_at || !sequence.next_follow_up_at) return false;
        const metadata = normalizeMetadata(sequence.metadata);
        if (metadata?.send_state !== "sent") return false;
        const nextFollowUpAt = new Date(sequence.next_follow_up_at).getTime();
        if (!Number.isFinite(nextFollowUpAt) || nextFollowUpAt > Date.now()) return false;
        const lastEscalatedAt = typeof metadata?.last_no_response_escalated_at === "string"
            ? new Date(metadata.last_no_response_escalated_at).getTime()
            : Number.NaN;
        return !Number.isFinite(lastEscalatedAt) || lastEscalatedAt <= Date.now() - 86_400_000;
    });

    for (const sequence of overdueSentSequences) {
        const metadata = normalizeMetadata(sequence.metadata) ?? {};
        const existingWorkItem = activeWorkItems.find((item) => {
            const workMetadata = normalizeMetadata(item.metadata);
            return item.status !== "done"
                && (workMetadata?.comms_sequence_id === sequence.id
                    || (workMetadata?.autopilot_kind === "no_response_followup" && workMetadata?.sequence_type === sequence.sequence_type));
        }) ?? null;
        if (existingWorkItem) {
            await updateGodWorkItem(db, existingWorkItem.id, {
                owner_id: existingWorkItem.owner_id ?? account.account_state.owner_id ?? undefined,
                status: existingWorkItem.status === "snoozed" ? "open" : undefined,
                severity: sequence.sequence_type === "incident_recovery" ? "critical" : "high",
                due_at: new Date().toISOString(),
                metadata: {
                    ...(normalizeMetadata(existingWorkItem.metadata) ?? {}),
                    autopilot_kind: "no_response_followup",
                    comms_sequence_id: sequence.id,
                    sequence_type: sequence.sequence_type,
                    no_response_count: Number(metadata.no_response_count ?? 0) + 1,
                    last_no_response_escalated_at: new Date().toISOString(),
                },
            });
        } else {
            const workItem = await createGodWorkItem(db, {
                kind: workItemKindForCommunicationSequenceType(sequence.sequence_type),
                target_type: "organization",
                target_id: options.orgId,
                org_id: options.orgId,
                owner_id: account.account_state.owner_id,
                status: "open",
                severity: sequence.sequence_type === "incident_recovery" ? "critical" : "high",
                title: `No response after ${sequence.sequence_type.replaceAll("_", " ")} follow-up`,
                summary: typeof metadata.draft_reason === "string"
                    ? `${metadata.draft_reason}\n\nCustomer follow-up was sent, but no response was recorded by the due date.`
                    : "Customer follow-up was sent, but no response was recorded by the due date.",
                due_at: new Date().toISOString(),
                metadata: {
                    source: "business_os_event_autopilot",
                    trigger: options.trigger,
                    autopilot_kind: "no_response_followup",
                    comms_sequence_id: sequence.id,
                    sequence_type: sequence.sequence_type,
                    no_response_count: Number(metadata.no_response_count ?? 0) + 1,
                },
            });
            activeWorkItems.push(workItem);
            workItemsCreated += 1;
        }
        await updateCommsSequence(db, sequence.id, {
            next_follow_up_at: new Date(Date.now() + 86_400_000).toISOString(),
            metadata: {
                ...metadata,
                no_response_count: Number(metadata.no_response_count ?? 0) + 1,
                no_response_detected_at: new Date().toISOString(),
                last_no_response_escalated_at: new Date().toISOString(),
                no_response_escalated_by: "business_os_event_autopilot",
                trigger: options.trigger,
            },
        });
        noResponseEscalated += 1;
        notes.push(`Escalated no-response follow-up for ${sequence.sequence_type.replaceAll("_", " ")}.`);
        await recordOrgActivityEvent(db, {
            org_id: options.orgId,
            actor_id: null,
            event_type: "autopilot_event_no_response_escalated",
            title: "Autopilot escalated no-response follow-up",
            detail: typeof metadata.draft_title === "string"
                ? `${metadata.draft_title} was sent but has no recorded response yet.`
                : "A sent communication has not received a recorded response by the follow-up date.",
            entity_type: "comms_sequence",
            entity_id: sequence.id,
            source: "business_os_autopilot",
            metadata: { trigger: options.trigger, sequence_type: sequence.sequence_type },
        });
    }

    const existingAutomationKeys = new Set(
        activeWorkItems
            .map((item) => {
                const metadata = normalizeMetadata(item.metadata);
                return typeof metadata?.automation_key === "string" ? metadata.automation_key : null;
            })
            .filter(Boolean) as string[],
    );
    const suggestions = buildOpsLoopSuggestions(
        account,
        existingAutomationKeys,
        commitmentCounts.get(options.orgId)?.breached ?? 0,
        commsCounts.get(options.orgId)?.overdue ?? 0,
    ).slice(0, Math.max(1, options.maxWorkItems ?? 4));

    for (const suggestion of suggestions) {
        const workItem = await createGodWorkItem(db, {
            kind: suggestion.kind,
            target_type: "organization",
            target_id: suggestion.target_id,
            org_id: suggestion.org_id,
            owner_id: account.account_state.owner_id,
            status: "open",
            severity: suggestion.severity,
            title: suggestion.title,
            summary: suggestion.summary,
            due_at: suggestion.due_at,
            metadata: {
                automation_key: suggestion.automation_key,
                automation_reason: suggestion.reason,
                source: "business_os_event_autopilot",
                trigger: options.trigger,
            },
        });
        workItemsCreated += 1;
        notes.push(`Opened ${suggestion.kind.replaceAll("_", " ")} work item.`);
        await recordOrgActivityEvent(db, {
            org_id: options.orgId,
            actor_id: null,
            event_type: "autopilot_event_work_item_created",
            title: suggestion.title,
            detail: suggestion.summary,
            entity_type: "work_item",
            entity_id: workItem.id,
            source: "business_os_autopilot",
            metadata: { trigger: options.trigger, automation_key: suggestion.automation_key },
        });
    }

    for (const workItem of activeWorkItems) {
        const metadata = normalizeMetadata(workItem.metadata);
        const source = typeof metadata?.source === "string" ? metadata.source : "";
        const isAutopilotManaged = source === "business_os_event_autopilot"
            || source === "business_os_daily_autopilot"
            || source === "business_os_ops_loop"
            || source === "business_os_autopilot_approval";
        if (!isAutopilotManaged) continue;
        const shouldClose = (
            (workItem.kind === "collections" && account.snapshot.overdue_balance <= 0)
            || (workItem.kind === "incident_followup" && account.snapshot.fatal_error_count === 0)
            || (workItem.kind === "support_escalation" && account.snapshot.urgent_support_count === 0)
        );
        if (!shouldClose) continue;
        const updated = await updateGodWorkItem(db, workItem.id, { status: "done" });
        if (!updated) continue;
        workItemsClosed += 1;
        await recordWorkItemOutcome(db, {
            work_item_id: workItem.id,
            org_id: options.orgId,
            outcome_type: outcomeTypeForWorkItemClosure(workItem.kind),
            note: `Auto-closed by Business OS event autopilot after ${workItem.kind.replaceAll("_", " ")} condition resolved.`,
            metadata: {
                source: "business_os_event_autopilot",
                trigger: options.trigger,
                work_item_kind: workItem.kind,
            },
            recorded_by: null,
        });
        outcomesRecorded += 1;
        workItem.status = "done";
        await recordOrgActivityEvent(db, {
            org_id: options.orgId,
            actor_id: null,
            event_type: "autopilot_event_work_item_closed",
            title: `Autopilot closed ${workItem.kind.replaceAll("_", " ")} work item`,
            detail: updated.title,
            entity_type: "work_item",
            entity_id: updated.id,
            source: "business_os_autopilot",
            metadata: { trigger: options.trigger, work_item_kind: workItem.kind },
        });
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const criticalSignals: string[] = [];
    if (account.snapshot.fatal_error_count > 0) {
        criticalSignals.push(`${account.snapshot.fatal_error_count} fatal incidents`);
    }
    if (account.snapshot.urgent_support_count > 0) {
        criticalSignals.push(`${account.snapshot.urgent_support_count} urgent support tickets`);
    }
    if (account.snapshot.overdue_balance >= 100000 && account.account_state.health_band === "at_risk") {
        criticalSignals.push(`overdue balance ${account.snapshot.overdue_balance_label} with at-risk health`);
    }
    if (!account.account_state.owner_id && account.priority_score >= 85) {
        criticalSignals.push("high-risk account is still unowned");
    }
    if (criticalSignals.length > 0) {
        await sendFounderCriticalAlertOnce({
            dedupeKey: `event-critical:${options.orgId}:${todayKey}`,
            minIntervalMinutes: 240,
            message: `${account.name} needs immediate founder attention: ${criticalSignals.join(", ")}.\n\nOpen: tripbuilt.com/god/business-os`,
            metadata: {
                org_id: options.orgId,
                trigger: options.trigger,
                priority_score: account.priority_score,
                fatal_error_count: account.snapshot.fatal_error_count,
                urgent_support_count: account.snapshot.urgent_support_count,
                overdue_balance: account.snapshot.overdue_balance,
                owner_id: account.account_state.owner_id,
            },
        });
    }

    return {
        generated_at: new Date().toISOString(),
        org_id: options.orgId,
        trigger: options.trigger,
        state_updated: stateUpdated,
        owner_routed: ownerRouted,
        work_items_created: workItemsCreated,
        work_items_closed: workItemsClosed,
        sequences_created: sequencesCreated,
        sequences_completed: sequencesCompleted,
        commitments_met: commitmentsMet,
        commitments_breached: commitmentsBreached,
        promise_escalations: promiseEscalations,
        no_response_escalated: noResponseEscalated,
        replies_processed: repliesProcessed,
        outcomes_recorded: outcomesRecorded,
        notes,
    };
}

export async function proposeAccountStateUpdate(db: AdminClient, orgId: string): Promise<{ title: string; reasoning: string; actionPayload: string; riskLevel: "medium" | "high" | "critical" }> {
    const detail = await getBusinessOsAccountDetail(db, orgId);
    if (!detail) {
        return {
            title: "Account state proposal",
            reasoning: "Account not found.",
            actionPayload: `account_state_update|org:${orgId}`,
            riskLevel: "medium",
        };
    }

    const riskLevel: "medium" | "high" | "critical" = detail.snapshot.fatal_error_count > 0
        ? "critical"
        : detail.snapshot.overdue_balance > 0 || detail.snapshot.urgent_support_count > 0
            ? "high"
            : "medium";

    return {
        title: `Update account state: ${detail.organization.name}`,
        reasoning: `${detail.ai.recommended_next_step}\n\nRationale: ${detail.ai.rationale}`,
        actionPayload: `account_state_update|org:${orgId}|activation:${detail.account_state.activation_stage}|health:${detail.account_state.health_band}`,
        riskLevel,
    };
}

export async function proposeWorkItemBatch(db: AdminClient, limit = 5): Promise<{ title: string; reasoning: string; actionPayload: string; riskLevel: "medium" | "high" | "critical" }> {
    const payload = await buildBusinessOsPayload(db, "", { limit: Math.max(20, limit * 3) });
    const targets = payload.accounts.slice(0, limit);
    const riskLevel: "medium" | "high" | "critical" = targets.some((account) => account.snapshot.fatal_error_count > 0)
        ? "critical"
        : targets.some((account) => account.snapshot.overdue_balance > 0 || account.snapshot.urgent_support_count > 0)
            ? "high"
            : "medium";

    return {
        title: "Create Business OS follow-up batch",
        reasoning: targets.map((account) => `${account.name}: ${account.priority_reasons.slice(0, 2).join(", ") || "review posture"}`).join("\n"),
        actionPayload: `work_item_batch|orgs:${targets.map((account) => account.org_id).join(",")}`,
        riskLevel,
    };
}
