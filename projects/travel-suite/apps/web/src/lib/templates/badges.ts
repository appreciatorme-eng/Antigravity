import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type BadgeTier = "none" | "bronze" | "silver" | "gold";

/**
 * Calculate badge tier based on template count
 * - none: 0 templates
 * - bronze: 1-4 templates
 * - silver: 5-9 templates
 * - gold: 10+ templates
 */
function calculateBadgeTier(templateCount: number): BadgeTier {
  if (templateCount === 0) return "none";
  if (templateCount >= 10) return "gold";
  if (templateCount >= 5) return "silver";
  return "bronze";
}

/**
 * Calculate and update contributor badge tier for an organization
 * based on their published template count
 */
export async function updateContributorBadge(params: {
  organizationId: string;
  adminClient?: ReturnType<typeof createAdminClient>;
}): Promise<{ success: boolean; tier: BadgeTier; error?: string }> {
  const client = params.adminClient || createAdminClient();

  try {
    // Count active templates published by this organization
    // Note: itinerary_templates table added via migration 20260316140000_create_itinerary_templates.sql
    // Types will be regenerated after migration is applied
    const { count, error: countError } = await client
      .from("itinerary_templates" as never)
      .select("id", { count: "exact", head: true })
      .eq("published_by_org_id", params.organizationId)
      .eq("is_active", true);

    if (countError) {
      return {
        success: false,
        tier: "none",
        error: `Failed to count templates: ${countError.message}`,
      };
    }

    const templateCount = count || 0;
    const badgeTier = calculateBadgeTier(templateCount);

    // Update all profiles for this organization with the new badge tier
    // Note: contributor_badge_tier column added via migration 20260325000003_add_contributor_badges.sql
    // Types will be regenerated after migration is applied
    const { error: updateError } = await client
      .from("profiles")
      .update({ contributor_badge_tier: badgeTier } as never)
      .eq("organization_id", params.organizationId);

    if (updateError) {
      return {
        success: false,
        tier: badgeTier,
        error: `Failed to update badge: ${updateError.message}`,
      };
    }

    return {
      success: true,
      tier: badgeTier,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      tier: "none",
      error: `Unexpected error: ${message}`,
    };
  }
}
