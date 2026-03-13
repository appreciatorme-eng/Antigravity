import { apiError, apiSuccess } from "@/lib/api/response";
import type { Database, Json } from "@/lib/database.types";
import { requireAdmin } from "@/lib/auth/admin";
import { normalizeMarketplaceOptionList } from "@/lib/marketplace-options";
import { MARKETPLACE_PROFILE_SELECT } from "@/lib/marketplace/selects";

type MarketplaceProfileRow = Database["public"]["Tables"]["marketplace_profiles"]["Row"];

type RateCardItem = {
  id: string;
  service: string;
  margin: number;
};

type ComplianceDocument = {
  id: string;
  name: string;
  url: string;
  type: string;
  expiry_date?: string;
};

function isJsonRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRateCard(value: Json | null): RateCardItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isJsonRecord)
    .map((entry, index) => ({
      id:
        typeof entry.id === "string" && entry.id.trim().length > 0
          ? entry.id
          : `rate-${index + 1}`,
      service: typeof entry.service === "string" ? entry.service : "Service",
      margin: Number(entry.margin ?? 0),
    }))
    .filter((entry) => entry.service.trim().length > 0 && Number.isFinite(entry.margin));
}

function normalizeComplianceDocuments(value: Json | null): ComplianceDocument[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isJsonRecord)
    .map((entry, index) => ({
      id:
        typeof entry.id === "string" && entry.id.trim().length > 0
          ? entry.id
          : `doc-${index + 1}`,
      name: typeof entry.name === "string" ? entry.name : "Document",
      url: typeof entry.url === "string" ? entry.url : "",
      type: typeof entry.type === "string" ? entry.type : "Other",
      expiry_date:
        typeof entry.expiry_date === "string" && entry.expiry_date.length > 0
          ? entry.expiry_date
          : undefined,
    }))
    .filter((entry) => entry.name.trim().length > 0 && entry.url.trim().length > 0);
}

function normalizeMarketplaceProfile(profile: MarketplaceProfileRow | null) {
  return {
    description: profile?.description ?? "",
    service_regions: normalizeMarketplaceOptionList(profile?.service_regions),
    specialties: normalizeMarketplaceOptionList(profile?.specialties),
    margin_rate:
      typeof profile?.margin_rate === "number" && Number.isFinite(profile.margin_rate)
        ? profile.margin_rate
        : null,
    verification_status: profile?.verification_status ?? "none",
    gallery_urls: normalizeMarketplaceOptionList(profile?.gallery_urls, 40),
    rate_card: normalizeRateCard(profile?.rate_card ?? null),
    compliance_documents: normalizeComplianceDocuments(profile?.compliance_documents ?? null),
  };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { organizationId, adminClient } = auth;
    const admin = adminClient;

    const [{ data: organization, error: organizationError }, { data: marketplaceProfile, error: marketplaceError }] =
      await Promise.all([
        admin
          .from("organizations")
          .select("id, name, logo_url, subscription_tier")
          .eq("id", organizationId!)
          .maybeSingle(),
        admin
          .from("marketplace_profiles")
          .select(MARKETPLACE_PROFILE_SELECT)
          .eq("organization_id", organizationId!)
          .maybeSingle(),
      ]);

    if (organizationError) {
      console.error("[settings/marketplace] failed to load organization:", organizationError);
      return apiError("Failed to load marketplace settings", 500);
    }

    if (marketplaceError) {
      console.error("[settings/marketplace] failed to load marketplace profile:", marketplaceError);
      return apiError("Failed to load marketplace settings", 500);
    }
    const marketplaceProfileRow = marketplaceProfile as unknown as MarketplaceProfileRow | null;

    return apiSuccess({
      organization: organization ?? {
        id: organizationId!,
        name: "Organization",
        logo_url: null,
        subscription_tier: null,
      },
      profile: normalizeMarketplaceProfile(marketplaceProfileRow),
    });
  } catch (error) {
    console.error("[settings/marketplace] unexpected error:", error);
    return apiError("Failed to load marketplace settings", 500);
  }
}
