import { createClient as createServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/observability/logger";

export type ComparableTrip = {
  destination: string;
  durationDays: number;
  pricePerPerson: number;
  groupSize: number;
  packageTier: string | null;
  seasonMonth: number; // 1-12
  organizationHash: string; // anonymized org identifier
  matchScore: number; // 0-100, how similar to the query
};

export type ComparableTripQuery = {
  destination: string;
  durationDays: number;
  groupSize?: number;
  packageTier?: string;
  month?: number; // 1-12, for seasonal matching
};

type HistoricalTripData = {
  amountInr: number;
  destination: string | null;
  durationDays: number | null;
  packageTier: string | null;
  paidAt: string | null;
  organizationId: string;
  clientSelectedPrice: number | null;
  totalPrice: number | null;
};

/**
 * Normalize destination string for fuzzy matching
 */
function normalizeDestination(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

/**
 * Create anonymized hash from organization ID
 * Uses first 8 chars of org ID to provide consistent but anonymous identifier
 */
function anonymizeOrgId(orgId: string): string {
  return `org_${orgId.substring(0, 8)}`;
}

/**
 * Extract month from ISO date string
 */
function getMonthFromDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.getMonth() + 1; // 1-12
}

/**
 * Calculate match score (0-100) based on similarity to query
 */
function calculateMatchScore(
  trip: HistoricalTripData,
  query: ComparableTripQuery
): number {
  let score = 0;

  // Destination match (40 points)
  const tripDest = normalizeDestination(trip.destination);
  const queryDest = normalizeDestination(query.destination);
  if (tripDest && queryDest) {
    if (tripDest === queryDest) {
      score += 40;
    } else if (tripDest.includes(queryDest) || queryDest.includes(tripDest)) {
      score += 30;
    } else if (tripDest.split(/\s+/).some((word) => queryDest.includes(word))) {
      score += 15;
    }
  }

  // Duration match (30 points)
  if (trip.durationDays && query.durationDays) {
    const durationDelta = Math.abs(trip.durationDays - query.durationDays);
    if (durationDelta === 0) {
      score += 30;
    } else if (durationDelta === 1) {
      score += 20;
    } else if (durationDelta === 2) {
      score += 10;
    }
  }

  // Package tier match (15 points)
  if (query.packageTier && trip.packageTier) {
    if (trip.packageTier.toLowerCase() === query.packageTier.toLowerCase()) {
      score += 15;
    }
  }

  // Seasonal match (15 points)
  if (query.month && trip.paidAt) {
    const tripMonth = getMonthFromDate(trip.paidAt);
    if (tripMonth) {
      const monthDelta = Math.abs(tripMonth - query.month);
      const seasonalDelta = Math.min(monthDelta, 12 - monthDelta); // wrap around
      if (seasonalDelta === 0) {
        score += 15;
      } else if (seasonalDelta === 1) {
        score += 10;
      } else if (seasonalDelta <= 2) {
        score += 5;
      }
    }
  }

  return Math.min(score, 100);
}

/**
 * Load historical trip data from paid payment links
 */
async function loadHistoricalTrips(
  supabase: SupabaseClient,
  excludeOrgId?: string
): Promise<HistoricalTripData[]> {
  // Fetch paid payment links
  const { data: paymentLinks, error: paymentError } = await supabase
    .from("payment_links")
    .select("amount_paise, proposal_id, organization_id, paid_at")
    .eq("status", "paid")
    .not("proposal_id", "is", null)
    .not("paid_at", "is", null)
    .order("paid_at", { ascending: false })
    .limit(500); // Limit to recent 500 for performance

  if (paymentError) {
    throw paymentError;
  }

  if (!paymentLinks || paymentLinks.length === 0) {
    return [];
  }

  // Extract unique proposal IDs
  const proposalIds: string[] = [
    ...new Set(
      paymentLinks
        .map((row) => row.proposal_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    ),
  ];

  if (proposalIds.length === 0) {
    return [];
  }

  // Fetch proposals with template information
  const { data: proposals, error: proposalError } = await supabase
    .from("proposals")
    .select("id, template_id, package_tier, client_selected_price, total_price, organization_id")
    .in("id", proposalIds);

  if (proposalError) {
    throw proposalError;
  }

  if (!proposals || proposals.length === 0) {
    return [];
  }

  // Extract unique template IDs
  const templateIds: string[] = [
    ...new Set(
      proposals
        .map((row) => row.template_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    ),
  ];

  // Fetch templates
  const { data: templates, error: templateError } =
    templateIds.length > 0
      ? await supabase
          .from("tour_templates")
          .select("id, destination, duration_days")
          .in("id", templateIds)
      : { data: [], error: null };

  if (templateError) {
    throw templateError;
  }

  // Create lookup maps
  const proposalMap = new Map(proposals.map((p) => [p.id, p]));
  const templateMap = new Map((templates || []).map((t) => [t.id, t]));

  // Combine data
  const historicalTrips: HistoricalTripData[] = [];

  for (const link of paymentLinks) {
    if (!link.proposal_id) continue;

    const proposal = proposalMap.get(link.proposal_id);
    if (!proposal || !proposal.template_id) continue;

    // Exclude trips from the querying organization (cross-org data only)
    if (excludeOrgId && proposal.organization_id === excludeOrgId) continue;

    const template = templateMap.get(proposal.template_id);
    if (!template) continue;

    historicalTrips.push({
      amountInr: Math.round(Number(link.amount_paise || 0) / 100),
      destination: template.destination,
      durationDays: template.duration_days,
      packageTier: proposal.package_tier,
      paidAt: link.paid_at,
      organizationId: proposal.organization_id,
      clientSelectedPrice: proposal.client_selected_price,
      totalPrice: proposal.total_price,
    });
  }

  return historicalTrips;
}

/**
 * Find comparable trips based on query parameters
 * Returns up to maxResults trips, anonymized and sorted by match score
 */
export async function findComparableTrips(
  query: ComparableTripQuery,
  options: {
    maxResults?: number;
    minMatchScore?: number;
    excludeOrgId?: string;
    supabaseClient?: SupabaseClient;
  } = {}
): Promise<ComparableTrip[]> {
  const {
    maxResults = 3,
    minMatchScore = 40,
    excludeOrgId,
    supabaseClient,
  } = options;

  try {
    const supabase = supabaseClient || (await createServerClient());

    // Load historical trip data
    const historicalTrips = await loadHistoricalTrips(supabase, excludeOrgId);

    if (historicalTrips.length === 0) {
      return [];
    }

    // Calculate match scores and filter
    const scoredTrips = historicalTrips
      .map((trip) => ({
        trip,
        score: calculateMatchScore(trip, query),
      }))
      .filter(({ score }) => score >= minMatchScore)
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, maxResults);

    // Transform to anonymized comparable trips
    const comparableTrips: ComparableTrip[] = scoredTrips.map(({ trip, score }) => {
      const groupSize = query.groupSize || 2; // Default assumption
      const pricePerPerson = Math.round(trip.amountInr / groupSize);

      return {
        destination: trip.destination || "Unknown",
        durationDays: trip.durationDays || 0,
        pricePerPerson,
        groupSize,
        packageTier: trip.packageTier,
        seasonMonth: getMonthFromDate(trip.paidAt) || 0,
        organizationHash: anonymizeOrgId(trip.organizationId),
        matchScore: score,
      };
    });

    return comparableTrips;
  } catch (error) {
    logError("[pricing/comparable-trips] Failed to find comparable trips", error);
    return [];
  }
}

/**
 * Get pricing statistics from comparable trips
 */
export function getComparableTripStats(trips: ComparableTrip[]) {
  if (trips.length === 0) {
    return null;
  }

  const prices = trips.map((t) => t.pricePerPerson);
  const sortedPrices = [...prices].sort((a, b) => a - b);

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const median =
    sortedPrices.length % 2 === 0
      ? Math.round(
          (sortedPrices[sortedPrices.length / 2 - 1]! + sortedPrices[sortedPrices.length / 2]!) / 2
        )
      : sortedPrices[Math.floor(sortedPrices.length / 2)]!;

  const average = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

  return {
    min,
    max,
    median,
    average,
    sampleSize: trips.length,
    avgMatchScore: Math.round(trips.reduce((sum, t) => sum + t.matchScore, 0) / trips.length),
  };
}
