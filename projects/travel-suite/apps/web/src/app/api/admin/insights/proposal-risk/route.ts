import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import {
  computeProposalRisk,
  medianPrice,
  safeTitle,
  toNumber,
} from "@/lib/admin/insights";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  if (!admin.organizationId) {
    return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    limit: searchParams.get("limit") || "25",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { limit } = parsed.data;
  const { data: proposals, error } = await admin.adminClient
    .from("proposals")
    .select(
      "id,title,status,expires_at,created_at,updated_at,total_price,client_selected_price,viewed_at,client_id"
    )
    .eq("organization_id", admin.organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = proposals || [];
  const clientIds = Array.from(
    new Set(rows.map((row) => row.client_id).filter((value): value is string => Boolean(value)))
  );

  let clientMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (clientIds.length > 0) {
    const { data: clients } = await admin.adminClient
      .from("profiles")
      .select("id,full_name,email")
      .in("id", clientIds);
    clientMap = new Map(
      (clients || []).map((client) => [
        client.id,
        { full_name: client.full_name || null, email: client.email || null },
      ])
    );
  }

  const orgMedian = medianPrice(rows.map((row) => row.client_selected_price ?? row.total_price));

  const riskRows = rows
    .map((row) => {
      const risk = computeProposalRisk({
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        expiresAt: row.expires_at,
        viewedAt: row.viewed_at,
        totalPrice: toNumber(row.client_selected_price ?? row.total_price, 0),
        orgMedianPrice: orgMedian,
      });

      const client = row.client_id ? clientMap.get(row.client_id) : null;
      return {
        proposal_id: row.id,
        title: safeTitle(row.title, "Untitled Proposal"),
        status: row.status || "draft",
        expires_at: row.expires_at,
        viewed_at: row.viewed_at,
        value: toNumber(row.client_selected_price ?? row.total_price, 0),
        risk_score: risk.score,
        risk_level: risk.level,
        reasons: risk.reasons,
        next_action: risk.nextAction,
        client: {
          id: row.client_id,
          full_name: client?.full_name || null,
          email: client?.email || null,
        },
      };
    })
    .sort((a, b) => b.risk_score - a.risk_score);

  const high = riskRows.filter((row) => row.risk_level === "high").length;
  const medium = riskRows.filter((row) => row.risk_level === "medium").length;
  const low = riskRows.length - high - medium;

  return NextResponse.json({
    summary: {
      analyzed: riskRows.length,
      high_risk: high,
      medium_risk: medium,
      low_risk: low,
      org_median_proposal_value: Number(orgMedian.toFixed(2)),
    },
    proposals: riskRows,
  });
}

