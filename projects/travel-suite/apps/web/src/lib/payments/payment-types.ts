// Payment domain types, interfaces, and shared constants.

import type { createClient } from '@/lib/supabase/server';
import type { createAdminClient } from '@/lib/supabase/admin';

export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_annual' | 'enterprise';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

export interface CreateSubscriptionOptions {
  organizationId: string;
  planId: SubscriptionPlan;
  billingCycle: 'monthly' | 'annual';
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  gstin?: string;
  billingState?: string;
}

export interface CreateInvoiceOptions {
  organizationId: string;
  clientId?: string;
  amount: number;
  currency?: 'INR' | 'USD';
  description?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  placeOfSupply?: string;
  dueDate?: Date;
}

export interface RecordPaymentOptions {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
}

export type PaymentExecutionContext = 'user_session' | 'admin';

export interface PaymentExecutionOptions {
  context?: PaymentExecutionContext;
}

export type PaymentSupabaseClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

export const OPEN_SUBSCRIPTION_STATUSES = ["active", "trialing", "incomplete", "past_due", "paused"] as const;
