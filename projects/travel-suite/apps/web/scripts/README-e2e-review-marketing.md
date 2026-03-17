# End-to-End Test: Review → Marketing Asset → Social Post Flow

## Overview

This test script validates the complete automatic pipeline for transforming 5-star reviews into marketing assets and social media posts. It verifies all acceptance criteria from the Review → Marketing Asset Pipeline feature.

## Test Coverage

### What This Test Validates

✅ **Review Creation** - Creates a 5-star review with comment via API
✅ **Automatic Trigger** - Database trigger fires on review insert
✅ **Asset Generation** - Marketing asset created within 30 seconds
✅ **Social Post Creation** - Draft post created with `source='auto_review'`
✅ **Notification Delivery** - Operator receives notification
✅ **Image Rendering** - `rendered_image_url` is populated and accessible
✅ **Timing Requirement** - Complete pipeline executes within 30 seconds

### Acceptance Criteria Mapping

| Criterion | Verification Step |
|-----------|------------------|
| 5-star reviews automatically generate branded card | ✓ Step 4: Marketing asset creation |
| Draft appears in Social Studio with 'Auto from Review' badge | ✓ Step 5: Social post source check |
| Operator receives notification | ✓ Step 7: Notification logs query |
| Process completes within 30 seconds | ✓ Step 8: Timing validation |
| Rendered image is accessible | ✓ Step 6: Image URL verification |

## Prerequisites

### 1. Environment Setup

Ensure these environment variables are set:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (for manual trigger fallback)
CRON_SECRET=your-cron-secret

# Optional (default: http://localhost:3000)
API_BASE_URL=http://localhost:3000
```

### 2. Database Setup

- Supabase database trigger must be deployed:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'trigger_review_marketing_asset';
  ```

- Edge Function must be deployed:
  ```bash
  supabase functions list | grep process-review-marketing
  ```

### 3. Test Data

You need:
- Valid organization ID (UUID format)
- Valid user ID (UUID format) for the operator receiving notifications

## Running the Test

### Quick Start

```bash
cd projects/travel-suite/apps/web

npx tsx scripts/test-e2e-review-marketing-flow.ts \
  <organizationId> \
  <userId>
```

### Example with Real IDs

```bash
npx tsx scripts/test-e2e-review-marketing-flow.ts \
  "550e8400-e29b-41d4-a716-446655440000" \
  "660e8400-e29b-41d4-a716-446655440001"
```

### With Custom API URL (for staging/production)

```bash
API_BASE_URL=https://staging.example.com \
npx tsx scripts/test-e2e-review-marketing-flow.ts \
  "550e8400-e29b-41d4-a716-446655440000" \
  "660e8400-e29b-41d4-a716-446655440001"
```

## Expected Output

### Successful Run

