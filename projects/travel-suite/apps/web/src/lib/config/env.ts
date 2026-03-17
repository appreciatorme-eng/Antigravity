import { env as rawEnv } from "@/env";

function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
}

export const env = {
  razorpay: {
    keyId: firstDefined(rawEnv.RAZORPAY_KEY_ID),
    keySecret: firstDefined(rawEnv.RAZORPAY_KEY_SECRET),
    publicKeyId: firstDefined(rawEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID),
    webhookSecret: firstDefined(rawEnv.RAZORPAY_WEBHOOK_SECRET),
  },
  supabase: {
    url: firstDefined(rawEnv.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: firstDefined(rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: firstDefined(rawEnv.SUPABASE_SERVICE_ROLE_KEY),
  },
  // WhatsApp: Meta Cloud API only. WPPConnect path removed — see CLAUDE.md.
  wppconnect: {
    baseUrl: firstDefined(rawEnv.WPPCONNECT_BASE_URL),
    token: firstDefined(rawEnv.WPPCONNECT_TOKEN),
  },
  resend: {
    apiKey: firstDefined(rawEnv.RESEND_API_KEY),
    fromEmail: firstDefined(rawEnv.RESEND_FROM_EMAIL, rawEnv.WELCOME_FROM_EMAIL),
    fromName: firstDefined(rawEnv.RESEND_FROM_NAME) ?? "TripBuilt",
  },
  sentry: {
    dsn: firstDefined(rawEnv.NEXT_PUBLIC_SENTRY_DSN, rawEnv.SENTRY_DSN),
  },
  posthog: {
    key: firstDefined(rawEnv.NEXT_PUBLIC_POSTHOG_KEY),
  },
  google: {
    placesApiKey: firstDefined(rawEnv.GOOGLE_PLACES_API_KEY, rawEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
    geminiApiKey: firstDefined(rawEnv.GOOGLE_GEMINI_API_KEY, rawEnv.GOOGLE_API_KEY),
  },
  app: {
    url: firstDefined(rawEnv.NEXT_PUBLIC_APP_URL),
  },
};

export function missingEnv(values: Record<string, string | undefined>): string[] {
  return Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}
