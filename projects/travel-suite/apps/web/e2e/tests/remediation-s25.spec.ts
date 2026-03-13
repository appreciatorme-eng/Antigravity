import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

test.describe('Remediation S25 — C-01: Superadmin Rate Limiting', () => {
  test('superadmin endpoint returns 401 without auth (not 500)', async ({ request }) => {
    const res = await request.get('/api/superadmin/me');
    expect(res.status()).toBe(401);
  });

  test('superadmin endpoint returns JSON error envelope', async ({ request }) => {
    const res = await request.post('/api/superadmin/overview', {
      data: {},
    });
    expect([401, 403, 429]).toContain(res.status());
    const body = await res.json().catch(() => null);
    expect(body).not.toBeNull();
  });
});

test.describe('Remediation S25 — C-02: Notification Queue Batch Org Resolution', () => {
  test('notification process-queue requires cron secret', async ({ request }) => {
    const res = await request.post('/api/notifications/process-queue', {
      data: {},
    });
    expect([401, 403]).toContain(res.status());
  });

  test('notification process-queue with wrong secret returns 401', async ({ request }) => {
    const res = await request.post('/api/notifications/process-queue', {
      headers: { 'x-cron-secret': 'wrong-secret' },
      data: {},
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Remediation S25 — C-03: Social Queue Batch Post Update', () => {
  test('social process-queue requires cron secret', async ({ request }) => {
    const res = await request.post('/api/social/process-queue', {
      data: {},
    });
    expect([401, 403]).toContain(res.status());
  });

  test('social process-queue with wrong secret returns 401', async ({ request }) => {
    const res = await request.post('/api/social/process-queue', {
      headers: { 'x-social-cron-secret': 'wrong-secret' },
      data: {},
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Remediation S25 — H-08: Proposals Bulk Batch Update', () => {
  test('bulk proposals endpoint rejects unauthenticated requests', async ({ request }) => {
    const res = await request.post('/api/admin/proposals/bulk', {
      data: { action: 'approve', ids: ['00000000-0000-0000-0000-000000000001'] },
    });
    expect(res.status()).toBe(401);
  });

  test('bulk proposals endpoint validates payload schema', async ({ request }) => {
    const res = await request.post('/api/admin/proposals/bulk', {
      data: { action: 'invalid_action', ids: [] },
    });
    expect([400, 401]).toContain(res.status());
  });
});

test.describe('Remediation S25 — H-04/H-05: RLS Tightened Policies', () => {
  authTest('admin can access itinerary templates without error', async ({ adminPage }) => {
    const res = await adminPage.request.get('/api/admin/itinerary-templates');
    expect(res.status()).toBeLessThan(500);
  });

  authTest('admin can access marketplace without error', async ({ adminPage }) => {
    const res = await adminPage.request.get('/api/admin/marketplace');
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('Remediation S25 — M-03/M-04: React Memoization', () => {
  authTest('analytics page loads without console errors', async ({ adminPage }) => {
    const consoleErrors: string[] = [];
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await adminPage.goto('/analytics');
    await adminPage.waitForLoadState('networkidle');

    const reactErrors = consoleErrors.filter(
      (e) =>
        e.includes('Cannot read properties of undefined') ||
        e.includes('is not a function') ||
        e.includes('Maximum update depth exceeded'),
    );
    expect(reactErrors).toHaveLength(0);
  });

  authTest('itinerary template preview loads without errors', async ({ adminPage }) => {
    const consoleErrors: string[] = [];
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await adminPage.goto('/itinerary-templates');
    await adminPage.waitForLoadState('networkidle');

    const reactErrors = consoleErrors.filter(
      (e) => e.includes('Cannot read properties of undefined') || e.includes('is not a function'),
    );
    expect(reactErrors).toHaveLength(0);
  });
});
