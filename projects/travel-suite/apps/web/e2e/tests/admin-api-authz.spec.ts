import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

test.describe('Admin API Auth - Unauthenticated', () => {
  test('blocks admin clients endpoint', async ({ request }) => {
    const res = await request.get('/api/admin/clients');
    expect(res.status()).toBe(401);
  });

  test('blocks admin trips endpoint', async ({ request }) => {
    const res = await request.get('/api/admin/trips');
    expect(res.status()).toBe(401);
  });

  test('blocks admin trip details endpoint', async ({ request }) => {
    const res = await request.get('/api/admin/trips/00000000-0000-0000-0000-000000000001');
    expect(res.status()).toBe(401);
  });

  test('blocks admin security diagnostics endpoint', async ({ request }) => {
    const res = await request.get('/api/admin/security/diagnostics');
    expect(res.status()).toBe(401);
  });

  test('blocks admin workflow events endpoint', async ({ request }) => {
    const res = await request.get('/api/admin/workflow/events?limit=10');
    expect(res.status()).toBe(401);
  });

  test('blocks admin contacts endpoint', async ({ request }) => {
    const res = await request.get('/api/admin/contacts');
    expect(res.status()).toBe(401);
  });

  test('blocks workflow rules endpoint', async ({ request }) => {
    const res = await request.get('/api/admin/workflow/rules');
    expect(res.status()).toBe(401);
  });

  test('blocks workflow rules mutation endpoint', async ({ request }) => {
    const res = await request.post('/api/admin/workflow/rules', {
      data: { lifecycle_stage: 'lead', notify_client: true },
    });
    expect(res.status()).toBe(401);
  });
});

authTest.describe('Admin API AuthZ - Non-admin users', () => {
  authTest('forbids non-admin access to admin clients endpoint', async ({ clientPage }) => {
    const res = await clientPage.request.get('/api/admin/clients');
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin access to admin clear cache endpoint', async ({ clientPage }) => {
    const res = await clientPage.request.post('/api/admin/clear-cache', {
      data: { all: true },
    });
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin access to marketplace verification list endpoint', async ({ clientPage }) => {
    const res = await clientPage.request.get('/api/admin/marketplace/verify');
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin access to marketplace verification mutation endpoint', async ({ clientPage }) => {
    const res = await clientPage.request.post('/api/admin/marketplace/verify', {
      data: {
        orgId: '00000000-0000-0000-0000-000000000001',
        status: 'verified',
      },
    });
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin access to social generate endpoint', async ({ clientPage }) => {
    const res = await clientPage.request.post('/api/admin/social/generate', {
      data: {},
    });
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin access to tour template extract endpoint', async ({ clientPage }) => {
    const res = await clientPage.request.post('/api/admin/tour-templates/extract', {
      data: {
        method: 'preview',
        url: 'https://example.com',
      },
    });
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin access to trip clone endpoint', async ({ clientPage }) => {
    const res = await clientPage.request.post('/api/admin/trips/00000000-0000-0000-0000-000000000001/clone', {
      data: {},
    });
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin access to workflow rules endpoint', async ({ clientPage }) => {
    const res = await clientPage.request.get('/api/admin/workflow/rules');
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin mutation of workflow rules endpoint', async ({ clientPage }) => {
    const res = await clientPage.request.post('/api/admin/workflow/rules', {
      data: { lifecycle_stage: 'lead', notify_client: true },
    });
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin location share access', async ({ clientPage }) => {
    const res = await clientPage.request.get(
      '/api/location/share?tripId=00000000-0000-0000-0000-000000000001&dayNumber=1'
    );
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin notification send', async ({ clientPage }) => {
    const res = await clientPage.request.post('/api/notifications/send', {
      data: {
        title: 'Unauthorized Test',
        body: 'This should be rejected for non-admin users.',
      },
    });
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin trip creation with cross-org style payload', async ({ clientPage }) => {
    const res = await clientPage.request.post('/api/admin/trips', {
      data: {
        clientId: '00000000-0000-0000-0000-000000000000',
        startDate: '2026-03-01',
        endDate: '2026-03-03',
        itinerary: {
          trip_title: 'Unauthorized test',
          destination: 'N/A',
          duration_days: 2,
          raw_data: { days: [] },
        },
      },
    });

    expect([401, 403]).toContain(res.status());
  });

  authTest('forbids non-admin trip details access', async ({ clientPage }) => {
    const res = await clientPage.request.get('/api/admin/trips/00000000-0000-0000-0000-000000000001');
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin security diagnostics access', async ({ clientPage }) => {
    const res = await clientPage.request.get('/api/admin/security/diagnostics');
    expect(res.status()).toBe(403);
  });

  authTest('forbids non-admin client mutation', async ({ clientPage }) => {
    const res = await clientPage.request.post('/api/admin/clients', {
      data: {
        email: 'unauthorized@example.com',
        full_name: 'Unauthorized User',
      },
    });
    expect(res.status()).toBe(403);
  });
});
