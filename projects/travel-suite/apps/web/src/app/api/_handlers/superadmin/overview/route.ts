// GET /api/superadmin/overview — superadmin operating view with real business and risk signals.

import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import {
    checkDatabaseRuntime,
    checkFirebaseFcmRuntime,
    checkPosthogRuntime,
    checkRedisRuntime,
    checkSentryRuntime,
    checkWhatsappRuntime,
} from "@/lib/platform/runtime-probes";
import { buildGodDataQuality, pickGodKpiContracts } from "@/lib/platform/god-kpi";
import { listAccounts, loadGodWorkItems, type GodWorkItem } from "@/lib/platform/god-accounts";

type Severity = "critical" | "high" | "medium";
type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
type OverviewRange = "7d" | "30d" | "90d";
type OrganizationRow = {
    id: string;
    name: string | null;
    subscription_tier: string | null;
    created_at: string | null;
};

type SupportTicketRow = {
    id: string;
    title: string | null;
    priority: string | null;
    status: string | null;
    created_at: string | null;
    profiles: {
        full_name?: string | null;
        email?: string | null;
        organization_id?: string | null;
    } | null;
};

type ErrorEventRow = {
    id: string;
    title: string | null;
    level: string | null;
    status: string | null;
    created_at: string | null;
    first_seen_at: string | null;
    event_count: number | null;
    user_count: number | null;
};

type InvoiceRow = {
    id: string;
    invoice_number: string | null;
    status: string | null;
    due_date: string | null;
    balance_amount: number | null;
    total_amount: number | null;
    organization_id: string | null;
};

type ProposalRow = {
    id: string;
    title: string | null;
    status: string | null;
    expires_at: string | null;
    total_price: number | null;
    client_selected_price: number | null;
    organization_id: string | null;
};

type AiUsageRow = {
    organization_id: string | null;
    estimated_cost_usd: number | null;
    ai_requests: number | null;
};

type AuditLogRow = {
    id: string;
    action: string | null;
    category: string | null;
    created_at: string | null;
    target_type: string | null;
    target_id: string | null;
    details: Record<string, unknown> | null;
    profiles: {
        full_name?: string | null;
        email?: string | null;
    } | null;
};

let redisClient: Redis | null | undefined;
const RANGE_DAYS: Record<OverviewRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

function getRedisClient(): Redis | null {
    if (redisClient !== undefined) return redisClient;
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!url || !token) {
        redisClient = null;
        return null;
    }
    redisClient = new Redis({ url, token });
    return redisClient;
}

function startOfUtcDay(offsetDays = 0): Date {
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    date.setUTCDate(date.getUTCDate() + offsetDays);
    return date;
}

function startOfUtcMonth(offsetMonths = 0): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1));
}

function daysAgo(days: number): string {
    return new Date(Date.now() - days * 86_400_000).toISOString();
}

function normalizeOverviewRange(value: string | null): OverviewRange {
    if (value === "7d" || value === "90d") return value;
    return "30d";
}

function withRange(href: string, range: OverviewRange): string {
    const separator = href.includes("?") ? "&" : "?";
    return `${href}${separator}range=${range}`;
}

function safeNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function pctChange(current: number, previous: number): number | null {
    if (current === 0 && previous === 0) return null;
    if (previous === 0) return 100;
    return Number((((current - previous) / previous) * 100).toFixed(1));
}

function timeAgo(iso: string | null | undefined): string {
    if (!iso) return "just now";
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60_000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function proposalValue(row: ProposalRow): number {
    return safeNumber(row.client_selected_price ?? row.total_price);
}

function daysOverdueLabel(dueDate: string | null): string {
    if (!dueDate) return "Due date missing";
    const dueAt = new Date(dueDate).getTime();
    const days = Math.max(1, Math.floor((Date.now() - dueAt) / 86_400_000));
    return `${days}d overdue`;
}

function expiresInLabel(expiresAt: string | null): string {
    if (!expiresAt) return "No expiry";
    const remainingHours = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 3_600_000));
    if (remainingHours < 24) return `${remainingHours}h left`;
    return `${Math.ceil(remainingHours / 24)}d left`;
}

function asCurrencyParts(amount: number, currency: "inr" | "usd" = "inr"): { value: number; formatted: string } {
    if (currency === "usd") {
        return { value: Number(amount.toFixed(2)), formatted: `$${amount.toFixed(2)}` };
    }
    const rounded = Math.round(amount);
    if (rounded >= 100000) {
        return { value: rounded, formatted: `₹${(rounded / 100000).toFixed(1)}L` };
    }
    if (rounded >= 1000) {
        return { value: rounded, formatted: `₹${(rounded / 1000).toFixed(1)}k` };
    }
    return { value: rounded, formatted: `₹${rounded.toLocaleString("en-IN")}` };
}

function severityForTicket(priority: string | null): Severity {
    if (priority === "urgent") return "critical";
    if (priority === "high") return "high";
    return "medium";
}

function severityForError(level: string | null): Severity {
    if (level === "fatal") return "critical";
    if (level === "error") return "high";
    return "medium";
}

function workItemHref(item: GodWorkItem, organizationName?: string): string {
    switch (item.target_type) {
        case "invoice":
            return `/god/collections?tab=invoices&invoiceId=${encodeURIComponent(item.target_id)}`;
        case "proposal":
            return `/god/collections?tab=proposals&proposalId=${encodeURIComponent(item.target_id)}`;
        case "ticket":
            return `/god/support?status=open&ticketId=${encodeURIComponent(item.target_id)}`;
        case "error_event":
            return `/god/errors?status=open&eventId=${encodeURIComponent(item.target_id)}`;
        case "organization":
            return `/god/directory?search=${encodeURIComponent(organizationName ?? item.target_id)}`;
        default:
            return "/god";
    }
}

