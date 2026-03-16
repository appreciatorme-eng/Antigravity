# Remediation Tracker S36
**Date**: 2026-03-15 | **Branch**: `fix/remediation-s36` | **Source**: /remediate (deferred M-05 Zod validation + SSRF hardening)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

## HIGH (2)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| H-01 | SSRF risk — no URL scheme/hostname validation | `_handlers/itinerary/import/url/route.ts` | Add URL scheme whitelist + private-IP blocklist | Already implemented: `isPrivateIp()`, DNS lookup, scheme check on L140. Full SSRF protection present. | 📝 |
| H-02 | Arbitrary actionName execution — no whitelist | `_handlers/assistant/confirm/route.ts` | Add Zod enum for allowed actionNames | Already implemented: `isActionBlocked()` blocklist + `findAction()` registry lookup acts as whitelist. Unknown actions return 400. | 📝 |

## MEDIUM (5)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| M-01 | NPS submit — no JSON parse guard, score unbounded | `_handlers/reputation/nps/submit/route.ts` | Add Zod: score z.number().int().min(0).max(10); add feedback length cap | Score 1–10 range already validated (L51). `feedback` field has no length/type guard — add `typeof feedback === 'string' ? feedback.slice(0, 5000) : null` | ⏳ |
| M-02 | UPI ID format not validated (financial config) | `_handlers/settings/upi/route.ts` | Add Zod with UPI handle regex | Already implemented: `UPI_REGEX = /^[\w.\-+]+@[\w.\-]+$/` on L7. Validated on L24. | 📝 |
| M-03 | Lat/lon types unchecked | `_handlers/location/ping/route.ts` | Add Zod: lat/lon bounds, accuracy positive | Already implemented: `inRange(latitude, -90, 90)` + `inRange(longitude, -180, 180)` on L96. UUID check on L92. | 📝 |
| M-04 | location/share — tripId/dayNumber coercion only | `_handlers/location/share/route.ts` | Add Zod validation | DB-backed scoping: `getScopedTrip()` validates org ownership; `expiresHours` clamped 1–168. Acceptable. | 📝 |
| M-05 | Hardcoded pricing data on marketing page | `app/(marketing)/pricing/_components/PricingPageContent.tsx:25-76` | Extract `plans` + `faqs` arrays to `src/lib/constants/pricing.tsx` | | ⏳ |

## LOW (3)

| ID | Finding | File:Line | Action | Outcome | Status |
|----|---------|-----------|--------|---------|--------|
| L-01 | admin/notifications/delivery/retry — queue_id unvalidated | `_handlers/admin/notifications/delivery/retry/route.ts` | Add UUID validation | Already implemented: `UUID_PATTERN` check on L85 + `sanitizeText` on L81. | 📝 |
| L-02 | admin/pdf-imports/[id] — action not constrained to enum | `_handlers/admin/pdf-imports/[id]/route.ts` | Add Zod enum | Already implemented: `switch (action)` with `approve/reject/re-extract/publish` + `default` 400. | 📝 |
| L-03 | admin/contacts — arbitrary keys reach org scoping | `_handlers/admin/contacts/route.ts` | Add Zod schema | Already implemented: `sanitizeText/sanitizeEmail/sanitizePhone` + `resolveScopedOrganizationId` org guard + CSRF. | 📝 |

## Test Suite Status
- Vitest: pending
- Playwright E2E: pending

## Commit Log
| Phase | Commit | Date | Summary |
|-------|--------|------|---------|
| P1 | 95973ef | 2026-03-15 | chore: create remediation tracker s36 |
