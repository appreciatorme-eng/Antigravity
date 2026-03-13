# Security Hardening Tracker — Sprint S23

**Codex Audit Score**: 56/110 → Target: 80+/110
**Branch**: `main` (Codex remediation merged)
**Started**: 2026-03-12

---

## Status Legend
- ✅ Complete
- 🔧 In Progress
- ⬜ Not Started

---

## CRITICAL

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 1 | SH-1 | Payment forgery — `track/[token]` accepted `paid`/`cancelled` without Razorpay proof | ✅ | Removed from public events + `_callerVerified` defense-in-depth |

## HIGH — CSRF Gaps

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 2 | SH-2 | `admin/clients/route.ts` POST missing CSRF | ✅ | Added `passesMutationCsrfGuard` |
| 3 | SH-3 | `admin/contacts/route.ts` POST missing CSRF | ✅ | Added `passesMutationCsrfGuard` |
| 4 | SH-4 | `admin/generate-embeddings/route.ts` POST missing CSRF | ✅ | Added `passesMutationCsrfGuard` |
| 5 | SH-5 | `admin/leads/route.ts` POST missing CSRF | ✅ | Added `passesMutationCsrfGuard` |
| 6 | SH-6 | `admin/trips/route.ts` POST missing CSRF | ✅ | Added `passesMutationCsrfGuard` |
| 7 | SH-7 | `superadmin/announcements/route.ts` POST missing CSRF | ✅ | Added `passesMutationCsrfGuard` |

## HIGH — Cron Auth

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 8 | SH-8 | `cron/assistant-alerts` bypasses `authorizeCronRequest()` | ✅ | Migrated to hardened cron auth |
| 9 | SH-9 | `notifications/schedule-followups` bypasses `authorizeCronRequest()` | ✅ | Migrated to hardened cron auth |
| 10 | SH-10 | `reputation/ai/batch-analyze` timing-unsafe + wrong spend bucket | ✅ | Migrated to hardened cron auth + fixed `ai_image` → `ai_text` |

## MEDIUM — Error Leakage

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 11 | SH-11 | 6 raw `error.message` in `share/[token]/route.ts` | ✅ | Replaced with `safeErrorMessage()` |

## MEDIUM — GST / Payment

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 12 | SH-12 | Hardcoded `"5% GST (HSN 998551)"` in `payments/verify` | ✅ | Extracted to config |

## MEDIUM — WAHA Webhook

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 13 | SH-13 | Query string secret fallback in `webhooks/waha/secret.ts` | ✅ | Removed — header-only now |

## MEDIUM — Test Coverage

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 14 | SH-14 | Stale test fixture `expires_at: "2026-03-10"` | ✅ | Changed to relative date |
| 15 | SH-15 | Vitest coverage whitelist too narrow | ✅ | Expanded coverage include list |
| 16 | SH-16 | No tests for payment tracking abuse | ✅ | Added unit tests for `paid`/`cancelled` rejection |

## MEDIUM — Rate Limiting

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 17 | SH-17 | 3 catch-all families missing rate limits (assistant, reputation, social) | ✅ | Added rate limit config |

## MEDIUM — Code Quality

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 18 | SH-18 | 143 `select("*")` across handlers | ✅ | All replaced with explicit column lists (Codex: 134, manual: 9) |
| 19 | SH-19 | 13 files over 800 lines | ✅ | All split (Codex: 11 files, manual: 2 — `map.tsx`, `proposals/create/page.tsx`) |

## LOW — Documentation

| # | ID | Issue | Status | Notes |
|---|-----|-------|--------|-------|
| 20 | SH-20 | CLAUDE.md inaccuracies (Next.js version, middleware path, catch-all count) | ✅ | Updated |

---

## Summary

| Severity | Total | Complete | Remaining |
|----------|-------|----------|-----------|
| CRITICAL | 1 | 1 | 0 |
| HIGH | 9 | 9 | 0 |
| MEDIUM | 10 | 10 | 0 |
| LOW | 1 | 1 | 0 |
| **TOTAL** | **21** | **21** | **0** |

**All items complete.** Ready for re-audit.
