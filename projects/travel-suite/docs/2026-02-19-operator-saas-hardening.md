# Operator SaaS Hardening (2026-02-19)

This release finishes the core operator onboarding + marketplace + dynamic proposal option flow.

## What Was Implemented

### 1. Operator onboarding and organization bootstrap
- Added new onboarding page:
  - `apps/web/src/app/onboarding/page.tsx`
- Added onboarding API:
  - `apps/web/src/app/api/onboarding/setup/route.ts`
- Behavior:
  - Authenticated user setup creates or links an organization.
  - Profile is promoted/normalized to operator admin role.
  - Profile is linked to `organization_id` and marked complete (`onboarding_step = 2`).
  - Marketplace profile row is created/updated from onboarding details.
  - Itinerary template preference is persisted on organization (`safari_story` / `urban_brief`).

### 2. Auth + route protection for onboarding completion
- Replaced middleware with onboarding-aware guards:
  - `apps/web/middleware.ts`
- Behavior:
  - `/admin` and `/planner` require auth.
  - Authenticated users without completed onboarding are redirected to `/onboarding`.
  - Completed users visiting `/onboarding` are redirected back to app (`/admin` or `next`).
- Updated auth redirect behavior:
  - `apps/web/src/app/auth/page.tsx`
  - `apps/web/src/app/auth/callback/route.ts`
  - Honors `next` and defaults to `/admin`.

### 3. Public proposal security hardening (token-scoped server access)
- Added server API for public proposal token operations:
  - `apps/web/src/app/api/proposals/public/[token]/route.ts`
- Supported operations:
  - Read proposal bundle (proposal, days, activities, accommodations, comments, add-ons).
  - Toggle activity selection.
  - Toggle add-on selection.
  - Select a transport option (mutually exclusive vehicle selection).
  - Post comments.
  - Approve proposal.
  - Recalculate and persist `client_selected_price` after option changes.
- Refactored public page to use API (no direct public table writes):
  - `apps/web/src/app/p/[token]/page.tsx`

### 4. Proposal add-ons normalization to `proposal_add_ons`
- Existing migration (already created in this branch):
  - `supabase/migrations/20260219120000_security_and_proposal_hardening.sql`
- Updated UI/components to normalized schema:
  - `apps/web/src/components/admin/ProposalAddOnsManager.tsx`
  - `apps/web/src/components/client/ProposalAddOnsSelector.tsx`
  - `apps/web/src/app/admin/proposals/create/page.tsx`
- Behavior updates:
  - Single selected transport option preserved in app logic.
  - Proposal create flow now includes transport options for client switching, with one default selected.
  - Duplicate options block removed from proposal create page.

### 5. Marketplace API hardening completed
- Hardened admin verification + marketplace visibility and interaction checks:
  - `apps/web/src/app/api/admin/marketplace/verify/route.ts`
  - `apps/web/src/app/api/marketplace/route.ts`
  - `apps/web/src/app/api/marketplace/[id]/inquiry/route.ts`
  - `apps/web/src/app/api/marketplace/[id]/view/route.ts`
  - `apps/web/src/app/api/marketplace/[id]/reviews/route.ts`

### 6. Cleanup and repo hygiene
- Removed accidental duplicate files:
  - `apps/web/src/components/pdf/itinerary-pdf 2.tsx`
  - `apps/web/src/components/pdf/itinerary-types 2.ts`
  - `apps/web/src/components/pdf/templates/ItineraryTemplatePages 2.tsx`
- Removed old backup pages (`page-old.tsx.backup`) from admin sections.
- Removed duplicate middleware file:
  - `apps/web/src/middleware.ts`
- Updated gitignore for local Supabase temp workspace:
  - `.gitignore` now ignores `supabase/supabase/`.

## Notes on Build Verification

- `next build` reaches compile stage and succeeds through bundling, but this environment repeatedly stalls during later data/build phases with intermittent `socket hang up` retries from existing app behavior.
- Because of this pre-existing runtime build issue, verification relied on targeted changed-file inspection and static pass checks instead of a fully completed production build in this run.

## Files Changed

- `.gitignore`
- `apps/web/middleware.ts`
- `apps/web/next.config.ts`
- `apps/web/src/app/auth/page.tsx`
- `apps/web/src/app/auth/callback/route.ts`
- `apps/web/src/app/onboarding/page.tsx`
- `apps/web/src/app/api/onboarding/setup/route.ts`
- `apps/web/src/app/api/proposals/public/[token]/route.ts`
- `apps/web/src/app/p/[token]/page.tsx`
- `apps/web/src/components/admin/ProposalAddOnsManager.tsx`
- `apps/web/src/components/client/ProposalAddOnsSelector.tsx`
- `apps/web/src/app/admin/proposals/create/page.tsx`
- `apps/web/src/app/api/admin/marketplace/verify/route.ts`
- `apps/web/src/app/api/marketplace/route.ts`
- `apps/web/src/app/api/marketplace/[id]/inquiry/route.ts`
- `apps/web/src/app/api/marketplace/[id]/view/route.ts`
- `apps/web/src/app/api/marketplace/[id]/reviews/route.ts`
- `supabase/migrations/20260219120000_security_and_proposal_hardening.sql`
- Deleted backup/duplicate files listed above.
