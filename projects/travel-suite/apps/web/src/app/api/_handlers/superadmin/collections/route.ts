// GET   /api/superadmin/collections — revenue recovery workspace data.
// PATCH /api/superadmin/collections — mutate invoice/proposal status (mark paid, write off, extend, convert, cancel).
// POST  /api/superadmin/collections — trigger actions like payment reminders.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages";
import { buildGodDataQuality } from "@/lib/platform/god-kpi";
import { logPlatformActionWithTarget, getClientIpFromRequest } from "@/lib/platform/audit";
import {
    buildAccountMetricsMap,
    buildBusinessImpact,
    createGodWorkItem,
    loadGodAccountStateMap,
    loadGodWorkItems,
    updateGodWorkItem,
} from "@/lib/platform/god-accounts";

type OrganizationRow = {
    id: string;
    name: string | null;
    subscription_tier: string | null;
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

function safeNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function asCurrency(amount: number): string {
    const rounded = Math.round(amount);
    return `₹${rounded.toLocaleString("en-IN")}`;
}

function proposalValue(row: ProposalRow): number {
    return safeNumber(row.client_selected_price ?? row.total_price);
}

function daysUntil(iso: string | null): number | null {
    if (!iso) return null;
    const diffMs = new Date(iso).getTime() - Date.now();
    return Math.floor(diffMs / 86_400_000);
}

function hoursUntil(iso: string | null): number | null {
    if (!iso) return null;
    const diffMs = new Date(iso).getTime() - Date.now();
    return Math.floor(diffMs / 3_600_000);
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- superadmin collections aggregates cross-table joins not represented in generated types
    const db = auth.adminClient as any;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
    const orgIdFilter = searchParams.get("orgId")?.trim() ?? "";

    const now = new Date();
    const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7));
    const threeDaysOutIso = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    try {
        const [organizations, invoiceRows, proposalRows] = await Promise.all([
            fetchAllPages<OrganizationRow>((from, to) => (
                db
                    .from("organizations")
                    .select("id, name, subscription_tier")
                    .order("id", { ascending: true })
                    .range(from, to)
            )),
            fetchAllPages<InvoiceRow>((from, to) => (
                db
                    .from("invoices")
                    .select("id, invoice_number, status, due_date, balance_amount, total_amount, organization_id")
                    .gt("balance_amount", 0)
                    .in("status", ["issued", "partially_paid", "overdue"])
                    .order("id", { ascending: true })
                    .range(from, to)
            )),
            fetchAllPages<ProposalRow>((from, to) => (
                db
                    .from("proposals")
                    .select("id, title, status, expires_at, total_price, client_selected_price, organization_id")
                    .not("expires_at", "is", null)
                    .gte("expires_at", now.toISOString())
                    .lte("expires_at", threeDaysOutIso)
                    .order("id", { ascending: true })
                    .range(from, to)
            )),
        ]);

        const orgIds = organizations.map((org) => org.id);
        const [accountStateMap, accountMetricsMap, activeWorkItems] = await Promise.all([
            loadGodAccountStateMap(db, orgIds),
            buildAccountMetricsMap(db, orgIds),
            loadGodWorkItems(db, { orgIds, status: "active", limit: 500 }),
        ]);
        const workItemMap = new Map<string, typeof activeWorkItems[number]>();
        for (const item of activeWorkItems) {
            workItemMap.set(`${item.target_type}:${item.target_id}`, item);
        }

        const organizationMap = new Map(
            organizations.map((org) => [
                org.id,
                {
                    name: org.name?.trim() || "Unknown org",
                    tier: org.subscription_tier ?? "free",
                },
            ]),
        );

        const overdueInvoices = invoiceRows.filter((row) => row.due_date && new Date(row.due_date).getTime() < tomorrowStart.getTime());
        const dueThisWeekInvoices = invoiceRows.filter((row) => {
            if (!row.due_date) return false;
            const dueAt = new Date(row.due_date).getTime();
            return dueAt >= tomorrowStart.getTime() && dueAt < weekStart.getTime();
        });
        let workspaceInvoices = [...overdueInvoices, ...dueThisWeekInvoices];
        workspaceInvoices = workspaceInvoices.sort((left, right) => {
            return new Date(left.due_date ?? 0).getTime() - new Date(right.due_date ?? 0).getTime();
        });

        const proposalRowsSorted = [...proposalRows].sort((left, right) => {
            return new Date(left.expires_at ?? 0).getTime() - new Date(right.expires_at ?? 0).getTime();
        });

        const invoicePayload = workspaceInvoices.map((row) => {
            const org = row.organization_id ? organizationMap.get(row.organization_id) : null;
            const accountState = row.organization_id ? accountStateMap.get(row.organization_id) : null;
            const snapshot = row.organization_id ? accountMetricsMap.get(row.organization_id) : null;
            const linkedWorkItem = workItemMap.get(`invoice:${row.id}`) ?? null;
            const amountDue = safeNumber(row.balance_amount ?? row.total_amount);
            const days = daysUntil(row.due_date);
            return {
                id: row.id,
                invoice_number: row.invoice_number,
                status: row.status ?? "issued",
                due_date: row.due_date,
                amount_due: amountDue,
                amount_label: asCurrency(amountDue),
                org_id: row.organization_id,
                org_name: org?.name ?? "Unknown org",
                org_tier: org?.tier ?? "free",
                days_until_due: days,
                href: `/god/collections?tab=invoices&invoiceId=${row.id}`,
                account_state: accountState,
                business_impact: accountState && snapshot ? buildBusinessImpact(accountState, snapshot) : null,
                work_item: linkedWorkItem,
                recommended_playbook: amountDue >= 100000 ? "Executive collections" : days !== null && days < -14 ? "Recovery call + suspension review" : "Reminder + follow-up",
            };
        });

        const proposalPayload = proposalRowsSorted.map((row) => {
            const org = row.organization_id ? organizationMap.get(row.organization_id) : null;
            const accountState = row.organization_id ? accountStateMap.get(row.organization_id) : null;
            const snapshot = row.organization_id ? accountMetricsMap.get(row.organization_id) : null;
            const linkedWorkItem = workItemMap.get(`proposal:${row.id}`) ?? null;
            const value = proposalValue(row);
            return {
                id: row.id,
                title: row.title?.trim() || "Untitled proposal",
                status: row.status ?? "draft",
                expires_at: row.expires_at,
                value,
                value_label: asCurrency(value),
                org_id: row.organization_id,
                org_name: org?.name ?? "Unknown org",
                org_tier: org?.tier ?? "free",
                hours_until_expiry: hoursUntil(row.expires_at),
                href: `/god/collections?tab=proposals&proposalId=${row.id}`,
                account_state: accountState,
                business_impact: accountState && snapshot ? buildBusinessImpact(accountState, snapshot) : null,
                work_item: linkedWorkItem,
                recommended_playbook: value >= 100000 ? "Executive rescue" : "Sales follow-up",
            };
        });

        let filteredInvoices = invoicePayload;
        let filteredProposals = proposalPayload;
        if (orgIdFilter) {
            filteredInvoices = filteredInvoices.filter((row) => row.org_id === orgIdFilter);
            filteredProposals = filteredProposals.filter((row) => row.org_id === orgIdFilter);
        }
        if (search) {
            filteredInvoices = filteredInvoices.filter((row) => (
                row.org_name.toLowerCase().includes(search)
                || String(row.invoice_number ?? "").toLowerCase().includes(search)
            ));
            filteredProposals = filteredProposals.filter((row) => (
                row.org_name.toLowerCase().includes(search)
                || row.title.toLowerCase().includes(search)
            ));
        }

        const overdueAmount = overdueInvoices.reduce((sum, row) => sum + safeNumber(row.balance_amount ?? row.total_amount), 0);
        const dueThisWeekAmount = dueThisWeekInvoices.reduce((sum, row) => sum + safeNumber(row.balance_amount ?? row.total_amount), 0);
        const expiringProposalsAmount = proposalRowsSorted.reduce((sum, row) => sum + proposalValue(row), 0);

        return NextResponse.json({
            generated_at: new Date().toISOString(),
            summary: {
                overdue_invoices_count: overdueInvoices.length,
                overdue_amount: asCurrency(overdueAmount),
                due_this_week_count: dueThisWeekInvoices.length,
                due_this_week_amount: asCurrency(dueThisWeekAmount),
                expiring_proposals_count: proposalRowsSorted.length,
                expiring_proposals_amount: asCurrency(expiringProposalsAmount),
            },
            invoices: filteredInvoices,
            proposals: filteredProposals,
            meta: {
                data_quality: buildGodDataQuality(["organizations", "invoices", "proposals"]),
            },
        });
    } catch (error) {
        logError("[superadmin/collections]", error);
        return apiError("Failed to load collections workspace", 500);
    }
}

