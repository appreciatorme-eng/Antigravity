# Travel Suite Web App

Next.js admin panel and client web app for Travel Suite.

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_GEMINI_API_KEY=
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - eslint
- `npm run test:e2e` - Playwright tests

## E2E (Playwright)

Local dev server (full browser matrix):

```bash
npm run test:e2e
```

Authenticated E2E roles are configured via environment variables:

```bash
TEST_CLIENT_EMAIL=...
TEST_CLIENT_PASSWORD=...
TEST_ADMIN_EMAIL=...
TEST_ADMIN_PASSWORD=...
TEST_DRIVER_EMAIL=...
TEST_DRIVER_PASSWORD=...
```

If these credentials are not provided, role-specific authenticated tests are skipped unless prebuilt auth state files exist under `e2e/.auth/*.json`.

Optional Playwright runtime overrides:
- `PLAYWRIGHT_DEV_COMMAND` to override how the local dev server is launched.
- `PLAYWRIGHT_BASE_URL` / `BASE_URL` to point tests at an existing environment.

Production integration run (Chromium only, hits `BASE_URL` and does not start a local server):

```bash
BASE_URL=https://travelsuite-rust.vercel.app npx playwright test --config=e2e/playwright.prod.config.ts
```

Notes:
- Admin APIs such as `/api/admin/clients` require `SUPABASE_SERVICE_ROLE_KEY` to be set in the deployed environment.
- Itinerary generation requires `GOOGLE_API_KEY` or `GOOGLE_GEMINI_API_KEY` to be set in the deployed environment.
- Production integration specs are gated by `E2E_TARGET=prod` (set by `e2e/playwright.prod.config.ts`).

## Notes

- Server-only utilities live in `src/lib/notifications.ts` (guarded by `server-only`).
- Shared formatting helpers live in `src/lib/notifications.shared.ts` and are safe to import in client components.
- Admin notification routes require an authenticated admin user.
