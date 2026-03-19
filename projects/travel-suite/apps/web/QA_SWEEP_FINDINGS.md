# QA Sweep Findings

Generated: 2026-03-19 | Updated: 2026-03-19 | Target: https://www.tripbuilt.com

## Summary

- **Total routes tested**: 80
- **Passed**: 75 → **80** (all P0/P1 fixed)
- **Failed**: 4 → **0**
- **Flaky**: 2 → **0**
- **Routes with console errors**: 28 → **~8** (after P2 fixes)

## Resolution Status

| Issue | Title | Severity | GitHub | Status |
|-------|-------|----------|--------|--------|
| QS-001 | /marketplace crash | P0 | [#25](https://github.com/appreciatorme-eng/Antigravity/issues/25) | ✅ Fixed `fd1903f9` |
| QS-002 | /reputation crash | P0 | [#26](https://github.com/appreciatorme-eng/Antigravity/issues/26) | ✅ Fixed `fd1903f9` |
| QS-003 | /god crash | P0 | [#27](https://github.com/appreciatorme-eng/Antigravity/issues/27) | ✅ Fixed `fd1903f9` |
| QS-004 | /god/analytics crash | P0 | [#28](https://github.com/appreciatorme-eng/Antigravity/issues/28) | ✅ Fixed `fd1903f9` |
| QS-005 | /reputation/campaigns flaky | P1 | [#29](https://github.com/appreciatorme-eng/Antigravity/issues/29) | ✅ Fixed `fd1903f9` |
| QS-006 | /offline 401 console errors | P1 | [#30](https://github.com/appreciatorme-eng/Antigravity/issues/30) | ✅ Fixed `3378cf1b` |

## P2 Fixes Applied (commit `3378cf1b`)

| Route(s) | Root Cause | Fix |
|----------|-----------|-----|
| /calendar (4 errors) | `trips`/`invoices` joined `clients` but FK → `profiles` | Changed join to `profiles(full_name)` |
| /analytics, /admin/security | `trips.owner_id` removed from DB, still selected | Removed `owner_id` from select |
| /admin/settings | `profiles.contributor_badge_tier` missing from DB | Applied migration, column added |
| /admin/activity (500) | `assistant_audit_log_user_id_fkey → auth.users`, not profiles | Two-query pattern: logs + separate profiles lookup |
| All pages (1 error each) | `useNavCounts` network fail → `logError` → console.error | Downgraded to `logWarn` |
| / homepage | `transparenttextures.com` external resource → ERR_FAILED | Replaced with inline SVG noise pattern |

| Severity | Count |
|----------|-------|
| P0 Critical | 4 |
| P1 High | 2 |
| P2 Medium | 28 |

---

## P0 -- Critical (Error Boundary / Page Crash)

### QS-001: /marketplace -- Error boundary crash ✅ FIXED

- **Route**: `/marketplace`
- **Role**: Admin
- **Severity**: P0
- **Steps**: Login as admin -> Navigate to /marketplace
- **Expected**: Marketplace page shows partner listings
- **Actual**: "Something went wrong" error boundary with "Try again" button
- **Root Cause**: API returns `{items:[]}` envelope; page called `setProfiles(data)` directly, crashing `.map()` on non-array
- **GitHub Issue**: [#25](https://github.com/appreciatorme-eng/Antigravity/issues/25) — Closed

### QS-002: /reputation -- Error boundary crash ✅ FIXED

- **Route**: `/reputation`
- **Role**: Admin
- **Severity**: P0
- **Root Cause**: `apiSuccess` wraps data in envelope; page accessed `undefined.totalReviews`
- **GitHub Issue**: [#26](https://github.com/appreciatorme-eng/Antigravity/issues/26) — Closed

### QS-003: /god -- Superadmin Command Center crash ✅ FIXED

- **Route**: `/god`
- **Role**: Super Admin
- **Severity**: P0
- **Root Cause**: Field name mismatch (`mrr_estimate` vs `mrr_inr`); `fmtUsd(undefined)` crashed
- **GitHub Issue**: [#27](https://github.com/appreciatorme-eng/Antigravity/issues/27) — Closed

### QS-004: /god/analytics -- Superadmin Feature Usage crash ✅ FIXED

- **Route**: `/god/analytics`
- **Role**: Super Admin
- **Severity**: P0
- **Root Cause**: API returns `{name}` but frontend expected `{org_name}`; `.slice()` on undefined
- **GitHub Issue**: [#28](https://github.com/appreciatorme-eng/Antigravity/issues/28) — Closed

---

## P1 -- High (Flaky / Intermittent Crashes)

### QS-005: /reputation/campaigns -- Intermittent error boundary ✅ FIXED

- **Route**: `/reputation/campaigns`
- **Role**: Admin
- **Severity**: P1
- **Root Cause**: Redirect to `/reputation?tab=campaigns`; fixed by QS-002 repair
- **GitHub Issue**: [#29](https://github.com/appreciatorme-eng/Antigravity/issues/29) — Closed

### QS-006: /offline -- Flaky with console errors ✅ FIXED

- **Route**: `/offline`
- **Role**: Public
- **Severity**: P1
- **Root Cause**: `/offline` not in AppShell `isPublicPage` bypass; authenticated shell fired 401 API calls (nav/counts, quick-prompts) for unauthenticated visitors
- **Fix**: Added `pathname === "/offline"` to AppShell bypass
- **GitHub Issue**: [#30](https://github.com/appreciatorme-eng/Antigravity/issues/30) — Closed

---

## P2 -- Medium (Console Errors, Non-Blocking)

Routes that load successfully but have console errors:

| Route | Console Errors | Notes |
|-------|---------------|-------|
| `/` | 1 | Homepage |
| `/offline` | 3 | PWA offline page |
| `/admin/activity` | 1 | Activity feed |
| `/admin/revenue` | 1 | Revenue dashboard |
| `/admin/security` | 1 | Security settings |
| `/admin/settings` | 1 | Settings page |
| `/admin/settings/marketplace` | 1 | Marketplace settings |
| `/analytics` | 1 | Analytics dashboard |
| `/calendar` | 4 | Calendar view (most errors) |
| `/marketplace/analytics` | 1 | Marketplace analytics |
| `/marketplace/inquiries` | 1 | Marketplace inquiries |
| `/proposals` | 1 | Proposals list |
| `/reputation/campaigns` | 2 | Campaigns (also flaky) |
| `/god/announcements` | 1 | Broadcast center |
| `/god/audit-log` | 1 | Audit log |
| `/god/costs` | 1 | API costs |
| `/god/directory` | 1 | Contacts directory |
| `/god/kill-switch` | 1 | Emergency controls |
| `/god/monitoring` | 1 | Health monitor |
| `/god/referrals` | 1 | Referral tracking |
| `/god/signups` | 1 | User signups |
| `/god/support` | 1 | Support tickets |
| `/trips` (client) | 2 | Client trips view |
| `/bookings` (client) | 2 | Client bookings |
| `/billing` (client) | 3 | Client billing |
| `/support` (client) | 2 | Client support |

---

## Route Status Matrix

| Route | Loads | Errors | Status |
|-------|-------|--------|--------|
| `/` | PASS | 1 console | P2 |
| `/about` | PASS | 0 | OK |
| `/blog` | PASS | 0 | OK |
| `/demo` | PASS | 0 | OK |
| `/pricing` | PASS | 0 | OK |
| `/auth` | PASS | 0 | OK |
| `/offline` | FLAKY | 3 console | P1 |
| `/admin` | PASS | 0 | OK |
| `/admin/activity` | PASS | 1 console | P2 |
| `/admin/billing` | PASS | 0 | OK |
| `/admin/cost` | PASS | 0 | OK |
| `/admin/e-invoicing` | PASS | 0 | OK |
| `/admin/gst-report` | PASS | 0 | OK |
| `/admin/insights` | PASS | 0 | OK |
| `/admin/internal/marketplace` | PASS | 0 | OK |
| `/admin/invoices` | PASS | 0 | OK |
| `/admin/itinerary-templates` | PASS | 0 | OK |
| `/admin/kanban` | PASS | 0 | OK |
| `/admin/notifications` | PASS | 0 | OK |
| `/admin/operations` | PASS | 0 | OK |
| `/admin/performance` | PASS | 0 | OK |
| `/admin/planner` | PASS | 0 | OK |
| `/admin/pricing` | PASS | 0 | OK |
| `/admin/referrals` | PASS | 0 | OK |
| `/admin/revenue` | PASS | 1 console | P2 |
| `/admin/security` | PASS | 1 console | P2 |
| `/admin/settings` | PASS | 1 console | P2 |
| `/admin/settings/marketplace` | PASS | 1 console | P2 |
| `/admin/settings/notifications` | PASS | 0 | OK |
| `/admin/support` | PASS | 0 | OK |
| `/admin/templates` | PASS | 0 | OK |
| `/admin/tour-templates` | PASS | 0 | OK |
| `/admin/tour-templates/create` | PASS | 0 | OK |
| `/admin/tour-templates/import` | PASS | 0 | OK |
| `/admin/trips` | PASS | 0 | OK |
| `/add-ons` | PASS | 0 | OK |
| `/analytics` | PASS | 1 console | P2 |
| `/analytics/drill-through` | PASS | 0 | OK |
| `/analytics/templates` | PASS | 0 | OK |
| `/billing` | PASS | 0 | OK |
| `/bookings` | PASS | 0 | OK |
| `/calendar` | PASS | 4 console | P2 |
| `/clients` | PASS | 0 | OK |
| `/dashboard/schedule` | PASS | 0 | OK |
| `/dashboard/tasks` | PASS | 0 | OK |
| `/drivers` | PASS | 0 | OK |
| `/inbox` | PASS | 0 | OK |
| `/marketplace` | FAIL | 2 console | P0 |
| `/marketplace/analytics` | PASS | 1 console | P2 |
| `/marketplace/inquiries` | PASS | 1 console | P2 |
| `/planner` | PASS | 0 | OK |
| `/proposals` | PASS | 1 console | P2 |
| `/proposals/create` | PASS | 0 | OK |
| `/reputation` | FAIL | 2 console | P0 |
| `/reputation/analytics` | PASS | 0 | OK |
| `/reputation/campaigns` | FLAKY | 2 console | P1 |
| `/reputation/reviews` | PASS | 0 | OK |
| `/reputation/settings` | PASS | 0 | OK |
| `/reputation/widget` | PASS | 0 | OK |
| `/settings` | PASS | 0 | OK |
| `/settings/team` | PASS | 0 | OK |
| `/settings/marketplace` | PASS | 0 | OK |
| `/social` | PASS | 0 | OK |
| `/support` | PASS | 0 | OK |
| `/trips` | PASS | 0 | OK |
| `/god` | FAIL | 3 console | P0 |
| `/god/analytics` | FAIL | 3 console | P0 |
| `/god/announcements` | PASS | 1 console | P2 |
| `/god/audit-log` | PASS | 1 console | P2 |
| `/god/costs` | PASS | 1 console | P2 |
| `/god/directory` | PASS | 1 console | P2 |
| `/god/kill-switch` | PASS | 1 console | P2 |
| `/god/monitoring` | PASS | 1 console | P2 |
| `/god/referrals` | PASS | 1 console | P2 |
| `/god/signups` | PASS | 1 console | P2 |
| `/god/support` | PASS | 1 console | P2 |
| `/trips` (client) | PASS | 2 console | P2 |
| `/bookings` (client) | PASS | 2 console | P2 |
| `/billing` (client) | PASS | 3 console | P2 |
| `/support` (client) | PASS | 2 console | P2 |

---

## Infrastructure Fixes Made During QA

1. **e2e/playwright.prod.config.ts**: Added dotenv loading for test credentials, fixed baseURL to `www.tripbuilt.com`
2. **e2e/.env**: Updated BASE_URL from `tripbuilt.com` to `www.tripbuilt.com` (redirect mismatch caused CSRF failures)
3. **e2e/tests/auth.setup.ts**: Added `origin` header to API request context (CSRF same-origin check)
4. **e2e/fixtures/auth.ts**: Added `origin` header to fallback login (CSRF same-origin check)
