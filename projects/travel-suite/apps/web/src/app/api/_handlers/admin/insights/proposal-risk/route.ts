import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import {
  computeProposalRisk,
  medianPrice,
  safeTitle,
  toNumber,
} from "@/lib/admin/insights";
import { isLostProposal, isWonProposal } from "@/lib/admin/proposal-outcomes";
import { logError } from "@/lib/observability/logger";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    if (!admin.organizationId) {
      return apiError("Admin organization not configured", 400);
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
        "id,title,status,expires_at,created_at,updated_at,total_price,client_selected_price,viewed_at,client_id,trips:trip_id(status)"
      )
      .eq("organization_id", admin.organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return apiError("Failed to compute proposal risk", 500);
    }

    type ProposalInsightRow = {
      id: string;
      title: string | null;
      status: string | null;
      expires_at: string | null;
      created_at: string | null;
      updated_at: string | null;
      total_price: number | null;
      client_selected_price: number | null;
      viewed_at: string | null;
      client_id: string | null;
      trips: { status: string | null } | { status: string | null }[] | null;
    };

    const rows = (proposals || []) as ProposalInsightRow[];
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

    const allRiskRows = rows
      .map((row) => {
        const effectiveStatus = isWonProposal(row)
          ? "converted"
          : isLostProposal(row)
            ? "rejected"
            : row.status || "draft";

        const risk = computeProposalRisk({
          status: effectiveStatus,
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
          status: effectiveStatus,
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

    const stageCounts = allRiskRows.reduce(
      (acc, row) => {
        const status = (row.status || "draft").toLowerCase();
        const key =
          status === "accepted" || status === "confirmed" || status === "converted"
            ? "paid"
            : status === "expired" || status === "cancelled" || status === "rejected"
              ? "lost"
              : status === "sent" || status === "viewed" || status === "draft"
                ? status
                : "draft";
        acc[key].count += 1;
        acc[key].value += row.value;
        return acc;
      },
      {
        draft: { count: 0, value: 0 },
        sent: { count: 0, value: 0 },
        viewed: { count: 0, value: 0 },
        paid: { count: 0, value: 0 },
        lost: { count: 0, value: 0 },
      },
    );

    const high = allRiskRows.filter((row) => row.risk_level === "high").length;
    const medium = allRiskRows.filter((row) => row.risk_level === "medium").length;
    const low = allRiskRows.length - high - medium;
    const riskRows = allRiskRows.slice(0, limit);

    return NextResponse.json({
      summary: {
        analyzed: allRiskRows.length,
        high_risk: high,
        medium_risk: medium,
        low_risk: low,
        org_median_proposal_value: Number(orgMedian.toFixed(2)),
        stage_counts: stageCounts,
      },
      proposals: riskRows,
    });
  } catch (error) {
    logError("[/api/admin/insights/proposal-risk:GET] Unhandled error", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
