# Environment Variables Guide

All environment variables are validated at startup via Zod schemas in `src/env.ts` and `src/lib/env.ts`. Missing required variables cause a hard failure in production. In development, set `SKIP_ENV_VALIDATION=true` to bypass validation.

Variables are set in the **Vercel dashboard**, not in `.env` files committed to the repository.

---

## Supabase

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client | `https://<project-ref>.supabase.co` | Falls back to `http://127.0.0.1:54321` in local dev if `ALLOW_SUPABASE_DEV_FALLBACK` is not `false` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client | JWT string | Public anon key from Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | JWT string | Admin key -- never expose to browser |

## Razorpay (Payments)

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `RAZORPAY_KEY_ID` | No | Server | `rzp_live_...` or `rzp_test_...` | Server-side key ID |
| `RAZORPAY_KEY_SECRET` | No | Server | String | Server-side secret |
| `RAZORPAY_WEBHOOK_SECRET` | No | Server | String | Webhook signature verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | No | Client | `rzp_live_...` or `rzp_test_...` | Exposed to browser for checkout widget |

## WhatsApp -- Meta Cloud API (Primary)

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `WHATSAPP_API_TOKEN` | No | Server | String | Meta Cloud API access token. Aliased as `WHATSAPP_TOKEN` in some code paths |
| `WHATSAPP_PHONE_NUMBER_ID` | No | Server | Numeric string | Meta phone number ID. Aliased as `WHATSAPP_PHONE_ID` |
| `WHATSAPP_APP_SECRET` | No | Server | Hex string | Used for webhook signature verification |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | No | Server | String | Challenge token for webhook registration. Also reads `WHATSAPP_VERIFY_TOKEN` |
| `WHATSAPP_ALLOW_UNSIGNED_WEBHOOK` | No | Server | `true`/`false` | Dev-only: skip webhook signature checks |
| `WHATSAPP_TEMPLATE_LANG` | No | Server | `en` | Default language code for message templates |
| `WHATSAPP_TEMPLATE_*` | No | Server | Template name string | Override default template names per notification type (e.g., `WHATSAPP_TEMPLATE_PICKUP_CLIENT`) |

## WPPConnect / WAHA (Secondary -- Self-Hosted Fallback)

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `WPPCONNECT_BASE_URL` | No | Server | `http://localhost:21465` | Also reads `WPPCONNECT_URL` and `WAHA_URL` (first defined wins) |
| `WPPCONNECT_TOKEN` | No | Server | String | Also reads `WHATSAPP_API_KEY` as fallback |

## AI Providers

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `OPENAI_API_KEY` | No | Server | `sk-...` | Used by OpenAI SDK for assistant features |
| `GOOGLE_GEMINI_API_KEY` | No | Server | String | Google Gemini. Also reads `GOOGLE_API_KEY` as fallback |
| `GROQ_API_KEY` | No | Server | `gsk_...` | Groq inference API |
| `FAL_KEY` | No | Server | String | Fal.ai image generation (social poster) |

## Email (Resend)

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `RESEND_API_KEY` | No | Server | `re_...` | Resend transactional email |
| `RESEND_FROM_EMAIL` | No | Server | `noreply@tripbuilt.com` | Sender address. Also reads `WELCOME_FROM_EMAIL` as fallback |
| `RESEND_FROM_NAME` | No | Server | `TripBuilt` | Defaults to `TripBuilt` if not set |
| `PROPOSAL_FROM_EMAIL` | No | Server | `proposals@tripbuilt.com` | Sender for proposal payment plan emails |

## Firebase (Push Notifications)

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `FIREBASE_PROJECT_ID` | No | Server | `my-project-id` | FCM push notification project |
| `FIREBASE_SERVICE_ACCOUNT` | No | Server | JSON string | Service account credentials (stringified JSON) |
| `FIREBASE_PRIVATE_KEY` | No | Server | PEM key string | Alternative to full service account JSON |

