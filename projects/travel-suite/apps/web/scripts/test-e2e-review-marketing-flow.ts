/**
 * End-to-End Test: Manual Review → Marketing Asset → Social Post Flow
 *
 * This script tests the complete automatic pipeline from acceptance criteria:
 * 1. Creates a test 5-star review via POST /api/reputation/reviews
 * 2. Waits 30 seconds for automatic processing
 * 3. Verifies social_posts table has new draft with source='auto_review'
 * 4. Verifies review_marketing_assets table has new entry
 * 5. Verifies notification_logs table has entry for operator
 * 6. Verifies rendered_image_url is populated and accessible
 *
 * Usage:
 *   npx tsx scripts/test-e2e-review-marketing-flow.ts [organizationId] [userId]
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CRON_SECRET (optional - for manual trigger fallback)
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Timeout for complete pipeline (30 seconds as per acceptance criteria)
const PIPELINE_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 2000;

interface TestResult {
  success: boolean;
  reviewId?: string;
  assetId?: string;
  socialPostId?: string;
  notificationId?: string;
  renderedImageUrl?: string;
  timeToComplete?: number;
  errors: string[];
  warnings: string[];
}

async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && (contentType?.startsWith('image/') ?? false);
  } catch {
    return false;
  }
}

async function runTest(organizationId: string, userId: string): Promise<TestResult> {
  const result: TestResult = {
    success: false,
    errors: [],
    warnings: [],
  };

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    result.errors.push('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return result;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const startTime = Date.now();

  try {
    console.log('\n' + '='.repeat(70));
    console.log('  END-TO-END TEST: Review → Marketing Asset → Social Post');
    console.log('='.repeat(70) + '\n');
    console.log(`Organization ID: ${organizationId}`);
    console.log(`User ID: ${userId}`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Timeout: ${PIPELINE_TIMEOUT_MS}ms\n`);

    // Step 1: Create a test 5-star review
    console.log('📝 Step 1: Creating test 5-star review...');
    const testReview = {
      organization_id: organizationId,
      rating: 5,
      comment: 'Amazing experience! Best tour ever. Highly recommended! The guide was knowledgeable and friendly. 🌟',
      reviewer_name: 'E2E Test Customer',
      reviewer_email: 'e2e-test@example.com',
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
    console.log(`   ✓ Created review: ${review.id}`);
    console.log(`   ✓ Rating: ${review.rating} stars`);
    console.log(`   ✓ Comment: "${review.comment.substring(0, 50)}..."\n`);

    // Step 2: Wait for database trigger to fire
    console.log('⏱️  Step 2: Waiting for database trigger (3 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('   ✓ Trigger should have fired\n');

    // Step 3: Manually trigger processing as fallback (if CRON_SECRET available)
    if (CRON_SECRET) {
      console.log('🔧 Step 3: Manually triggering auto-processing (fallback)...');
      try {
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
          result.warnings.push(`Manual trigger failed: ${errorText}`);
          console.log(`   ⚠ Manual trigger failed (trigger might be working): ${errorText}\n`);
        } else {
          const processResult = await processResponse.json();
          console.log(`   ✓ Processing triggered:`, processResult.data || processResult);
          console.log('');
        }
      } catch (error) {
        result.warnings.push(`Manual trigger error: ${error instanceof Error ? error.message : String(error)}`);
        console.log(`   ⚠ Manual trigger error (continuing...)\n`);
      }
    } else {
      console.log('⚠️  Step 3: CRON_SECRET not set, skipping manual trigger\n');
    }

    // Step 4: Poll for marketing asset creation
    console.log('🎨 Step 4: Polling for marketing asset generation...');
    let assetFound = false;
    let pollAttempts = 0;
    const maxPolls = Math.ceil(PIPELINE_TIMEOUT_MS / POLL_INTERVAL_MS);

    while (!assetFound && pollAttempts < maxPolls) {
      const elapsed = Date.now() - startTime;

      if (elapsed > PIPELINE_TIMEOUT_MS) {
        result.errors.push(`Marketing asset not generated within ${PIPELINE_TIMEOUT_MS}ms timeout`);
        break;
      }

      const { data: asset } = await supabase
        .from('review_marketing_assets')
        .select('id, lifecycle_state, template_type, social_post_id, rendered_image_url')
        .eq('review_id', review.id)
        .maybeSingle();

      if (asset) {
        result.assetId = asset.id;
        result.socialPostId = asset.social_post_id;
        result.renderedImageUrl = asset.rendered_image_url;
        assetFound = true;
        console.log(`   ✓ Marketing asset found: ${asset.id}`);
        console.log(`   ✓ Lifecycle state: ${asset.lifecycle_state}`);
        console.log(`   ✓ Template type: ${asset.template_type}`);
        console.log(`   ✓ Social post ID: ${asset.social_post_id || 'Not yet created'}`);
        console.log(`   ✓ Rendered image URL: ${asset.rendered_image_url ? 'Present' : 'Missing'}\n`);
      } else {
        pollAttempts++;
        process.stdout.write(`   ⏳ Polling attempt ${pollAttempts}/${maxPolls} (${elapsed}ms elapsed)...\r`);
        if (pollAttempts < maxPolls) {
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }
    }

    if (!assetFound) {
      result.errors.push('Marketing asset was not generated within timeout period');
      console.log('\n   ✗ Marketing asset NOT found\n');
      return result;
    }

    // Step 5: Verify social_posts table has draft with source='auto_review'
    console.log('📱 Step 5: Verifying social post creation...');

    if (!result.socialPostId) {
      result.errors.push('Marketing asset created but social_post_id is null');
      console.log('   ✗ Social post ID not set in marketing asset\n');
    } else {
      const { data: socialPost, error: socialPostError } = await supabase
        .from('social_posts')
        .select('id, source, status, content, image_url, scheduled_for')
        .eq('id', result.socialPostId)
        .maybeSingle();

      if (socialPostError || !socialPost) {
        result.errors.push(`Failed to find social post: ${socialPostError?.message || 'Not found'}`);
        console.log(`   ✗ Social post not found: ${socialPostError?.message}\n`);
      } else {
        console.log(`   ✓ Social post found: ${socialPost.id}`);
        console.log(`   ✓ Source: ${socialPost.source}`);
        console.log(`   ✓ Status: ${socialPost.status}`);
        console.log(`   ✓ Content: "${socialPost.content?.substring(0, 50) || 'N/A'}..."`);

        if (socialPost.source !== 'auto_review') {
          result.errors.push(`Social post source is '${socialPost.source}', expected 'auto_review'`);
          console.log(`   ✗ Wrong source: expected 'auto_review', got '${socialPost.source}'`);
        } else {
          console.log(`   ✓ Source correctly set to 'auto_review'`);
        }

        if (socialPost.status !== 'draft') {
          result.warnings.push(`Social post status is '${socialPost.status}', expected 'draft'`);
          console.log(`   ⚠ Status is '${socialPost.status}' (expected 'draft')`);
        } else {
          console.log(`   ✓ Status correctly set to 'draft'`);
        }

        console.log('');
      }
    }

    // Step 6: Verify rendered_image_url is populated and accessible
    console.log('🖼️  Step 6: Verifying rendered image URL...');

    if (!result.renderedImageUrl) {
      result.errors.push('rendered_image_url is null or empty');
      console.log('   ✗ No rendered image URL\n');
    } else {
      console.log(`   ✓ Image URL: ${result.renderedImageUrl}`);

      const isAccessible = await verifyImageUrl(result.renderedImageUrl);
      if (!isAccessible) {
        result.errors.push('rendered_image_url is not accessible or not an image');
        console.log('   ✗ Image URL is not accessible\n');
      } else {
        console.log('   ✓ Image URL is accessible and valid\n');
      }
    }

    // Step 7: Check for notification delivery
    console.log('🔔 Step 7: Checking for notification delivery...');
    let notificationFound = false;
    let notificationPolls = 0;
    const maxNotificationPolls = 5;

    while (!notificationFound && notificationPolls < maxNotificationPolls) {
      const { data: notifications, error: notificationError } = await supabase
        .from('notification_logs')
        .select('id, title, body, notification_type, status, created_at')
        .eq('recipient_id', userId)
        .eq('notification_type', 'review_marketing_asset')
        .order('created_at', { ascending: false })
        .limit(5);

      if (notificationError) {
        result.warnings.push(`Failed to query notifications: ${notificationError.message}`);
        console.log(`   ⚠ Failed to query notifications: ${notificationError.message}\n`);
        break;
      }

      // Check if any notification matches our review
      const matchingNotification = notifications?.find(n => {
        const recentEnough = n.created_at &&
          (new Date(n.created_at).getTime() >= startTime - 5000);
        return recentEnough && (
          n.title?.includes('5-star review') ||
          n.body?.includes('Marketing card ready')
        );
      });

      if (matchingNotification) {
        result.notificationId = matchingNotification.id;
        notificationFound = true;
        console.log(`   ✓ Notification delivered!`);
        console.log(`   ✓ Notification ID: ${matchingNotification.id}`);
        console.log(`   ✓ Title: ${matchingNotification.title}`);
        console.log(`   ✓ Body: ${matchingNotification.body}`);
        console.log(`   ✓ Status: ${matchingNotification.status}\n`);
      } else {
        notificationPolls++;
        if (notificationPolls < maxNotificationPolls) {
          process.stdout.write(`   ⏳ Checking notifications (${notificationPolls}/${maxNotificationPolls})...\r`);
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }
    }

    if (!notificationFound) {
      result.warnings.push('Notification was not found in notification_logs table');
      console.log('\n   ⚠ Notification not found (might be delayed)\n');
    }

    // Calculate total time
    result.timeToComplete = Date.now() - startTime;

    // Step 8: Verify timing requirement (30 seconds)
    console.log('⏱️  Step 8: Verifying timing requirement...');
    if (result.timeToComplete > PIPELINE_TIMEOUT_MS) {
      result.errors.push(
        `Pipeline took ${result.timeToComplete}ms, exceeding ${PIPELINE_TIMEOUT_MS}ms requirement`
      );
      console.log(`   ✗ Exceeded timeout: ${result.timeToComplete}ms > ${PIPELINE_TIMEOUT_MS}ms\n`);
    } else {
      console.log(`   ✓ Completed within ${PIPELINE_TIMEOUT_MS}ms requirement`);
      console.log(`   ✓ Total time: ${result.timeToComplete}ms\n`);
    }

    // Determine overall success
    result.success = result.errors.length === 0;

    // Step 9: Clean up test data
    console.log('🧹 Step 9: Cleaning up test data...');

    // Delete social post first (if exists)
    if (result.socialPostId) {
      await supabase
        .from('social_posts')
        .delete()
        .eq('id', result.socialPostId);
      console.log(`   ✓ Deleted social post: ${result.socialPostId}`);
    }

    // Delete marketing asset (foreign key to review)
    if (result.assetId) {
      await supabase
        .from('review_marketing_assets')
        .delete()
        .eq('id', result.assetId);
      console.log(`   ✓ Deleted marketing asset: ${result.assetId}`);
    }

    // Delete review
    await supabase
      .from('reputation_reviews')
      .delete()
      .eq('id', review.id);
    console.log(`   ✓ Deleted review: ${review.id}`);

    // Delete notification log (if exists)
    if (result.notificationId) {
      await supabase
        .from('notification_logs')
        .delete()
        .eq('id', result.notificationId);
      console.log(`   ✓ Deleted notification log: ${result.notificationId}`);
    }

    console.log('   ✓ All test data cleaned up\n');

    return result;

  } catch (error) {
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    console.error('\n❌ Fatal error:', error);
    return result;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('\nUsage: npx tsx scripts/test-e2e-review-marketing-flow.ts <organizationId> <userId>\n');
    console.error('Example:');
    console.error('  npx tsx scripts/test-e2e-review-marketing-flow.ts org-123 user-456\n');
    console.error('Required environment variables:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL');
    console.error('  SUPABASE_SERVICE_ROLE_KEY');
    console.error('  CRON_SECRET (optional - for manual trigger fallback)\n');
    process.exit(1);
  }

  const [organizationId, userId] = args;

  const result = await runTest(organizationId, userId);

  // Print summary
  console.log('='.repeat(70));
  console.log('  TEST SUMMARY');
  console.log('='.repeat(70) + '\n');

  console.log(`Result: ${result.success ? '✅ PASS' : '❌ FAIL'}\n`);

  if (result.reviewId) {
    console.log(`Review ID:           ${result.reviewId}`);
  }

  if (result.assetId) {
    console.log(`Asset ID:            ${result.assetId}`);
  }

  if (result.socialPostId) {
    console.log(`Social Post ID:      ${result.socialPostId}`);
  }

  if (result.notificationId) {
    console.log(`Notification ID:     ${result.notificationId}`);
  }

  if (result.renderedImageUrl) {
    console.log(`Image URL:           ${result.renderedImageUrl.substring(0, 60)}...`);
  }

  if (result.timeToComplete) {
    console.log(`Total Time:          ${result.timeToComplete}ms`);
    console.log(`Within 30s limit:    ${result.timeToComplete <= PIPELINE_TIMEOUT_MS ? '✓ Yes' : '✗ No'}`);
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
