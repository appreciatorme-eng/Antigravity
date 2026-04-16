import type { SupabaseClient } from "@supabase/supabase-js";
import {
    buildBusinessImpact,
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
    type GodWorkItem,
} from "@/lib/platform/god-accounts";

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
    kind: "signup" | "proposal" | "invoice" | "support" | "incident" | "announcement" | "admin_action";
    title: string;
    detail: string;
    at: string | null;
    href: string | null;
    tone: "neutral" | "warning" | "danger";
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
    effective_activation_stage: AccountActivationStage;
};

export type BusinessOsAccountDetail = AccountDetail & {
    account_state: GodAccountState;
    business_impact: ReturnType<typeof buildBusinessImpact>;
    priority_score: number;
    priority_reasons: string[];
    activation_risk: boolean;
    activation_risk_reasons: string[];
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
    };
    ai_daily_brief: BusinessOsDailyBrief;
    accounts: BusinessOsAccountRow[];
    selected_org_id: string | null;
    selected_account: BusinessOsAccountDetail | null;
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
    if (snapshot.ai_requests_mtd > 0 && snapshot.proposal_sent_count === 0) {
        reasons.push("AI usage started before proposal activation");
    }
    if (snapshot.proposal_sent_count > 0 && snapshot.trip_count === 0 && (snapshot.days_since_last_proposal_sent ?? 0) >= 7) {
        reasons.push("Proposal sent but no trip conversion signal");
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

function buildWhatChanged(account: AccountRow, activationRiskReasons: string[], effectiveActivationStage: AccountActivationStage): string {
    const highlights: string[] = [];
    if (account.snapshot.latest_org_activity) highlights.push(`Latest activity on ${new Date(account.snapshot.latest_org_activity).toLocaleDateString()}`);
    if (account.snapshot.overdue_invoice_count > 0) highlights.push(`${account.snapshot.overdue_invoice_count} overdue invoices`);
    if (account.snapshot.expiring_proposal_count > 0) highlights.push(`${account.snapshot.expiring_proposal_count} proposals expiring within 72h`);
    if (account.snapshot.urgent_support_count > 0) highlights.push(`${account.snapshot.urgent_support_count} urgent support tickets`);
    if (account.snapshot.fatal_error_count > 0) highlights.push(`${account.snapshot.fatal_error_count} fatal incidents`);
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

async function loadAccountContext(db: AdminClient, detail: AccountDetail): Promise<{
    recentSupportTickets: BusinessOsAccountDetail["recent_support_tickets"];
    recentIncidents: BusinessOsAccountDetail["recent_incidents"];
    timeline: BusinessOsTimelineItem[];
}> {
    const orgId = detail.organization.id;
    const [supportResult, incidentResult, announcementResult, auditResult] = await Promise.all([
        db.from("support_tickets").select("id, title, priority, status, created_at, updated_at").eq("organization_id", orgId).order("updated_at", { ascending: false }).limit(5),
        db.from("error_events").select("id, title, level, status, created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
        db.from("platform_announcements").select("id, title, target_segment, target_org_ids, sent_at, status").in("status", ["sent", "scheduled"]).order("sent_at", { ascending: false }).limit(8),
        db.from("platform_audit_log").select("id, action, category, target_type, target_id, created_at").eq("target_type", "organization").eq("target_id", orgId).order("created_at", { ascending: false }).limit(6),
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
        ...detail.expiring_proposals.map((proposal) => ({
            id: `proposal:${proposal.id}`,
            kind: "proposal" as const,
            title: normalizeText(proposal.title, "Proposal"),
            detail: `${proposal.value_label} • status ${normalizeText(proposal.status, "unknown")}`,
            at: proposal.expires_at,
            href: `/god/collections?proposal=${proposal.id}`,
            tone: (proposal.status && normalizeKey(proposal.status) === "draft" ? "neutral" : "warning") as BusinessOsTimelineItem["tone"],
        })),
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

function enrichAccountRow(account: AccountRow): BusinessOsAccountRow {
    const effectiveActivationStage = resolveActivationStage(account.account_state, account.snapshot, account.created_at);
    const activationRiskReasons = getActivationRiskReasons(account.snapshot, account.created_at);
    const priority = getPriorityScore(account, activationRiskReasons, effectiveActivationStage);
    return {
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
        effective_activation_stage: effectiveActivationStage,
    };
}

function buildDailyBrief(accounts: BusinessOsAccountRow[], currentUserId: string): BusinessOsDailyBrief {
    const highestRisk = accounts.slice(0, 5);
    const unownedHighRisk = accounts.filter((account) => !account.account_state.owner_id && account.priority_score >= 60).length;
    const dueToday = accounts.filter((account) => account.account_state.next_action_due_at && diffDays(new Date().toISOString(), account.account_state.next_action_due_at) === 0).length;
    const myQueue = accounts.filter((account) => account.account_state.owner_id === currentUserId && account.priority_score > 0).length;

    return {
        headline: highestRisk.length > 0
            ? `${highestRisk[0].name} is the highest-risk account to handle first.`
            : "No critical accounts surfaced in the current Business OS filters.",
        summary: highestRisk.length > 0
            ? `The current operating load is concentrated in ${highestRisk.filter((account) => account.priority_score >= 60).length} high-risk accounts, with ${unownedHighRisk} of them still unowned.`
            : "Current posture is stable. Focus on moving low-risk accounts toward stronger activation and repeat usage.",
        queue_focus: `My queue has ${myQueue} owned accounts with real priority. ${dueToday} accounts have next actions due today.`,
        priorities: highestRisk.map((account) => `${account.name}: ${account.priority_reasons.slice(0, 3).join(", ") || "review operating posture"}`),
        gaps: [
            unownedHighRisk > 0 ? `${unownedHighRisk} high-risk accounts do not have an owner.` : null,
            accounts.some((account) => account.activation_risk) ? `${accounts.filter((account) => account.activation_risk).length} accounts are still stuck before healthy activation.` : null,
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
            const context = await loadAccountContext(db, detail);
            selectedAccount = {
                ...detail,
                account_state: matchingRow.account_state,
                business_impact: buildBusinessImpact(matchingRow.account_state, detail.snapshot),
                priority_score: matchingRow.priority_score,
                priority_reasons: matchingRow.priority_reasons,
                activation_risk: matchingRow.activation_risk,
                activation_risk_reasons: matchingRow.activation_risk_reasons,
                timeline: context.timeline,
                recent_support_tickets: context.recentSupportTickets,
                recent_incidents: context.recentIncidents,
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
        },
        ai_daily_brief: buildDailyBrief(enriched, currentUserId),
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
