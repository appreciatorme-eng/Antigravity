import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

test.describe('Marketplace Inquiries API - Unauthenticated', () => {
  test('blocks inquiry inbox endpoint', async ({ request }) => {
    const response = await request.get('/api/marketplace/inquiries');
    expect(response.status()).toBe(401);
  });

  test('blocks inquiry update endpoint', async ({ request }) => {
    const response = await request.patch('/api/marketplace/inquiries', {
      data: { id: 'inquiry-123', status: 'accepted' },
    });
    expect(response.status()).toBe(401);
  });

  test('blocks inquiry creation endpoint', async ({ request }) => {
    const response = await request.post('/api/marketplace/some-org/inquiry', {
      data: { subject: 'Partnership', message: 'Can we collaborate?' },
    });
    expect(response.status()).toBe(401);
  });
});

authTest.describe('Marketplace Inquiries API - Authenticated', () => {
  authTest('validates patch body when no update fields are sent', async ({ clientPage }) => {
    const response = await clientPage.request.patch('/api/marketplace/inquiries', {
      data: { id: 'inquiry-123' },
    });
    expect(response.status()).toBe(400);
    const payload = await response.json().catch(() => ({}));
    expect(String(payload?.error || '')).toContain('No changes requested');
  });

  authTest('rejects malformed patch payload', async ({ clientPage }) => {
    const response = await clientPage.request.patch('/api/marketplace/inquiries', {
      data: { id: 'bad' },
    });
    expect(response.status()).toBe(400);
  });
});
