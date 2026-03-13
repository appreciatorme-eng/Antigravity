# Remediation Tracker S27

**Date**: 2026-03-13 | **Branch**: `fix/remediation-s27` | **Source**: Codex audit (commit `6504b809`)
**Risk Score**: 81/100 | **Total Findings**: 17 (1 CRITICAL · 7 HIGH · 4 MEDIUM · 2 LOW · 3 INFO)

## Legend
✅ Done | 🔄 In Progress | ⏳ Pending | 📝 Documented (no code change)

---

## CRITICAL (1)

| ID | Finding | File:Line | Action | Status |
|----|---------|-----------|--------|--------|
| F-01 | `GET /api/whatsapp/qr` trusts caller-supplied `sessionName` — cross-tenant QR retrieval | `whatsapp/qr/route.ts:30` | `requireAdmin` + server-side sessionName derivation | ✅ |

## HIGH (7)

| ID | Finding | File:Line | Action | Status |
|----|---------|-----------|--------|--------|
| F-02 | `POST /api/whatsapp/disconnect` lacks `requireAdmin` — any member can reset session | `whatsapp/disconnect/route.ts:25` | Add `requireAdmin` | ✅ |
| F-03 | `POST /api/whatsapp/test-message` lacks `requireAdmin` — any member sends real WA msg | `whatsapp/test-message/route.ts:22` | Add `requireAdmin` | ✅ |
| F-04 | `GET /api/whatsapp/conversations` exposes full inbox to any org member | `whatsapp/conversations/route.ts:57` | Add `requireAdmin` | ✅ |
| F-05 | `AdminCostOverviewPage` 772-line function in 888-line file | `admin/cost/page.tsx:116` | 📝 Structural — tracked, large refactor deferred | 📝 |
| F-06 | `SettingsPage` 789-line function in 815-line file | `settings/page.tsx:26` | 📝 Structural — tracked, large refactor deferred | 📝 |
| F-07 | `BillingView` 773-line function in 819-line file | `billing/BillingView.tsx:46` | 📝 Structural — tracked, large refactor deferred | 📝 |
| F-08 | `TemplateGallery` 756-line component in 864-line file | `social/TemplateGallery.tsx:103` | 📝 Structural — tracked, large refactor deferred | 📝 |

## MEDIUM (4)

| ID | Finding | File:Line | Action | Status |
|----|---------|-----------|--------|--------|
| F-09 | `GET /api/whatsapp/status` exposes phone/display_name to any org member | `whatsapp/status/route.ts:21` | Add `requireAdmin` | ✅ |
| F-10 | `GET /api/whatsapp/health` exposes session_name/health to any org member | `whatsapp/health/route.ts:18` | Add `requireAdmin` | ✅ |
| F-11 | `dashboard/tasks/dismiss` loads `role` but never enforces it | `dashboard/tasks/dismiss/route.ts:39` | Replace custom auth with `requireAdmin` | ✅ |
| F-12 | `reputation/dashboard` reads reviews with `createAdminClient()` — bypasses RLS | `reputation/dashboard/route.ts:17` | Add `requireAdmin` to GET handler | ✅ |

## LOW (2)

| ID | Finding | File:Line | Action | Status |
|----|---------|-----------|--------|--------|
| F-13 | `ConfirmDangerModal` backdrop clickable div with no keyboard semantics | `god-mode/ConfirmDangerModal.tsx:41` | 📝 Already fixed in prior remediation (aria-hidden, role=dialog, Escape key) | 📝 |
| F-14 | `ItineraryMap` uses `@ts-expect-error` + non-null assertions | `map/ItineraryMap.tsx:21` | Add Leaflet type augmentation, add guards | ✅ |

## INFO (3 — no code change)

| ID | Finding | Status |
|----|---------|--------|
| F-15 | `api-dispatch.ts` types handler modules as `Record<string, any>` | 📝 |
| F-16 | `payment-receipt-config.ts` — hardcoded GST default with TODO | 📝 |
| F-17 | `places/route.ts` accepts `supabaseAdmin: any` | 📝 |

---

## Architecture Findings (F-05–F-08) — Deferred

These four HIGH findings require extracting 700–800 line components into hooks/panels. Without dedicated component test coverage the refactor carries significant regression risk. Each is logged in DEEP_REVIEW_TRACKER.md for a dedicated architecture sprint.

---

## Test Suite Status

| Suite | Status |
|-------|--------|
| Lint | ✅ 0 warnings |
| Typecheck | ✅ 0 errors |
| Unit/Integration | ✅ 600/600 passed |
| E2E | ✅ remediation-s27.spec.ts (10 tests) |

---

## Commit Log

| Phase | Commit | Summary |
|-------|--------|---------|
| chore | `cf8521b` | Create remediation tracker S27 |
| fix | `05b26ee` | Remediate S27 findings (F-01–F-12, F-14) |
| test | `3a31ebc` | Add E2E tests for S27 remediation |
