# Remediation Tracker S34
**Date**: 2026-03-15 | **Branch**: `fix/remediation-s34` | **Source**: /review (MVP production readiness audit)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## BLOCKER (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| B-01 | ESLint fails — 3 unused imports | AnimatedFlightPath.tsx:3-4, SpotlightCard.tsx:3 | Remove unused imports | | ⏳ |
| B-02 | Mock Razorpay endpoint no production guard | payments/razorpay/route.ts | Add NODE_ENV guard | | ⏳ |
| B-03 | Demo data active without feature flag | lib/demo-data.ts, lib/integrations.ts:71 | Gate behind env var | | ⏳ |

## HIGH (19)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | 93 pages missing SEO metadata | 93 page.tsx files | Add metadata to marketing + auth pages | | ⏳ |
| H-02 | 85 pages missing loading.tsx | 85 route groups | Add loading.tsx skeletons | | ⏳ |
| H-03 | 11 files over 735 lines | Multiple files | Extract sub-components | | ⏳ |
| H-04 | WhatsApp inbox uses mock data | whatsapp/inbox-mock-data.ts | Replace with real API | | ⏳ |
| H-05 | 618 console statements in prod code | 16+ files | Replace with logError() | | ⏳ |
| H-06 | Type safety — double casts + null checks | 8 locations | Add type guards + null checks | | ⏳ |
| H-07 | Silent error swallowing | 5 locations | Add logError() | | ⏳ |
| H-08 | Client-side API calls should be server-side | 5 pages | Move to server components / React Query | | ⏳ |
| H-09 | Missing Zod validation in handlers | 4 handlers | Add Zod schemas | | ⏳ |
| H-10 | Hardcoded fallback URL in email.ts | lib/email.ts:26 | Use NEXT_PUBLIC_APP_URL | | ⏳ |
| H-11 | map-test page exposed in production | app/map-test/page.tsx | Add notFound() guard | | ⏳ |
| H-12 | Cron secret naming inconsistency | .env.example | Document / consolidate | | ⏳ |
| H-13 | Sentry/PostHog no startup warning | sentry configs, PostHogProvider | Add prod startup log | | ⏳ |
| H-14 | Accessibility gaps | 5+ files | Add ARIA attributes | | ⏳ |
| H-15 | Missing TS interfaces for 30+ component props | 20+ files | Add interface Props | | ⏳ |
| H-16 | Webhook payload validation missing | lib/whatsapp.server.ts | Add Zod schemas | | ⏳ |
| H-17 | Duplicate WhatsApp webhook registration | [...path]/route.ts | Remove duplicate | | ⏳ |
| H-18 | Inline styles in non-PDF components | DemoTour.tsx, DemoModeBanner.tsx | Convert to Tailwind | | ⏳ |
| H-19 | Settings page PlaceholderTab | app/settings/page.tsx:195 | Implement or remove tabs | | ⏳ |

## MEDIUM (12)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | Test coverage 4.3% of full codebase | tests/ | Add critical path tests | | ⏳ |
| M-02 | Missing key props in JSX maps | DemoTour.tsx, WelcomeModal.tsx, etc. | Add stable keys | | ⏳ |
| M-03 | Hardcoded pricing data | (marketing)/pricing/page.tsx | Move to constants | | ⏳ |
| M-04 | God page hardcoded system health | god/page.tsx:126-139 | Wire to health endpoints | | ⏳ |
| M-05 | Inconsistent validation patterns | Multiple handlers | Standardize on Zod | | ⏳ |
| M-06 | CSRF token fallback behavior | admin-mutation-csrf.ts:60 | Require token in production | | ⏳ |
| M-07 | Missing library input validation | 4 lib files | Add parameter guards | | ⏳ |
| M-08 | Hardcoded brand strings | welcome/page.tsx, ProposalDocument | Update branding | | ⏳ |
| M-09 | Debug endpoint config leak risk | _handlers/debug/route.ts | Add NODE_ENV guard | | ⏳ |
| M-10 | Hardcoded color values | inbox, pricing, about pages | Use Tailwind tokens | | ⏳ |
| M-11 | WhatsApp dual-mode undocumented | .env.example | Document in CLAUDE.md | | ⏳ |
| M-12 | Cold start rate limit gap | rate-limit.ts | Startup validation for Redis | | ⏳ |

## LOW (6 actionable)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 6 TODO/FIXME comments | Various | Resolve or track | | ⏳ |
| L-02 | Inline styles (29+ files) | Various | Convert to Tailwind | | ⏳ |
| L-03 | Component tests are type-checks only | tests/component/ | Add render tests | | ⏳ |
| L-04 | Zustand store middleware inconsistency | ui-store.ts vs onboarding-store.ts | Document intent | | ⏳ |
| L-05 | OG route bypasses catch-all | app/api/og/route.tsx | Add comment | | ⏳ |
| L-07 | DemoTour direct DOM manipulation | demo/DemoTour.tsx:156-158 | Use data attrs + CSS | | ⏳ |

## ACCEPTED (no action)

| ID | Decision | Reason |
|----|----------|--------|
| A-01 | CSP unsafe-inline | Next.js requirement |
| A-02 | No circuit breaker / DLQ | Vercel Hobby stateless |
| A-03 | Both leaflet + maplibre-gl | Different use cases |
| A-04 | Polling intervals contextual | Not magic numbers |
| A-05 | india-templates.ts 786 lines | Data file not logic |
| A-06 | PDF inline styles | @react-pdf/renderer requirement |
| A-07 | OG route as direct route | Edge runtime |
| A-08 | 60-module vitest coverage scope | Deliberately scoped |

## Test Suite Status
- Vitest: pending
- Playwright E2E: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| P1 | — | 2026-03-15 | Create tracker |
