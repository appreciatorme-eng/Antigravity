# Remediation Tracker s50
**Date**: 2026-03-30 | **Branch**: `fix/remediation-s50` | **Source**: /full-audit R13

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## CRITICAL (6)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| CR-1a | Middleware fail-open on profile error | middleware.ts:178 | Fail-closed on error | | ⏳ |
| CR-1b | CSRF degrades without token | admin-mutation-csrf.ts:52 | Make token mandatory in prod | | ⏳ |
| CR-6 | Sidebar no nav landmark | Sidebar.tsx:232 | Wrap in `<nav>` with aria-label | | ⏳ |
| CR-7 | MobileNav no aria-label | MobileNav.tsx:308 | Add aria-label to `<nav>` | | ⏳ |
| CR-12 | Landing page client-only (no SSR) | (marketing)/page.tsx:1 | Convert to Server Component | | ⏳ |
| CR-13 | Solutions no metadata + infinite URLs | solutions/[type]/page.tsx | Add generateMetadata + notFound | | ⏳ |

## HIGH (9)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| CR-14 | Pricing CTAs do nothing | PricingPageContent.tsx:96 | Link to /auth or /demo | | ⏳ |
| CR-15 | Blog subscribe form submits to # | blog/page.tsx:138 | Remove fake form or add toast | | ⏳ |
| CR-16 | Footer dead links (spans) | Footer.tsx:15 | Wire to real routes | | ⏳ |
| CR-17 | Footer social icons dead | Footer.tsx:60 | Make actual `<a>` tags | | ⏳ |
| CR-18 | Blog hero "TravelBuilt" typo | BlogHero.tsx:28 | Fix to "TripBuilt" | | ⏳ |
| CR-9 | Close buttons below 44px | MobileNav.tsx:143,213 | Increase padding to 44px | | ⏳ |
| CR-8 | No role-based nav filtering | nav-config.ts | Add requiredRole field | | 📝 |
| CR-19 | Demo page placeholder | demo/page.tsx:69 | Improve messaging | | ⏳ |
| QA-044 | Calendar Supabase 400 errors | calendar page | Fix date range query | | ⏳ |

## MEDIUM (3)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| QA-045 | Marketing home missing h1 | (marketing)/page.tsx | Add h1 (part of CR-12 SSR fix) | | ⏳ |
| QA-046 | Pricing canonical wrong | pricing/page.tsx | Fix canonical URL | | ⏳ |
| CR-12c | Dialogs not full-screen mobile | dialog.tsx:64 | Add mobile full-screen variant | | 📝 |

## Test Suite Status
- Vitest: pending
- Lint: pending
- Typecheck: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
