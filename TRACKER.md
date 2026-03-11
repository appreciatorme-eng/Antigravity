# Antigravity Travel Suite — Implementation Tracker
**Last Updated**: 2026-03-11 | **Sprint**: Post-S17

## Legend
- ✅ Done (committed)
- 🔄 In Progress
- ⏳ Pending
- 🚫 Blocked (ops/manual — not code)

---

## Feature 1: WhatsApp → Proposal in 60 Seconds ✅
**Commit**: `f21d8f3`
- ✅ `POST /api/whatsapp/extract-trip-intent` — Gemini AI extracts trip intent from WA conversation
- ✅ `GET /api/whatsapp/proposal-drafts/:id` — fetch draft by ID (org-scoped)
- ✅ Routes registered in dispatch table
- ✅ `ContextActionModal` — `create-proposal` type + `CreateProposalPanel`
- ✅ `UnifiedInbox` — "Create Proposal" quick action button

---

## P0 Dev: Portal Token Fix ⏳
**Priority**: Blocking go-live | **Est**: 2 days
- ⏳ `portal/[token]/page.tsx` — replace hardcoded mock with real `proposal_access_tokens` DB lookup
- ⏳ Migration for `proposal_access_tokens` table (if not exists)
- ⏳ `portal/[token]/route.ts` handler reads from DB, validates expiry + org scope

## P0 Dev: GST Report → Real Data ⏳
**Priority**: Blocking go-live | **Est**: 4 hours
- ⏳ `/admin/gst-report/page.tsx` — replace mock data with real `payment_links` query
- ⏳ Wire to existing Supabase `payment_links` table

---

## Feature 2: Review → Marketing Asset Pipeline ⏳
**Est**: 3–4 days | **Vercel cron**: N/A (trigger-based, no cron)
### DB
- ⏳ `supabase/migrations/20260401010000_auto_review_social_draft.sql` — trigger on `reviews` insert
### Code
- ⏳ `src/lib/social/review-to-card.ts` — auto-generate social draft card from review
- ⏳ `src/app/api/_handlers/social/reviews/route.ts` — wire AI draft gen on review save
- ⏳ `src/components/social/ReviewsToInsta.tsx` — one-click "Publish" button in Social Studio

---

## Feature 3: Shared Itinerary Cache ⏳
**Est**: 3–4 days
### DB
- ⏳ `supabase/migrations/20260401020000_global_itinerary_pool.sql`
### Code
- ⏳ `src/lib/itinerary/itinerary-cache.ts` — lookup + save to global pool
- ⏳ `src/lib/itinerary/semantic-cache.ts` — pgvector similarity lookup
- ⏳ Wire into `itinerary/generate` handler to check cache before AI generation

---

## Feature 4: Pay to Feature Marketplace Listings ⏳
**Est**: 2–3 days
### DB
- ⏳ `supabase/migrations/20260401030000_marketplace_featured.sql`
### Code
- ⏳ `src/lib/marketplace/featured-tiers.ts` — tier definitions + pricing
- ⏳ `src/app/api/_handlers/marketplace/listing-subscription/route.ts` — already exists, extend
- ⏳ `src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts` — already exists, extend

---

## Feature 5: Monthly Operator Scorecard ⏳
**Est**: 4–5 days | **⚠️ NO Vercel cron** (hobby plan full — use pg_cron + Supabase Edge Function)
### DB
- ⏳ `supabase/migrations/20260401040000_scorecard_deliveries.sql`
### Edge Function
- ⏳ `supabase/functions/monthly-scorecard/index.ts` — compute scorecard, email via Resend
- ⏳ pg_cron schedule: `0 0 1 * *` (1st of each month)
### Code
- ⏳ `src/app/api/_handlers/admin/reports/scorecard/route.ts` — manual trigger endpoint

---

## Feature 6: Replace OpenAI Embeddings with pgvector ⏳
**Est**: 1–2 days
### Code
- ⏳ `src/lib/embeddings.ts` — swap OpenAI embed calls for Supabase/gte-small model
- ⏳ `supabase/functions/embed/index.ts` — Edge Function that wraps gte-small
- ⏳ Update all callers of `generateEmbedding()` to use new function

---

## P0 Ops (manual — not code)
- 🚫 Run `scripts/post-merge.sh` (3 DB migrations)
- 🚫 Set `ENABLE_MOCK_ENDPOINTS=false` in Vercel env
- 🚫 Confirm Razorpay live keys in Vercel production
- 🚫 Rotate Supabase service-role key

## P1 Ops (manual)
- 🚫 Deploy `monthly-scorecard` Edge Function after Feature 5 is built
- 🚫 Set all Sprint 3 env vars in Vercel
- 🚫 Enable Sentry (`NEXT_PUBLIC_SENTRY_DSN`)
- 🚫 Enable PostHog (`NEXT_PUBLIC_POSTHOG_KEY`)
- 🚫 WPPConnect session active on Fly.io
- 🚫 Verify Resend domain + DNS records

---

## Test Suite Status
- **Vitest**: 581 pass / 0 fail / 0 skip (as of Feature 1 commit)
- **Playwright E2E**: 783 pass / 0 fail / 22 skip (as of S16/S17)

---

## Cron Slot Usage (Vercel Hobby — 2 slots max)
| Slot | Route | Schedule |
|------|-------|----------|
| 1/2 | `cron/assistant-briefing` | Daily |
| 2/2 | `notifications/schedule-followups` | Daily |
| — | Feature 5 scorecard | **pg_cron + Edge Function** (not Vercel) |
