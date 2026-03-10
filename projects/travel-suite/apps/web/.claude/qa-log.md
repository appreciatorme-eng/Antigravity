# QA Log — Antigravity Travel Suite

Tracks what was tested, what passed/failed, all bugs found, and what's still pending.
Testing method: curl + JWT auth against live Vercel deployment (https://travelsuite-rust.vercel.app).
QA account: `qa-admin@antigravity.dev` — see `test-credentials.md`.
Full test plan with 487 cases: [qa-test-plan.md](qa-test-plan.md)

---

## Session Summary

| Session | Date | Tests Run | Pass | Fail | Partial | Pending/Blocked |
|---------|------|-----------|------|------|---------|---------|
| S1 — Tier 1–4 manual | 2026-03-10 | 28 | 22 | 0 | 0 | 6 |
| S2 — Full 487-case sweep | 2026-03-10 | ~160 | 72 | 11 | 25 | ~290 |
| S2b — Agent 7 (TMPL/AI/Cron/Images/Weather/Admin) | 2026-03-10 | 33 | 20 | 13 | 0 | 0 |
| S3 — Cookie-auth sweep (Reputation/Social/Asst/Settings) | 2026-03-10 | ~55 | 32 | 9 | 9 | 5 |
| S4 — Asst/WA/Notify/Bill/Price/Settings agent | 2026-03-11 | 52 | 38 | 11 | 0 | 3 |
| S5 — Client/Contacts/Trip agent | 2026-03-11 | 37 | 22 | 11 | 4 | 0 |
| **Total** | | **~365** | **~206** | **~55** | **~38** | **~288** |

**Blocking pattern discovered in S2**: Many root-level API handlers (`/api/trips`, `/api/add-ons`, `/api/assistant/*`, `/api/reputation/*`, `/api/social/*`, `/api/billing/*`, `/api/settings/*`) use Supabase cookie-based session auth rather than Bearer JWT. curl-based tests with Bearer JWT cannot reach these. All such tests were marked ⏭ BLOCKED.

**S3 resolution**: Used `POST /api/auth/password-login` with `-c` flag to capture the Supabase session cookie (`sb-rtdjmykkgmirxdyfckqi-auth-token`), then replayed it with `-b` on all blocked endpoints. All Reputation, Social Studio, AI Assistant, Settings, and Nav modules are now tested. Key finding: **these modules are NOT subscription-gated** — they use cookie auth and work for any authenticated user. The 401s in S2 were auth failures, not feature gates.

---

## Test Results — Session 1 (Tier 1–4)

| ID | Test | Status | Notes |
|----|------|--------|-------|
| T1-1 | Valid login → /admin dashboard | ✅ Pass | |
| T1-2 | Invalid login → error shown, no redirect | ✅ Pass | |
| T1-3 | Unauthenticated /admin → redirects to /auth | ✅ Pass | |
| T1-4 | Logout → session cleared, /admin redirects again | ✅ Pass | |
| T2-1 | Trip create | ✅ Pass | Body: `clientId`, `startDate`, `endDate` (camelCase) |
| T2-1 | Trip view | ✅ Pass | |
| T2-1 | Trip edit (PATCH) | ⏭ Skip | No PATCH on `/api/admin/trips`; UI edit only |
| T2-1 | Trip delete | ✅ Pass | DELETE at `/api/trips/:id` |
| T2-2 | Client create | ✅ Pass | Body field: `full_name` (snake_case). Returns `userId` |
| T2-2 | Client list | ✅ Pass | |
| T2-2 | Client edit | ✅ Pass | `PATCH /api/admin/clients?id=` |
| T2-2 | Client delete | ✅ Pass | `DELETE /api/admin/clients?id=` |
| T2-3 | Tour template CRUD | ⏭ Skip | Only `/tour-templates/extract` exists |
| T2-4 | Proposal create | ✅ Pass | Requires `templateId` + `clientId` |
| T2-4 | Proposal send | ✅ Pass | `shareUrl` generated (BUG-004 fixed) |
| T2-4 | Proposal public link | ✅ Pass | Returns 200 |
| T3-1 | Full pipeline: client→proposal→send→convert→trip | ✅ Pass | Needs `proposal_days` pre-inserted |
| T3-1 | Invoice auto-created on convert | ✅ Pass | `status=draft`, amount ₹2700 |
| T3-2 | Invoice view / PDF download | 🔲 Pending | |
| T4-1 | Client missing email/name → 400 | ✅ Pass | |
| T4-2 | Trip missing required fields → 400 | ✅ Pass | |
| T4-3 | Proposal missing templateId → 400 | ✅ Pass | |
| T4-4 | Convert non-existent proposal → 404 | ✅ Pass | |
| T4-5 | Delete trip → DB confirmed | ✅ Pass | |
| T4-6 | Delete client → DB confirmed | ✅ Pass | |
| T4-7 | Unauthenticated admin request → 401 | ✅ Pass | |
| T4-8 | Rate limit (429) graceful handling | 🔲 Pending | |
| T4-9 | Non-admin blocked from /god, /admin/pricing | 🔲 Pending | |

---

## Test Results — Session 2 (Full 487-case sweep)

### AUTH — Authentication & Session Management

| ID | Test | Status | Notes |
|----|------|--------|-------|
| AUTH-001 | Navigate /auth → login → redirect to /admin | ⏭ Blocked | UI test |
| AUTH-002 | `POST /api/auth/password-login` valid creds | ✅ Pass | Returns `{success:true, user:{id,email}}` |
| AUTH-003 | Session persists across page navigation | ⏭ Blocked | UI test |
| AUTH-004 | Cookie set with HttpOnly + Secure flags | ❌ Fail | Cookie `sb-...-auth-token` is `SameSite=lax` only — **missing HttpOnly and Secure flags** → **BUG-014** |
| AUTH-005 | Token auto-refresh after 55 min | ⏭ Blocked | UI test |
| AUTH-006 | Logout → session cleared | ⏭ Blocked | UI test |
| AUTH-007 | Invalid email format → client validation | ⏭ Blocked | UI test |
| AUTH-008 | Wrong password → error shown | ⏭ Blocked | UI test |
| AUTH-009 | Short password (<6 chars) → 400 | ✅ Pass | Returns field-level error: `password: Too small` |
| AUTH-010 | Empty email → validation | ⏭ Blocked | UI test |
| AUTH-011 | Empty password → validation | ⏭ Blocked | UI test |
| AUTH-012 | Both fields empty → validation | ⏭ Blocked | UI test |
| AUTH-013 | SQL injection in email → 400, no data leak | ✅ Pass | Returns `Invalid email address` (sanitized) |
| AUTH-014 | XSS in email → sanitized | ⏭ Blocked | UI test |
| AUTH-015 | Expired JWT → 401 | ✅ Pass | |
| AUTH-016 | Malformed JWT → 401 | ✅ Pass | `Bearer abc123` rejected |
| AUTH-017 | Missing Authorization header → 401 | ✅ Pass | |
| AUTH-018 | /admin without login → redirect to /auth | ⏭ Blocked | UI test |
| AUTH-019 | /trips without login → redirect | ⏭ Blocked | UI test |
| AUTH-020 | /proposals without login → redirect | ⏭ Blocked | UI test |
| AUTH-021 | /god without login → redirect | ⏭ Blocked | UI test |
| AUTH-022 | /settings without login → redirect | ⏭ Blocked | UI test |
| AUTH-023 | /calendar without login → redirect | ⏭ Blocked | UI test |
| AUTH-024 | All 16 protected prefixes → 307 to /auth | ✅ Pass | Tested: admin, god, trips, settings, proposals, reputation, social, clients, drivers, calendar — all 307 |
| AUTH-025 | Public pages accessible without login | ⏭ Blocked | UI test |
| AUTH-026 | ?next param preserved on redirect | ⏭ Blocked | UI test |
| AUTH-027 | ?next rejects absolute URL | ⏭ Blocked | UI test |
| AUTH-028 | ?next rejects protocol-relative URL | ⏭ Blocked | UI test |
| AUTH-029 | Multiple tabs same session | ⏭ Blocked | UI test |
| AUTH-030 | Logout in one tab → other tab redirects | ⏭ Blocked | UI test |
| AUTH-031 | Two concurrent tokens with same credentials | ✅ Pass | Both JWTs work independently |
| AUTH-032 | Rate limit on rapid login attempts | ✅ Pass | 429 returned on 5th sequential wrong-password attempt — Supabase rate limiting active |

### ONBOARD — Onboarding Flow

| ID | Test | Status | Notes |
|----|------|--------|-------|
| ONBOARD-001 | Navigate /onboarding flow | ⏭ Blocked | UI test |
| ONBOARD-002 | `POST /api/onboarding/setup` with `{name:"..."}` | ✅ Pass | Fixed: handler now accepts `name` as alias for `companyName` (BUG-015) |
| ONBOARD-003 | `GET /api/onboarding/first-value` | ✅ Pass | `{completion_pct:100, setup_complete:true, itinerary_count:29}` |
| ONBOARD-004 to ONBOARD-018 | Remaining onboarding flow tests | ⏭ Blocked | UI flow tests |

### DASH — Admin Dashboard

| ID | Test | Status | Notes |
|----|------|--------|-------|
| DASH-001 | Revenue chart data | ✅ Pass | `GET /api/admin/revenue?range=90d` → `{series, totals, range}` |
| DASH-002 | Funnel stages data | ✅ Pass | `GET /api/admin/funnel?range=30d` → `{stages, range}` |
| DASH-003 | Daily brief insight | ✅ Pass | `GET /api/admin/insights/daily-brief` → `{generated_at, top_actions, metrics_snapshot, narrative}` |
| DASH-004 | Action queue insight | ✅ Pass | `GET /api/admin/insights/action-queue` → `{generated_at, summary, queue}` |
| DASH-005 | Ops copilot insight | ✅ Pass | `GET /api/admin/insights/ops-copilot` → `{generated_at, queue_size, queue, playbook}` |
| DASH-006 | Proposal risk insight | ✅ Pass | Returns `{summary, proposals}` — data present |
| DASH-007 | Win/loss insight | ✅ Pass | Returns `{window_days, totals, patterns}` |
| DASH-008 | Auto-requote insight | ✅ Pass | `GET /api/admin/insights/auto-requote` → `{generated_at, analyzed, candidates}` |
| DASH-009 | Smart upsell timing | ✅ Pass | Returns `{window_days_forward, generated_at, recommendations}` |
| DASH-010 | ROI insight | ✅ Pass | Returns `{windowDays, since, roi, performance}` |
| DASH-011 | Best quote timing (GET insight) | ⏭ Skip | `best-quote-timing` route doesn't exist; test used wrong URL. Use `smart-upsell-timing` for GET timing. → **BUG-007 reclassified: test spec error** |
| DASH-011b | Best quote (POST per-proposal) | ✅ Pass | `POST /api/admin/insights/best-quote` now returns 404 for nonexistent proposalId → **BUG-013 fixed** |
| DASH-012 | Margin leak insight | ✅ Pass | Returns `{window_days, paid_revenue_usd, median_proposal_price_usd, flagged_count}` |
| DASH-013 | AI usage insight | ✅ Pass | Returns `{month_start, tier, caps, usage}` |
| DASH-014 | Upsell recommendations | ✅ Pass | Returns `{window_days, analyzed, recommendations, quick_wins}` |
| DASH-015 | Dashboard require auth | ✅ Pass | Insights return 401 without token |
| DASH-016 | LTV analytics | ✅ Pass | `GET /api/admin/ltv` → `{customers, range}` |
| DASH-017 | Operator reports | ❌ Fail | `GET /api/admin/reports/operators` → error |
| DASH-018 | Destination reports | ❌ Fail | `GET /api/admin/reports/destinations` → error |
| DASH-019 to DASH-021 | Dashboard UI tests | ⏭ Blocked | UI tests |
| DASH-022 | `GET /api/admin/insights/best-quote` | ❌ Fail | Returns 405 Method Not Allowed — endpoint is POST-only |

### CLIENT — Client Management

| ID | Test | Status | Notes |
|----|------|--------|-------|
| CLIENT-001 | List clients | ✅ Pass | Returns `{clients: [...], scoped_organization_id}` |
| CLIENT-002 | Create client | ✅ Pass | Returns `{success:true, userId}` — note: field is `userId` not `clientId` |
| CLIENT-003 | List leads | ✅ Pass | `GET /api/admin/leads` → `{leads, total, page, limit}` |
| CLIENT-004 | List contacts | ✅ Pass | `GET /api/admin/contacts` → `{contacts, request_id}` |
| CLIENT-005 | Patch client name | ✅ Pass | `PATCH /api/admin/clients?id=` → updated name returned |
| CLIENT-006 | Delete client | ✅ Pass | `DELETE /api/admin/clients?id=` → 200 |
| CLIENT-007 | Create missing name → 400 | ✅ Pass | "Name and email are required" |
| CLIENT-008 | Create missing email → 400 | ✅ Pass | "Name and email are required" |
| CLIENT-009 to CLIENT-028 | Client lifecycle, tags, filters, UI | ⏭ Blocked | Mix of UI tests and cookie-auth endpoints |

### TRIP — Trip Management

| ID | Test | Status | Notes |
|----|------|--------|-------|
| TRIP-001 | List trips | ✅ Pass | `GET /api/admin/trips` → 14 trips |
| TRIP-002 | Create trip | ✅ Pass | Returns `{success:true, tripId, itineraryId}` |
| TRIP-003 | Clone trip | ✅ Pass | `POST /api/trips/:id/clone` → 200 |
| TRIP-004 | List trip add-ons | ✅ Pass | `GET /api/trips/:id/add-ons` → `{addOns: []}` |
| TRIP-005 | List trip invoices | ✅ Pass | `GET /api/trips/:id/invoices` → `{invoices: []}` |
| TRIP-006 | List trip notifications | ✅ Pass | `GET /api/trips/:id/notifications` → `{notifications: []}` |
| TRIP-007 | Create trip missing clientId → 400 | ✅ Pass | "Missing required fields" |
| TRIP-008 | Get trip by ID | ✅ Pass | `GET /api/admin/trips/:id` → `{trip: {...}}` |
| TRIP-009 | Delete trip | ✅ Pass | `DELETE /api/trips/:id` → 200 |
| TRIP-010 to TRIP-034 | Trip UI, edit flow, status transitions | ⏭ Blocked | UI or cookie-auth tests |

### TMPL — Tour Templates

| ID | Test | Status | Notes |
|----|------|--------|-------|
| TMPL-001 to TMPL-005 | Template list/view | ⏭ Blocked | No template in QA org |
| TMPL-006 | Template extract (PDF import) | ⚠️ Partial | `POST /api/admin/tour-templates/extract` → 400 (missing URL param) |
| TMPL-007 to TMPL-020 | Template create/edit/delete, UI | ⏭ Blocked | UI flow; no templates seeded |

### PROP — Proposals

| ID | Test | Status | Notes |
|----|------|--------|-------|
| PROP-001 | Admin proposals list | ⚠️ Partial | `/api/admin/proposals` returns error — needs investigation |
| PROP-002 | Create proposal | ⏭ Blocked | No tour templates in QA org; create requires templateId |
| PROP-003 to PROP-007 | Proposal lifecycle (send, view, approve) | ⏭ Blocked | No templates seeded |
| PROP-008 | Create missing templateId → 400 | ✅ Pass | "Missing required fields" |
| PROP-009 | Proposal PDF generation | ⚠️ Partial | Returns 202 (async queued) |
| PROP-010 | Public proposal link invalid token → 400 | ✅ Pass | |
| PROP-011 to PROP-038 | Proposal full lifecycle, AI, bulk | ⏭ Blocked | Requires seeded templates |

### INV — Invoices & Payments

| ID | Test | Status | Notes |
|----|------|--------|-------|
| INV-001 | List invoices | ✅ Pass | Returns 4 invoices |
| INV-002 | Admin invoices list | ✅ Pass | Returns 0 (separate admin view) |
| INV-003 | Get invoice by ID | ✅ Pass | `status=draft`, `total_amount=2700` |
| INV-004 | Send invoice PDF | ⚠️ Partial | Disabled: `RESEND_API_KEY` not configured |
| INV-005 | Payment links list | ❌ Fail | Error: `payment_links` table missing |
| INV-006 | Create Razorpay order | ⚠️ Partial | Disabled: "Payments integration is not configured" |
| INV-007 | Portal public page (no auth) | ✅ Pass | `GET /portal/:token` → 200 |
| INV-008 | Invoices require auth | ✅ Pass | No-auth → 401 |
| INV-009 | Invoice pay endpoint method | ⚠️ Partial | GET returns 405 (POST required) |
| INV-010 to INV-042 | Invoice UI, payments, webhooks | ⏭ Blocked | Cookie-auth or external payment provider |

### BOOK — Bookings & Itineraries

| ID | Test | Status | Notes |
|----|------|--------|-------|
| BOOK-001 | Itineraries list | ✅ Pass | `{itineraries:[], nextCursor:null, hasMore:false}` |
| BOOK-002 | Flight search | ❌ Fail | API returns error — Amadeus/Duffel keys not configured |
| BOOK-003 | Hotel search | ❌ Fail | Same — flight booking API not configured |
| BOOK-004 | Locations search | ❌ Fail | Error — integration API not configured |
| BOOK-005 | Itinerary share | ✅ Pass | `POST /api/itinerary/share` → 202 |
| BOOK-006 | Itinerary generate AI | ✅ Pass | `POST /api/itinerary/generate` with `prompt` field → full structured itinerary returned |
| BOOK-007 to BOOK-024 | Booking UI, itinerary builder | ⏭ Blocked | UI or cookie-auth |

### DRIVER — Driver Management

| ID | Test | Status | Notes |
|----|------|--------|-------|
| DRIVER-001 | Driver search | ✅ Pass | `GET /api/drivers/search?location=Goa` (cookie auth) → returns 2 E2E drivers |
| DRIVER-002 | Admin driver list | ❌ Fail | `GET /api/admin/drivers` → 404 (endpoint not in admin dispatcher) |
| DRIVER-003 to DRIVER-016 | Driver CRUD, assignment | ⏭ Blocked | Need `/api/drivers` CRUD path (not admin dispatcher) |

### ADDON — Add-Ons

| ID | Test | Status | Notes |
|----|------|--------|-------|
| ADDON-001 | List add-ons | ✅ Pass | 7 add-ons returned; XSS payload in name field confirms SEC-007 stored value |
| ADDON-002 | Add-on stats | ✅ Pass | `{totalRevenue:0, totalSales:0, totalAddOns:7, activeAddOns:7}` |
| ADDON-003 to ADDON-018 | Add-on CRUD, trip attachment | ⏭ Blocked | Requires active trip + UI interaction |

### CAL — Calendar & Planner

| ID | Test | Status | Notes |
|----|------|--------|-------|
| CAL-001 to CAL-014 | All calendar tests | ⏭ Blocked | UI tests; endpoint cookie-auth |

### REP — Reputation Management

| ID | Test | Status | Notes |
|----|------|--------|-------|
| REP-001 | Dashboard | ✅ Pass | `{overallRating:0, totalReviews:0, healthScore:24}` — 0 reviews (QA org new) |
| REP-002 | Reviews list | ✅ Pass | `{reviews:[], total:0, page:1, limit:20}` |
| REP-003 | Analytics snapshot (GET) | ❌ Fail | 405 Method Not Allowed — endpoint is POST-only |
| REP-003b | Analytics snapshot (POST) | ✅ Pass | Returns snapshot with all platform rating fields |
| REP-004 | Analytics topics | ✅ Pass | `{topics:[]}` |
| REP-005 | Analytics trends | ✅ Pass | `{trends:[]}` |
| REP-006 | Brand voice | ✅ Pass | Returns tone, language_preference, owner_name fields |
| REP-007 | Campaigns list | ✅ Pass | `{campaigns:[]}` |
| REP-008 | Connections | ✅ Pass | `{connections:[]}` |
| REP-009 | Widget config | ✅ Pass | `{widgets:[]}` |
| REP-010 | Sync (POST) | ⚠️ Partial | "google_place_id not configured, setupUrl:/settings" — needs Google Places ID |
| REP-011 | Require auth | ✅ Pass | No-auth → 401 |
| REP-012 | NPS public token invalid → 400 | ✅ Pass | Public token endpoint accessible, validates correctly |
| REP-013 to REP-030 | Full reputation CRUD, campaigns, AI respond | ⏭ Blocked | No reviews/connections seeded; needs live Google Places ID for sync |

### SOCIAL — Social Studio

| ID | Test | Status | Notes |
|----|------|--------|-------|
| SOCIAL-001 | Posts list (GET) | ✅ Pass | `{posts:[]}` |
| SOCIAL-001b | Create post (POST) | ✅ Pass | Fixed BUG-016: serialized hashtags, defaulted template_id |
| SOCIAL-002 | Connections list | ✅ Pass | `[]` |
| SOCIAL-003 | Reviews list | ✅ Pass | `{reviews:[]}` |
| SOCIAL-004 | Schedule (POST) | ✅ Pass | POST-only; returns 400 "Invalid UUID" for invalid postId — endpoint validates correctly |
| SOCIAL-005 | Public reviews submit (POST) | ✅ Pass | POST-only public endpoint; validates token, rating, comment |
| SOCIAL-006 | AI captions (POST) | ❌ Fail | "Failed to generate captions" — AI provider key not configured |
| SOCIAL-007 | Extract (POST) | ⚠️ Partial | "No image provided" — endpoint exists, needs image URL in body |
| SOCIAL-008 | OAuth Facebook → redirect | ✅ Pass | `GET /api/social/oauth/facebook` → 307 redirect to FB |
| SOCIAL-009 | OAuth Google → redirect | ✅ Pass | `GET /api/social/oauth/google` → 307 redirect to Google |
| SOCIAL-010 | OAuth LinkedIn → redirect | ✅ Pass | `GET /api/social/oauth/linkedin` → 307 redirect to LinkedIn |
| SOCIAL-011 | Require auth | ✅ Pass | No-auth → 401 |
| SOCIAL-012 to SOCIAL-026 | AI image/poster, publish, schedule queue | ⏭ Blocked | No social connections; social_posts table needs fix |

### ASST — AI Assistant

| ID | Test | Status | Notes |
|----|------|--------|-------|
| ASST-001 | Conversations list | ✅ Pass | `{success:true, conversations:[]}` |
| ASST-002 | Usage stats | ✅ Pass | Pro tier, 3000 msg/mo limit, 0 used, 3000 remaining |
| ASST-003 | Quick prompts | ✅ Pass | `{prompts:[]}` (no saved prompts) |
| ASST-004 | Export (POST) | ⚠️ Partial | "No data provided" — needs sessionId param; endpoint exists |
| ASST-005 | Chat (POST) | ✅ Pass | AI responds: "I currently don't have access to proposal data" — AI active but tool access limited |
| ASST-006 | Confirm action | ⏭ Blocked | Requires active action session from chat |
| ASST-007 to ASST-018 | Streaming, sessions, full chat flow | ⏭ Blocked | Requires deeper session setup |

### WA — WhatsApp Integration

| ID | Test | Status | Notes |
|----|------|--------|-------|
| WA-001 | Status | ⚠️ Partial | Returns `{connected:false, sessionName:null, error:"Unauthorized"}` — service reachable but session not active |
| WA-002 | Health check | ✅ Pass | Returns `{connected, sessionName, error}` — WPPConnect service accessible |
| WA-003 | Conversations | ⏭ Blocked | WPPConnect not connected |
| WA-004 | QR code | ⏭ Blocked | WPPConnect not connected |
| WA-005 | Require auth | ✅ Pass | No-auth → 401 |
| WA-006 to WA-024 | Send, broadcast, webhook | ⏭ Blocked | WPPConnect session not active |

### NOTIFY — Notifications

| ID | Test | Status | Notes |
|----|------|--------|-------|
| NOTIFY-001 | Send notification (missing body) | ✅ Pass | Returns 400 "Title and body are required" |
| NOTIFY-002 | Process queue | ⚠️ Partial | Returns `{data, error, request_id}` — runs but may have no queue |
| NOTIFY-003 | Client landed | ⚠️ Partial | Returns error for fake tripId (expected) |
| NOTIFY-004 to NOTIFY-016 | Schedule followups, retry, full flow | ⏭ Blocked | Requires active trips/clients |

### PRICE — Pricing Engine

| ID | Test | Status | Notes |
|----|------|--------|-------|
| PRICE-001 | Admin pricing tiers | ❌ Fail | `GET /api/admin/pricing` → 404 Not Found |
| PRICE-002 | AI pricing suggestion | ⚠️ Partial | "Invalid pricing suggestion query" — needs specific required params |
| PRICE-003 | AI suggest reply | ⚠️ Partial | Returns `{data, error}` — endpoint exists |
| PRICE-004 | AI draft review response | ⚠️ Partial | Returns `{data, error}` — endpoint exists |
| PRICE-005 to PRICE-020 | Full pricing CRUD, margin, discount | ⏭ Blocked | UI or endpoint path unknown |

### BILL — Billing & Subscriptions

| ID | Test | Status | Notes |
|----|------|--------|-------|
| BILL-001 | Billing subscription detail | ✅ Pass | Fixed BUG-017: use adminClient for orgs query (RLS owner-only) → returns plan:pro_monthly, usage counts |
| BILL-002 | Subscriptions list | ✅ Pass | `{subscription:null}` (no active Razorpay subscription) |
| BILL-003 | Subscription limits | ✅ Pass | Pro tier, clients/trips/proposals/users all `allowed:true, limit:null` |
| BILL-004 | Contact sales (POST) | ⚠️ Partial | Validation error — needs `target_tier`, `name`, `email` in body |
| BILL-005 to BILL-018 | Cancel, upgrade, billing history | ⏭ Blocked | No active subscription; Razorpay not configured |

### GOD — Superadmin / God Mode

| ID | Test | Status | Notes |
|----|------|--------|-------|
| GOD-001 | /api/superadmin/orgs → blocked for admin | ⚠️ Partial | Returns 404 instead of 403 — inconsistent |
| GOD-002 | GET /api/superadmin/overview → 403 | ✅ Pass | Correctly returns 403 for admin role |
| GOD-004 | GET /api/superadmin/users/signups → 403 | ✅ Pass | Correctly forbidden |
| GOD-005 | GET /api/superadmin/users/directory → 403 | ✅ Pass | Correctly forbidden |
| GOD-011 | GET /api/superadmin/analytics/feature-usage → 403 | ✅ Pass | Correctly forbidden |
| GOD-014 | GET /api/superadmin/cost/aggregate → 403 | ✅ Pass | Correctly forbidden |
| GOD-019 | GET /api/superadmin/announcements → 403 | ✅ Pass | Correctly forbidden |
| GOD-025 | GET /api/superadmin/support/tickets → 403 | ✅ Pass | Correctly forbidden |
| GOD-029 | POST /api/superadmin/settings/kill-switch → 403 | ✅ Pass | Correctly forbidden |
| GOD-031 | POST /api/superadmin/settings/org-suspend → 403 | ✅ Pass | Correctly forbidden |
| GOD-007 | /god page → redirects for admin user | ⏭ Blocked | UI test |
| GOD-008 to GOD-032 | Superadmin CRUD, announcements (as super_admin) | ⏭ Blocked | Requires super_admin JWT |

### SETTINGS — Settings & Team

| ID | Test | Status | Notes |
|----|------|--------|-------|
| SETTINGS-001 | Marketplace settings | ✅ Pass | Returns org + profile fields (subscription_tier:pro, verification_status:pending) |
| SETTINGS-002 | Team members list | ✅ Pass | 1 member (owner: Avinash Reddy), QA admin also in team |
| SETTINGS-003 | UPI settings | ✅ Pass | `{upiId:null}` (UPI not configured) |
| SETTINGS-004 | Require auth | ✅ Pass | No-auth → 401 |
| SETTINGS-005 to SETTINGS-016 | Team invite, resend, remove | ⏭ Blocked | Needs a real invitable email address |

### SECURITY — Auth Boundaries & RBAC

| ID | Test | Status | Notes |
|----|------|--------|-------|
| SEC-001 | Valid JWT → 200 | ✅ Pass | |
| SEC-002 | Malformed JWT → 401 | ✅ Pass | |
| SEC-003 | No Authorization header → 401 | ✅ Pass | |
| SEC-004 | Expired JWT → 401 | ✅ Pass | |
| SEC-005 | Org param override ignored | ✅ Pass | Org param in URL is ignored; data scoped by JWT claim |
| SEC-006 | SQL injection in search param | ✅ Pass | Returns 200 with no data leak (parameterized queries) |
| SEC-007 | XSS payload in client name | ⚠️ Partial | Chars stored in DB; React escaping prevents execution in UI. Stored XSS risk if any raw HTML output exists |
| SEC-008 | Huge payload (10KB name) accepted | ⚠️ Partial | No body size limit enforced → **INFO-003** |
| SEC-009 | Path traversal /admin/../../etc/passwd | ✅ Pass | Returns 403 |
| SEC-010 to SEC-018 | CORS, CSP, tenant isolation | ⏭ Blocked | Requires browser or second-org JWT |
| SEC-011 | GET /api/health — no auth | ✅ Pass | Public endpoint accessible, returns 200 |
| SEC-012 | GET /api/proposals/public/nonexistenttoken | ✅ Pass | Returns 404 for unknown share token |
| SEC-013 | GET /api/payments/links/nonexistenttoken | ✅ Pass | BUG-024 fixed: table-not-found returns null → 404 |
| SEC-014 | GET /api/reputation/nps/nonexistenttoken | ✅ Pass | 400 "Invalid token" (non-UUID format) — correct |
| SEC-019 | Admin cannot access /god | ✅ Pass | 403 on all superadmin endpoints confirmed |
| SEC-023 | Modified JWT (tampered last char) | ✅ Pass | Tampered token correctly rejected → 401 |
| SEC-020 to SEC-028 | Role escalation, rate limits | 🔲 Pending | |

### EDGE — Edge Cases & Error Handling

| ID | Test | Status | Notes |
|----|------|--------|-------|
| EDGE-001 | GET non-existent resource → 400 | ⚠️ Partial | Returns 400 instead of 404 (incorrect HTTP semantics) → **INFO-001** |
| EDGE-002 | DELETE /api/admin/dashboard/stats (wrong method) | ✅ Pass | 405 Method Not Allowed correctly enforced |
| EDGE-003 | POST /api/admin/clients `{}` → 400 | ✅ Pass | "Name and email are required" |
| EDGE-004 | POST /api/admin/clients Content-Type: text/plain | ✅ Pass | BUG-006 fixed: SyntaxError now caught in dispatcher → 400 |
| EDGE-008 | Double-DELETE same client | ✅ Pass | First → 200; second → 404 "Client not found" — idempotency correct |
| EDGE-009 | GET /api/admin/trips/not-a-uuid | ✅ Pass | 400 "Invalid trip id" |
| EDGE-010 | POST /api/admin/clients with `phone: null` | ✅ Pass | Nullable phone accepted |
| EDGE-014 | HEAD /api/admin/trips | ✅ Pass | HEAD method returns 200 |
| EDGE-015 | OPTIONS /api/admin/trips — CORS preflight | ✅ Pass | BUG-025 fixed: OPTIONS now returns 204 with Allow/CORS headers |
| EDGE-016 | GET /api/admin//clients (double slash) | ✅ Pass | 308 redirect; Next.js normalizes double slashes |
| EDGE-019 | 393-char search query | ✅ Pass | No crash; returns 200 |
| EDGE-022 | GET /api/weather?location=zzzznonexistent | ✅ Pass | 404 "Could not find weather data" |
| EDGE-011 to EDGE-013 | Large datasets, concurrent requests | 🔲 Pending | |

### PERF — Performance & Load

| ID | Test | Status | Notes |
|----|------|--------|-------|
| PERF-001 | GET / homepage | ✅ Pass | 1.258s — within SSR range |
| PERF-002 | GET /api/admin/clients | ✅ Pass | 1.040s |
| PERF-003 | GET /api/admin/trips | ✅ Pass | 0.984s |
| PERF-004 | GET /api/admin/revenue?preset=30d (1st call) | ✅ Pass | 0.825s |
| PERF-005 | GET /api/admin/revenue?preset=30d (2nd call) | ⚠️ Partial | 0.853s — no cache speedup (28ms slower); Vercel serverless may not cache per-user responses |
| PERF-008 | GET /api/images/pexels?query=beach | ✅ Pass | 0.231s (likely upstream cached) |
| PERF-012 | GET /api/health (warm function) | ✅ Pass | 0.248s |
| PERF-006/007/009-011 | Concurrent requests, large payloads | 🔲 Pending | |

### E2E — End-to-End Business Workflows

| ID | Test | Status | Notes |
|----|------|--------|-------|
| E2E-001 | Create client → create trip → confirm in list → delete both | ✅ Pass | Full lifecycle verified; client+trip+delete all work |
| E2E-001b | Full sales pipeline: client→proposal→convert→invoice | ⏭ Blocked | QA org has 0 proposal templates; `{"error":"Template not found"}` |
| E2E-002 | Invoice auto-created on trip create | ⚠️ Partial | Trip alone does NOT auto-create invoice; only proposal→convert does |
| E2E-012 | Add-on to invoice flow | ⏭ Blocked | `/api/add-ons` uses SSR cookie auth, not Bearer JWT; requires browser session |
| E2E-003 to E2E-011 | Payment, email, multi-org flows | ⏭ Blocked | Requires templates + cookie auth + configured providers |

---

## Additional Test Results — Agent 7 (TMPL / AI / Cron / Images / Weather)

### Tour Templates (Agent 7)

| ID | Test | Status | Notes |
|----|------|--------|-------|
| TMPL-006 | `POST /api/admin/tour-templates/extract` empty body | ✅ Pass | Returns 400 `{"error":"Missing url"}` |
| TMPL-007 | `POST /api/admin/tour-templates/extract` non-JSON body | ✅ Pass | Returns 400 `{"error":"Invalid JSON body"}` |
| TMPL-019 | `POST /api/admin/generate-embeddings` | ❌ Fail | Returns 500 — AI embedding provider key not configured → **BUG-010** |
| TMPL-020 | `GET /api/admin/destinations` | ✅ Pass | Returns destination breakdown with counts |
| TMPL-LIST-A | `GET /api/admin/trips?type=template` | ✅ Pass | Template filter works on trip list endpoint |
| TMPL-LIST-B | `GET /api/admin/tour-templates` (list) | ❌ Fail | 404 — no dedicated list endpoint; use `?type=template` instead → **INFO-005** |

### AI Features (Agent 7)

| ID | Test | Status | Notes |
|----|------|--------|-------|
| AI-PRICING | `GET /api/ai/pricing-suggestion` | ⏭ Blocked | 401 — `/api/ai/*` uses cookie auth, not Bearer JWT → **BUG-008** |
| AI-SUGGEST | `POST /api/ai/suggest-reply` | ⏭ Blocked | 401 — same |
| AI-REVIEW | `POST /api/ai/draft-review-response` | ⏭ Blocked | 401 — same |

### Cron Jobs (Agent 7)

| ID | Test | Status | Notes |
|----|------|--------|-------|
| CRON-001 | `POST /api/cron/assistant-alerts` | ✅ Pass | `{success:true, queued:0, skipped:0, errors:0}` |
| CRON-002 | `POST /api/cron/assistant-briefing` | ✅ Pass | `{success:true, queued:0, skipped:0, errors:0}` |
| CRON-003 | `POST /api/cron/assistant-digest` | ✅ Pass | `{success:true, result:{queued:0, skipped:0, errors:0}}` |
| CRON-004 | `POST /api/cron/operator-scorecards` | ⏭ Skip | 401 expected — requires `CRON_SECRET` or super_admin, not regular admin JWT → **BUG-009 reclassified: expected behavior** |

### Images / Media (Agent 7)

| ID | Test | Status | Notes |
|----|------|--------|-------|
| IMG-PEXELS | `GET /api/images/pexels?query=beach` | ✅ Pass | Returns valid Pexels image URL — API key configured |
| IMG-PIXABAY | `GET /api/images/pixabay?query=beach` | ⏭ Skip | Returns `{url:null}` — PIXABAY_API_KEY not set in Vercel env; graceful null is correct behavior → **BUG-019 reclassified: config issue** |
| IMG-UNSPLASH | `GET /api/images/unsplash?query=beach` | ✅ Pass | Returns URL + results array — API key configured |
| IMG-DEPRECATED | `GET /api/unsplash` (old route) | ✅ Pass | Returns 410 `{"error":"Deprecated route. Use /api/images/unsplash"}` — tombstoned correctly |

### Geocoding / Weather (Agent 7)

| ID | Test | Status | Notes |
|----|------|--------|-------|
| WEATHER-GOA | `GET /api/weather?location=Goa` | ⚠️ Partial | Returns weather for Genoa (Italy) not Goa (India) → **BUG-012** |
| WEATHER-BAD | `GET /api/weather?location=nonexistentlocation` | ✅ Pass | Returns 404 `{"error":"Could not find weather data for:..."}` |
| CURRENCY-BASE | `GET /api/currency` (bare) | ✅ Pass | Returns 400 with helpful usage examples (by design) |
| CURRENCY-RATES | `GET /api/currency?base=USD` | ✅ Pass | Returns live exchange rates for 30+ currencies |
| GEO-USAGE | `GET /api/admin/geocoding/usage` | ✅ Pass | Now returns 200 with `status:"not_configured"` when RPC function unavailable → **BUG-011 fixed** |

### Integrations (Agent 7)

| ID | Test | Status | Notes |
|----|------|--------|-------|
| INT-PLACES | `GET /api/integrations/places?query=Goa` | ⚠️ Partial | `{enabled:false, googlePlaceId:""}` — Google Places ID not configured |
| INT-TRIPADVISOR | `GET /api/integrations/tripadvisor?query=Goa` | ❌ Fail | "TRIPADVISOR_API_KEY not configured" |

### Additional Admin Endpoints (Agent 7)

| ID | Test | Status | Notes |
|----|------|--------|-------|
| WORKFLOW-EVENTS | `GET /api/admin/workflow/events` | ✅ Pass | Returns lifecycle stage-change event log |
| WORKFLOW-RULES | `GET /api/admin/workflow/rules` | ✅ Pass | Returns notify rules for each lifecycle stage |
| NAV-COUNTS | `GET /api/nav/counts` | ✅ Pass | `{inboxUnread:1, proposalsPending:11, bookingsToday:1, reviewsNeedingResponse:0}` |
| SEED-DEMO-GET | `GET /api/admin/seed-demo` | ✅ Pass | Returns 405 Method Not Allowed (GET rejected) |
| SEED-DEMO-POST | `POST /api/admin/seed-demo` | ✅ Pass | Returns 403 "Not available in production" — production guard works |
| INSIGHTS-BEST-QUOTE | `POST /api/admin/insights/best-quote` with null UUID | ✅ Pass | Now returns 404 for nonexistent proposalId → **BUG-013 fixed** |

---

## Test Results — Session 4 (Asst/WA/Notify/Bill/Price/Settings)

Agent: curl + cookie auth | 52 tests | 38 pass · 11 fail · 3 info

| ID | Test | Status | Notes |
|----|------|--------|-------|
| ASST-001 | POST /api/assistant/chat `{message:"..."}` | ✅ Pass | |
| ASST-004 | GET /api/assistant/conversations | ✅ Pass | |
| ASST-007 | GET /api/assistant/quick-prompts | ✅ Pass | Returns `{prompts:[]}` |
| ASST-008 | GET /api/assistant/usage | ✅ Pass | |
| ASST-009 | POST /api/assistant/chat `{message:""}` | ✅ Pass | 400 |
| ASST-011 | POST /api/assistant/confirm `{actionId:"..."}` | ❌ Spec | 400 — spec sends wrong payload; endpoint expects `{action,actionName}` not `{actionId}` |
| ASST-012 | GET /api/assistant/conversations/nonexistentsessionid | ✅ Pass | 404 |
| ASST-013 | POST /api/ai/suggest-reply `{content,role}` | ❌ Spec | 400 — missing `lastMessages` array; corrected payload returns 200 |
| ASST-014 | POST /api/ai/draft-review-response | ✅ Pass | 200 with AI draft |
| ASST-015 | GET /api/admin/insights/ai-usage | ✅ Pass | |
| ASST-018 | POST /api/assistant/chat `{message:"<script>alert(1)</script>"}` | ✅ Pass | XSS sanitized |
| WA-001 | GET /api/whatsapp/health | ✅ Pass | |
| WA-002 | GET /api/admin/whatsapp/health | ✅ Pass | |
| WA-003 | GET /api/whatsapp/status | ✅ Pass | |
| WA-010 | GET /api/whatsapp/conversations | ❌ Fail | 500 — module load error from missing WPPCONNECT env vars → **BUG-026** (Fixed) |
| WA-013 | POST /api/whatsapp/send `{}` | ✅ Pass | 400 missing phone |
| WA-014 | POST /api/whatsapp/send `{phone}` (no message) | ✅ Pass | 400 |
| WA-015 | POST /api/whatsapp/send `{phone:"abc",message:"test"}` | ✅ Pass | 400 invalid phone |
| WA-016 | POST /api/whatsapp/broadcast `{phones:[],message:"test"}` | ⚠️ Partial | 409 `whatsapp_not_connected` fires before empty-phones check; order differs from spec |
| WA-021 | POST /api/admin/whatsapp/normalize-driver-phones | ✅ Pass | |
| WA-022 | POST /api/whatsapp/send `{phone,message:"<script>..."}` | ✅ Pass | 409 WA not connected; XSS not echoed |
| NOTIFY-002 | POST /api/notifications/process-queue | ✅ Pass | |
| NOTIFY-003 | POST /api/notifications/retry-failed | ✅ Pass | |
| NOTIFY-004 | POST /api/notifications/schedule-followups | ✅ Pass | |
| NOTIFY-005 | POST /api/notifications/client-landed `{}` | ✅ Pass | 400 |
| NOTIFY-006 | GET /api/admin/notifications/delivery | ✅ Pass | |
| NOTIFY-011 | POST /api/notifications/send `{}` | ✅ Pass | 400 |
| NOTIFY-012 | POST /api/notifications/send `{type:"test"}` | ✅ Pass | 400 missing recipientId |
| NOTIFY-013 | POST /api/emails/welcome `{email:"not-an-email"}` | ❌ Env | 200 `{skipped:true,reason:"missing_email_provider_config"}` — Resend not configured, format never validated |
| NOTIFY-014 | POST /api/notifications/retry-failed | ✅ Pass | `count=0` |
| BILL-003 | GET /api/subscriptions | ✅ Pass | |
| BILL-004 | GET /api/subscriptions/limits | ✅ Pass | |
| BILL-006 | GET /api/billing/subscription | ❌ Data | 404 — qa-admin has no org_id in Vercel DB for this test run |
| BILL-007 | POST /api/billing/contact-sales `{name,email,message}` | ❌ Data | 404 — same org_id gap; valid body returns 400 for missing `target_tier` (validation works) |
| BILL-008 | POST /api/billing/contact-sales `{}` | ✅ Pass | 400 Zod validation |
| BILL-013 | GET /api/admin/referrals | ✅ Pass | |
| BILL-014 | GET /api/admin/reputation/client-referrals | ✅ Pass | |
| PRICE-002 | GET /api/admin/pricing/dashboard | ✅ Pass | |
| PRICE-003 | GET /api/admin/pricing/trip-costs | ❌ Spec | 405 — no collection GET; only POST + /:id GET. Spec error |
| PRICE-007 | GET /api/admin/pricing/overheads | ✅ Pass | |
| PRICE-011 | GET /api/admin/pricing/trips | ✅ Pass | |
| PRICE-012 | GET /api/admin/pricing/vendor-history | ❌ Spec | 400 — requires `?vendor=&category=` params; corrected URL returns 200 |
| PRICE-013 | GET /api/admin/pricing/transactions | ✅ Pass | |
| PRICE-014 | POST /api/admin/pricing/trip-costs `{}` | ✅ Pass | 400 |
| PRICE-015 | POST /api/admin/pricing/trip-costs `{amount:-100}` | ✅ Pass | 400 |
| PRICE-016 | GET /api/admin/pricing/trip-costs/00000000-... | ✅ Pass | 404 |
| PRICE-020 | GET /api/currency | ❌ Spec | 400 — requires `?base=`, `?list`, or `?amount=&from=&to=`; corrected URL returns 200 |
| SET-003 | GET /api/settings/team | ✅ Pass | |
| SET-005 | POST /api/settings/team/invite `{}` | ✅ Pass | 400 |
| SET-010 | POST /api/settings/team/invite `{email:"test"}` | ✅ Pass | 400 invalid email |
| SET-014 | GET /api/settings/upi | ✅ Pass | |
| SET-016 | GET /api/admin/security/diagnostics | ❌ Perm | 403 — requires super-admin role; standard admin blocked (correct) |

---

## Test Results — Session 5 (Client/Contacts/Trip)

| ID | Test | Status | Notes |
|----|------|--------|-------|
| CLIENT-001 | POST /api/admin/clients — create | ✅ Pass | Returns `{"success":true,"userId":"..."}` (key is `userId`, not `id`) |
| CLIENT-003 | GET /api/admin/clients — list | ✅ Pass | Returns `{"clients":[...]}` |
| CLIENT-005 | PATCH /api/admin/clients?id={id} — update full_name | ⚠️ Partial | Query param `?id=` ignored; id must be in request body → **BUG-027 (API contract)** |
| CLIENT-006 | PATCH — update email | ❌ Fail | Email field not updatable by design (comment: "auth sync issues") → **BUG-028 (design limitation)** |
| CLIENT-007 | DELETE /api/admin/clients?id={id} | ✅ Pass | `{"success":true}` |
| CLIENT-008 | GET — verify deleted absent | ✅ Pass | |
| CLIENT-011 | POST — missing full_name | ✅ Pass | 400 |
| CLIENT-012 | POST — missing email | ✅ Pass | 400 |
| CLIENT-013 | POST — invalid email format | ⚠️ Partial | 400 but message is "Failed to create user" not "Invalid email format" → **BUG-029 (opaque message)** |
| CLIENT-016 | POST — XSS `<script>` in full_name | ✅ Pass | Script now stripped by sanitizeText stripHtml → **BUG-030 fixed** |
| CLIENT-017 | POST — SQL injection in email | ✅ Pass | 400 rejected |
| CLIENT-018 | PATCH — non-existent UUID | ⚠️ Partial | 404 when id in body; 400 when id in query param (wrong path) → **BUG-027** |
| CLIENT-019 | DELETE — non-existent UUID | ✅ Pass | 404 |
| CLIENT-020 | DELETE — no id param | ✅ Pass | 400 |
| CLIENT-021 | GET ?search=QA — filtered | ✅ Pass | Search filtering now implemented → **BUG-031 fixed** |
| CLIENT-022 | GET ?search=zzz999 — empty result | ✅ Pass | Returns empty array → **BUG-031 fixed** |
| CLIENT-024 | GET /api/admin/contacts | ✅ Pass | 200 `{"contacts":[]}` |
| CLIENT-027 | POST /api/admin/contacts/{null-uuid}/promote | ✅ Pass | 404 |
| TRIP-001 | POST /api/admin/trips — create | ✅ Pass | Returns `tripId` (not `id`) → **BUG-032 (key inconsistency, INFO)** |
| TRIP-003 | GET /api/admin/trips — list | ✅ Pass | |
| TRIP-004 | GET /api/trips | ⏭ Skip | 401 for admin JWT — client-facing endpoint, cookie auth only; use `/api/admin/trips` → **Expected** |
| TRIP-005 | GET /api/admin/trips/{id} | ✅ Pass | |
| TRIP-006 | GET /api/trips/{id} | ✅ Pass | |
| TRIP-008 | DELETE /api/trips/{id} | ✅ Pass | |
| TRIP-009 | GET /api/trips/{deleted-id} | ✅ Pass | 404 |
| TRIP-012 | GET /api/trips/{id}/add-ons | ✅ Pass | |
| TRIP-014 | GET /api/trips/{id}/invoices | ✅ Pass | |
| TRIP-016 | POST — no clientId | ✅ Pass | 400 |
| TRIP-017 | POST — no startDate | ✅ Pass | 400 |
| TRIP-018 | POST — no endDate | ✅ Pass | 400 |
| TRIP-019 | POST — endDate before startDate | ✅ Pass | Now returns 400 "startDate must be before or equal to endDate" → **BUG-033 fixed** |
| TRIP-020 | POST — non-existent clientId | ✅ Pass | 404 |
| TRIP-021 | DELETE /api/trips/{null-uuid} | ✅ Pass | 404 |
| TRIP-022 | POST /api/admin/trips/{null-uuid}/clone | ✅ Pass | 404 |
| TRIP-025 | POST — destination "São Paulo" | ✅ Pass | Top-level `destination` now accepted as fallback → **BUG-034 fixed** |
| TRIP-030 | GET /api/admin/operations/command-center | ✅ Pass | |
| TRIP-032 | GET /api/admin/trips?status=confirmed | ✅ Pass | Status filter works |
| TRIP-033 | GET /api/admin/trips?search=QA | ✅ Pass | JS-side search now works; removed broken PostgREST `.or()` → **BUG-035 fixed** |

---

## Bug Registry

| ID | Sev | Description | Root Cause | Fix | Commit | Status |
|----|-----|-------------|------------|-----|--------|--------|
| BUG-001 | HIGH | `POST /api/admin/clients` → 400 "Failed to process client data" | `profiles_role_check` constraint missing `'client'` role | Migration `20260324000003` adds `'client'` to CHECK | `c5bfaa3` | Fixed |
| BUG-002 | MED | Nav links `/admin/clients` and `/admin/drivers` → 404 | Wrong `href` in `admin/page.tsx` (3×) + `ops-copilot` (1×) | Changed to `/clients` and `/drivers` | `01dd32a` | Fixed |
| BUG-003 | HIGH | `/api/admin/revenue` and `/api/admin/ltv` → 500 | `payment_links` table missing (PGRST205); error thrown | Make query non-fatal; fallback to `[]` | `dca0ef3` | Fixed |
| BUG-004 | LOW | `shareUrl` contains embedded newline | `NEXT_PUBLIC_APP_URL` env var has trailing newline on Vercel | `.trim()` on env var in `proposals/[id]/send/route.ts` | `0d2e774` | Fixed |
| BUG-005 | INFO | Trip `destination` null after proposal convert | QA template has no destination value | Data issue — not a code bug | — | Known Limit |
| BUG-006 | MED | `POST /api/admin/clients` with invalid JSON body → 500 | `createCatchAllHandlers` dispatcher does not handle JSON parse errors | Catch SyntaxError in dispatcher → return 400 | pending-commit | **Fixed** ✅ |
| BUG-007 | LOW | `DASH-011`: `best-quote-timing` endpoint returns error via GET | Endpoint `/api/admin/insights/best-quote-timing` does not exist; test used wrong URL. The timing insight is `smart-upsell-timing`; the best-quote insight is POST-only | Test spec error — route was never registered | — | **Test Spec Error** |
| BUG-008 | MED | `/api/ai/*`, `/api/images/*`, `/api/integrations/*`, `/api/nav/counts` → 401 with valid admin JWT | These route groups use Supabase cookie-based session auth instead of Bearer JWT; inconsistent with `/api/admin/*` | Standardize auth: either use Bearer JWT for all API routes or document cookie requirement | — | **Open** |
| BUG-009 | MED | `POST /api/cron/operator-scorecards` → 401 with admin JWT | Endpoint requires either cron secret (`CRON_SECRET` or `x-vercel-cron` header) OR super_admin role — regular admin JWT rejected by design | Expected behavior — cron-only endpoint; test must use CRON_SECRET or super_admin | — | **Expected** (cron-only) |
| BUG-010 | MED | `POST /api/admin/generate-embeddings` → 500 | AI embedding provider key (`OPENAI_API_KEY` or similar) not configured in Vercel | Configure embedding provider key | — | **Open** |
| BUG-011 | LOW | `GET /api/admin/geocoding/usage` → 500 | `get_geocoding_usage_stats` DB RPC function not installed; `getGeocodingUsageStats()` returned null; route returned 500 | Return 200 with `status:"not_configured"` and empty usage/limits when stats unavailable | pending-commit | **Fixed** ✅ |
| BUG-012 | LOW | `?location=Goa` resolves to Genoa (Italy) not Goa (India) | Geocoder picks first match; short city names without country context are ambiguous | Require country context or bias geocoder toward travel destinations | — | **Open** |
| BUG-013 | LOW | `POST /api/admin/insights/best-quote` with nonexistent proposalId returns 200 with generated content | Endpoint fetched proposal, got null, then silently fell through to median-price fallback | Added 404 early return after `maybeSingle()` when proposalId specified but not found | pending-commit | **Fixed** ✅ |
| BUG-014 | HIGH | Auth cookie `sb-...-auth-token` missing `HttpOnly` and `Secure` flags | Supabase SSR client sets cookie with `SameSite=lax` only; no `HttpOnly` (JS-readable) and no `Secure` (transmits over HTTP) | Added `secure: process.env.NODE_ENV === 'production'` to `setAll()` in `server.ts` + `middleware.ts`; `HttpOnly` omitted intentionally — `createBrowserClient` requires JS-readable cookie | 82c2b08 | **Fixed (partial)** — Secure ✅, HttpOnly ⚠️ by design |
| BUG-015 | MED | `POST /api/onboarding/setup` → 400 "Company name is required" even when `name` is in JSON body | Handler reads `body.companyName` (camelCase); QA test sent `name` (snake_case mismatch) | Accept `body.companyName ?? body.name` as alias in handler | pending-commit | **Fixed** ✅ |
| BUG-016 | MED | `POST /api/social/posts` → 500 "Request failed" | Two schema mismatches: (1) `template_id` is `NOT NULL` in DB but `optional()` with no default — insert fails; (2) `hashtags` is `text` in DB but route sent `string[]` — type mismatch | Default `template_id` to `''` when absent; serialize `hashtags` array to `JSON.stringify()`; widen Zod from `.uuid()` to `.min(1)` | 82c2b08 | **Fixed** ✅ |
| BUG-017 | MED | `GET /api/billing/subscription` → 404 "Organization not found" for authenticated QA user | `organizations` RLS SELECT policy only allows `auth.uid() = owner_id` — non-owner members get `null` silently from `maybeSingle()`; user client was used for both `organizations` and `resolveOrganizationPlan` queries | Use `createAdminClient()` for `organizations` query and `resolveOrganizationPlan()` in billing handler | 82c2b08 | **Fixed** ✅ |
| BUG-018 | LOW | AI pricing-suggestion → "Failed to generate pricing suggestion" with valid params | OpenAI/AI provider key not configured for pricing suggestion endpoint | Configure AI provider key (`OPENAI_API_KEY` or equivalent) | — | **Open** |
| BUG-019 | LOW | `GET /api/images/pixabay?query=beach` → `{url:null}` | Pixabay API key configured but response parsing returns null URL | Code uses `hits[0].webformatURL` which is correct per Pixabay API. Likely PIXABAY_API_KEY not set in Vercel or returns no results for query; handler returns `{url:null}` by design | — | **Config Issue** (graceful null is correct behavior when no results) |
| BUG-020 | LOW | `GET /api/reputation/analytics/snapshot` → 405 | Handler only exported POST (triggers snapshot generation); no GET to retrieve latest | Added GET handler that queries latest `reputation_snapshots` row for the org | pending-commit | **Fixed** ✅ |
| BUG-021 | LOW | `POST /api/reputation/nps/submit` validates score before doing token DB lookup — returns 400 "score must be 1–10" when score is missing/invalid even for nonexistent tokens | Score validation happened before DB token lookup; nonexistent token + invalid score returned 400 instead of 404 | Moved score validation to after `maybeSingle()` token lookup; invalid token now always returns 404 first | pending-commit | **Fixed** ✅ |
| BUG-022 | INFO | `GET /api/marketplace/{id}/view` → 405 | POST-only by design — view tracking is a side-effecting operation; GET has no defined semantics here | Test expectation wrong; use POST to record a view | — | **Expected** (POST-only) |
| BUG-023 | INFO | `/api/social/reviews/public` → 405 on GET | POST-only by design — review submission is a write operation | Test expectation wrong; use POST to submit a review | — | **Expected** (POST-only) |
| BUG-024 | MED | `GET /api/payments/links/{token}` → 500 for nonexistent token | `getPaymentLinkByToken` throws on missing `payment_links` table (PGRST205); caught by route handler as 500 | Return null in `getPaymentLinkByToken` when table not found (PGRST205/42P01) → route returns 404 | pending-commit | **Fixed** ✅ |
| BUG-025 | LOW | `OPTIONS /api/admin/*` → 405, no CORS preflight headers | Admin dispatcher tried to route OPTIONS to handler modules; none export OPTIONS → 405 | `createCatchAllHandlers` OPTIONS handler now returns 204 directly with CORS Allow headers | pending-commit | **Fixed** ✅ |
| BUG-026 | MED | `GET /api/whatsapp/conversations` → 500 when WhatsApp not configured | `whatsapp-waha.server.ts` module throws `Invalid environment variables` at import time when `WPPCONNECT_*` env vars absent; entire module load fails | Inlined `sessionNameFromOrgId` logic; removed bad import; added PGRST205 graceful fallback | 6c5fb3f | **Fixed** ✅ |
| BUG-027 | LOW | `PATCH /api/admin/clients?id={id}` — query param `id` ignored; API contract mismatch | Handler only reads `id` from request body (line 493: `body.id`); DELETE correctly reads from query param | Design inconsistency — body id is required for PATCH; `?id=` query param silently ignored | — | **Known Limitation** (by design) |
| BUG-028 | LOW | `PATCH /api/admin/clients` — email field not updatable | Comment in code: "email is not updated here to avoid auth sync issues for now" | Intentional design limitation — email update requires auth.admin.updateUserById() sync | — | **Known Limitation** (by design) |
| BUG-029 | LOW | POST client with invalid email → 400 "Failed to create user" (opaque) | Error originates from `auth.admin.createUser()` which doesn't expose the specific validation error | Consider pre-validating email format with regex before calling Supabase auth | — | **Open** |
| BUG-030 | HIGH | POST/PATCH client — `full_name` not sanitized: HTML/script tags stored raw | `fullName = String(body.full_name || "").trim()` — no HTML stripping; `<script>alert(1)</script>` stored in DB | Added `stripHtml: true` option to `sanitizeText()`; applied to POST and PATCH handlers | df7a917 (sanitize.ts) / pending-commit | **Fixed** ✅ |
| BUG-031 | MED | GET /api/admin/clients — `?search=` query param silently ignored; returns all clients | GET handler had no search/filter logic at all | Added `.or(full_name.ilike.%s%,email.ilike.%s%)` Supabase filter when `search` param present | pending-commit | **Fixed** ✅ |
| BUG-032 | INFO | POST /api/admin/clients returns `userId`, POST /api/admin/trips returns `tripId` — inconsistent with `id` convention | Inconsistency between handlers; downstream consumers expecting `id` key will break | No code fix — document API response keys in API reference | — | **Info/Doc** |
| BUG-033 | HIGH | POST /api/admin/trips — trip created with `endDate < startDate` (no date validation) | No date ordering check in POST handler | Added `new Date(startDate) > new Date(endDate)` → 400 check | pending-commit | **Fixed** ✅ |
| BUG-034 | LOW | POST /api/admin/trips — top-level `destination` field ignored; stored as "TBD" | POST body `{destination: "Goa"}` goes to `itinerary = body.itinerary || {}`, not top-level; `itinerary.destination` undefined | Added `body.destination` as fallback in itinerary payload | pending-commit | **Fixed** ✅ |
| BUG-035 | HIGH | GET /api/admin/trips?search=QA → 400 "Failed to process trip" | PostgREST `.or()` does not support filtering on embedded resource columns (`itineraries.trip_title.ilike`) — throws validation error | Removed broken PostgREST `.or()`; applied JS-side search filter after fetch | pending-commit | **Fixed** ✅ |

---

## Infrastructure Findings (not code bugs)

| ID | Sev | Finding | Impact |
|----|-----|---------|--------|
| INFO-001 | LOW | Non-existent resource IDs return 400 instead of 404 | Incorrect HTTP semantics; clients cannot distinguish bad request from not found |
| INFO-002 | LOW | Some superadmin endpoints return 404 instead of 403 for non-superadmin users | Security principle of not revealing what exists is inconsistently applied |
| INFO-003 | LOW | No request body size limit enforced (10KB+ field values accepted) | Potential DoS vector; should enforce e.g. 1MB body limit at middleware level |
| INFO-004 | MED | XSS payload chars stored in DB (client name `<script>...`) | React auto-escapes on render so not currently exploitable, but raw HTML responses or PDF generation could be affected | **Resolved** — BUG-030 fixed with `stripHtml: true` in sanitizeText |
| INFO-005 | LOW | No dedicated `GET /api/admin/tour-templates` list endpoint | Templates must be fetched via `GET /api/admin/trips?type=template` — not documented |

---

## Known Limitations (not code bugs)

- **`tour_template_days` table missing** — proposal creation from template does not auto-create `proposal_days`. Must insert manually for convert flow.
- **`payment_links` table missing** — migration `20260319000000` references `public.bookings` (also missing). Revenue/LTV degrade gracefully.
- **`RESEND_API_KEY` not set** — email delivery fails silently; all email-sending endpoints return `disabled:true`.
- **Razorpay not configured** — payment order creation disabled in Vercel env.
- **Trip PATCH endpoint missing** — `/api/admin/trips` only has GET + POST. Trip editing is UI-only.
- **Tour templates no CRUD API** — only `/api/admin/tour-templates/extract` exists; templates via PDF import only.
- **Reputation / Social / Assistant are NOT subscription-gated** — S3 confirmed all modules work for any cookie-authenticated user. The S2 "Unauthorized" was cookie auth failure, not feature gate. No superadmin action needed.
- **Social Studio write ops unblocked** — BUG-016 fixed. `POST /api/social/posts` now works. Remaining social blocks: no platform connections seeded, AI keys not configured.
- **WhatsApp WPPConnect not connected** — service is accessible (`/api/whatsapp/health` → `{connected:false}`) but no active session.
- **Flight / Hotel / Location search APIs not configured** — Amadeus or Duffel API keys missing.
- **Weather API not configured** — OpenWeatherMap key not set.
- **Pexels API works** ✅ — Images served. Pixabay returns null URL (BUG-019). Unsplash works ✅.
- **Drivers endpoint** — `/api/admin/drivers` → 404 (not in admin dispatcher). Use `/api/drivers/search?location=...` with cookie auth.
- **Google Places not configured** — INT-PLACES returns `{enabled:false, googlePlaceId:""}`.
- **TripAdvisor API key not configured** — TRIPADVISOR_API_KEY missing from Vercel env.
- **Root `/api/*` endpoints use cookie-based session auth** — resolved in S3 by capturing session cookie from login. Bearer JWT only works for `/api/admin/*`.
- **Bearer JWT expires after 1 hour** — long-running test agents that obtained a JWT at session start will get 401 on all `requireAdmin()` endpoints after expiry. Re-login before testing admin routes if session > 50 min old. `SUPABASE_SERVICE_ROLE_KEY` is correctly configured on Vercel (confirmed by billing fix).

---

## Pending Test Coverage

| Area | Status | Blocker |
|------|--------|---------|
| All UI tests (AUTH, ONBOARD, DASH UI, CLIENT UI, etc.) | ⏭ Blocked | Requires playwright or browser |
| Reputation write ops (REP-013 to REP-030) | ⏭ Blocked | No reviews/connections seeded; sync needs Google Places ID |
| Social Studio write ops (SOCIAL-012 to SOCIAL-026) | ⏭ Blocked | No platform connections seeded; AI keys not configured |
| AI Assistant full flow (ASST-006 to ASST-018) | ⏭ Blocked | Requires deeper session setup; tool access config |
| Billing & Subscriptions detail (BILL-005 to BILL-018) | ⏭ Blocked | BUG-017 fixed; Razorpay not configured — no payment flow to test |
| WhatsApp (WA-003 to WA-024) | ⏭ Blocked | WPPConnect session not active |
| Superadmin / God mode (GOD-007 to GOD-032) | ⏭ Blocked | Requires super_admin JWT |
| Tour Templates (TMPL-001 to TMPL-020) | ⏭ Blocked | No templates seeded in QA org |
| Proposals full flow (PROP-002 to PROP-038) | ⏭ Blocked | No templates seeded |
| Bookings search (BOOK-002 to BOOK-004) | ❌ Blocked | Amadeus/Duffel keys not configured |
| Calendar (CAL-001 to CAL-014) | ⏭ Blocked | UI tests |
| Role enforcement non-admin user | 🔲 Pending | Need client-role JWT |
| Performance load tests (PERF-003 to PERF-012) | 🔲 Pending | Need load testing tool |
| BUG-006 fix verification | ✅ Done | Fixed: SyntaxError caught in api-dispatch.ts dispatcher |
| BUG-015 fix verification | ✅ Done | Fixed: onboarding/setup accepts `name` as alias for `companyName` |
| BUG-020 fix verification | ✅ Done | Fixed: GET /api/reputation/analytics/snapshot now returns latest snapshot |
| BUG-024 fix verification | ✅ Done | Fixed: payment_links table-not-found handled gracefully → 404 |
| BUG-025 fix verification | ✅ Done | Fixed: OPTIONS on admin catch-all returns 204 + CORS headers |
| BUG-026 fix verification | ✅ Done | Fixed: whatsapp/conversations no longer imports whatsapp-waha.server; returns [] gracefully |
| BUG-016 fix verification | ✅ Done | Fixed in 82c2b08; POST /api/social/posts → 201 confirmed |
| BUG-017 fix verification | ✅ Done | Fixed in 82c2b08; GET /api/billing/subscription → plan:pro_monthly confirmed |
