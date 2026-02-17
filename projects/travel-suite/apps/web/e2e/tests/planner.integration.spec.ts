import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Planner Integration (prod)', () => {
  test.skip(process.env.E2E_TARGET !== 'prod', 'Runs only for production integration checks');

  test('client can generate itinerary and save it', async ({ clientPage }) => {
    test.setTimeout(300_000);

    await gotoWithRetry(clientPage, '/planner');

    // Destination field
    const destinationInput = clientPage.locator('input[placeholder*="Paris" i]');
    await expect(destinationInput).toBeVisible({ timeout: 30_000 });
    await destinationInput.fill('Paris');
    await expect(destinationInput).toHaveValue('Paris');

    // Duration (Days) input
    const daysInput = clientPage
      .locator('label', { hasText: /duration \(days\)/i })
      .locator('..')
      .locator('input[type="number"]');
    await expect(daysInput).toBeVisible({ timeout: 30_000 });
    await daysInput.fill('1');
    await expect(daysInput).toHaveValue('1');

    const generateButton = clientPage.getByRole('button', { name: /generate dream itinerary/i });
    await expect(generateButton).toBeEnabled({ timeout: 30_000 });
    await generateButton.click();

    // Wait for either success or an error toast (and fail fast if it's an error).
    const successHeader = clientPage.locator('text=Days in');
    const errorToast = clientPage.locator('div', { hasText: /failed to generate|missing google api key/i });
    await expect
      .poll(
        async () => {
          if (await errorToast.isVisible().catch(() => false)) return 'error';
          if (await successHeader.first().isVisible().catch(() => false)) return 'success';
          return 'pending';
        },
        { timeout: 210_000 }
      )
      .toBe('success');

    // Result view should render with a real duration_days, not "undefined".
    await expect(successHeader).toBeVisible({ timeout: 5_000 });
    await expect(clientPage.locator('text=undefined Days in')).toHaveCount(0);

    // Save to Supabase (tests auth + RLS + insert path).
    await clientPage.getByRole('button', { name: /save trip/i }).click();
    await expect(clientPage.getByText(/saved!/i)).toBeVisible({ timeout: 20_000 });
  });
});
