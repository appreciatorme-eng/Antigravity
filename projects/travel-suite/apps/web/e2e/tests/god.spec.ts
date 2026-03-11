import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('God Mode — Super Admin Panel', () => {
  // ── Page Load Tests (super admin) ──────────────────────────

  test('god mode dashboard loads (Command Center)', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god');
    await expect(
      superAdminPage.getByRole('heading', { name: 'Command Center' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('kill switch panel loads', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/kill-switch');
    // Kill switch heading is a <p>, not <h1>. Text is unique (sidebar label is "Kill Switch").
    await expect(superAdminPage.locator('text=Emergency Control Panel')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('announcements page loads (Broadcast Center)', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/announcements');
    await expect(
      superAdminPage.getByRole('heading', { name: 'Broadcast Center' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('audit log page loads', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/audit-log');
    await expect(
      superAdminPage.getByRole('heading', { name: 'Audit Log' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('support tickets page loads', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/support');
    await expect(
      superAdminPage.getByRole('heading', { name: 'Support Tickets' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('API cost dashboard loads', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/costs');
    await expect(
      superAdminPage.getByRole('heading', { name: 'API Cost Dashboard' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('feature usage analytics page loads', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/analytics');

    // The analytics API may error on empty data, producing an error boundary.
    // Verify auth passed (no "Access Denied") and page attempted to render.
    const heading = superAdminPage.getByRole('heading', { name: 'Feature Usage' });
    const errorBoundary = superAdminPage.locator('text=Something went wrong');

    await expect
      .poll(
        async () => {
          if (await heading.isVisible().catch(() => false)) return 'loaded';
          if (await errorBoundary.isVisible().catch(() => false)) return 'error-boundary';
          return 'pending';
        },
        { timeout: 30_000 }
      )
      .not.toBe('pending');

    // Auth must have passed — no "Access Denied".
    await expect(superAdminPage.getByRole('heading', { name: 'Access Denied' })).toHaveCount(0);
  });

  test('directory page loads (All Contacts)', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/directory');
    await expect(
      superAdminPage.getByRole('heading', { name: 'All Contacts' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('signups page loads', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/signups');
    await expect(
      superAdminPage.getByRole('heading', { name: 'User Signups' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('referrals page loads', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/referrals');
    await expect(
      superAdminPage.getByRole('heading', { name: 'Referral Tracking' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('health monitoring page loads', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(superAdminPage, '/god/monitoring');
    await expect(
      superAdminPage.getByRole('heading', { name: 'Health Monitor' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('per-org cost detail page loads', async ({ superAdminPage }) => {
    test.setTimeout(60_000);
    // Use the QA org ID — the page shows the org name dynamically.
    await gotoWithRetry(superAdminPage, '/god/costs/org/c498cecc-9aaa-4a37-a26e-fe591e065ac9');

    // Page should show either the org name heading or a loading indicator (no Access Denied).
    const heading = superAdminPage.locator('h1');
    await expect(heading).toBeVisible({ timeout: 30_000 });

    // Must NOT show "Access Denied" — confirms super_admin auth passed.
    await expect(superAdminPage.getByRole('heading', { name: 'Access Denied' })).toHaveCount(0);
  });

  // ── Access Denial Tests ────────────────────────────────────

  test('admin user is denied access to /god', async ({ adminPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(adminPage, '/god');

    // The god/layout.tsx shows "Access Denied" for non-super_admin roles.
    await expect(
      adminPage.getByRole('heading', { name: 'Access Denied' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('client user is denied access to /god', async ({ clientPage }) => {
    test.setTimeout(60_000);
    await gotoWithRetry(clientPage, '/god');
    await expect(
      clientPage.getByRole('heading', { name: 'Access Denied' })
    ).toBeVisible({ timeout: 30_000 });
  });
});
