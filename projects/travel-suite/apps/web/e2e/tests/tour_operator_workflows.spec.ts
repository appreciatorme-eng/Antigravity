import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Tour Operator Workflows', () => {
    test('Complete Tour Operator Lifecycle: Client -> Template -> Add-on -> Proposal', async ({ adminPage, isMobile }) => {
        test.skip(isMobile, 'Multi-step workflow is desktop-only — too resource-intensive for mobile emulation under parallel load');
        test.setTimeout(300_000); // 5 minutes

        const uniq = Date.now();
        const clientName = `Workflow Client ${uniq}`;
        const clientEmail = `workflow-client-${uniq}@gobuddy.test`;
        const templateName = `Workflow Template ${uniq}`;
        const addOnName = `Workflow Add-on ${uniq}`;

        // 1. CRM: Create a Client (clients UI lives at /clients — see BUG-002 nav fix)
        await gotoWithRetry(adminPage, '/clients');
        await adminPage.getByRole('button', { name: /add client/i }).click();
        await adminPage.getByLabel(/full name/i).fill(clientName);
        await adminPage.getByLabel(/email/i).first().fill(clientEmail);

        // Submit button inside the modal reads "Add Client" (not "Create Client") — use .last()
        // to distinguish it from the page-level "Add Client" opener button.
        const [createClientResp] = await Promise.all([
            adminPage.waitForResponse((resp) => resp.url().includes('/api/admin/clients') && resp.request().method() === 'POST'),
            adminPage.getByRole('button', { name: /add client/i }).last().click(),
        ]);
        expect(createClientResp.ok()).toBeTruthy();
        // Use .first() — success toast + card heading both contain clientName (strict mode).
        await expect(adminPage.getByText(clientName).first()).toBeVisible({ timeout: 30_000 });

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

        // 3. Upsell: Create an Add-on (UI lives at /add-ons — see BUG-002 nav fix)
        await gotoWithRetry(adminPage, '/add-ons');
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

        // 4. Sales: Create a Proposal (UI at /proposals/create — see BUG-002 nav fix)
        await gotoWithRetry(adminPage, '/proposals/create');

        // Select Client via custom combobox (not a native <select>)
        const clientSearchInput = adminPage.getByLabel(/search and select client/i);
        await clientSearchInput.click();
        await clientSearchInput.fill(clientName);
        // Wait for dropdown results and click the first match
        const clientDropdownItem = adminPage.locator('[class*="max-h-64"] button')
            .filter({ hasText: clientName }).first();
        await expect(clientDropdownItem).toBeVisible({ timeout: 15_000 });
        await clientDropdownItem.click();

        // Select Template via the single native <select> on the page
        const templateSelect = adminPage.locator('select').first();
        await expect
            .poll(async () => templateSelect.locator('option').count(), { timeout: 30_000 })
            .toBeGreaterThan(1);
        const templateOption = templateSelect.locator('option', { hasText: templateName }).first();
        const templateValue = await templateOption.getAttribute('value');
        await templateSelect.selectOption(templateValue!);

        // Create Proposal (button becomes enabled once client + template are selected)
        await expect(adminPage.getByRole('button', { name: /create proposal/i })).toBeEnabled({ timeout: 10_000 });
        await adminPage.getByRole('button', { name: /create proposal/i }).click();
        await expect(adminPage).toHaveURL(/\/proposals\/[0-9a-f-]+/i, { timeout: 30_000 });

        // 5. Verify Proposal Page Load
        await expect(adminPage.getByText('Client Share Link')).toBeVisible({ timeout: 30_000 });

        console.log('✅ Tour Operator Workflow Test Completed Successfully');
    });
});
