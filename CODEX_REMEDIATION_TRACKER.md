# Codex Audit Remediation Tracker

**Branch**: `fix/remediation-codex`
**Audit**: Codex Security Audit (commit `47cb7f9`)
**Risk Score**: 88/100
**Total Findings**: 26 (4 CRITICAL · 13 HIGH · 2 MEDIUM · 4 LOW · 3 INFO)

## Status Legend
- ✅ Fixed & verified
- 🔄 In progress
- ⏳ Pending
- 📝 Documented — accepted / no code change

---

## CRITICAL

| ID | File | Finding | Status |
|----|------|---------|--------|
| F-001 | `src/lib/api-dispatch.ts:23` | `extractRateLimitIdentifier()` decodes unverified JWT payload; attacker can forge `sub` to evade/poison rate-limit bucket | ✅ |
| F-002 | `src/app/api/_handlers/subscriptions/route.ts:139` | Any org member can create/upgrade subscription (no admin guard) | ✅ |
| F-003 | `src/app/api/_handlers/subscriptions/cancel/route.ts:22` | Any org member can cancel subscription (no admin guard) | ✅ |
| F-004 | `src/app/api/_handlers/whatsapp/broadcast/route.ts:363` | Any org member can send bulk WhatsApp via org session | ✅ |

## HIGH

| ID | File | Finding | Status |
|----|------|---------|--------|
| F-005 | `src/app/api/_handlers/whatsapp/broadcast/route.ts:329` | GET exposes org-wide recipient counts/contacts to any org member | ✅ |
| F-006 | `src/app/api/_handlers/whatsapp/send/route.ts:14` | Any org member can send arbitrary outbound WhatsApp | ✅ |
| F-007 | `src/app/api/_handlers/whatsapp/connect/route.ts:19` | Any org member can create/resume WA sessions (force QR re-pair) | ✅ |
| F-008 | `src/app/api/_handlers/payments/create-order/route.ts:32` | Any org member can create payment orders | ✅ |
| F-009 | `src/app/api/_handlers/payments/links/route.ts:25` | Any org member can mint payment links (no admin guard) | ✅ |
| F-010 | `src/app/api/_handlers/payments/links/route.ts:84` | Cross-tenant IDOR: `clientId` resolved without org-scope filter | ✅ |
| F-011 | `src/app/api/_handlers/billing/subscription/route.ts:15` | Any org member can read billing/subscription info | ✅ |
| F-012 | `src/app/api/_handlers/settings/upi/route.ts:11` | Any org member can overwrite UPI handle | ✅ |
| F-013 | `src/app/api/_handlers/settings/marketplace/route.ts:81` | Any org member can read marketplace profile/docs | ✅ |
| F-014 | `src/app/api/_handlers/dashboard/tasks/route.ts:305` | Any org member gets org-wide finance/ops tasks (role fetched but unused) | ✅ |
| F-015 | `src/app/api/_handlers/dashboard/schedule/route.ts:92` | Any org member gets org-wide trip/client/driver schedule | ✅ |
| F-016 | `src/app/api/_handlers/drivers/search/route.ts:37` | Any org member can enumerate full driver directory (role selected but unused) | ✅ |
| F-017 | `src/app/api/_handlers/nav/counts/route.ts:26` | Any org member gets org-wide inbox/proposal/booking/review counts | ✅ |

## MEDIUM

| ID | File | Finding | Status |
|----|------|---------|--------|
| F-018 | `src/app/api/_handlers/settings/upi/route.ts:42` | `organization_settings.upsert()` error not checked — route returns success on failed write | ✅ |
| F-019 | `src/app/api/_handlers/reputation/dashboard/route.ts:17` | Unbounded query: all org reviews loaded into memory with no date/row cap | ✅ |

## LOW

| ID | File | Finding | Status |
|----|------|---------|--------|
| F-020 | `src/app/api/_handlers/payments/track/[token]/route.ts:19` | Public payment-status tracking has no rate limiter | ✅ |
| F-021 | `src/components/leads/LeadToBookingFlow.tsx:460` | `JSON.parse()` on localStorage not guarded — throws on corrupt data | ✅ |
| F-022 | `src/components/god-mode/ConfirmDangerModal.tsx:33` | Modal backdrop: clickable div with no keyboard handler/role | ✅ |
| F-023 | `src/lib/social/poster-premium-blocks.ts` | Circular dependency: `poster-premium-blocks` ↔ other social modules | ✅ |

## INFO (no code change needed)

| ID | Finding | Status |
|----|---------|--------|
| F-024 | No `require()` calls found — ESM consistent | 📝 |
| F-025 | No variable-based dynamic `import()` calls — safe | 📝 |
| F-026 | No non-public env vars in client modules (only `NODE_ENV`) | 📝 |

---

## Commit Log

| Commit | Description |
|--------|-------------|
| _(this file)_ | `chore: create codex remediation tracker` |

---

## Test Results

| Suite | Status |
|-------|--------|
| Lint | ✅ 0 warnings |
| Typecheck | ✅ 0 errors |
| Unit/Integration | ✅ 600/600 passed (85.4% stmts, 80.78% branches, 95.55% funcs) |
| E2E | ⏳ |
