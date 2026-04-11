import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { buildRevenueRiskActionQueue } from "@/lib/admin/action-queue";
import { isWonProposal } from "@/lib/admin/proposal-outcomes";
import { logError } from "@/lib/observability/logger";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
    }

    const parsed = QuerySchema.safeParse({
      limit: new URL(req.url).searchParams.get("limit") || "5",
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 });
    }

    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const todayISO = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [proposalRes, invoiceRes, tripRes, monthlyProposalRes, monthlyInvoiceRes] = await Promise.all([
      admin.adminClient
        .from("proposals")
        .select("id,title,status,expires_at")
        .eq("organization_id", admin.organizationId)
        .is("deleted_at", null)
        .in("status", ["draft", "sent", "viewed"])
        .not("expires_at", "is", null)
        .lte("expires_at", inThreeDays)
        .limit(60),
      admin.adminClient
        .from("invoices")
        .select("id,invoice_number,status,due_date,balance_amount")
        .eq("organization_id", admin.organizationId)
        .is("deleted_at", null)
        .in("status", ["issued", "partially_paid", "overdue"])
        .lt("due_date", todayISO)
        .limit(60),
      admin.adminClient
        .from("trips")
        .select("id,status,updated_at,start_date")
        .eq("organization_id", admin.organizationId)
        .is("deleted_at", null)
        .limit(120),
      admin.adminClient
        .from("proposals")
        .select("id,status,created_at,trips:trip_id(status)")
        .eq("organization_id", admin.organizationId)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo),
      admin.adminClient
        .from("invoices")
        .select("total_amount,status,created_at")
        .eq("organization_id", admin.organizationId)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo),
    ]);

    if (proposalRes.error || invoiceRes.error || tripRes.error || monthlyProposalRes.error || monthlyInvoiceRes.error) {
      return apiError("Failed to build daily brief", 500);
    }

    const queue = buildRevenueRiskActionQueue({
      proposals: proposalRes.data || [],
      invoices: invoiceRes.data || [],
      trips: tripRes.data || [],
    }).slice(0, parsed.data.limit);

    const monthlyProposals = monthlyProposalRes.data || [];
    const monthlyInvoices = monthlyInvoiceRes.data || [];

    const conversionCount = monthlyProposals.filter((proposal) => isWonProposal(proposal)).length;
    const conversionRate = monthlyProposals.length > 0 ? (conversionCount / monthlyProposals.length) * 100 : 0;

    const paidRevenue = monthlyInvoices
      .filter((invoice) => (invoice.status || "").toLowerCase() === "paid")
      .reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      top_actions: queue,
      metrics_snapshot: {
        proposal_count_30d: monthlyProposals.length,
        conversion_rate_30d: Number(conversionRate.toFixed(1)),
        paid_revenue_30d_usd: Number(paidRevenue.toFixed(2)),
      },
      narrative: [
        "Start with expiring proposals and overdue invoices to protect near-term revenue.",
        "Use bundled upsell offers on active high-intent trips to improve AOV.",
        "Requote stale viewed proposals before expiry to improve win rate.",
      ],
    });
  } catch (error) {
    logError("[/api/admin/insights/daily-brief:GET] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
