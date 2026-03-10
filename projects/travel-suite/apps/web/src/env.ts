import { z } from 'zod';

// Razorpay credentials are required in production — payments cannot function without them.
// Use VERCEL_ENV (set by Vercel platform) rather than NODE_ENV because Vercel sets
// NODE_ENV=production on ALL deployments including preview branches. VERCEL_ENV is
// 'production' only for the canonical production deployment.
const razorpayField = (isProduction: boolean) =>
  isProduction ? z.string().min(1) : z.string().min(1).optional();

const IS_PROD_ENV =
  process.env.VERCEL_ENV === 'production' ||
  // Non-Vercel environments (bare Node.js, Docker, etc.) fall back to NODE_ENV
  (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === 'production');

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  INTERNAL_API_SECRET: z.string().min(16).optional(),
  SOCIAL_TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
  SOCIAL_OAUTH_STATE_SECRET: z.string().min(16).optional(),
  ADMIN_CRON_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
  GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),
  GOOGLE_GEMINI_API_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  RAZORPAY_KEY_ID: razorpayField(IS_PROD_ENV),
  RAZORPAY_KEY_SECRET: razorpayField(IS_PROD_ENV),
  RAZORPAY_WEBHOOK_SECRET: razorpayField(IS_PROD_ENV),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_FROM_NAME: z.string().min(1).optional(),
  SENTRY_DSN: z.string().min(1).optional(),
  WPPCONNECT_BASE_URL: z.string().url().optional(),
  WPPCONNECT_TOKEN: z.string().min(1).optional(),
  WPPCONNECT_SESSION: z.string().min(1).optional(),
  WPPCONNECT_URL: z.string().url().optional(),
  WHATSAPP_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  WELCOME_FROM_EMAIL: z.string().email().optional(),
  FAL_KEY: z.string().min(1).optional(),
  META_APP_ID: z.string().min(1).optional(),
  META_APP_SECRET: z.string().min(1).optional(),
  META_REDIRECT_URI: z.string().url().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
});

const processEnv = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
  SOCIAL_TOKEN_ENCRYPTION_KEY: process.env.SOCIAL_TOKEN_ENCRYPTION_KEY,
  SOCIAL_OAUTH_STATE_SECRET: process.env.SOCIAL_OAUTH_STATE_SECRET,
  ADMIN_CRON_SECRET: process.env.ADMIN_CRON_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
  SENTRY_DSN: process.env.SENTRY_DSN,
  WPPCONNECT_BASE_URL: process.env.WPPCONNECT_BASE_URL,
  WPPCONNECT_TOKEN: process.env.WPPCONNECT_TOKEN,
  WPPCONNECT_SESSION: process.env.WPPCONNECT_SESSION,
  WPPCONNECT_URL: process.env.WPPCONNECT_URL,
  WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  WELCOME_FROM_EMAIL: process.env.WELCOME_FROM_EMAIL,
  FAL_KEY: process.env.FAL_KEY,
  META_APP_ID: process.env.META_APP_ID,
  META_APP_SECRET: process.env.META_APP_SECRET,
  META_REDIRECT_URI: process.env.META_REDIRECT_URI,
};

const merged = serverSchema.merge(clientSchema);
const parsed = merged.safeParse(processEnv);
const skipEnvValidation =
  process.env.SKIP_ENV_VALIDATION === 'true' ||
  process.env.SKIP_ENV_VALIDATION === '1' ||
  process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

if (!parsed.success) {
  console.error('❌ Invalid or missing environment variables:\n', parsed.error.flatten().fieldErrors);
  if (isProduction || !skipEnvValidation) {
    throw new Error(
      'Invalid environment variables. Fix env configuration before running in this environment.'
    );
  }

  console.warn('⚠️ SKIP_ENV_VALIDATION is enabled for non-production environment.');
}

export const env = parsed.success ? parsed.data : processEnv;
