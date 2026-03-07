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

  return providedSecret?.trim() === expectedSecret.trim();
}