## Upstash (Rate Limiting)

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `UPSTASH_REDIS_REST_URL` | No | Server | `https://....upstash.io` | Required for rate limiting. Without it, rate limiting **fails closed** in production (requests rejected) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Server | String | Paired with URL above |

## Cron / Internal Security

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `CRON_SECRET` | No | Server | Random string | Vercel cron job authentication |
| `ADMIN_CRON_SECRET` | No | Server | Random string | Admin seed/demo cron authentication |
| `INTERNAL_API_SECRET` | No | Server | Min 16 chars | Internal service-to-service auth (e.g., lead conversion) |
| `ADMIN_MUTATION_CSRF_TOKEN` | No | Server | String | CSRF protection for admin mutations. Falls back to same-origin check if unset |
| `HEALTHCHECK_TOKEN` | No | Server | String | Bearer token for detailed health diagnostics |

## App / Domain

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `NEXT_PUBLIC_APP_URL` | No | Client | `https://tripbuilt.com` | Used for CORS allowed origins and canonical URLs |
| `ALLOWED_ORIGINS` | No | Server | Comma-separated URLs | CORS override. Defaults to `NEXT_PUBLIC_APP_URL` |

## Analytics / Monitoring

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | No | Client | `phc_...` | PostHog product analytics |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Client | `https://...@sentry.io/...` | Sentry error tracking (client-side) |
| `SENTRY_DSN` | No | Server | `https://...@sentry.io/...` | Sentry error tracking (server-side). Either DSN works for server config |

## Travel APIs

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `AMADEUS_CLIENT_ID` | No | Server | String | Amadeus flight/hotel API |
| `AMADEUS_CLIENT_SECRET` | No | Server | String | Paired with client ID |
| `AMADEUS_ENV` | No | Server | `production` or `test` | Defaults to `production`. Controls API base URL |
| `AMADEUS_BASE_URL` | No | Server | URL | Explicit override for Amadeus API URL |
| `GOOGLE_PLACES_API_KEY` | No | Server | String | Google Places API. Also reads `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |

## Maps

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Client | `pk.ey...` | Mapbox/MapLibre GL token |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Client | String | Google Maps client-side key |

## Social Media (Meta/Facebook OAuth)

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `META_APP_ID` | No | Server | Numeric string | Facebook/Instagram OAuth app ID |
| `META_APP_SECRET` | No | Server | String | Facebook/Instagram OAuth app secret |
| `META_REDIRECT_URI` | No | Server | URL | OAuth callback URL |
| `SOCIAL_TOKEN_ENCRYPTION_KEY` | No | Server | String | Encryption key for stored social tokens |
| `SOCIAL_OAUTH_STATE_SECRET` | No | Server | Min 16 chars | HMAC secret for OAuth state parameter |
| `SOCIAL_PUBLISH_MOCK_ENABLED` | No | Server | `true`/`false` | Mock social publishing in non-production |

## Feature Flags

| Variable | Required | Client/Server | Format/Example | Notes |
|----------|----------|---------------|----------------|-------|
| `NEXT_PUBLIC_DEMO_MODE_ENABLED` | No | Client | `true`/`false` | Show demo mode toggle in UI |
| `RATE_LIMIT_FAIL_OPEN` | No | Server | `true`/`false` | Dev-only: allow requests when Redis is unavailable. Never set in production |
| `SKIP_ENV_VALIDATION` | No | Server | `true`/`1` | Skip Zod env validation in dev/test |
| `ALLOW_SUPABASE_DEV_FALLBACK` | No | Server | `true`/`false` | Allow local Supabase fallback URL. Auto-enabled in development |

---

## Local Development Minimum

For local development, you need at minimum:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Or set `SKIP_ENV_VALIDATION=true` and let Supabase fall back to `http://127.0.0.1:54321` for a fully local setup.

## Production Required

In production, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are mandatory. All other variables are optional but enable specific features (payments, WhatsApp, email, rate limiting, etc.).
