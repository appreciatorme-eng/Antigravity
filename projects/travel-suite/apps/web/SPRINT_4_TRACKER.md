# Sprint 4 Tracker — Features & Fixes
Branch: codex/sprint-4-and-audit

| ID     | Feature              | Item                                                   | Status     | Commit |
|--------|----------------------|--------------------------------------------------------|------------|--------|
| SP4-01 | Calendar Availability | Migration: operator_unavailability table + RLS         | ✅ DONE    | 5929e24 |
| SP4-02 | Calendar Availability | GET/POST /api/availability route                       | ✅ DONE    | 5929e24 |
| SP4-03 | Calendar Availability | "Block Dates" panel in calendar/page.tsx               | ✅ DONE    | 5929e24 |
| SP4-04 | Calendar Availability | Proposal create: guard against blocked dates           | ✅ DONE    | 5929e24 |
| SP4-05 | Calendar Availability | Blocked dates shown as unavailable in calendar UI      | ✅ DONE    | 5929e24 |
| SP4-06 | Portal Real DB       | GET /api/portal/[token] — real trip/proposal lookup    | ✅ DONE    | 8100088 |
| SP4-07 | Portal Real DB       | portal/[token]/page.tsx fetches from DB not mock       | ✅ DONE    | 8100088 |
| SP4-08 | Portal Real DB       | 404 page for invalid/expired tokens                    | ✅ DONE    | 8100088 |
| SP4-09 | Portal Real DB       | Payment tracker in portal shows real payment_links row | ✅ DONE    | 8100088 |
| SP4-10 | WhatsApp AI Chatbot  | Inbound waha webhook pipes to channel-adapters/whatsapp| ✅ DONE    | ca57f36 |
| SP4-11 | WhatsApp AI Chatbot  | chatbot-flow.ts: state machine (new/qualifying/proposal)| ✅ DONE    | ca57f36 |
| SP4-12 | WhatsApp AI Chatbot  | Conversation state persisted in whatsapp_sessions table | ✅ DONE    | ca57f36 |
| SP4-13 | WhatsApp AI Chatbot  | Auto-reply cap: max 5 AI replies, then hand off to human| ✅ DONE    | ca57f36 |
| SP4-14 | WhatsApp AI Chatbot  | Human takeover banner in inbox when AI is active       | ✅ DONE    | ca57f36 |
| SP4-15 | Traveler PWA         | public/manifest.json with correct icons + theme_color  | ✅ DONE    | 7c919bd |
| SP4-16 | Traveler PWA         | public/sw.js: cache portal shell + offline fallback    | ✅ DONE    | 7c919bd |
| SP4-17 | Traveler PWA         | layout.tsx: manifest link + SW registration            | ✅ DONE    | 7c919bd |
| SP4-18 | Traveler PWA         | Portal: "Add to Home Screen" install prompt banner     | ✅ DONE    | 7c919bd |

## Summary
Sprint 4 complete. 18/18 features shipped.
QA audit complete. 38/38 flows verified.
See `QA_RESULTS.md` for traced code paths and `STALE_CODE_AUDIT.md` for approval-gated cleanup items.
