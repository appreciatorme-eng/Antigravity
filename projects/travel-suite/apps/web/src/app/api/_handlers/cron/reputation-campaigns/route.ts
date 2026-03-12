/* ------------------------------------------------------------------
 * Cron endpoint — Reputation Campaign Trigger
 *
 * Runs daily at 03:00 UTC. Discovers all organisations that have at
 * least one active reputation_review_campaign with trigger_event IN
 * ('trip_completed', 'trip_day_2') and calls triggerCampaignSendsForOrg
 * for each, using the service-role client so no user session is needed.
 *
 * Auth: CRON_SECRET / NOTIFICATION_CRON_SECRET header or bearer
 * (same pattern as cron/assistant-briefing).
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import {
  isCronSecretBearer,
  isCronSecretHeader,
} from "@/lib/security/cron-auth";
import { triggerCampaignSendsForOrg } from "@/lib/reputation/campaign-trigger";

type QueryErrorLike = { message: string } | null;

type UntypedBuilder = {
  select: (columns: string) => UntypedBuilder;
  eq: (column: string, value: unknown) => UntypedBuilder;
  in: (column: string, values: readonly string[]) => UntypedBuilder;
};

type UntypedSupabase = {
  from: (relation: string) => UntypedBuilder;
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const headerSecret =
      request.headers.get("x-cron-secret") ||
      request.headers.get("x-notification-cron-secret") ||
      "";

    if (
      !isCronSecretHeader(headerSecret) &&
      !isCronSecretBearer(authHeader)
    ) {
      return apiError("Unauthorized", 401);
    }

    const supabase = createAdminClient();

    const rawSupabase = supabase as unknown as UntypedSupabase;
    const { data: activeCampaigns, error: campaignsError } = await ((rawSupabase
      .from("reputation_review_campaigns")
      .select("organization_id")
      .eq("status", "active")
      .in("trigger_event", ["trip_completed", "trip_day_2"])) as unknown as Promise<{
      data: Array<{ organization_id: string }> | null;
      error: QueryErrorLike;
    }>);

    if (campaignsError) {
      throw campaignsError;
    }

    if (!activeCampaigns || activeCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        orgs_processed: 0,
        sends_created: 0,
        errors: 0,
      });
    }

    const orgIds: string[] = [
      ...new Set(
        activeCampaigns.map((campaign) => campaign.organization_id)
      ),
    ];

    let totalSends = 0;
    const allErrors: string[] = [];

    for (const orgId of orgIds) {
      const result = await triggerCampaignSendsForOrg(supabase, orgId);
      totalSends += result.sends_created;
      allErrors.push(...result.errors);
    }

    if (allErrors.length > 0) {
      console.error("[cron/reputation-campaigns] Partial errors:", allErrors);
    }

    return NextResponse.json({
      success: true,
      orgs_processed: orgIds.length,
      sends_created: totalSends,
      errors: allErrors.length,
    });
  } catch (error) {
    console.error("[cron/reputation-campaigns] Fatal error:", error);
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Request failed"),
      },
      { status: 500 }
    );
  }
}
