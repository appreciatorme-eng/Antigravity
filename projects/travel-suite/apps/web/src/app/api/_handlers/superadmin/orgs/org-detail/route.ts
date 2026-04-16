// GET /api/superadmin/orgs/org-detail?orgId=<uuid>
// Returns an organization dossier sourced from the shared god mode account snapshot.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { buildBusinessImpact, getAccountDetail } from "@/lib/platform/god-accounts";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const orgId = request.nextUrl.searchParams.get("orgId")?.trim();
    if (!orgId) return apiError("orgId query parameter is required", 400);

    try {
        const detail = await getAccountDetail(auth.adminClient as never, orgId);
        if (!detail) return apiError("Organization not found", 404);

        const featuresUsed: string[] = [];
        if (detail.snapshot.member_count > 0) featuresUsed.push("Team");
        if (detail.snapshot.overdue_invoice_count > 0 || detail.snapshot.outstanding_balance > 0) featuresUsed.push("Invoicing");
        if (detail.snapshot.expiring_proposal_count > 0) featuresUsed.push("Proposals");
        if (detail.snapshot.open_support_count > 0) featuresUsed.push("Support");
        if (detail.snapshot.ai_requests_mtd > 0) featuresUsed.push("AI Assistant");
        if (detail.snapshot.open_error_count > 0) featuresUsed.push("Incident Tracking");

        return NextResponse.json({
            organization: {
                id: detail.organization.id,
                name: detail.organization.name,
                slug: detail.organization.slug,
                logo_url: null,
                primary_color: null,
                tier: detail.organization.tier,
                created_at: detail.organization.created_at,
                updated_at: detail.organization.updated_at,
                owner: detail.owner ? {
                    id: detail.owner.id,
                    full_name: detail.owner.name,
                    email: detail.owner.email,
                } : null,
            },
            last_org_activity: detail.snapshot.latest_org_activity,
            members: detail.members.map((member) => ({
                id: member.id,
                full_name: member.full_name,
                email: member.email,
                phone: null,
                role: member.role,
                avatar_url: null,
                created_at: member.created_at,
                last_sign_in_at: null,
                is_suspended: member.is_suspended,
            })),
            member_count: detail.snapshot.member_count,
            stats: {
                trips_total: 0,
                trips_last_30d: 0,
                trips_by_status: {},
                proposals_total: detail.expiring_proposals.length,
                proposals_last_30d: detail.expiring_proposals.length,
                proposals_won: 0,
                proposal_total_value: detail.expiring_proposals.reduce((sum, proposal) => sum + proposal.value, 0),
                proposal_total_value_label: detail.snapshot.expiring_proposal_value_label,
                proposal_won_value: 0,
                proposal_won_value_label: "₹0",
                invoices_total: detail.recent_invoices.length,
                invoices_overdue: detail.snapshot.overdue_invoice_count,
                total_billed: detail.snapshot.outstanding_balance,
                total_billed_label: detail.snapshot.outstanding_balance_label,
                total_outstanding: detail.snapshot.outstanding_balance,
                total_outstanding_label: detail.snapshot.outstanding_balance_label,
                overdue_amount: detail.snapshot.overdue_balance,
                overdue_amount_label: detail.snapshot.overdue_balance_label,
                total_collected: 0,
                total_collected_label: "₹0",
                support_tickets_open: detail.snapshot.open_support_count,
                support_tickets_resolved: 0,
                ai_spend_mtd_usd: detail.snapshot.ai_spend_mtd_usd,
                ai_requests_mtd: detail.snapshot.ai_requests_mtd,
            },
            features_used: featuresUsed,
            settings: null,
            account_state: detail.account_state,
            open_work_items: detail.work_items,
            business_impact: buildBusinessImpact(detail.account_state, detail.snapshot),
            recent_invoices: detail.recent_invoices,
            expiring_proposals: detail.expiring_proposals,
        });
    } catch (error) {
        logError("[superadmin/orgs/org-detail]", error);
        return apiError("Failed to load organization details", 500);
    }
}