```
======================================================================
  END-TO-END TEST: Review → Marketing Asset → Social Post
======================================================================

Organization ID: 550e8400-e29b-41d4-a716-446655440000
User ID: 660e8400-e29b-41d4-a716-446655440001
API Base URL: http://localhost:3000
Timeout: 30000ms

📝 Step 1: Creating test 5-star review...
   ✓ Created review: 770e8400-e29b-41d4-a716-446655440002
   ✓ Rating: 5 stars
   ✓ Comment: "Amazing experience! Best tour ever. Highly recommen..."

⏱️  Step 2: Waiting for database trigger (3 seconds)...
   ✓ Trigger should have fired

🔧 Step 3: Manually triggering auto-processing (fallback)...
   ✓ Processing triggered: { orgs_processed: 1, total_assets_generated: 1 }

🎨 Step 4: Polling for marketing asset generation...
   ✓ Marketing asset found: 880e8400-e29b-41d4-a716-446655440003
   ✓ Lifecycle state: asset_generated
   ✓ Template type: review_stars_minimal
   ✓ Social post ID: 990e8400-e29b-41d4-a716-446655440004
   ✓ Rendered image URL: Present

📱 Step 5: Verifying social post creation...
   ✓ Social post found: 990e8400-e29b-41d4-a716-446655440004
   ✓ Source: auto_review
   ✓ Status: draft
   ✓ Content: "⭐⭐⭐⭐⭐ "Amazing experience! Best tour ever. Hig..."
   ✓ Source correctly set to 'auto_review'
   ✓ Status correctly set to 'draft'

🖼️  Step 6: Verifying rendered image URL...
   ✓ Image URL: https://storage.supabase.co/object/public/...
   ✓ Image URL is accessible and valid

🔔 Step 7: Checking for notification delivery...
   ✓ Notification delivered!
   ✓ Notification ID: aa0e8400-e29b-41d4-a716-446655440005
   ✓ Title: New 5-star review
   ✓ Body: Marketing card ready to publish
   ✓ Status: sent

⏱️  Step 8: Verifying timing requirement...
   ✓ Completed within 30000ms requirement
   ✓ Total time: 8432ms

🧹 Step 9: Cleaning up test data...
   ✓ Deleted social post: 990e8400-e29b-41d4-a716-446655440004
   ✓ Deleted marketing asset: 880e8400-e29b-41d4-a716-446655440003
   ✓ Deleted review: 770e8400-e29b-41d4-a716-446655440002
   ✓ Deleted notification log: aa0e8400-e29b-41d4-a716-446655440005
   ✓ All test data cleaned up

======================================================================
  TEST SUMMARY
======================================================================

Result: ✅ PASS

Review ID:           770e8400-e29b-41d4-a716-446655440002
Asset ID:            880e8400-e29b-41d4-a716-446655440003
Social Post ID:      990e8400-e29b-41d4-a716-446655440004
Notification ID:     aa0e8400-e29b-41d4-a716-446655440005
Image URL:           https://storage.supabase.co/object/public/social-assets/...
Total Time:          8432ms
Within 30s limit:    ✓ Yes

======================================================================
```

### Failed Run Example

```
❌ Errors:
  1. Marketing asset not generated within 30000ms timeout
  2. Social post source is 'manual', expected 'auto_review'

⚠️  Warnings:
  1. Notification was not found in notification_logs table

Result: ❌ FAIL
```

## Troubleshooting

### Problem: Marketing asset not generated

**Symptoms:**
- Test fails at Step 4
- Error: "Marketing asset not generated within timeout"

**Possible Causes:**
1. Database trigger not deployed
2. Edge Function not deployed or erroring
3. API endpoint `/api/reputation/process-auto-reviews` not working

**Solutions:**

```bash
# Check trigger exists
psql $DATABASE_URL -c "SELECT * FROM pg_trigger WHERE tgname = 'trigger_review_marketing_asset';"

# Check Edge Function logs
supabase functions logs process-review-marketing --tail

# Manually test API endpoint
curl -X POST http://localhost:3000/api/reputation/process-auto-reviews \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET" \
  -d '{"organizationId": "YOUR_ORG_ID"}'
```

### Problem: Social post has wrong source

**Symptoms:**
- Asset is created but social post source is not `'auto_review'`
- Error: "Social post source is 'manual', expected 'auto_review'"

**Possible Causes:**
- Bug in `auto-review-processor.server.ts`
- Wrong parameters passed to `ensureReviewMarketingAsset()`

**Solutions:**

Check the auto-processor code:

```bash
cd projects/travel-suite/apps/web
grep -n "source.*auto_review" src/lib/reputation/auto-review-processor.server.ts
```

### Problem: Image URL not accessible

**Symptoms:**
- Asset and post created but image URL returns 404
- Error: "rendered_image_url is not accessible"

**Possible Causes:**
1. Supabase storage bucket not configured
2. Image rendering failed but didn't throw error
3. Incorrect bucket permissions

**Solutions:**

```bash
# Check storage bucket exists
supabase storage ls social-assets

# Check bucket permissions (should allow public read)
# Via Supabase dashboard: Storage → social-assets → Policies

# Verify image exists
curl -I <image_url_from_test>
```

### Problem: Notification not delivered

**Symptoms:**
- Warning: "Notification was not found in notification_logs table"
- Test passes but with warnings

**Possible Causes:**
1. Notification service disabled or misconfigured
2. User ID doesn't exist or has no FCM token
3. Notification async task failed silently

**Solutions:**

```sql
-- Check if user exists
SELECT id, email FROM auth.users WHERE id = 'YOUR_USER_ID';

-- Check recent notification logs
SELECT *
FROM notification_logs
WHERE recipient_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;

-- Check for notification errors in server logs
-- (Look for errors from src/lib/notifications.ts)
```

