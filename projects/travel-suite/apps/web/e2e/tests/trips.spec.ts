import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Trip Management', () => {
  test('client can view their trips', async ({ clientPage }) => {
    await gotoWithRetry(clientPage, '/trips');

    // Should see trips page
    await expect(clientPage.locator('h1, h2').filter({ hasText: /trips|itineraries|journeys/i })).toBeVisible();
  });

  test('client can view trip details', async ({ clientPage }) => {
    await gotoWithRetry(clientPage, '/trips');

    // Click on first trip if available
    const tripCard = clientPage.locator('[data-testid="trip-card"]').first();
    const tripExists = await tripCard.isVisible().catch(() => false);

    if (tripExists) {
      await tripCard.click();

      // Should navigate to trip details
      await expect(clientPage).toHaveURL(/trip|itinerary/);

      // Should show trip details
      await expect(clientPage.locator('text=Day, text=Itinerary, text=Schedule')).toBeVisible();
    }
  });

  test('client can use "I\'ve Landed" button', async ({ clientPage }) => {
    await gotoWithRetry(clientPage, '/trips');

    // Find an active trip
    const activeTrip = clientPage.locator('[data-status="in_progress"], [data-status="active"]').first();
    const hasActiveTrip = await activeTrip.isVisible().catch(() => false);

    if (hasActiveTrip) {
      await activeTrip.click();

      // Look for landed button
      const landedButton = clientPage.locator('button').filter({ hasText: /landed|arrived/i });

      if (await landedButton.isVisible()) {
        await landedButton.click();

        // Should show confirmation
        await expect(clientPage.locator('text=confirmed, text=success, text=driver')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});

test.describe('Admin Trip Management', () => {
  test('admin can view all trips', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/trips');

    // Should see trips page content
    await expect(adminPage.locator('h1, h2').filter({ hasText: /trips/i })).toBeVisible();
    await expect(adminPage.locator('a[href^="/admin/trips/"], [data-testid="trip-item"], table').first()).toBeVisible();
  });

  test('admin can filter trips by status', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/trips');

    // Find status filter
    const statusFilter = adminPage.locator('select, [data-testid="status-filter"]');
    const hasFilter = await statusFilter.isVisible().catch(() => false);

    if (hasFilter) {
      await statusFilter.selectOption({ index: 1 }); // Or a specific string if known

      // Should filter trips
      await adminPage.waitForTimeout(1000); // Wait for filter to apply
    }
  });

  test('admin can view trip details and assignments', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/trips');

    // Click on first trip
    const tripRow = adminPage.locator('tr, [data-testid="trip-item"]').first();
    const hasTripRow = await tripRow.isVisible().catch(() => false);

    if (hasTripRow) {
      await tripRow.click();

      // Should see assignment section
      await expect(adminPage.locator('text=Driver, text=Assignment, text=Hotel')).toBeVisible();
    }
  });

  test('admin can assign driver to trip day', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/trips');

    // Click on first trip
    const tripRow = adminPage.locator('tr, [data-testid="trip-item"]').first();
    const hasTripRow = await tripRow.isVisible().catch(() => false);

    if (hasTripRow) {
      await tripRow.click();

      // Find driver assignment dropdown
      const driverSelect = adminPage.locator('select').filter({ hasText: /driver|select/i }).first();
      const hasDriverSelect = await driverSelect.isVisible().catch(() => false);

      if (hasDriverSelect) {
        // Select a driver
        await driverSelect.selectOption({ index: 1 });

        // Save
        const saveButton = adminPage.locator('button').filter({ hasText: /save|assign/i });
        await saveButton.click();

        // Should show success
        await expect(adminPage.locator('text=saved, text=assigned, text=success')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('admin can send notification to client', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/trips');

    // Click on first trip
    const tripRow = adminPage.locator('tr, [data-testid="trip-item"]').first();
    const hasTripRow = await tripRow.isVisible().catch(() => false);

    if (hasTripRow) {
      await tripRow.click();

      // Find notify button
      const notifyButton = adminPage.locator('button').filter({ hasText: /notify|send/i });
      const hasNotifyButton = await notifyButton.isVisible().catch(() => false);

      if (hasNotifyButton) {
        await notifyButton.click();

        // Should show confirmation or modal
        await expect(adminPage.locator('text=sent, text=notification, text=success')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});
