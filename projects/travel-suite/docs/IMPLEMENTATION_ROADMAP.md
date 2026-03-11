# TRAVEL-SUITE — FEATURE IMPLEMENTATION ROADMAP
**Prepared**: March 2026 | **Version**: 1.0 | **Status**: Planning
**Baseline commit**: `6e684fb` (Sprint 3 final merge)

> Step-by-step implementation guide for 9 high-impact improvements.
> Each item is grounded in the actual codebase — no hand-waving.
> Follow the order within each section. Each step has a file target, DB change, and test.

---

## TABLE OF CONTENTS

1. [WhatsApp → Proposal in 60 Seconds](#1-whatsapp--proposal-in-60-seconds)
2. [Traveler Review → Marketing Asset Pipeline](#2-traveler-review--marketing-asset-pipeline)
3. [Shared Itinerary Cache Across Orgs](#3-shared-itinerary-cache-across-orgs)
4. [Pay to Feature Marketplace Listings](#4-pay-to-feature-marketplace-listings)
5. [Monthly Operator Performance Scorecard](#5-monthly-operator-performance-scorecard)
6. [Replace OpenAI Embeddings with Supabase pgvector](#6-replace-openai-embeddings-with-supabase-pgvector)
7. [12 Critical Documentation Gaps](#7-12-critical-documentation-gaps)
8. [10 User Flow Testing Scenarios](#8-10-user-flow-testing-scenarios)
9. [Priority Matrix P0→P3](#9-priority-matrix-p0p3)

---

## 1. WhatsApp → Proposal in 60 Seconds

### What It Does
When an operator is reading a WhatsApp conversation, one button opens the proposal
creator **pre-filled** with: traveler name (from contact), destination + dates
(Gemini extracts from conversation), budget estimate (if mentioned).
Collapses 15 minutes of manual work to under 60 seconds.

### Current State in Codebase
- `src/components/whatsapp/UnifiedInbox.tsx` — has `handleContextAction()` and
  `ContextActionModal.tsx` — the button UI hooks exist but use `MockQuote` data
- `src/components/whatsapp/ContextActionModal.tsx` — `MockQuote` interface is hardcoded
- `src/app/proposals/[id]/page.tsx` — proposal form accepts URL query params (unverified)
- `src/app/api/whatsapp/webhook/route.ts` — stores messages in `whatsapp_messages` table

### Step-by-Step Implementation

#### Step 1.1 — AI Extraction API Endpoint
**File**: `src/app/api/whatsapp/extract-trip-intent/route.ts` *(new)*

```typescript
// POST /api/whatsapp/extract-trip-intent
// Body: { conversationId: string }
// Returns: { destination, dates, duration_days, budget, traveler_name, phone }

// Implementation:
// 1. Load last 20 messages from whatsapp_messages WHERE conversation_id = ?
// 2. Call Gemini Flash with extraction prompt:
//    "Extract trip details from this WhatsApp conversation. Return JSON:
//     { destination, check_in, check_out, duration_days, budget_inr, traveler_name }"
// 3. Return extracted fields (null for anything not mentioned)
// Cost: ~$0.0001 per extraction (Gemini Flash)
```

**DB query needed**:
```sql
SELECT sender, content, created_at
FROM whatsapp_messages
WHERE conversation_id = $1
  AND organization_id = $2
ORDER BY created_at DESC
LIMIT 20;
```

#### Step 1.2 — Update ContextActionModal to Use Real Extraction
**File**: `src/components/whatsapp/ContextActionModal.tsx`

Replace `MockQuote` with real extraction:
```typescript
// Remove: MockQuote interface and MOCK_QUOTES array
// Add: useEffect that calls /api/whatsapp/extract-trip-intent on modal open
// Add: Loading skeleton while AI extracts
// Add: "Creating proposal..." → redirect to /proposals/new?prefill=...
```

#### Step 1.3 — Proposal Creation URL with Prefill Support
**File**: `src/app/proposals/new/page.tsx` *(or existing proposal creation page)*

Read URL search params to prefill form:
```typescript
// URL format: /proposals/new?from=whatsapp&contact_name=Rahul+Sharma
//             &phone=919876543210&destination=Goa&days=4&budget=50000
//             &conversation_id=conv_abc123

const searchParams = useSearchParams();
const prefill = {
  client_name: searchParams.get('contact_name') ?? '',
  client_phone: searchParams.get('phone') ?? '',
  destination: searchParams.get('destination') ?? '',
  duration_days: Number(searchParams.get('days')) || 0,
  budget: Number(searchParams.get('budget')) || 0,
};
// Pre-populate form fields with prefill values
// Show "Imported from WhatsApp" banner at top
```

#### Step 1.4 — "Create Proposal" Button in Inbox
**File**: `src/components/whatsapp/UnifiedInbox.tsx`

Update `handleContextAction` to trigger extraction flow:
```typescript
// In handleContextAction, case 'create-proposal':
//   1. Show inline loading spinner in button
//   2. POST /api/whatsapp/extract-trip-intent with conversationId
//   3. Build URL params from response
//   4. router.push(`/proposals/new?from=whatsapp&${params}`)
```

#### Step 1.5 — Migration: whatsapp_messages conversation_id index
**File**: `supabase/migrations/20260401000000_whatsapp_conversation_index.sql`

```sql
-- Speed up the message fetch in Step 1.1
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_org
  ON whatsapp_messages(conversation_id, organization_id, created_at DESC);
```

#### Step 1.6 — Tests
**File**: `tests/e2e/whatsapp-to-proposal.spec.ts` *(new)*

```typescript
test('WhatsApp → Proposal prefill flow', async ({ page }) => {
  // 1. Navigate to inbox with a seeded conversation
  // 2. Click conversation with "I want Goa trip, 4 days" message
  // 3. Click "Create Proposal" button
  // 4. Wait for redirect to /proposals/new
  // 5. Assert: destination field contains "Goa", days field contains "4"
});
```

### Acceptance Criteria
- [ ] Button appears in inbox thread header for every WhatsApp conversation
- [ ] AI extraction completes in <3 seconds (Gemini Flash is fast)
- [ ] Prefilled proposal form shows "From WhatsApp" source badge
- [ ] If AI extracts nothing, form opens blank (no error state)
- [ ] Extraction cost guardrail: max 100 extractions/org/day

### Effort Estimate
**3–4 days** | Backend: 1.5d | Frontend: 1.5d | Tests: 0.5d | Migration: 0.5d

---

## 2. Traveler Review → Marketing Asset Pipeline

### What It Does
When a 5-star review arrives (from portal or Google sync), automatically generate a
branded quote card using the existing Satori/Sharp social renderer and push it to
Social Studio as a draft post. Zero AI cost — template-based.

### Current State in Codebase
- `src/app/social/_components/ReviewsToInsta.tsx` — **ALREADY EXISTS**: loads reviews,
  `handleUseReview()` manually loads review into Social Studio. Auto-trigger is missing.
- `src/app/api/social/reviews/route.ts` — GET + POST endpoints exist
- `src/app/api/social/reviews/public/route.ts` — traveler portal review submission
- `src/lib/social/ai-prompts.ts` — template generation functions exist
- `src/app/social/_components/TemplateGallery.tsx` — renders layouts including review templates

### Step-by-Step Implementation

#### Step 2.1 — Database: social_posts draft insertion
**File**: `supabase/migrations/20260401010000_auto_review_social_draft.sql`

```sql
-- Add trigger source tracking to social_posts
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_review_id UUID REFERENCES reviews(id);

-- Index for finding review-sourced drafts
CREATE INDEX IF NOT EXISTS idx_social_posts_source_review
  ON social_posts(source_review_id) WHERE source = 'review_auto';
```

#### Step 2.2 — Server Action: Auto-Generate Draft Card
**File**: `src/lib/social/review-to-card.ts` *(new)*

```typescript
// generateReviewCard(reviewId: string, organizationId: string): Promise<void>
//
// Algorithm:
// 1. Fetch review + org branding (logo_url, primary_color, name)
//    FROM reviews JOIN organizations USING (organization_id)
//    WHERE reviews.id = reviewId AND rating = 5
//
// 2. Select template: "QuoteCardLayout" or "TestimonialLayout"
//    (use existing TemplateGallery templates)
//
// 3. Build templateData:
//    { quote: review.comment, reviewer: review.traveler_name,
//      stars: 5, destination: review.trip_destination,
//      companyName: org.name, primaryColor: org.primary_color }
//
// 4. INSERT INTO social_posts (organization_id, status, template_data,
//      caption, source, source_review_id, platform_targets)
//    VALUES (orgId, 'draft', templateData, autoCaption, 'review_auto', reviewId, ['instagram'])
//
// 5. Notify operator: "New marketing draft created from 5★ review!"
//    via the existing notification system
```

#### Step 2.3 — Hook Into Review Submission
**File**: `src/app/api/social/reviews/public/route.ts`

Add post-insert trigger after successful 5-star review save:
```typescript
// After successful INSERT into reviews table:
if (rating === 5) {
  // Fire-and-forget (don't block the API response)
  void generateReviewCard(insertedReview.id, organizationId)
    .catch(err => console.error('[review-pipeline] card generation failed:', err));
}
```

**File**: `src/app/api/social/reviews/route.ts` (admin review import)

Same hook for Google Places sync reviews:
```typescript
// After upsertReviews() completes, for each new 5-star review:
const fiveStarNew = upsertedReviews.filter(r => r.rating === 5 && r.is_new);
await Promise.allSettled(fiveStarNew.map(r => generateReviewCard(r.id, orgId)));
```

#### Step 2.4 — Social Studio Draft Indicator
**File**: `src/app/social/_components/TemplateGallery.tsx`

Add "Auto-generated" badge on review-sourced drafts:
```typescript
// In draft post list, if post.source === 'review_auto':
// Show: <GlassBadge color="green">⭐ Auto from Review</GlassBadge>
// Add one-click "Publish Now" alongside existing publish flow
```

#### Step 2.5 — Notification to Operator
**File**: `src/lib/social/review-to-card.ts` (add to Step 2.2)

Use existing notification queue:
```typescript
// INSERT INTO notification_queue (
//   organization_id, type, title, body, action_url
// ) VALUES (
//   orgId, 'marketing_draft_ready',
//   '⭐ New 5-star review → marketing card ready',
//   `${reviewerName} left a 5-star review. Your draft post is ready to publish.`,
//   '/social?tab=drafts'
// )
```

#### Step 2.6 — Tests
```typescript
test('5-star review creates social draft', async () => {
  // 1. POST /api/social/reviews/public with rating: 5
  // 2. Wait 500ms (fire-and-forget)
  // 3. SELECT * FROM social_posts WHERE source_review_id = insertedId
  // 4. Assert: 1 row exists with status='draft', source='review_auto'
  // 5. Assert: template_data.quote === submitted review text
});
```

### Acceptance Criteria
- [ ] 5-star review → draft appears in Social Studio within 5 seconds
- [ ] Draft has correct org branding (colors, logo, company name)
- [ ] 3-star or 4-star reviews do NOT trigger auto-draft
- [ ] Operator receives in-app notification with link to /social?tab=drafts
- [ ] Duplicate guard: same review cannot generate two drafts

### Effort Estimate
**2–3 days** | DB migration: 0.5d | Core logic: 1d | UI badge: 0.5d | Tests: 0.5d

---

## 3. Shared Itinerary Cache Across Orgs

### What It Does
Currently, a "Goa, 3 days" itinerary generated by Org A is never reused by Org B.
The cache key is `{destination, days, budget, interests}` but the result is stored
per-org. Creating a **global pool** (opt-in, quality-gated at score ≥ 0.8) pushes
cache hit rate from 60–90% toward 95%+.

### Current State in Codebase
- `src/lib/itinerary-cache.ts` — `CacheKey = {destination, days, budget?, interests?}`
- `src/lib/semantic-cache.ts` — semantic layer uses `organization_id` implicitly
- `getCachedItinerary()` / `saveItineraryToCache()` — target functions to modify
- `supabase/migrations/` — `itinerary_cache` table likely has `organization_id`

### Step-by-Step Implementation

#### Step 3.1 — New DB Table: global_itinerary_pool
**File**: `supabase/migrations/20260401020000_global_itinerary_pool.sql`

```sql
CREATE TABLE IF NOT EXISTS global_itinerary_pool (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination      TEXT NOT NULL,
  duration_days    INT  NOT NULL,
  budget_tier      TEXT,                    -- 'budget' | 'mid' | 'luxury' | null
  interests_hash   TEXT,                    -- SHA-256 of sorted interests array
  itinerary_data   JSONB NOT NULL,
  quality_score    FLOAT DEFAULT 0.8,       -- 0-1 quality rating
  usage_count      INT DEFAULT 0,
  contributed_by   UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  last_used_at     TIMESTAMPTZ DEFAULT now()
);

-- Primary lookup index
CREATE UNIQUE INDEX idx_global_pool_lookup
  ON global_itinerary_pool(destination, duration_days, budget_tier, interests_hash);

-- Hit tracking
CREATE INDEX idx_global_pool_usage ON global_itinerary_pool(usage_count DESC);

-- RLS: read access for all authenticated users, write via service role only
ALTER TABLE global_itinerary_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any authenticated can read global pool"
  ON global_itinerary_pool FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role writes pool"
  ON global_itinerary_pool FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role updates pool"
  ON global_itinerary_pool FOR UPDATE TO service_role USING (true);
```

#### Step 3.2 — Normalize Cache Keys
**File**: `src/lib/itinerary-cache.ts`

Add budget tier normalization and interests hashing:
```typescript
import { createHash } from 'crypto';

function normalizeBudgetTier(budget?: string): 'budget' | 'mid' | 'luxury' | null {
  if (!budget) return null;
  const b = budget.toLowerCase();
  if (b.includes('budget') || b.includes('cheap')) return 'budget';
  if (b.includes('luxury') || b.includes('premium')) return 'luxury';
  return 'mid';
}

function hashInterests(interests?: string[]): string | null {
  if (!interests || interests.length === 0) return null;
  const sorted = [...interests].map(i => i.toLowerCase().trim()).sort();
  return createHash('sha256').update(sorted.join('|')).digest('hex').slice(0, 16);
}
```

#### Step 3.3 — Extend getCachedItinerary() for Global Pool
**File**: `src/lib/itinerary-cache.ts`

Add global pool as Tier 0.5 (between Redis and existing DB cache):
```typescript
async function getCachedItinerary(
  destination: string,
  days: number,
  budget?: string,
  interests?: string[],
  organizationId?: string,
): Promise<CacheResult | null> {
  // Tier 0: Redis exact match (unchanged)
  const redisResult = await checkRedisCache(destination, days, budget, interests);
  if (redisResult) return { data: redisResult, source: 'redis' };

  // Tier 0.5: Global pool (NEW)
  const globalResult = await checkGlobalPool(destination, days, budget, interests);
  if (globalResult) {
    // Increment usage_count asynchronously
    void incrementGlobalPoolUsage(globalResult.id);
    // Warm Redis with this result
    void warmRedisCache(destination, days, budget, interests, globalResult.data);
    return { data: globalResult.data, source: 'global_pool' };
  }

  // Tier 1: Org-specific DB cache (unchanged)
  // Tier 2: RAG templates (unchanged)
  // Tier 3: AI generation (unchanged) → then save to BOTH org cache + global pool
}

async function checkGlobalPool(
  destination: string,
  days: number,
  budget?: string,
  interests?: string[],
): Promise<{ id: string; data: unknown } | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('global_itinerary_pool')
    .select('id, itinerary_data')
    .eq('destination', destination.toLowerCase())
    .eq('duration_days', days)
    .eq('budget_tier', normalizeBudgetTier(budget))
    .eq('interests_hash', hashInterests(interests))
    .gte('quality_score', 0.75)
    .order('usage_count', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { id: data.id, data: data.itinerary_data } : null;
}
```

#### Step 3.4 — Save to Global Pool After AI Generation
**File**: `src/lib/itinerary-cache.ts` — `saveItineraryToCache()`

After saving to org cache, also contribute to global pool:
```typescript
async function saveToGlobalPool(
  destination: string,
  days: number,
  budget: string | undefined,
  interests: string[] | undefined,
  itineraryData: unknown,
  contributedBy: string,  // organizationId
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from('global_itinerary_pool').upsert({
    destination: destination.toLowerCase(),
    duration_days: days,
    budget_tier: normalizeBudgetTier(budget),
    interests_hash: hashInterests(interests),
    itinerary_data: itineraryData,
    quality_score: 0.8,  // Default; can be updated after traveler reviews
    contributed_by: contributedBy,
  }, {
    onConflict: 'destination,duration_days,budget_tier,interests_hash',
    ignoreDuplicates: true,  // Don't overwrite; first contributor wins
  });
}
```

#### Step 3.5 — Quality Score Feedback Loop
**File**: `src/app/api/portal/[token]/review/route.ts` *(new or existing)*

When a traveler rates a trip, update the quality score:
```typescript
// After portal review submitted:
// Find the global pool entry for this destination+days combination
// UPDATE global_itinerary_pool
//   SET quality_score = (quality_score * usage_count + new_rating/5) / (usage_count + 1),
//       usage_count = usage_count + 1
// WHERE destination = trip.destination AND duration_days = trip.days
```

#### Step 3.6 — Superadmin Dashboard: Pool Stats
**File**: `src/app/superadmin/global-cache/page.tsx` *(new)*

Simple stats page:
```typescript
// Table: destination | days | hit_count | quality_score | contributed_by_org | last_used
// Summary: total pool entries, total hits served, estimated AI cost saved
// Cost saved = pool_hits * $0.006 (avg AI generation cost)
```

#### Step 3.7 — Tests
```typescript
test('global pool serves cross-org itinerary', async () => {
  // 1. Generate itinerary as Org A → verify saved to global_pool
  // 2. Request same itinerary as Org B → verify returned from global_pool
  // 3. Assert: usage_count incremented to 1
  // 4. Assert: Org B never called Gemini API
});
```

### Acceptance Criteria
- [ ] Global pool lookup adds <10ms to cache check (indexed query)
- [ ] Org-generated itineraries automatically contribute to pool after first generation
- [ ] Quality score drops below 0.6 removes entry from pool (nightly cleanup)
- [ ] Superadmin can see pool hit rate, estimated savings, top destinations
- [ ] Opt-out: `ENABLE_GLOBAL_POOL=false` env var disables contribution but still reads

### Effort Estimate
**3–4 days** | DB + migration: 1d | Cache logic: 1.5d | UI: 0.5d | Tests: 0.5d

---

## 4. Pay to Feature Marketplace Listings

### What It Does
Operators pay ₹999–2,999/month to appear at the top of marketplace search results
with a "Featured" badge. Pure DB + Razorpay work — no new infrastructure needed.

### Current State in Codebase
- `src/lib/payments/payment-service.ts` — `createSubscription()`, `PaymentService` class
- `src/lib/billing/plan-catalog.ts` — `PLAN_CATALOG`, `tierForPlan()` functions
- `src/app/api/marketplace/[id]/reviews/route.ts` — marketplace routes exist
- Marketplace listing table exists in DB (from Sprint 2)
- Razorpay subscription infrastructure fully operational

### Step-by-Step Implementation

#### Step 4.1 — DB Schema: Featured Listings
**File**: `supabase/migrations/20260401030000_marketplace_featured.sql`

```sql
-- Add featured status to marketplace listings
ALTER TABLE marketplace_integrations
  ADD COLUMN IF NOT EXISTS featured_until    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured_tier     INT DEFAULT 0,  -- 0=none, 1=basic(999), 2=pro(1999), 3=premium(2999)
  ADD COLUMN IF NOT EXISTS featured_plan_id  TEXT,
  ADD COLUMN IF NOT EXISTS featured_order    INT DEFAULT 999; -- lower = higher in results

-- Index for sorted marketplace queries
CREATE INDEX IF NOT EXISTS idx_marketplace_featured_sort
  ON marketplace_integrations(featured_order ASC, featured_until DESC NULLS LAST)
  WHERE status = 'active';

-- New table for featured billing
CREATE TABLE IF NOT EXISTS marketplace_featured_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  listing_id          UUID NOT NULL REFERENCES marketplace_integrations(id),
  razorpay_order_id   TEXT NOT NULL,
  amount_paise        INT  NOT NULL,
  tier                INT  NOT NULL,
  period_start        TIMESTAMPTZ NOT NULL,
  period_end          TIMESTAMPTZ NOT NULL,
  status              TEXT DEFAULT 'pending',  -- pending | paid | expired
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketplace_featured_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org reads own featured payments"
  ON marketplace_featured_payments FOR SELECT TO authenticated
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
```

#### Step 4.2 — Featured Tier Definitions
**File**: `src/lib/billing/featured-tiers.ts` *(new)*

```typescript
export const FEATURED_TIERS = {
  1: {
    name: 'Basic Featured',
    price_monthly_paise: 99900,    // ₹999/month
    badge: 'Featured',
    badgeColor: '#2563EB',
    position: 'top_20',
    perks: ['Featured badge', 'Top 20% placement'],
  },
  2: {
    name: 'Pro Featured',
    price_monthly_paise: 199900,   // ₹1,999/month
    badge: 'Top Pick',
    badgeColor: '#7C3AED',
    position: 'top_5',
    perks: ['Top Pick badge', 'Top 5 placement', 'Highlighted border'],
  },
  3: {
    name: 'Premium Featured',
    price_monthly_paise: 299900,   // ₹2,999/month
    badge: 'Premium',
    badgeColor: '#D97706',
    position: 'top_1',
    perks: ['Premium badge', '#1 placement', 'Homepage hero slot'],
  },
} as const;

export type FeaturedTier = keyof typeof FEATURED_TIERS;
```

#### Step 4.3 — Payment API: Create Featured Order
**File**: `src/app/api/marketplace/feature/route.ts` *(new)*

```typescript
// POST /api/marketplace/feature
// Body: { listingId: string, tier: 1 | 2 | 3, months: 1 | 3 | 6 | 12 }
// Returns: { orderId, amount, currency: 'INR' }

// Flow:
// 1. Validate operator owns this listing
// 2. Calculate amount: FEATURED_TIERS[tier].price * months (with 10% discount for 6+mo)
// 3. Create Razorpay order via razorpay.orders.create()
// 4. INSERT into marketplace_featured_payments with status='pending'
// 5. Return orderId for frontend Razorpay modal
```

#### Step 4.4 — Webhook Handler: Activate Featured Status
**File**: `src/app/api/payments/webhook/route.ts` *(extend existing)*

Add handler for featured payment confirmed:
```typescript
// In handlePaymentCaptured():
// Check if payment references a marketplace_featured_payments row
// If yes:
//   UPDATE marketplace_integrations
//     SET featured_until = now() + interval '1 month' * months,
//         featured_tier = tier,
//         featured_order = CASE tier WHEN 3 THEN 1 WHEN 2 THEN 10 WHEN 1 THEN 50 END
//     WHERE id = listingId
//
//   UPDATE marketplace_featured_payments
//     SET status = 'paid', period_start = now(),
//         period_end = now() + interval '1 month' * months
//     WHERE razorpay_order_id = orderId
```

#### Step 4.5 — Update Marketplace Search to Sort by Featured
**File**: `src/app/api/marketplace/route.ts` *(existing GET handler)*

```typescript
// Change query from:
//   .select('*').eq('status', 'active')
// To:
//   .select('*, featured_tier, featured_until, featured_order')
//   .eq('status', 'active')
//   .order('featured_order', { ascending: true })
//   .order('created_at', { ascending: false })
// Then filter: featured_until must be null OR > now() for featured sorting to apply
```

#### Step 4.6 — Featured Badge in Marketplace UI
**File**: `src/app/marketplace/page.tsx` or listing card component

```typescript
// In the listing card component, add:
{listing.featured_tier > 0 && listing.featured_until > new Date() && (
  <GlassBadge
    color={FEATURED_TIERS[listing.featured_tier].badgeColor}
    className="absolute top-2 right-2"
  >
    ⭐ {FEATURED_TIERS[listing.featured_tier].badge}
  </GlassBadge>
)}
```

#### Step 4.7 — "Boost My Listing" UI in Settings
**File**: `src/app/admin/settings/page.tsx` or new `src/app/admin/marketplace/boost/page.tsx`

```typescript
// Show 3 tier cards with:
// - Badge preview (visual)
// - Price: ₹999 / ₹1,999 / ₹2,999 per month
// - Estimated reach increase (e.g., "3x more visibility")
// - "Activate" button → triggers POST /api/marketplace/feature
// - Razorpay checkout modal (reuse existing RazorpayCheckout component)
```

#### Step 4.8 — Expiry Cron Job (pg_cron — no Vercel cron needed)
**File**: `supabase/migrations/20260401030000_marketplace_featured.sql` *(append)*

```sql
-- pg_cron: runs daily at midnight, resets expired featured listings
SELECT cron.schedule(
  'expire-featured-listings',
  '0 0 * * *',
  $$
  UPDATE marketplace_integrations
  SET featured_tier = 0, featured_order = 999, featured_plan_id = NULL
  WHERE featured_until < now() AND featured_tier > 0;
  $$
);
```

#### Step 4.9 — Revenue Tracking in Superadmin
**File**: `src/app/superadmin/page.tsx` or revenue dashboard

```sql
-- Add to superadmin revenue query:
SELECT
  SUM(amount_paise) / 100 as featured_revenue_inr,
  COUNT(*) as active_featured_listings,
  COUNT(DISTINCT organization_id) as unique_operators_featuring
FROM marketplace_featured_payments
WHERE status = 'paid' AND period_end > now();
```

### Acceptance Criteria
- [ ] Razorpay payment creates featured slot within 30 seconds of webhook
- [ ] Featured operators appear above non-featured in marketplace search
- [ ] Badge visually distinguishes Basic / Top Pick / Premium tiers
- [ ] Expiry date auto-resets listing to normal position (pg_cron)
- [ ] Superadmin sees total featured MRR + active count

### Effort Estimate
**4–5 days** | DB + migration: 1d | Payment backend: 1.5d | UI: 1.5d | Tests: 0.5d | Cron: 0.5d

---

## 5. Monthly Operator Performance Scorecard

### What It Does
On the 1st of each month, every operator gets a branded PDF scorecard via email:
proposals sent, conversion rate, average booking value, response time, review scores.
All data already exists in the DB. No new UI needed — just an email + cron.

### Current State in Codebase
- `src/lib/email.ts` — Resend email client, `hasEmailCredentials()` exists
- `src/app/api/cron/assistant-briefing/route.ts` — cron pattern to copy
- `src/app/api/invoices/send-pdf/route.ts` — PDF attachment via email exists
- `src/app/admin/gst-report/page.tsx` — `generatePDF()` with jspdf (same pattern)
- Vercel has 2 cron slots used: assistant-briefing (daily) + schedule-followups (daily)
- **Solution**: Use pg_cron + Supabase Edge Function (no Vercel cron slot consumed)

### Step-by-Step Implementation

#### Step 5.1 — DB Query: Scorecard Data
**File**: `supabase/functions/monthly-scorecard/data-query.sql` *(reference, not deployed)*

```sql
-- All metrics for one operator for the past month
WITH
org_data AS (
  SELECT o.id, o.name, p.email, p.full_name
  FROM organizations o
  JOIN profiles p ON p.organization_id = o.id AND p.role = 'admin'
  WHERE o.id = $1
),
proposal_metrics AS (
  SELECT
    COUNT(*) as proposals_sent,
    COUNT(*) FILTER (WHERE status IN ('approved','paid')) as proposals_converted,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('approved','paid')) / NULLIF(COUNT(*),0), 1)
      as conversion_rate_pct,
    COALESCE(AVG(total_amount) FILTER (WHERE status = 'paid'), 0) as avg_booking_value
  FROM proposals
  WHERE organization_id = $1
    AND created_at >= date_trunc('month', now() - interval '1 month')
    AND created_at < date_trunc('month', now())
),
payment_metrics AS (
  SELECT
    SUM(amount_paise) / 100 as total_revenue_inr,
    COUNT(*) as bookings_completed
  FROM payment_links
  WHERE organization_id = $1
    AND status = 'paid'
    AND paid_at >= date_trunc('month', now() - interval '1 month')
    AND paid_at < date_trunc('month', now())
),
review_metrics AS (
  SELECT
    ROUND(AVG(rating), 1) as avg_rating,
    COUNT(*) as review_count,
    COUNT(*) FILTER (WHERE rating = 5) as five_star_count
  FROM reviews
  WHERE organization_id = $1
    AND created_at >= date_trunc('month', now() - interval '1 month')
),
whatsapp_metrics AS (
  SELECT
    AVG(EXTRACT(EPOCH FROM (first_reply_at - received_at))/60) as avg_response_min
  FROM whatsapp_conversations
  WHERE organization_id = $1
    AND received_at >= date_trunc('month', now() - interval '1 month')
)
SELECT * FROM org_data, proposal_metrics, payment_metrics, review_metrics, whatsapp_metrics;
```

#### Step 5.2 — Scorecard PDF Builder
**File**: `supabase/functions/monthly-scorecard/pdf-builder.ts` *(new)*

Uses the same jspdf pattern from `gst-report/page.tsx`:
```typescript
// generateScorecardPDF(data: ScorecardData): Buffer
//
// PDF sections:
// Header: Logo + "Performance Report — [Month Year]" + operator name
//
// Section 1 — Bookings Overview (3 KPI boxes):
//   Total Revenue: ₹1,23,456  |  Conversion Rate: 42%  |  Bookings: 8
//
// Section 2 — Proposals:
//   Sent: 19  |  Converted: 8  |  Avg Booking Value: ₹15,432
//
// Section 3 — Customer Satisfaction:
//   Average Rating: ⭐ 4.7  |  Reviews Received: 6  |  5-Star Reviews: 4
//
// Section 4 — Responsiveness:
//   Avg WhatsApp Response Time: 23 minutes
//
// Section 5 — Month-over-Month trend (simple text comparison, no charts)
//   Revenue ▲ 23% vs last month  |  Conversion ▼ 3% vs last month
//
// Footer: "Powered by [Platform Name]" + "Reply to this email to speak with support"
//
// Returns: Buffer (PDF binary)
```

#### Step 5.3 — Supabase Edge Function
**File**: `supabase/functions/monthly-scorecard/index.ts` *(new)*

```typescript
// Triggered by pg_cron on 1st of each month at 9:00 AM IST (3:30 UTC)
//
// Algorithm:
// 1. Fetch all active organizations with at least 1 proposal in the past month
// 2. For each org (in batches of 10):
//    a. Run the scorecard SQL query
//    b. Generate PDF buffer
//    c. Resend email with PDF attachment to org admin email
//    d. Log delivery status to scorecard_deliveries table
//
// Error handling:
// - Failed PDF: log to scorecard_deliveries with error, continue to next org
// - Failed email: retry once after 30s, then log failure
// - Rate limit: Resend allows 100 emails/day on free tier; batch accordingly

Deno.serve(async (req: Request) => {
  // Verify pg_cron auth header
  const secret = Deno.env.get('CRON_SECRET');
  if (req.headers.get('x-cron-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... implementation
});
```

#### Step 5.4 — Delivery Tracking Table
**File**: `supabase/migrations/20260401040000_scorecard_deliveries.sql`

```sql
CREATE TABLE IF NOT EXISTS scorecard_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  period_month    TEXT NOT NULL,   -- '2026-03'
  delivered_at    TIMESTAMPTZ,
  email_to        TEXT NOT NULL,
  resend_id       TEXT,            -- Resend message ID for delivery tracking
  status          TEXT DEFAULT 'pending',  -- pending | sent | failed
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate delivery for same org + month
CREATE UNIQUE INDEX idx_scorecard_delivery_unique
  ON scorecard_deliveries(organization_id, period_month);
```

#### Step 5.5 — pg_cron Schedule (Monthly)
**File**: `supabase/migrations/20260401040000_scorecard_deliveries.sql` *(append)*

```sql
-- Run on 1st of every month at 3:30 UTC (9:00 AM IST)
SELECT cron.schedule(
  'monthly-operator-scorecard',
  '30 3 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('app.supabase_project_ref') ||
           '.supabase.co/functions/v1/monthly-scorecard',
    headers := '{"x-cron-secret": "' || current_setting('app.cron_secret') || '"}',
    body := '{}'
  );
  $$
);
```

#### Step 5.6 — Email Template
**File**: `src/lib/emails/MonthlyScorecard.tsx` *(React Email component)*

```typescript
// Subject: "Your [March 2026] Performance Report is here 📊"
// Preview: "You converted 42% of proposals last month — here's your full breakdown"
//
// Body sections:
// 1. Hero: "Great month, [Name]! Here's your March 2026 report." (personalized)
// 2. Top KPI highlight: "Your revenue grew 23% vs February" (or declined, with tips)
// 3. "Your full report is attached as a PDF"
// 4. CTA button: "View Dashboard" → /dashboard
// 5. Footer: unsubscribe link (manage in /settings/notifications)
```

#### Step 5.7 — Tests
```typescript
test('scorecard generated for org with activity', async () => {
  // Seed: 1 org, 5 proposals (3 paid), 2 reviews (avg 4.5)
  // Invoke edge function with test cron secret
  // Assert: scorecard_deliveries row created with status='sent'
  // Assert: Resend mock called with PDF attachment
});

test('scorecard skipped for org with zero activity', async () => {
  // Org with no proposals last month
  // Assert: scorecard_deliveries row NOT created
});
```

### Acceptance Criteria
- [ ] PDF delivered to every active operator by 9:00 AM IST on the 1st
- [ ] PDF shows previous month's data (not current month in progress)
- [ ] Operators with zero activity that month: skip (no email)
- [ ] Resend delivery status tracked in `scorecard_deliveries` table
- [ ] Superadmin can trigger a manual scorecard run for testing
- [ ] No Vercel cron slot consumed (uses pg_cron + Edge Function)

### Effort Estimate
**4–5 days** | SQL query: 0.5d | PDF builder: 1.5d | Edge function: 1d | Email template: 0.5d | Tests: 0.5d | Migration: 0.5d

---

## 6. Replace OpenAI Embeddings with Supabase pgvector

### What It Does
Replace `text-embedding-3-small` OpenAI API calls with Supabase's built-in
vector embedding generation (using `gte-small` model, hosted by Supabase).
Result: eliminates OpenAI dependency for embeddings, saves $1–3/month,
reduces external API calls by ~40%.

### Current State in Codebase
- `src/lib/embeddings.ts` — `generateEmbedding()` calls OpenAI `text-embedding-3-small`
- `src/lib/semantic-cache.ts` — `getEmbedding()` also calls OpenAI directly
- `src/lib/assistant/semantic-response-cache.ts` — `getEmbedding()` third copy
- All three call the same OpenAI API — this should be one shared function

### Step-by-Step Implementation

#### Step 6.1 — Enable Supabase AI Extension
In your Supabase project SQL Editor:
```sql
-- Enable the AI extension (may already be enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Supabase AI embedding function (available in Supabase projects automatically)
-- Test it works:
SELECT ai.embed('gte-small', 'test text');
-- Should return a vector (384 dimensions for gte-small vs 1536 for OpenAI)
```

**CRITICAL**: `gte-small` produces **384-dimension** vectors. OpenAI `text-embedding-3-small`
produces **1536-dimension** vectors. You MUST re-embed all existing data.

#### Step 6.2 — Migration: Resize Embedding Columns
**File**: `supabase/migrations/20260401050000_resize_embeddings_384.sql`

```sql
-- Find all columns that store embeddings (likely VECTOR(1536))
-- Check actual column names first:
SELECT table_name, column_name, udt_name
FROM information_schema.columns
WHERE udt_name LIKE 'vector%';

-- Then resize each column:
ALTER TABLE itinerary_cache
  ALTER COLUMN embedding TYPE VECTOR(384)
  USING NULL;  -- NULL out existing — they'll be re-embedded

ALTER TABLE tour_templates
  ALTER COLUMN embedding TYPE VECTOR(384)
  USING NULL;

ALTER TABLE semantic_cache  -- (whatever the table is named)
  ALTER COLUMN embedding TYPE VECTOR(384)
  USING NULL;

-- Recreate indexes (HNSW works with any dimension)
DROP INDEX IF EXISTS idx_itinerary_cache_embedding;
CREATE INDEX idx_itinerary_cache_embedding
  ON itinerary_cache USING hnsw (embedding vector_cosine_ops);
```

#### Step 6.3 — New Unified Embedding Function
**File**: `src/lib/embeddings.ts` *(replace existing)*

```typescript
import "server-only";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Generate a 384-dimension embedding using Supabase AI (gte-small model).
 * Zero cost — included in Supabase project.
 * Falls back to null if Supabase AI is unavailable (graceful degradation).
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ input: text }),
    });
    if (!response.ok) return null;
    const { embedding } = await response.json();
    return embedding as number[];
  } catch {
    return null;  // Graceful degradation — cache miss is acceptable
  }
}
```

#### Step 6.4 — Supabase Edge Function: embed
**File**: `supabase/functions/embed/index.ts` *(new)*

```typescript
// This Edge Function wraps the Supabase AI model
// so the Next.js app can call it without needing the Supabase client's AI module

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const { input } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  // Use Supabase's built-in AI inference
  const { data } = await supabase.functions.invoke('ai', {
    body: { model: 'gte-small', input },
  });
  return Response.json({ embedding: data.embedding });
});
```

#### Step 6.5 — Update All Callers
**File**: `src/lib/semantic-cache.ts` — remove duplicate `getEmbedding()`, import shared one
**File**: `src/lib/assistant/semantic-response-cache.ts` — same

```typescript
// Before (both files):
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function getEmbedding(text: string) { ... openai.embeddings.create() ... }

// After (both files):
import { generateEmbedding } from '@/lib/embeddings';
// Use generateEmbedding() directly — one source of truth
```

#### Step 6.6 — Re-embed All Existing Data (One-Time Script)
**File**: `scripts/reembed-all.ts` *(new, run once)*

```typescript
// npx tsx scripts/reembed-all.ts
//
// 1. SELECT id, content FROM tour_templates WHERE embedding IS NULL
// 2. For each row: embedding = await generateEmbedding(content)
// 3. UPDATE tour_templates SET embedding = embedding WHERE id = id
// 4. Rate limit: 100ms delay between calls (Supabase AI has limits)
// 5. Log progress: "Embedded 45/120 templates..."
//
// Same for itinerary_cache, semantic_cache tables
```

#### Step 6.7 — Remove OpenAI Dependency
After confirming embeddings work:
```bash
# Only remove if OpenAI is NOT used for anything else
# Check: grep -r "openai" src/ --include="*.ts" --include="*.tsx" | grep -v embeddings
# If openai package is only used for embeddings:
npm uninstall openai
# Remove OPENAI_API_KEY from .env.example and Vercel env vars
```

#### Step 6.8 — Tests
```typescript
test('generateEmbedding returns 384-dim vector', async () => {
  const embedding = await generateEmbedding('Goa beach trip 3 days');
  expect(embedding).toHaveLength(384);
  expect(typeof embedding[0]).toBe('number');
});

test('semantic cache works with new embeddings', async () => {
  await saveSemanticMatch('goa trip 3 days budget', 'Goa', 3, mockItinerary);
  const match = await getSemanticMatch('goa 3 days cheap trip', 'Goa', 3);
  expect(match).not.toBeNull();  // Should still find similar query
});
```

### Acceptance Criteria
- [ ] `generateEmbedding()` returns `number[]` without calling OpenAI API
- [ ] All existing embedding columns resized to 384 dimensions
- [ ] Semantic search still returns correct results after re-embedding
- [ ] `openai` npm package removed from `package.json` (if embeddings was only use)
- [ ] `OPENAI_API_KEY` removed from required env vars

### Effort Estimate
**2–3 days** | Migration: 0.5d | Edge function: 0.5d | Code changes: 0.5d | Re-embed script: 0.5d | Tests + verification: 0.5d

---

## 7. 12 Critical Documentation Gaps

### Priority Order and What to Write

For each document, the content outline is provided so it can be written without reading
the codebase — the author just needs to confirm values in each section.

---

### Doc 1 — `docs/API_REFERENCE.md` 🔴 CRITICAL
**Why**: 222 routes, zero specification. Contractors and mobile devs can't integrate.
**Time**: 4 hours

**Template**:
```markdown
# API Reference

## Authentication
All endpoints require `Authorization: Bearer <supabase-jwt>` except:
- POST /api/social/reviews/public (traveler portal — uses token auth)
- POST /api/webhooks/razorpay (webhook — uses HMAC signature)
- POST /api/webhooks/whatsapp (webhook — uses HMAC signature)

## Endpoints

### Proposals
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/proposals | admin | List all proposals for org |
| POST | /api/proposals | admin | Create new proposal |
| GET | /api/proposals/[id] | admin | Get single proposal |
| PATCH | /api/proposals/[id] | admin | Update proposal |
| DELETE | /api/proposals/[id] | admin | Delete proposal |
| POST | /api/proposals/[id]/send | admin | Send proposal to traveler |
| POST | /api/proposals/send-pdf | admin | Email proposal as PDF |

### Payments
... (continue for all 222 routes grouped by domain)
```

---

### Doc 2 — `docs/ENV_REFERENCE.md` 🔴 CRITICAL
**Why**: Wrong env = broken deployment. `.env.example` exists but is not annotated.
**Time**: 2 hours

**Template for each var**:
```markdown
### RAZORPAY_KEY_ID
- **Type**: String (required in production)
- **Format**: `rzp_live_XXXX` (live) or `rzp_test_XXXX` (test)
- **Where to get**: Razorpay Dashboard → Settings → API Keys
- **Used in**: `src/lib/payments/razorpay.ts`, `src/app/billing/page.tsx`
- **If missing**: Payment creation fails silently; invoices cannot be generated
- **Warning**: Use `rzp_live_` ONLY in Vercel Production environment

### ENABLE_MOCK_ENDPOINTS
- **Type**: Boolean string ('true' | 'false')
- **Default**: undefined (treated as false)
- **MUST BE**: `false` in Vercel Production and Preview environments
- **Risk**: If `true` in production, payments return fake success — operators lose money
```

---

### Doc 3 — `docs/ROUTE_PROTECTION.md` 🔴 CRITICAL
**Why**: Security regression risk when adding new routes without knowing the pattern.
**Time**: 2 hours

**Template**:
```markdown
# Route Protection Map

## Protection Levels
1. **Public** — No authentication required
2. **Authenticated** — Any logged-in user
3. **Admin** — `requireAdmin()` check (org admin role)
4. **Superadmin** — `requireSuperAdmin()` check
5. **Webhook** — HMAC signature verification (no JWT)
6. **Cron** — HMAC-signed cron secret

## How to Protect a New Route
```typescript
// Admin-protected route:
import { requireAdmin } from '@/lib/auth/admin';
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;
  // ... your handler
}
```

## Route Table
| Path Pattern | Protection Level | Notes |
|---|---|---|
| /api/proposals/* | Admin | Multi-tenant: org_id from JWT |
| /api/payments/webhook | Webhook | x-razorpay-signature HMAC |
| /api/cron/* | Cron | x-cron-secret + HMAC |
| /api/superadmin/* | Superadmin | is_superadmin flag in profiles |
| /api/social/reviews/public | Public | Rate limited (5/min per IP) |
| /portal/[token] | Token-based | token param in URL |
```

---

### Doc 4 — `docs/INCIDENT_RESPONSE.md` 🔴 CRITICAL
**Why**: First incident will be chaotic without a runbook.
**Time**: 3 hours

**Sections**:
```markdown
# Incident Response Runbook

## Severity Levels
- P0: Revenue impacted (payments failing, portal down)
- P1: Feature impacted (WhatsApp down, AI failing)
- P2: Degraded performance (slow loads, cache misses)

## P0 Scenarios

### Scenario 1: Payments Failing
Symptoms: Razorpay webhook not updating payment_links status
Diagnosis:
  1. Check Vercel function logs for /api/payments/webhook errors
  2. Check Razorpay Dashboard → Webhooks → Recent deliveries
  3. Check: SELECT * FROM payment_links WHERE status='pending' AND created_at > now()-interval'1h'
Fix: Re-trigger webhook from Razorpay dashboard (retry button)
Escalation: contact@razorpay.com if Razorpay-side issue

### Scenario 2: Supabase DB Down
... etc for WPPConnect, Vercel, Resend
```

---

### Doc 5 — `docs/ERROR_HANDLING.md`
**Why**: Inconsistent error responses across 222 routes confuse clients.
**Time**: 1 hour

**Conventions to document**:
```typescript
// Standard API error response shape:
{ success: false, error: 'Human-readable message', code: 'MACHINE_CODE' }

// Standard HTTP status codes used:
// 400 — Bad request (validation failure)
// 401 — Not authenticated (no JWT)
// 403 — Not authorized (wrong role / wrong org)
// 404 — Resource not found
// 429 — Rate limited
// 500 — Internal server error (never expose stack traces)
```

---

### Doc 6 — `docs/DATA_PRIVACY.md`
**Why**: India PDPB 2023 compliance. What data is stored, how long, how deleted.
**Time**: 2 hours

**Sections**: Personal data inventory, retention periods per table, data deletion
workflow (what happens when operator deletes account), traveler data rights,
third-party data sharing (Razorpay, Resend, Google Places).

---

### Doc 7 — `docs/GLASS_UI_COMPONENTS.md`
**Why**: Every feature uses GlassCard/Button/Modal/Badge but there's no spec.
**Time**: 2 hours

**For each component**:
```markdown
### GlassCard
Props: className?, children, hoverable?
Usage: <GlassCard className="p-6">content</GlassCard>
Do NOT: set background directly — use glass-morphism classes
Example: every dashboard widget
```

---

### Doc 8 — `docs/PERFORMANCE_BUDGET.md`
**Why**: No baseline = no way to detect regressions.
**Time**: 1 hour

**Targets per page**:
```markdown
| Page | LCP Target | CLS Target | FID Target | Notes |
|---|---|---|---|---|
| /dashboard | <2.5s | <0.1 | <100ms | Many widgets |
| /proposals | <2.0s | <0.1 | <100ms | Table load |
| /portal/[token] | <1.5s | <0.05 | <50ms | Traveler-facing |
| /admin/trips/[id] | <3.0s | <0.1 | <100ms | Complex editor |
```

---

### Doc 9 — `docs/WHATSAPP_CHATBOT_GUIDE.md`
**Why**: Sprint 4 adds chatbot state machine — team won't know how to configure it.
**Time**: 2 hours

**Sections**: State machine diagram (new → qualifying → proposal_ready → handed_off),
how to configure triggers, how to override AI responses, how to test chatbot without
a real WhatsApp number.

---

### Doc 10 — `docs/RELEASE_NOTES.md`
**Why**: Operators and the team need to know what changed.
**Time**: 1 hour

```markdown
# Release Notes

## Sprint 3 (March 2026) — Score 68/100
### Added
- Razorpay payment links with HMAC webhook verification
- React Email templates (proposal, invoice, welcome, team invite)
- Rate limiting on all AI endpoints (5 req/min via Upstash)
- ...

## Sprint 2 (February 2026)
...
```

---

### Doc 11 — Archive `historical/` subfolder
**Files to move** (DO NOT DELETE, just move):
```bash
mkdir -p docs/historical
git mv docs/PHASE_1_COMPLETION.md docs/historical/
git mv docs/PHASE_2_COMPLETION.md docs/historical/
git mv docs/PHASE_3_COMPLETION.md docs/historical/
git mv docs/PHASE_4_COMPLETION.md docs/historical/
git mv docs/PHASE_5_COMPLETION.md docs/historical/
git mv AUDIT-PLAN.md docs/historical/
git mv REMEDIATION_TRACKER.md docs/historical/
git mv docs/2026-02-26-*.md docs/historical/
```

---

### Doc 12 — Update `DEPLOYMENT_GUIDE.md`
**Add these missing sections**:
```markdown
## New Environment Variables (Sprint 3)
- RAZORPAY_WEBHOOK_SECRET — from Razorpay Dashboard → Webhooks
- RESEND_API_KEY — from resend.com → API Keys
- NEXT_PUBLIC_SENTRY_DSN — from Sentry project settings
- NEXT_PUBLIC_POSTHOG_KEY — from PostHog project settings
- WPPCONNECT_TOKEN — generated by WPPConnect /api/token endpoint

## Supabase Edge Functions (NEW — must deploy manually)
\`\`\`bash
supabase functions deploy payment-reminders --project-ref YOUR_REF
supabase functions deploy monthly-scorecard --project-ref YOUR_REF
supabase secrets set RESEND_API_KEY=re_xxx --project-ref YOUR_REF
\`\`\`

## pg_cron Setup (NEW — paste in Supabase SQL Editor)
[paste the pg_cron SQL from each migration file here]
```

---

## 8. 10 User Flow Testing Scenarios

### How to Use This Section
Each flow below has:
- **Pre-conditions**: what must be true before you start
- **Steps**: exact UI actions to take
- **DB Verification**: SQL to run in Supabase SQL Editor to confirm it worked
- **Pass/Fail Criteria**: what success looks like

---

### Flow 1: Complete Booking Lifecycle (45 minutes)
**Pre-conditions**: Resend DNS verified, Razorpay live keys in Vercel, WPPConnect session active

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Sign up with a new email address | Confirmation email received within 60 seconds |
| 2 | Complete onboarding wizard (all 4 steps) | Redirected to dashboard, welcome email received |
| 3 | Create a tour template (any destination) | Template appears in template list |
| 4 | Create a proposal from the template | Proposal row created in DB |
| 5 | Click "Send Proposal" | Traveler email arrives within 2 minutes |
| 6 | Open the portal URL from the email | **Real trip data shows — NOT mock data** |
| 7 | Approve the proposal as traveler | Payment link created |
| 8 | Complete Razorpay test payment (card: `4111 1111 1111 1111`) | Receipt email arrives |

**DB Verification**:
```sql
-- Check proposal status
SELECT id, status, client_email, total_amount
FROM proposals
ORDER BY created_at DESC LIMIT 1;
-- Expected: status = 'paid' or 'approved'

-- Check payment link
SELECT status, amount_paise, paid_at, razorpay_order_id
FROM payment_links
ORDER BY created_at DESC LIMIT 1;
-- Expected: status = 'paid', paid_at IS NOT NULL

-- Check Razorpay webhook fired
SELECT * FROM payment_links
WHERE updated_at > now() - interval '5 minutes'
  AND status = 'paid';
-- Expected: 1 row, updated_at close to paid_at (webhook fired promptly)
```

---

### Flow 2: WhatsApp Inquiry → Reply (20 minutes)
**Pre-conditions**: WPPConnect session active on Fly.io, connected number different from admin

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Send "I want to book a Goa trip" to connected WhatsApp | Message appears in Unified Inbox <10s |
| 2 | Click the conversation in inbox | Full message thread visible |
| 3 | Type a reply and press Send | Reply arrives on test phone within 5 seconds |
| 4 | Check nav badge | Badge count reflects unread count |
| 5 | Click "Create Proposal" from inbox | Redirected to proposal form with Goa pre-filled |

**DB Verification**:
```sql
SELECT sender, content, direction, created_at
FROM whatsapp_messages
ORDER BY created_at DESC LIMIT 5;
-- Expected: 'inbound' message from test number, 'outbound' reply from operator

SELECT COUNT(*) as unread_count
FROM whatsapp_messages
WHERE read_at IS NULL AND direction = 'inbound'
  AND organization_id = 'YOUR_ORG_ID';
-- Expected: matches badge count in nav
```

---

### Flow 3: Delete Button Audit (15 minutes)
**For each item: note ID → click delete → verify DB row is gone**

| Entity | How to Delete | DB Verification |
|--------|--------------|-----------------|
| Proposal | Proposals list → delete icon | `SELECT id FROM proposals WHERE id = 'noted_id'` → 0 rows |
| Team Member | Settings → Team → Remove | `SELECT id FROM team_members WHERE profile_id = 'noted_id'` → 0 rows |
| Payment Link | Payment links list → cancel | `SELECT status FROM payment_links WHERE id = 'noted_id'` → status = 'cancelled' |
| Tour Template | Templates → delete | `SELECT id FROM tour_templates WHERE id = 'noted_id'` → 0 rows |

**PASS**: DB row removed / status updated on every delete action
**FAIL**: Row still exists in DB after UI shows success — indicates soft delete bug

---

### Flow 4: Revenue Chart Accuracy (20 minutes)
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Note the revenue chart value for current month | Write down the ₹ amount shown |
| 2 | Run SQL query (below) | Calculate expected value |
| 3 | Compare | Within ₹1 of each other |

```sql
-- Expected monthly revenue
SELECT
  SUM(amount_paise) / 100.0 as revenue_inr,
  COUNT(*) as payment_count
FROM payment_links
WHERE status = 'paid'
  AND date_trunc('month', paid_at) = date_trunc('month', now());

-- Expected conversion funnel (for funnel chart accuracy)
SELECT
  COUNT(*) FILTER (WHERE status IN ('sent','approved','paid')) as proposals_sent,
  COUNT(*) FILTER (WHERE status IN ('approved','paid')) as proposals_approved,
  COUNT(*) FILTER (WHERE status = 'paid') as proposals_paid
FROM proposals
WHERE date_trunc('month', created_at) = date_trunc('month', now());
```

**PASS**: UI values match SQL output exactly (or within floating point rounding)
**FAIL**: Values differ → indicates chart query is wrong or uses mock data

---

### Flow 5: Reputation / Reviews (15 minutes)
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Go to /reputation page | Reviews show — NOT mock data |
| 2 | Verify review count matches DB | SQL query below |
| 3 | Click "Draft AI Response" on one review | AI-generated text populates textarea |
| 4 | Save response | `reviews.response` updated in Supabase |
| 5 | If Google Places configured: click "Sync Now" | Review count changes |

```sql
SELECT COUNT(*) as review_count, ROUND(AVG(rating), 1) as avg_rating
FROM reviews
WHERE organization_id = 'YOUR_ORG_ID';
-- Must match UI values on /reputation page
```

---

### Flow 6: Team Member Lifecycle (15 minutes)
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Invite team member (Settings → Team) | Invite email arrives |
| 2 | Accept invite (open email → click link) | Member appears in team list |
| 3 | Change role to Admin | `team_members.role = 'admin'` in DB |
| 4 | Remove member | Row deleted from `team_members` |

```sql
-- After step 2:
SELECT profile_id, role, joined_at
FROM team_members
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY joined_at DESC LIMIT 1;

-- After step 4:
SELECT COUNT(*) FROM team_members WHERE profile_id = 'removed_profile_id';
-- Expected: 0
```

---

### Flow 7: Billing Page Accuracy (10 minutes)
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Visit /billing page | Plan tier shown is NOT hardcoded 'starter' |
| 2 | Run SQL below | DB plan tier matches UI |
| 3 | Check proposal limit counter | Matches DB value |

```sql
SELECT plan_tier, proposals_used, proposals_limit, status
FROM subscriptions
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC LIMIT 1;
-- UI must show same plan_tier and usage numbers
```

---

### Flow 8: Security Boundary Testing (10 minutes)
| # | Action | Expected Behavior |
|---|--------|------------------|
| 1 | Incognito → visit /admin | Redirect to /login |
| 2 | Incognito → GET /api/proposals | `401 Unauthorized` |
| 3 | Incognito → GET /api/superadmin/users | `401 Unauthorized` |
| 4 | Logged in as non-admin → GET /api/admin/revenue | `403 Forbidden` |
| 5 | POST /api/webhooks/razorpay without signature | `400 Bad Request` |

```bash
# Test from terminal:
curl -s https://your-app.vercel.app/api/proposals | jq .
# Expected: {"error":"Unauthorized"} or similar

curl -s -X POST https://your-app.vercel.app/api/webhooks/razorpay \
  -H "Content-Type: application/json" -d '{}' | jq .
# Expected: {"error":"Invalid signature"} or similar
```

---

### Flow 9: Calendar Availability Blocking (10 minutes)
*(Sprint 4 feature — test after SP4-01 to SP4-05 complete)*
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Block Dec 25–31 in Calendar | `operator_unavailability` row created in DB |
| 2 | Create proposal for Dec 27 trip | Warning or block appears |
| 3 | Remove block | DB row deleted |

```sql
SELECT start_date, end_date, reason
FROM operator_unavailability
WHERE organization_id = 'YOUR_ORG_ID';
-- Must have a row for Dec 25–31 after step 1
-- Must have 0 rows after step 3
```

---

### Flow 10: AI Itinerary Cache Verification (10 minutes)
| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Generate itinerary for "Goa, 3 days, budget" | Takes 3–8 seconds (AI generation) |
| 2 | Generate SAME itinerary again | Takes <500ms (cache hit) |
| 3 | Generate "Goa, 3 days, budget" from DIFFERENT org | Takes <500ms if global pool enabled |

```sql
-- Check cache populated
SELECT destination, duration_days, budget_tier, created_at
FROM itinerary_cache
WHERE destination ILIKE '%goa%' AND duration_days = 3
ORDER BY created_at DESC LIMIT 3;

-- Check global pool (after Feature 3 is implemented)
SELECT destination, duration_days, usage_count, contributed_by
FROM global_itinerary_pool
WHERE destination ILIKE '%goa%';
```

---

## 9. Priority Matrix P0→P3

### Legend
- **Owner**: Dev (developer), Ops (operations/DevOps), QA (quality assurance)
- **Blocking**: what this item is waiting on before it can start
- **Score Impact**: estimated improvement to the 68/100 go-live readiness score

| Priority | Action | Owner | Time Est. | Blocks | Score Impact |
|----------|--------|-------|-----------|--------|-------------|
| **P0** | Run `scripts/post-merge.sh` (3 migrations) | Ops | 10 min | Sprint 4, go-live | +5 (RLS coverage) |
| **P0** | Set `ENABLE_MOCK_ENDPOINTS=false` in Vercel | Ops | 5 min | Go-live | +5 (payment safety) |
| **P0** | Fix portal `[token]` → real DB (Sprint 4 SP4-06–09) | Dev | 2 days | Go-live | +8 (portal 20→90) |
| **P0** | Wire GST report to real `payment_links` data | Dev | 4 hours | Go-live | +3 (legal risk) |
| **P0** | Replace `Math.random()` with `crypto.randomUUID()` | Dev | 1 hour | Go-live | +2 (security) |
| **P0** | Confirm Razorpay live keys in Vercel production | Ops | 10 min | Go-live | Required |
| **P0** | Rotate Supabase service-role key | Ops | 10 min | Go-live | Required |
| **P1** | Deploy payment-reminders Edge Function | Ops | 30 min | After P0 migrations | +2 |
| **P1** | Set all Sprint 3 env vars in Vercel | Ops | 30 min | Go-live | Required |
| **P1** | Test ₹1 end-to-end payment in production | QA | 30 min | After P0+P1 | Confidence |
| **P1** | Enable Sentry (set NEXT_PUBLIC_SENTRY_DSN) | Ops | 10 min | Observability | +2 |
| **P1** | Enable PostHog (set NEXT_PUBLIC_POSTHOG_KEY) | Ops | 10 min | Analytics | +2 |
| **P1** | WPPConnect session active on Fly.io | Ops | 30 min | WhatsApp features | Required |
| **P1** | Verify Resend domain + DNS records | Ops | 30 min | Email delivery | Required |
| **P2** | **Feature 1**: WhatsApp → Proposal in 60 Seconds | Dev | 3–4 days | Nothing | +3 (feature) |
| **P2** | **Feature 2**: Review → Marketing Asset Pipeline | Dev | 2–3 days | Nothing | +2 (feature) |
| **P2** | **Feature 3**: Shared itinerary cache | Dev | 3–4 days | Nothing | +2 (cost) |
| **P2** | **Feature 4**: Pay to Feature listings | Dev | 4–5 days | Nothing | +3 (revenue) |
| **P2** | **Feature 5**: Monthly performance scorecard | Dev | 4–5 days | Nothing | +2 (retention) |
| **P2** | **Feature 6**: Replace OpenAI embeddings | Dev | 2–3 days | Nothing | +1 (cost) |
| **P2** | Create `docs/API_REFERENCE.md` | Dev | 4 hours | Nothing | +3 (documentation) |
| **P2** | Create `docs/ENV_REFERENCE.md` | Dev | 2 hours | Nothing | +2 (documentation) |
| **P2** | Create `docs/ROUTE_PROTECTION.md` | Dev | 2 hours | Nothing | +2 (security) |
| **P2** | Create `docs/INCIDENT_RESPONSE.md` | Dev/Ops | 3 hours | Nothing | +2 (readiness) |
| **P2** | Update `DEPLOYMENT_GUIDE.md` (Sprint 3 vars) | Dev | 2 hours | Nothing | +2 (documentation) |
| **P2** | Archive stale docs to `docs/historical/` | Dev | 30 min | Nothing | +1 (quality) |
| **P2** | Upgrade Vercel to Pro plan | Ops | 10 min | Scale | +2 (infrastructure) |
| **P2** | Supabase compute upgrade to `nano` | Ops | 10 min | Scale | +2 (infrastructure) |
| **P3** | Execute all 10 user flow tests (this doc §8) | QA | 3–4 hours | P0 fixes | +5 (confidence) |
| **P3** | Create `docs/GLASS_UI_COMPONENTS.md` | Dev | 2 hours | Nothing | +1 |
| **P3** | Create `docs/DATA_PRIVACY.md` | Dev | 2 hours | Nothing | +2 (compliance) |
| **P3** | Create `docs/PERFORMANCE_BUDGET.md` | Dev | 1 hour | Nothing | +1 |
| **P3** | Remove duplicate map library (pick leaflet OR maplibre) | Dev | 4 hours | Nothing | +2 (performance) |
| **P3** | Remove duplicate QR library (pick one) | Dev | 1 hour | Nothing | +1 (performance) |
| **P3** | Add Redis 24-hour TTL to itinerary cache | Dev | 1 hour | Nothing | +1 (cost) |
| **P3** | FAL.ai key audit — remove if unused | Dev | 30 min | Nothing | +1 (cleanliness) |
| **P3** | Amadeus API usage audit | Dev | 1 hour | Nothing | +1 (cost, $9/mo) |
| **P3** | WCAG 2.1 AA accessibility audit | QA | 2 days | Nothing | +10 (accessibility) |
| **P3** | Core Web Vitals baseline (Lighthouse CI) | Dev | 4 hours | Nothing | +3 (performance) |
| **P3** | Write 20+ additional E2E tests | Dev | 1 week | Nothing | +15 (test coverage) |

### Projected Score After Priority Tiers

| After Completing | Projected Score | Key Improvement |
|-----------------|-----------------|-----------------|
| P0 complete | **78/100** | Go-live safe |
| P0 + P1 complete | **84/100** | Observable + email |
| P0 + P1 + P2 complete | **91/100** | Features + docs |
| All P0–P3 complete | **96/100** | Full production ready |

### Recommended Sprint Allocation

**Sprint 4** (2 weeks — Codex):
- ALL P0 items
- ALL P1 items
- Features 1 + 2 (WhatsApp→Proposal + Review Pipeline)
- Feature 6 (pgvector embeddings — lowest risk, big cleanup)
- Docs 1, 2, 3, 4 (most critical 4)

**Sprint 5** (2 weeks):
- Features 3, 4, 5 (Shared cache + Pay to Feature + Scorecard)
- Remaining docs (5–12)
- All 10 user flow tests
- Remove duplicate dependencies

**Sprint 6** (1 week):
- WCAG accessibility audit + fixes
- Lighthouse CI setup
- E2E test expansion (target 60 tests for 180 routes)

---

## APPENDIX — Key File Locations Quick Reference

| Feature | Key Files |
|---------|-----------|
| WhatsApp → Proposal | `UnifiedInbox.tsx`, `ContextActionModal.tsx`, `extract-trip-intent/route.ts` *(new)* |
| Review Pipeline | `ReviewsToInsta.tsx`, `api/social/reviews/route.ts`, `review-to-card.ts` *(new)* |
| Shared Cache | `itinerary-cache.ts`, `semantic-cache.ts`, `global_itinerary_pool` *(new table)* |
| Pay to Feature | `payment-service.ts`, `plan-catalog.ts`, `featured-tiers.ts` *(new)* |
| Scorecard | `supabase/functions/monthly-scorecard/` *(new)*, `email.ts`, `scorecard_deliveries` *(new table)* |
| pgvector Embed | `src/lib/embeddings.ts`, `supabase/functions/embed/` *(new)* |
| All DB Changes | `supabase/migrations/20260401*.sql` *(new)* |

---

*Document authored March 2026. Update this file after each implementation sprint.*
*Next review: after Sprint 4 completion.*
