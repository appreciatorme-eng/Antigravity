# TripBuilt — Travel Suite Web App

Next.js 16 admin panel and client portal for Indian tour operators.
Production: [tripbuilt.com](https://tripbuilt.com)

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL, RLS enabled) |
| Payments | Razorpay (INR, Indian market) |
| Auth | Supabase Auth (email/password + magic link) |
| Hosting | Vercel Hobby |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | React hooks + Supabase realtime |

## Quick Start

```bash
cd projects/travel-suite/apps/web
cp .env.example .env.local   # fill in required values
npm install
npm run dev                  # http://localhost:3000
```

## Scripts

```bash
npm run dev             # next dev → http://localhost:3000
npm run build           # production build
npm run lint            # ESLint (zero warnings — max-warnings=0)
npm run typecheck       # tsc --noEmit
npm run test            # Vitest unit tests
npm run test:coverage   # Vitest with coverage thresholds (80/90/75)
npm run test:e2e        # Playwright E2E against tripbuilt.com
npm run qa              # playwright-cli (interactive headless browser)
```

## Environment Variables

Copy `.env.example` to `.env.local`. Required variables:

### Supabase (required)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### AI / LLMs (required for AI features)
```
OPENAI_API_KEY=          # itinerary generation, AI chat
GROQ_API_KEY=            # fast inference fallback
GOOGLE_GEMINI_API_KEY=   # tour import, AI features
```

### Payments (required)
```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
GST_COMPANY_STATE=MAHARASHTRA
```

### Security / CSRF (required in production)
```
ADMIN_MUTATION_CSRF_TOKEN=
CRON_SECRET=
ADMIN_CRON_SECRET=
NOTIFICATION_CRON_SECRET=
CRON_SIGNING_SECRET=
INTERNAL_API_KEY=
```

### WhatsApp — Meta Cloud API (primary)
```
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
```

### WhatsApp — WPPConnect (self-hosted fallback)
```
WPPCONNECT_URL=
WHATSAPP_API_KEY=
WPPCONNECT_WEBHOOK_SECRET=
```

### Email (Resend)
```
RESEND_API_KEY=
RESEND_FROM_EMAIL=
PROPOSAL_FROM_EMAIL=
```

### Rate Limiting (Upstash Redis — fail-closed without these)
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Optional
```
NEXT_PUBLIC_MAPBOX_TOKEN=    # maps + geocoding
FAL_KEY=                     # AI image generation (Social Studio)
PIXABAY_API_KEY=             # image search
NEXT_PUBLIC_POSTHOG_KEY=     # analytics
SENTRY_DSN=                  # error tracking
```

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full system design.
See [`docs/FEATURES.md`](docs/FEATURES.md) for product feature reference.

### API Routing — catch-all dispatcher pattern

All endpoints go through catch-all dispatchers, **not** individual `route.ts` files:

```
src/app/api/[...path]/route.ts              ← public routes
src/app/api/admin/[...path]/route.ts        ← admin routes (auth required)
src/app/api/assistant/[...path]/route.ts    ← AI assistant routes
src/app/api/reputation/[...path]/route.ts   ← reputation routes
src/app/api/social/[...path]/route.ts       ← social routes
src/app/api/superadmin/[...path]/route.ts   ← superadmin routes
```

To add a new endpoint: create a handler in `src/app/api/_handlers/` and register it via `createCatchAllHandlers()` in `src/lib/api-dispatch.ts`. Do **not** create a new `route.ts`.

### CSRF Protection

Bearer auth IS the CSRF guard. Every `POST/PUT/PATCH/DELETE` must include `Authorization: Bearer <token>`. Use `authedFetch()` from `src/lib/api/authed-fetch.ts` — it attaches the token automatically. Bare `fetch()` without auth will fail with 403 in production.

## Test Accounts (E2E)

| Role | Email | Notes |
|---|---|---|
| Admin | `e2e-admin@tripbuilt.com` | `onboarding_step=0` (triggers wizard) |
| Client | `e2e-client@tripbuilt.com` | Standard client |
| Driver | `e2e-driver@tripbuilt.com` | Standard driver |
| Super Admin | `e2e-superadmin@tripbuilt.com` | Full platform access |

Credentials in `e2e/.env` (gitignored). Login via `POST /api/auth/password-login`.

## Test Thresholds

- Lines: 80% | Functions: 90% | Branches: 75%
- Lint: zero warnings (`--max-warnings=0`)

## Mobile-First

80%+ of users are on mobile (Indian tour operators). Every UI change must work at 390px (iPhone 14). See [`docs/MOBILE_NAV.md`](docs/MOBILE_NAV.md) for the navigation architecture — all nav items are defined in `src/lib/nav/nav-config.ts` as the single source of truth.

## Vercel Constraints

- Hobby plan: 2 cron slots, 60s max function timeout
- Cron handlers must export `POST` only (no `GET`)

## Key Files

| Purpose | Path |
|---|---|
| API dispatcher | `src/lib/api-dispatch.ts` |
| Auth middleware | `src/middleware.ts` |
| Nav config (single source of truth) | `src/lib/nav/nav-config.ts` |
| Rate limiting | `src/lib/security/rate-limit.ts` |
| CSRF guard | `src/lib/security/admin-mutation-csrf.ts` |
| Authed fetch (client) | `src/lib/api/authed-fetch.ts` |
| Supabase admin client | `src/lib/supabase/admin.ts` |
| Generated DB types | `src/lib/supabase/database.types.ts` |
| Structured logger | `src/lib/observability/logger.ts` |
| API response helpers | `src/lib/api/response.ts` |