// ---------------------------------------------------------------------------
// PATCH /api/superadmin/collections — update invoice or proposal status
// ---------------------------------------------------------------------------

interface CollectionPatchBody {
    type: "invoice" | "proposal";
    id: string;
    action: string;
    due_date?: string;
    expires_at?: string;
    work_item_update?: {
        id?: string;
        status?: "open" | "in_progress" | "blocked" | "snoozed" | "done";
        due_at?: string | null;
        summary?: string | null;
    };
}

export async function PATCH(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;

    let body: CollectionPatchBody;
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

    if (!body.type || !body.id || !body.action) {
        return apiError("type, id, and action are required", 400);
    }

    try {
        if (body.type === "invoice") {
            const table = "invoices";
            const update: Record<string, unknown> = {};
            let orgId: string | null = null;

            switch (body.action) {
                case "mark_paid":
                    update.status = "paid";
                    update.balance_amount = 0;
                    break;
                case "write_off":
                    update.status = "written_off";
                    update.balance_amount = 0;
                    break;
                case "extend":
                    if (!body.due_date) return apiError("due_date required for extend action", 400);
                    update.due_date = body.due_date;
                    break;
                default:
                    return apiError(`Unknown invoice action: ${body.action}`, 400);
            }

            const existing = await db.from(table).select("organization_id, invoice_number").eq("id", body.id).maybeSingle();
            orgId = existing.data?.organization_id ?? null;
            const { error } = await db.from(table).update(update).eq("id", body.id);
            if (error) {
                logError("[superadmin/collections PATCH invoice]", error);
                return apiError("Failed to update invoice", 500);
            }

            if (body.work_item_update?.id) {
                await updateGodWorkItem(db, body.work_item_update.id, {
                    status: body.work_item_update.status ?? (["mark_paid", "write_off"].includes(body.action) ? "done" : undefined),
                    due_at: body.work_item_update.due_at,
                    summary: body.work_item_update.summary ?? undefined,
                });
            } else if (orgId) {
                const status = ["mark_paid", "write_off"].includes(body.action) ? "done" : "in_progress";
                await createGodWorkItem(db, {
                    kind: "collections",
                    target_type: "invoice",
                    target_id: body.id,
                    org_id: orgId,
                    owner_id: auth.userId,
                    status,
                    severity: body.action === "write_off" ? "high" : "medium",
                    title: `Invoice ${body.action.replace("_", " ")}: ${existing.data?.invoice_number ?? body.id}`,
                    summary: body.work_item_update?.summary ?? `Collections action recorded for invoice ${body.id}`,
                    due_at: body.work_item_update?.due_at ?? null,
                    metadata: { action: body.action },
                });
            }

            await logPlatformActionWithTarget(
                auth.userId,
                `Invoice ${body.action}: ${body.id}`,
                "cost_override",
                "invoice",
                body.id,
                { action: body.action, ...update },
                getClientIpFromRequest(request),
            );
        } else if (body.type === "proposal") {
            const table = "proposals";
            const update: Record<string, unknown> = {};
            let orgId: string | null = null;

            switch (body.action) {
                case "convert":
                    update.status = "converted";
                    break;
                case "cancel":
                    update.status = "cancelled";
                    break;
                case "extend":
                    if (!body.expires_at) return apiError("expires_at required for extend action", 400);
                    update.expires_at = body.expires_at;
                    break;
                default:
                    return apiError(`Unknown proposal action: ${body.action}`, 400);
            }

            const existing = await db.from(table).select("organization_id, title").eq("id", body.id).maybeSingle();
            orgId = existing.data?.organization_id ?? null;
            const { error } = await db.from(table).update(update).eq("id", body.id);
            if (error) {
                logError("[superadmin/collections PATCH proposal]", error);
                return apiError("Failed to update proposal", 500);
            }

            if (body.work_item_update?.id) {
                await updateGodWorkItem(db, body.work_item_update.id, {
                    status: body.work_item_update.status ?? (["convert", "cancel"].includes(body.action) ? "done" : undefined),
                    due_at: body.work_item_update.due_at,
                    summary: body.work_item_update.summary ?? undefined,
                });
            } else if (orgId) {
                const status = ["convert", "cancel"].includes(body.action) ? "done" : "in_progress";
                await createGodWorkItem(db, {
                    kind: body.action === "convert" ? "renewal" : "collections",
                    target_type: "proposal",
                    target_id: body.id,
                    org_id: orgId,
                    owner_id: auth.userId,
                    status,
                    severity: "medium",
                    title: `Proposal ${body.action}: ${existing.data?.title ?? body.id}`,
                    summary: body.work_item_update?.summary ?? `Proposal action recorded for ${body.id}`,
                    due_at: body.work_item_update?.due_at ?? null,
                    metadata: { action: body.action },
                });
            }

            await logPlatformActionWithTarget(
                auth.userId,
                `Proposal ${body.action}: ${body.id}`,
                "cost_override",
                "proposal",
                body.id,
                { action: body.action, ...update },
                getClientIpFromRequest(request),
            );
        } else {
            return apiError("type must be 'invoice' or 'proposal'", 400);
        }

        return NextResponse.json({ ok: true, action: body.action });
    } catch (err) {
        logError("[superadmin/collections PATCH]", err);
        return apiError("Failed to update collection item", 500);
    }
}

// ---------------------------------------------------------------------------
// POST /api/superadmin/collections — trigger actions (e.g. payment reminders)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    let body: { type?: string; id?: string; action?: string; org_id?: string | null; work_item_id?: string | null };
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

    if (body.action === "remind" && body.type === "invoice" && body.id) {
        if (body.work_item_id) {
            await updateGodWorkItem(auth.adminClient as never, body.work_item_id, {
                status: "in_progress",
            });
        } else if (body.org_id) {
            await createGodWorkItem(auth.adminClient as never, {
                kind: "collections",
                target_type: "invoice",
                target_id: body.id,
                org_id: body.org_id,
                owner_id: auth.userId,
                status: "in_progress",
                severity: "medium",
                title: `Invoice reminder sent`,
                summary: `Reminder logged for invoice ${body.id}`,
                due_at: null,
                metadata: { action: "remind" },
            });
        }
        // Log the reminder action (actual email sending would integrate with notification service)
        await logPlatformActionWithTarget(
            auth.userId,
            `Payment reminder sent for invoice ${body.id}`,
            "cost_override",
            "invoice",
            body.id,
            { action: "remind" },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({ ok: true, action: "remind", message: "Payment reminder logged" });
    }

    return apiError("Unknown action", 400);
}
