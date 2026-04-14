# Manual Testing Guide
Generated: 2026-03-08 | Base: commit `6e684fb` + Sprint 4 changes

## How to use this guide
Each QA item below includes:
- the manual UI steps
- the expected product outcome
- a DB or API verification step to confirm the code path wrote or read real data

Record the result for each item in `QA_RESULTS.md` as `PASS ✓`, `FAIL ✗`, or `BROKEN 🔴`.

## QA-01 — Signup → email confirm → onboarding → dashboard
1. Open `/auth`.
2. Switch to signup, enter a new operator name, email, and password, then submit.
3. Open the confirmation email and click the verification link.
4. Complete onboarding until redirected into the app shell.
Expected outcome:
- The user is redirected to `/onboarding` after confirmation and then into the dashboard after onboarding completion.
DB verify:
```sql
select id, email, organization_id, onboarding_completed
from profiles
where email = '<tester-email>';
```

## QA-02 — Login returns the correct organization data
1. Sign out.
2. Sign in as an existing operator user.
3. Open `/clients`, `/proposals`, and `/calendar`.
4. Confirm the data belongs to that operator only.
Expected outcome:
- No records from another organization appear in client, proposal, or calendar views.
DB verify:
```sql
select id, organization_id, role
from profiles
where email = '<tester-email>';
```

## QA-03 — Proposal create → send → traveler portal loads real data
1. Open `/proposals/create`.
2. Select an existing client or quick-create one.
3. Fill trip details, save the proposal, then send it.
4. Open the public portal/share link generated from the proposal.
Expected outcome:
- The portal shows the real trip name, dates, pricing, and itinerary from the saved proposal.
DB verify:
```sql
select id, title, destination, start_date, end_date, share_token
from proposals
order by created_at desc
limit 1;
```

## QA-04 — Traveler approves proposal → Razorpay order created in DB
1. Open the traveler portal link for a sent proposal.
2. Approve the proposal from the public/traveler side.
3. Inspect the approval response or portal payment section.
Expected outcome:
- A `payment_links` row is created and linked to the proposal with a non-null `razorpay_order_id`.
DB verify:
```sql
select id, proposal_id, token, razorpay_order_id, status, created_at
from payment_links
where proposal_id = '<proposal-id>'
order by created_at desc
limit 1;
```

## QA-05 — Payment completed → `payment_links.status = 'paid'`
1. Use the traveler payment UI and complete a Razorpay test payment.
2. Refresh the portal and any admin payment view.
Expected outcome:
- Payment status updates to paid and due amount drops to zero.
DB verify:
```sql
select id, status, razorpay_payment_id, paid_at
from payment_links
where token = '<payment-token>';
```

## QA-06 — Payment completed → receipt email fires
1. Complete a test payment.
2. Check the traveler inbox and operator/admin mailbox.
Expected outcome:
- A payment receipt email is sent with the correct amount, payment ID, and invoice link.
DB/API verify:
```sql
select id, status, razorpay_payment_id, paid_at
from payment_links
where token = '<payment-token>';
```
Then confirm `src/app/api/webhooks/razorpay/route.ts` triggered `sendEmail()` for the captured event.

## QA-07 — 24h overdue payment → WhatsApp reminder queued by Supabase cron
1. Create a payment link and leave it pending.
2. Backdate the row in a test environment or wait until it crosses the 24h cutoff.
3. Trigger the Supabase edge function manually if needed.
Expected outcome:
- The reminder job finds the overdue link and marks `reminder_sent_at`.
DB verify:
```sql
select id, status, created_at, reminder_sent_at
from payment_links
where status = 'pending'
order by created_at asc
limit 5;
```

## QA-08 — Inbound WhatsApp message appears in inbox via Realtime
1. Send a real inbound text to the connected WhatsApp number.
2. Keep `/inbox` open in a browser.
Expected outcome:
- The new message appears in the selected or relevant thread without a manual refresh.
DB verify:
```sql
select provider_message_id, wa_id, event_type, received_at, metadata
from whatsapp_webhook_events
order by received_at desc
limit 5;
```

## QA-09 — Operator reply arrives on a real phone
1. Open the live thread in `/inbox`.
2. Type a reply and send it.
Expected outcome:
- The message reaches the phone and the thread shows a persisted outbound event, not a local-only append.
DB verify:
```sql
select provider_message_id, wa_id, received_at, metadata
from whatsapp_webhook_events
where metadata->>'direction' = 'out'
order by received_at desc
limit 5;
```

## QA-10 — Broadcast sends to recipients, not local state only
1. Open `/inbox`, switch to the broadcast tab.
2. Select multiple recipients and send a broadcast message.
Expected outcome:
- The API returns sent/failed counts and recipients receive the message.
DB verify:
```sql
select provider_message_id, wa_id, metadata, received_at
from whatsapp_webhook_events
where metadata->>'direction' = 'out'
order by received_at desc
limit 20;
```

