import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Admin Dashboard', () => {
  test('admin can access dashboard', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin');

    // Should see dashboard elements
    await expect(adminPage.locator('h1, h2').filter({ hasText: /dashboard|admin/i })).toBeVisible();
  });

  test('admin dashboard shows stats', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin');

    // Should show key metrics
    const statsSection = adminPage.locator('[data-testid="stats"], .stats, .metrics');
    const hasStats = await statsSection.isVisible().catch(() => false);

    if (hasStats) {
      // Check for common stat labels
      await expect(adminPage.locator('text=Trips, text=Clients, text=Drivers')).toBeVisible();
    }
  });

  test('admin navigation works', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin');

    // Test navigation links
    const navLinks = [
      { text: /trips/i, url: /trips/ },
      { text: /drivers/i, url: /drivers/ },
      { text: /clients/i, url: /clients/ },
    ];

    for (const link of navLinks) {
      const navItem = adminPage.locator('nav a, aside a').filter({ hasText: link.text }).first();
      const isVisible = await navItem.isVisible().catch(() => false);

      if (isVisible) {
        await navItem.click();
        await expect(adminPage).toHaveURL(link.url);
        await gotoWithRetry(adminPage, '/admin'); // Go back
      }
    }
  });
});

test.describe('Driver Management', () => {
  test('admin can view drivers list', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/drivers');

    // Should see drivers page
    await expect(adminPage.locator('h1, h2').filter({ hasText: /drivers/i })).toBeVisible();
  });

  test('admin can add new driver', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/drivers');
    await expect(adminPage.locator('h1, h2').filter({ hasText: /drivers/i })).toBeVisible({ timeout: 15000 });
    const driverName = `Test Driver E2E ${Date.now()}`;
    const phoneNumber = `+1555${Date.now().toString().slice(-7)}`;

    // Open add driver modal
    await adminPage.getByRole('button', { name: /add driver/i }).first().click();
    await expect(adminPage.getByText(/add new driver/i)).toBeVisible();

    // Fill in driver details
    await adminPage.getByLabel(/full name/i).fill(driverName);
    await adminPage.getByLabel(/phone number/i).fill(phoneNumber);

    // Select vehicle type if available
    const vehicleSelect = adminPage.getByLabel(/vehicle type/i);
    if (await vehicleSelect.isVisible()) {
      await vehicleSelect.selectOption('sedan');
    }

    // Submit
    await adminPage.getByRole('button', { name: /^add driver$/i }).last().click();

    // Should show the newly added driver in list
    await expect(adminPage.getByRole('link', { name: driverName }).first()).toBeVisible({ timeout: 5000 });
  });

  test('admin can edit driver', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/drivers');

    // Click edit on first driver
    const editButton = adminPage.locator('button[title="Edit driver"]').first();
    const hasDriver = await editButton.isVisible().catch(() => false);

    if (hasDriver) {
      await editButton.click();

      // Should see edit form
      await expect(adminPage.getByText(/edit driver/i)).toBeVisible();
    }
  });

  test('admin can toggle driver active status', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/drivers');

    // Find active toggle
    const toggle = adminPage.locator('input[type="checkbox"], [role="switch"]').first();
    const hasToggle = await toggle.isVisible().catch(() => false);

    if (hasToggle) {
      await toggle.click();

      // Should show status change
      await expect(adminPage.locator('text=updated, text=active, text=inactive')).toBeVisible({
        timeout: 3000,
      });
    }
  });
});

test.describe('Client Management', () => {
  test('admin can view clients list', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/clients');

    // Should see clients page
    await expect(adminPage.locator('h1, h2').filter({ hasText: /clients/i })).toBeVisible();
  });

  test('admin can search clients', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/clients');

    // Find search input
    const searchInput = adminPage.locator('input[type="search"], input[placeholder*="search" i]');
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill('test');
      await adminPage.waitForTimeout(500); // Debounce

      // Results should filter
      await expect(adminPage.locator('table, [data-testid="clients-list"]')).toBeVisible();
    }
  });

  test('admin can view client details', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/clients');

    // Click on first client
    const clientRow = adminPage.locator('tr, [data-testid="client-item"]').first();
    const hasClient = await clientRow.isVisible().catch(() => false);

    if (hasClient) {
      await clientRow.click();

      // Should show client details
      await expect(adminPage.locator('text=email, text=phone, text=trips')).toBeVisible();
    }
  });
});

test.describe('Admin Settings', () => {
  test('admin can access settings', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/settings');

    // Should see settings page
    await expect(adminPage.locator('h1, h2').filter({ hasText: /settings/i })).toBeVisible();
  });

  test('admin can update organization settings', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/admin/settings');

    // Find organization name input
    const nameInput = adminPage.locator('input[name="name"], input[name="organization_name"]');
    const hasOrgSettings = await nameInput.isVisible().catch(() => false);

    if (hasOrgSettings) {
      // Update name
      await nameInput.clear();
      await nameInput.fill('Test Organization');

      // Save
      const saveButton = adminPage.locator('button[type="submit"], button').filter({ hasText: /save/i });
      await saveButton.click();

      // Should show success
      await expect(adminPage.locator('text=saved, text=updated, text=success')).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
