// Proposal domain types — packaging tiers and pricing.
// Extends the proposals table added in migration 20260309200000.

export type ProposalPackageTier = "core" | "plus" | "signature";

export const PROPOSAL_PACKAGE_TIERS: ProposalPackageTier[] = [
  "core",
  "plus",
  "signature",
];

export const TIER_LABELS: Record<ProposalPackageTier, string> = {
  core: "Core",
  plus: "Plus",
  signature: "Signature",
};

export interface ProposalTierPricing {
  core?: number | null;
  plus?: number | null;
  signature?: number | null;
}

export function parseTierPricing(raw: unknown): ProposalTierPricing {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const asPrice = (v: unknown): number | null => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  return {
    core: asPrice(obj.core),
    plus: asPrice(obj.plus),
    signature: asPrice(obj.signature),
  };
}

export function tierPrice(
  pricing: ProposalTierPricing,
  tier: ProposalPackageTier
): number | null {
  return pricing[tier] ?? null;
}
