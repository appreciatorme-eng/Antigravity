const DEV_FALLBACK_URL = "http://127.0.0.1:54321";
const DEV_FALLBACK_ANON_KEY = "dev-anon-key";
let warnedFallback = false;

function isProductionLikeEnvironment(): boolean {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  const vercelEnv = process.env.VERCEL_ENV?.toLowerCase();
  return nodeEnv === "production" || vercelEnv === "production";
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

  if (!allowDevFallback()) {
    throw new Error(
      `Missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY for ${context}`
    );
  }

  if (!warnedFallback) {
    warnedFallback = true;
    console.warn(
      "Supabase public env vars missing. Falling back to local dev defaults. " +
        "Set ALLOW_SUPABASE_DEV_FALLBACK=false to disable fallback."
    );
  }

  return {
    supabaseUrl: DEV_FALLBACK_URL,
    supabaseAnonKey: DEV_FALLBACK_ANON_KEY,
  };
}
