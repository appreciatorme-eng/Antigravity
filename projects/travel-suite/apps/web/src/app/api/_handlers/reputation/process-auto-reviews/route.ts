/* ------------------------------------------------------------------
 * Manual trigger endpoint — Auto Review Processing
 *
 * Manually triggers automatic review processing for marketing asset
 * generation. Can be called by cron jobs or for testing/fallback.
 * Processes all eligible 5-star reviews for specified organization
 * or all organizations if no organizationId provided.
 *
 * Auth uses the shared cron authorization helper with replay detection.
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import {
  processEligibleReviewsForOrganization,
  type AutoReviewProcessorResult,
} from "@/lib/reputation/auto-review-processor.server";
import { logError } from "@/lib/observability/logger";

type QueryErrorLike = { message: string } | null;

type UntypedBuilder = {
  select: (columns: string) => UntypedBuilder;
  eq: (column: string, value: unknown) => UntypedBuilder;
  in: (column: string, values: readonly string[]) => UntypedBuilder;
  limit: (count: number) => UntypedBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: QueryErrorLike }>;
  single: () => Promise<{ data: unknown; error: QueryErrorLike }>;
};

type UntypedSupabase = {
  from: (relation: string) => UntypedBuilder;
};

interface OrganizationRow {
  id: string;
}

interface ProfileRow {
  id: string;
  organization_id: string;
}

/**
 * Get a user ID for the organization to use for processing.
 * Returns the first profile found for the organization.
 */
async function getOrganizationUserId(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
): Promise<string | null> {
  const rawSupabase = supabase as unknown as UntypedSupabase;

  const { data: profile, error } = await ((rawSupabase
    .from("profiles")
    .select("id, organization_id")
    .eq("organization_id", organizationId)
    .limit(1)
    .maybeSingle()) as unknown as Promise<{
    data: ProfileRow | null;
    error: QueryErrorLike;
  }>);

  if (error || !profile) {
    return null;
  }

  return profile.id;
}

export async function POST(request: NextRequest) {
  try {
    const cronAuth = await authorizeCronRequest(request, {
      secretHeaderNames: ["x-cron-secret", "x-notification-cron-secret"],
      replayWindowMs: 10 * 60 * 1000,
    });
    if (!cronAuth.authorized) {
      return NextResponse.json({ error: cronAuth.reason }, { status: cronAuth.status });
    }

    const supabase = createAdminClient();
    const rawSupabase = supabase as unknown as UntypedSupabase;

    // Parse request body for optional organizationId
    const body = (await request.json().catch((e: unknown) => {
      logError("[process-auto-reviews] Failed to parse request body", e);
      return {};
    })) as {
      organizationId?: string;
      lookbackDays?: number;
    };

    const lookbackDays = body.lookbackDays ?? 7;
    let organizationIds: string[] = [];

    if (body.organizationId) {
      // Process single organization
      organizationIds = [body.organizationId];
    } else {
      // Fetch all organizations with reputation management enabled
      const { data: organizations, error: orgsError } = await ((rawSupabase
        .from("organizations")
        .select("id")) as unknown as Promise<{
        data: OrganizationRow[] | null;
        error: QueryErrorLike;
      }>);

      if (orgsError) {
        throw orgsError;
      }

      organizationIds = (organizations ?? []).map((org) => org.id);
    }

    if (organizationIds.length === 0) {
      return NextResponse.json({
        success: true,
        orgs_processed: 0,
        total_processed: 0,
        total_assets_generated: 0,
        total_errors: 0,
      });
    }

    let totalProcessed = 0;
    let totalAssetsGenerated = 0;
    const allErrors: string[] = [];
    let orgsProcessed = 0;

    for (const orgId of organizationIds) {
      // Get a user ID for this organization
      const userId = await getOrganizationUserId(supabase, orgId);

      if (!userId) {
        allErrors.push(`No user found for organization ${orgId}`);
        continue;
      }

      try {
        const result: AutoReviewProcessorResult = await processEligibleReviewsForOrganization({
          supabase,
          organizationId: orgId,
          userId,
          lookbackDays,
        });

        totalProcessed += result.processed;
        totalAssetsGenerated += result.assets_generated;
        allErrors.push(...result.errors);
        orgsProcessed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        allErrors.push(`Failed to process organization ${orgId}: ${errorMessage}`);
        logError(`[process-auto-reviews] Error processing org ${orgId}`, error);
      }
    }

    if (allErrors.length > 0) {
      logError("[process-auto-reviews] Completed with errors", allErrors);
    }

    return NextResponse.json({
      success: true,
      orgs_processed: orgsProcessed,
      total_processed: totalProcessed,
      total_assets_generated: totalAssetsGenerated,
      total_errors: allErrors.length,
      errors: allErrors.length > 0 ? allErrors : undefined,
    });
  } catch (error) {
    logError("[process-auto-reviews] Fatal error", error);
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Request failed"),
      },
      { status: 500 },
    );
  }
}
