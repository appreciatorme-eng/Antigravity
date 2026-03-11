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

## P0 Dev: GST Report → Real Data ✅
**Commit**: `2a6dc3a`
- ✅ `/admin/gst-report/page.tsx` — real API fetch, month selector, loading/error states
- ✅ `/api/admin/reports/gst` handler — `payment_links` + `proposals` join, 5% GST calc
- ✅ Registered in admin dispatch table

---

## Feature 2: Review → Marketing Asset Pipeline ✅
**Already implemented** (audit confirmed 2026-03-11)
- ✅ `src/lib/social/review-marketing.server.ts` — marketing asset generator
- ✅ `src/app/api/_handlers/social/reviews/` — review handlers
- ✅ `src/components/social/_components/ReviewsToInsta.tsx` — one-click publish
- ✅ `src/app/api/_handlers/reputation/reviews/[id]/marketing-asset/` — per-review asset

---

## Feature 3: Shared Itinerary Cache ✅
**Already implemented** (audit confirmed 2026-03-11)
- ✅ `shared_itinerary_cache` + `shared_itinerary_cache_events` tables exist in DB
- ✅ `src/lib/itinerary/itinerary-cache.ts` — lookup + save
- ✅ `src/lib/itinerary/semantic-cache.ts` — pgvector similarity
- ✅ `src/lib/itinerary/shared-itinerary-cache.ts` — wired into generate handler

---

## Feature 4: Pay to Feature Marketplace Listings ✅
**Already implemented** (audit confirmed 2026-03-11)
- ✅ `marketplace_listing_subscriptions` table exists in DB
- ✅ `src/lib/marketplace/marketplace-listing-plans.ts` — free/lite/pro/top tiers
- ✅ `src/app/api/_handlers/marketplace/listing-subscription/route.ts` — full Razorpay
- ✅ `src/app/api/_handlers/marketplace/listing-subscription/verify/route.ts`

---

## Feature 5: Monthly Operator Scorecard ✅
**Commit**: `2a6dc3a` (Edge Function) | cron handler existed prior
- ✅ `operator_scorecards` table exists in DB
- ✅ `src/lib/admin/operator-scorecard.ts` — scorecard computation
- ✅ `src/lib/admin/operator-scorecard-delivery.ts` — PDF gen + Resend email
- ✅ `src/app/api/_handlers/cron/operator-scorecards/route.ts` — cron trigger
- ✅ `supabase/functions/monthly-scorecard/index.ts` — Edge Function HTTP caller
- 🚫 **Ops**: Schedule via Supabase dashboard → `0 0 1 * *` (monthly, 1st of month)

---

## Feature 6: Replace OpenAI Embeddings with pgvector ✅
**Already implemented** (audit confirmed 2026-03-11)
- ✅ `src/lib/embeddings-v2.ts` — uses Gemini `gemini-embedding-001` (not OpenAI)
- ✅ `itinerary_embeddings` table with vector column exists in DB
- ✅ All callers use `generateEmbeddingV2()` from embeddings-v2.ts

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
- **Vitest**: 581 pass / 0 fail / 0 skip (as of commit 2a6dc3a)
- **Playwright E2E**: 783 pass / 0 fail / 22 skip (as of S16/S17)

---

## Cron Slot Usage (Vercel Hobby — 2 slots max)
| Slot | Route | Schedule |
|------|-------|----------|
| 1/2 | `cron/assistant-briefing` | Daily |
| 2/2 | `notifications/schedule-followups` | Daily |
| — | Feature 5 scorecard | **pg_cron + Edge Function** (not Vercel) |
