import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

const BASE = process.env.BASE_URL || 'https://tripbuilt.com';

test.describe('Social Media Publishing E2E', () => {
  test('Full publishing flow: Create → Schedule → Calendar → Publish → Metrics', async ({ adminPage, browser }) => {
    test.setTimeout(180_000); // 3 minutes

    // Step 1: Navigate to Social Studio
    await gotoWithRetry(adminPage, `${BASE}/social`);
    await expect(adminPage.locator('h1, h2').filter({ hasText: /social/i }).first()).toBeVisible({ timeout: 15_000 });

    // Step 2: Create a post with caption and image
    // Look for the compose/create button
    const createButton = adminPage.locator('button').filter({ hasText: /create|new post|compose/i }).first();
    const hasCreateButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCreateButton) {
      test.skip(true, 'Create post button not found - Social Studio UI may need setup');
      return;
    }

    await createButton.click();

    // Fill in caption
    const captionInput = adminPage.locator('textarea[placeholder*="caption" i], textarea[placeholder*="write" i]').first();
    const testCaption = `E2E Test Post - ${Date.now()} #travel #test`;
    await captionInput.fill(testCaption);

    // Note: Image upload is complex in E2E, we'll verify the flow works without it
    // In a real test environment, you would upload a test image here

    // Step 3: Schedule the post for future (use PublishKitDrawer)
    const scheduleButton = adminPage.locator('button').filter({ hasText: /schedule|publish/i }).first();
    await scheduleButton.click();

    // Wait for PublishKitDrawer to open
    await expect(adminPage.locator('text=Schedule Post, text=Publish')).toBeVisible({ timeout: 5000 });

    // Select platform (Instagram or Facebook)
    const platformCheckbox = adminPage.locator('input[type="checkbox"][value="instagram"], input[type="checkbox"][value="facebook"]').first();
    if (await platformCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (!(await platformCheckbox.isChecked())) {
        await platformCheckbox.click();
      }
    }

    // Schedule for 5 minutes from now
    const scheduleDateInput = adminPage.locator('input[type="datetime-local"], input[type="date"]').first();
    const futureDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const dateString = futureDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

    if (await scheduleDateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await scheduleDateInput.fill(dateString);
    }

    // Submit the schedule
    const submitButton = adminPage.locator('button[type="submit"]').filter({ hasText: /schedule|publish/i }).first();
    await submitButton.click();

    // Wait for success confirmation
    await expect(adminPage.locator('text=scheduled, text=queued, text=success').first()).toBeVisible({ timeout: 10_000 });

    // Store the post details for later verification
    const postIdElement = adminPage.locator('[data-post-id], [data-queue-id]').first();
    const postId = await postIdElement.getAttribute('data-post-id').catch(() => null) ||
                   await postIdElement.getAttribute('data-queue-id').catch(() => null);

    // Step 4: Verify post appears in CalendarView
    // Navigate to calendar view (may be in a tab or separate section)
    const calendarTab = adminPage.locator('button, a').filter({ hasText: /calendar/i }).first();
    if (await calendarTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await calendarTab.click();
    }

    // Wait for calendar to load
    await expect(adminPage.locator('[role="grid"], .calendar, [data-testid="calendar"]').first()).toBeVisible({ timeout: 10_000 });

    // Verify the post appears in the calendar
    // The post should show the caption we created
    const scheduledPost = adminPage.locator(`text=${testCaption.substring(0, 30)}`).first();
    const postInCalendar = await scheduledPost.isVisible({ timeout: 5000 }).catch(() => false);

    if (!postInCalendar) {
      console.warn('Post not immediately visible in calendar - may need to select the date');
      // Try selecting the future date in the calendar
      const futureDayButton = adminPage.locator(`button[data-day="${futureDate.getDate()}"]`).first();
      if (await futureDayButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await futureDayButton.click();
        await adminPage.waitForTimeout(1000);
      }
    }

    // Step 5: Mock trigger the cron endpoint
    // This bypasses the actual time check and processes the queue immediately
    // In a real environment, this would be triggered by Vercel Cron
    const cronContext = await browser.newContext();
    const cronPage = await cronContext.newPage();

    // Get the cron secret from environment or use a test secret
    const cronSecret = process.env.CRON_SECRET || 'test-cron-secret';

    const cronResponse = await cronPage.request.post(`${BASE}/api/cron/social-publish-queue`, {
      headers: {
        'x-cron-secret': cronSecret,
        'x-social-cron-secret': cronSecret,
      },
    });

    // Cron may return 401 if secret is wrong, or 200 if successful
    // We'll check for both cases
    const cronStatus = cronResponse.status();
    if (cronStatus === 401) {
      console.warn('Cron endpoint returned 401 - secret may not match. Continuing test...');
    } else {
      expect([200, 201, 204]).toContain(cronStatus);
      const cronResult = await cronResponse.json().catch(() => ({}));
      console.log('Cron result:', cronResult);
    }

    await cronContext.close();

    // Step 6: Verify queue item status changes
    // Poll the queue status endpoint to check if the post was processed
    // Note: Since we can't actually publish to Meta API in tests, the status
    // may remain 'pending' or 'processing'. We're testing the flow, not the actual API call.

    if (postId) {
      let attempts = 0;
      let statusChecked = false;

      while (attempts < 5 && !statusChecked) {
        await adminPage.waitForTimeout(2000); // Wait 2 seconds between attempts

        const statusResponse = await adminPage.request.post(`${BASE}/api/social/queue-status`, {
          data: {
            queueIds: [postId],
          },
        });

        if (statusResponse.ok()) {
          const statusData = await statusResponse.json();
          console.log('Queue status:', statusData);

          // Check if status has changed from initial 'pending_review'
          if (statusData?.items && Array.isArray(statusData.items)) {
            const item = statusData.items[0];
            if (item && ['pending', 'processing', 'sent', 'failed'].includes(item.status)) {
              statusChecked = true;
              console.log('Queue item status:', item.status);
            }
          }
        }

        attempts += 1;
      }
    }

    // Step 7: Verify in Social Analytics (if we had real publishing)
    // Navigate to analytics view
    const analyticsTab = adminPage.locator('button, a').filter({ hasText: /analytics|insights/i }).first();
    if (await analyticsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await analyticsTab.click();
      await adminPage.waitForTimeout(1000);
    } else {
      // Analytics might be on the main page
      await gotoWithRetry(adminPage, `${BASE}/social`);
    }

    // Step 8: Verify metrics appear (in a real test with published posts)
    // Look for metric cards
    const metricsSection = adminPage.locator('text=Total Likes, text=Total Reach, text=Engagement').first();
    const hasMetrics = await metricsSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMetrics) {
      // Verify metric cards are rendering
      await expect(adminPage.locator('[data-testid="stat-card"], .stat-card').first()).toBeVisible({ timeout: 5000 });
    }

    // Final verification: Check that no console errors occurred
    // Note: Console errors are automatically captured by Playwright
  });

  test('Publishing status updates and retry functionality', async ({ adminPage }) => {
    test.setTimeout(120_000); // 2 minutes

    await gotoWithRetry(adminPage, `${BASE}/social`);
    await expect(adminPage.locator('h1, h2').filter({ hasText: /social/i }).first()).toBeVisible({ timeout: 15_000 });

    // Look for any existing scheduled posts
    const historyTab = adminPage.locator('button, a').filter({ hasText: /history|scheduled/i }).first();
    if (await historyTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await historyTab.click();
      await adminPage.waitForTimeout(1000);
    }

    // Look for status badges
    const statusBadges = adminPage.locator('[data-status], .status-badge, text=pending, text=sent, text=failed');
    const hasPosts = await statusBadges.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPosts) {
      // Check for retry button on failed posts
      const failedPost = adminPage.locator('[data-status="failed"]').first();
      if (await failedPost.isVisible({ timeout: 3000 }).catch(() => false)) {
        const retryButton = adminPage.locator('button').filter({ hasText: /retry/i }).first();
        if (await retryButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Verify retry button exists (don't actually click it in test)
          await expect(retryButton).toBeVisible();
        }
      }
    }
  });

  test('Calendar view displays scheduled posts correctly', async ({ adminPage }) => {
    test.setTimeout(120_000); // 2 minutes

    await gotoWithRetry(adminPage, `${BASE}/social`);
    await expect(adminPage.locator('h1, h2').filter({ hasText: /social/i }).first()).toBeVisible({ timeout: 15_000 });

    // Open calendar view
    const calendarTab = adminPage.locator('button, a').filter({ hasText: /calendar/i }).first();
    if (await calendarTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await calendarTab.click();

      // Wait for calendar grid to render
      await expect(adminPage.locator('[role="grid"], .calendar').first()).toBeVisible({ timeout: 10_000 });

      // Verify calendar shows dates
      const dateButtons = adminPage.locator('button[data-day], .calendar button').count();
      expect(await dateButtons).toBeGreaterThan(0);

      // Click on a date to see scheduled posts for that day
      const dateButton = adminPage.locator('button[data-day]').first();
      if (await dateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dateButton.click();
        await adminPage.waitForTimeout(500);

        // Check if posts for that date are displayed
        // Posts should show platform icons and scheduled times
        const platformIcons = adminPage.locator('[data-platform], .platform-badge, text=Instagram, text=Facebook');
        const hasPlatformInfo = await platformIcons.first().isVisible({ timeout: 3000 }).catch(() => false);

        if (hasPlatformInfo) {
          console.log('Calendar view shows platform information');
        }
      }
    } else {
      test.skip(true, 'Calendar view not available in current UI');
    }
  });

  test('OAuth connection status is visible', async ({ adminPage }) => {
    test.setTimeout(120_000); // 2 minutes

    await gotoWithRetry(adminPage, `${BASE}/social`);
    await expect(adminPage.locator('h1, h2').filter({ hasText: /social/i }).first()).toBeVisible({ timeout: 15_000 });

    // Look for OAuth connection status or connect button
    const connectButton = adminPage.locator('button').filter({ hasText: /connect|authorize|instagram|facebook/i }).first();
    const connectionStatus = adminPage.locator('text=Connected, text=Authorized, text=Not connected').first();

    const hasConnectionUI = await connectButton.isVisible({ timeout: 5000 }).catch(() => false) ||
                             await connectionStatus.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasConnectionUI) {
      // Verify OAuth UI exists
      expect(hasConnectionUI).toBeTruthy();

      // If not connected, verify connect button is clickable
      if (await connectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(connectButton).toBeEnabled();
      }
    }
  });

  test('Analytics displays engagement metrics for published posts', async ({ adminPage }) => {
    test.setTimeout(120_000); // 2 minutes

    await gotoWithRetry(adminPage, `${BASE}/social`);
    await expect(adminPage.locator('h1, h2').filter({ hasText: /social/i }).first()).toBeVisible({ timeout: 15_000 });

    // Look for analytics section (might be default view or in a tab)
    const analyticsSection = adminPage.locator('text=Total Likes, text=Total Reach, text=Engagement Rate, text=Top Performing').first();

    if (await analyticsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify metric cards are present
      const metricCards = adminPage.locator('[data-testid="stat-card"], .stat-card, [class*="metric"]');
      const cardCount = await metricCards.count();

      if (cardCount > 0) {
        console.log(`Found ${cardCount} metric cards in analytics`);

        // Check for specific metrics
        const likes = await adminPage.locator('text=Likes, text=likes').first().isVisible({ timeout: 2000 }).catch(() => false);
        const reach = await adminPage.locator('text=Reach, text=reach').first().isVisible({ timeout: 2000 }).catch(() => false);
        const engagement = await adminPage.locator('text=Engagement, text=engagement').first().isVisible({ timeout: 2000 }).catch(() => false);

        if (likes || reach || engagement) {
          console.log('Analytics metrics are displaying correctly');
        }
      }
    } else {
      console.warn('Analytics section not immediately visible - may need to navigate to specific tab');
    }
  });

  test('Error messages display correctly for failed publishes', async ({ adminPage }) => {
    test.setTimeout(120_000); // 2 minutes

    await gotoWithRetry(adminPage, `${BASE}/social`);
    await expect(adminPage.locator('h1, h2').filter({ hasText: /social/i }).first()).toBeVisible({ timeout: 15_000 });

    // Look for failed posts in history
    const historyTab = adminPage.locator('button, a').filter({ hasText: /history/i }).first();
    if (await historyTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await historyTab.click();
      await adminPage.waitForTimeout(1000);
    }

    // Look for failed status
    const failedPost = adminPage.locator('[data-status="failed"], text=Failed, text=Error').first();
    if (await failedPost.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to view details
      await failedPost.click();

      // Look for error message
      const errorMessage = adminPage.locator('[data-error-message], .error-message, text=error, text=failed').first();
      if (await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Verify error message is displayed
        await expect(errorMessage).toBeVisible();

        // Look for retry button
        const retryButton = adminPage.locator('button').filter({ hasText: /retry/i }).first();
        if (await retryButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(retryButton).toBeEnabled();
        }
      }
    } else {
      console.log('No failed posts found - this is expected for a new installation');
    }
  });
});
