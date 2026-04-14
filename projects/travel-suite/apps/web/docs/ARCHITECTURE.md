# Architecture

System design reference for TripBuilt web app.

## High-Level Overview

```
Browser / Mobile PWA
        │
        ▼
   Next.js 16 (Vercel)
   ┌──────────────────────────────────────────┐
   │  App Router (RSC + client components)    │
   │  Middleware (auth gating, rate limit)    │
   │  Catch-all API dispatchers               │
   └──────────┬───────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
Supabase           External APIs
(Postgres + RLS)   Razorpay · Resend · OpenAI
Auth · Realtime    Groq · Gemini · WhatsApp
Storage            Mapbox · FAL.ai · PostHog
```

## Request Lifecycle

1. Request hits Vercel edge
2. `src/middleware.ts` — checks session cookie, redirects unauthenticated users
3. Route matched to a catch-all dispatcher (`src/app/api/[...path]/route.ts` or domain-specific)
4. Dispatcher runs: **rate-limit → CSRF guard → auth → handler**
5. Handler reads from Supabase (via admin client or user-scoped client), returns `apiSuccess` / `apiError`

## API Dispatcher Pattern

Single catch-all per domain instead of per-endpoint `route.ts` files. This ensures consistent rate-limiting, CSRF, and error handling across all endpoints.

```
src/app/api/
  [...path]/route.ts           ← public dispatcher
  admin/[...path]/route.ts     ← admin dispatcher (requires admin role)
  assistant/[...path]/route.ts ← AI assistant dispatcher
  reputation/[...path]/route.ts
  social/[...path]/route.ts
  superadmin/[...path]/route.ts
  _handlers/                   ← all handler implementations live here
    bookings/
    clients/
    dashboard/
    invoices/
    payments/
    trips/
    whatsapp/
    ... (44 handler domains)
```

**Adding a new endpoint:**
1. Create handler file in `src/app/api/_handlers/<domain>/`
2. Register it in the appropriate dispatcher via `createCatchAllHandlers()`
3. Do NOT create a new `route.ts` — that bypasses rate limiting and CSRF

## CSRF Strategy

Bearer token IS the CSRF protection. `passesMutationCsrfGuard()` in `src/lib/security/admin-mutation-csrf.ts` checks:
1. `Authorization: Bearer <token>` (≥10 chars) — **primary path for all client calls**
2. `x-admin-csrf` header matching `ADMIN_MUTATION_CSRF_TOKEN` env var — server-to-server only
3. Same-origin fallback — dev/test only, dead code in production

**Rule:** Every client-side mutation MUST use `authedFetch()` from `src/lib/api/authed-fetch.ts`.

**CSRF-exempt routes:** `cron/*`, `auth/password-login`, `onboarding/setup`, `payments/webhook`, `whatsapp/webhook`, `webhooks/*`

## Authentication & Roles

Auth via Supabase Auth (email/password + magic link). Session stored in cookies, read by middleware.

User roles (stored in `profiles.role`):
- `client` — end-user/traveller
- `admin` — tour operator (primary user persona)
- `driver` — vehicle driver with limited access
- `super_admin` — platform-level access (Antigravity team)

Row-Level Security (RLS) is enabled on all tables. Server-side reads use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS where needed). Client-side reads use the anon key + session cookie (RLS enforced).

## Rate Limiting

Upstash Redis via `@upstash/ratelimit`. Configured in `src/lib/security/rate-limit.ts`. **Fail-closed** — if Redis is unavailable, requests are blocked. Requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.

## Navigation Architecture

Single source of truth: `src/lib/nav/nav-config.ts`

- **Desktop:** `Sidebar.tsx` — left sidebar with all sections
- **Mobile:** `MobileNav.tsx` — 5-slot bottom tab bar + "More" drawer
- **Adding a page:** Add to `nav-config.ts` with the correct `section` — it appears in both automatically

Nav sections: `primary` | `daily` | `operations` | `growth` | `admin` | `account`

Mobile bottom tabs (fixed — do not change without discussion):

| Slot | Label | Route |
|---|---|---|
| 1 | Home | `/` |
| 2 | Inbox | `/inbox` |
| 3 | + FAB | Quick actions sheet |
| 4 | Trips | `/trips` |
| 5 | Clients | `/clients` |

## Database

Supabase (PostgreSQL). ~113 tables. Migrations in `supabase/migrations/` (148 SQL files as of Apr 2026).

Key schema areas:
- **Trips & Bookings** — `trips`, `bookings`, `trip_itineraries`, `trip_costs`
- **Clients** — `profiles`, `clients`
- **Payments** — `payments`, `commercial_payments_ledger` (Apr 2026)
- **Invoices** — `invoices`, soft-delete columns (Apr 2026)
- **WhatsApp** — `whatsapp_messages`, `whatsapp_contact_names` (Mar 2026)
- **Automation** — `automation_rules` (Mar 2026)
- **Notifications** — `notification_queue`, dead-letter queue
- **Reputation** — `reputation_scores`, `reviews`
- **Proposals** — `proposals`
- **Expenses** — `expense_receipts` (Mar 2026)

Generated TypeScript types: `src/lib/supabase/database.types.ts` (regenerate with Supabase MCP after schema changes).

## WhatsApp Integration

Two modes — selected at runtime based on which env vars are set:

| Mode | Env var trigger | File | Status |
|---|---|---|---|
| Meta Cloud API | `WHATSAPP_TOKEN` | `src/lib/whatsapp.server.ts` | Primary (production) |
| WPPConnect | `WPPCONNECT_URL` | `src/lib/whatsapp-wppconnect.ts` | Self-hosted fallback |

`WHATSAPP_TOKEN` takes precedence. WPPConnect kept for operators who self-host WhatsApp Business on-premise.

## Error Boundary Pattern

All route groups use a shared re-export — never copy-paste the component:

```tsx
// src/components/shared/RouteError.tsx — single source of truth
// Each route's error.tsx:
export { RouteError as default } from '@/components/shared/RouteError';
```

## Component Size Rules

- Don't extract a component if it's under 60 lines and used only once — keep it co-located
- Aim for 4–6 sub-components per parent, not 8–10
- Test parent behavior before extracting a sub-component

## Observability

- **Structured logging:** `src/lib/observability/logger.ts`
- **Error tracking:** Sentry (configured in `sentry.server.config.ts`)
- **Analytics:** PostHog (`posthog-js` + `posthog-node`)
- **Health endpoint:** `/api/health` — checks DB connectivity, queue depth, dead-letter count

## Cron Jobs (Vercel Hobby — 2 slots max)

Cron handlers live in `src/app/api/_handlers/cron/` and are POST-only. Each has its own secret (`ADMIN_CRON_SECRET`, `NOTIFICATION_CRON_SECRET`, etc.) to limit blast radius if one leaks.

## CI / Automation

| Workflow | Trigger | What runs |
|---|---|---|
| `security-audit` | PR to main (web changes) | `npm audit --audit-level=high` + `npm run test:coverage` |
| `dep-review` | PR to main | `dependency-review-action` — blocks known-vulnerable deps |
| Dependabot | Weekly (Monday) | Auto-creates PRs for patch/minor npm updates |
| Weekly deep review | Monday 9 AM | `/review-deep` with full Axon sweep |
