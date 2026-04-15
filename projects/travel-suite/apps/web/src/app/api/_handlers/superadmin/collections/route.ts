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
            };
        });

        const proposalPayload = proposalRowsSorted.map((row) => {
            const org = row.organization_id ? organizationMap.get(row.organization_id) : null;
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

            const { error } = await db.from(table).update(update).eq("id", body.id);
            if (error) {
                logError("[superadmin/collections PATCH invoice]", error);
                return apiError("Failed to update invoice", 500);
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

            const { error } = await db.from(table).update(update).eq("id", body.id);
            if (error) {
                logError("[superadmin/collections PATCH proposal]", error);
                return apiError("Failed to update proposal", 500);
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

    let body: { type?: string; id?: string; action?: string };
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

    if (body.action === "remind" && body.type === "invoice" && body.id) {
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
