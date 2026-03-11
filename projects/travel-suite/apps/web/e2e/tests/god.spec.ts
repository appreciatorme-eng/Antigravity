import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

const QA_ORG_ID = 'c498cecc-9aaa-4a37-a26e-fe591e065ac9';
const TIMEOUT = 30_000;

test.describe('God Mode — Super Admin Panel', () => {
  test('command center dashboard loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'Command Center' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('analytics page loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/analytics');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'Feature Usage' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('broadcast center (announcements) loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/announcements');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'Broadcast Center' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('audit log loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/audit-log');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'Audit Log' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('API cost dashboard loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/costs');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'API Cost Dashboard' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('org cost drilldown loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, `/god/costs/org/${QA_ORG_ID}`);
    // h1 renders the org name dynamically — verify page loaded without Access Denied
    await expect(superAdminPage.locator('h1').first())
      .toBeVisible({ timeout: TIMEOUT });
    await expect(superAdminPage.locator('text=Access Denied')).not.toBeVisible();
  });

  test('all contacts directory loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/directory');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'All Contacts' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('kill switch emergency panel loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/kill-switch');
    await expect(superAdminPage.locator('text=Emergency Control Panel'))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('health monitor loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/monitoring');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'Health Monitor' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('referral tracking loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/referrals');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'Referral Tracking' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('user signups loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/signups');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'User Signups' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('support tickets loads', async ({ superAdminPage }) => {
    await gotoWithRetry(superAdminPage, '/god/support');
    await expect(superAdminPage.locator('h1').filter({ hasText: 'Support Tickets' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('admin user sees Access Denied on /god', async ({ adminPage }) => {
    await gotoWithRetry(adminPage, '/god');
    await expect(adminPage.locator('h1').filter({ hasText: 'Access Denied' }))
      .toBeVisible({ timeout: TIMEOUT });
  });
});
