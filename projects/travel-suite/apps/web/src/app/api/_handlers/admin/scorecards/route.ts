/* ------------------------------------------------------------------
 * GET /api/admin/scorecards
 * Returns last 6 months of operator scorecards for current organization
 * ------------------------------------------------------------------ */

import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import { filterScorecardForTier, type OperatorScorecardPayload } from "@/lib/admin/operator-scorecard";

const SCORECARDS_RATE_LIMIT_MAX = 60;
const SCORECARDS_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export async function GET(request: Request): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;
    const { organizationId, adminClient, userId } = authResult;

    const rateLimit = await enforceRateLimit({
      identifier: userId,
      limit: SCORECARDS_RATE_LIMIT_MAX,
      windowMs: SCORECARDS_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:scorecards",
    });
    if (!rateLimit.success) {
      return apiError("Too many scorecard requests. Please retry later.", 429);
    }

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

    return NextResponse.json({ scorecards });
  } catch (error) {
    logError("[/api/admin/scorecards:GET] Unhandled error", error);
    return apiError("An unexpected error occurred. Please try again.", 500);
  }
}
