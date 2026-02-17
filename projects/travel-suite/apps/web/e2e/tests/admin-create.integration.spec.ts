import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Admin Create Flows (prod)', () => {
  test.skip(process.env.E2E_TARGET !== 'prod', 'Runs only for production integration checks');

  test('admin can create client, tour template, and proposal', async ({ adminPage }) => {
    test.setTimeout(240_000);

    // Tour template creation triggers window.alert().
    const dialogMessages: string[] = [];
    adminPage.on('dialog', async (dialog) => {
      dialogMessages.push(dialog.message());
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
    const [createClientResp] = await Promise.all([
      adminPage.waitForResponse((resp) => resp.url().includes('/api/admin/clients') && resp.request().method() === 'POST'),
      adminPage.getByRole('button', { name: /create client/i }).click(),
    ]);
    expect(createClientResp.ok(), `Create client failed: ${createClientResp.status()} ${createClientResp.url()}`).toBeTruthy();
    await expect(adminPage.getByText(/create a new client profile/i)).toBeHidden({ timeout: 20_000 });

    // 2) Create tour template (required for proposal creation).
    await gotoWithRetry(adminPage, '/admin/tour-templates/create');
    await adminPage.locator('input[placeholder*="Classic Dubai" i]').fill(templateName);
    await adminPage.locator('input[placeholder*="Dubai, UAE" i]').fill(templateDestination);

    // Expand Day 1 and provide minimal content.
    await adminPage.getByText(/day 1:/i).first().click();
    await adminPage.locator('input[placeholder*="Arrival" i]').fill('Arrival & City Highlights');
    await adminPage.locator('textarea[placeholder*="Brief overview of this day" i]').fill('Arrive, settle in, and explore key landmarks.');

    await adminPage.getByRole('button', { name: /save template/i }).click();
    await expect(adminPage).toHaveURL(/\/admin\/tour-templates\/?$/);
    await expect(adminPage.getByText(templateName).first()).toBeVisible({ timeout: 20_000 });
    expect(
      dialogMessages.some((m) => /template created successfully/i.test(m)),
      `Expected template success alert, got: ${dialogMessages.join(' | ')}`
    ).toBeTruthy();

    // 3) Create proposal using the new client + template.
    await gotoWithRetry(adminPage, '/admin/proposals/create');
    const selects = adminPage.locator('select');
    const clientSelect = selects.first();
    const templateSelect = selects.nth(1);

    // Select by substring match to tolerate minor label formatting differences.
    await expect
      .poll(async () => clientSelect.locator('option').count(), { timeout: 30_000 })
      .toBeGreaterThan(1);
    const clientOption = clientSelect.locator('option', { hasText: clientName }).first();
    const clientValue = await clientOption.getAttribute('value');
    expect(clientValue, 'Expected to find newly created client in proposal dropdown').toBeTruthy();
    await clientSelect.selectOption(clientValue!);

    await expect
      .poll(async () => templateSelect.locator('option').count(), { timeout: 30_000 })
      .toBeGreaterThan(1);
    const templateOption = templateSelect.locator('option', { hasText: templateName }).first();
    const templateValue = await templateOption.getAttribute('value');
    expect(templateValue, 'Expected to find newly created template in proposal dropdown').toBeTruthy();
    await templateSelect.selectOption(templateValue!);

    await expect(adminPage.getByRole('button', { name: /create proposal/i })).toBeEnabled({ timeout: 20_000 });
    await adminPage.getByRole('button', { name: /create proposal/i }).click();
    await expect(adminPage).toHaveURL(/\/admin\/proposals\/[0-9a-f-]+/i, { timeout: 30_000 });

    // Basic render check on the proposal page.
    await expect(adminPage.locator('h1, h2').filter({ hasText: /proposal/i })).toBeVisible({ timeout: 30_000 });

    // 4) Create driver (tests another key admin create flow).
    const driverName = `E2E Driver ${uniq}`;
    const driverPhone = `+1555${uniq.toString().slice(-7)}`;
    await gotoWithRetry(adminPage, '/admin/drivers');
    await expect(adminPage.locator('h1, h2').filter({ hasText: /drivers/i })).toBeVisible({ timeout: 15_000 });

    await adminPage.getByRole('button', { name: /add driver/i }).first().click();
    await expect(adminPage.getByText(/add new driver/i)).toBeVisible({ timeout: 15_000 });
    await adminPage.getByLabel(/full name/i).fill(driverName);
    await adminPage.getByLabel(/phone number/i).fill(driverPhone);

    const vehicleSelect = adminPage.getByLabel(/vehicle type/i);
    if (await vehicleSelect.isVisible().catch(() => false)) {
      await vehicleSelect.selectOption('sedan').catch(() => {});
    }

    await adminPage.getByRole('button', { name: /^add driver$/i }).last().click();
    await expect(adminPage.getByRole('link', { name: driverName }).first()).toBeVisible({ timeout: 20_000 });
  });
});