## QA-11 — AI smart reply suggestions appear on thread open
1. Open any WhatsApp thread in `/inbox`.
2. Wait for the smart reply chips to load under the composer.
Expected outcome:
- Exactly three suggestions appear when the suggest-reply API succeeds.
API verify:
```http
POST /api/ai/suggest-reply
```
Check that the request returns `{ "suggestions": ["...", "...", "..."] }`.

## QA-12 — Create booking → appears on calendar
1. Create a booking from the booking flow or from an itinerary/proposal workflow.
2. Open `/calendar`.
Expected outcome:
- The booking appears in the correct date slot.
DB verify:
```sql
select id, title, start_date, end_date, created_by
from bookings
order by created_at desc
limit 5;
```

## QA-13 — Blocked dates prevent a clean proposal date selection
1. Open `/calendar` and create a blocked date range.
2. Open `/proposals/create`.
3. Pick trip dates overlapping the blocked range.
Expected outcome:
- The warning UI appears and the operator must explicitly continue anyway.
DB verify:
```sql
select id, organization_id, start_date, end_date, reason
from operator_unavailability
order by created_at desc
limit 5;
```

## QA-14 — Google Places sync imports reviews
1. Save a valid Google Place ID in Settings → Integrations.
2. Open `/reputation`.
3. Click `Sync Now`.
Expected outcome:
- The sync reports imported reviews and the list shows rows from the `reviews` table, not mock data.
DB verify:
```sql
select id, platform, platform_review_id, reviewer_name, rating, review_date
from reviews
where platform = 'google'
order by created_at desc
limit 10;
```

## QA-15 — AI draft response saves to reviews table
1. Open `/reputation`.
2. Pick a review without a response.
3. Click `Draft Response`, edit the generated text if needed, then save.
Expected outcome:
- The response textarea is populated by AI and saving persists `response` + `responded_at`.
DB verify:
```sql
select id, response, responded_at
from reviews
where id = '<review-id>';
```

## QA-16 — Reputation metrics come from real DB rows
1. Open `/reputation`.
2. Compare the dashboard summary values to the current review data.
Expected outcome:
- `avgRating`, `totalReviews`, and `responseRate` match the rows in `reviews`.
DB verify:
```sql
select
  count(*) as total_reviews,
  avg(rating) as avg_rating,
  avg(case when responded_at is not null then 1 else 0 end) as response_rate
from reviews
where profile_id = '<profile-id>';
```

## QA-17 — Revenue chart traces to `payment_links`
1. Open `/admin`.
2. Note the revenue chart values for the default range.
Expected outcome:
- The chart reflects paid payment links only.
DB verify:
```sql
select date_trunc('month', paid_at) as month, sum(amount_paise) / 100.0 as revenue_inr
from payment_links
where status = 'paid'
group by 1
order by 1 desc;
```

## QA-18 — Conversion funnel uses real table counts
1. Open `/admin`.
2. Inspect the funnel widget.
Expected outcome:
- Counts match inbound WhatsApp messages, proposals, approvals, links, and paid records in range.
DB verify:
```sql
select
  (select count(*) from whatsapp_webhook_events where metadata->>'direction' = 'in') as inquiries,
  (select count(*) from proposals) as proposals,
  (select count(*) from proposals where status = 'approved') as approved,
  (select count(*) from payment_links) as links_sent,
  (select count(*) from payment_links where status = 'paid') as paid;
```

## QA-19 — LTV widget uses `payment_links JOIN proposals`
1. Open `/admin`.
2. Inspect the top customers / LTV widget.
Expected outcome:
- High-value customers are ranked from paid proposal-linked payment rows.
DB verify:
```sql
select
  p.traveler_email,
  p.traveler_name,
  count(pl.id) as bookings,
  sum(pl.amount_paise) / 100.0 as ltv_inr
from payment_links pl
join proposals p on p.id = pl.proposal_id
where pl.status = 'paid'
group by p.traveler_email, p.traveler_name
order by ltv_inr desc
limit 10;
```

## QA-20 — Date range filter updates all admin charts
1. Open `/admin`.
2. Switch the date range between Today, 7d, 30d, and 90d.
Expected outcome:
- Revenue, funnel, LTV, and destination widgets all refresh consistently.
API verify:
Check that the browser issues admin API requests with matching `from` / `to` query params.

## QA-21 — Nav badges come from DB and refresh via Realtime
1. Open the main app shell with sidebar/mobile nav visible.
2. Trigger new inbound message, pending proposal state, or review-without-response state.
Expected outcome:
- Nav badges update without a manual refresh.
DB verify:
```sql
select count(*) from whatsapp_webhook_events where metadata->>'direction' = 'in';
select count(*) from proposals where status in ('pending','sent');
select count(*) from reviews where response is null;
```

## QA-22 — Booking confirmation email reaches operator + traveler
1. Create a booking that triggers the booking confirmation path.
2. Check traveler and operator inboxes.
Expected outcome:
- Both receive the booking confirmation email.
DB/API verify:
```sql
select id, destination, start_date, end_date
from bookings
order by created_at desc
limit 1;
```
Then confirm the booking creation route calls `sendEmail()`.

