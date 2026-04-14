// GET /api/superadmin/collections — revenue recovery workspace data (overdue/due-soon invoices + expiring proposals).

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";

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
        const [organizationsResult, invoicesResult, proposalsResult] = await Promise.all([
            db.from("organizations").select("id, name, subscription_tier"),
            db
                .from("invoices")
                .select("id, invoice_number, status, due_date, balance_amount, total_amount, organization_id")
                .gt("balance_amount", 0)
                .in("status", ["issued", "partially_paid", "overdue"])
                .limit(600),
            db
                .from("proposals")
                .select("id, title, status, expires_at, total_price, client_selected_price, organization_id")
                .not("expires_at", "is", null)
                .gte("expires_at", now.toISOString())
                .lte("expires_at", threeDaysOutIso)
                .limit(300),
        ]);

        const organizations = (organizationsResult.data ?? []) as OrganizationRow[];
        const organizationMap = new Map(
            organizations.map((org) => [
                org.id,
                {
                    name: org.name?.trim() || "Unknown org",
                    tier: org.subscription_tier ?? "free",
                },
            ]),
        );

        const invoiceRows = (invoicesResult.data ?? []) as InvoiceRow[];
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

        const proposalRows = ((proposalsResult.data ?? []) as ProposalRow[]).sort((left, right) => {
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

        const proposalPayload = proposalRows.map((row) => {
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
        const expiringProposalsAmount = proposalRows.reduce((sum, row) => sum + proposalValue(row), 0);

        return NextResponse.json({
            generated_at: new Date().toISOString(),
            summary: {
                overdue_invoices_count: overdueInvoices.length,
                overdue_amount: asCurrency(overdueAmount),
                due_this_week_count: dueThisWeekInvoices.length,
                due_this_week_amount: asCurrency(dueThisWeekAmount),
                expiring_proposals_count: proposalRows.length,
                expiring_proposals_amount: asCurrency(expiringProposalsAmount),
            },
            invoices: filteredInvoices,
            proposals: filteredProposals,
        });
    } catch (error) {
        logError("[superadmin/collections]", error);
        return apiError("Failed to load collections workspace", 500);
    }
}
