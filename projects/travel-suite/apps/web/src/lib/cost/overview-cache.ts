import { deleteCachedByPrefix } from "@/lib/cache/upstash";

export const COST_OVERVIEW_CACHE_VERSION = "v3";
export const COST_OVERVIEW_CACHE_TTL_SECONDS = 120;
export const COST_OVERVIEW_STALE_CACHE_TTL_SECONDS = 60 * 60;

export function buildCostOverviewCacheKey(params: {
  role: "admin" | "super_admin";
  organizationId: string | null;
  days: number;
}): string {
  const scope = params.organizationId || "global";
  return `admin:cost_overview:${COST_OVERVIEW_CACHE_VERSION}:${params.role}:${scope}:days:${params.days}`;
}

export function buildCostOverviewStaleCacheKey(cacheKey: string): string {
  return `${cacheKey}:stale`;
}

export function getCostOverviewCachePrefix(): string {
  return `admin:cost_overview:${COST_OVERVIEW_CACHE_VERSION}:`;
}

export async function invalidateCostOverviewCache(): Promise<number> {
  return deleteCachedByPrefix(getCostOverviewCachePrefix());
}
