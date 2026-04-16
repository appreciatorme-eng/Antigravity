import type { SupabaseClient } from "@supabase/supabase-js";
import {
    buildBusinessImpact,
    createGodWorkItem,
    getAccountDetail,
    listAccounts,
    loadGodWorkItems,
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
import { buildWorkItemOutcomeLearning, type WorkItemOutcomeLearning } from "@/lib/platform/work-item-outcomes";
import {
    buildCommitmentCounts,
    loadCommsSequences,
    loadCommitments,
    type GodCommitment,
    type GodCommsSequence,
} from "@/lib/platform/business-comms";

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
    playbook_draft: string;
    customer_save_outreach: string;
    collections_sequence: string;
    renewal_strategy: string;
    growth_experiment: string;
    growth_opportunities: string[];
    safe_actions: BusinessOsAiAction[];
    guarded_actions: BusinessOsAiAction[];
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
    };
    ai_daily_brief: BusinessOsDailyBrief;
    playbook_learning: WorkItemOutcomeLearning[];
    policy_violations: BusinessOsPolicyViolation[];
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

function normalizeText(value: string | null | undefined, fallback = "Unknown"): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : fallback;
}

function normalizeKey(value: string | null | undefined): string {
    return (value || "").trim().toLowerCase();
}

function diffDays(fromIso: string | null | undefined, toIso: string | null | undefined = new Date().toISOString()): number | null {
    if (!fromIso || !toIso) return null;
    const from = new Date(fromIso).getTime();
    const to = new Date(toIso).getTime();
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
    return Math.max(0, Math.round((to - from) / 86_400_000));
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

function buildAiRecommendation(account: AccountRow, effectiveActivationStage: AccountActivationStage, activationRiskReasons: string[]): BusinessOsAiRecommendation {
    const { nextStep, rationale, playbook } = buildRecommendedNextStep(account, activationRiskReasons, effectiveActivationStage);
    return {
        what_changed: buildWhatChanged(account, activationRiskReasons, effectiveActivationStage),
        recommended_next_step: nextStep,
        rationale,
        playbook_draft: `Recommended playbook: ${playbook.replaceAll("_", " ")}.\n\nOwner: ${account.account_state.owner_id ? "existing owner" : "assign operator"}\nDue: ${account.account_state.next_action_due_at ? "use current due date" : "set due date within 24 hours"}\n\nExecution focus: ${nextStep}`,
        customer_save_outreach: buildCustomerSaveOutreach(account),
        collections_sequence: buildCollectionsSequence(account),
        renewal_strategy: buildRenewalStrategy(account, effectiveActivationStage),
        growth_experiment: buildGrowthExperiment(account),
        growth_opportunities: buildGrowthOpportunities(account, effectiveActivationStage),
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

function buildOpsLoopSuggestions(
    account: BusinessOsAccountRow,
    existingKeys: Set<string>,
    breachedCommitmentCount = 0,
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

    return suggestions;
}

function buildPolicyViolations(
    account: BusinessOsAccountRow,
    activeKinds: Set<GodWorkItemKind>,
    breachedCommitmentCount = 0,
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
    const commitmentCounts = await buildCommitmentCounts(db, enriched.map((account) => account.org_id));
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
    ));
    const policyViolations = enriched
        .flatMap((account) => buildPolicyViolations(
            account,
            activeKindsByOrg.get(account.org_id) ?? new Set<GodWorkItemKind>(),
            commitmentCounts.get(account.org_id)?.breached ?? 0,
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
        },
        ai_daily_brief: buildDailyBrief(enriched, currentUserId),
        playbook_learning: playbookLearning,
        policy_violations: policyViolations,
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
