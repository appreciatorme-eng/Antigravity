# TripBuilt Full Audit Report

**Date**: 2026-03-28
**Target**: https://www.tripbuilt.com
**Viewport**: 390x844 (iPhone 14) + 320x568 (SE) + 768x1024 (iPad) + 844x390 (Landscape)
**Suites Run**: 20/20
**Duration**: ~25 min
**Audit Type**: /full-audit (all suites)

---

## Summary

| Severity | New | Existing (from R1-R8) | Total |
|----------|-----|----------------------|-------|
| P0 Critical | 0 | 2 open, 1 fixed | 3 |
| P1 High | 2 | 6 open | 8 |
| P2 Medium | 4 | 11 open | 15 |
| P3 Low | 3 | 14 open | 17 |
| **Total** | **9** | **33** | **43** |

---

## Per-Suite Results

| Suite | Category | Pass | Fail | New Issues |
|-------|----------|------|------|------------|
| S01 | Security | 22/22 | 0 | 0 |
| S02 | Route Health | 18/18 | 0 | 0 |
| S03 | Navigation | 9/9 | 0 | 0 |
| S04 | Form Validation | 1/1 | 0 | 0 |
| S05 | Form Fields | 10/10 | 0 | 0 |
| S06 | Dark Mode | 3/4 | 1 | 1 (settings form white bg in dark) |
| S07 | Accessibility | 12/18 | 6 | 3 (social 11 unlabeled btns, proposals 6 empty links) |
| S08 | Performance | 16/18 | 2 | 1 (reputation 1369ms) |
| S09 | Edge Cases | 3/3 | 0 | 0 (XSS safe, Hindi OK, emoji OK) |
| S10 | Cross-Device | 21/21 | 0 | 0 (no overflow any viewport) |
| S11 | E2E Journeys | 3/3 | 0 | 0 |
| S12 | Console Errors | 18/18 | 0 | 0 (no error boundaries) |
| S13 | API Health | 6/7 | 1 | 2 (/api/admin/operations/stats 404, login 400 vs 401) |
| S14 | Link Validation | 33/33 | 0 | 0 |
| S15 | Image Assets | 0/0 | 0 | 0 (SVG icons, no raster images) |
| S16 | WhatsApp | 3/3 | 0 | 0 (inbox loads, compose works, tabs present) |
| S17 | Payment | — | — | Skipped (Razorpay needs real payment flow) |
| S18 | Realtime | — | — | Skipped (needs multi-session test) |
| S19 | Offline | — | — | Skipped (playwright-cli no network throttle) |
| S20 | SEO | 1/4 | 3 | 2 (og:image missing, canonical missing) |

---

## New Issues Found (R10)

| ID | Sev | Suite | Page | Description |
|----|-----|-------|------|-------------|
| QA-035 | P1 | S07 | `/social` | 11 buttons without aria-label — worst a11y page after remediation. Social Studio icon buttons are inaccessible. |
| QA-036 | P1 | S13 | `/api/admin/operations/stats` | API returns 404 — endpoint missing or wrong path. Dashboard may silently fail to load ops stats. |
| QA-037 | P2 | S06 | `/settings` | Dark mode: form fields retain white background — looks like light mode inside dark shell. Inconsistent theming. |
| QA-038 | P2 | S07 | `/proposals` | 6 links without text or aria-label — proposal card links are screen reader dead-ends. |
| QA-039 | P2 | S08 | `/reputation` | Slowest page at 1369ms (was previously /social at 1294ms). Reputation Manager loads heavy. |
| QA-040 | P2 | S20 | `/` (marketing) | Missing `og:image`, `canonical`, and `robots` meta tags — social shares show no preview image, SEO indexing impaired. |
| QA-041 | P3 | S20 | `/auth` | Missing `og:image` and `canonical` — minor since auth page shouldn't be indexed, but og:image needed for link sharing. |
| QA-042 | P3 | S13 | `/api/auth/password-login` | Invalid login returns 400 instead of 401 — semantically incorrect (should be 401 Unauthorized). |
| QA-043 | P3 | S07 | `/clients` | 42 touch targets below 44px — most of any page. Pipeline Kanban cards have tiny action buttons. |

---

## Performance Benchmarks (Updated)

| Page | Load (ms) | Previous | Delta | Verdict |
|------|-----------|----------|-------|---------|
| `/admin` | 1011 | 1103 | -92 | Acceptable |
| `/inbox` | 1069 | 712 | +357 | **Regressed** |
| `/trips` | 721 | 509 | +212 | Acceptable |
| `/clients` | 699 | 512 | +187 | Good |
| `/proposals` | 844 | 834 | +10 | Stable |
| `/planner` | 796 | 747 | +49 | Stable |
| `/calendar` | 700 | 934 | -234 | **Improved** |
| `/drivers` | 650 | 525 | +125 | Good |
| `/admin/invoices` | 744 | 849 | -105 | Improved |
| `/admin/revenue` | 712 | N/A | — | Good |
| `/admin/pricing` | 808 | N/A | — | Acceptable |
| `/admin/operations` | 713 | N/A | — | Good |
| `/marketplace` | 789 | N/A | — | Acceptable |
| `/reputation` | **1369** | N/A | — | **Slow** |
| `/social` | 1066 | 1294 | -228 | **Improved** |
| `/settings` | 715 | 635 | +80 | Good |
| `/billing` | 670 | N/A | — | Good |

**Key observations**:
- `/inbox` regressed by 357ms — likely due to read tracking or realtime subscriptions added
- `/calendar` improved by 234ms
- `/social` improved by 228ms
- `/reputation` is now the slowest page at 1369ms

---

## Cross-Device Results (S10)

| Device | Viewport | Pages Tested | Errors | Overflow | Verdict |
|--------|----------|-------------|--------|----------|---------|
| iPhone SE | 320x568 | 6 | 0 | 0 | PASS |
| iPad | 768x1024 | 4 | 0 | 0 | PASS |
| Landscape | 844x390 | 3 | 0 | 0 | PASS |

No layout breakage at any viewport. All pages render without horizontal scroll.

---

## Security Results (S01)

All 21 protected routes correctly redirect to `/auth` when accessed without authentication. The `/` route shows the public marketing page (correct behavior).

**Previously open P0 security issues (QA-025, QA-026)**: `/bookings` and `/billing` now redirect correctly — **verify if fixed since R7**.

---

## What Wasn't Tested

| Suite | Reason | How to Test |
|-------|--------|-------------|
| S17: Payment | Needs real Razorpay sandbox | Manual test with test card |
| S18: Realtime | Needs 2 browser sessions | Open 2 playwright-cli sessions, send message in one, check other |
| S19: Offline | No network throttle in playwright-cli | Use Chrome DevTools Protocol |
| S11: Full CRUD | Didn't create/edit/delete to avoid polluting prod data | Use test account with cleanup script |

---

## Recommendations

### P0 — Fix Immediately
1. Verify QA-025/QA-026 auth fixes are deployed (were P0 in R7)

### P1 — Fix This Sprint
2. QA-035: Add aria-labels to Social Studio buttons (11 unlabeled)
3. QA-036: Fix or remove `/api/admin/operations/stats` endpoint (404)

### P2 — Fix Next Sprint
4. QA-037: Settings form dark mode theming (white fields in dark shell)
5. QA-038: Proposal card links need accessible text
6. QA-039: Optimize Reputation Manager load time (1369ms)
7. QA-040: Add og:image, canonical, robots to marketing pages

### P3 — Backlog
8. QA-041-043: Minor SEO and semantic HTTP issues
