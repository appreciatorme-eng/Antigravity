import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { clamp, medianPrice, normalizeStatus, safeTitle, toNumber } from "@/lib/admin/insights";

const QuerySchema = z.object({
  daysBack: z.coerce.number().int().min(14).max(365).default(90),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const parsed = QuerySchema.safeParse({
    daysBack: new URL(req.url).searchParams.get("daysBack") || "90",
    limit: new URL(req.url).searchParams.get("limit") || "12",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 });
  }

  const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();

  const [proposalRes, invoiceRes] = await Promise.all([
    admin.adminClient
      .from("proposals")
      .select("id,title,status,total_price,client_selected_price,created_at,expires_at")
      .eq("organization_id", admin.organizationId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(300),
    admin.adminClient
      .from("invoices")
      .select("id,trip_id,total_amount,status,created_at")
      .eq("organization_id", admin.organizationId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(400),
  ]);

  if (proposalRes.error || invoiceRes.error) {
    const err = proposalRes.error || invoiceRes.error;
    return NextResponse.json({ error: err?.message || "Failed to analyze margin leak" }, { status: 500 });
  }

  const proposals = proposalRes.data || [];
  const paidRevenue = (invoiceRes.data || [])
    .filter((invoice) => normalizeStatus(invoice.status) === "paid")
    .reduce((sum, invoice) => sum + toNumber(invoice.total_amount, 0), 0);

  const medianProposal = medianPrice(proposals.map((proposal) => toNumber(proposal.total_price, 0)));

  const leaks = proposals
    .map((proposal) => {
      const listed = toNumber(proposal.total_price, 0);
      const selected = toNumber(proposal.client_selected_price, listed);
      const discountPct = listed > 0 ? ((listed - selected) / listed) * 100 : 0;
      const ageDays = proposal.created_at
        ? Math.max(0, (Date.now() - new Date(proposal.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let score = 0;
      const reasons: string[] = [];

      if (listed > 0 && selected > 0 && discountPct >= 22) {
        score += 42;
        reasons.push(`Discount pressure high (${discountPct.toFixed(1)}%)`);
      }
      if (medianProposal > 0 && listed < medianProposal * 0.72) {
        score += 21;
        reasons.push("Quoted value significantly below org median");
      }
      if (["approved", "accepted", "confirmed"].includes(normalizeStatus(proposal.status)) && ageDays > 14) {
        score += 18;
        reasons.push("Approved deal ageing without fast conversion");
      }
      if (normalizeStatus(proposal.status) === "rejected") {
        score += 16;
        reasons.push("Recent rejection indicates pricing/fit friction");
      }

      score = clamp(Math.round(score), 0, 100);
      return {
        proposal_id: proposal.id,
        title: safeTitle(proposal.title),
        listed_price_usd: listed,
        selected_price_usd: selected,
        discount_pct: Number(discountPct.toFixed(1)),
        leak_score: score,
        reasons,
        recommendation:
          score >= 70
            ? "Requote with guarded margin floor and staged add-ons."
            : score >= 45
              ? "Review discounting and upsell packaging before close."
              : "Healthy margin posture; monitor only.",
      };
    })
    .filter((row) => row.leak_score >= 35)
    .sort((a, b) => b.leak_score - a.leak_score)
    .slice(0, parsed.data.limit);

  return NextResponse.json({
    window_days: parsed.data.daysBack,
    paid_revenue_usd: Number(paidRevenue.toFixed(2)),
    median_proposal_price_usd: Number(medianProposal.toFixed(2)),
    flagged_count: leaks.length,
    leaks,
  });
}
