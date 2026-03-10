import { safeEqual } from "@/lib/security/safe-equal";

export function isSeedDemoBlockedInProduction(
  nodeEnv: string | undefined,
  allowSeedInProd: string | undefined
) {
  return nodeEnv === "production" && allowSeedInProd !== "true";
}

export function hasValidSeedDemoCronSecret(
  expectedSecret: string | undefined,
  providedSecret: string | null | undefined
) {
  if (!expectedSecret) {
    return true;
  }

  return safeEqual(providedSecret?.trim() ?? "", expectedSecret.trim());
}
