import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Planner Integration (prod)', () => {
  test.skip(process.env.E2E_TARGET !== 'prod', 'Runs only for production integration checks');

  test('client can generate itinerary and save it', async ({ clientPage }) => {
    test.setTimeout(180_000);

    await gotoWithRetry(clientPage, '/planner');

    // Destination field
    await clientPage
      .locator('input[placeholder*="Paris" i]')
      .fill(`Paris ${Date.now()}`);

    // Duration (Days) input
    const daysInput = clientPage
      .locator('label', { hasText: /duration \(days\)/i })
      .locator('..')
      .locator('input[type="number"]');
    await daysInput.fill('1');

    await clientPage.getByRole('button', { name: /generate dream itinerary/i }).click();

    // Result view should render with a real duration_days, not "undefined".
    await expect(clientPage.locator('text=Days in')).toBeVisible({ timeout: 120_000 });
    await expect(clientPage.locator('text=undefined Days in')).toHaveCount(0);

    // Save to Supabase (tests auth + RLS + insert path).
    await clientPage.getByRole('button', { name: /save trip/i }).click();
    await expect(clientPage.getByText(/saved!/i)).toBeVisible({ timeout: 20_000 });
  });
});

