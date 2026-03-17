/* ------------------------------------------------------------------
 * GET /api/admin/scorecards
 * Returns last 6 months of operator scorecards for current organization
 * ------------------------------------------------------------------ */

import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import { filterScorecardForTier, type OperatorScorecardPayload } from "@/lib/admin/operator-scorecard";
import type { Json } from "@/lib/database.types";

type ScorecardRow = {
  id: string;
  organization_id: string;
  month_key: string;
  score: number;
  status: string;
  payload: Json;
  pdf_generated_at: string | null;
  emailed_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;
    const { organizationId, adminClient } = authResult;

    if (!organizationId) {
      return apiError("Organization not configured", 400);
    }

    const { data: rows, error } = await adminClient
      .from("operator_scorecards")
      .select("*")
      .eq("organization_id", organizationId)
      .order("month_key", { ascending: false })
      .limit(6);

    if (error) {
      logError("[admin/scorecards] DB error", error);
      return apiError("Failed to fetch scorecards", 500);
    }

    const scorecards = (rows || []).map((row) => {
      const rawPayload = row.payload as unknown as OperatorScorecardPayload;
      const filteredPayload = filterScorecardForTier(rawPayload);

      return {
        id: row.id,
        monthKey: row.month_key,
        score: row.score,
        status: row.status,
        emailedAt: row.emailed_at,
        pdfGeneratedAt: row.pdf_generated_at,
        createdAt: row.created_at,
        payload: filteredPayload,
      };
    });

    return NextResponse.json({ data: { scorecards } });
  } catch (error) {
    logError("[/api/admin/scorecards:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
