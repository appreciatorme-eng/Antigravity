import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Admin Create Flows (prod)', () => {
  test.skip(process.env.E2E_TARGET !== 'prod', 'Runs only for production integration checks');

  test('admin can create client, tour template, and proposal', async ({ adminPage }) => {
    test.setTimeout(180_000);

    // Tour template creation triggers window.alert().
    adminPage.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const uniq = Date.now();
    const clientName = `E2E Client ${uniq}`;
    const clientEmail = `e2e-client-${uniq}@gobuddy.test`;
    const templateName = `E2E Template ${uniq}`;
    const templateDestination = 'Dubai, UAE';

    // 1) Create client (and ensure it also becomes a row in `clients` table).
    await gotoWithRetry(adminPage, '/admin/clients');
    await adminPage.getByRole('button', { name: /add client/i }).click();
    await adminPage.getByLabel(/full name/i).fill(clientName);
    await adminPage.getByLabel(/^email$/i).fill(clientEmail);
    await adminPage.getByRole('button', { name: /create client/i }).click();
    await expect(adminPage.getByText(clientEmail).first()).toBeVisible({ timeout: 20_000 });

    // 2) Create tour template (required for proposal creation).
    await gotoWithRetry(adminPage, '/admin/tour-templates/create');
    await adminPage.locator('input[placeholder*="Classic Dubai" i]').fill(templateName);
    await adminPage.locator('input[placeholder*="Dubai, UAE" i]').fill(templateDestination);

    // Expand Day 1 and provide minimal content.
    await adminPage.getByText(/day 1:/i).first().click();
    await adminPage.locator('input[placeholder*="Arrival" i]').fill('Arrival & City Highlights');
    await adminPage.locator('textarea[placeholder*="Brief overview of this day" i]').fill('Arrive, settle in, and explore key landmarks.');

    await adminPage.getByRole('button', { name: /save template/i }).click();
    await expect(adminPage).toHaveURL(/\/admin\/tour-templates/);

    // 3) Create proposal using the new client + template.
    await gotoWithRetry(adminPage, '/admin/proposals/create');
    const selects = adminPage.locator('select');
    const clientSelect = selects.first();
    const templateSelect = selects.nth(1);

    await clientSelect.selectOption({ label: `${clientName} (${clientEmail})` });
    await templateSelect.selectOption({ label: `${templateName} - ${templateDestination} (5 days)` });

    await adminPage.getByRole('button', { name: /create proposal/i }).click();
    await expect(adminPage).toHaveURL(/\/admin\/proposals\/[0-9a-f-]+/i, { timeout: 30_000 });

    // Basic render check on the proposal page.
    await expect(adminPage.locator('h1, h2').filter({ hasText: /proposal/i })).toBeVisible({ timeout: 30_000 });
  });
});

