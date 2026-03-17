/**
 * End-to-End Test: Review → Marketing Asset → Notification Delivery
 *
 * This script tests the complete automatic pipeline:
 * 1. Creates a test 5-star review
 * 2. Triggers automatic processing
 * 3. Verifies marketing asset generation
 * 4. Checks notification delivery in notification_logs table
 *
 * Usage:
 *   npx tsx scripts/test-notification-delivery.ts [organizationId] [userId]
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CRON_SECRET
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Timeout for notification delivery (30 seconds as per acceptance criteria)
const NOTIFICATION_TIMEOUT_MS = 30000;

interface TestResult {
  success: boolean;
  reviewId?: string;
  assetId?: string;
  notificationId?: string;
  timeToNotification?: number;
  errors: string[];
}

async function runTest(organizationId: string, userId: string): Promise<TestResult> {
  const result: TestResult = {
    success: false,
    errors: [],
  };

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    result.errors.push('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return result;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    console.log('\n=== Starting End-to-End Notification Delivery Test ===\n');
    console.log(`Organization ID: ${organizationId}`);
    console.log(`User ID: ${userId}`);
    console.log(`API Base URL: ${API_BASE_URL}\n`);

    // Step 1: Create a test 5-star review
    console.log('Step 1: Creating test 5-star review...');
    const testReview = {
      organization_id: organizationId,
      rating: 5,
      comment: 'Amazing experience! Best tour ever. Highly recommended! 🌟',
      reviewer_name: 'Test Customer',
      reviewer_email: 'test@example.com',
      source: 'traveler_portal',
      status: 'published',
    };

    const { data: review, error: reviewError } = await supabase
      .from('reputation_reviews')
      .insert(testReview)
      .select()
      .single();

    if (reviewError || !review) {
      result.errors.push(`Failed to create review: ${reviewError?.message || 'Unknown error'}`);
      return result;
    }

    result.reviewId = review.id;
    console.log(`✓ Created review: ${review.id}\n`);

    // Step 2: Wait a moment for database trigger to fire
    console.log('Step 2: Waiting for database trigger (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Manually trigger processing as fallback (in case trigger didn't fire)
    console.log('Step 3: Manually triggering auto-processing...');

    if (!CRON_SECRET) {
      console.warn('⚠ CRON_SECRET not set, skipping manual trigger');
    } else {
      const processResponse = await fetch(`${API_BASE_URL}/api/reputation/process-auto-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': CRON_SECRET,
        },
        body: JSON.stringify({
          organizationId,
          lookbackDays: 1,
        }),
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        result.errors.push(`Failed to trigger processing: ${errorText}`);
      } else {
        const processResult = await processResponse.json();
        console.log(`✓ Processing triggered:`, processResult);
      }
    }

    // Step 4: Poll for marketing asset creation
    console.log('\nStep 4: Checking for marketing asset generation...');
    const startTime = Date.now();
    let assetFound = false;
    let assetCheckAttempts = 0;
    const maxAssetChecks = 10;

    while (!assetFound && assetCheckAttempts < maxAssetChecks) {
      const { data: asset, error: assetError } = await supabase
        .from('review_marketing_assets')
        .select('id, lifecycle_state')
        .eq('review_id', review.id)
        .maybeSingle();

      if (asset) {
        result.assetId = asset.id;
        assetFound = true;
        console.log(`✓ Marketing asset found: ${asset.id} (state: ${asset.lifecycle_state})\n`);
      } else {
        assetCheckAttempts++;
        if (assetCheckAttempts < maxAssetChecks) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!assetFound) {
      result.errors.push('Marketing asset was not generated within timeout period');
      return result;
    }

    // Step 5: Check for notification delivery
    console.log('Step 5: Checking for notification delivery...');
    let notificationFound = false;
    let notificationCheckAttempts = 0;
    const maxNotificationChecks = 15;

    while (!notificationFound && notificationCheckAttempts < maxNotificationChecks) {
      const elapsed = Date.now() - startTime;

      if (elapsed > NOTIFICATION_TIMEOUT_MS) {
        result.errors.push(`Notification not delivered within ${NOTIFICATION_TIMEOUT_MS}ms timeout`);
        break;
      }

      const { data: notifications, error: notificationError } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('recipient_id', userId)
        .eq('notification_type', 'review_marketing_asset')
        .order('created_at', { ascending: false })
        .limit(5);

      if (notificationError) {
        result.errors.push(`Failed to query notifications: ${notificationError.message}`);
        break;
      }

      // Check if any notification matches our review
      const matchingNotification = notifications?.find(n => {
        // Check if the notification body or title mentions the review
        return n.title?.includes('5-star review') ||
               n.body?.includes('Marketing card ready');
      });

      if (matchingNotification) {
        result.notificationId = matchingNotification.id;
        result.timeToNotification = Date.now() - startTime;
        notificationFound = true;
        console.log(`✓ Notification delivered!`);
        console.log(`  Notification ID: ${matchingNotification.id}`);
        console.log(`  Title: ${matchingNotification.title}`);
        console.log(`  Body: ${matchingNotification.body}`);
        console.log(`  Status: ${matchingNotification.status}`);
        console.log(`  Time to delivery: ${result.timeToNotification}ms\n`);
      } else {
        notificationCheckAttempts++;
        if (notificationCheckAttempts < maxNotificationChecks) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!notificationFound) {
      result.errors.push('Notification was not found in notification_logs table');
      return result;
    }

    // Step 6: Verify notification delivery time
    if (result.timeToNotification && result.timeToNotification > NOTIFICATION_TIMEOUT_MS) {
      result.errors.push(
        `Notification delivery took ${result.timeToNotification}ms, exceeding ${NOTIFICATION_TIMEOUT_MS}ms requirement`
      );
    } else {
      console.log('✓ Notification delivered within acceptable timeframe\n');
    }

    // Step 7: Clean up test data
    console.log('Step 6: Cleaning up test data...');

    // Delete marketing asset first (foreign key constraint)
    if (result.assetId) {
      await supabase
        .from('review_marketing_assets')
        .delete()
        .eq('id', result.assetId);
    }

    // Delete review
    await supabase
      .from('reputation_reviews')
      .delete()
      .eq('id', review.id);

    // Delete notification log
    if (result.notificationId) {
      await supabase
        .from('notification_logs')
        .delete()
        .eq('id', result.notificationId);
    }

    console.log('✓ Test data cleaned up\n');

    result.success = result.errors.length === 0;
    return result;

  } catch (error) {
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/test-notification-delivery.ts <organizationId> <userId>');
    console.error('\nExample:');
    console.error('  npx tsx scripts/test-notification-delivery.ts org-123 user-456');
    process.exit(1);
  }

  const [organizationId, userId] = args;

  const result = await runTest(organizationId, userId);

  console.log('\n=== Test Results ===\n');
  console.log(`Success: ${result.success ? '✓ PASS' : '✗ FAIL'}`);

  if (result.reviewId) {
    console.log(`Review ID: ${result.reviewId}`);
  }

  if (result.assetId) {
    console.log(`Asset ID: ${result.assetId}`);
  }

  if (result.notificationId) {
    console.log(`Notification ID: ${result.notificationId}`);
  }

  if (result.timeToNotification) {
    console.log(`Time to Notification: ${result.timeToNotification}ms`);
  }

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  console.log('\n' + '='.repeat(50) + '\n');

  process.exit(result.success ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
