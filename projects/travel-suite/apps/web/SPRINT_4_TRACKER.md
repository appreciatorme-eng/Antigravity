# Sprint 4 Tracker — Features & Fixes
Branch: codex/sprint-4-and-audit

| ID     | Feature              | Item                                                   | Status     | Commit |
|--------|----------------------|--------------------------------------------------------|------------|--------|
| SP4-01 | Calendar Availability | Migration: operator_unavailability table + RLS         | ✅ DONE    |        |
| SP4-02 | Calendar Availability | GET/POST /api/availability route                       | ✅ DONE    |        |
| SP4-03 | Calendar Availability | "Block Dates" panel in calendar/page.tsx               | ✅ DONE    |        |
| SP4-04 | Calendar Availability | Proposal create: guard against blocked dates           | ✅ DONE    |        |
| SP4-05 | Calendar Availability | Blocked dates shown as unavailable in calendar UI      | ✅ DONE    |        |
| SP4-06 | Portal Real DB       | GET /api/portal/[token] — real trip/proposal lookup    | ✅ DONE    |        |
| SP4-07 | Portal Real DB       | portal/[token]/page.tsx fetches from DB not mock       | ✅ DONE    |        |
| SP4-08 | Portal Real DB       | 404 page for invalid/expired tokens                    | ✅ DONE    |        |
| SP4-09 | Portal Real DB       | Payment tracker in portal shows real payment_links row | ✅ DONE    |        |
| SP4-10 | WhatsApp AI Chatbot  | Inbound waha webhook pipes to channel-adapters/whatsapp| ⏳ PENDING |        |
| SP4-11 | WhatsApp AI Chatbot  | chatbot-flow.ts: state machine (new/qualifying/proposal)| ⏳ PENDING |        |
| SP4-12 | WhatsApp AI Chatbot  | Conversation state persisted in whatsapp_sessions table | ⏳ PENDING |        |
| SP4-13 | WhatsApp AI Chatbot  | Auto-reply cap: max 5 AI replies, then hand off to human| ⏳ PENDING |        |
| SP4-14 | WhatsApp AI Chatbot  | Human takeover banner in inbox when AI is active       | ⏳ PENDING |        |
| SP4-15 | Traveler PWA         | public/manifest.json with correct icons + theme_color  | ⏳ PENDING |        |
| SP4-16 | Traveler PWA         | public/sw.js: cache portal shell + offline fallback    | ⏳ PENDING |        |
| SP4-17 | Traveler PWA         | layout.tsx: manifest link + SW registration            | ⏳ PENDING |        |
| SP4-18 | Traveler PWA         | Portal: "Add to Home Screen" install prompt banner     | ⏳ PENDING |        |
