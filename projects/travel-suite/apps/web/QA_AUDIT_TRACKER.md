# QA Audit Tracker
All flows tested, results documented in QA_RESULTS.md

| ID    | Category            | Flow / Check                                           | Result   | Notes |
|-------|---------------------|--------------------------------------------------------|----------|-------|
| QA-01 | Auth                | Signup → email confirm → onboarding → dashboard        | ⏳       |       |
| QA-02 | Auth                | Login → correct org data (not another org's)           | ⏳       |       |
| QA-03 | Proposal            | Create → send → traveler portal loads real data        | ⏳       |       |
| QA-04 | Proposal            | Traveler approves → Razorpay order created in DB       | ⏳       |       |
| QA-05 | Payment             | Payment completed → status='paid' in DB                | ⏳       |       |
| QA-06 | Payment             | Payment completed → receipt email fires                | ⏳       |       |
| QA-07 | Payment             | 24h overdue → WA reminder queued (pg_cron exists)      | ⏳       |       |
| QA-08 | WhatsApp            | Inbound message → appears in inbox (Realtime)          | ⏳       |       |
| QA-09 | WhatsApp            | Operator reply → arrives on real phone                 | ⏳       |       |
| QA-10 | WhatsApp            | Broadcast → recipients receive (not local state only)  | ⏳       |       |
| QA-11 | WhatsApp            | AI smart reply suggestion appears on thread open       | ⏳       |       |
| QA-12 | Bookings            | Create booking → appears on calendar                  | ⏳       |       |
| QA-13 | Calendar            | Block dates → proposal for those dates shows error     | ⏳       |       |
| QA-14 | Reputation          | Google Places sync → reviews appear (not mock)         | ⏳       |       |
| QA-15 | Reputation          | AI draft response → saves to reviews table             | ⏳       |       |
| QA-16 | Reputation          | Metrics (avg rating, response rate) from real DB       | ⏳       |       |
| QA-17 | Admin Charts        | Revenue chart → traces to payment_links rows           | ⏳       |       |
| QA-18 | Admin Charts        | Conversion funnel → real table counts                  | ⏳       |       |
| QA-19 | Admin Charts        | LTV widget → payment_links JOIN proposals              | ⏳       |       |
| QA-20 | Admin Charts        | Date range filter → all charts update                  | ⏳       |       |
| QA-21 | Nav Badges          | Counts from DB, update via Realtime                    | ⏳       |       |
| QA-22 | Notifications       | Booking confirmation email → operator + traveler       | ⏳       |       |
| QA-23 | Notifications       | Proposal approved email → operator                     | ⏳       |       |
| QA-24 | Notifications       | Payment receipt → traveler with correct amount         | ⏳       |       |
| QA-25 | Notifications       | Team invite → branded email (not Supabase default)     | ⏳       |       |
| QA-26 | Team Settings       | Invite member → email received → appears in list       | ⏳       |       |
| QA-27 | Delete Buttons      | Delete proposal → row gone from proposals table        | ⏳       |       |
| QA-28 | Delete Buttons      | Delete booking → row gone from bookings table          | ⏳       |       |
| QA-29 | Delete Buttons      | Remove team member → row gone from team_members table  | ⏳       |       |
| QA-30 | Delete Buttons      | Archive proposal → status updated in DB                | ⏳       |       |
| QA-31 | Billing             | Real plan tier shown (not hardcoded "starter")         | ⏳       |       |
| QA-32 | Billing             | Upgrade modal opens (not alert())                      | ⏳       |       |
| QA-33 | Billing             | Proposal limit count is real (not fake)                | ⏳       |       |
| QA-34 | Social              | Publish/schedule does not return fake IDs              | ⏳       |       |
| QA-35 | Social              | Canvas publish CTA is not toast("coming soon")         | ⏳       |       |
| QA-36 | Superadmin          | Non-superadmin cannot access /superadmin routes        | ⏳       |       |
| QA-37 | Marketplace         | Edit integration → saves to marketplace_integrations   | ⏳       |       |
| QA-38 | Portal              | /portal/[invalid-token] → 404 page (not crash)        | ⏳       |       |
