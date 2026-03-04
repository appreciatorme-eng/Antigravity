import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { daysSince, medianPrice, normalizeStatus, toNumber } from "@/lib/admin/insights";

const QuerySchema = z.object({
  daysBack: z.coerce.number().int().min(14).max(365).default(120),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const parsed = QuerySchema.safeParse({
    daysBack: new URL(req.url).searchParams.get("daysBack") || "120",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 });
  }

  const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin.adminClient
    .from("proposals")
    .select("id,status,total_price,created_at,viewed_at,expires_at")
    .eq("organization_id", admin.organizationId)
    .gte("created_at", since)
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to build win-loss insights" }, { status: 500 });
  }

  const proposals = data || [];
  const median = medianPrice(proposals.map((proposal) => toNumber(proposal.total_price, 0)));

  let wins = 0;
  let losses = 0;
  let staleViewed = 0;
  let noView = 0;
  let highPriceLossProxy = 0;

  for (const proposal of proposals) {
    const status = normalizeStatus(proposal.status);
    const price = toNumber(proposal.total_price, 0);

    if (["approved", "accepted", "converted", "confirmed"].includes(status)) {
      wins += 1;
      continue;
    }
    if (["rejected", "expired", "cancelled"].includes(status)) {
      losses += 1;
      if (median > 0 && price > median * 1.25) {
        highPriceLossProxy += 1;
      }
      continue;
    }

    if (!proposal.viewed_at) {
      noView += 1;
    } else if ((daysSince(proposal.viewed_at) || 0) > 5) {
      staleViewed += 1;
    }
  }

  const total = Math.max(proposals.length, 1);
  const winRate = (wins / total) * 100;
  const lossRate = (losses / total) * 100;

  const patterns = [
    {
      key: "no_view",
      label: "Unviewed proposals",
      count: noView,
      share_pct: Number(((noView / total) * 100).toFixed(1)),
      insight: "Large no-view share indicates distribution/follow-up timing friction.",
      action: "Trigger a WhatsApp nudge within 2 hours of proposal share.",
    },
    {
      key: "stale_viewed",
      label: "Viewed but stale",
      count: staleViewed,
      share_pct: Number(((staleViewed / total) * 100).toFixed(1)),
      insight: "Clients engage but stall before decision.",
      action: "Offer one constrained re-quote option plus urgency timeline.",
    },
    {
      key: "price_pressure",
      label: "High-price loss proxy",
      count: highPriceLossProxy,
      share_pct: Number(((highPriceLossProxy / Math.max(losses, 1)) * 100).toFixed(1)),
      insight: "Losses correlate with quotes materially above org median.",
      action: "Introduce price-banded packages and value framing comparisons.",
    },
  ];

  return NextResponse.json({
    window_days: parsed.data.daysBack,
    totals: {
      proposals: proposals.length,
      wins,
      losses,
      win_rate: Number(winRate.toFixed(1)),
      loss_rate: Number(lossRate.toFixed(1)),
    },
    patterns,
  });
}
