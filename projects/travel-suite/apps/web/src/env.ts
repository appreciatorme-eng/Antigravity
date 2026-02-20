import { z } from "zod";

/**
 * Define your server-side environment variables schema here.
 * This ensures they are properly typed and validated at build time.
 */
const serverSchema = z.object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    GOOGLE_API_KEY: z.string().min(1).optional(),
    GOOGLE_GEMINI_API_KEY: z.string().min(1).optional(),
});

/**
 * Define your client-side environment variables schema here.
 * Next.js automatically surfaces variables starting with NEXT_PUBLIC_ to the client.
 */
const clientSchema = z.object({
    // We make these strictly required string URLs
    // Though we accept any string right now to allow the fallback proxies to keep builds working.
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional(),
});

const processEnv = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
};

const merged = serverSchema.merge(clientSchema);
const parsed = merged.safeParse(processEnv);

if (!parsed.success) {
    console.error(
        "❌ Invalid or missing environment variables:\n",
        parsed.error.flatten().fieldErrors
    );
    // If we're strictly enforcing env validation, throw an error
    if (process.env.SKIP_ENV_VALIDATION !== "true" && process.env.SKIP_ENV_VALIDATION !== "1") {
        throw new Error("Invalid environment variables. Set SKIP_ENV_VALIDATION=true to ignore.");
    }
}

export const env = parsed.success ? parsed.data : processEnv;
