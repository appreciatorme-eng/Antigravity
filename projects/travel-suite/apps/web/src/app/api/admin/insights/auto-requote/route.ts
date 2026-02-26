import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { clamp, daysSince, medianPrice, normalizeStatus, safeTitle, toNumber } from "@/lib/admin/insights";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
  daysBack: z.coerce.number().int().min(14).max(365).default(120),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const parsed = QuerySchema.safeParse({
    limit: new URL(req.url).searchParams.get("limit") || "12",
    daysBack: new URL(req.url).searchParams.get("daysBack") || "120",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 });
  }

  const since = new Date(Date.now() - parsed.data.daysBack * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin.adminClient
    .from("proposals")
    .select("id,title,status,total_price,created_at,updated_at,viewed_at,expires_at")
    .eq("organization_id", admin.organizationId)
    .gte("created_at", since)
    .in("status", ["draft", "sent", "viewed"])
    .order("updated_at", { ascending: true })
    .limit(300);

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to compute auto requote candidates" }, { status: 500 });
  }

  const proposals = data || [];
  const median = medianPrice(proposals.map((proposal) => toNumber(proposal.total_price, 0)));

  const candidates = proposals
    .map((proposal) => {
      const ageDays = daysSince(proposal.created_at) || 0;
      const staleDays = daysSince(proposal.updated_at || proposal.created_at) || 0;
      const viewedAge = daysSince(proposal.viewed_at) || 0;
      const daysToExpiry = proposal.expires_at
        ? (new Date(proposal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        : null;
      const price = toNumber(proposal.total_price, 0);

      let score = 0;
      const reasons: string[] = [];

      if (staleDays > 7) {
        score += 24;
        reasons.push("No update in over a week");
      }
      if (normalizeStatus(proposal.status) === "viewed" && viewedAge > 5) {
        score += 18;
        reasons.push("Client viewed but did not progress");
      }
      if (daysToExpiry !== null && daysToExpiry <= 2) {
        score += 26;
        reasons.push("Proposal close to expiry");
      }
      if (median > 0 && price > median * 1.28) {
        score += 16;
        reasons.push("Pricing above median benchmark");
      }
      if (ageDays > 14) {
        score += 12;
        reasons.push("Long sales cycle detected");
      }

      const requoteScore = clamp(Math.round(score), 0, 100);
      return {
        proposal_id: proposal.id,
        title: safeTitle(proposal.title),
        status: normalizeStatus(proposal.status),
        requote_score: requoteScore,
        reasons,
        suggested_delta_pct: requoteScore >= 70 ? -8 : requoteScore >= 45 ? -5 : -2,
      };
    })
    .filter((proposal) => proposal.requote_score >= 35)
    .sort((a, b) => b.requote_score - a.requote_score)
    .slice(0, parsed.data.limit);

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    analyzed: proposals.length,
    candidates,
  });
}
