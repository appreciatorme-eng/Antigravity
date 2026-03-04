import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { clamp, normalizeStatus, toNumber } from "@/lib/admin/insights";

const QuerySchema = z.object({
  windowDays: z.coerce.number().int().min(7).max(365).default(30),
});

function monthStartIso(date = new Date()): string {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return start.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    windowDays: searchParams.get("windowDays") || "30",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { windowDays } = parsed.data;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const [tripsRes, proposalsRes, clientsRes, invoicesRes, notificationsRes] = await Promise.all([
    admin.adminClient
      .from("trips")
      .select("id,status,created_at")
      .eq("organization_id", admin.organizationId)
      .gte("created_at", since),
    admin.adminClient
      .from("proposals")
      .select("id,status,created_at,viewed_at")
      .eq("organization_id", admin.organizationId)
      .gte("created_at", since),
    admin.adminClient
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", admin.organizationId),
    admin.adminClient
      .from("invoices")
      .select("status,total_amount,created_at")
      .eq("organization_id", admin.organizationId)
      .gte("created_at", since),
    admin.adminClient
      .from("notification_delivery_status")
      .select("id,status,created_at")
      .eq("organization_id", admin.organizationId)
      .gte("created_at", since),
  ]);

  if (tripsRes.error || proposalsRes.error || clientsRes.error || invoicesRes.error || notificationsRes.error) {
    const err =
      tripsRes.error ||
      proposalsRes.error ||
      clientsRes.error ||
      invoicesRes.error ||
      notificationsRes.error;
    return NextResponse.json({ error: err?.message || "Failed to load ROI metrics" }, { status: 500 });
  }

  const trips = tripsRes.data || [];
  const proposals = proposalsRes.data || [];
  const invoices = invoicesRes.data || [];
  const notifications = notificationsRes.data || [];

  const confirmedTripStatuses = new Set(["confirmed", "in_progress", "completed"]);
  const approvedProposalStatuses = new Set(["approved", "accepted", "converted"]);
  const notificationsSent = notifications.filter(
    (row) => normalizeStatus(row.status, "queued") === "sent"
  ).length;
  const tripsConverted = trips.filter((row) =>
    confirmedTripStatuses.has(normalizeStatus(row.status))
  ).length;
  const approvedProposals = proposals.filter((row) =>
    approvedProposalStatuses.has(normalizeStatus(row.status))
  ).length;
  const proposalsViewed = proposals.filter((row) => !!row.viewed_at).length;

  const paidRevenue = invoices
    .filter((row) => normalizeStatus(row.status) === "paid")
    .reduce((sum, row) => sum + toNumber(row.total_amount, 0), 0);

  const conversionRate = proposals.length > 0 ? (tripsConverted / proposals.length) * 100 : 0;
  const proposalApprovalRate =
    proposals.length > 0 ? (approvedProposals / proposals.length) * 100 : 0;
  const proposalViewRate = proposals.length > 0 ? (proposalsViewed / proposals.length) * 100 : 0;

  // Lightweight ROI proxy from operational effort automation.
  const hoursSaved = trips.length * 0.6 + proposals.length * 0.45 + notificationsSent * 0.03;
  const hourlyValueUsd = Number(process.env.ROI_HOURLY_VALUE_USD || "30");
  const estimatedValueCreatedUsd = hoursSaved * (Number.isFinite(hourlyValueUsd) ? hourlyValueUsd : 30);

  const activeClients = Number(clientsRes.count || 0);
  const throughputPerClient = activeClients > 0 ? trips.length / activeClients : 0;

  const automationLift = clamp((notificationsSent / Math.max(activeClients, 1)) * 12, 0, 30);
  const revenueLift = clamp(Math.log10(Math.max(paidRevenue, 1)) * 8, 0, 25);
  const roiScore = clamp(
    conversionRate * 0.35 + proposalViewRate * 0.2 + throughputPerClient * 18 + automationLift + revenueLift,
    0,
    100
  );

  const aiUsageMonth = monthStartIso();
  let aiUsage: {
    month_start: string;
    ai_requests: number;
    rag_hits: number;
    cache_hits: number;
    fallback_count: number;
    estimated_cost_usd: number;
  } | null = null;

  try {
    const { data: usage } = await admin.adminClient
      .from("organization_ai_usage")
      .select("month_start, ai_requests, rag_hits, cache_hits, fallback_count, estimated_cost_usd")
      .eq("organization_id", admin.organizationId)
      .eq("month_start", aiUsageMonth)
      .maybeSingle();
    aiUsage = usage || null;
  } catch {
    aiUsage = null;
  }

  const recommendations: string[] = [];
  if (conversionRate < 35) {
    recommendations.push("Improve conversion: prioritize high-risk proposals and auto-trigger follow-ups within 24h.");
  }
  if (proposalViewRate < 65) {
    recommendations.push("Improve engagement: send proposal nudges on WhatsApp within 2 hours of share.");
  }
  if (throughputPerClient < 0.3) {
    recommendations.push("Increase throughput: templatize your top 3 destinations and clone high-performing itineraries.");
  }
  if (recommendations.length === 0) {
    recommendations.push("ROI trend is healthy. Focus on upsell bundles to increase average order value.");
  }

  return NextResponse.json({
    windowDays,
    since,
    roi: {
      score: Number(roiScore.toFixed(1)),
      estimated_hours_saved: Number(hoursSaved.toFixed(1)),
      estimated_value_created_usd: Number(estimatedValueCreatedUsd.toFixed(2)),
    },
    performance: {
      active_clients: activeClients,
      trips_created: trips.length,
      trips_converted: tripsConverted,
      proposals_created: proposals.length,
      proposal_approval_rate: Number(proposalApprovalRate.toFixed(1)),
      proposal_view_rate: Number(proposalViewRate.toFixed(1)),
      conversion_rate: Number(conversionRate.toFixed(1)),
      notifications_sent: notificationsSent,
      paid_revenue_usd: Number(paidRevenue.toFixed(2)),
      throughput_per_client: Number(throughputPerClient.toFixed(3)),
    },
    ai_cost: aiUsage
      ? {
          month_start: aiUsage.month_start,
          ai_requests: toNumber(aiUsage.ai_requests, 0),
          rag_hits: toNumber(aiUsage.rag_hits, 0),
          cache_hits: toNumber(aiUsage.cache_hits, 0),
          fallback_count: toNumber(aiUsage.fallback_count, 0),
          estimated_cost_usd: Number(toNumber(aiUsage.estimated_cost_usd, 0).toFixed(4)),
        }
      : null,
    recommendations,
  });
}

