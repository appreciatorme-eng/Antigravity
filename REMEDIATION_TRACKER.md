# Remediation Tracker s50
**Date**: 2026-03-30 | **Branch**: `fix/remediation-s50` | **Source**: /full-audit R13

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## CRITICAL (6)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| CR-1a | Middleware fail-open on profile error | middleware.ts:178 | Fail-closed on error | Redirects to /auth on error | ✅ |
| CR-1b | CSRF degrades without token | admin-mutation-csrf.ts:52 | Make token mandatory in prod | Blocks mutations in prod without token | ✅ |
| CR-6 | Sidebar no nav landmark | Sidebar.tsx:270 | Wrap in `<nav>` with aria-label | Added `<nav aria-label="Main navigation">` | ✅ |
| CR-7 | MobileNav no aria-label | MobileNav.tsx:308 | Add aria-label to `<nav>` | Added `aria-label="Bottom navigation"` | ✅ |
| CR-12 | Landing page client-only (no SSR) | (marketing)/page.tsx:1 | Convert to Server Component | Removed "use client", added metadata export | ✅ |
| CR-13 | Solutions no metadata + infinite URLs | solutions/[type]/page.tsx | Add generateMetadata + notFound | Server component + notFound guard + static params | ✅ |

## HIGH (9)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| CR-14 | Pricing CTAs do nothing | PricingPageContent.tsx:96 | Link to /auth or /demo | Buttons → Link components | ✅ |
| CR-15 | Blog subscribe form submits to # | blog/page.tsx:138 | Remove fake form or add toast | Replaced with "coming soon" note | ✅ |
| CR-16 | Footer dead links (spans) | Footer.tsx:15 | Wire to real routes | Added href to Privacy, Terms, Contact | ✅ |
| CR-17 | Footer social icons dead | Footer.tsx:60 | Make actual `<a>` tags | Converted to `<a>` with aria-labels | ✅ |
| CR-18 | Blog hero "TravelBuilt" typo | BlogHero.tsx:28 | Fix to "TripBuilt" | Fixed brand name | ✅ |
| CR-9 | Close buttons below 44px | MobileNav.tsx:145,214 | Increase padding to 44px | Changed p-1.5 to p-3 on both | ✅ |
| CR-8 | No role-based nav filtering | nav-config.ts | Requires feature design (roles, permissions) | Deferred — needs product decision | 📝 |
| CR-19 | Demo page placeholder | demo/page.tsx:69 | Needs Cal.com integration | Deferred — needs external service | 📝 |
| QA-044 | Calendar Supabase 400 errors | useCalendarEvents.ts:43 | Removed spaces in PostgREST join select | Fixed join syntax | ✅ |

## MEDIUM (3)
| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| QA-045 | Marketing home missing h1 | (marketing)/page.tsx | Add h1 (part of CR-12 SSR fix) | h1 in HeroSection now server-rendered | ✅ |
| QA-046 | Pricing canonical wrong | pricing/page.tsx | Fix canonical URL | Added alternates.canonical: '/pricing' | ✅ |
| CR-12c | Dialogs not full-screen mobile | dialog.tsx:64 | Add mobile full-screen variant | | 📝 |

## Test Suite Status
- Vitest: pending
- Lint: pending
- Typecheck: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
