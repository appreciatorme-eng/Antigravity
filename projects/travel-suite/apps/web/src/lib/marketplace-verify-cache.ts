import { deleteCachedByPrefix } from "@/lib/cache/upstash";

export const MARKETPLACE_VERIFY_CACHE_VERSION = 1;
export const MARKETPLACE_VERIFY_CACHE_TTL_SECONDS = 120;

const MARKETPLACE_VERIFY_CACHE_PREFIX = `admin:marketplace:verify:v${MARKETPLACE_VERIFY_CACHE_VERSION}:`;

function normalizeScopeOrganizationId(
  organizationId: string | null,
): string | null {
  const candidate = (organizationId || "").trim();
  return candidate.length > 0 ? candidate : null;
}

export function buildMarketplacePendingCacheKey(
  organizationId: string | null,
): string {
  const scopeOrganizationId = normalizeScopeOrganizationId(organizationId);
  const scope = scopeOrganizationId || "global";
  return `${MARKETPLACE_VERIFY_CACHE_PREFIX}pending:${scope}`;
}

export async function invalidateMarketplaceVerifyCache(): Promise<number> {
  return deleteCachedByPrefix(MARKETPLACE_VERIFY_CACHE_PREFIX, 500);
}
