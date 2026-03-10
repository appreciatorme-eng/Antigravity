# Seventh Audit Sweep — Implementation Tracker

Production readiness audit score: **67/100**. All findings below are tracked with action, expected result, and completion status.

---

## Tracker

| # | Severity | File | Action | Expected Result | Status |
|---|----------|------|--------|-----------------|--------|
| 1 | CRITICAL | `src/hooks/useRealtimeUpdates.ts` | Replace fabricated `Math.random()` data + hardcoded Indian names/metrics with real Supabase Realtime channel subscriptions. Zero `INITIAL_METRICS` on mount; populate from DB. | Live dashboard reflects actual DB state; no synthetic noise on production | ⬜ |
| 2 | HIGH | `src/lib/security/rate-limit.ts` | Make `enforceRateLimit` throw/return 503-worthy error in production when Redis is unavailable instead of silently falling back to per-instance Map | Rate limiting never silently bypasses in production Vercel deployments | ⬜ |
| 3 | HIGH | `src/lib/security/cron-auth.ts:22` | Make `localReplayKeys` fallback log a hard error in production; expose `isReplayProtectionAvailable()` helper so callers can surface 503 | Replay protection no longer silently resets on cold start | ⬜ |
| 4 | HIGH | `src/env.ts:17-19` | Change `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` from `.optional()` to required only when `NODE_ENV === 'production'` using `z.preprocess` / conditional schema | App fails fast at boot if deployed without payment credentials | ⬜ |
| 5 | MEDIUM | `src/app/api/_handlers/whatsapp/webhook/route.ts:200-208` | Add explicit `void` operator + structured error log with severity tag on `.catch()`; add TODO comment linking to Inngest/SQS queue recommendation | Fire-and-forget failures are always logged with enough context for alerting | ⬜ |
| 6 | MEDIUM | `vitest.config.ts:34` | Raise `thresholds.lines` from `30` to `60`; add `branches: 50` and `functions: 60` thresholds | CI fails if coverage drops below 60%, enforcing meaningful coverage growth | ⬜ |
| 7 | MEDIUM | `src/app/api/_handlers/portal/[token]/route.ts:167-188` | Fetch `proposal_activities` and `proposal_accommodations` in `Promise.all` rather than sequentially | Two fewer round-trip delays per portal page load | ⬜ |
| 8 | MEDIUM | `src/lib/image-search.ts:107` | Wrap Wikipedia API calls with a concurrency limit (max 5 parallel via `p-limit` or manual semaphore) | No longer fires unbounded parallel requests to Wikimedia | ⬜ |
| 9 | LOW | `src/app/api/_handlers/payments/webhook/route.ts:380-381` | Remove second argument from `revalidateTag('revenue', 'max')` and `revalidateTag('nav-counts', 'max')` — Next.js ignores it silently | Dead code removed; no API misuse | ⬜ |
| 10 | LOW | `src/lib/image-search.ts:97-98` | Replace in-place `activity.imageUrl = ...` / `activity.image = ...` mutation with immutable spread pattern returned from `populateItineraryImages` | Follows immutability convention; no hidden side effects | ⬜ |
| 11 | LOW | `src/lib/geocoding.ts:17` | Replace unbounded `Map` with a simple LRU-style cache (max 500 entries, evict oldest on overflow) | Geocode cache cannot grow unboundedly in long-running processes | ⬜ |

---

## Legend

- ⬜ Pending
- 🔄 In Progress
- ✅ Complete
