"use client";

import type { ToastOptions } from "@/components/ui/toast";

type ToastFn = (options: ToastOptions) => string;

type SocialOAuthTarget = {
  provider: "google" | "facebook" | "linkedin";
  label: string;
  url: string;
};

type OAuthStatusResponse = {
  provider: string;
  configured: boolean;
  missing?: string[];
};

const ENV_LABELS: Record<string, string> = {
  GOOGLE_CLIENT_ID: "Google client ID",
  GOOGLE_CLIENT_SECRET: "Google client secret",
  LINKEDIN_CLIENT_ID: "LinkedIn client ID",
  LINKEDIN_CLIENT_SECRET: "LinkedIn client secret",
  META_APP_ID: "Meta app ID",
  META_APP_SECRET: "Meta app secret",
  META_REDIRECT_URI: "Meta redirect URI",
};

function formatMissingConfig(missing: string[] = []) {
  if (missing.length === 0) return "OAuth credentials";
  return missing.map((key) => ENV_LABELS[key] ?? key).join(", ");
}

export async function checkOAuthAndRedirect(
  target: SocialOAuthTarget,
  toast: ToastFn,
) {
  try {
    const res = await fetch(`/api/social/oauth/status?provider=${target.provider}`);
    const data = (await res.json()) as OAuthStatusResponse;

    if (!data.configured) {
      toast({
        title: "Not configured yet",
        description: `${target.label} integration hasn't been set up. Missing: ${formatMissingConfig(data.missing)}.`,
        variant: "error",
      });
      return;
    }

    window.location.href = target.url;
  } catch {
    toast({ title: "Connection check failed", variant: "error" });
  }
}
