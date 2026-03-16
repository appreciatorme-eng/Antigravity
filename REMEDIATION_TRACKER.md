# Remediation Tracker S36
**Date**: 2026-03-15 | **Branch**: `fix/remediation-s36` | **Source**: /remediate (deferred M-05 Zod validation + SSRF hardening)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (2)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | SSRF risk — no URL scheme/hostname validation | `_handlers/itinerary/import/url/route.ts` | Add URL scheme whitelist + private-IP blocklist | | ⏳ |
| H-02 | Arbitrary actionName execution — no whitelist | `_handlers/assistant/confirm/route.ts` | Add Zod enum for allowed actionNames + params shape | | ⏳ |

## MEDIUM (5)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | NPS submit — no JSON parse guard, score unbounded | `_handlers/reputation/nps/submit/route.ts` | Add Zod: score z.number().int().min(0).max(10) | | ⏳ |
| M-02 | UPI ID format not validated (financial config) | `_handlers/settings/upi/route.ts` | Add Zod with UPI handle regex | | ⏳ |
| M-03 | Lat/lon types unchecked | `_handlers/location/ping/route.ts` | Add Zod: lat/lon z.number() bounds, accuracy positive | | ⏳ |
| M-04 | location/share — tripId/dayNumber coercion only | `_handlers/location/share/route.ts` | Add Zod: tripId z.string().uuid(), dayNumber z.number().int().min(1) | | ⏳ |
| M-05 | Hardcoded pricing data on marketing page | `app/(marketing)/pricing/_components/PricingPageContent.tsx` | Extract plan/feature arrays to `src/lib/constants/pricing.ts` | | ⏳ |

## LOW (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | admin/notifications/delivery/retry — queue_id unvalidated | `_handlers/admin/notifications/delivery/retry/route.ts` | Add Zod: queue_id z.string().uuid() | | ⏳ |
| L-02 | admin/pdf-imports/[id] — action not constrained to enum | `_handlers/admin/pdf-imports/[id]/route.ts` | Add Zod: action z.enum(['approve','reject','archive']) | | ⏳ |
| L-03 | admin/contacts — arbitrary keys reach org scoping | `_handlers/admin/contacts/route.ts` | Add Zod schema for required fields | | ⏳ |

## Test Suite Status
- Vitest: pending
- Playwright E2E: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| P1 | — | 2026-03-15 | chore: create remediation tracker s36 |
