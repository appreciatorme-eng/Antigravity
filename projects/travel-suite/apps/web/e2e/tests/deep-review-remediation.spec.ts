import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('Deep Review Remediation — Regression Tests', () => {
  test.describe('FIX-001: LayoutRenderer Split', () => {
    test('social studio page loads without errors', async ({ adminPage }) => {
      const consoleErrors: string[] = [];
      adminPage.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await gotoWithRetry(adminPage, '/social');
      await adminPage.waitForLoadState('networkidle');

      const pageContent = await adminPage.textContent('body');
      expect(pageContent).toBeTruthy();

      const importErrors = consoleErrors.filter(
        (e) => e.includes('Cannot find module') || e.includes('is not a function'),
      );
      expect(importErrors).toHaveLength(0);
    });
  });

  test.describe('FIX-002: AbortController Cleanup', () => {
    test('admin dashboard loads without memory leak warnings', async ({ adminPage }) => {
      const consoleErrors: string[] = [];
      adminPage.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await gotoWithRetry(adminPage, '/admin');
      await adminPage.waitForLoadState('networkidle');

      await expect(
        adminPage.locator('h1, h2').filter({ hasText: /dashboard/i }),
      ).toBeVisible();

      const stateUpdateErrors = consoleErrors.filter(
        (e) =>
          e.includes("Can't perform a React state update on an unmounted component") ||
          e.includes('AbortError'),
      );
      expect(stateUpdateErrors).toHaveLength(0);
    });
  });

  test.describe('FIX-008: Memoization', () => {
    test('admin dashboard renders stat cards', async ({ adminPage }) => {
      await gotoWithRetry(adminPage, '/admin');
      await adminPage.waitForLoadState('networkidle');

      const heading = adminPage.locator('h1').filter({ hasText: /dashboard/i });
      await expect(heading).toBeVisible();

      const hasRecoveredRevenue = await adminPage
        .locator('text=Recovered Revenue')
        .isVisible()
        .catch(() => false);
      const hasActiveOperators = await adminPage
        .locator('text=Active Operators')
        .isVisible()
        .catch(() => false);

      expect(hasRecoveredRevenue || hasActiveOperators).toBeTruthy();
    });

    test('calendar month view renders without errors', async ({ adminPage }) => {
      const consoleErrors: string[] = [];
      adminPage.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await gotoWithRetry(adminPage, '/calendar');
      await adminPage.waitForLoadState('networkidle');

      const reactErrors = consoleErrors.filter(
        (e) =>
          e.includes('Cannot read properties of undefined') ||
          e.includes('is not a function'),
      );
      expect(reactErrors).toHaveLength(0);
    });
  });

  test.describe('FIX-004: Supabase Types', () => {
    test('API responses return valid JSON', async ({ adminPage }) => {
      const response = await adminPage.request.get('/api/admin/dashboard/stats');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const body = await response.json();
        expect(body).toBeTruthy();
      }
    });
  });

  test.describe('FIX-009: API Response Helpers', () => {
    test('health endpoint returns structured response', async ({ adminPage }) => {
      const response = await adminPage.request.get('/api/health');
      expect(response.status()).toBeLessThan(500);
      expect(response.headers()['content-type']).toContain('application/json');
    });
  });
});
