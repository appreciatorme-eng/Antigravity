const DEV_FALLBACK_URL = "http://127.0.0.1:54321";
const DEV_FALLBACK_ANON_KEY = "dev-anon-key";
let warnedFallback = false;

function isProductionLikeEnvironment(): boolean {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  const vercelEnv = process.env.VERCEL_ENV?.toLowerCase();
  return (
    nodeEnv === "production" ||
    vercelEnv === "production" ||
    vercelEnv === "preview"
  );
}

function allowDevFallback(): boolean {
  const explicit = process.env.ALLOW_SUPABASE_DEV_FALLBACK;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return !isProductionLikeEnvironment();
}

export function getSupabasePublicRuntimeConfig(context: string): {
  supabaseUrl: string;
  supabaseAnonKey: string;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (supabaseUrl && supabaseAnonKey) {
    return {
      supabaseUrl,
      supabaseAnonKey,
    };
  }

  const missing = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !supabaseAnonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);

  if (!allowDevFallback()) {
    console.error(
      `[supabase/env] Missing required env vars for ${context}: ${missing.join(", ")}. ` +
        "Refusing to start with dev fallback in production/preview environment."
    );
    throw new Error(
      `Missing ${missing.join(", ")} — required for ${context}`
    );
  }

  if (!warnedFallback) {
    warnedFallback = true;
    console.error(
      `[supabase/env] Missing ${missing.join(", ")} for ${context}. ` +
        "Using local dev fallback. Set ALLOW_SUPABASE_DEV_FALLBACK=false to disable."
    );
  }

  return {
    supabaseUrl: DEV_FALLBACK_URL,
    supabaseAnonKey: DEV_FALLBACK_ANON_KEY,
  };
}
