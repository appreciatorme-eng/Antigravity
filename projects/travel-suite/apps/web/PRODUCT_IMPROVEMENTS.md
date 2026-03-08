# Product Improvements Tracker
Branch: codex/product-improvements | Base score: 66/100 | Target: 85/100
Last updated: auto-updated after each commit

## Legend
- 🔴 NOW — Broken/fake functionality blocking real usage
- 🟡 SOON — UX/quality debt that erodes trust  
- 🔵 LATER — Polish and optimization

| ID   | Priority | File(s)                                           | Issue                                              | Status      | Commit |
|------|----------|---------------------------------------------------|----------------------------------------------------|-------------|--------|
| PI-01 | 🔴 NOW  | lib/payments/link-tracker.ts:31,57               | Math.random() token + localStorage ledger          | ✅ DONE     | 507d6d5 |
| PI-02 | 🔴 NOW  | components/payments/PaymentLinkButton.tsx:62,99  | Local-only link creation, +919999999999 placeholder| ✅ DONE     | 507d6d5 |
| PI-03 | 🔴 NOW  | app/api/_handlers/payments/create-order/         | Payment link not server-persisted to DB            | ✅ DONE     | 507d6d5 |
| PI-04 | 🔴 NOW  | app/api/_handlers/proposals/public/[token]/      | Proposal approval queues notification, not payment | ✅ DONE     | 507d6d5 |
| PI-05 | 🔴 NOW  | app/billing/page.tsx:86-95                       | Hardcoded tier, alert()/mailto checkout (dead)     | ✅ DONE     | 8e8705d |
| PI-06 | 🔴 NOW  | components/whatsapp/UnifiedInbox.tsx:490         | Thread send is local-only, no real WPPConnect send | ✅ DONE     | e27f918 |
| PI-07 | 🔴 NOW  | app/social/_components/canvas/CanvasMode.tsx:47  | Publish CTA is toast("coming soon")                | ✅ DONE     | 820c076 |
| PI-08 | 🔴 NOW  | app/api/_handlers/social/publish/route.ts:74     | Returns fake publish IDs in mock mode              | ✅ DONE     | 820c076 |
| PI-09 | 🔴 NOW  | app/reputation/_components/ReputationDashboard.tsx:32,95,350 | Fed entirely by MOCK_* data, save = console.log    | ✅ DONE     | fc11fa7 |
| PI-10 | 🔴 NOW  | app/api/_handlers/reputation/dashboard/route.ts  | avgResponseTimeHours: 12 hardcoded placeholder     | ✅ DONE     | fc11fa7 |
| PI-11 | 🔴 NOW  | app/settings/team/page.tsx:11,97                 | Team data mocked, CRUD is local useState           | ✅ DONE     | 5129828 |
| PI-12 | 🔴 NOW  | app/settings/marketplace/page.tsx:48,175         | Entirely mock, edit icon has no onClick            | ✅ DONE     | 5129828 |
| PI-13 | 🔴 NOW  | app/admin/page.tsx:93                            | Revenue series hardcoded static array              | ✅ DONE     | b5c298c |
| PI-14 | 🟡 SOON | components/layout/Sidebar.tsx:49                 | Nav badge counts are fake/static                   | ✅ DONE     | 9a4ee9d |
| PI-15 | 🟡 SOON | components/layout/MobileNav.tsx:11               | Mirrors same mock count approach                   | ✅ DONE     | 9a4ee9d |
| PI-16 | 🟡 SOON | app/inbox/page.tsx:94                            | Broadcast send uses setTimeout simulation          | ✅ DONE     | 12ca7c3 |
| PI-17 | 🟡 SOON | app/portal/[token]/page.tsx:10                   | Traveler portal loads mock data, not real DB       | ✅ DONE     | 12ca7c3 |
| PI-18 | 🟡 SOON | components/payments/RazorpayModal.tsx:56,318     | Fake QR generation, simulated success/failure      | ✅ DONE     | 076fa42 |
| PI-19 | 🔵 LATER| app/api/_handlers/reputation/                    | No real review-platform aggregation endpoint       | ✅ DONE     | df89725 |
| PI-20 | 🔵 LATER| Global timezone handling                         | No TZ-aware date rendering strategy                | ✅ DONE     | 8fd1ea8 |

## Sprint Summary
- Items completed: 20/20
- Commits:
  - `159ad17` tracker initialized
  - `507d6d5` PI-01 through PI-04 payments foundation
  - `8e8705d` PI-05 billing page
  - `e27f918` PI-06 inbox outbound send
  - `820c076` PI-07 through PI-08 social publish flow
  - `fc11fa7` PI-09 through PI-10 reputation dashboard
  - `5129828` PI-11 through PI-12 team and marketplace settings
  - `b5c298c` PI-13 admin revenue
  - `9a4ee9d` PI-14 through PI-15 nav badge counts
  - `12ca7c3` PI-16 through PI-17 broadcast and traveler portal
  - `076fa42` PI-18 real Razorpay checkout
  - `df89725` PI-19 review sync
  - `8fd1ea8` PI-20 timezone strategy
  - `444a001`, `44f1614`, `3855cdc`, `40e429e`, `5f33151`, `c3fb941`, `5201de8`, `0f874ff`, `63303f7`, `95ca852`, `8c18109` tracker updates
- Final score estimate: ~85/100
- Remaining tech debt:
  - Timezone preference is stored in Supabase auth user metadata plus local storage for web scope delivery; move it into a shared profile record if mobile and backend services need the same source of truth.
  - Social publish currently uses the honest schedule-for-review path unless a real platform connection is available; direct provider posting can be layered on without changing the UI contract.
