import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Tour Operator Workflows', () => {
    test('Complete Tour Operator Lifecycle: Client -> Template -> Add-on -> Proposal', async ({ adminPage }) => {
        test.setTimeout(300_000); // 5 minutes

        const uniq = Date.now();
        const clientName = `Workflow Client ${uniq}`;
        const clientEmail = `workflow-client-${uniq}@gobuddy.test`;
        const templateName = `Workflow Template ${uniq}`;
        const addOnName = `Workflow Add-on ${uniq}`;

        // 1. CRM: Create a Client
        await gotoWithRetry(adminPage, '/admin/clients');
        await adminPage.getByRole('button', { name: /add client/i }).click();
        await adminPage.getByLabel(/full name/i).fill(clientName);
        await adminPage.getByLabel(/^email$/i).fill(clientEmail);

        const [createClientResp] = await Promise.all([
            adminPage.waitForResponse((resp) => resp.url().includes('/api/admin/clients') && resp.request().method() === 'POST'),
            adminPage.getByRole('button', { name: /create client/i }).click(),
        ]);
        expect(createClientResp.ok()).toBeTruthy();
        await expect(adminPage.getByText(clientName)).toBeVisible({ timeout: 30_000 });

        // 2. Product: Create a Tour Template
        await gotoWithRetry(adminPage, '/admin/tour-templates');
        await adminPage.getByRole('button', { name: /create template/i }).click();

        // Fill template details
        await adminPage.locator('input[placeholder*="Classic Dubai" i]').fill(templateName);
        await adminPage.locator('input[placeholder*="Dubai, UAE" i]').fill('Test Destination');

        // Add Day 1 details
        await adminPage.getByText(/day 1:/i).first().click();
        await adminPage.locator('input[placeholder*="Arrival" i]').fill('Arrival Day');
        await adminPage.locator('textarea[placeholder*="Brief overview" i]').fill('Welcome to the tour.');

        // Save Template
        adminPage.on('dialog', async (dialog) => { await dialog.accept(); }); // Handle alerts
        await adminPage.getByRole('button', { name: /save template/i }).click();
        await expect(adminPage.getByText(templateName).first()).toBeVisible({ timeout: 30_000 });

        // 3. Upsell: Create an Add-on
        await gotoWithRetry(adminPage, '/admin/add-ons');
        await adminPage.getByRole('button', { name: /add new add-on/i }).click();

        await adminPage.getByLabel(/name/i).fill(addOnName);
        await adminPage.getByLabel(/description/i).fill('A luxury add-on experience.');
        await adminPage.getByLabel(/price/i).fill('150');
        // Select category (randomly picking one if needed, but default is usually fine)

        const [createAddOnResp] = await Promise.all([
            adminPage.waitForResponse((resp) => resp.url().includes('/api/add-ons') && resp.request().method() === 'POST'),
            adminPage.getByRole('button', { name: /^create add-on$/i }).click(),
        ]);
        expect(createAddOnResp.ok()).toBeTruthy();
        await expect(adminPage.getByText(addOnName)).toBeVisible();

        // 4. Sales: Create a Proposal
        await gotoWithRetry(adminPage, '/admin/proposals/create');

        // Select Client
        const clientSelect = adminPage.locator('select').nth(0);
        await expect.poll(async () => clientSelect.locator('option').count(), { timeout: 30_000 }).toBeGreaterThan(1);
        const clientOption = clientSelect.locator('option', { hasText: clientName }).first();
        const clientValue = await clientOption.getAttribute('value');
        await clientSelect.selectOption(clientValue!);

        // Select Template
        const templateSelect = adminPage.locator('select').nth(1);
        await expect.poll(async () => templateSelect.locator('option').count(), { timeout: 30_000 }).toBeGreaterThan(1);
        const templateOption = templateSelect.locator('option', { hasText: templateName }).first();
        const templateValue = await templateOption.getAttribute('value');
        await templateSelect.selectOption(templateValue!);

        // Create Proposal
        await adminPage.getByRole('button', { name: /create proposal/i }).click();
        await expect(adminPage).toHaveURL(/\/admin\/proposals\/[0-9a-f-]+/i, { timeout: 30_000 });

        // 5. Verify Proposal Page Load
        await expect(adminPage.getByRole('heading', { name: templateName })).toBeVisible();
        await expect(adminPage.getByText('Client Share Link')).toBeVisible();

        console.log('✅ Tour Operator Workflow Test Completed Successfully');
    });
});
