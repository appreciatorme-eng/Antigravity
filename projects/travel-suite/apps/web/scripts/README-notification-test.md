# Notification Delivery End-to-End Test

This directory contains the test script for verifying the automatic notification delivery when a 5-star review is created and processed into a marketing asset.

## Test Script: `test-notification-delivery.ts`

### What It Tests

1. **Review Creation** - Creates a test 5-star review with a comment
2. **Automatic Processing** - Triggers the auto-review processor
3. **Asset Generation** - Verifies a marketing asset is created
4. **Notification Delivery** - Checks that a notification is sent to the operator
5. **Timing** - Ensures notification arrives within 30 seconds
6. **Cleanup** - Removes test data after verification

### Prerequisites

1. **Development server running** (or access to staging/production API)
2. **Environment variables set**:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access
   - `CRON_SECRET` - Secret for triggering cron endpoints
3. **Test organization and user**:
   - Valid organization ID
   - Valid user ID (operator who should receive notification)

### Running the Test

```bash
# From the web app directory
cd projects/travel-suite/apps/web

# Run the test script with test organization and user
npx tsx scripts/test-notification-delivery.ts <organizationId> <userId>
```

**Example:**
```bash
npx tsx scripts/test-notification-delivery.ts "550e8400-e29b-41d4-a716-446655440000" "660e8400-e29b-41d4-a716-446655440001"
```

### Expected Output

```
=== Starting End-to-End Notification Delivery Test ===

Organization ID: 550e8400-e29b-41d4-a716-446655440000
User ID: 660e8400-e29b-41d4-a716-446655440001
API Base URL: http://localhost:3000

Step 1: Creating test 5-star review...
✓ Created review: 770e8400-e29b-41d4-a716-446655440002

Step 2: Waiting for database trigger (2 seconds)...
Step 3: Manually triggering auto-processing...
✓ Processing triggered: { success: true, ... }

Step 4: Checking for marketing asset generation...
✓ Marketing asset found: 880e8400-e29b-41d4-a716-446655440003

Step 5: Checking for notification delivery...
✓ Notification delivered!
  Notification ID: 990e8400-e29b-41d4-a716-446655440004
  Title: New 5-star review
  Body: Marketing card ready to publish
  Status: sent
  Time to delivery: 4200ms

✓ Notification delivered within acceptable timeframe

Step 6: Cleaning up test data...
✓ Test data cleaned up

=== Test Results ===

Success: ✓ PASS
Review ID: 770e8400-e29b-41d4-a716-446655440002
Asset ID: 880e8400-e29b-41d4-a716-446655440003
Notification ID: 990e8400-e29b-41d4-a716-446655440004
Time to Notification: 4200ms
```

### Manual Verification (Alternative Method)

If you prefer to test manually without running the script:

#### 1. Create Test Review via Supabase SQL Editor

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
  'Excellent service! Highly recommend!',
  'Test Customer',
  'test@example.com',
  'traveler_portal',
  'published'
)
RETURNING id;
```

#### 2. Wait 30 Seconds

The database trigger should automatically:
- Detect the new 5-star review
- Call the Edge Function
- Generate a marketing asset
- Send a notification

#### 3. Check Notification Logs

```sql
SELECT
  id,
  recipient_id,
  title,
  body,
  notification_type,
  status,
  sent_at,
  created_at
FROM notification_logs
WHERE
  recipient_id = 'YOUR_USER_ID'
  AND notification_type = 'review_marketing_asset'
ORDER BY created_at DESC
LIMIT 5;
```

Expected result:
- `title`: "New 5-star review"
- `body`: "Marketing card ready to publish"
- `status`: "sent"
- `sent_at`: Within 30 seconds of review creation

#### 4. Verify Marketing Asset

```sql
SELECT
  id,
  review_id,
  lifecycle_state,
  template_type,
  created_at
FROM review_marketing_assets
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC
LIMIT 5;
```

Expected result:
- Asset exists with matching `review_id`
- `lifecycle_state`: 'draft' or 'asset_generated'

#### 5. Check on Device/Browser (if FCM configured)

If you have Firebase Cloud Messaging configured and a device/browser registered:
- Open the operator's device/browser
- Notification should appear with the title and body
- Clicking notification should navigate to the appropriate page

### Troubleshooting

#### No notification received

1. **Check Edge Function logs**:
   ```bash
   supabase functions logs process-review-marketing
   ```

2. **Verify database trigger exists**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_review_marketing_asset';
   ```

3. **Check for errors in server logs**:
   ```bash
   # In your Next.js dev environment
   # Look for errors from auto-review-processor
   ```

4. **Manually trigger processing**:
   ```bash
   curl -X POST http://localhost:3000/api/reputation/process-auto-reviews \
     -H "Content-Type: application/json" \
     -H "x-cron-secret: YOUR_CRON_SECRET" \
     -d '{"organizationId": "YOUR_ORG_ID"}'
   ```

#### Asset not generated

1. **Check review meets criteria**:
   - Rating must be 5 stars
   - Comment must be non-empty
   - Review must not already have an asset

2. **Check auto-processor logs** for specific error messages

3. **Verify review exists**:
   ```sql
   SELECT * FROM reputation_reviews WHERE id = 'YOUR_REVIEW_ID';
   ```

#### Notification delivered but not visible

1. **Check FCM token registration** for the user
2. **Verify notification service is running** (Edge Function)
3. **Check browser/device notification permissions**

### Success Criteria

- ✅ Review created successfully
- ✅ Marketing asset generated within 10 seconds
- ✅ Notification logged in `notification_logs` table
- ✅ Notification status is "sent"
- ✅ Total time from review creation to notification < 30 seconds
- ✅ No errors in server logs
- ✅ Test data cleaned up after verification

## Related Files

- **Auto-processor**: `src/lib/reputation/auto-review-processor.server.ts`
- **API Endpoint**: `src/app/api/_handlers/reputation/process-auto-reviews/route.ts`
- **Notification Service**: `src/lib/notifications.ts`
- **Edge Function**: `supabase/functions/process-review-marketing/index.ts`
- **Database Trigger**: `supabase/migrations/20260316195146_trigger_review_marketing_asset.sql`
