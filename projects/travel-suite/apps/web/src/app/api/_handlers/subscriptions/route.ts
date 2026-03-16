/**
 * Subscription API Routes
 *
 * Endpoints:
 * - GET /api/subscriptions - Get current subscription
 * - POST /api/subscriptions - Create new subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { paymentService } from '@/lib/payments/payment-service';
import { PaymentServiceError, paymentErrorHttpStatus } from '@/lib/payments/errors';
import { SUBSCRIPTION_SELECT } from '@/lib/payments/subscription-service';
import { z } from 'zod';
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from '@/lib/integrations';
import { sanitizeEmail, sanitizeText } from '@/lib/security/sanitize';
import type { Database } from '@/lib/database.types';
import { logError } from "@/lib/observability/logger";

const PlanRequestSchema = z
  .object({
    plan_id: z.enum(['pro_monthly', 'pro_annual', 'enterprise']),
    billing_cycle: z.enum(['monthly', 'annual']).default('monthly'),
  })
  .superRefine((value, ctx) => {
    const expectedCycleByPlan: Record<'pro_monthly' | 'pro_annual' | 'enterprise', 'monthly' | 'annual'> = {
      pro_monthly: 'monthly',
      pro_annual: 'annual',
      enterprise: 'monthly',
    };

    const expected = expectedCycleByPlan[value.plan_id];
    if (value.billing_cycle !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `billing_cycle must be "${expected}" for plan_id "${value.plan_id}"`,
        path: ['billing_cycle'],
      });
    }
  });

const DEFAULT_PLAN_AMOUNTS: Record<'pro_monthly' | 'pro_annual' | 'enterprise', number> = {
  pro_monthly: 4999,
  pro_annual: 49990,
  enterprise: 15000,
};

interface UntypedQueryBuilder<T> {
  select(columns: string): UntypedQueryBuilder<T>;
  eq(column: string, value: unknown): UntypedQueryBuilder<T>;
  maybeSingle(): Promise<{ data: T | null; error: { message?: string } | null }>;
}

interface UntypedSupabaseClient {
  from<T>(table: string): UntypedQueryBuilder<T>;
}

interface SubscriptionPlanAmountRow {
  amount: number | string | null;
}

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

function getEnvPlanAmount(planId: 'pro_monthly' | 'pro_annual' | 'enterprise') {
  const envKey = `SUBSCRIPTION_PRICE_${planId.toUpperCase()}`;
  const raw = process.env[envKey];
  if (!raw) return null;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

async function resolvePlanAmount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: 'pro_monthly' | 'pro_annual' | 'enterprise',
  billingCycle: 'monthly' | 'annual'
) {
  const untypedSupabase = supabase as unknown as UntypedSupabaseClient;
  const { data: dbPlan, error } = await untypedSupabase
    // subscription_plans may exist in SQL before generated DB types are refreshed.
    .from('subscription_plans')
    .select('amount')
    .eq('plan_id', planId)
    .eq('billing_cycle', billingCycle)
    .eq('is_active', true)
    .maybeSingle() as { data: SubscriptionPlanAmountRow | null; error: { message?: string } | null };

  if (!error && dbPlan?.amount !== null && dbPlan?.amount !== undefined) {
    const amount = Number(dbPlan.amount);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }

  const envAmount = getEnvPlanAmount(planId);
  if (envAmount) return envAmount;

  return DEFAULT_PLAN_AMOUNTS[planId];
}

/** Fields safe to expose to any org member (excludes provider IDs and internal metadata). */
const CLIENT_SAFE_FIELDS = new Set([
  "id",
  "plan_id",
  "status",
  "billing_cycle",
  "amount",
  "total_amount",
  "gst_amount",
  "currency",
  "current_period_start",
  "current_period_end",
  "next_billing_date",
  "trial_start",
  "trial_end",
  "cancel_at_period_end",
  "cancelled_at",
  "created_at",
  "updated_at",
]);

function pickSafeFields<T extends Record<string, unknown>>(
  obj: T | null | undefined,
): Partial<T> | null {
  if (!obj) return null;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (CLIENT_SAFE_FIELDS.has(key)) {
      result[key] = obj[key];
    }
  }
  return result as Partial<T>;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request as unknown as import("next/server").NextRequest, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const subscription = await paymentService.getCurrentSubscription(auth.organizationId!);

    return NextResponse.json({ subscription: pickSafeFields(subscription as unknown as Record<string, unknown>) });
  } catch (error) {
    logError('Error in GET /api/subscriptions', error);
    if (error instanceof PaymentServiceError) {
      return NextResponse.json(
        { error: "Subscription operation failed" },
        { status: paymentErrorHttpStatus(error) }
      );
    }
    return apiError('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isPaymentsIntegrationEnabled()) {
      return NextResponse.json(
        {
          success: false,
          disabled: true,
          error: getIntegrationDisabledMessage('payments'),
        },
        { status: 503 }
      );
    }

    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { userId, organizationId, adminClient } = auth;

    const { data: org } = await adminClient
      .from('organizations')
      .select('name, billing_state')
      .eq('id', organizationId!)
      .maybeSingle();

    const existingSubscription = await paymentService.getCurrentSubscription(organizationId!);
    if (existingSubscription) {
      return NextResponse.json(
        {
          error: 'A subscription already exists for this organization',
          code: 'payments_subscription_exists',
          subscription_id: existingSubscription.id,
          plan_id: existingSubscription.plan_id,
          status: existingSubscription.status,
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const parsed = PlanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid plan request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { plan_id, billing_cycle } = parsed.data;
    const supabase = await createClient();
    const amount = await resolvePlanAmount(supabase, plan_id, billing_cycle);
    const safeBillingState = sanitizeText(org?.billing_state ?? null, { maxLength: 64 }) || undefined;
    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(userId);
    const safeCustomerEmail = sanitizeEmail(authUser?.email ?? null) || '';
    const safeCustomerName = sanitizeText(org?.name ?? null, { maxLength: 120 }) || 'Travel Suite';

    const subscriptionId = await paymentService.createSubscription({
      organizationId: organizationId!,
      planId: plan_id,
      billingCycle: billing_cycle,
      amount,
      customerEmail: safeCustomerEmail,
      customerName: safeCustomerName,
      billingState: safeBillingState,
    });

    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select(SUBSCRIPTION_SELECT)
      .eq('id', subscriptionId)
      .single();
    const subscription = subscriptionData as unknown as SubscriptionRow | null;

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    logError('Error in POST /api/subscriptions', error);
    if (error instanceof PaymentServiceError) {
      return NextResponse.json(
        { error: "Subscription operation failed" },
        { status: paymentErrorHttpStatus(error) }
      );
    }
    return apiError("Subscription operation failed", 500);
  }
}
