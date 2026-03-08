"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

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

type MarketplaceFormState = {
  description: string;
  service_regions: string[];
  specialties: string[];
  margin_rate: number | null;
  verification_status: string;
  gallery_urls: string[];
  rate_card: RateCardItem[];
  compliance_documents: ComplianceDocument[];
};

type MarketplaceSettingsResponse = {
  data: {
    organization: {
      id: string;
      name: string;
      logo_url: string | null;
      subscription_tier: string | null;
    };
    profile: MarketplaceFormState;
  } | null;
  error: string | null;
};

type MarketplaceOrganization = NonNullable<MarketplaceSettingsResponse["data"]>["organization"];

type MarketplaceStatsResponse = {
  views?: number;
  inquiries?: number;
  conversion_rate?: string | number;
  recent_views?: Array<{ organizations?: { name?: string | null } | Array<{ name?: string | null }> | null }>;
  recent_inquiries?: Array<{ organizations?: { name?: string | null } | Array<{ name?: string | null }> | null; message?: string | null }>;
  error?: string;
};

type MarketplaceOptionsResponse = {
  service_regions?: string[];
  specialties?: string[];
};

const DEFAULT_FORM_STATE: MarketplaceFormState = {
  description: "",
  service_regions: [],
  specialties: [],
  margin_rate: null,
  verification_status: "none",
  gallery_urls: [],
  rate_card: [],
  compliance_documents: [],
};

export function useMarketplacePresence() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<MarketplaceOrganization | null>(null);
  const [formData, setFormData] = useState<MarketplaceFormState>(DEFAULT_FORM_STATE);
  const [stats, setStats] = useState({
    views: 0,
    inquiries: 0,
    conversionRate: "0.0",
    recentViews: [] as string[],
    recentInquiries: [] as string[],
  });
  const [options, setOptions] = useState({
    serviceRegions: [] as string[],
    specialties: [] as string[],
  });
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMarketplacePresence() {
      setLoading(true);
      setError(null);

      try {
        const [settingsResponse, statsResponse, optionsResponse] = await Promise.all([
          fetch("/api/settings/marketplace", { cache: "no-store" }),
          fetch("/api/marketplace/stats", { cache: "no-store" }),
          fetch("/api/marketplace/options", { cache: "no-store" }),
        ]);

        const settingsPayload = (await settingsResponse.json()) as MarketplaceSettingsResponse;
        const statsPayload = (await statsResponse.json()) as MarketplaceStatsResponse;
        const optionsPayload = (await optionsResponse.json()) as MarketplaceOptionsResponse;

        if (!settingsResponse.ok || !settingsPayload.data) {
          throw new Error(settingsPayload.error || "Failed to load marketplace presence");
        }

        if (cancelled) return;

        setOrganization(settingsPayload.data.organization);
        setFormData(settingsPayload.data.profile);
        setStats({
          views: Number(statsPayload.views ?? 0),
          inquiries: Number(statsPayload.inquiries ?? 0),
          conversionRate: String(statsPayload.conversion_rate ?? "0.0"),
          recentViews: (statsPayload.recent_views ?? [])
            .map((item) =>
              Array.isArray(item.organizations)
                ? item.organizations[0]?.name ?? null
                : item.organizations?.name ?? null
            )
            .filter((value): value is string => Boolean(value)),
          recentInquiries: (statsPayload.recent_inquiries ?? [])
            .map((item) =>
              Array.isArray(item.organizations)
                ? item.organizations[0]?.name ?? null
                : item.organizations?.name ?? null
            )
            .filter((value): value is string => Boolean(value)),
        });
        setOptions({
          serviceRegions: optionsPayload.service_regions ?? [],
          specialties: optionsPayload.specialties ?? [],
        });
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load marketplace presence"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMarketplacePresence();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const refresh = () => setRefreshTick((current) => current + 1);

  const save = async (requestVerification = false) => {
    setSaving(true);
    try {
      const response = await fetch("/api/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.description,
          service_regions: formData.service_regions,
          specialties: formData.specialties,
          margin_rate: formData.margin_rate,
          gallery_urls: formData.gallery_urls,
          rate_card: formData.rate_card,
          compliance_documents: formData.compliance_documents,
          ...(requestVerification ? { request_verification: true } : {}),
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save marketplace presence");
      }

      toast({
        title: requestVerification ? "Verification requested" : "Marketplace profile saved",
        variant: "success",
      });
      refresh();
    } catch (saveError) {
      toast({
        title: "Marketplace update failed",
        description:
          saveError instanceof Error ? saveError.message : "Failed to save marketplace settings",
        variant: "error",
      });
      throw saveError;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    error,
    organization,
    formData,
    setFormData,
    stats,
    options,
    refresh,
    saveChanges: () => save(false),
    requestVerification: () => save(true),
  };
}
