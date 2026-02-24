import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

type OnboardingPayload = {
  organization?: {
    id?: string | null;
  } | null;
};

type MarketplaceProfile = {
  organization_id?: string | null;
  verification_status?: string | null;
};

type InquiryRow = {
  id?: string;
};

type InquiryListPayload = {
  sent?: InquiryRow[];
};

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
  authTest('supports create -> list -> update inquiry flow when verified target exists', async ({ clientPage }) => {
    const setupResponse = await clientPage.request.get('/api/onboarding/setup');
    expect(setupResponse.ok()).toBeTruthy();
    const setupPayload = (await setupResponse.json().catch(() => ({}))) as OnboardingPayload;
    const ownOrgId = setupPayload?.organization?.id || null;
    expect(typeof ownOrgId).toBe('string');

    const marketplaceResponse = await clientPage.request.get('/api/marketplace');
    expect(marketplaceResponse.ok()).toBeTruthy();
    const marketplacePayload = (await marketplaceResponse.json().catch(() => [])) as unknown;
    const marketplaceRows = Array.isArray(marketplacePayload)
      ? (marketplacePayload as MarketplaceProfile[])
      : [];

    const verifiedTarget = marketplaceRows.find(
      (row) =>
        typeof row.organization_id === 'string' &&
        row.organization_id !== ownOrgId &&
        String(row.verification_status || '').toLowerCase() === 'verified'
    );

    const targetOrgId = verifiedTarget?.organization_id || null;
    if (!targetOrgId) {
      authTest.skip(true, 'No verified marketplace target organization available in this environment');
    }

    const marker = Date.now().toString(36);
    const createResponse = await clientPage.request.post(`/api/marketplace/${targetOrgId}/inquiry`, {
      data: {
        subject: `E2E Partnership ${marker}`,
        message: `Testing inquiry workflow ${marker}`,
      },
    });
    expect(createResponse.ok()).toBeTruthy();
    const createdInquiry = (await createResponse.json().catch(() => ({}))) as InquiryRow;
    expect(typeof createdInquiry?.id).toBe('string');

    const listResponse = await clientPage.request.get('/api/marketplace/inquiries');
    expect(listResponse.ok()).toBeTruthy();
    const listPayload = (await listResponse.json().catch(() => ({}))) as InquiryListPayload;
    const sentRows = Array.isArray(listPayload?.sent) ? listPayload.sent : [];
    const createdId = String(createdInquiry.id || '');
    expect(sentRows.some((row) => row?.id === createdId)).toBeTruthy();

    const updateResponse = await clientPage.request.patch('/api/marketplace/inquiries', {
      data: { id: createdId, mark_read: true },
    });
    expect(updateResponse.ok()).toBeTruthy();
    const updatedInquiry = (await updateResponse.json().catch(() => ({}))) as InquiryRow;
    expect(updatedInquiry?.id).toBe(createdId);
  });

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
