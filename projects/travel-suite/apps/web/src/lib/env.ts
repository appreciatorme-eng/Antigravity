/**
 * Environment variable validation.
 * Validated at module load time -- misconfigured deployments fail fast.
 *
 * Import from this module instead of process.env directly:
 *   import { env } from '@/lib/env';
 *   const key = env.RAZORPAY_KEY_SECRET;
 */
import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Razorpay
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),

  // AI providers
  OPENAI_API_KEY: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),

  // Email
  RESEND_API_KEY: z.string().min(1).optional(),
  PROPOSAL_FROM_EMAIL: z.string().email().optional(),
  WELCOME_FROM_EMAIL: z.string().email().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional().or(z.literal('')),

  // WhatsApp
  WHATSAPP_API_TOKEN: z.string().min(1).optional(),
  WHATSAPP_APP_SECRET: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),

  // Security
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  ADMIN_MUTATION_CSRF_TOKEN: z.string().min(1).optional(),
  HEALTHCHECK_TOKEN: z.string().min(1).optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),

  // Maps
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).optional(),

  // Feature flags
  SOCIAL_PUBLISH_MOCK_ENABLED: z.string().optional(),
  NEXT_PUBLIC_DEMO_MODE_ENABLED: z.string().optional(),
  RATE_LIMIT_FAIL_OPEN: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables.
 * In production, missing required vars (SUPABASE_*) will throw at startup.
 */
export const env: Env = envSchema.parse(process.env);

/**
 * Check if running in production environment.
 */
export const isProduction = (): boolean => env.NODE_ENV === 'production';

/**
 * Check if Redis is configured (required for rate limiting and cron dedup).
 */
export const isRedisConfigured = (): boolean =>
  Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
