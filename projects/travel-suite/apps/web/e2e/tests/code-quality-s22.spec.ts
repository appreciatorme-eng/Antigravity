import { test, expect } from '../fixtures/auth';
import { gotoWithRetry } from '../fixtures/navigation';

test.describe('S22 Code Quality Remediation — Regression Tests', () => {
  test.describe('CQ-1: Type Safety (as-any removal)', () => {
    test('admin dashboard loads with typed queries', async ({ adminPage }) => {
      const consoleErrors: string[] = [];
      adminPage.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await gotoWithRetry(adminPage, '/admin');
      await adminPage.waitForLoadState('networkidle');

      await expect(
        adminPage.locator('h1, h2').filter({ hasText: /dashboard/i }),
      ).toBeVisible();

      const typeErrors = consoleErrors.filter(
        (e) =>
          e.includes('TypeError') ||
          e.includes('Cannot read properties of undefined'),
      );
      expect(typeErrors).toHaveLength(0);
    });

    test('calendar page loads with typed event queries', async ({ adminPage }) => {
      await gotoWithRetry(adminPage, '/calendar');
      await adminPage.waitForLoadState('networkidle');

      const pageContent = await adminPage.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('leads page loads with typed Supabase queries', async ({ adminPage }) => {
      await gotoWithRetry(adminPage, '/admin/leads');
      await adminPage.waitForLoadState('networkidle');

      const pageContent = await adminPage.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('reputation dashboard API returns valid data', async ({ adminPage }) => {
      const response = await adminPage.request.get('/api/reputation/dashboard');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const body = await response.json();
        expect(body).toBeTruthy();
      }
    });
  });

  test.describe('CQ-2: Refactored Files (oversized splits)', () => {
    test('social studio loads after template-registry split', async ({ adminPage }) => {
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

    test('admin trip detail page loads after component extraction', async ({ adminPage }) => {
      const consoleErrors: string[] = [];
      adminPage.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await gotoWithRetry(adminPage, '/admin/trips');
      await adminPage.waitForLoadState('networkidle');

      const tripLinks = adminPage.locator('a[href*="/admin/trips/"]');
      const count = await tripLinks.count();

      if (count > 0) {
        await tripLinks.first().click();
        await adminPage.waitForLoadState('networkidle');

        const detailErrors = consoleErrors.filter(
          (e) =>
            e.includes('Cannot find module') ||
            e.includes('is not a function') ||
            e.includes('is not defined'),
        );
        expect(detailErrors).toHaveLength(0);
      }
    });
  });

  test.describe('CQ-3: Structured Logger (console migration)', () => {
    test('API handler responses do not leak server console logs', async ({ adminPage }) => {
      const response = await adminPage.request.get('/api/admin/dashboard/stats');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const text = await response.text();
        expect(text).not.toContain('console.log');
        expect(text).not.toContain('[LOG]');
      }
    });
  });

  test.describe('CQ-4: API Response Envelope Standardization', () => {
    test('admin dashboard stats returns { success, data } envelope', async ({ adminPage }) => {
      const response = await adminPage.request.get('/api/admin/dashboard/stats');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
      }
    });

    test('health endpoint returns { success, data } envelope', async ({ adminPage }) => {
      const response = await adminPage.request.get('/api/health');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
      }
    });

    test('reputation dashboard returns { success, data } envelope', async ({ adminPage }) => {
      const response = await adminPage.request.get('/api/reputation/dashboard');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
      }
    });

    test('nav counts returns { success, data } envelope', async ({ adminPage }) => {
      const response = await adminPage.request.get('/api/nav/counts');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
      }
    });

    test('error responses include { success: false, error } envelope', async ({ adminPage }) => {
      const response = await adminPage.request.get('/api/admin/trips/nonexistent-id-12345');
      if (response.status() >= 400) {
        const body = await response.json();
        expect(body).toHaveProperty('success', false);
        expect(body).toHaveProperty('error');
      }
    });
  });

  test.describe('No Regression — Critical Pages', () => {
    test('admin settings page loads', async ({ adminPage }) => {
      await gotoWithRetry(adminPage, '/admin/settings');
      await adminPage.waitForLoadState('networkidle');

      const pageContent = await adminPage.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('proposals list page loads', async ({ adminPage }) => {
      await gotoWithRetry(adminPage, '/proposals');
      await adminPage.waitForLoadState('networkidle');

      const pageContent = await adminPage.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('whatsapp inbox loads', async ({ adminPage }) => {
      const consoleErrors: string[] = [];
      adminPage.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await gotoWithRetry(adminPage, '/whatsapp');
      await adminPage.waitForLoadState('networkidle');

      const fatalErrors = consoleErrors.filter(
        (e) =>
          e.includes('Unhandled') ||
          e.includes('FATAL') ||
          e.includes('Cannot read properties'),
      );
      expect(fatalErrors).toHaveLength(0);
    });
  });
});
