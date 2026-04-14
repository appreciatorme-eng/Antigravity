// GET /api/superadmin/overview — superadmin operating view with real business and risk signals.

import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";

type Severity = "critical" | "high" | "medium";
type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
type UntypedAdminClient = Extract<
    Awaited<ReturnType<typeof requireSuperAdmin>>,
    { ok: true }
>["adminClient"];

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

async function checkDatabase(client: UntypedAdminClient): Promise<{ status: HealthStatus; latency_ms: number }> {
    const start = Date.now();
    try {
        await client.from("profiles").select("id").limit(1);
        return { status: "healthy", latency_ms: Date.now() - start };
    } catch {
        return { status: "down", latency_ms: Date.now() - start };
    }
}

async function checkRedis(): Promise<{ status: HealthStatus; latency_ms: number }> {
    const redis = getRedisClient();
    if (!redis) return { status: "unknown", latency_ms: -1 };
    const start = Date.now();
    try {
        await redis.ping();
        return { status: "healthy", latency_ms: Date.now() - start };
    } catch {
        return { status: "down", latency_ms: Date.now() - start };
    }
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

    const now = new Date();
    const todayStart = startOfUtcDay();
    const yesterdayStart = startOfUtcDay(-1);
    const tomorrowStart = startOfUtcDay(1);
    const weekStart = startOfUtcDay(7);
    const monthStart = startOfUtcMonth();
    const thirtyDaysAgo = daysAgo(29);
    const sixtyDaysAgo = daysAgo(59);
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
            pendingNotificationRowsResult,
            failedNotificationsResult,
            deadLetterResult,
            socialQueueResult,
            pdfQueueResult,
            databaseHealth,
            redisHealth,
            todaySpendUsd,
            yesterdaySpendUsd,
        ] = await Promise.all([
            db.from("profiles").select("id", { count: "exact", head: true }),
            db.from("organizations").select("id", { count: "exact", head: true }),
            db.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
            db.from("error_events").select("id", { count: "exact", head: true }).eq("status", "open").eq("level", "fatal"),
            db.from("error_events").select("id", { count: "exact", head: true }).eq("status", "open"),
            db.from("error_events").select("id", { count: "exact", head: true }).eq("status", "resolved").gte("resolved_at", oneWeekAgo),
            db.from("subscriptions").select("amount").eq("status", "active"),
            db.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
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
                .limit(40),
            db
                .from("error_events")
                .select("id, title, level, status, created_at, first_seen_at, event_count, user_count")
                .in("status", ["open", "investigating"])
                .order("created_at", { ascending: false })
                .limit(40),
            db
                .from("invoices")
                .select("id, invoice_number, status, due_date, balance_amount, total_amount, organization_id")
                .gt("balance_amount", 0)
                .in("status", ["issued", "partially_paid", "overdue"])
                .limit(400),
            db
                .from("proposals")
                .select("id, status, total_price, client_selected_price")
                .gte("created_at", thirtyDaysAgo)
                .limit(400),
            db
                .from("proposals")
                .select("id, status, total_price, client_selected_price")
                .gte("created_at", sixtyDaysAgo)
                .lt("created_at", thirtyDaysAgo)
                .limit(400),
            db
                .from("proposals")
                .select("id, title, status, expires_at, total_price, client_selected_price, organization_id")
                .not("expires_at", "is", null)
                .gte("expires_at", now.toISOString())
                .lte("expires_at", threeDaysOut)
                .limit(20),
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
                .select("created_at")
                .eq("status", "pending")
                .order("created_at", { ascending: true })
                .limit(1000),
            db.from("notification_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
            db.from("notification_dead_letters").select("id", { count: "exact", head: true }),
            db.from("social_post_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
            db.from("pdf_extraction_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
            checkDatabase(auth.adminClient),
            checkRedis(),
            readRedisSpendFor(todayStart.toISOString().slice(0, 10)),
            readRedisSpendFor(yesterdayStart.toISOString().slice(0, 10)),
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

        const signupTrend = Array.from({ length: 30 }, (_, index) => {
            const date = new Date(Date.now() - (29 - index) * 86_400_000);
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

        const customerRiskOrgIds = new Set<string>([
            ...overdueByOrg.keys(),
            ...supportLoad.keys(),
            ...expiringProposalByOrg.keys(),
            ...aiByOrg.keys(),
        ]);

        const customerRiskOrgs = Array.from(customerRiskOrgIds)
            .map((orgId) => {
                const org = organizationMap.get(orgId);
                const overdue = overdueByOrg.get(orgId) ?? { overdue_amount: 0, overdue_invoices: 0 };
                const support = supportLoad.get(orgId) ?? { open: 0, urgent: 0, oldest_at: null };
                const proposals = expiringProposalByOrg.get(orgId) ?? { expiring_proposals: 0, expiring_value: 0 };
                const ai = aiByOrg.get(orgId) ?? { spend_usd: 0, requests: 0 };
                const riskFlags = [
                    overdue.overdue_amount > 0 ? `${overdue.overdue_invoices} overdue invoices` : null,
                    support.urgent > 0 ? `${support.urgent} urgent tickets` : null,
                    support.open > 0 ? `${support.open} open tickets` : null,
                    proposals.expiring_proposals > 0 ? `${proposals.expiring_proposals} expiring proposals` : null,
                    ai.spend_usd >= 25 ? `$${ai.spend_usd.toFixed(2)} AI spend MTD` : null,
                ].filter(Boolean) as string[];

                const rank = overdue.overdue_amount
                    + (support.urgent * 40000)
                    + (support.open * 10000)
                    + proposals.expiring_value
                    + (ai.spend_usd * 1500);

                return {
                    org_id: orgId,
                    name: org?.name ?? "Unknown org",
                    tier: org?.tier ?? "free",
                    overdue_amount: Number(overdue.overdue_amount.toFixed(0)),
                    overdue_invoices: overdue.overdue_invoices,
                    open_tickets: support.open,
                    urgent_tickets: support.urgent,
                    oldest_ticket_at: support.oldest_at,
                    expiring_proposals: proposals.expiring_proposals,
                    expiring_value: Number(proposals.expiring_value.toFixed(0)),
                    ai_spend_usd: Number(ai.spend_usd.toFixed(2)),
                    risk_flags: riskFlags,
                    href: `/god/directory?search=${encodeURIComponent(org?.name ?? "")}`,
                    rank,
                };
            })
            .filter((org) => org.risk_flags.length > 0)
            .sort((left, right) => right.rank - left.rank)
            .slice(0, 6);

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
                    ? "/god/support?status=open"
                    : category === "announcement"
                        ? "/god/announcements"
                        : category === "kill_switch" || category === "org_management"
                            ? "/god/kill-switch"
                            : `/god/audit-log?category=${encodeURIComponent(category)}`,
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
                href: `/god/directory?tier=${organization.subscription_tier ?? "free"}&search=${encodeURIComponent(organization.name?.trim() || "")}`,
            }));

        const notificationQueuePending = pendingNotificationRowsResult.data ?? [];
        const oldestPendingMinutes = notificationQueuePending.length > 0
            ? Math.max(
                0,
                Math.floor(
                    (Date.now() - new Date(String(notificationQueuePending[0].created_at)).getTime()) / 60_000,
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
                status: "unknown",
                detail: process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY
                    ? "Configured (runtime unverified)"
                    : "Not configured",
                configured: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY),
            },
            {
                id: "whatsapp",
                label: "WhatsApp",
                status: "unknown",
                detail: process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_API_TOKEN
                    ? "Configured (runtime unverified)"
                    : "Not configured",
                configured: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_API_TOKEN),
            },
            {
                id: "sentry",
                label: "Sentry",
                status: "unknown",
                detail: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
                    ? "Configured (runtime unverified)"
                    : "Not configured",
                configured: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
            },
            {
                id: "posthog",
                label: "PostHog",
                status: "unknown",
                detail: process.env.NEXT_PUBLIC_POSTHOG_KEY
                    ? "Configured (runtime unverified)"
                    : "Not configured",
                configured: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
            },
        ];

        const priorityInbox = [
            ...errorRows.slice(0, 2).map((event) => ({
                id: `error:${event.id}`,
                kind: "incident",
                severity: severityForError(event.level),
                title: event.title?.trim() || "Untitled error",
                detail: `${safeNumber(event.event_count)} events · ${safeNumber(event.user_count)} impacted users`,
                age_label: timeAgo(event.first_seen_at ?? event.created_at),
                action_label: "Open incident",
                href: `/god/errors?status=${encodeURIComponent(event.status ?? "open")}&eventId=${event.id}`,
            })),
            ...overdueInvoices
                .sort((left, right) => new Date(left.due_date ?? 0).getTime() - new Date(right.due_date ?? 0).getTime())
                .slice(0, 2)
                .map((invoice) => ({
                    id: `invoice:${invoice.id}`,
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
                    href: `/god/collections?tab=invoices&invoiceId=${invoice.id}`,
                })),
            ...expiringProposalRows.slice(0, 2).map((proposal) => ({
                id: `proposal:${proposal.id}`,
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
                href: `/god/collections?tab=proposals&proposalId=${proposal.id}`,
            })),
            ...supportRows.slice(0, 3).map((ticket) => ({
                id: `ticket:${ticket.id}`,
                kind: "support",
                severity: severityForTicket(ticket.priority),
                title: ticket.title?.trim() || "Untitled support ticket",
                detail: ticket.profiles?.full_name?.trim() || ticket.profiles?.email?.trim() || "Unknown requester",
                age_label: timeAgo(ticket.created_at),
                action_label: "Respond",
                href: `/god/support?status=${encodeURIComponent(ticket.status ?? "open")}&ticketId=${ticket.id}`,
            })),
            ...(deadLetterResult.count || oldestPendingMinutes > 15 ? [{
                id: "queue:notifications",
                kind: "queue",
                severity: deadLetterResult.count ? "high" as const : "medium" as const,
                title: deadLetterResult.count
                    ? `${deadLetterResult.count} dead letters need attention`
                    : "Notification queue is aging",
                detail: `${notificationQueuePending.length} pending · oldest ${oldestPendingMinutes}m`,
                age_label: oldestPendingMinutes > 0 ? `${oldestPendingMinutes}m oldest` : "Queue check",
                action_label: "Open queues",
                href: "/god/monitoring?focus=queues",
            }] : []),
            ...topAiSpendOrgs.slice(0, 1).map((org) => ({
                id: `cost:${org.org_id}`,
                kind: "cost",
                severity: org.spend_usd >= 25 ? "high" as const : "medium" as const,
                title: `${org.name} is leading AI spend`,
                detail: `${org.requests.toLocaleString()} requests · $${org.spend_usd.toFixed(2)} MTD`,
                age_label: "MTD",
                action_label: "Review spend",
                href: `/god/costs/org/${org.org_id}`,
            })),
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

        return NextResponse.json({
            generated_at: new Date().toISOString(),
            header: {
                title: "Command Center",
                subtitle: "Revenue, incidents, customers, and queue pressure in one place.",
            },
            summary_kpis: [
                {
                    id: "mrr",
                    label: "MRR",
                    value: asCurrencyParts(activeMrr).formatted,
                    detail: `${(activeSubscriptionsResult.data ?? []).length} active subscriptions`,
                    href: "/god/costs",
                    tone: "neutral",
                },
                {
                    id: "orgs",
                    label: "Active orgs",
                    value: activeOrgs.toLocaleString(),
                    detail: `${todayOrgs} created today`,
                    trend_pct: pctChange(todayOrgs, yesterdayOrgs),
                    href: "/god/directory?role=admin",
                    tone: "neutral",
                },
                {
                    id: "users",
                    label: "Total users",
                    value: (totalUsersResult.count ?? 0).toLocaleString(),
                    detail: `${todayUsers} signed up today`,
                    trend_pct: pctChange(todayUsers, yesterdayUsers),
                    href: "/god/signups?range=30d",
                    sparkline: signupSparkline,
                    tone: "neutral",
                },
                {
                    id: "proposal-conversion",
                    label: "Proposal conversion",
                    value: proposalConversion !== null ? `${proposalConversion}%` : "—",
                    detail: proposalConversionDelta !== null
                        ? `${proposalConversionDelta > 0 ? "+" : ""}${proposalConversionDelta} pts vs prior 30d`
                        : "Last 30 days",
                    href: "/god/analytics?feature=proposals&range=30d",
                    tone: proposalConversionDelta !== null && proposalConversionDelta < 0 ? "warning" : "neutral",
                },
                {
                    id: "overdue",
                    label: "Overdue invoices",
                    value: asCurrencyParts(overdueInvoiceAmount).formatted,
                    detail: `${overdueInvoices.length} invoices past due`,
                    href: "/god/collections?tab=invoices",
                    tone: overdueInvoiceAmount > 0 ? "danger" : "neutral",
                },
                {
                    id: "support",
                    label: "Open support backlog",
                    value: openSupportTickets.toLocaleString(),
                    detail: `${supportRows.filter((ticket) => ticket.priority === "urgent").length} urgent`,
                    trend_pct: pctChange(todayTickets, yesterdayTickets),
                    href: "/god/support?status=open",
                    tone: openSupportTickets > 0 ? "warning" : "neutral",
                },
                {
                    id: "fatal-errors",
                    label: "Open fatal incidents",
                    value: openFatalErrors.toLocaleString(),
                    detail: `${openErrors} total open issues`,
                    trend_pct: pctChange(todayFatalErrors, yesterdayFatalErrors),
                    href: "/god/errors?status=open",
                    tone: openFatalErrors > 0 ? "danger" : "neutral",
                },
                {
                    id: "ai-spend",
                    label: "AI spend MTD",
                    value: asCurrencyParts(aiSpendMtd, "usd").formatted,
                    detail: `${asCurrencyParts(todaySpendUsd, "usd").formatted} today`,
                    trend_pct: pctChange(todaySpendUsd, yesterdaySpendUsd),
                    href: "/god/costs?range=30d",
                    tone: todaySpendUsd > yesterdaySpendUsd ? "warning" : "neutral",
                },
            ],
            delta_strip: [
                {
                    id: "users-today",
                    label: "New users today",
                    value: todayUsers,
                    comparison: `${yesterdayUsers} yesterday`,
                    href: "/god/signups?range=30d",
                },
                {
                    id: "orgs-today",
                    label: "New orgs today",
                    value: todayOrgs,
                    comparison: `${yesterdayOrgs} yesterday`,
                    href: "/god/directory?role=admin",
                },
                {
                    id: "trips-today",
                    label: "Trips created today",
                    value: todayTrips,
                    comparison: `${yesterdayTrips} yesterday`,
                    href: "/god/analytics?feature=trips&range=30d",
                },
                {
                    id: "tickets-today",
                    label: "Tickets opened today",
                    value: todayTickets,
                    comparison: `${yesterdayTickets} yesterday`,
                    href: "/god/support?status=open",
                },
                {
                    id: "fatal-today",
                    label: "Fatal incidents today",
                    value: todayFatalErrors,
                    comparison: `${yesterdayFatalErrors} yesterday`,
                    href: "/god/errors?status=open",
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
                avg_daily_signups: Number((signupTrend.reduce((sum, row) => sum + row.signups, 0) / 30).toFixed(1)),
                new_orgs_last_30d: organizations.filter((organization) => {
                    if (!organization.created_at) return false;
                    return new Date(organization.created_at).getTime() >= new Date(thirtyDaysAgo).getTime();
                }).length,
                proposal_conversion_pct: proposalConversion,
            },
            watchlists: {
                customer_risk_orgs: customerRiskOrgs,
                ai_spend_orgs: topAiSpendOrgs.map((org) => ({
                    ...org,
                    href: `/god/costs/org/${org.org_id}`,
                })),
                support_load_orgs: Array.from(supportLoad.values())
                    .sort((left, right) => {
                        if (left.urgent !== right.urgent) return right.urgent - left.urgent;
                        return right.open - left.open;
                    })
                    .slice(0, 5)
                    .map((org) => ({
                        ...org,
                        href: `/god/support?status=open&search=${encodeURIComponent(org.name)}`,
                    })),
                newest_orgs: newestOrgs,
            },
            ops_health: {
                services,
                queues: {
                    notifications_pending: notificationQueuePending.length,
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
                { label: "Collections", href: "/god/collections?tab=invoices" },
                { label: "Error events", href: "/god/errors" },
                { label: "Support queue", href: "/god/support?status=open" },
                { label: "Health monitor", href: "/god/monitoring" },
                { label: "Cost dashboard", href: "/god/costs" },
                { label: "Send announcement", href: "/god/announcements" },
                { label: "Kill switch", href: "/god/kill-switch", tone: "danger" },
            ],
        });
    } catch (err) {
        logError("[superadmin/overview]", err);
        return apiError("Failed to load overview", 500);
    }
}
