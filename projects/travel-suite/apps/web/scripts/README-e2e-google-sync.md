# End-to-End Test: Google Places Sync Flow

This test validates the complete automatic pipeline when reviews are synced from Google Places.

## What It Tests

✅ **5-star reviews with comments** → automatically generate marketing assets
✅ **4-star reviews** → NOT processed (only 5-star eligible)
✅ **5-star without comments** → NOT processed (comment required)
✅ **Duplicate processing** → idempotent (re-syncing doesn't create duplicates)
✅ **Batch notifications** → operator notified when multiple reviews synced
✅ **30-second timing** → pipeline completes within acceptance criteria

## Usage

### Automated Test Script

```bash
# From web directory
cd projects/travel-suite/apps/web

# Run the E2E test
npx tsx scripts/test-e2e-google-sync-flow.ts <organizationId> <userId>

# Example
npx tsx scripts/test-e2e-google-sync-flow.ts "550e8400-e29b-41d4-a716-446655440000" "user-uuid"
```

### Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-cron-secret  # Optional - enables manual trigger fallback
API_BASE_URL=http://localhost:3000  # Optional - defaults to localhost
```

## Test Scenarios

The script creates 5 test reviews simulating different Google Places sync scenarios:

| Scenario | Rating | Comment | Expected Outcome |
|----------|--------|---------|------------------|
| 1 | 5⭐ | "Outstanding service!..." | ✅ Asset generated |
| 2 | 5⭐ | "Absolutely fantastic..." | ✅ Asset generated |
| 3 | 4⭐ | "Good tour, enjoyed it..." | ❌ NOT processed |
| 4 | 5⭐ | `null` | ❌ NOT processed |
| 5 | 5⭐ | `""` (empty) | ❌ NOT processed |

## Test Flow

```
1. Create 5 test reviews with platform='google' (simulating Google sync)
   └─> Triggers database trigger on reputation_reviews

2. Database trigger fires → calls Edge Function → calls auto-processor

3. Auto-processor evaluates each review:
   ├─> 5-star + comment → ensureReviewMarketingAsset()
   ├─> 4-star → skip
   └─> no comment → skip

4. Marketing assets created → social posts drafted → notifications sent

5. Test verifies:
   ├─> 2 assets generated (only scenarios 1 & 2)
   ├─> 4-star review NOT processed
   ├─> Reviews without comments NOT processed
   ├─> Re-processing doesn't create duplicates
   └─> Operator notified (batch if multiple)

6. Clean up all test data
```

## Expected Output

### Success (All Tests Pass)

```
======================================================================
  END-TO-END TEST: Google Places Sync → Marketing Asset
======================================================================

Organization ID: 550e8400-e29b-41d4-a716-446655440000
User ID: user-uuid
API Base URL: http://localhost:3000
Timeout: 30000ms

📝 Step 1: Creating test reviews (simulating Google sync)...
   ✓ Created review 1: 5-star with comment (SHOULD generate asset)
   ✓ Created review 2: 5-star with comment #2 (SHOULD generate asset)
   ✓ Created review 3: 4-star with comment (should NOT generate asset)
   ✓ Created review 4: 5-star without comment (should NOT generate asset)
   ✓ Created review 5: 5-star with empty comment (should NOT generate asset)

⏱️  Step 2: Waiting for database trigger (3 seconds)...
   ✓ Trigger should have fired

🔧 Step 3: Manually triggering auto-processing (fallback)...
   ✓ Processing triggered: { processed: 2, assets_generated: 2, ... }

🎨 Step 4: Polling for marketing asset generation...
   ✓ Asset generated for: 5-star with comment (SHOULD generate asset)
   ✓ Asset generated for: 5-star with comment #2 (SHOULD generate asset)
   ✓ Generated 2/2 expected assets

🔍 Step 5: Verifying 4-star review was NOT processed...
   ✓ 4-star review correctly NOT processed

🔍 Step 6: Verifying reviews without comments were NOT processed...
   ✓ 5-star without comment (should NOT generate asset) correctly NOT processed
   ✓ 5-star with empty comment (should NOT generate asset) correctly NOT processed

🔄 Step 7: Testing duplicate review handling...
   ✓ Duplicate processing correctly prevented (1 assets)

🔔 Step 8: Checking for notification delivery...
   ✓ Notification(s) delivered!
   ✓ Count: 2 notification(s)
   ✓ Multiple notifications received (batch scenario)

⏱️  Step 9: Verifying timing requirement...
   ✓ Completed within reasonable time
   ✓ Total time: 8234ms

🧹 Step 10: Cleaning up test data...
   ✓ All test data cleaned up

======================================================================
  TEST SUMMARY
======================================================================

Result: ✅ PASS

Reviews Created:     5
Assets Generated:    2
4-star NOT processed: ✓ Yes
No-comment NOT proc:  ✓ Yes
Duplicate test:       ✓ Pass
Notification received: ✓ Yes
Total Time:          8234ms
Within 30s limit:    ✓ Yes
```

## Troubleshooting

### No assets generated

1. **Check database trigger**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_review_marketing_asset';
   ```

2. **Check Edge Function deployment**
   ```bash
   supabase functions list
   # Should show: process-review-marketing
   ```

3. **Check Edge Function logs**
   ```bash
   supabase functions logs process-review-marketing
   ```

4. **Manual trigger fallback**
   - Set `CRON_SECRET` environment variable
   - Script will automatically call `/api/reputation/process-auto-reviews`

### Assets generated for wrong reviews

- **4-star generated asset?** → Bug in auto-processor eligibility check
- **No-comment generated asset?** → Bug in database trigger condition
- Check `auto-review-processor.server.ts` → `processEligibleReviewForMarketing()`

### Duplicate assets created

- **Re-processing creates duplicates?** → Bug in idempotency check
- Check `review-marketing.server.ts` → `ensureReviewMarketingAsset()`
- Should check if asset already exists before creating

### Notifications not received

- **Warning (not error)** → Notifications might be delayed or disabled
- Check `notification_logs` table manually:
  ```sql
  SELECT * FROM notification_logs
  WHERE recipient_id = 'user-uuid'
  AND notification_type = 'review_marketing_asset'
  ORDER BY created_at DESC;
  ```

## Manual Verification (Alternative)

If automated script fails, you can manually verify the flow:

### 1. Create a test 5-star review with comment

```sql
INSERT INTO reputation_reviews (
  organization_id,
  platform,
  platform_review_id,
  rating,
  comment,
  reviewer_name,
  source,
  status,
  review_date,
  sentiment_label
) VALUES (
  'your-org-id',
  'google',
  'manual-test-' || NOW()::TEXT,
  5,
  'Amazing tour! Highly recommended!',
  'Manual Test Reviewer',
  'google_places_sync',
  'published',
  NOW(),
  'positive'
);
```

### 2. Wait 30 seconds

### 3. Check for marketing asset

```sql
SELECT
  r.id AS review_id,
  r.rating,
  r.comment,
  a.id AS asset_id,
  a.lifecycle_state,
  s.id AS social_post_id,
  s.source,
  s.status
FROM reputation_reviews r
LEFT JOIN review_marketing_assets a ON a.review_id = r.id
LEFT JOIN social_posts s ON s.id = a.social_post_id
WHERE r.platform_review_id LIKE 'manual-test-%'
ORDER BY r.created_at DESC;
```

### 4. Verify notification

```sql
SELECT * FROM notification_logs
WHERE notification_type = 'review_marketing_asset'
ORDER BY created_at DESC
LIMIT 5;
```

## Related Files

- Test script: `scripts/test-e2e-google-sync-flow.ts`
- Auto-processor: `src/lib/reputation/auto-review-processor.server.ts`
- Database trigger: `supabase/migrations/20260316195146_trigger_review_marketing_asset.sql`
- Edge Function: `supabase/functions/process-review-marketing/index.ts`
- Google sync endpoint: `src/app/api/_handlers/reputation/sync/route.ts`
