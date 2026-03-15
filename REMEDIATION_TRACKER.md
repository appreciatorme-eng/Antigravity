# Remediation Tracker S35
**Date**: 2026-03-15 | **Branch**: `fix/remediation-s35` | **Source**: /remediate (continuation of MVP production readiness audit)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (10 pending from S34)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | 93 pages missing SEO metadata | marketing + auth pages | Add metadata exports | — | ⏳ |
| H-02 | 85 pages missing loading.tsx | route groups | Add skeleton loaders | — | ⏳ |
| H-03 | 11 files over 735 lines | Multiple files | Extract sub-components | Deferred — multi-session effort | 📝 |
| H-04 | WhatsApp inbox uses mock data | whatsapp/inbox-mock-data.ts | Replace with real API | Deferred — multi-hour API work | 📝 |
| H-08 | Client-side API calls should be server-side | 5 pages | Move to server components | Deferred — multi-session | 📝 |
| H-14 | Accessibility gaps — missing ARIA | 5+ files | Add ARIA attributes + keyboard nav | — | ⏳ |
| H-15 | Missing TS interfaces for 30+ component props | 20+ files | Add interface Props {} | — | ⏳ |
| H-16 | Webhook payload validation missing | lib/whatsapp.server.ts | Add Zod schemas | — | ⏳ |
| H-18 | Inline styles in non-PDF components | DemoTour.tsx, DemoModeBanner.tsx | Convert to Tailwind | — | ⏳ |
| H-19 | Settings page PlaceholderTab | app/settings/page.tsx:195 | Implement or remove tabs | — | ⏳ |

## MEDIUM (11 pending from S34)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | Test coverage 4.3% of full codebase | tests/ | Add critical path tests | Deferred — 20+ hours | 📝 |
| M-02 | Missing key props in JSX maps | DemoTour.tsx, WelcomeModal.tsx, etc. | Add stable keys | — | ⏳ |
| M-03 | Hardcoded pricing data | (marketing)/pricing/page.tsx | Move to constants | — | ⏳ |
| M-04 | God page hardcoded system health | god/page.tsx:126-139 | Wire to health endpoints | Deferred — new infrastructure | 📝 |
| M-05 | Inconsistent validation patterns | Multiple handlers | Standardize on Zod | Deferred — 4 hours | 📝 |
| M-06 | CSRF token fallback behavior | admin-mutation-csrf.ts:60 | Require token in production | — | ⏳ |
| M-08 | Hardcoded brand strings | welcome/page.tsx, ProposalDocument | Update branding | — | ⏳ |
| M-09 | Debug endpoint config leak risk | _handlers/debug/route.ts | Add NODE_ENV guard | — | ⏳ |
| M-10 | Hardcoded color values | inbox, pricing, about pages | Use Tailwind tokens | Deferred — design work | 📝 |
| M-11 | WhatsApp dual-mode undocumented | .env.example | Document in CLAUDE.md | — | ⏳ |
| M-12 | Cold start rate limit gap | rate-limit.ts | Startup validation for Redis | — | ⏳ |

## LOW (5 pending from S34)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | 6 TODO/FIXME comments | Various | Resolve or track | — | ⏳ |
| L-02 | Inline styles (29+ files) | Various | Convert to Tailwind | Deferred — 3 hours | 📝 |
| L-03 | Component tests are type-checks only | tests/component/ | Add render tests | Deferred — 8 hours | 📝 |
| L-04 | Zustand store middleware inconsistency | ui-store.ts vs onboarding-store.ts | Document intent | — | ⏳ |
| L-07 | DemoTour direct DOM manipulation | demo/DemoTour.tsx:156-158 | Use data attrs + CSS | — | ⏳ |

## Test Suite Status
- Vitest: pending
- Playwright E2E: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| P1 | — | 2026-03-15 | Create remediation tracker s35 |
