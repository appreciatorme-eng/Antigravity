import { expect, test } from '@playwright/test';
import { BILLING_PLANS } from '../../src/features/admin/billing/plans';
import { PLAN_CATALOG, limitToUiValue, type CanonicalPlanId } from '../../src/lib/billing/plan-catalog';
import { TIERS } from '../../src/lib/billing/tiers';
import { getUpgradePlanForPlanId, resolvePlanIdForLifecycle } from '../../src/lib/subscriptions/limits';

test.describe('Monetization Plan-Limit Contracts', () => {
  test('billing plans are consistent with canonical catalog limits', () => {
    for (const billingPlan of BILLING_PLANS) {
      const planId = billingPlan.id as CanonicalPlanId;
      const canonical = PLAN_CATALOG[planId];

      expect(canonical, `Missing canonical plan for ${billingPlan.id}`).toBeTruthy();
      expect(billingPlan.limits.clients).toBe(limitToUiValue(canonical.limits.clients));
      expect(billingPlan.limits.proposals).toBe(limitToUiValue(canonical.limits.proposals));
      expect(billingPlan.limits.users).toBe(limitToUiValue(canonical.limits.users));
      expect(billingPlan.limits.aiRequests ?? null).toBe(canonical.limits.aiRequests);
    }
  });

  test('tier pricing matches canonical pricing for shared tiers', () => {
    expect(TIERS.free.price.monthly).toBe(PLAN_CATALOG.free.monthlyPriceInr);
    expect(TIERS.pro.price.monthly).toBe(PLAN_CATALOG.pro_monthly.monthlyPriceInr);
    expect(TIERS.pro.price.annual).toBe(PLAN_CATALOG.pro_annual.monthlyPriceInr);
    expect(TIERS.enterprise.price.monthly).toBe(PLAN_CATALOG.enterprise.monthlyPriceInr);
  });

  test('upgrade path contract is deterministic for free and paid plans', () => {
    expect(getUpgradePlanForPlanId('free')).toBe('pro_monthly');
    expect(getUpgradePlanForPlanId('pro_monthly')).toBe('enterprise');
    expect(getUpgradePlanForPlanId('pro_annual')).toBe('enterprise');
    expect(getUpgradePlanForPlanId('enterprise')).toBeNull();
  });

  test('trial expiry and cancellation lifecycle resolve to expected effective plan', () => {
    const now = new Date('2026-03-01T00:00:00.000Z');

    expect(
      resolvePlanIdForLifecycle({
        activePlanId: 'pro_monthly',
        status: 'trialing',
        trialEnd: '2026-02-20T00:00:00.000Z',
        now,
      })
    ).toBe('free');

    expect(
      resolvePlanIdForLifecycle({
        activePlanId: 'pro_monthly',
        status: 'trialing',
        trialEnd: '2026-03-10T00:00:00.000Z',
        now,
      })
    ).toBe('pro_monthly');

    expect(
      resolvePlanIdForLifecycle({
        activePlanId: 'pro_monthly',
        status: 'active',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: '2026-02-28T00:00:00.000Z',
        now,
      })
    ).toBe('free');
  });

  test('scheduled downgrade takes effect when billing period ends', () => {
    const now = new Date('2026-03-01T00:00:00.000Z');

    expect(
      resolvePlanIdForLifecycle({
        activePlanId: 'enterprise',
        status: 'active',
        downgradePlanId: 'pro_annual',
        currentPeriodEnd: '2026-02-28T23:59:59.000Z',
        now,
      })
    ).toBe('pro_annual');

    expect(
      resolvePlanIdForLifecycle({
        activePlanId: 'enterprise',
        status: 'active',
        downgradePlanId: 'pro_annual',
        currentPeriodEnd: '2026-03-15T00:00:00.000Z',
        now,
      })
    ).toBe('enterprise');
  });
});
