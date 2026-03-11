# Comprehensive QA Test Plan — Antigravity Travel Suite

> **Version**: 1.0
> **Last Updated**: 2026-03-10
> **App URL**: https://travelsuite-rust.vercel.app (production) / http://localhost:3000 (local)
> **QA Account**: `qa-admin@antigravity.dev` / `QaAdmin2026!` (role: admin, org: GoBuddy Admin Organization)
> **Total Test Cases**: 487

Testing method: curl + JWT auth for API tests, playwright-cli for UI tests.
See `test-credentials.md` for auth details.

---

## Table of Contents

1. [AUTH — Authentication & Session Management](#1-auth--authentication--session-management) (32 tests)
2. [ONBOARD — Onboarding Flow](#2-onboard--onboarding-flow) (18 tests)
3. [DASH — Admin Dashboard](#3-dash--admin-dashboard) (22 tests)
4. [CLIENT — Client Management](#4-client--client-management) (28 tests)
5. [TRIP — Trip Management](#5-trip--trip-management) (34 tests)
6. [TMPL — Tour Templates](#6-tmpl--tour-templates) (20 tests)
7. [PROP — Proposals](#7-prop--proposals) (38 tests)
8. [INV — Invoices & Payments](#8-inv--invoices--payments) (42 tests)
9. [BOOK — Bookings & Itineraries](#9-book--bookings--itineraries) (24 tests)
10. [DRIVER — Driver Management](#10-driver--driver-management) (16 tests)
11. [ADDON — Add-Ons](#11-addon--add-ons) (18 tests)
12. [CAL — Calendar & Planner](#12-cal--calendar--planner) (14 tests)
13. [REP — Reputation Management](#13-rep--reputation-management) (30 tests)
14. [SOCIAL — Social Studio](#14-social--social-studio) (26 tests)
15. [MKTPLACE — Marketplace](#15-mktplace--marketplace) (22 tests)
16. [ASST — AI Assistant](#16-asst--ai-assistant) (18 tests)
17. [WA — WhatsApp Integration](#17-wa--whatsapp-integration) (24 tests)
18. [NOTIFY — Notifications](#18-notify--notifications) (16 tests)
19. [PRICE — Pricing Engine](#19-price--pricing-engine) (20 tests)
20. [BILL — Billing & Subscriptions](#20-bill--billing--subscriptions) (18 tests)
21. [GOD — Superadmin / God Mode](#21-god--superadmin--god-mode) (32 tests)
22. [SETTINGS — Settings & Team](#22-settings--settings--team) (16 tests)
23. [SECURITY — Auth Boundaries & RBAC](#23-security--auth-boundaries--rbac) (28 tests)
24. [EDGE — Edge Cases & Error Handling](#24-edge--edge-cases--error-handling) (22 tests)
25. [PERF — Performance & Load](#25-perf--performance--load) (12 tests)
26. [E2E — End-to-End Business Workflows](#26-e2e--end-to-end-business-workflows) (12 tests)

---

## 1. AUTH — Authentication & Session Management

### Happy Path

| ID | Test | Method | Steps |
|----|------|--------|-------|
| AUTH-001 | Valid admin login | UI | Navigate to /auth → fill email/password → click Sign In → EXPECT redirect to /admin |
| AUTH-002 | Valid login via API | curl | `POST /api/auth/password-login` with `{email, password}` → EXPECT 200 + access_token |
| AUTH-003 | Session persists across pages | UI | Login → navigate /admin → /trips → /clients → EXPECT all load without re-auth |
| AUTH-004 | Session cookie set with httpOnly | curl | After login, inspect `Set-Cookie` headers → EXPECT `HttpOnly; Secure; SameSite=Lax` |
| AUTH-005 | Token refresh on page load | UI | Login → wait 55 min → refresh page → EXPECT session still valid (middleware refreshes) |
| AUTH-006 | Logout clears session | UI | Login → navigate /auth/signout → EXPECT redirect to / → /admin returns redirect to /auth |

### Negative / Error

| ID | Test | Method | Steps |
|----|------|--------|-------|
| AUTH-007 | Invalid email format | UI | Enter "notanemail" → EXPECT client-side validation error |
| AUTH-008 | Wrong password | UI | Enter valid email + wrong password → EXPECT error message, no redirect |
| AUTH-009 | Non-existent email | curl | `POST /api/auth/password-login` with unknown email → EXPECT 400 generic error (no user enumeration) |
| AUTH-010 | Empty email field | UI | Leave email blank, fill password → EXPECT validation error |
| AUTH-011 | Empty password field | UI | Fill email, leave password blank → EXPECT validation error |
| AUTH-012 | Both fields empty | UI | Submit empty form → EXPECT validation errors on both fields |
| AUTH-013 | SQL injection in email | curl | `POST /api/auth/password-login` with `email: "' OR 1=1 --"` → EXPECT 400, no data leak |
| AUTH-014 | XSS in email field | UI | Enter `<script>alert(1)</script>` in email → EXPECT sanitized, no script execution |
| AUTH-015 | Expired JWT token | curl | Use token with past `exp` → hit /api/admin/clients → EXPECT 401 |
| AUTH-016 | Malformed JWT token | curl | `Authorization: Bearer abc123` → hit /api/admin/clients → EXPECT 401 |
| AUTH-017 | Missing Authorization header | curl | Hit /api/admin/clients with no header → EXPECT 401 |

### Access Control

| ID | Test | Method | Steps |
|----|------|--------|-------|
| AUTH-018 | Unauthenticated → /admin redirect | UI | Open /admin without login → EXPECT redirect to /auth?next=/admin |
| AUTH-019 | Unauthenticated → /trips redirect | UI | Open /trips without login → EXPECT redirect to /auth?next=/trips |
| AUTH-020 | Unauthenticated → /proposals redirect | UI | Open /proposals without login → EXPECT redirect to /auth?next=/proposals |
| AUTH-021 | Unauthenticated → /god redirect | UI | Open /god without login → EXPECT redirect to /auth?next=/god |
| AUTH-022 | Unauthenticated → /settings redirect | UI | Open /settings without login → EXPECT redirect to /auth?next=/settings |
| AUTH-023 | Unauthenticated → /calendar redirect | UI | Open /calendar without login → EXPECT redirect to /auth?next=/calendar |
| AUTH-024 | All 16 protected prefixes redirect | curl | For each of /admin, /god, /planner, /trips, /settings, /proposals, /reputation, /social, /support, /clients, /drivers, /inbox, /add-ons, /analytics, /calendar → EXPECT 307 to /auth |
| AUTH-025 | Public pages accessible without login | UI | Open /, /auth, /p/any-token, /pay/any-token, /portal/any-token, /live/any-token → EXPECT 200 |
| AUTH-026 | ?next parameter preserved on redirect | UI | Open /trips → redirected to /auth?next=/trips → login → EXPECT redirect to /trips |
| AUTH-027 | ?next parameter rejects absolute URLs | curl | `/auth?next=https://evil.com` → login → EXPECT redirect to /admin (not evil.com) |
| AUTH-028 | ?next parameter rejects protocol-relative URLs | curl | `/auth?next=//evil.com` → login → EXPECT redirect to /admin |

### Concurrent Sessions

| ID | Test | Method | Steps |
|----|------|--------|-------|
| AUTH-029 | Multiple tabs same session | UI | Login in tab 1, open /admin in tab 2 → EXPECT both work |
| AUTH-030 | Logout in one tab | UI | Login in 2 tabs → logout in tab 1 → refresh tab 2 → EXPECT redirect to /auth |
| AUTH-031 | Login on two different browsers | curl | Get 2 separate tokens with same credentials → both should work independently |
| AUTH-032 | Rate limit on login attempts | curl | Send 20 rapid login attempts with wrong password → EXPECT 429 after threshold |

---

## 2. ONBOARD — Onboarding Flow

| ID | Test | Method | Steps |
|----|------|--------|-------|
| ONBOARD-001 | New user → onboarding redirect | UI | Login with new user (onboarding_step=0) → EXPECT redirect to /onboarding |
| ONBOARD-002 | Step 1: Organization setup | curl | `POST /api/onboarding/setup` with `{name, currency}` → EXPECT 200 + org created |
| ONBOARD-003 | Step 2: First value action | curl | `POST /api/onboarding/first-value` → EXPECT 200 + onboarding_step=2 |
| ONBOARD-004 | Complete onboarding → /admin | UI | Finish onboarding → EXPECT redirect to /admin (not /onboarding) |
| ONBOARD-005 | Onboarding-complete user → /onboarding redirect back | UI | Admin user opens /onboarding → EXPECT redirect to /admin |
| ONBOARD-006 | Super admin bypasses onboarding | UI | Login as super_admin (onboarding_step=0) → EXPECT access to /admin directly |
| ONBOARD-007 | Incomplete user blocked from /trips | UI | User with onboarding_step=1 → open /trips → EXPECT redirect to /onboarding |
| ONBOARD-008 | Incomplete user blocked from /proposals | UI | User with onboarding_step=1 → open /proposals → EXPECT redirect to /onboarding |
| ONBOARD-009 | Setup without org name → 400 | curl | `POST /api/onboarding/setup` with empty name → EXPECT 400 |
| ONBOARD-010 | Setup without currency → 400 | curl | `POST /api/onboarding/setup` with empty currency → EXPECT 400 |
| ONBOARD-011 | Setup with already-existing org → idempotent | curl | Call setup twice → EXPECT 200 both times, no duplicate orgs |
| ONBOARD-012 | Onboarding page renders step indicators | UI | Navigate to /onboarding → EXPECT step indicator UI visible |
| ONBOARD-013 | Back button from step 2 → step 1 | UI | On step 2, click back → EXPECT step 1 visible |
| ONBOARD-014 | Direct URL to /onboarding for complete user | curl | Authenticated admin → GET /onboarding → EXPECT 307 redirect |
| ONBOARD-015 | Unauthenticated /onboarding → /auth | UI | Open /onboarding without login → EXPECT redirect to /auth |
| ONBOARD-016 | Onboarding with long org name | curl | Setup with 500-char name → EXPECT 200 or graceful truncation |
| ONBOARD-017 | Onboarding with special characters in name | curl | Setup with `"Test & Co <script>"` → EXPECT sanitized |
| ONBOARD-018 | Onboarding preserves ?next param | UI | Open /trips → redirected to /onboarding?next=/trips → complete → EXPECT redirect to /trips |

---

## 3. DASH — Admin Dashboard

| ID | Test | Method | Steps |
|----|------|--------|-------|
| DASH-001 | Dashboard page loads | UI | Login → EXPECT /admin loads with dashboard cards |
| DASH-002 | Dashboard stats API | curl | `GET /api/admin/dashboard/stats` → EXPECT 200 with stats object |
| DASH-003 | Revenue widget loads | UI | EXPECT revenue chart or number on dashboard |
| DASH-004 | Recent activity visible | UI | EXPECT recent trips/proposals/clients shown |
| DASH-005 | Nav counts API | curl | `GET /api/nav/counts` → EXPECT 200 with badge counts |
| DASH-006 | Dashboard schedule API | curl | `GET /api/dashboard/schedule` → EXPECT 200 with upcoming schedule |
| DASH-007 | Dashboard tasks API | curl | `GET /api/dashboard/tasks` → EXPECT 200 with task list |
| DASH-008 | Dismiss task | curl | `POST /api/dashboard/tasks/dismiss` with `{taskId}` → EXPECT 200 |
| DASH-009 | Revenue API — preset=30d | curl | `GET /api/admin/revenue?preset=30d` → EXPECT 200 with series data |
| DASH-010 | Revenue API — preset=90d | curl | `GET /api/admin/revenue?preset=90d` → EXPECT 200 |
| DASH-011 | Revenue API — preset=12m | curl | `GET /api/admin/revenue?preset=12m` → EXPECT 200 |
| DASH-012 | Revenue API — custom month | curl | `GET /api/admin/revenue?month=2026-03` → EXPECT 200 with that month's data |
| DASH-013 | LTV API | curl | `GET /api/admin/ltv?preset=30d` → EXPECT 200 |
| DASH-014 | Funnel API | curl | `GET /api/admin/funnel` → EXPECT 200 with funnel stages |
| DASH-015 | Revenue page loads | UI | Navigate to /admin/revenue → EXPECT charts render |
| DASH-016 | Cost overview API | curl | `GET /api/admin/cost/overview` → EXPECT 200 |
| DASH-017 | Cost alerts ack | curl | `POST /api/admin/cost/alerts/ack` → EXPECT 200 |
| DASH-018 | Cache metrics API | curl | `GET /api/admin/cache-metrics` → EXPECT 200 |
| DASH-019 | Clear cache API | curl | `POST /api/admin/clear-cache` → EXPECT 200 |
| DASH-020 | Dashboard with no data (fresh org) | curl | New org, no trips → EXPECT dashboard loads with zeros/empty state |
| DASH-021 | Insights page loads | UI | Navigate /admin/insights → EXPECT insights cards render |
| DASH-022 | All insights endpoints return 200 | curl | For each: action-queue, ai-usage, auto-requote, batch-jobs, best-quote, daily-brief, margin-leak, ops-copilot, proposal-risk, roi, smart-upsell-timing, upsell-recommendations, win-loss → EXPECT 200 |

---

## 4. CLIENT — Client Management

### CRUD

| ID | Test | Method | Steps |
|----|------|--------|-------|
| CLIENT-001 | Create client | curl | `POST /api/admin/clients` with `{full_name, email}` → EXPECT 201 with client ID |
| CLIENT-002 | Create client via UI | UI | /clients → Add Client → fill name+email → Save → EXPECT client in list |
| CLIENT-003 | List all clients | curl | `GET /api/admin/clients` → EXPECT 200 with array |
| CLIENT-004 | View client detail | UI | Click client in list → EXPECT /clients/[id] with profile data |
| CLIENT-005 | Edit client name | curl | `PATCH /api/admin/clients?id={id}` with `{full_name: "New Name"}` → EXPECT 200 |
| CLIENT-006 | Edit client email | curl | `PATCH /api/admin/clients?id={id}` with `{email: "new@email.com"}` → EXPECT 200 |
| CLIENT-007 | Delete client | curl | `DELETE /api/admin/clients?id={id}` → EXPECT 200 |
| CLIENT-008 | Verify client deleted from DB | curl | `GET /api/admin/clients` → EXPECT deleted client not in list |
| CLIENT-009 | Client detail page shows trips | UI | Client with trips → /clients/[id] → EXPECT trips section visible |
| CLIENT-010 | Client detail page shows proposals | UI | Client with proposals → EXPECT proposals section visible |

### Validation

| ID | Test | Method | Steps |
|----|------|--------|-------|
| CLIENT-011 | Create without name → 400 | curl | `POST /api/admin/clients` with `{email: "x@y.com"}` only → EXPECT 400 |
| CLIENT-012 | Create without email → 400 | curl | `POST /api/admin/clients` with `{full_name: "Test"}` only → EXPECT 400 |
| CLIENT-013 | Create with invalid email format → 400 | curl | `{full_name: "Test", email: "not-an-email"}` → EXPECT 400 |
| CLIENT-014 | Create with duplicate email | curl | Create same email twice → EXPECT 400 or 409 on second |
| CLIENT-015 | Create with very long name (1000 chars) | curl | EXPECT 400 or truncation |
| CLIENT-016 | Create with XSS in name | curl | `{full_name: "<script>alert(1)</script>"}` → EXPECT sanitized |
| CLIENT-017 | Create with SQL injection in email | curl | `{email: "'; DROP TABLE profiles; --"}` → EXPECT 400, no damage |
| CLIENT-018 | Edit non-existent client → 404 | curl | `PATCH /api/admin/clients?id=nonexistent-uuid` → EXPECT 404 |
| CLIENT-019 | Delete non-existent client → 404 | curl | `DELETE /api/admin/clients?id=nonexistent-uuid` → EXPECT 404 |
| CLIENT-020 | Delete without id param → 400 | curl | `DELETE /api/admin/clients` (no ?id=) → EXPECT 400 |

### Search & Filter

| ID | Test | Method | Steps |
|----|------|--------|-------|
| CLIENT-021 | Search clients by name | curl | `GET /api/admin/clients?search=Pipeline` → EXPECT filtered results |
| CLIENT-022 | Search with no results | curl | `GET /api/admin/clients?search=zzznonexistent` → EXPECT empty array |
| CLIENT-023 | Pagination | curl | `GET /api/admin/clients?limit=5&offset=0` → EXPECT at most 5 results |

### Contacts (sub-feature)

| ID | Test | Method | Steps |
|----|------|--------|-------|
| CLIENT-024 | List contacts | curl | `GET /api/admin/contacts` → EXPECT 200 |
| CLIENT-025 | Promote contact to client | curl | `POST /api/admin/contacts/{id}/promote` → EXPECT 200 + client created |
| CLIENT-026 | Promote already-promoted contact | curl | Promote same contact twice → EXPECT 400 or idempotent |
| CLIENT-027 | Promote non-existent contact → 404 | curl | Promote fake ID → EXPECT 404 |
| CLIENT-028 | Contact with phone number | curl | Create contact with phone → EXPECT phone stored and returned |

---

## 5. TRIP — Trip Management

### CRUD

| ID | Test | Method | Steps |
|----|------|--------|-------|
| TRIP-001 | Create trip via admin API | curl | `POST /api/admin/trips` with `{clientId, startDate, endDate, destination}` → EXPECT 201 |
| TRIP-002 | Create trip via UI | UI | /admin/trips → New → fill form → EXPECT trip created |
| TRIP-003 | List all trips (admin) | curl | `GET /api/admin/trips` → EXPECT 200 with array |
| TRIP-004 | List all trips (user) | curl | `GET /api/trips` → EXPECT 200 with org-scoped array |
| TRIP-005 | View trip detail (admin) | curl | `GET /api/admin/trips/{id}` → EXPECT 200 with trip data |
| TRIP-006 | View trip detail (user) | curl | `GET /api/trips/{id}` → EXPECT 200 |
| TRIP-007 | View trip detail page | UI | /admin/trips/[id] or /trips/[id] → EXPECT trip info visible |
| TRIP-008 | Delete trip (user API) | curl | `DELETE /api/trips/{id}` → EXPECT 200 |
| TRIP-009 | Verify trip deleted from DB | curl | `GET /api/trips/{id}` after delete → EXPECT 404 or empty |

### Trip Features

| ID | Test | Method | Steps |
|----|------|--------|-------|
| TRIP-010 | Clone trip | curl | `POST /api/admin/trips/{id}/clone` → EXPECT 201 with new trip ID |
| TRIP-011 | Clone trip via UI | UI | /admin/trips/[id]/clone → EXPECT clone page with prefilled data |
| TRIP-012 | Trip add-ons list | curl | `GET /api/trips/{id}/add-ons` → EXPECT 200 |
| TRIP-013 | Trip add-ons attach | curl | `POST /api/trips/{id}/add-ons` with `{addOnId, quantity}` → EXPECT 200 |
| TRIP-014 | Trip invoices list | curl | `GET /api/trips/{id}/invoices` → EXPECT 200 |
| TRIP-015 | Trip notifications | curl | `GET /api/trips/{id}/notifications` → EXPECT 200 |

### Validation

| ID | Test | Method | Steps |
|----|------|--------|-------|
| TRIP-016 | Create without clientId → 400 | curl | Missing clientId → EXPECT 400 |
| TRIP-017 | Create without startDate → 400 | curl | Missing startDate → EXPECT 400 |
| TRIP-018 | Create without endDate → 400 | curl | Missing endDate → EXPECT 400 |
| TRIP-019 | Create with endDate before startDate | curl | endDate < startDate → EXPECT 400 |
| TRIP-020 | Create with non-existent clientId → 400/404 | curl | Fake client UUID → EXPECT error |
| TRIP-021 | Delete non-existent trip → 404 | curl | `DELETE /api/trips/fake-uuid` → EXPECT 404 |
| TRIP-022 | Clone non-existent trip → 404 | curl | `POST /api/admin/trips/fake-uuid/clone` → EXPECT 404 |
| TRIP-023 | Create with past dates | curl | startDate in past → EXPECT 200 (historical trips allowed) or 400 |
| TRIP-024 | Create with very far future date (2099) | curl | → EXPECT 200 or validation error |
| TRIP-025 | Trip with special characters in destination | curl | `destination: "São Paulo & 'Tokyo'"` → EXPECT stored correctly |

### UI Interactions

| ID | Test | Method | Steps |
|----|------|--------|-------|
| TRIP-026 | Trip list page loads | UI | /admin/trips → EXPECT table with trip rows |
| TRIP-027 | Trip kanban view | UI | /admin/kanban → EXPECT kanban board with trip cards by status |
| TRIP-028 | Trip detail shows itinerary | UI | /trips/[id] → EXPECT day-by-day itinerary (if exists) |
| TRIP-029 | Trip operations page | UI | /admin/operations → EXPECT command center loads |
| TRIP-030 | Operations command center API | curl | `GET /api/admin/operations/command-center` → EXPECT 200 |
| TRIP-031 | Trip status progression | curl | Create trip → update status to confirmed → active → completed → EXPECT each transition works |
| TRIP-032 | Trip search/filter by status | curl | `GET /api/admin/trips?status=confirmed` → EXPECT filtered |
| TRIP-033 | Trip search by destination | curl | `GET /api/admin/trips?search=Bali` → EXPECT filtered |
| TRIP-034 | Trips template page | UI | /trips/templates → EXPECT template gallery loads |

---

## 6. TMPL — Tour Templates

| ID | Test | Method | Steps |
|----|------|--------|-------|
| TMPL-001 | Tour templates list page | UI | /admin/tour-templates → EXPECT list of templates |
| TMPL-002 | Create template page | UI | /admin/tour-templates/create → EXPECT creation form |
| TMPL-003 | View template detail | UI | /admin/tour-templates/[id] → EXPECT template details |
| TMPL-004 | Edit template | UI | /admin/tour-templates/[id]/edit → EXPECT edit form |
| TMPL-005 | PDF import page | UI | /admin/tour-templates/import → EXPECT file upload UI |
| TMPL-006 | Extract from PDF API | curl | `POST /api/admin/tour-templates/extract` with PDF file → EXPECT 200 with extracted data |
| TMPL-007 | Extract from non-PDF file → 400 | curl | Upload .txt file → EXPECT 400 |
| TMPL-008 | Extract from empty file → 400 | curl | Upload 0-byte file → EXPECT 400 |
| TMPL-009 | Extract from corrupted PDF | curl | Upload random bytes as PDF → EXPECT 400 |
| TMPL-010 | Extract from very large PDF (50MB) | curl | Upload oversized file → EXPECT 413 or 400 |
| TMPL-011 | Templates admin page | UI | /admin/templates → EXPECT template list |
| TMPL-012 | Template with no days | curl | Create template with 0 days → EXPECT works or validation |
| TMPL-013 | Template with 30+ days | curl | Create template with many days → EXPECT stored correctly |
| TMPL-014 | Template name max length | curl | 500-char name → EXPECT validation |
| TMPL-015 | Template with special characters | curl | Name with `"&<>'` → EXPECT sanitized |
| TMPL-016 | Duplicate template name | curl | Create same name twice → EXPECT allowed or rejected |
| TMPL-017 | Delete template used by proposals | curl | Template linked to proposals → EXPECT cascade/block behavior |
| TMPL-018 | PDF-imported template has correct days | UI | After PDF import, check template → EXPECT days match PDF content |
| TMPL-019 | Generate embeddings | curl | `POST /api/admin/generate-embeddings` → EXPECT 200 |
| TMPL-020 | Destinations API | curl | `GET /api/admin/destinations` → EXPECT 200 with destination list |

---

## 7. PROP — Proposals

### CRUD

| ID | Test | Method | Steps |
|----|------|--------|-------|
| PROP-001 | Create proposal | curl | `POST /api/proposals/create` with `{clientId, templateId}` → EXPECT 200 with proposalId |
| PROP-002 | Create proposal via UI | UI | /proposals/create → fill client + template → Save Draft → EXPECT created |
| PROP-003 | List proposals | UI | /proposals → EXPECT list/table of proposals |
| PROP-004 | View proposal detail | UI | /proposals/[id] → EXPECT proposal details with days/pricing |
| PROP-005 | View proposal detail page | curl | Check data loads for proposal ID |

### Send & Share

| ID | Test | Method | Steps |
|----|------|--------|-------|
| PROP-006 | Send proposal | curl | `POST /api/proposals/{id}/send` → EXPECT 200 with shareUrl |
| PROP-007 | ShareUrl is valid (no newline) | curl | Verify shareUrl has no `\n` character |
| PROP-008 | Public share link accessible | curl | `GET /api/proposals/public/{token}` → EXPECT 200 |
| PROP-009 | Public share page renders | UI | /p/{token} → EXPECT proposal content visible to unauthenticated user |
| PROP-010 | Share page with expired token | curl | Use invalid token → EXPECT 404 |
| PROP-011 | Send PDF | curl | `POST /api/proposals/send-pdf` with proposalId → EXPECT 200 |
| PROP-012 | Generate PDF | curl | `GET /api/proposals/{id}/pdf` → EXPECT 200 with PDF content |
| PROP-013 | Bulk operations | curl | `POST /api/proposals/bulk` → EXPECT 200 |

### Convert to Trip

| ID | Test | Method | Steps |
|----|------|--------|-------|
| PROP-014 | Convert proposal to trip | curl | `POST /api/proposals/{id}/convert` with `{startDate}` → EXPECT 200 with tripId + invoiceId |
| PROP-015 | Convert creates invoice | curl | After convert → verify invoice exists with correct amount |
| PROP-016 | Convert without startDate → 400 | curl | Missing startDate → EXPECT 400 "Start date is required" |
| PROP-017 | Convert proposal with no days → 400 | curl | Proposal without proposal_days → EXPECT 400 "no day plan" |
| PROP-018 | Convert non-existent proposal → 404 | curl | Fake proposal ID → EXPECT 404 |
| PROP-019 | Convert already-converted proposal | curl | Convert same proposal twice → EXPECT 400 "already converted" or idempotent |
| PROP-020 | Convert sets trip status to confirmed | curl | After convert → `GET /api/trips/{tripId}` → EXPECT status=confirmed |
| PROP-021 | Convert sets invoice status to draft | curl | After convert → verify invoice status=draft |

### Payment Plan & Tiers

| ID | Test | Method | Steps |
|----|------|--------|-------|
| PROP-022 | Get payment plan | curl | `GET /api/admin/proposals/{id}/payment-plan` → EXPECT 200 |
| PROP-023 | Update payment plan | curl | `POST /api/admin/proposals/{id}/payment-plan` → EXPECT 200 |
| PROP-024 | Get proposal tiers | curl | `GET /api/admin/proposals/{id}/tiers` → EXPECT 200 |
| PROP-025 | Update proposal tiers | curl | `POST /api/admin/proposals/{id}/tiers` → EXPECT 200 |

### Validation

| ID | Test | Method | Steps |
|----|------|--------|-------|
| PROP-026 | Create without clientId → 400 | curl | Missing clientId → EXPECT 400 with field errors |
| PROP-027 | Create without templateId → 400 | curl | Missing templateId → EXPECT 400 with field errors |
| PROP-028 | Create with non-existent clientId → 400 | curl | Fake client → EXPECT error |
| PROP-029 | Create with non-existent templateId → 400 | curl | Fake template → EXPECT error |
| PROP-030 | Send unsent proposal | curl | Send proposal that's still draft → EXPECT 200 |
| PROP-031 | Send already-sent proposal | curl | Send same proposal again → EXPECT 200 (re-send) or 400 |
| PROP-032 | Generate PDF for non-existent proposal → 404 | curl | Fake ID → EXPECT 404 |
| PROP-033 | Convert with invalid date format | curl | `{startDate: "not-a-date"}` → EXPECT 400 |

### Lead Conversion

| ID | Test | Method | Steps |
|----|------|--------|-------|
| PROP-034 | Convert lead | curl | `POST /api/leads/convert` with lead data → EXPECT 200 |
| PROP-035 | List leads (admin) | curl | `GET /api/admin/leads` → EXPECT 200 |
| PROP-036 | Get lead detail | curl | `GET /api/admin/leads/{id}` → EXPECT 200 |
| PROP-037 | Convert non-existent lead → 404 | curl | Fake lead ID → EXPECT 404 |
| PROP-038 | Lead with missing required fields → 400 | curl | Empty body → EXPECT 400 |

---

## 8. INV — Invoices & Payments

### Invoice CRUD

| ID | Test | Method | Steps |
|----|------|--------|-------|
| INV-001 | List invoices | curl | `GET /api/invoices` → EXPECT 200 with array |
| INV-002 | View invoice | curl | `GET /api/invoices/{id}` → EXPECT 200 with invoice data |
| INV-003 | Invoices admin page | UI | /admin/invoices → EXPECT invoice list |
| INV-004 | Invoice number format | curl | EXPECT format INV-YYYYMM-NNNN (e.g., INV-202603-0001) |
| INV-005 | Invoice has correct amount | curl | Amount matches proposal pricing |
| INV-006 | Invoice status is draft after creation | curl | EXPECT status=draft |
| INV-007 | Send invoice PDF | curl | `POST /api/invoices/send-pdf` with invoiceId → EXPECT 200 |
| INV-008 | GST report page | UI | /admin/gst-report → EXPECT GST breakdown loads |

### Payments

| ID | Test | Method | Steps |
|----|------|--------|-------|
| INV-009 | Create Razorpay order | curl | `POST /api/payments/create-order` with `{invoiceId, amount}` → EXPECT 200 with orderId |
| INV-010 | Verify payment | curl | `POST /api/payments/verify` with `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` → EXPECT 200 |
| INV-011 | Payment webhook (Razorpay) | curl | `POST /api/payments/webhook` with valid signature → EXPECT 200 |
| INV-012 | Payment webhook invalid signature → 400 | curl | POST with wrong signature → EXPECT 400 |
| INV-013 | Create payment link | curl | `POST /api/payments/links` → EXPECT 200 with link token |
| INV-014 | Get payment link | curl | `GET /api/payments/links/{token}` → EXPECT 200 with link data |
| INV-015 | Track payment | curl | `GET /api/payments/track/{token}` → EXPECT 200 |
| INV-016 | Pay via link page | UI | /pay/{token} → EXPECT payment form loads |
| INV-017 | Pay invoice | curl | `POST /api/invoices/{id}/pay` → EXPECT 200 |

### Validation

| ID | Test | Method | Steps |
|----|------|--------|-------|
| INV-018 | Create order with zero amount → 400 | curl | amount=0 → EXPECT 400 |
| INV-019 | Create order with negative amount → 400 | curl | amount=-100 → EXPECT 400 |
| INV-020 | Create order for non-existent invoice → 404 | curl | Fake invoiceId → EXPECT 404 |
| INV-021 | Verify with wrong payment_id → 400 | curl | Mismatch → EXPECT verification failure |
| INV-022 | Payment link with expired token → 404 | curl | Invalid token → EXPECT 404 |
| INV-023 | Double payment (idempotency) | curl | Pay same invoice twice → EXPECT second is rejected or idempotent |
| INV-024 | Invoice with no line items | curl | EXPECT shows zero or error |
| INV-025 | Invoice currency correct | curl | EXPECT currency matches org settings |

### Booking Invoice

| ID | Test | Method | Steps |
|----|------|--------|-------|
| INV-026 | Booking has invoice | curl | `GET /api/bookings/{id}/invoice` → EXPECT 200 with invoice data |
| INV-027 | Booking without invoice → 404 | curl | New booking → EXPECT 404 or empty |
| INV-028 | Invoice reflects add-on prices | curl | Trip with add-ons → invoice total = trip + add-ons |

### Portal

| ID | Test | Method | Steps |
|----|------|--------|-------|
| INV-029 | Client portal page loads | UI | /portal/{token} → EXPECT client-facing view |
| INV-030 | Portal shows trip details | UI | EXPECT itinerary, dates, pricing visible |
| INV-031 | Portal pay button works | UI | Click pay → EXPECT payment flow initiates |
| INV-032 | Portal with invalid token → error | UI | /portal/fake-token → EXPECT error message |

### Share

| ID | Test | Method | Steps |
|----|------|--------|-------|
| INV-033 | Share itinerary | curl | `POST /api/itinerary/share` → EXPECT 200 with share token |
| INV-034 | View shared itinerary | curl | `GET /api/share/{token}` → EXPECT 200 |
| INV-035 | Share page renders | UI | /share/{token} → EXPECT itinerary visible |
| INV-036 | Share with expired/invalid token | UI | /share/fake-token → EXPECT error |

### Pricing Engine

| ID | Test | Method | Steps |
|----|------|--------|-------|
| INV-037 | AI pricing suggestion | curl | `POST /api/ai/pricing-suggestion` → EXPECT 200 with suggested price |
| INV-038 | Pricing dashboard | curl | `GET /api/admin/pricing/dashboard` → EXPECT 200 |
| INV-039 | Pricing trips list | curl | `GET /api/admin/pricing/trips` → EXPECT 200 |
| INV-040 | Trip costs CRUD | curl | `GET/POST /api/admin/pricing/trip-costs` + `GET/PATCH /api/admin/pricing/trip-costs/{id}` |
| INV-041 | Overhead costs CRUD | curl | `GET/POST /api/admin/pricing/overheads` + `GET/PATCH /api/admin/pricing/overheads/{id}` |
| INV-042 | Vendor history | curl | `GET /api/admin/pricing/vendor-history` → EXPECT 200 |

---

## 9. BOOK — Bookings & Itineraries

| ID | Test | Method | Steps |
|----|------|--------|-------|
| BOOK-001 | Bookings page loads | UI | /bookings → EXPECT booking list |
| BOOK-002 | Flight search | curl | `GET /api/bookings/flights/search?origin=DEL&dest=GOI&date=2026-04-01` → EXPECT 200 |
| BOOK-003 | Hotel search | curl | `GET /api/bookings/hotels/search?location=Goa&checkin=2026-04-01&checkout=2026-04-05` → EXPECT 200 |
| BOOK-004 | Location search | curl | `GET /api/bookings/locations/search?q=Goa` → EXPECT 200 |
| BOOK-005 | Itinerary list | curl | `GET /api/itineraries` → EXPECT 200 |
| BOOK-006 | Itinerary detail | curl | `GET /api/itineraries/{id}` → EXPECT 200 |
| BOOK-007 | Itinerary bookings | curl | `GET /api/itineraries/{id}/bookings` → EXPECT 200 |
| BOOK-008 | Itinerary feedback | curl | `POST /api/itineraries/{id}/feedback` → EXPECT 200 |
| BOOK-009 | Generate itinerary (AI) | curl | `POST /api/itinerary/generate` with destination + dates → EXPECT 200 with generated days |
| BOOK-010 | Import itinerary from PDF | curl | `POST /api/itinerary/import/pdf` with file → EXPECT 200 |
| BOOK-011 | Import itinerary from URL | curl | `POST /api/itinerary/import/url` with `{url}` → EXPECT 200 |
| BOOK-012 | Flight search with no results | curl | Search obscure route → EXPECT 200 with empty array |
| BOOK-013 | Hotel search with no results | curl | Search middle of ocean → EXPECT 200 with empty |
| BOOK-014 | Generate with invalid destination | curl | destination="" → EXPECT 400 |
| BOOK-015 | Import from invalid URL → 400 | curl | `{url: "not-a-url"}` → EXPECT 400 |
| BOOK-016 | Import from non-existent URL → error | curl | `{url: "https://doesnotexist.example.com/x"}` → EXPECT error |
| BOOK-017 | Itinerary feedback with empty body → 400 | curl | Empty body → EXPECT 400 |
| BOOK-018 | Itinerary for non-existent trip → 404 | curl | Fake ID → EXPECT 404 |
| BOOK-019 | Flight search missing origin → 400 | curl | No origin param → EXPECT 400 |
| BOOK-020 | Flight search with past date | curl | date in past → EXPECT 400 or empty results |
| BOOK-021 | Hotel search missing location → 400 | curl | No location param → EXPECT 400 |
| BOOK-022 | Hotel search checkout before checkin → 400 | curl | EXPECT validation error |
| BOOK-023 | Planner page loads | UI | /planner → EXPECT trip planner interface |
| BOOK-024 | Admin planner page | UI | /admin/planner → EXPECT planner dashboard |

---

## 10. DRIVER — Driver Management

| ID | Test | Method | Steps |
|----|------|--------|-------|
| DRIVER-001 | Drivers page loads | UI | /drivers → EXPECT driver list |
| DRIVER-002 | Driver detail page | UI | /drivers/[id] → EXPECT driver profile |
| DRIVER-003 | Search drivers | curl | `GET /api/drivers/search?q=John` → EXPECT 200 with results |
| DRIVER-004 | Search with no match | curl | `GET /api/drivers/search?q=zzzzz` → EXPECT 200 empty array |
| DRIVER-005 | Search without query → 400 | curl | `GET /api/drivers/search` (no ?q=) → EXPECT 400 or empty |
| DRIVER-006 | Driver search returns phone | curl | Results include phone number |
| DRIVER-007 | Normalize driver phones (admin) | curl | `POST /api/admin/whatsapp/normalize-driver-phones` → EXPECT 200 |
| DRIVER-008 | Driver with no trips | UI | Driver profile → trips section → EXPECT empty state |
| DRIVER-009 | Driver with trips | UI | Driver profile → EXPECT trip assignments visible |
| DRIVER-010 | Driver live tracking page | UI | /live/[token] → EXPECT map/tracking UI |
| DRIVER-011 | Location ping | curl | `POST /api/location/ping` with `{lat, lng, token}` → EXPECT 200 |
| DRIVER-012 | Location share | curl | `POST /api/location/share` → EXPECT 200 with share token |
| DRIVER-013 | Client share location | curl | `POST /api/location/client-share` → EXPECT 200 |
| DRIVER-014 | Live location (public) | curl | `GET /api/location/live/{token}` → EXPECT 200 with location data |
| DRIVER-015 | Cleanup expired locations | curl | `POST /api/location/cleanup-expired` → EXPECT 200 |
| DRIVER-016 | Location ping with invalid token → 401 | curl | Fake token → EXPECT 401 or 404 |

---

## 11. ADDON — Add-Ons

| ID | Test | Method | Steps |
|----|------|--------|-------|
| ADDON-001 | Add-ons page loads | UI | /add-ons → EXPECT add-on list |
| ADDON-002 | Create add-on | curl | `POST /api/add-ons` with `{name, price, description}` → EXPECT 201 |
| ADDON-003 | List add-ons | curl | `GET /api/add-ons` → EXPECT 200 with array |
| ADDON-004 | Get add-on detail | curl | `GET /api/add-ons/{id}` → EXPECT 200 |
| ADDON-005 | Update add-on | curl | `PATCH /api/add-ons/{id}` with `{price: 75}` → EXPECT 200 |
| ADDON-006 | Delete add-on | curl | `DELETE /api/add-ons/{id}` → EXPECT 200 |
| ADDON-007 | Add-on stats | curl | `GET /api/add-ons/stats` → EXPECT 200 with usage stats |
| ADDON-008 | Create without name → 400 | curl | Missing name → EXPECT 400 |
| ADDON-009 | Create without price → 400 | curl | Missing price → EXPECT 400 |
| ADDON-010 | Create with negative price → 400 | curl | price=-10 → EXPECT 400 |
| ADDON-011 | Create with zero price | curl | price=0 → EXPECT 200 (free add-on) or 400 |
| ADDON-012 | Create with very high price | curl | price=999999999 → EXPECT 200 or validation |
| ADDON-013 | Attach add-on to trip | curl | `POST /api/trips/{id}/add-ons` with `{addOnId}` → EXPECT 200 |
| ADDON-014 | Verify add-on appears in trip invoice | curl | After attaching → invoice total includes add-on price |
| ADDON-015 | Remove add-on from trip | curl | `DELETE /api/trips/{id}/add-ons/{addOnId}` → EXPECT 200 |
| ADDON-016 | Delete add-on attached to trip | curl | Delete add-on that's on a trip → EXPECT cascade or 400 |
| ADDON-017 | XSS in add-on name | curl | `name: "<img src=x onerror=alert(1)>"` → EXPECT sanitized |
| ADDON-018 | Add-on with emoji in name | curl | `name: "Airport Transfer ✈️"` → EXPECT stored correctly |

---

## 12. CAL — Calendar & Planner

| ID | Test | Method | Steps |
|----|------|--------|-------|
| CAL-001 | Calendar page loads | UI | /calendar → EXPECT calendar view renders |
| CAL-002 | Calendar shows trip dates | UI | EXPECT trips visible on their date ranges |
| CAL-003 | Calendar navigation (month forward) | UI | Click next month → EXPECT month changes |
| CAL-004 | Calendar navigation (month back) | UI | Click prev month → EXPECT month changes |
| CAL-005 | Calendar click on trip → detail | UI | Click trip event → EXPECT trip detail or modal |
| CAL-006 | Dashboard schedule API | curl | `GET /api/dashboard/schedule` → EXPECT 200 with scheduled items |
| CAL-007 | Schedule page loads | UI | /dashboard/schedule → EXPECT schedule view |
| CAL-008 | Tasks page loads | UI | /dashboard/tasks → EXPECT task list |
| CAL-009 | Empty calendar (no trips) | UI | New org → EXPECT empty calendar state |
| CAL-010 | Calendar with overlapping trips | UI | Multiple trips same dates → EXPECT both visible |
| CAL-011 | Calendar year view | UI | Switch to year view if available → EXPECT renders |
| CAL-012 | Calendar week view | UI | Switch to week view if available → EXPECT renders |
| CAL-013 | Planner page loads | UI | /planner → EXPECT trip planner interface |
| CAL-014 | Admin planner page | UI | /admin/planner → EXPECT planner view |

---

## 13. REP — Reputation Management

### Dashboard & Analytics

| ID | Test | Method | Steps |
|----|------|--------|-------|
| REP-001 | Reputation page loads | UI | /reputation → EXPECT reputation dashboard |
| REP-002 | Reputation dashboard API | curl | `GET /api/reputation/dashboard` → EXPECT 200 |
| REP-003 | Analytics snapshot | curl | `GET /api/reputation/analytics/snapshot` → EXPECT 200 |
| REP-004 | Analytics topics | curl | `GET /api/reputation/analytics/topics` → EXPECT 200 |
| REP-005 | Analytics trends | curl | `GET /api/reputation/analytics/trends` → EXPECT 200 |
| REP-006 | Analytics page | UI | /reputation/analytics → EXPECT charts render |

### Reviews

| ID | Test | Method | Steps |
|----|------|--------|-------|
| REP-007 | List reviews | curl | `GET /api/reputation/reviews` → EXPECT 200 |
| REP-008 | Reviews page | UI | /reputation/reviews → EXPECT review list |
| REP-009 | Get single review | curl | `GET /api/reputation/reviews/{id}` → EXPECT 200 |
| REP-010 | AI analyze review | curl | `POST /api/reputation/ai/analyze` with `{reviewId}` → EXPECT 200 with analysis |
| REP-011 | AI batch analyze | curl | `POST /api/reputation/ai/batch-analyze` → EXPECT 200 |
| REP-012 | AI respond to review | curl | `POST /api/reputation/ai/respond` with `{reviewId}` → EXPECT 200 with draft response |
| REP-013 | Generate marketing asset from review | curl | `POST /api/reputation/reviews/{id}/marketing-asset` → EXPECT 200 |
| REP-014 | Sync reviews from platforms | curl | `POST /api/reputation/sync` → EXPECT 200 |

### Campaigns

| ID | Test | Method | Steps |
|----|------|--------|-------|
| REP-015 | List campaigns | curl | `GET /api/reputation/campaigns` → EXPECT 200 |
| REP-016 | Campaigns page | UI | /reputation/campaigns → EXPECT campaign list |
| REP-017 | Create campaign | curl | `POST /api/reputation/campaigns` → EXPECT 201 |
| REP-018 | Get campaign detail | curl | `GET /api/reputation/campaigns/{id}` → EXPECT 200 |
| REP-019 | Update campaign | curl | `PATCH /api/reputation/campaigns/{id}` → EXPECT 200 |
| REP-020 | Delete campaign | curl | `DELETE /api/reputation/campaigns/{id}` → EXPECT 200 |
| REP-021 | Trigger campaign | curl | `POST /api/reputation/campaigns/trigger` → EXPECT 200 |

### NPS & Widget

| ID | Test | Method | Steps |
|----|------|--------|-------|
| REP-022 | NPS survey page | UI | /reputation/nps/{token} → EXPECT NPS form |
| REP-023 | Submit NPS | curl | `POST /api/reputation/nps/submit` with `{token, score, comment}` → EXPECT 200 |
| REP-024 | NPS with score 0 | curl | score=0 → EXPECT 200 (valid detractor) |
| REP-025 | NPS with score 10 | curl | score=10 → EXPECT 200 (valid promoter) |
| REP-026 | NPS with score 11 → 400 | curl | score=11 → EXPECT 400 (out of range) |
| REP-027 | NPS with invalid token → 404 | curl | Fake token → EXPECT 404 |
| REP-028 | Widget config | curl | `GET /api/reputation/widget/config` → EXPECT 200 |
| REP-029 | Widget by token (public) | curl | `GET /api/reputation/widget/{token}` → EXPECT 200 |
| REP-030 | Widget page | UI | /reputation/widget → EXPECT widget configuration UI |

---

## 14. SOCIAL — Social Studio

### Content Creation

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SOCIAL-001 | Social page loads | UI | /social → EXPECT social studio dashboard |
| SOCIAL-002 | AI image generation | curl | `POST /api/social/ai-image` with `{prompt}` → EXPECT 200 with image URL |
| SOCIAL-003 | AI poster generation | curl | `POST /api/social/ai-poster` with content → EXPECT 200 |
| SOCIAL-004 | Smart poster | curl | `POST /api/social/smart-poster` → EXPECT 200 |
| SOCIAL-005 | Render poster | curl | `POST /api/social/render-poster` → EXPECT 200 |
| SOCIAL-006 | Generate captions | curl | `POST /api/social/captions` with context → EXPECT 200 with captions |
| SOCIAL-007 | Extract content | curl | `POST /api/social/extract` → EXPECT 200 |

### Connections

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SOCIAL-008 | List connections | curl | `GET /api/social/connections` → EXPECT 200 |
| SOCIAL-009 | Get connection detail | curl | `GET /api/social/connections/{id}` → EXPECT 200 |
| SOCIAL-010 | Delete connection | curl | `DELETE /api/social/connections/{id}` → EXPECT 200 |
| SOCIAL-011 | Facebook OAuth start | curl | `GET /api/social/oauth/facebook` → EXPECT redirect to Facebook |
| SOCIAL-012 | Google OAuth start | curl | `GET /api/social/oauth/google` → EXPECT redirect to Google |
| SOCIAL-013 | LinkedIn OAuth start | curl | `GET /api/social/oauth/linkedin` → EXPECT redirect to LinkedIn |
| SOCIAL-014 | OAuth callback | curl | `GET /api/social/oauth/callback?code=xxx&state=yyy` → EXPECT redirect to /social |
| SOCIAL-015 | Refresh tokens | curl | `POST /api/social/refresh-tokens` → EXPECT 200 |

### Publishing

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SOCIAL-016 | Create post draft | curl | `POST /api/social/posts` → EXPECT 201 |
| SOCIAL-017 | List posts | curl | `GET /api/social/posts` → EXPECT 200 |
| SOCIAL-018 | Render post preview | curl | `GET /api/social/posts/{id}/render` → EXPECT 200 |
| SOCIAL-019 | Publish post | curl | `POST /api/social/publish` with `{postId, platforms}` → EXPECT 200 |
| SOCIAL-020 | Schedule post | curl | `POST /api/social/schedule` with `{postId, scheduledAt}` → EXPECT 200 |
| SOCIAL-021 | Process publish queue | curl | `POST /api/social/process-queue` → EXPECT 200 |

### Reviews Import

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SOCIAL-022 | Import reviews for social | curl | `POST /api/social/reviews/import` → EXPECT 200 |
| SOCIAL-023 | Get reviews for social | curl | `GET /api/social/reviews` → EXPECT 200 |
| SOCIAL-024 | Get public reviews | curl | `GET /api/social/reviews/public` → EXPECT 200 (public endpoint) |
| SOCIAL-025 | Publish without connection → 400 | curl | No platforms connected → EXPECT error |
| SOCIAL-026 | AI image with empty prompt → 400 | curl | Empty prompt → EXPECT 400 |

---

## 15. MKTPLACE — Marketplace

| ID | Test | Method | Steps |
|----|------|--------|-------|
| MKTPLACE-001 | Marketplace page loads | UI | /marketplace → EXPECT listing grid |
| MKTPLACE-002 | Browse listings (public) | curl | `GET /api/marketplace` → EXPECT 200 with listings |
| MKTPLACE-003 | View listing detail | UI | /marketplace/[id] → EXPECT listing details |
| MKTPLACE-004 | View listing API | curl | `GET /api/marketplace/{id}/view` → EXPECT 200 |
| MKTPLACE-005 | Submit inquiry | curl | `POST /api/marketplace/{id}/inquiry` with `{message, email}` → EXPECT 200 |
| MKTPLACE-006 | View listing reviews | curl | `GET /api/marketplace/{id}/reviews` → EXPECT 200 |
| MKTPLACE-007 | List inquiries | curl | `GET /api/marketplace/inquiries` → EXPECT 200 |
| MKTPLACE-008 | Inquiries page | UI | /marketplace/inquiries → EXPECT inquiry list |
| MKTPLACE-009 | Analytics page | UI | /marketplace/analytics → EXPECT analytics dashboard |
| MKTPLACE-010 | Marketplace stats | curl | `GET /api/marketplace/stats` → EXPECT 200 |
| MKTPLACE-011 | Marketplace options | curl | `GET /api/marketplace/options` → EXPECT 200 |
| MKTPLACE-012 | Create/update listing | curl | `POST /api/marketplace` with listing data → EXPECT 200 |
| MKTPLACE-013 | Listing subscription | curl | `POST /api/marketplace/listing-subscription` → EXPECT 200 |
| MKTPLACE-014 | Verify listing subscription | curl | `POST /api/marketplace/listing-subscription/verify` → EXPECT 200 |
| MKTPLACE-015 | Admin verify listing | curl | `POST /api/admin/marketplace/verify` → EXPECT 200 |
| MKTPLACE-016 | Marketplace settings page | UI | /settings/marketplace → EXPECT marketplace config |
| MKTPLACE-017 | Marketplace settings API | curl | `GET/PATCH /api/settings/marketplace` → EXPECT 200 |
| MKTPLACE-018 | Admin marketplace page | UI | /admin/internal/marketplace → EXPECT admin marketplace view |
| MKTPLACE-019 | Inquiry without email → 400 | curl | Missing email → EXPECT 400 |
| MKTPLACE-020 | Inquiry without message → 400 | curl | Missing message → EXPECT 400 |
| MKTPLACE-021 | View non-existent listing → 404 | curl | Fake ID → EXPECT 404 |
| MKTPLACE-022 | Admin settings marketplace page | UI | /admin/settings/marketplace → EXPECT admin marketplace settings |

---

## 16. ASST — AI Assistant

| ID | Test | Method | Steps |
|----|------|--------|-------|
| ASST-001 | Chat (non-streaming) | curl | `POST /api/assistant/chat` with `{message}` → EXPECT 200 with response |
| ASST-002 | Chat streaming | curl | `POST /api/assistant/chat/stream` → EXPECT SSE stream |
| ASST-003 | Confirm action | curl | `POST /api/assistant/confirm` with `{actionId}` → EXPECT 200 |
| ASST-004 | List conversations | curl | `GET /api/assistant/conversations` → EXPECT 200 |
| ASST-005 | Get conversation | curl | `GET /api/assistant/conversations/{sessionId}` → EXPECT 200 |
| ASST-006 | Export conversation | curl | `GET /api/assistant/export?sessionId={id}` → EXPECT 200 |
| ASST-007 | Quick prompts | curl | `GET /api/assistant/quick-prompts` → EXPECT 200 with prompt list |
| ASST-008 | Usage tracking | curl | `GET /api/assistant/usage` → EXPECT 200 with usage stats |
| ASST-009 | Chat with empty message → 400 | curl | `{message: ""}` → EXPECT 400 |
| ASST-010 | Chat with very long message (10K chars) | curl | EXPECT 200 or 413 |
| ASST-011 | Confirm non-existent action → 404 | curl | Fake actionId → EXPECT 404 |
| ASST-012 | Get non-existent conversation → 404 | curl | Fake sessionId → EXPECT 404 |
| ASST-013 | AI suggest reply | curl | `POST /api/ai/suggest-reply` → EXPECT 200 |
| ASST-014 | AI draft review response | curl | `POST /api/ai/draft-review-response` → EXPECT 200 |
| ASST-015 | Admin AI usage insights | curl | `GET /api/admin/insights/ai-usage` → EXPECT 200 |
| ASST-016 | Inbox page loads | UI | /inbox → EXPECT conversation list |
| ASST-017 | Chat handles network timeout gracefully | UI | Simulate slow response → EXPECT loading indicator, no crash |
| ASST-018 | Chat XSS in message | curl | `{message: "<script>alert(1)</script>"}` → EXPECT sanitized output |

---

## 17. WA — WhatsApp Integration

| ID | Test | Method | Steps |
|----|------|--------|-------|
| WA-001 | WhatsApp health check | curl | `GET /api/whatsapp/health` → EXPECT 200 with status |
| WA-002 | Admin WhatsApp health | curl | `GET /api/admin/whatsapp/health` → EXPECT 200 |
| WA-003 | WhatsApp status | curl | `GET /api/whatsapp/status` → EXPECT 200 |
| WA-004 | Connect WhatsApp | curl | `POST /api/whatsapp/connect` → EXPECT 200 or QR code flow |
| WA-005 | Disconnect WhatsApp | curl | `POST /api/whatsapp/disconnect` → EXPECT 200 |
| WA-006 | Get QR code | curl | `GET /api/whatsapp/qr` → EXPECT 200 with QR data |
| WA-007 | Send message | curl | `POST /api/whatsapp/send` with `{phone, message}` → EXPECT 200 |
| WA-008 | Send test message | curl | `POST /api/whatsapp/test-message` → EXPECT 200 |
| WA-009 | Broadcast message | curl | `POST /api/whatsapp/broadcast` with `{phones: [...], message}` → EXPECT 200 |
| WA-010 | List conversations | curl | `GET /api/whatsapp/conversations` → EXPECT 200 |
| WA-011 | WAHA webhook | curl | `POST /api/webhooks/waha` with payload → EXPECT 200 |
| WA-012 | WhatsApp webhook | curl | `POST /api/whatsapp/webhook` → EXPECT 200 |
| WA-013 | Send without phone → 400 | curl | Missing phone number → EXPECT 400 |
| WA-014 | Send without message → 400 | curl | Missing message → EXPECT 400 |
| WA-015 | Send to invalid phone format → 400 | curl | `{phone: "abc"}` → EXPECT 400 |
| WA-016 | Broadcast to empty array → 400 | curl | `{phones: []}` → EXPECT 400 |
| WA-017 | Broadcast to 100+ phones | curl | Large broadcast → EXPECT 200 (batch processed) |
| WA-018 | Disconnect when not connected → 400 | curl | Not connected → EXPECT 400 or safe no-op |
| WA-019 | Send when not connected → 400 | curl | Not connected → EXPECT error about connection |
| WA-020 | WAHA webhook with invalid payload → 400 | curl | Random JSON → EXPECT 400 or ignored |
| WA-021 | Normalize driver phones | curl | `POST /api/admin/whatsapp/normalize-driver-phones` → EXPECT 200 |
| WA-022 | WhatsApp message with XSS | curl | `{message: "<script>alert(1)</script>"}` → EXPECT sanitized |
| WA-023 | WhatsApp with international phone | curl | `{phone: "+919876543210"}` → EXPECT handled |
| WA-024 | Broadcast with duplicate phones | curl | Same phone twice → EXPECT deduplication or handled |

---

## 18. NOTIFY — Notifications

| ID | Test | Method | Steps |
|----|------|--------|-------|
| NOTIFY-001 | Send notification | curl | `POST /api/notifications/send` with `{type, recipientId}` → EXPECT 200 |
| NOTIFY-002 | Process notification queue | curl | `POST /api/notifications/process-queue` → EXPECT 200 |
| NOTIFY-003 | Retry failed notifications | curl | `POST /api/notifications/retry-failed` → EXPECT 200 |
| NOTIFY-004 | Schedule followup notifications | curl | `POST /api/notifications/schedule-followups` → EXPECT 200 |
| NOTIFY-005 | Client landed notification | curl | `POST /api/notifications/client-landed` → EXPECT 200 |
| NOTIFY-006 | Admin delivery list | curl | `GET /api/admin/notifications/delivery` → EXPECT 200 |
| NOTIFY-007 | Admin retry delivery | curl | `POST /api/admin/notifications/delivery/retry` → EXPECT 200 |
| NOTIFY-008 | Notifications page | UI | /admin/notifications → EXPECT delivery log |
| NOTIFY-009 | Admin notification settings | UI | /admin/settings/notifications → EXPECT settings form |
| NOTIFY-010 | Welcome email | curl | `POST /api/emails/welcome` with `{email}` → EXPECT 200 |
| NOTIFY-011 | Send without type → 400 | curl | Missing type → EXPECT 400 |
| NOTIFY-012 | Send without recipientId → 400 | curl | Missing recipientId → EXPECT 400 |
| NOTIFY-013 | Welcome email to invalid address → 400 | curl | `{email: "not-an-email"}` → EXPECT 400 |
| NOTIFY-014 | Retry with no failed items | curl | Nothing to retry → EXPECT 200 with count=0 |
| NOTIFY-015 | Cron: assistant alerts | curl | `POST /api/cron/assistant-alerts` → EXPECT 200 |
| NOTIFY-016 | Cron: reputation campaigns | curl | `POST /api/cron/reputation-campaigns` → EXPECT 200 |

---

## 19. PRICE — Pricing Engine

| ID | Test | Method | Steps |
|----|------|--------|-------|
| PRICE-001 | Pricing dashboard page | UI | /admin/pricing → EXPECT pricing dashboard |
| PRICE-002 | Pricing dashboard API | curl | `GET /api/admin/pricing/dashboard` → EXPECT 200 |
| PRICE-003 | List trip costs | curl | `GET /api/admin/pricing/trip-costs` → EXPECT 200 |
| PRICE-004 | Create trip cost | curl | `POST /api/admin/pricing/trip-costs` with cost data → EXPECT 201 |
| PRICE-005 | Get trip cost | curl | `GET /api/admin/pricing/trip-costs/{id}` → EXPECT 200 |
| PRICE-006 | Update trip cost | curl | `PATCH /api/admin/pricing/trip-costs/{id}` → EXPECT 200 |
| PRICE-007 | List overhead costs | curl | `GET /api/admin/pricing/overheads` → EXPECT 200 |
| PRICE-008 | Create overhead | curl | `POST /api/admin/pricing/overheads` → EXPECT 201 |
| PRICE-009 | Get overhead | curl | `GET /api/admin/pricing/overheads/{id}` → EXPECT 200 |
| PRICE-010 | Update overhead | curl | `PATCH /api/admin/pricing/overheads/{id}` → EXPECT 200 |
| PRICE-011 | Pricing trips list | curl | `GET /api/admin/pricing/trips` → EXPECT 200 |
| PRICE-012 | Vendor history | curl | `GET /api/admin/pricing/vendor-history` → EXPECT 200 |
| PRICE-013 | Transactions list | curl | `GET /api/admin/pricing/transactions` → EXPECT 200 |
| PRICE-014 | Create cost without amount → 400 | curl | Missing amount → EXPECT 400 |
| PRICE-015 | Create cost with negative amount → 400 | curl | amount=-100 → EXPECT 400 |
| PRICE-016 | Update non-existent cost → 404 | curl | Fake ID → EXPECT 404 |
| PRICE-017 | Delete trip cost | curl | If DELETE supported → EXPECT 200 |
| PRICE-018 | Overhead with very large amount | curl | amount=99999999999 → EXPECT handled |
| PRICE-019 | Pricing with currency conversion | curl | Different currency → EXPECT conversion applied |
| PRICE-020 | Currency API | curl | `GET /api/currency` → EXPECT 200 with rates |

---

## 20. BILL — Billing & Subscriptions

| ID | Test | Method | Steps |
|----|------|--------|-------|
| BILL-001 | Billing page loads | UI | /billing → EXPECT billing/subscription info |
| BILL-002 | Admin billing page | UI | /admin/billing → EXPECT billing management |
| BILL-003 | Get subscription | curl | `GET /api/subscriptions` → EXPECT 200 with plan details |
| BILL-004 | Get subscription limits | curl | `GET /api/subscriptions/limits` → EXPECT 200 with usage limits |
| BILL-005 | Cancel subscription | curl | `POST /api/subscriptions/cancel` → EXPECT 200 |
| BILL-006 | Billing subscription API | curl | `GET /api/billing/subscription` → EXPECT 200 |
| BILL-007 | Contact sales | curl | `POST /api/billing/contact-sales` with `{name, email, message}` → EXPECT 200 |
| BILL-008 | Contact sales without email → 400 | curl | Missing email → EXPECT 400 |
| BILL-009 | Contact sales without message → 400 | curl | Missing message → EXPECT 400 |
| BILL-010 | Cancel already-cancelled → 400 | curl | EXPECT error or idempotent |
| BILL-011 | Subscription limits after cancellation | curl | After cancel → limits should reflect free tier |
| BILL-012 | Referrals page | UI | /admin/referrals → EXPECT referral program UI |
| BILL-013 | Referrals API | curl | `GET /api/admin/referrals` → EXPECT 200 |
| BILL-014 | Client referrals (reputation) | curl | `GET /api/admin/reputation/client-referrals` → EXPECT 200 |
| BILL-015 | Cron: operator scorecards | curl | `POST /api/cron/operator-scorecards` → EXPECT 200 |
| BILL-016 | Cron: assistant briefing | curl | `POST /api/cron/assistant-briefing` → EXPECT 200 |
| BILL-017 | Cron: assistant digest | curl | `POST /api/cron/assistant-digest` → EXPECT 200 |
| BILL-018 | UPI settings | curl | `GET/PATCH /api/settings/upi` → EXPECT 200 |

---

## 21. GOD — Superadmin / God Mode

### Dashboard

| ID | Test | Method | Steps |
|----|------|--------|-------|
| GOD-001 | God dashboard loads | UI | /god → EXPECT superadmin dashboard |
| GOD-002 | God overview API | curl | `GET /api/superadmin/overview` → EXPECT 200 with platform stats |
| GOD-003 | God me API | curl | `GET /api/superadmin/me` → EXPECT 200 with superadmin profile |

### User Management

| ID | Test | Method | Steps |
|----|------|--------|-------|
| GOD-004 | User signups list | curl | `GET /api/superadmin/users/signups` → EXPECT 200 |
| GOD-005 | User directory | curl | `GET /api/superadmin/users/directory` → EXPECT 200 |
| GOD-006 | Get user by ID | curl | `GET /api/superadmin/users/{id}` → EXPECT 200 |
| GOD-007 | Update user | curl | `PATCH /api/superadmin/users/{id}` → EXPECT 200 |
| GOD-008 | Signups page | UI | /god/signups → EXPECT signup list |
| GOD-009 | Directory page | UI | /god/directory → EXPECT user directory |
| GOD-010 | Get non-existent user → 404 | curl | Fake ID → EXPECT 404 |

### Analytics & Costs

| ID | Test | Method | Steps |
|----|------|--------|-------|
| GOD-011 | Feature usage overview | curl | `GET /api/superadmin/analytics/feature-usage` → EXPECT 200 |
| GOD-012 | Feature usage by feature | curl | `GET /api/superadmin/analytics/feature-usage/{feature}` → EXPECT 200 |
| GOD-013 | Analytics page | UI | /god/analytics → EXPECT analytics dashboard |
| GOD-014 | Cost aggregate | curl | `GET /api/superadmin/cost/aggregate` → EXPECT 200 |
| GOD-015 | Cost trends | curl | `GET /api/superadmin/cost/trends` → EXPECT 200 |
| GOD-016 | Cost by org | curl | `GET /api/superadmin/cost/org/{orgId}` → EXPECT 200 |
| GOD-017 | Costs page | UI | /god/costs → EXPECT cost dashboard |
| GOD-018 | Org cost detail page | UI | /god/costs/org/[orgId] → EXPECT org cost breakdown |

### Announcements

| ID | Test | Method | Steps |
|----|------|--------|-------|
| GOD-019 | List announcements | curl | `GET /api/superadmin/announcements` → EXPECT 200 |
| GOD-020 | Create announcement | curl | `POST /api/superadmin/announcements` with `{title, body}` → EXPECT 201 |
| GOD-021 | Update announcement | curl | `PATCH /api/superadmin/announcements/{id}` → EXPECT 200 |
| GOD-022 | Delete announcement | curl | `DELETE /api/superadmin/announcements/{id}` → EXPECT 200 |
| GOD-023 | Send announcement | curl | `POST /api/superadmin/announcements/{id}/send` → EXPECT 200 |
| GOD-024 | Announcements page | UI | /god/announcements → EXPECT announcement management |

### Support & Settings

| ID | Test | Method | Steps |
|----|------|--------|-------|
| GOD-025 | List support tickets | curl | `GET /api/superadmin/support/tickets` → EXPECT 200 |
| GOD-026 | Get support ticket | curl | `GET /api/superadmin/support/tickets/{id}` → EXPECT 200 |
| GOD-027 | Respond to ticket | curl | `POST /api/superadmin/support/tickets/{id}/respond` → EXPECT 200 |
| GOD-028 | Support page | UI | /god/support → EXPECT ticket list |
| GOD-029 | Kill switch | curl | `POST /api/superadmin/settings/kill-switch` → EXPECT 200 |
| GOD-030 | Kill switch page | UI | /god/kill-switch → EXPECT toggle UI |
| GOD-031 | Org suspend | curl | `POST /api/superadmin/settings/org-suspend` → EXPECT 200 |
| GOD-032 | Monitoring page | UI | /god/monitoring → EXPECT health dashboard |

---

## 22. SETTINGS — Settings & Team

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SET-001 | Settings page loads | UI | /settings → EXPECT settings dashboard |
| SET-002 | Admin settings page | UI | /admin/settings → EXPECT admin settings |
| SET-003 | Team list | curl | `GET /api/settings/team` → EXPECT 200 |
| SET-004 | Team page | UI | /settings/team → EXPECT team member list |
| SET-005 | Invite team member | curl | `POST /api/settings/team/invite` with `{email, role}` → EXPECT 200 |
| SET-006 | Get team member | curl | `GET /api/settings/team/{id}` → EXPECT 200 |
| SET-007 | Update team member role | curl | `PATCH /api/settings/team/{id}` → EXPECT 200 |
| SET-008 | Remove team member | curl | `DELETE /api/settings/team/{id}` → EXPECT 200 |
| SET-009 | Resend team invite | curl | `POST /api/settings/team/{id}/resend` → EXPECT 200 |
| SET-010 | Invite without email → 400 | curl | Missing email → EXPECT 400 |
| SET-011 | Invite duplicate email → 400 | curl | Same email twice → EXPECT 400 or 409 |
| SET-012 | Remove self → 400 | curl | Try to remove your own account → EXPECT 400 |
| SET-013 | Marketplace settings | curl | `GET/PATCH /api/settings/marketplace` → EXPECT 200 |
| SET-014 | UPI settings | curl | `GET/PATCH /api/settings/upi` → EXPECT 200 |
| SET-015 | Security diagnostics page | UI | /admin/security → EXPECT security dashboard |
| SET-016 | Security diagnostics API | curl | `GET /api/admin/security/diagnostics` → EXPECT 200 |

---

## 23. SECURITY — Auth Boundaries & RBAC

### Admin-only API routes (test with unauthenticated request)

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SEC-001 | /api/admin/* without auth → 401 | curl | Hit any /api/admin/ endpoint with no token → EXPECT 401 |
| SEC-002 | /api/superadmin/* without auth → 401 | curl | Hit any /api/superadmin/ endpoint → EXPECT 401 |
| SEC-003 | /api/admin/* with client-role token → 403 | curl | Login as client user → hit /api/admin/clients → EXPECT 403 |
| SEC-004 | /api/superadmin/* with admin token → 403 | curl | Login as admin → hit /api/superadmin/overview → EXPECT 403 |
| SEC-005 | /api/admin/* with expired token → 401 | curl | Use expired JWT → EXPECT 401 |

### Cross-tenant isolation

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SEC-006 | Admin can't see other org's clients | curl | Org A admin → `GET /api/admin/clients` → EXPECT only org A clients |
| SEC-007 | Admin can't see other org's trips | curl | Same → EXPECT only own trips |
| SEC-008 | Admin can't see other org's proposals | curl | Same → EXPECT only own proposals |
| SEC-009 | Admin can't delete other org's data | curl | Try deleting cross-org trip → EXPECT 404 or 403 |
| SEC-010 | Admin can't edit other org's data | curl | PATCH cross-org client → EXPECT 404 or 403 |

### Public endpoints

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SEC-011 | Health check (no auth needed) | curl | `GET /api/health` → EXPECT 200 |
| SEC-012 | Proposal public page (no auth) | curl | `GET /api/proposals/public/{token}` → EXPECT 200 |
| SEC-013 | Payment link page (no auth) | curl | `GET /api/payments/links/{token}` → EXPECT 200 |
| SEC-014 | NPS page (no auth) | curl | `GET /api/reputation/nps/{token}` → EXPECT 200 |
| SEC-015 | Widget (no auth) | curl | `GET /api/reputation/widget/{token}` → EXPECT 200 |
| SEC-016 | Weather (no auth if public) | curl | `GET /api/weather` → check auth requirement |
| SEC-017 | Currency (no auth if public) | curl | `GET /api/currency` → check auth requirement |

### God mode access

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SEC-018 | Admin user → /god page → blocked | UI | Login as admin → /god → EXPECT redirect or 403 |
| SEC-019 | Admin user → /god API → 403 | curl | Admin token → `GET /api/superadmin/overview` → EXPECT 403 |
| SEC-020 | Super admin → /god page → allowed | UI | Login as super_admin → /god → EXPECT dashboard loads |
| SEC-021 | Super admin → /admin page → allowed | UI | Super admin → /admin → EXPECT works |
| SEC-022 | Super admin → kill switch → allowed | curl | `POST /api/superadmin/settings/kill-switch` → EXPECT 200 |

### Token/Session security

| ID | Test | Method | Steps |
|----|------|--------|-------|
| SEC-023 | JWT with wrong signature → 401 | curl | Tampered JWT → EXPECT 401 |
| SEC-024 | JWT for different env → 401 | curl | Token from different Supabase project → EXPECT 401 |
| SEC-025 | Rate limiting on auth endpoints | curl | 50 rapid requests to /api/auth/password-login → EXPECT 429 |
| SEC-026 | Rate limiting on admin endpoints | curl | 100 rapid requests → EXPECT 429 |
| SEC-027 | Error messages don't leak internals | curl | Force 500 error → EXPECT generic "Internal server error", no stack trace |
| SEC-028 | API response doesn't include service_role data | curl | All API responses → verify no service_role key or internal IDs exposed |

---

## 24. EDGE — Edge Cases & Error Handling

| ID | Test | Method | Steps |
|----|------|--------|-------|
| EDGE-001 | 404 for non-existent API route | curl | `GET /api/admin/nonexistent` → EXPECT 404 |
| EDGE-002 | 405 for wrong HTTP method | curl | `DELETE /api/admin/dashboard/stats` → EXPECT 405 |
| EDGE-003 | Empty JSON body on POST | curl | `POST /api/admin/clients` with `{}` → EXPECT 400 |
| EDGE-004 | Non-JSON content type | curl | `POST /api/admin/clients` with `text/plain` → EXPECT 400 |
| EDGE-005 | Very large request body (1MB) | curl | 1MB JSON → EXPECT 413 or 400 |
| EDGE-006 | Unicode in all text fields | curl | Japanese/Arabic/emoji in client name → EXPECT stored correctly |
| EDGE-007 | Concurrent create operations | curl | 10 simultaneous POST /api/admin/clients → EXPECT all succeed or proper conflict handling |
| EDGE-008 | Concurrent delete same resource | curl | 2 simultaneous DELETE same trip → EXPECT one 200, one 404 |
| EDGE-009 | UUID format validation | curl | Non-UUID as ID parameter → EXPECT 400 |
| EDGE-010 | Null values in optional fields | curl | `{full_name: "Test", email: "t@t.com", phone: null}` → EXPECT handled |
| EDGE-011 | Array instead of object body | curl | `POST /api/admin/clients` with `[]` → EXPECT 400 |
| EDGE-012 | Deeply nested JSON body | curl | 100-level nested object → EXPECT 400 or handled |
| EDGE-013 | Request with query and body params conflicting | curl | Query says one thing, body says another → EXPECT defined precedence |
| EDGE-014 | HEAD request support | curl | `HEAD /api/admin/trips` → EXPECT 200 with no body |
| EDGE-015 | OPTIONS request (CORS) | curl | `OPTIONS /api/admin/trips` → EXPECT CORS headers |
| EDGE-016 | Double-slash in URL path | curl | `GET /api/admin//clients` → EXPECT 404 or normalized |
| EDGE-017 | Trailing slash in URL | curl | `GET /api/admin/clients/` → EXPECT same as without slash |
| EDGE-018 | Path traversal attempt | curl | `GET /api/admin/../../etc/passwd` → EXPECT 404 |
| EDGE-019 | Extremely long URL (8KB+) | curl | Very long query string → EXPECT 414 or truncated |
| EDGE-020 | PDF import with password-protected PDF | curl | Upload encrypted PDF → EXPECT meaningful error |
| EDGE-021 | Image endpoints with invalid API keys | curl | When Pexels/Pixabay/Unsplash keys missing → EXPECT graceful error |
| EDGE-022 | Weather API with invalid location | curl | `GET /api/weather?location=zzzzz` → EXPECT 200 empty or 404 |

---

## 25. PERF — Performance & Load

| ID | Test | Method | Steps |
|----|------|--------|-------|
| PERF-001 | Dashboard loads under 3s | UI | Time dashboard page load → EXPECT < 3s |
| PERF-002 | Client list loads under 2s (100 clients) | curl | Time GET /api/admin/clients → EXPECT < 2s |
| PERF-003 | Trip list loads under 2s (100 trips) | curl | Time GET /api/admin/trips → EXPECT < 2s |
| PERF-004 | Proposal list loads under 2s | curl | Time GET /api/proposals → EXPECT < 2s |
| PERF-005 | Revenue API cached response | curl | First call vs second call → EXPECT second is faster (unstable_cache) |
| PERF-006 | AI itinerary generation under 30s | curl | POST /api/itinerary/generate → EXPECT response < 30s |
| PERF-007 | PDF generation under 10s | curl | GET /api/proposals/{id}/pdf → EXPECT < 10s |
| PERF-008 | Image search under 5s | curl | GET /api/images/pexels → EXPECT < 5s |
| PERF-009 | 50 concurrent users on dashboard | load | Simulate 50 users → EXPECT no 5xx errors |
| PERF-010 | Memory leak: 100 consecutive API calls | curl | 100 calls → EXPECT consistent response times |
| PERF-011 | Large dataset: 1000 trips | curl | With 1000 trips → list still < 5s with pagination |
| PERF-012 | Vercel function cold start | curl | After 15 min idle → first request < 5s |

---

## 26. E2E — End-to-End Business Workflows

| ID | Test | Method | Steps |
|----|------|--------|-------|
| E2E-001 | Full sales pipeline | curl+UI | Create client → create proposal → send → convert → trip + invoice created |
| E2E-002 | Full payment flow | curl | Create invoice → create payment order → verify payment → invoice paid |
| E2E-003 | Client onboarding to first trip | UI | New admin → onboarding → create client → create trip → calendar shows |
| E2E-004 | Proposal to portal to payment | curl+UI | Send proposal → client opens portal → pays → invoice marked paid |
| E2E-005 | Template to proposal to trip | curl | Import PDF → extract template → create proposal → convert → trip |
| E2E-006 | Reputation campaign flow | curl | Create campaign → trigger → client submits NPS → analytics updated |
| E2E-007 | Social publishing flow | curl+UI | Connect Facebook → create post → publish → verify published |
| E2E-008 | WhatsApp broadcast flow | curl | Connect → send test message → broadcast to clients → conversations updated |
| E2E-009 | Marketplace listing flow | curl+UI | Create listing → subscribe → verify → inquiry from buyer |
| E2E-010 | Driver assignment + live tracking | curl | Assign driver to trip → driver pings location → client sees live location |
| E2E-011 | Team invite + permissions | curl+UI | Admin invites team member → member logs in → member sees correct data |
| E2E-012 | Add-on to invoice flow | curl | Create add-on → attach to trip → invoice total reflects add-on price |

---

## Summary

| Category | Count |
|----------|-------|
| AUTH — Authentication & Session | 32 |
| ONBOARD — Onboarding | 18 |
| DASH — Dashboard | 22 |
| CLIENT — Client Management | 28 |
| TRIP — Trip Management | 34 |
| TMPL — Tour Templates | 20 |
| PROP — Proposals | 38 |
| INV — Invoices & Payments | 42 |
| BOOK — Bookings & Itineraries | 24 |
| DRIVER — Driver Management | 16 |
| ADDON — Add-Ons | 18 |
| CAL — Calendar & Planner | 14 |
| REP — Reputation Management | 30 |
| SOCIAL — Social Studio | 26 |
| MKTPLACE — Marketplace | 22 |
| ASST — AI Assistant | 18 |
| WA — WhatsApp Integration | 24 |
| NOTIFY — Notifications | 16 |
| PRICE — Pricing Engine | 20 |
| BILL — Billing & Subscriptions | 18 |
| GOD — Superadmin / God Mode | 32 |
| SETTINGS — Settings & Team | 16 |
| SECURITY — Auth Boundaries & RBAC | 28 |
| EDGE — Edge Cases & Error Handling | 22 |
| PERF — Performance & Load | 12 |
| E2E — End-to-End Business Workflows | 12 |
| **TOTAL** | **487** |

---

## Appendix A — API Route Reference

### Dispatcher 1: /api/* (main — 119 routes)

```
/api/ai/draft-review-response
/api/ai/pricing-suggestion
/api/ai/suggest-reply
/api/add-ons/stats
/api/add-ons/:id
/api/add-ons
/api/auth/password-login
/api/bookings/flights/search
/api/bookings/hotels/search
/api/bookings/:id/invoice
/api/bookings/locations/search
/api/billing/contact-sales
/api/billing/subscription
/api/cron/assistant-alerts
/api/cron/assistant-briefing
/api/cron/assistant-digest
/api/cron/operator-scorecards
/api/cron/reputation-campaigns
/api/currency
/api/dashboard/schedule
/api/dashboard/tasks/dismiss
/api/dashboard/tasks
/api/drivers/search
/api/emails/welcome
/api/health
/api/integrations/places
/api/integrations/tripadvisor
/api/images/pexels
/api/images/pixabay
/api/images/unsplash
/api/images
/api/invoices/:id/pay
/api/invoices/send-pdf
/api/invoices/:id
/api/invoices
/api/itineraries/:id/bookings
/api/itineraries/:id/feedback
/api/itineraries/:id
/api/itineraries
/api/itinerary/generate
/api/itinerary/import/pdf
/api/itinerary/import/url
/api/itinerary/share
/api/leads/convert
/api/location/cleanup-expired
/api/location/client-share
/api/location/live/:token
/api/location/ping
/api/location/share
/api/marketplace/:id/inquiry
/api/marketplace/:id/reviews
/api/marketplace/:id/view
/api/marketplace/inquiries
/api/marketplace/listing-subscription/verify
/api/marketplace/listing-subscription
/api/marketplace/options
/api/marketplace/stats
/api/marketplace
/api/nav/counts
/api/notifications/client-landed
/api/notifications/process-queue
/api/notifications/retry-failed
/api/notifications/schedule-followups
/api/notifications/send
/api/onboarding/first-value
/api/onboarding/setup
/api/payments/create-order
/api/payments/links/:token
/api/payments/links
/api/payments/razorpay
/api/payments/track/:token
/api/payments/verify
/api/payments/webhook
/api/portal/:token
/api/proposals/:id/convert
/api/proposals/:id/pdf
/api/proposals/:id/send
/api/proposals/bulk
/api/proposals/create
/api/proposals/public/:token
/api/proposals/send-pdf
/api/settings/marketplace
/api/settings/team/:id/resend
/api/settings/team/invite
/api/settings/team/:id
/api/settings/team
/api/settings/upi
/api/share/:token
/api/subscriptions/cancel
/api/subscriptions/limits
/api/subscriptions
/api/support
/api/trips/:id/add-ons
/api/trips/:id/clone
/api/trips/:id/invoices
/api/trips/:id/notifications
/api/trips/:id
/api/trips
/api/unsplash
/api/weather
/api/whatsapp/conversations
/api/whatsapp/connect
/api/whatsapp/disconnect
/api/whatsapp/broadcast
/api/whatsapp/health
/api/whatsapp/qr
/api/whatsapp/send
/api/whatsapp/status
/api/whatsapp/test-message
/api/whatsapp/webhook
/api/webhooks/waha
```

### Dispatcher 2: /api/admin/* (65 routes)

```
/api/admin/cache-metrics
/api/admin/clear-cache
/api/admin/clients
/api/admin/contacts/:id/promote
/api/admin/contacts
/api/admin/cost/alerts/ack
/api/admin/cost/overview
/api/admin/dashboard/stats
/api/admin/destinations
/api/admin/funnel
/api/admin/generate-embeddings
/api/admin/geocoding/usage
/api/admin/insights/action-queue
/api/admin/insights/ai-usage
/api/admin/insights/auto-requote
/api/admin/insights/batch-jobs
/api/admin/insights/best-quote
/api/admin/insights/daily-brief
/api/admin/insights/margin-leak
/api/admin/insights/ops-copilot
/api/admin/insights/proposal-risk
/api/admin/insights/roi
/api/admin/insights/smart-upsell-timing
/api/admin/insights/upsell-recommendations
/api/admin/insights/win-loss
/api/admin/leads/:id
/api/admin/leads
/api/admin/ltv
/api/admin/marketplace/verify
/api/admin/notifications/delivery/retry
/api/admin/notifications/delivery
/api/admin/operations/command-center
/api/admin/pdf-imports/upload
/api/admin/pdf-imports/:id
/api/admin/pdf-imports
/api/admin/pricing/dashboard
/api/admin/pricing/trips
/api/admin/pricing/trip-costs/:id
/api/admin/pricing/trip-costs
/api/admin/pricing/overheads/:id
/api/admin/pricing/overheads
/api/admin/pricing/vendor-history
/api/admin/pricing/transactions
/api/admin/proposals/:id/payment-plan
/api/admin/proposals/:id/tiers
/api/admin/referrals
/api/admin/reputation/client-referrals
/api/admin/revenue
/api/admin/security/diagnostics
/api/admin/seed-demo
/api/admin/social/generate
/api/admin/tour-templates/extract
/api/admin/trips/:id/clone
/api/admin/trips/:id
/api/admin/trips
/api/admin/whatsapp/health
/api/admin/whatsapp/normalize-driver-phones
/api/admin/workflow/events
/api/admin/workflow/rules
```

### Dispatcher 3: /api/superadmin/* (25 routes)

```
/api/superadmin/me
/api/superadmin/overview
/api/superadmin/users/signups
/api/superadmin/users/directory
/api/superadmin/users/:id
/api/superadmin/analytics/feature-usage/:feature
/api/superadmin/analytics/feature-usage
/api/superadmin/cost/aggregate
/api/superadmin/cost/trends
/api/superadmin/cost/org/:orgId
/api/superadmin/referrals/overview
/api/superadmin/referrals/detail/:type
/api/superadmin/announcements/:id/send
/api/superadmin/announcements/:id
/api/superadmin/announcements
/api/superadmin/support/tickets/:id/respond
/api/superadmin/support/tickets/:id
/api/superadmin/support/tickets
/api/superadmin/settings/kill-switch
/api/superadmin/settings/org-suspend
/api/superadmin/settings
/api/superadmin/monitoring/health
/api/superadmin/monitoring/queues
/api/superadmin/audit-log
```

### Dispatcher 4: /api/reputation/* (21 routes)

```
/api/reputation/ai/analyze
/api/reputation/ai/batch-analyze
/api/reputation/ai/respond
/api/reputation/analytics/snapshot
/api/reputation/analytics/topics
/api/reputation/analytics/trends
/api/reputation/brand-voice
/api/reputation/campaigns/trigger
/api/reputation/campaigns/:id
/api/reputation/campaigns
/api/reputation/connections
/api/reputation/dashboard
/api/reputation/nps/submit
/api/reputation/nps/:token
/api/reputation/sync
/api/reputation/reviews/:id/marketing-asset
/api/reputation/reviews/:id
/api/reputation/reviews
/api/reputation/widget/config
/api/reputation/widget/:token
```

### Dispatcher 5: /api/social/* (22 routes)

```
/api/social/ai-image
/api/social/ai-poster
/api/social/captions
/api/social/connections/:id
/api/social/connections
/api/social/extract
/api/social/oauth/callback
/api/social/oauth/facebook
/api/social/oauth/google
/api/social/oauth/linkedin
/api/social/posts/:id/render
/api/social/posts
/api/social/process-queue
/api/social/publish
/api/social/refresh-tokens
/api/social/render-poster
/api/social/reviews/import
/api/social/reviews/public
/api/social/reviews
/api/social/schedule
/api/social/smart-poster
```

### Dispatcher 6: /api/assistant/* (8 routes)

```
/api/assistant/chat/stream
/api/assistant/chat
/api/assistant/confirm
/api/assistant/conversations/:sessionId
/api/assistant/conversations
/api/assistant/export
/api/assistant/quick-prompts
/api/assistant/usage
```

---

## Appendix B — UI Pages Reference (90 pages)

### Public (no auth)
- `/` — Landing page
- `/auth` — Login/register
- `/p/[token]` — Public proposal view
- `/pay/[token]` — Payment page
- `/portal/[token]` — Client portal
- `/share/[token]` — Shared itinerary
- `/live/[token]` — Live tracking
- `/reputation/nps/[token]` — NPS survey
- `/welcome` — Welcome page
- `/offline` — Offline fallback
- `/marketing` — Marketing page
- `/design-demo` — Design showcase

### Protected — Admin
- `/admin` — Dashboard
- `/admin/activity` — Activity log
- `/admin/billing` — Billing management
- `/admin/cost` — Cost management
- `/admin/gst-report` — GST report
- `/admin/insights` — Business insights
- `/admin/internal/marketplace` — Internal marketplace
- `/admin/invoices` — Invoice management
- `/admin/kanban` — Kanban board
- `/admin/notifications` — Notification log
- `/admin/operations` — Operations command center
- `/admin/planner` — Trip planner
- `/admin/pricing` — Pricing engine
- `/admin/referrals` — Referral program
- `/admin/revenue` — Revenue analytics
- `/admin/security` — Security diagnostics
- `/admin/settings` — Admin settings
- `/admin/settings/marketplace` — Marketplace settings
- `/admin/settings/notifications` — Notification settings
- `/admin/support` — Support center
- `/admin/templates` — Templates
- `/admin/tour-templates` — Tour template list
- `/admin/tour-templates/create` — Create template
- `/admin/tour-templates/[id]` — Template detail
- `/admin/tour-templates/[id]/edit` — Edit template
- `/admin/tour-templates/import` — PDF import
- `/admin/trips` — Trip management
- `/admin/trips/[id]` — Trip detail
- `/admin/trips/[id]/clone` — Clone trip

### Protected — Feature Pages
- `/add-ons` — Add-on management
- `/analytics` — Analytics dashboard
- `/analytics/drill-through` — Drill-through analytics
- `/analytics/templates` — Template analytics
- `/billing` — Billing/subscription
- `/bookings` — Booking management
- `/calendar` — Trip calendar
- `/clients` — Client list
- `/clients/[id]` — Client detail
- `/dashboard/schedule` — Schedule view
- `/dashboard/tasks` — Task list
- `/drivers` — Driver list
- `/drivers/[id]` — Driver detail
- `/inbox` — AI assistant inbox
- `/marketplace` — Marketplace browse
- `/marketplace/[id]` — Listing detail
- `/marketplace/analytics` — Marketplace analytics
- `/marketplace/inquiries` — Marketplace inquiries
- `/onboarding` — Setup wizard
- `/planner` — Trip planner
- `/proposals` — Proposal list
- `/proposals/[id]` — Proposal detail
- `/proposals/create` — Create proposal
- `/reputation` — Reputation dashboard
- `/reputation/analytics` — Reputation analytics
- `/reputation/campaigns` — Campaign management
- `/reputation/reviews` — Review management
- `/reputation/settings` — Reputation settings
- `/reputation/widget` — Widget configuration
- `/settings` — User settings
- `/settings/marketplace` — Marketplace settings
- `/settings/team` — Team management
- `/social` — Social studio
- `/support` — Support page
- `/trips` — Trip list
- `/trips/[id]` — Trip detail
- `/trips/templates` — Template gallery

### Protected — Superadmin
- `/god` — Superadmin dashboard
- `/god/analytics` — Platform analytics
- `/god/announcements` — Announcements
- `/god/audit-log` — Audit log
- `/god/costs` — Platform costs
- `/god/costs/org/[orgId]` — Org cost detail
- `/god/directory` — User directory
- `/god/kill-switch` — Kill switch
- `/god/monitoring` — Health monitoring
- `/god/referrals` — Platform referrals
- `/god/signups` — New signups
- `/god/support` — Support tickets

### Dev/Test (non-production only)
- `/map-test` — Map testing
- `/test-db` — Database testing
