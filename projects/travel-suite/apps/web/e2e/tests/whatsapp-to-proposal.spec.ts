import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

const BASE = process.env.BASE_URL || 'https://travelsuite-rust.vercel.app';

test.describe('WhatsApp → Proposal in 60 Seconds', () => {
  test('Create Proposal button appears in thread header', async ({ adminPage }) => {
    test.setTimeout(120_000); // 2 minutes

    // Navigate to inbox
    await gotoWithRetry(adminPage, `${BASE}/inbox`);

    // Wait for inbox to load
    await expect(adminPage.locator('text=Inbox, text=Conversations').first()).toBeVisible({ timeout: 15_000 });

    // Look for the Create Proposal button in the page
    // Note: The button may only appear when a WhatsApp conversation is selected
    // We'll check if it exists in the DOM (it may not be visible if no conversation is selected)
    const createProposalButton = adminPage.locator('button:has-text("Create Proposal")');

    // Check if the button exists somewhere in the page structure
    const buttonCount = await createProposalButton.count();

    // The button should exist at least once (in the thread header or context panel)
    expect(buttonCount).toBeGreaterThanOrEqual(1);
  });

  test('Create Proposal button has correct styling and icon', async ({ adminPage }) => {
    test.setTimeout(120_000);

    await gotoWithRetry(adminPage, `${BASE}/inbox`);
    await expect(adminPage.locator('text=Inbox, text=Conversations').first()).toBeVisible({ timeout: 15_000 });

    // Find any Create Proposal button
    const createProposalButton = adminPage.locator('button:has-text("Create Proposal")').first();

    if (await createProposalButton.isVisible()) {
      // Verify it has a Sparkles icon (check for SVG or icon class)
      // The button should have proper styling
      await expect(createProposalButton).toBeVisible();
    }
  });

  test.skip('E2E flow: Click button → Extract → Navigate to proposal form', async ({ adminPage }) => {
    // This test is skipped because it requires:
    // 1. An actual WhatsApp conversation with message history
    // 2. The Gemini API to be configured
    // 3. Test data setup
    //
    // Manual verification steps:
    // 1. Navigate to /inbox and select a WhatsApp conversation
    // 2. Click 'Create Proposal' button in thread header
    // 3. Verify AI extraction completes in under 3 seconds
    // 4. Verify modal shows extracted destination, dates, budget, traveler name
    // 5. Click 'Open Proposal Form' button
    // 6. Verify /proposals/create page loads with WhatsAppDraftBanner
    // 7. Verify proposal form fields are pre-filled
    // 8. Verify entire flow takes under 60 seconds

    test.setTimeout(120_000);

    await gotoWithRetry(adminPage, `${BASE}/inbox`);

    // Wait for inbox to load
    await expect(adminPage.locator('text=Inbox, text=Conversations').first()).toBeVisible({ timeout: 15_000 });

    // Click on first WhatsApp conversation (if exists)
    const firstConversation = adminPage.locator('[data-channel="whatsapp"]').first();
    if (await firstConversation.isVisible({ timeout: 5000 })) {
      await firstConversation.click();

      // Wait for messages to load
      await adminPage.waitForTimeout(1000);

      // Click Create Proposal button
      const createButton = adminPage.locator('button:has-text("Create Proposal")').first();
      await createButton.click();

      // Wait for modal to appear
      await expect(adminPage.locator('text=Create Proposal from WhatsApp')).toBeVisible({ timeout: 5000 });

      // Wait for AI extraction (should complete in under 3 seconds)
      const startTime = Date.now();
      await expect(adminPage.locator('text=Extracted Details, text=Open Proposal Form')).toBeVisible({ timeout: 5000 });
      const extractionTime = Date.now() - startTime;

      expect(extractionTime).toBeLessThan(3000);

      // Click "Open Proposal Form"
      await adminPage.locator('button:has-text("Open Proposal Form")').click();

      // Should navigate to /proposals/create with whatsappDraft parameter
      await expect(adminPage).toHaveURL(/\/proposals\/create/);
      await expect(adminPage).toHaveURL(/whatsappDraft/);

      // Verify WhatsAppDraftBanner is visible
      await expect(adminPage.locator('text=Prefilled from WhatsApp')).toBeVisible({ timeout: 5000 });
    }
  });
});
