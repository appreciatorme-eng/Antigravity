# User Flow Verification Scenarios

Last updated: 2026-03-08  
Scope: `projects/travel-suite/apps/web`

Use these scenarios to verify the highest-value flows now implemented in the web stack. Each scenario includes:
- operator/traveler steps
- expected UI/system result
- direct Supabase SQL verification

## 1. WhatsApp Lead Becomes Draft Proposal

### Steps
1. Send a new inbound WhatsApp message with destination, dates, group size, and budget.
2. Wait for the chatbot to gather missing details or reach `proposal_ready`.
3. Open the inbox thread.
4. Confirm the “proposal draft ready” CTA appears.

### Expected
- chatbot session is persisted
- `proposal_ready` is reached when enough context exists
- a draft proposal with AI origin is created

### SQL
```sql
select phone, state, ai_reply_count, context, updated_at
from whatsapp_chatbot_sessions
order by updated_at desc
limit 10;

select id, title, status, proposal_origin, created_at
from proposals
where proposal_origin = 'whatsapp_ai'
order by created_at desc
limit 10;
```

## 2. Operator Opens and Sends AI-Prefilled Proposal

### Steps
1. From the inbox CTA, open the generated draft.
2. Review destination, dates, pax, and budget fields.
3. Send the proposal to the traveler.

### Expected
- draft fields are prefilled from chat context
- status moves from `draft` to `sent`
- `portal_token` exists for the proposal

### SQL
```sql
select id, title, status, sent_at, portal_token, traveler_name, total_amount
from proposals
order by updated_at desc
limit 10;
```

## 3. Traveler Approves Proposal and Gets Payment Link

### Steps
1. Open `/portal/{portal_token}` or `/p/{public_token}`.
2. Approve the proposal.
3. Watch for payment initiation UI.

### Expected
- proposal status becomes `approved`
- a `payment_links` row is created and linked to the proposal
- payment URL/token is returned to the traveler surface

### SQL
```sql
select p.id, p.status, pl.token, pl.status as payment_status, pl.amount_paise
from proposals p
left join payment_links pl on pl.proposal_id = p.id
where p.id = '<proposal_id>';
```

## 4. Payment Completion Updates Revenue State

### Steps
1. Open the public payment page.
2. Complete a Razorpay test payment.
3. Wait for verification/webhook completion.

### Expected
- `payment_links.status='paid'`
- `paid_at`, `razorpay_order_id`, and `razorpay_payment_id` are present
- revenue widgets start reflecting the transaction

### SQL
```sql
select token, status, amount_paise, paid_at, razorpay_order_id, razorpay_payment_id
from payment_links
where token = '<payment_token>';
```

## 5. Review Sync Imports Google Reviews

### Steps
1. Configure `google_place_id` in settings.
2. Click “Sync Reviews” on the reputation page.
3. Refresh the review inbox/dashboard.

### Expected
- non-mock review rows appear
- Google reviews are deduplicated on `platform_review_id`
- last sync time advances

### SQL
```sql
select platform, reviewer_name, rating, review_date, platform_review_id, created_at
from reviews
where platform = 'google'
order by created_at desc
limit 20;
```

## 6. Positive Review Generates a Marketing Asset

### Steps
1. Open an eligible 4- or 5-star review.
2. Click “Generate Social Card”.
3. Send the generated asset into the review/social workflow.

### Expected
- a rendered asset row is created
- state advances into review or scheduling workflow
- the asset references the source review

### SQL
```sql
select review_id, status, template, image_url, platform_targets, created_at
from review_marketing_assets
order by created_at desc
limit 20;
```

## 7. Shared Itinerary Cache Promotion and Reuse

### Steps
1. Generate an itinerary for a common destination.
2. Regenerate a similar request from the same or another org.
3. Compare the response source.

### Expected
- first run may miss and generate
- later run should hit org/shared/semantic cache
- cache analytics events should increment

### SQL
```sql
select destination_key, hit_count, quality_score, last_hit_at
from shared_itinerary_cache
order by last_hit_at desc
limit 20;

select event_type, cache_source, organization_id, destination_key, created_at
from shared_itinerary_cache_events
order by created_at desc
limit 50;
```

## 8. Marketplace Featured Listing Subscription

### Steps
1. Open Settings → Marketplace.
2. Choose a featured listing tier.
3. Complete or simulate checkout/verification.

### Expected
- subscription state is persisted
- marketplace profile gets the listing tier and featured flags
- discovery ranking uses the paid boost

### SQL
```sql
select mp.profile_id, mp.listing_tier, mp.is_featured, ms.status, ms.current_period_end
from marketplace_profiles mp
left join marketplace_listing_subscriptions ms on ms.profile_id = mp.profile_id
where mp.profile_id = '<profile_id>';
```

## 9. Monthly Operator Scorecard Generates and Sends

### Steps
1. Trigger the scorecard cron route manually with an org/month.
2. Inspect the created archive row.
3. Confirm email delivery attempt succeeded.

### Expected
- `operator_scorecards` row exists for the month
- payload contains computed metrics
- status transitions to `emailed` or `failed` with a reason

### SQL
```sql
select organization_id, month_key, score, status, pdf_generated_at, emailed_at, last_error
from operator_scorecards
order by created_at desc
limit 20;
```

## 10. Embedding V2 Cutover Coverage

### Steps
1. Run the admin embedding generation endpoint.
2. Trigger itinerary search and semantic cache reads.
3. Confirm no OpenAI-generated embedding path is required.

### Expected
- `embedding_v2` populated on templates
- semantic itinerary rows store `embedding_v2`
- retrieval uses `*_v2` RPCs

### SQL
```sql
select id, embedding_model, embedding_version
from tour_templates
where embedding_v2 is not null
order by embedding_updated_at desc nulls last
limit 20;

select id, destination, embedding_model, embedding_version
from itinerary_embeddings
order by created_at desc
limit 20;
```