function workItemActionLabel(item: GodWorkItem): string {
    switch (item.target_type) {
        case "invoice":
        case "proposal":
            return "Open revenue item";
        case "ticket":
            return "Open ticket";
        case "error_event":
            return "Open incident";
        case "organization":
            return "Open account";
        default:
            return "Open item";
    }
}

function workItemBuckets(
    item: GodWorkItem,
    currentUserId: string,
    revenueRisk: boolean,
    churnRisk: boolean,
    todayEndMs: number,
): string[] {
    const buckets = ["all"];
    if (item.owner_id === currentUserId) buckets.push("my-queue");
    if (!item.owner_id) buckets.push("unowned");
    if (item.due_at) {
        const dueMs = new Date(item.due_at).getTime();
        if (Number.isFinite(dueMs) && dueMs <= todayEndMs) buckets.push("due-today");
    }
    if (revenueRisk || item.kind === "collections" || item.kind === "renewal") buckets.push("revenue-risk");
    if (churnRisk || item.kind === "churn_risk" || item.kind === "support_escalation" || item.kind === "incident_followup") {
        buckets.push("churn-risk");
    }
    return Array.from(new Set(buckets));
}

async function readRedisSpendFor(date: string): Promise<number> {
    const redis = getRedisClient();
    if (!redis) return 0;
    const categories = ["amadeus", "image_search", "ai_image", "ai_poster", "ai_text"];
    try {
        const values = await redis.mget<string[]>(
            ...categories.map((category) => `cost:daily:${category}:${date}`),
        );
        return values.reduce((sum, entry) => sum + safeNumber(entry), 0);
    } catch {
        return 0;
    }
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- overview aggregates several cross-table joins not represented in generated types
    const db = auth.adminClient as any;
    const selectedRange = normalizeOverviewRange(request.nextUrl.searchParams.get("range"));
    const rangeDays = RANGE_DAYS[selectedRange];

    const now = new Date();
    const todayStart = startOfUtcDay();
    const yesterdayStart = startOfUtcDay(-1);
    const tomorrowStart = startOfUtcDay(1);
    const weekStart = startOfUtcDay(7);
    const monthStart = startOfUtcMonth();
    const rangeStart = daysAgo(rangeDays - 1);
    const previousRangeStart = daysAgo((rangeDays * 2) - 1);
    const oneWeekAgo = daysAgo(7);
    const threeDaysOut = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    try {
        const [
            totalUsersResult,
            totalOrgsResult,
            totalOpenTicketsResult,
            totalFatalErrorsResult,
            totalOpenErrorsResult,
            resolvedThisWeekResult,
            activeSubscriptionsResult,
            signupTrendResult,
            todayUsersResult,
            yesterdayUsersResult,
            todayOrgsResult,
            yesterdayOrgsResult,
            todayTripsResult,
            yesterdayTripsResult,
            todayTicketsResult,
            yesterdayTicketsResult,
            todayFatalErrorsResult,
            yesterdayFatalErrorsResult,
            allOrganizationsResult,
            supportRowsResult,
            errorRowsResult,
            invoiceRowsResult,
            currentProposalRowsResult,
            previousProposalRowsResult,
            expiringProposalRowsResult,
            aiUsageRowsResult,
            auditLogRowsResult,
            pendingNotificationCountResult,
            oldestPendingNotificationResult,
            failedNotificationsResult,
            deadLetterResult,
            socialQueueResult,
            pdfQueueResult,
            databaseHealth,
            redisHealth,
            fcmHealth,
            whatsappHealth,
            sentryHealth,
            posthogHealth,
            todaySpendUsd,
            yesterdaySpendUsd,
            onboardingStartedResult,
            onboardingCompletedResult,
        ] = await Promise.all([
            db.from("profiles").select("id", { count: "exact", head: true }),
            db.from("organizations").select("id", { count: "exact", head: true }),
            db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
            db.from("error_events").select("id", { count: "exact", head: true }).eq("status", "open").eq("level", "fatal"),
            db.from("error_events").select("id", { count: "exact", head: true }).eq("status", "open"),
            db.from("error_events").select("id", { count: "exact", head: true }).eq("status", "resolved").gte("resolved_at", oneWeekAgo),
            db.from("subscriptions").select("amount").eq("status", "active"),
            db.from("profiles").select("created_at").gte("created_at", rangeStart).order("created_at", { ascending: true }),
            db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
            db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
            db.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
            db.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
            db.from("trips").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
            db.from("trips").select("id", { count: "exact", head: true }).gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
            db.from("support_tickets").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
            db.from("support_tickets").select("id", { count: "exact", head: true }).gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
            db.from("error_events").select("id", { count: "exact", head: true }).eq("level", "fatal").gte("created_at", todayStart.toISOString()),
            db.from("error_events").select("id", { count: "exact", head: true }).eq("level", "fatal").gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
            db.from("organizations").select("id, name, subscription_tier, created_at"),
            db
                .from("support_tickets")
                .select("id, title, priority, status, created_at, profiles!support_tickets_user_id_fkey(full_name, email, organization_id)")
                .in("status", ["open", "in_progress"])
                .order("created_at", { ascending: true })
                .limit(80),
            db
                .from("error_events")
                .select("id, title, level, status, created_at, first_seen_at, event_count, user_count")
                .in("status", ["open", "investigating"])
                .order("created_at", { ascending: false })
                .limit(80),
            db
                .from("invoices")
                .select("id, invoice_number, status, due_date, balance_amount, total_amount, organization_id")
                .gt("balance_amount", 0)
                .in("status", ["issued", "partially_paid", "overdue"])
                .limit(600),
            db
                .from("proposals")
                .select("id, status, total_price, client_selected_price")
                .gte("created_at", rangeStart)
                .limit(600),
            db
                .from("proposals")
                .select("id, status, total_price, client_selected_price")
                .gte("created_at", previousRangeStart)
                .lt("created_at", rangeStart)
                .limit(600),
            db
                .from("proposals")
                .select("id, title, status, expires_at, total_price, client_selected_price, organization_id")
                .not("expires_at", "is", null)
                .gte("expires_at", now.toISOString())
                .lte("expires_at", threeDaysOut)
                .limit(40),
            db
                .from("organization_ai_usage")
                .select("organization_id, estimated_cost_usd, ai_requests")
                .eq("month_start", monthStart.toISOString().slice(0, 10)),
            db
                .from("platform_audit_log")
                .select("id, action, category, created_at, target_type, target_id, details, profiles!platform_audit_log_actor_id_fkey(full_name, email)")
                .order("created_at", { ascending: false })
                .limit(8),
            db
                .from("notification_queue")
                .select("id", { count: "exact", head: true })
                .eq("status", "pending"),
            db
                .from("notification_queue")
                .select("created_at")
                .eq("status", "pending")
                .order("created_at", { ascending: true })
                .limit(1),
            db.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
            db.from("notification_dead_letters").select("id", { count: "exact", head: true }),
            db.from("social_post_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
            db.from("pdf_extraction_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
            checkDatabaseRuntime(auth.adminClient),
            checkRedisRuntime(),
            checkFirebaseFcmRuntime(),
            checkWhatsappRuntime(),
            checkSentryRuntime(),
            checkPosthogRuntime(),
            readRedisSpendFor(todayStart.toISOString().slice(0, 10)),
            readRedisSpendFor(yesterdayStart.toISOString().slice(0, 10)),
            db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").gt("onboarding_step", 0),
            db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").gte("onboarding_step", 5),
        ]);

        const organizations = (allOrganizationsResult.data ?? []) as OrganizationRow[];
        const organizationMap = new Map(
            organizations.map((organization) => [
                organization.id,
                {
                    name: organization.name?.trim() || "Unknown org",
                    tier: organization.subscription_tier ?? "free",
                    created_at: organization.created_at,
                },
            ]),
        );

        const signupByDay: Record<string, number> = {};
        for (const row of signupTrendResult.data ?? []) {
            const day = String(row.created_at).slice(0, 10);
            signupByDay[day] = (signupByDay[day] ?? 0) + 1;
        }

        const signupTrend = Array.from({ length: rangeDays }, (_, index) => {
            const date = new Date(Date.now() - (rangeDays - 1 - index) * 86_400_000);
            const key = date.toISOString().slice(0, 10);
            return { date: key, signups: signupByDay[key] ?? 0 };
        });

        const signupSparkline = signupTrend.slice(-7).map((entry) => entry.signups);
        const activeMrr = (activeSubscriptionsResult.data ?? []).reduce(
            (sum: number, row: { amount?: number | string | null }) => sum + safeNumber(row.amount),
            0,
        );

        const invoiceRows = (invoiceRowsResult.data ?? []) as InvoiceRow[];
        const overdueInvoices = invoiceRows.filter((row) => {
            if (!row.due_date) return false;
            return new Date(row.due_date).getTime() < tomorrowStart.getTime();
        });
        const dueThisWeekInvoices = invoiceRows.filter((row) => {
            if (!row.due_date) return false;
            const dueAt = new Date(row.due_date).getTime();
            return dueAt >= tomorrowStart.getTime() && dueAt < weekStart.getTime();
        });
        const overdueInvoiceAmount = overdueInvoices.reduce(
            (sum, row) => sum + safeNumber(row.balance_amount ?? row.total_amount),
            0,
        );
        const dueThisWeekAmount = dueThisWeekInvoices.reduce(
            (sum, row) => sum + safeNumber(row.balance_amount ?? row.total_amount),
            0,
        );

        const currentProposalRows = (currentProposalRowsResult.data ?? []) as ProposalRow[];
        const previousProposalRows = (previousProposalRowsResult.data ?? []) as ProposalRow[];
        const expiringProposalRows = ((expiringProposalRowsResult.data ?? []) as ProposalRow[]).sort((left, right) => {
            return new Date(left.expires_at ?? 0).getTime() - new Date(right.expires_at ?? 0).getTime();
        });
        const wonStatuses = new Set(["approved", "partially_paid", "fully_paid"]);
        const proposalConversion = currentProposalRows.length > 0
            ? Number(((currentProposalRows.filter((row) => wonStatuses.has(row.status ?? "")).length / currentProposalRows.length) * 100).toFixed(1))
            : null;
        const previousProposalConversion = previousProposalRows.length > 0
            ? Number(((previousProposalRows.filter((row) => wonStatuses.has(row.status ?? "")).length / previousProposalRows.length) * 100).toFixed(1))
            : null;
        const proposalConversionDelta = proposalConversion !== null && previousProposalConversion !== null
            ? Number((proposalConversion - previousProposalConversion).toFixed(1))
            : null;
        const expiringProposalValue = expiringProposalRows.reduce((sum, row) => sum + proposalValue(row), 0);

        const supportRows = ((supportRowsResult.data ?? []) as SupportTicketRow[]).sort((left, right) => {
            const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 };
            const leftRank = priorityRank[left.priority as keyof typeof priorityRank] ?? 4;
            const rightRank = priorityRank[right.priority as keyof typeof priorityRank] ?? 4;
            if (leftRank !== rightRank) return leftRank - rightRank;
            return new Date(left.created_at ?? 0).getTime() - new Date(right.created_at ?? 0).getTime();
        });

        const supportLoad = new Map<string, { org_id: string; name: string; open: number; urgent: number; oldest_at: string | null }>();
        for (const ticket of supportRows) {
            const orgId = ticket.profiles?.organization_id;
            if (!orgId) continue;
            const organization = organizationMap.get(orgId);
            const current = supportLoad.get(orgId) ?? {
                org_id: orgId,
                name: organization?.name ?? "Unknown org",
                open: 0,
                urgent: 0,
                oldest_at: ticket.created_at,
            };
            current.open += 1;
            if (ticket.priority === "urgent" || ticket.priority === "high") current.urgent += 1;
            if (!current.oldest_at || new Date(ticket.created_at ?? 0).getTime() < new Date(current.oldest_at).getTime()) {
                current.oldest_at = ticket.created_at;
            }
            supportLoad.set(orgId, current);
        }

        const errorRows = ((errorRowsResult.data ?? []) as ErrorEventRow[]).sort((left, right) => {
            const levelRank = { fatal: 0, error: 1, warning: 2, info: 3, debug: 4 };
            const leftRank = levelRank[left.level as keyof typeof levelRank] ?? 5;
            const rightRank = levelRank[right.level as keyof typeof levelRank] ?? 5;
            if (leftRank !== rightRank) return leftRank - rightRank;
            return new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime();
        });

        const aiUsageRows = (aiUsageRowsResult.data ?? []) as AiUsageRow[];
        const aiByOrg = new Map<string, { org_id: string; name: string; tier: string; spend_usd: number; requests: number }>();
        let aiSpendMtd = 0;
        for (const row of aiUsageRows) {
            const orgId = row.organization_id;
            if (!orgId) continue;
            const organization = organizationMap.get(orgId);
            const current = aiByOrg.get(orgId) ?? {
                org_id: orgId,
                name: organization?.name ?? "Unknown org",
                tier: organization?.tier ?? "free",
                spend_usd: 0,
                requests: 0,
            };
            current.spend_usd += safeNumber(row.estimated_cost_usd);
            current.requests += safeNumber(row.ai_requests);
            aiSpendMtd += safeNumber(row.estimated_cost_usd);
            aiByOrg.set(orgId, current);
        }

        const topAiSpendOrgs = Array.from(aiByOrg.values())
            .sort((left, right) => right.spend_usd - left.spend_usd)
            .slice(0, 5);

        const overdueByOrg = new Map<string, { overdue_amount: number; overdue_invoices: number }>();
        for (const invoice of overdueInvoices) {
            if (!invoice.organization_id) continue;
            const current = overdueByOrg.get(invoice.organization_id) ?? { overdue_amount: 0, overdue_invoices: 0 };
            current.overdue_amount += safeNumber(invoice.balance_amount ?? invoice.total_amount);
            current.overdue_invoices += 1;
            overdueByOrg.set(invoice.organization_id, current);
        }

        const expiringProposalByOrg = new Map<string, { expiring_proposals: number; expiring_value: number }>();
        for (const proposal of expiringProposalRows) {
            if (!proposal.organization_id) continue;
            const current = expiringProposalByOrg.get(proposal.organization_id) ?? { expiring_proposals: 0, expiring_value: 0 };
            current.expiring_proposals += 1;
            current.expiring_value += proposalValue(proposal);
            expiringProposalByOrg.set(proposal.organization_id, current);
        }

        const accountListResult = await listAccounts(db, { risk: "all", limit: 5000, page: 0 });
        const activeWorkItems = await loadGodWorkItems(db, { status: "active", limit: 40 });
        const accountRowMap = new Map(accountListResult.accounts.map((account) => [account.org_id, account]));
        const customerRiskOrgs = accountListResult.accounts
            .filter((account) => account.risk === "churn" || account.account_state.health_band !== "healthy")
            .sort((left, right) => {
                const leftRank = left.snapshot.overdue_balance
                    + (left.snapshot.urgent_support_count * 40000)
                    + (left.snapshot.open_support_count * 10000)
                    + left.snapshot.expiring_proposal_value
                    + (left.snapshot.fatal_error_count * 50000);
                const rightRank = right.snapshot.overdue_balance
                    + (right.snapshot.urgent_support_count * 40000)
                    + (right.snapshot.open_support_count * 10000)
                    + right.snapshot.expiring_proposal_value
                    + (right.snapshot.fatal_error_count * 50000);
                return rightRank - leftRank;
            })
            .slice(0, 6)
            .map((account) => ({
                org_id: account.org_id,
                name: account.name,
                tier: account.tier,
                overdue_amount: account.snapshot.overdue_balance,
                overdue_invoices: account.snapshot.overdue_invoice_count,
                open_tickets: account.snapshot.open_support_count,
                urgent_tickets: account.snapshot.urgent_support_count,
                oldest_ticket_at: supportLoad.get(account.org_id)?.oldest_at ?? account.snapshot.latest_org_activity,
                expiring_proposals: account.snapshot.expiring_proposal_count,
                expiring_value: account.snapshot.expiring_proposal_value,
                ai_spend_usd: account.snapshot.ai_spend_mtd_usd,
                risk_flags: account.snapshot.risk_flags,
                href: withRange(`/god/directory?search=${encodeURIComponent(account.name)}`, selectedRange),
            }));

        const decisionLog = ((auditLogRowsResult.data ?? []) as AuditLogRow[]).map((row) => {
            const actorName = row.profiles?.full_name?.trim() || row.profiles?.email?.trim() || "Unknown";
            const category = row.category ?? "all";
            return {
                id: row.id,
                action: row.action?.trim() || "Platform action",
                category,
                created_at: row.created_at,
                actor_name: actorName,
                target_type: row.target_type,
                target_id: row.target_id,
                href: category === "support"
                    ? withRange("/god/support?status=open", selectedRange)
                    : category === "announcement"
                        ? withRange("/god/announcements", selectedRange)
                        : category === "kill_switch" || category === "org_management"
                            ? withRange("/god/kill-switch", selectedRange)
                            : withRange(`/god/audit-log?category=${encodeURIComponent(category)}`, selectedRange),
            };
        });

        const newestOrgs = [...organizations]
            .sort((left, right) => new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime())
            .slice(0, 5)
            .map((organization) => ({
                org_id: organization.id,
                name: organization.name?.trim() || "Unknown org",
                tier: organization.subscription_tier ?? "free",
                created_at: organization.created_at,
                href: withRange(`/god/directory?tier=${organization.subscription_tier ?? "free"}&search=${encodeURIComponent(organization.name?.trim() || "")}`, selectedRange),
            }));

        const notificationQueuePending = pendingNotificationCountResult.count ?? 0;
        const oldestPendingRow = (oldestPendingNotificationResult.data ?? [])[0];
        const oldestPendingMinutes = oldestPendingRow
            ? Math.max(
                0,
                Math.floor(
                    (Date.now() - new Date(String(oldestPendingRow.created_at)).getTime()) / 60_000,
                ),
            )
            : 0;

        const services = [
            {
                id: "database",
                label: "Database",
                status: databaseHealth.status,
                detail: databaseHealth.latency_ms >= 0 ? `${databaseHealth.latency_ms}ms` : "Unavailable",
                configured: true,
            },
            {
                id: "redis",
                label: "Redis",
                status: redisHealth.status,
                detail: redisHealth.latency_ms >= 0 ? `${redisHealth.latency_ms}ms` : "Not configured",
                configured: redisHealth.status !== "unknown",
            },
            {
                id: "fcm",
                label: "Firebase FCM",
                status: fcmHealth.status as HealthStatus,
                detail: fcmHealth.latency_ms >= 0 ? `${fcmHealth.detail} · ${fcmHealth.latency_ms}ms` : fcmHealth.detail,
                configured: fcmHealth.configured,
            },
            {
                id: "whatsapp",
                label: "WhatsApp",
                status: whatsappHealth.status as HealthStatus,
                detail: whatsappHealth.latency_ms >= 0 ? `${whatsappHealth.detail} · ${whatsappHealth.latency_ms}ms` : whatsappHealth.detail,
                configured: whatsappHealth.configured,
            },
            {
                id: "sentry",
                label: "Sentry",
                status: sentryHealth.status as HealthStatus,
                detail: sentryHealth.latency_ms >= 0 ? `${sentryHealth.detail} · ${sentryHealth.latency_ms}ms` : sentryHealth.detail,
                configured: sentryHealth.configured,
            },
            {
                id: "posthog",
                label: "PostHog",
                status: posthogHealth.status as HealthStatus,
                detail: posthogHealth.latency_ms >= 0 ? `${posthogHealth.detail} · ${posthogHealth.latency_ms}ms` : posthogHealth.detail,
                configured: posthogHealth.configured,
            },
        ];

        const workItemPriorityInbox = activeWorkItems.map((item) => {
            const account = item.org_id ? accountRowMap.get(item.org_id) : null;
            const summaryParts = [
                account?.name,
                item.summary,
                account?.account_state.next_action ? `Next: ${account.account_state.next_action}` : null,
            ].filter(Boolean);
            const revenueRisk = Boolean(account && (account.snapshot.overdue_balance > 0 || account.snapshot.expiring_proposal_count > 0));
            const churnRisk = Boolean(account && (
                account.account_state.health_band !== "healthy"
                || account.snapshot.urgent_support_count > 0
                || account.snapshot.fatal_error_count > 0
            ));
            return {
                id: `work:${item.id}`,
                work_item_id: item.id,
                kind: item.kind,
                severity: item.severity === "low" ? "medium" : item.severity,
                title: item.title,
                detail: summaryParts.join(" · ") || "No summary",
                age_label: item.due_at ? `Due ${timeAgo(item.due_at)}` : timeAgo(item.created_at),
                action_label: workItemActionLabel(item),
                href: workItemHref(item, account?.name),
                owner_id: item.owner_id,
                due_at: item.due_at,
                buckets: workItemBuckets(item, auth.userId, revenueRisk, churnRisk, tomorrowStart.getTime()),
            };
        });

        const legacyPriorityInbox = [
            ...errorRows.slice(0, 2).map((event) => ({
                id: `error:${event.id}`,
                work_item_id: null,
                kind: "incident",
                severity: severityForError(event.level),
                title: event.title?.trim() || "Untitled error",
                detail: `${safeNumber(event.event_count)} events · ${safeNumber(event.user_count)} impacted users`,
                age_label: timeAgo(event.first_seen_at ?? event.created_at),
                action_label: "Open incident",
                href: withRange(`/god/errors?status=${encodeURIComponent(event.status ?? "open")}&eventId=${event.id}`, selectedRange),
                owner_id: null,
                due_at: null,
                buckets: ["all", "churn-risk"],
            })),
            ...overdueInvoices
                .sort((left, right) => new Date(left.due_date ?? 0).getTime() - new Date(right.due_date ?? 0).getTime())
                .slice(0, 2)
                .map((invoice) => ({
                    id: `invoice:${invoice.id}`,
                    work_item_id: null,
                    kind: "collection_invoice",
                    severity: "high" as const,
                    title: `Invoice #${invoice.invoice_number ?? "—"} is overdue`,
                    detail: `${
                        invoice.organization_id
                            ? (organizationMap.get(invoice.organization_id)?.name ?? "Unknown org")
                            : "Unknown org"
                    } · ${asCurrencyParts(safeNumber(invoice.balance_amount ?? invoice.total_amount)).formatted}`,
                    age_label: daysOverdueLabel(invoice.due_date),
                    action_label: "Review invoice",
                    href: withRange(`/god/collections?tab=invoices&invoiceId=${invoice.id}`, selectedRange),
                    owner_id: null,
                    due_at: invoice.due_date,
                    buckets: ["all", "revenue-risk", "due-today"],
                })),
            ...expiringProposalRows.slice(0, 2).map((proposal) => ({
                id: `proposal:${proposal.id}`,
                work_item_id: null,
                kind: "collection_proposal",
                severity: "high" as const,
                title: `${proposal.title?.trim() || "Proposal"} is expiring soon`,
                detail: `${
                    proposal.organization_id
                        ? (organizationMap.get(proposal.organization_id)?.name ?? "Unknown org")
                        : "Unknown org"
                } · ${asCurrencyParts(proposalValue(proposal)).formatted}`,
                age_label: expiresInLabel(proposal.expires_at),
                action_label: "Review proposal",
                href: withRange(`/god/collections?tab=proposals&proposalId=${proposal.id}`, selectedRange),
                owner_id: null,
                due_at: proposal.expires_at,
                buckets: ["all", "revenue-risk", "due-today"],
            })),
            ...supportRows.slice(0, 3).map((ticket) => ({
                id: `ticket:${ticket.id}`,
                work_item_id: null,
                kind: "support",
                severity: severityForTicket(ticket.priority),
                title: ticket.title?.trim() || "Untitled support ticket",
                detail: ticket.profiles?.full_name?.trim() || ticket.profiles?.email?.trim() || "Unknown requester",
                age_label: timeAgo(ticket.created_at),
                action_label: "Respond",
                href: withRange(`/god/support?status=${encodeURIComponent(ticket.status ?? "open")}&ticketId=${ticket.id}`, selectedRange),
                owner_id: null,
                due_at: null,
                buckets: ["all", "churn-risk"],
            })),
            ...(deadLetterResult.count || oldestPendingMinutes > 15 ? [{
                id: "queue:notifications",
                work_item_id: null,
                kind: "queue",
                severity: deadLetterResult.count ? "high" as const : "medium" as const,
                title: deadLetterResult.count
                    ? `${deadLetterResult.count} dead letters need attention`
                    : "Notification queue is aging",
                detail: `${notificationQueuePending} pending · oldest ${oldestPendingMinutes}m`,
                age_label: oldestPendingMinutes > 0 ? `${oldestPendingMinutes}m oldest` : "Queue check",
                action_label: "Open queues",
                href: withRange("/god/monitoring?focus=queues", selectedRange),
                owner_id: null,
                due_at: null,
                buckets: ["all"],
            }] : []),
            ...topAiSpendOrgs.slice(0, 1).map((org) => ({
                id: `cost:${org.org_id}`,
                work_item_id: null,
                kind: "cost",
                severity: org.spend_usd >= 25 ? "high" as const : "medium" as const,
                title: `${org.name} is leading AI spend`,
                detail: `${org.requests.toLocaleString()} requests · $${org.spend_usd.toFixed(2)} MTD`,
                age_label: "MTD",
                action_label: "Review spend",
                href: withRange(`/god/costs/org/${org.org_id}`, selectedRange),
                owner_id: null,
                due_at: null,
                buckets: ["all"],
            })),
        ];

        const priorityInbox = [
            ...workItemPriorityInbox,
            ...legacyPriorityInbox.filter((item) => !workItemPriorityInbox.some((workItem) => workItem.href === item.href)),
        ]
            .sort((left, right) => {
                const rank = { critical: 0, high: 1, medium: 2 };
                return rank[left.severity] - rank[right.severity];
            })
            .slice(0, 8);

        const activeOrgs = totalOrgsResult.count ?? 0;
        const openSupportTickets = totalOpenTicketsResult.count ?? 0;
        const openFatalErrors = totalFatalErrorsResult.count ?? 0;
        const openErrors = totalOpenErrorsResult.count ?? 0;
        const todayUsers = todayUsersResult.count ?? 0;
        const yesterdayUsers = yesterdayUsersResult.count ?? 0;
        const todayOrgs = todayOrgsResult.count ?? 0;
        const yesterdayOrgs = yesterdayOrgsResult.count ?? 0;
        const todayTrips = todayTripsResult.count ?? 0;
        const yesterdayTrips = yesterdayTripsResult.count ?? 0;
        const todayTickets = todayTicketsResult.count ?? 0;
        const yesterdayTickets = yesterdayTicketsResult.count ?? 0;
        const todayFatalErrors = todayFatalErrorsResult.count ?? 0;
        const yesterdayFatalErrors = yesterdayFatalErrorsResult.count ?? 0;

        const onboardingStarted = onboardingStartedResult.count ?? 0;
        const onboardingCompleted = onboardingCompletedResult.count ?? 0;
        const onboardingCompletionPct = onboardingStarted > 0
            ? Number(((onboardingCompleted / onboardingStarted) * 100).toFixed(1))
            : null;

        return NextResponse.json({
            generated_at: new Date().toISOString(),
            current_user_id: auth.userId,
            header: {
                title: "Command Center",
                subtitle: "Owned work, revenue risk, and customer save actions in one operating view.",
            },
            summary_kpis: [
                {
                    id: "mrr",
                    label: "MRR",
                    value: asCurrencyParts(activeMrr).formatted,
                    detail: `${(activeSubscriptionsResult.data ?? []).length} active subscriptions`,
                    href: withRange("/god/costs", selectedRange),
                    tone: "neutral",
                },
                {
                    id: "orgs",
                    label: "Active orgs",
                    value: activeOrgs.toLocaleString(),
                    detail: `${todayOrgs} created today`,
                    trend_pct: pctChange(todayOrgs, yesterdayOrgs),
                    href: withRange("/god/directory?role=admin", selectedRange),
                    tone: "neutral",
                },
                {
                    id: "onboarding",
                    label: "Onboarding completion",
                    value: onboardingCompletionPct !== null ? `${onboardingCompletionPct}%` : "—",
                    detail: `${onboardingCompleted} of ${onboardingStarted} admins completed`,
                    href: withRange("/god/signups", selectedRange),
                    tone: onboardingCompletionPct !== null && onboardingCompletionPct < 50 ? "warning" : "neutral",
                },
                {
                    id: "users",
                    label: "Total users",
                    value: (totalUsersResult.count ?? 0).toLocaleString(),
                    detail: `${todayUsers} signed up today`,
                    trend_pct: pctChange(todayUsers, yesterdayUsers),
                    href: withRange("/god/signups", selectedRange),
                    sparkline: signupSparkline,
                    tone: "neutral",
                },
                {
                    id: "proposal-conversion",
                    label: "Proposal conversion",
                    value: proposalConversion !== null ? `${proposalConversion}%` : "—",
                    detail: proposalConversionDelta !== null
                        ? `${proposalConversionDelta > 0 ? "+" : ""}${proposalConversionDelta} pts vs prior ${rangeDays}d`
                        : `Last ${rangeDays} days`,
                    href: withRange("/god/analytics?feature=proposals", selectedRange),
                    tone: proposalConversionDelta !== null && proposalConversionDelta < 0 ? "warning" : "neutral",
                },
                {
                    id: "overdue",
                    label: "Overdue invoices",
                    value: asCurrencyParts(overdueInvoiceAmount).formatted,
                    detail: `${overdueInvoices.length} invoices past due`,
                    href: withRange("/god/collections?tab=invoices", selectedRange),
                    tone: overdueInvoiceAmount > 0 ? "danger" : "neutral",
                },
                {
                    id: "support",
                    label: "Open support backlog",
                    value: openSupportTickets.toLocaleString(),
                    detail: `${supportRows.filter((ticket) => ticket.priority === "urgent").length} urgent`,
                    trend_pct: pctChange(todayTickets, yesterdayTickets),
                    href: withRange("/god/support?status=open", selectedRange),
                    tone: openSupportTickets > 0 ? "warning" : "neutral",
                },
                {
                    id: "fatal-errors",
                    label: "Open fatal incidents",
                    value: openFatalErrors.toLocaleString(),
                    detail: `${openErrors} total open issues`,
                    trend_pct: pctChange(todayFatalErrors, yesterdayFatalErrors),
                    href: withRange("/god/errors?status=open", selectedRange),
                    tone: openFatalErrors > 0 ? "danger" : "neutral",
                },
                {
                    id: "ai-spend",
                    label: "AI spend MTD",
                    value: asCurrencyParts(aiSpendMtd, "usd").formatted,
                    detail: `${asCurrencyParts(todaySpendUsd, "usd").formatted} today`,
                    trend_pct: pctChange(todaySpendUsd, yesterdaySpendUsd),
                    href: withRange("/god/costs", selectedRange),
                    tone: todaySpendUsd > yesterdaySpendUsd ? "warning" : "neutral",
                },
            ],
            delta_strip: [
                {
                    id: "users-today",
                    label: "New users today",
                    value: todayUsers,
                    comparison: `${yesterdayUsers} yesterday`,
                    href: withRange("/god/signups", selectedRange),
                },
                {
                    id: "orgs-today",
                    label: "New orgs today",
                    value: todayOrgs,
                    comparison: `${yesterdayOrgs} yesterday`,
                    href: withRange("/god/directory?role=admin", selectedRange),
                },
                {
                    id: "trips-today",
                    label: "Trips created today",
                    value: todayTrips,
                    comparison: `${yesterdayTrips} yesterday`,
                    href: withRange("/god/analytics?feature=trips", selectedRange),
                },
                {
                    id: "tickets-today",
                    label: "Tickets opened today",
                    value: todayTickets,
                    comparison: `${yesterdayTickets} yesterday`,
                    href: withRange("/god/support?status=open", selectedRange),
                },
                {
                    id: "fatal-today",
                    label: "Fatal incidents today",
                    value: todayFatalErrors,
                    comparison: `${yesterdayFatalErrors} yesterday`,
                    href: withRange("/god/errors?status=open", selectedRange),
                },
            ],
            priority_inbox: priorityInbox,
            revenue_risk: {
                overdue_amount: asCurrencyParts(overdueInvoiceAmount).formatted,
                overdue_count: overdueInvoices.length,
                due_this_week_amount: asCurrencyParts(dueThisWeekAmount).formatted,
                due_this_week_count: dueThisWeekInvoices.length,
                expiring_proposals_amount: asCurrencyParts(expiringProposalValue).formatted,
                expiring_proposals_count: expiringProposalRows.length,
                open_support_count: openSupportTickets,
                top_overdue_invoices: overdueInvoices
                    .sort((left, right) => new Date(left.due_date ?? 0).getTime() - new Date(right.due_date ?? 0).getTime())
                    .slice(0, 5)
                    .map((invoice) => ({
                        id: invoice.id,
                        invoice_number: invoice.invoice_number,
                        due_date: invoice.due_date,
                        amount: asCurrencyParts(safeNumber(invoice.balance_amount ?? invoice.total_amount)).formatted,
                        org_name: invoice.organization_id
                            ? (organizationMap.get(invoice.organization_id)?.name ?? "Unknown org")
                            : "Unknown org",
                    })),
                expiring_proposals: expiringProposalRows.slice(0, 5).map((proposal) => ({
                    id: proposal.id,
                    title: proposal.title?.trim() || "Untitled proposal",
                    expires_at: proposal.expires_at,
                    value: asCurrencyParts(proposalValue(proposal)).formatted,
                    org_name: proposal.organization_id
                        ? (organizationMap.get(proposal.organization_id)?.name ?? "Unknown org")
                        : "Unknown org",
                })),
            },
            growth: {
                signup_trend_30d: signupTrend,
                signups_last_30d: signupTrend.reduce((sum, row) => sum + row.signups, 0),
                avg_daily_signups: Number((signupTrend.reduce((sum, row) => sum + row.signups, 0) / rangeDays).toFixed(1)),
                new_orgs_last_30d: organizations.filter((organization) => {
                    if (!organization.created_at) return false;
                    return new Date(organization.created_at).getTime() >= new Date(rangeStart).getTime();
                }).length,
                proposal_conversion_pct: proposalConversion,
            },
            watchlists: {
                customer_risk_orgs: customerRiskOrgs,
                ai_spend_orgs: topAiSpendOrgs.map((org) => ({
                    ...org,
                    href: withRange(`/god/costs/org/${org.org_id}`, selectedRange),
                })),
                support_load_orgs: Array.from(supportLoad.values())
                    .sort((left, right) => {
                        if (left.urgent !== right.urgent) return right.urgent - left.urgent;
                        return right.open - left.open;
                    })
                    .slice(0, 5)
                    .map((org) => ({
                        ...org,
                        href: withRange(`/god/support?status=open&search=${encodeURIComponent(org.name)}`, selectedRange),
                    })),
                newest_orgs: newestOrgs,
            },
            ops_health: {
                services,
                queues: {
                    notifications_pending: notificationQueuePending,
                    notifications_failed: failedNotificationsResult.count ?? 0,
                    dead_letters: deadLetterResult.count ?? 0,
                    social_pending: socialQueueResult.count ?? 0,
                    pdf_pending: pdfQueueResult.count ?? 0,
                    oldest_pending_minutes: oldestPendingMinutes,
                },
                incidents: {
                    open_errors: openErrors,
                    open_fatal_errors: openFatalErrors,
                    resolved_this_week: resolvedThisWeekResult.count ?? 0,
                },
            },
            decision_log: decisionLog,
            quick_actions: [
                { label: "Revenue Ops", href: withRange("/god/collections?tab=invoices", selectedRange) },
                { label: "Accounts", href: withRange("/god/directory", selectedRange) },
                { label: "Error events", href: withRange("/god/errors", selectedRange) },
                { label: "Support queue", href: withRange("/god/support?status=open", selectedRange) },
                { label: "Health monitor", href: withRange("/god/monitoring", selectedRange) },
                { label: "Cost dashboard", href: withRange("/god/costs", selectedRange) },
                { label: "Send announcement", href: withRange("/god/announcements", selectedRange) },
                { label: "Kill switch", href: withRange("/god/kill-switch", selectedRange), tone: "danger" },
            ],
            meta: {
                data_quality: buildGodDataQuality([
                    "profiles",
                    "organizations",
                    "support_tickets",
                    "error_events",
                    "notification_queue",
                    "notification_dead_letters",
                    "invoices",
                    "proposals",
                    "organization_ai_usage",
                ], { completeness: "partial", sampled: true }),
                kpi_contracts: pickGodKpiContracts(["total_users", "notification_pending"]),
            },
        });
    } catch (err) {
        logError("[superadmin/overview]", err);
        return apiError("Failed to load overview", 500);
    }
}
