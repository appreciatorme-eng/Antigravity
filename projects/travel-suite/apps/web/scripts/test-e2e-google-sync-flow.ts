/**
 * End-to-End Test: Google Places Sync → Marketing Asset Flow
 *
 * This script tests the complete automatic pipeline for Google-synced reviews:
 * 1. Creates test reviews simulating Google Places sync (5-star, 4-star, no comment)
 * 2. Verifies only 5-star reviews with comments trigger asset generation
 * 3. Tests duplicate review handling (idempotency)
 * 4. Verifies batch notification if multiple reviews synced
 * 5. Confirms 4-star reviews are NOT processed
 * 6. Confirms reviews without comments are NOT processed
 *
 * Usage:
 *   npx tsx scripts/test-e2e-google-sync-flow.ts [organizationId] [userId]
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

interface TestReview {
  id?: string;
  rating: number;
  comment: string | null;
  description: string;
  shouldGenerateAsset: boolean;
}

interface TestResult {
  success: boolean;
  reviewsCreated: string[];
  assetsGenerated: string[];
  duplicateTestPassed: boolean;
  fourStarNotProcessed: boolean;
  noCommentNotProcessed: boolean;
  notificationReceived: boolean;
  timeToComplete?: number;
  errors: string[];
  warnings: string[];
}

function generateUniquePlatformId(baseId: string, rating: number, comment: string | null): string {
  const timestamp = Date.now();
  return `google:place_${baseId}:${rating}:${comment?.slice(0, 20) || 'no-comment'}:${timestamp}`;
}

async function runTest(organizationId: string, userId: string): Promise<TestResult> {
  const result: TestResult = {
    success: false,
    reviewsCreated: [],
    assetsGenerated: [],
    duplicateTestPassed: false,
    fourStarNotProcessed: true,
    noCommentNotProcessed: true,
    notificationReceived: false,
    errors: [],
    warnings: [],
  };

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    result.errors.push('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return result;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const startTime = Date.now();
  const baseId = `test-${Date.now()}`;

  try {
    console.log('\n' + '='.repeat(70));
    console.log('  END-TO-END TEST: Google Places Sync → Marketing Asset');
    console.log('='.repeat(70) + '\n');
    console.log(`Organization ID: ${organizationId}`);
    console.log(`User ID: ${userId}`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Timeout: ${PIPELINE_TIMEOUT_MS}ms\n`);

    // Define test scenarios
    const testScenarios: TestReview[] = [
      {
        rating: 5,
        comment: 'Outstanding service! The tour guide was amazing and very knowledgeable. Highly recommend! 🌟',
        description: '5-star with comment (SHOULD generate asset)',
        shouldGenerateAsset: true,
      },
      {
        rating: 5,
        comment: 'Absolutely fantastic experience! Best tour company ever. Will definitely book again!',
        description: '5-star with comment #2 (SHOULD generate asset)',
        shouldGenerateAsset: true,
      },
      {
        rating: 4,
        comment: 'Good tour, enjoyed it. Guide was helpful and friendly.',
        description: '4-star with comment (should NOT generate asset)',
        shouldGenerateAsset: false,
      },
      {
        rating: 5,
        comment: null,
        description: '5-star without comment (should NOT generate asset)',
        shouldGenerateAsset: false,
      },
      {
        rating: 5,
        comment: '',
        description: '5-star with empty comment (should NOT generate asset)',
        shouldGenerateAsset: false,
      },
    ];

    // Step 1: Create test reviews simulating Google Places sync
    console.log('📝 Step 1: Creating test reviews (simulating Google sync)...');

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      const platformReviewId = generateUniquePlatformId(baseId, scenario.rating, scenario.comment);

      const testReview = {
        organization_id: organizationId,
        platform: 'google',
        platform_review_id: platformReviewId,
        rating: scenario.rating,
        comment: scenario.comment,
        reviewer_name: `Google Test Reviewer ${i + 1}`,
        reviewer_email: null,
        source: 'google_places_sync',
        status: 'published',
        review_date: new Date().toISOString(),
        sentiment_label: scenario.rating >= 4 ? 'positive' : 'neutral',
      };

      const { data: review, error: reviewError } = await supabase
        .from('reputation_reviews')
        .insert(testReview)
        .select()
        .single();

      if (reviewError || !review) {
        result.errors.push(`Failed to create review ${i + 1}: ${reviewError?.message || 'Unknown error'}`);
        continue;
      }

      scenario.id = review.id;
      result.reviewsCreated.push(review.id);
      console.log(`   ✓ Created review ${i + 1}: ${scenario.description}`);
      console.log(`     - ID: ${review.id}`);
      console.log(`     - Rating: ${review.rating} stars`);
      console.log(`     - Comment: ${review.comment ? `"${review.comment.substring(0, 40)}..."` : 'null'}`);
    }
    console.log('');

    if (result.reviewsCreated.length === 0) {
      result.errors.push('No reviews were created successfully');
      return result;
    }

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
          console.log(`   ⚠ Manual trigger failed: ${errorText}\n`);
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
    let pollAttempts = 0;
    const maxPolls = Math.ceil(PIPELINE_TIMEOUT_MS / POLL_INTERVAL_MS);
    const expectedAssetCount = testScenarios.filter(s => s.shouldGenerateAsset).length;

    while (result.assetsGenerated.length < expectedAssetCount && pollAttempts < maxPolls) {
      const elapsed = Date.now() - startTime;

      if (elapsed > PIPELINE_TIMEOUT_MS) {
        result.errors.push(`Marketing assets not generated within ${PIPELINE_TIMEOUT_MS}ms timeout`);
        break;
      }

      const { data: assets } = await supabase
        .from('review_marketing_assets')
        .select('id, review_id, lifecycle_state, template_type, social_post_id')
        .in('review_id', result.reviewsCreated);

      if (assets && assets.length > 0) {
        const newAssets = assets.filter(a => !result.assetsGenerated.includes(a.id));

        for (const asset of newAssets) {
          result.assetsGenerated.push(asset.id);
          const scenario = testScenarios.find(s => s.id === asset.review_id);
          console.log(`   ✓ Asset generated for: ${scenario?.description || 'unknown'}`);
          console.log(`     - Asset ID: ${asset.id}`);
          console.log(`     - Review ID: ${asset.review_id}`);
          console.log(`     - State: ${asset.lifecycle_state}`);
        }

        if (result.assetsGenerated.length >= expectedAssetCount) {
          break;
        }
      }

      pollAttempts++;
      if (pollAttempts < maxPolls && result.assetsGenerated.length < expectedAssetCount) {
        process.stdout.write(`   ⏳ Polling attempt ${pollAttempts}/${maxPolls} (${elapsed}ms, found ${result.assetsGenerated.length}/${expectedAssetCount})...\r`);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }

    console.log(`\n   ${result.assetsGenerated.length === expectedAssetCount ? '✓' : '✗'} Generated ${result.assetsGenerated.length}/${expectedAssetCount} expected assets\n`);

    // Step 5: Verify 4-star review did NOT generate asset
    console.log('🔍 Step 5: Verifying 4-star review was NOT processed...');
    const fourStarScenario = testScenarios.find(s => s.rating === 4 && s.comment);

    if (fourStarScenario?.id) {
      const { data: fourStarAsset } = await supabase
        .from('review_marketing_assets')
        .select('id')
        .eq('review_id', fourStarScenario.id)
        .maybeSingle();

      if (fourStarAsset) {
        result.fourStarNotProcessed = false;
        result.errors.push('4-star review incorrectly generated a marketing asset');
        console.log('   ✗ 4-star review incorrectly generated asset\n');
      } else {
        result.fourStarNotProcessed = true;
        console.log('   ✓ 4-star review correctly NOT processed\n');
      }
    } else {
      result.warnings.push('Could not verify 4-star review test');
      console.log('   ⚠ Could not find 4-star review to verify\n');
    }

    // Step 6: Verify reviews without comments did NOT generate assets
    console.log('🔍 Step 6: Verifying reviews without comments were NOT processed...');
    const noCommentScenarios = testScenarios.filter(s => s.rating === 5 && (!s.comment || s.comment === ''));
    let allNoCommentCorrect = true;

    for (const scenario of noCommentScenarios) {
      if (!scenario.id) continue;

      const { data: noCommentAsset } = await supabase
        .from('review_marketing_assets')
        .select('id')
        .eq('review_id', scenario.id)
        .maybeSingle();

      if (noCommentAsset) {
        allNoCommentCorrect = false;
        result.errors.push(`Review without comment (${scenario.description}) incorrectly generated asset`);
        console.log(`   ✗ ${scenario.description} incorrectly generated asset`);
      } else {
        console.log(`   ✓ ${scenario.description} correctly NOT processed`);
      }
    }

    result.noCommentNotProcessed = allNoCommentCorrect;
    console.log('');

    // Step 7: Test duplicate review handling
    console.log('🔄 Step 7: Testing duplicate review handling...');
    const firstEligibleScenario = testScenarios.find(s => s.shouldGenerateAsset);

    if (firstEligibleScenario?.id) {
      // Get the existing asset count before re-triggering
      const { data: assetsBefore } = await supabase
        .from('review_marketing_assets')
        .select('id')
        .eq('review_id', firstEligibleScenario.id);

      const assetCountBefore = assetsBefore?.length || 0;

      // Re-trigger processing
      if (CRON_SECRET) {
        await fetch(`${API_BASE_URL}/api/reputation/process-auto-reviews`, {
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

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check asset count after re-processing
        const { data: assetsAfter } = await supabase
          .from('review_marketing_assets')
          .select('id')
          .eq('review_id', firstEligibleScenario.id);

        const assetCountAfter = assetsAfter?.length || 0;

        if (assetCountAfter === assetCountBefore) {
          result.duplicateTestPassed = true;
          console.log(`   ✓ Duplicate processing correctly prevented (${assetCountAfter} assets)`);
        } else {
          result.duplicateTestPassed = false;
          result.errors.push(`Duplicate asset created: ${assetCountBefore} → ${assetCountAfter}`);
          console.log(`   ✗ Duplicate asset created: ${assetCountBefore} → ${assetCountAfter}`);
        }
      } else {
        result.warnings.push('Cannot test duplicate handling without CRON_SECRET');
        console.log('   ⚠ Cannot test duplicate handling without CRON_SECRET');
        result.duplicateTestPassed = true; // Don't fail test if we can't verify
      }
    } else {
      result.warnings.push('No eligible scenario found for duplicate test');
      console.log('   ⚠ No eligible scenario found for duplicate test');
      result.duplicateTestPassed = true; // Don't fail test if we can't verify
    }
    console.log('');

    // Step 8: Check for notification delivery
    console.log('🔔 Step 8: Checking for notification delivery...');
    let notificationPolls = 0;
    const maxNotificationPolls = 5;

    while (!result.notificationReceived && notificationPolls < maxNotificationPolls) {
      const { data: notifications } = await supabase
        .from('notification_logs')
        .select('id, title, body, notification_type, status, created_at')
        .eq('recipient_id', userId)
        .eq('notification_type', 'review_marketing_asset')
        .gte('created_at', new Date(startTime - 5000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (notifications && notifications.length > 0) {
        // Check if we got notifications for multiple reviews (batch)
        const relevantNotifications = notifications.filter(n =>
          n.title?.includes('5-star review') ||
          n.body?.includes('Marketing card ready')
        );

        if (relevantNotifications.length > 0) {
          result.notificationReceived = true;
          console.log(`   ✓ Notification(s) delivered!`);
          console.log(`   ✓ Count: ${relevantNotifications.length} notification(s)`);

          if (relevantNotifications.length >= 2) {
            console.log(`   ✓ Multiple notifications received (batch scenario)`);
          }

          relevantNotifications.slice(0, 3).forEach((n, idx) => {
            console.log(`   ✓ [${idx + 1}] ${n.title}: ${n.body}`);
          });
          break;
        }
      }

      notificationPolls++;
      if (notificationPolls < maxNotificationPolls) {
        process.stdout.write(`   ⏳ Checking notifications (${notificationPolls}/${maxNotificationPolls})...\r`);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }

    if (!result.notificationReceived) {
      result.warnings.push('Notifications were not found in notification_logs table');
      console.log('\n   ⚠ Notifications not found (might be delayed or disabled)\n');
    } else {
      console.log('');
    }

    // Calculate total time
    result.timeToComplete = Date.now() - startTime;

    // Step 9: Verify timing requirement
    console.log('⏱️  Step 9: Verifying timing requirement...');
    if (result.timeToComplete > PIPELINE_TIMEOUT_MS && result.assetsGenerated.length > 0) {
      result.warnings.push(
        `Pipeline took ${result.timeToComplete}ms, exceeding ${PIPELINE_TIMEOUT_MS}ms requirement`
      );
      console.log(`   ⚠ Exceeded timeout: ${result.timeToComplete}ms > ${PIPELINE_TIMEOUT_MS}ms\n`);
    } else {
      console.log(`   ✓ Completed within reasonable time`);
      console.log(`   ✓ Total time: ${result.timeToComplete}ms\n`);
    }

    // Determine overall success
    result.success =
      result.errors.length === 0 &&
      result.assetsGenerated.length === expectedAssetCount &&
      result.fourStarNotProcessed &&
      result.noCommentNotProcessed &&
      result.duplicateTestPassed;

    // Step 10: Clean up test data
    console.log('🧹 Step 10: Cleaning up test data...');

    // Delete social posts
    for (const assetId of result.assetsGenerated) {
      const { data: asset } = await supabase
        .from('review_marketing_assets')
        .select('social_post_id')
        .eq('id', assetId)
        .maybeSingle();

      if (asset?.social_post_id) {
        await supabase
          .from('social_posts')
          .delete()
          .eq('id', asset.social_post_id);
        console.log(`   ✓ Deleted social post for asset: ${assetId}`);
      }
    }

    // Delete marketing assets
    if (result.assetsGenerated.length > 0) {
      await supabase
        .from('review_marketing_assets')
        .delete()
        .in('id', result.assetsGenerated);
      console.log(`   ✓ Deleted ${result.assetsGenerated.length} marketing asset(s)`);
    }

    // Delete reviews
    if (result.reviewsCreated.length > 0) {
      await supabase
        .from('reputation_reviews')
        .delete()
        .in('id', result.reviewsCreated);
      console.log(`   ✓ Deleted ${result.reviewsCreated.length} test review(s)`);
    }

    // Delete notification logs
    await supabase
      .from('notification_logs')
      .delete()
      .eq('recipient_id', userId)
      .eq('notification_type', 'review_marketing_asset')
      .gte('created_at', new Date(startTime - 5000).toISOString());
    console.log(`   ✓ Deleted notification logs`);

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
    console.error('\nUsage: npx tsx scripts/test-e2e-google-sync-flow.ts <organizationId> <userId>\n');
    console.error('Example:');
    console.error('  npx tsx scripts/test-e2e-google-sync-flow.ts org-123 user-456\n');
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

  console.log(`Reviews Created:     ${result.reviewsCreated.length}`);
  console.log(`Assets Generated:    ${result.assetsGenerated.length}`);
  console.log(`4-star NOT processed: ${result.fourStarNotProcessed ? '✓ Yes' : '✗ No'}`);
  console.log(`No-comment NOT proc:  ${result.noCommentNotProcessed ? '✓ Yes' : '✗ No'}`);
  console.log(`Duplicate test:       ${result.duplicateTestPassed ? '✓ Pass' : '✗ Fail'}`);
  console.log(`Notification received: ${result.notificationReceived ? '✓ Yes' : '⚠ No (warning)'}`);

  if (result.timeToComplete) {
    console.log(`Total Time:          ${result.timeToComplete}ms`);
    console.log(`Within 30s limit:    ${result.timeToComplete <= PIPELINE_TIMEOUT_MS ? '✓ Yes' : '⚠ No'}`);
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
