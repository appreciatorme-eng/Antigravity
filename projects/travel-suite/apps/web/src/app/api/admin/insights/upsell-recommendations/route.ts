import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { clamp, safeTitle, toNumber } from "@/lib/admin/insights";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(8),
  daysBack: z.coerce.number().int().min(14).max(365).default(90),
});

type AddOnMetrics = {
  addOnId: string;
  name: string;
  category: string;
  price: number;
  proposalShown: number;
  selected: number;
  purchased: number;
  attachRate: number;
  conversionRate: number;
  untappedRevenueUsd: number;
  score: number;
  recommendation: string;
};

function recommendationForMetric(metric: AddOnMetrics): string {
  if (metric.selected < 3) {
    return "Increase visibility in proposal templates and pin it in the first package.";
  }
  if (metric.conversionRate < 0.35) {
    return "Test value framing: show the add-on as a savings bundle versus standalone pricing.";
  }
  if (metric.conversionRate >= 0.65) {
    return "Promote this as a default-included premium option to increase package AOV.";
  }
  return "Add targeted follow-up messaging for clients who viewed but did not purchase.";
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    limit: searchParams.get("limit") || "8",
    daysBack: searchParams.get("daysBack") || "90",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { limit, daysBack } = parsed.data;
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const [addOnsRes, proposalsRes, tripsRes] = await Promise.all([
    admin.adminClient
      .from("add_ons")
      .select("id,name,category,price,is_active")
      .eq("organization_id", admin.organizationId)
      .eq("is_active", true),
    admin.adminClient
      .from("proposals")
      .select("id,created_at")
      .eq("organization_id", admin.organizationId)
      .gte("created_at", since),
    admin.adminClient
      .from("trips")
      .select("id,created_at")
      .eq("organization_id", admin.organizationId)
      .gte("created_at", since),
  ]);

  if (addOnsRes.error || proposalsRes.error || tripsRes.error) {
    const err = addOnsRes.error || proposalsRes.error || tripsRes.error;
    return NextResponse.json({ error: err?.message || "Failed to load upsell inputs" }, { status: 500 });
  }

  const addOns = addOnsRes.data || [];
  const proposalIds = (proposalsRes.data || []).map((row) => row.id);
  const tripIds = (tripsRes.data || []).map((row) => row.id);

  let proposalAddOns:
    | Array<{ add_on_id: string | null; proposal_id: string; is_selected: boolean | null }>
    | [] = [];
  if (proposalIds.length > 0) {
    const { data } = await admin.adminClient
      .from("proposal_add_ons")
      .select("add_on_id,proposal_id,is_selected")
      .in("proposal_id", proposalIds);
    proposalAddOns = (data || []) as Array<{
      add_on_id: string | null;
      proposal_id: string;
      is_selected: boolean | null;
    }>;
  }

  let clientAddOns: Array<{ add_on_id: string | null; amount_paid: number | null; status: string | null }> = [];
  if (tripIds.length > 0) {
    const { data } = await admin.adminClient
      .from("client_add_ons")
      .select("add_on_id,amount_paid,status,trip_id")
      .in("trip_id", tripIds);
    clientAddOns = (data || []) as Array<{
      add_on_id: string | null;
      amount_paid: number | null;
      status: string | null;
    }>;
  }

  const byAddOn = new Map<string, AddOnMetrics>();
  for (const addOn of addOns) {
    byAddOn.set(addOn.id, {
      addOnId: addOn.id,
      name: safeTitle(addOn.name, "Unnamed add-on"),
      category: safeTitle(addOn.category, "General"),
      price: toNumber(addOn.price, 0),
      proposalShown: 0,
      selected: 0,
      purchased: 0,
      attachRate: 0,
      conversionRate: 0,
      untappedRevenueUsd: 0,
      score: 0,
      recommendation: "",
    });
  }

  for (const row of proposalAddOns) {
    if (!row.add_on_id) continue;
    const metrics = byAddOn.get(row.add_on_id);
    if (!metrics) continue;
    metrics.proposalShown += 1;
    if (row.is_selected) {
      metrics.selected += 1;
    }
  }

  for (const row of clientAddOns) {
    if (!row.add_on_id) continue;
    const metrics = byAddOn.get(row.add_on_id);
    if (!metrics) continue;
    const status = (row.status || "").toLowerCase();
    if (status === "cancelled" || status === "failed") continue;
    metrics.purchased += 1;
  }

  const totalProposals = Math.max(proposalIds.length, 1);
  for (const metric of byAddOn.values()) {
    metric.attachRate = metric.selected / totalProposals;
    metric.conversionRate = metric.selected > 0 ? metric.purchased / metric.selected : 0;
    metric.untappedRevenueUsd = Math.max(metric.selected - metric.purchased, 0) * metric.price;

    const visibilityBoost = metric.proposalShown < totalProposals * 0.4 ? 18 : 0;
    const conversionGap = (1 - metric.conversionRate) * 40;
    const revenueOpportunity = Math.log10(Math.max(metric.untappedRevenueUsd, 1)) * 22;
    const categoryBoost =
      metric.category.toLowerCase() === "transport" || metric.category.toLowerCase() === "experience"
        ? 8
        : 0;

    metric.score = clamp(Math.round(visibilityBoost + conversionGap + revenueOpportunity + categoryBoost), 0, 100);
    metric.recommendation = recommendationForMetric(metric);
  }

  const ranked = Array.from(byAddOn.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const quickWins = ranked
    .filter((row) => row.score >= 55)
    .map((row) => `${row.name}: ${row.recommendation}`);

  return NextResponse.json({
    window_days: daysBack,
    analyzed: {
      active_add_ons: addOns.length,
      proposals: proposalIds.length,
      trips: tripIds.length,
    },
    recommendations: ranked.map((row) => ({
      add_on_id: row.addOnId,
      name: row.name,
      category: row.category,
      price_usd: Number(row.price.toFixed(2)),
      proposal_shown: row.proposalShown,
      selected_count: row.selected,
      purchased_count: row.purchased,
      attach_rate: Number((row.attachRate * 100).toFixed(1)),
      conversion_rate: Number((row.conversionRate * 100).toFixed(1)),
      untapped_revenue_usd: Number(row.untappedRevenueUsd.toFixed(2)),
      score: row.score,
      recommendation: row.recommendation,
    })),
    quick_wins: quickWins,
  });
}

