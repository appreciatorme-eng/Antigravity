// Payment service: thin orchestrator composing all payment domain modules.

export type { SubscriptionPlan, PaymentMethod } from './payment-types';

import { ensureCustomer } from './customer-service';
import { createSubscription, cancelSubscription, getCurrentSubscription, checkTierLimit } from './subscription-service';
import { createInvoice, recordPayment } from './invoice-service';
import { createOrder, verifyWebhookSignature } from './order-service';
import { handleSubscriptionCharged, handlePaymentFailed } from './webhook-handlers';
import type {
  PaymentExecutionOptions,
  CreateSubscriptionOptions,
  CreateInvoiceOptions,
  RecordPaymentOptions,
} from './payment-types';
import type { Order } from './razorpay';

export class PaymentService {
  async ensureCustomer(organizationId: string, execution: PaymentExecutionOptions = {}) {
    return ensureCustomer(organizationId, execution);
  }

  async createSubscription(options: CreateSubscriptionOptions, execution: PaymentExecutionOptions = {}) {
    return createSubscription(options, execution);
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true, execution: PaymentExecutionOptions = {}) {
    return cancelSubscription(subscriptionId, cancelAtPeriodEnd, execution);
  }

  async createInvoice(options: CreateInvoiceOptions, execution: PaymentExecutionOptions = {}) {
    return createInvoice(options, execution);
  }

  async recordPayment(options: RecordPaymentOptions, execution: PaymentExecutionOptions = {}) {
    return recordPayment(options, execution);
  }

  async createOrder(
    amount: number,
    currency: 'INR' | 'USD' = 'INR',
    organizationId?: string,
    notes?: Record<string, string>
  ): Promise<Order> {
    return createOrder(amount, currency, organizationId, notes);
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    return verifyWebhookSignature(body, signature);
  }

  async handleSubscriptionCharged(
    razorpaySubscriptionId: string,
    paymentId: string,
    amount: number,
    execution: PaymentExecutionOptions = {}
  ) {
    return handleSubscriptionCharged(razorpaySubscriptionId, paymentId, amount, execution);
  }

  async handlePaymentFailed(
    organizationId: string,
    subscriptionId: string | null,
    paymentId: string,
    errorCode: string,
    errorDescription: string,
    execution: PaymentExecutionOptions = {}
  ) {
    return handlePaymentFailed(organizationId, subscriptionId, paymentId, errorCode, errorDescription, execution);
  }

  async getCurrentSubscription(organizationId: string, execution: PaymentExecutionOptions = {}) {
    return getCurrentSubscription(organizationId, execution);
  }

  async checkTierLimit(
    organizationId: string,
    feature: 'clients' | 'trips' | 'proposals' | 'users',
    limit: number,
    execution: PaymentExecutionOptions = {}
  ) {
    return checkTierLimit(organizationId, feature, limit, execution);
  }
}

export const paymentService = new PaymentService();
