import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

test.describe('Remediation S26 — H-01: Error Boundaries on Key Routes', () => {
  authTest('settings page loads without unhandled error', async ({ adminPage }) => {
    const consoleErrors: string[] = [];
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await adminPage.goto('/settings');
    await adminPage.waitForLoadState('networkidle');

    const unhandled = consoleErrors.filter(
      (e) => e.includes('Unhandled') || e.includes('Cannot read properties of undefined reading'),
    );
    expect(unhandled).toHaveLength(0);
  });

  authTest('dashboard page loads without unhandled error', async ({ adminPage }) => {
    const consoleErrors: string[] = [];
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await adminPage.goto('/dashboard');
    await adminPage.waitForLoadState('networkidle');

    const unhandled = consoleErrors.filter((e) => e.includes('Unhandled'));
    expect(unhandled).toHaveLength(0);
  });

  authTest('analytics page loads without unhandled error', async ({ adminPage }) => {
    const consoleErrors: string[] = [];
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await adminPage.goto('/analytics');
    await adminPage.waitForLoadState('networkidle');

    const unhandled = consoleErrors.filter((e) => e.includes('Unhandled'));
    expect(unhandled).toHaveLength(0);
  });
});

test.describe('Remediation S26 — M-02: Database Types Import Consolidation', () => {
  test('admin trips endpoint returns structured response (not 500 type error)', async ({ request }) => {
    const res = await request.get('/api/admin/trips');
    expect([200, 401, 403]).toContain(res.status());
    if (res.status() === 401 || res.status() === 403) {
      const body = await res.json().catch(() => null);
      expect(body).not.toBeNull();
    }
  });

  test('reputation analytics snapshot endpoint responds (not 500)', async ({ request }) => {
    const res = await request.get('/api/reputation/analytics/snapshot');
    expect([200, 401, 403]).toContain(res.status());
  });

  test('social posts endpoint responds (not 500)', async ({ request }) => {
    const res = await request.get('/api/social/posts');
    expect([200, 401, 403]).toContain(res.status());
  });
});

test.describe('Remediation S26 — M-04: Public Proposal Utils Error Handling', () => {
  test('public proposal with invalid token returns 404 not 500', async ({ request }) => {
    const res = await request.get('/api/proposals/public/invalid-token-xyz');
    expect([404, 401, 410]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });

  test('public proposal with malformed token returns non-500', async ({ request }) => {
    const res = await request.get('/api/proposals/public/' + 'a'.repeat(201));
    expect(res.status()).not.toBe(500);
  });

  test('public proposal endpoint returns JSON error envelope on not found', async ({ request }) => {
    const res = await request.get('/api/proposals/public/AAAAAAAABBBBBBBB');
    expect([404, 410, 401]).toContain(res.status());
    const body = await res.json().catch(() => null);
    if (body !== null) {
      expect(typeof body).toBe('object');
    }
  });
});
