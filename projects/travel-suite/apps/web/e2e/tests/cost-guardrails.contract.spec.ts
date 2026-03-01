import { test, expect } from '@playwright/test';
import { reserveDailySpendUsd } from '../../src/lib/cost/spend-guardrails';

test.describe('Cost guardrail contracts', () => {
  test('daily spend reservation stays within cap under concurrent requests', async () => {
    const organizationId = `race-org-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const category = 'ai_image';
    const deltaUsd = 0.06;

    const reservations = await Promise.all(
      Array.from({ length: 6 }, () =>
        reserveDailySpendUsd(organizationId, category, deltaUsd, {
          planCapUsd: 0.12,
          emergencyCapUsd: 0.12,
        })
      )
    );

    const allowed = reservations.filter((reservation) => reservation.allowed);
    const denied = reservations.filter((reservation) => !reservation.allowed);

    expect(allowed.length).toBe(2);
    expect(denied.length).toBe(4);
    expect(denied.every((reservation) => reservation.denialReason !== null)).toBeTruthy();
  });

  test('legacy unsplash endpoint cannot be used as a quota bypass', async ({ request }) => {
    const response = await request.get('/api/unsplash?query=mountains');
    expect(response.status()).toBe(410);
  });
});
