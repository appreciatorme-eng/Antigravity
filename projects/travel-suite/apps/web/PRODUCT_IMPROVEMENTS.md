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
| PI-13 | 🔴 NOW  | app/admin/page.tsx:93                            | Revenue series hardcoded static array              | ⏳ PENDING  |        |
| PI-14 | 🟡 SOON | components/layout/Sidebar.tsx:49                 | Nav badge counts are fake/static                   | ⏳ PENDING  |        |
| PI-15 | 🟡 SOON | components/layout/MobileNav.tsx:11               | Mirrors same mock count approach                   | ⏳ PENDING  |        |
| PI-16 | 🟡 SOON | app/inbox/page.tsx:94                            | Broadcast send uses setTimeout simulation          | ⏳ PENDING  |        |
| PI-17 | 🟡 SOON | app/portal/[token]/page.tsx:10                   | Traveler portal loads mock data, not real DB       | ⏳ PENDING  |        |
| PI-18 | 🟡 SOON | components/payments/RazorpayModal.tsx:56,318     | Fake QR generation, simulated success/failure      | ⏳ PENDING  |        |
| PI-19 | 🔵 LATER| app/api/_handlers/reputation/                    | No real review-platform aggregation endpoint       | ⏳ PENDING  |        |
| PI-20 | 🔵 LATER| Global timezone handling                         | No TZ-aware date rendering strategy                | ⏳ PENDING  |        |