## QA-23 — Proposal approved email reaches operator
1. Approve a proposal from the traveler/public side.
Expected outcome:
- Operator receives a proposal-approved notification email.
DB verify:
```sql
select id, status, approved_at
from proposals
where id = '<proposal-id>';
```

## QA-24 — Payment receipt email amount matches payment
1. Complete a payment from the traveler flow.
2. Check the traveler inbox.
Expected outcome:
- Receipt shows the same INR amount as the paid `payment_links` row.
DB verify:
```sql
select token, amount_paise, razorpay_payment_id, paid_at
from payment_links
where token = '<payment-token>';
```

## QA-25 — Team invite uses branded email
1. Open `/settings/team`.
2. Invite a new team member.
Expected outcome:
- The recipient gets the branded Antigravity invite email in addition to the auth invite flow.
DB verify:
```sql
select id, email, role, status, invited_at
from team_members
order by invited_at desc
limit 5;
```

## QA-26 — Invite member → appears in team list
1. Invite a new team member.
2. Refresh `/settings/team`.
Expected outcome:
- The invited member appears in the list with status `invited`.
DB verify:
```sql
select id, email, role, status
from team_members
where organization_id = '<organization-id>'
order by invited_at desc;
```

## QA-27 — Delete proposal removes row
1. Open `/proposals`.
2. Delete a proposal.
Expected outcome:
- The row disappears from the list and is removed or soft-deleted per route behavior.
DB verify:
```sql
select id, status
from proposals
where id = '<proposal-id>';
```

## QA-28 — Delete booking removes row
1. Open the bookings view.
2. Delete a booking.
Expected outcome:
- The booking no longer appears in the UI.
DB verify:
```sql
select id
from bookings
where id = '<booking-id>';
```

## QA-29 — Remove team member removes `team_members` row
1. Open `/settings/team`.
2. Remove a member.
Expected outcome:
- The member is no longer listed.
DB verify:
```sql
select id
from team_members
where id = '<team-member-id>';
```

## QA-30 — Archive proposal updates status in DB
1. Open `/proposals`.
2. Archive a proposal.
Expected outcome:
- The row remains in the database but status changes to the archived state.
DB verify:
```sql
select id, status, updated_at
from proposals
where id = '<proposal-id>';
```

## QA-31 — Billing page shows real plan tier
1. Open `/billing`.
Expected outcome:
- The displayed tier matches the row in the subscription table, not a hardcoded label.
DB verify:
```sql
select profile_id, plan_tier, status, current_period_end
from subscriptions
where profile_id = '<profile-id>';
```

## QA-32 — Upgrade modal opens instead of `alert()`
1. Open `/billing`.
2. Click the upgrade CTA.
Expected outcome:
- A modal or proper upgrade flow opens; there is no browser alert.
UI verify:
Trace the button to `/api/billing/subscription` or the billing upgrade modal component.

## QA-33 — Proposal limit count is real
1. Open `/proposals/create`.
2. Inspect the current usage / limit banner.
Expected outcome:
- The usage number matches the operator’s actual proposal count and plan limit.
DB verify:
```sql
select count(*) as proposal_count
from proposals
where created_by = '<profile-id>';

select plan_tier
from subscriptions
where profile_id = '<profile-id>';
```

## QA-34 — Social publish/schedule never returns fake IDs
1. Open `/social`.
2. Attempt to publish or schedule a post.
Expected outcome:
- The action returns a real scheduled-post or published-post identifier from the database, never a generated fake placeholder.
DB verify:
```sql
select id, platform, status, scheduled_for, published_at
from social_posts
order by created_at desc
limit 5;
```

## QA-35 — Canvas publish CTA is not `toast("coming soon")`
1. Open the social canvas editor.
2. Click the publish CTA.
Expected outcome:
- The UI launches the real publish flow or the honest review/scheduling flow.
UI verify:
Confirm the CTA triggers the publish modal or schedule-for-review route, not a static toast.

## QA-36 — Non-superadmin cannot access `/superadmin`
1. Log in as a normal admin or operator.
2. Open any `/superadmin/...` route.
Expected outcome:
- Access is denied or redirected.
DB verify:
```sql
select id, role
from profiles
where email = '<tester-email>';
```

## QA-37 — Marketplace edit saves to `marketplace_integrations`
1. Open `/settings/marketplace`.
2. Edit an integration and save.
Expected outcome:
- The row updates and the edit icon opens a working modal.
DB verify:
```sql
select id, platform, is_active, last_synced_at
from marketplace_integrations
where profile_id = '<profile-id>'
order by created_at desc;
```

## QA-38 — `/portal/[invalid-token]` returns a safe 404
1. Open `/portal/not-a-real-token`.
Expected outcome:
- A proper not-found / invalid-link state renders instead of a crash.
API verify:
```http
GET /api/portal/not-a-real-token
```
Expected response: `404` with a safe error payload.