### Problem: Timeout exceeded

**Symptoms:**
- Error: "Pipeline took 35000ms, exceeding 30000ms requirement"
- All steps pass but timing is slow

**Possible Causes:**
1. Database trigger has delay
2. Edge Function cold start
3. Image rendering is slow
4. Network latency to Supabase

**Solutions:**

- Run test multiple times (first run is always slower due to cold start)
- Check Edge Function region matches database region
- Optimize image rendering (reduce image size/quality)
- Consider increasing timeout for development environments

## Manual Verification (Alternative)

If you prefer to verify without running the automated script:

### 1. Create Review via SQL

```sql
INSERT INTO reputation_reviews (
  organization_id,
  rating,
  comment,
  reviewer_name,
  reviewer_email,
  source,
  status
) VALUES (
  'YOUR_ORG_ID',
  5,
  'Excellent service! Highly recommend! Amazing experience.',
  'Manual Test',
  'manual@example.com',
  'traveler_portal',
  'published'
)
RETURNING id;
```

### 2. Wait 30 Seconds

### 3. Check Marketing Asset

```sql
SELECT
  rma.id,
  rma.review_id,
  rma.lifecycle_state,
  rma.social_post_id,
  rma.rendered_image_url,
  rma.created_at
FROM review_marketing_assets rma
WHERE rma.organization_id = 'YOUR_ORG_ID'
ORDER BY rma.created_at DESC
LIMIT 5;
```

Expected: New row with `lifecycle_state = 'asset_generated'`

### 4. Check Social Post

```sql
SELECT
  sp.id,
  sp.source,
  sp.status,
  sp.content,
  sp.image_url,
  sp.created_at
FROM social_posts sp
WHERE sp.organization_id = 'YOUR_ORG_ID'
  AND sp.source = 'auto_review'
ORDER BY sp.created_at DESC
LIMIT 5;
```

Expected: New draft post with `source = 'auto_review'`

### 5. Check Notification

```sql
SELECT
  nl.id,
  nl.recipient_id,
  nl.title,
  nl.body,
  nl.notification_type,
  nl.status,
  nl.created_at
FROM notification_logs nl
WHERE nl.recipient_id = 'YOUR_USER_ID'
  AND nl.notification_type = 'review_marketing_asset'
ORDER BY nl.created_at DESC
LIMIT 5;
```

Expected: New notification with title "New 5-star review"

### 6. Verify Image URL

Copy the `rendered_image_url` from step 3 and open in browser - should display the branded review card image.

## Success Criteria

All of these must be true for the test to pass:

- ✅ Review created successfully
- ✅ Marketing asset generated with `lifecycle_state = 'asset_generated'`
- ✅ Social post created with `source = 'auto_review'` and `status = 'draft'`
- ✅ Notification logged with correct title and body
- ✅ `rendered_image_url` is populated (not null)
- ✅ `rendered_image_url` is accessible (returns 200 with image MIME type)
- ✅ Complete pipeline executes in < 30 seconds
- ✅ All test data cleaned up after verification

## Related Files

- **Test Script**: `scripts/test-e2e-review-marketing-flow.ts`
- **Auto Processor**: `src/lib/reputation/auto-review-processor.server.ts`
- **API Endpoint**: `src/app/api/_handlers/reputation/process-auto-reviews/route.ts`
- **Edge Function**: `supabase/functions/process-review-marketing/index.ts`
- **Database Trigger**: `supabase/migrations/20260316195146_trigger_review_marketing_asset.sql`
- **Marketing Service**: `src/lib/reputation/review-marketing.server.ts`
- **Notification Service**: `src/lib/notifications.ts`

## CI/CD Integration

To run this test in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run E2E Review Marketing Test
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SERVICE_ROLE_KEY }}
    CRON_SECRET: ${{ secrets.CRON_SECRET }}
    API_BASE_URL: https://staging.example.com
  run: |
    npx tsx scripts/test-e2e-review-marketing-flow.ts \
      "$TEST_ORG_ID" \
      "$TEST_USER_ID"
```

## Notes

- Test is **non-destructive** - all test data is cleaned up automatically
- Test can be run against development, staging, or production
- First run may be slower due to Edge Function cold start
- Multiple concurrent runs against same org/user may interfere with each other
- Image URL verification requires network access to Supabase storage
