/**
 * Razorpay Stub Gateway
 *
 * Mock implementation of Razorpay SDK for development without API keys.
 * Simulates all Razorpay operations with realistic responses.
 *
 * USAGE:
 * - Development: Use this stub to build and test payment flows
 * - Production: Replace import with real Razorpay SDK
 *
 * TO GO LIVE:
 * 1. Get Razorpay API keys (key_id, key_secret)
 * 2. Replace this file's export with real SDK initialization
 * 3. Update environment variables
 *
 * Example replacement:
 * ```typescript
 * import Razorpay from 'razorpay';
 * export const razorpay = new Razorpay({
 *   key_id: process.env.RAZORPAY_KEY_ID!,
 *   key_secret: process.env.RAZORPAY_KEY_SECRET!
 * });
 * ```
 */

type Currency = 'INR' | 'USD';

interface OrderOptions {
  amount: number; // in paise (₹100 = 10000 paise)
  currency: Currency;
  receipt?: string;
  notes?: Record<string, string>;
}

interface Order {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: Currency;
  receipt: string | null;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number; // Unix timestamp
}

interface Payment {
  id: string;
  entity: 'payment';
  amount: number;
  currency: Currency;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  method: 'upi' | 'card' | 'netbanking' | 'wallet';
  captured: boolean;
  email?: string;
  contact?: string;
  created_at: number;
}

interface SubscriptionOptions {
  plan_id: string;
  customer_notify: 0 | 1;
  total_count?: number;
  quantity?: number;
  notes?: Record<string, string>;
  start_at?: number; // Unix timestamp
}

interface Subscription {
  id: string;
  entity: 'subscription';
  plan_id: string;
  customer_id?: string;
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'cancelled' | 'completed' | 'expired';
  current_start: number;
  current_end: number;
  ended_at: number | null;
  quantity: number;
  notes: Record<string, string>;
  charge_at: number;
  start_at: number;
  end_at: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  created_at: number;
}

interface Customer {
  id: string;
  entity: 'customer';
  name: string;
  email: string;
  contact?: string;
  gstin?: string;
  notes: Record<string, string>;
  created_at: number;
}

interface Invoice {
  id: string;
  entity: 'invoice';
  customer_id: string;
  subscription_id?: string;
  order_id?: string;
  line_items: Array<{
    name: string;
    amount: number;
    quantity: number;
  }>;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: Currency;
  status: 'issued' | 'paid' | 'partially_paid' | 'expired' | 'cancelled';
  created_at: number;
  paid_at: number | null;
}

/**
 * Mock ID generator for realistic Razorpay IDs
 */
function generateMockId(prefix: string): string {
  const randomStr = Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);
  return `${prefix}_${randomStr}`;
}

/**
 * Razorpay Stub Class
 * Implements common Razorpay SDK methods with mock data
 */
class RazorpayStub {
  // Simulate success rate (90% success, 10% failure for testing)
  private shouldSucceed(): boolean {
    return Math.random() > 0.1;
  }

  // Orders API
  orders = {
    create: async (options: OrderOptions): Promise<Order> => {
      console.log('[Razorpay Stub] Creating order:', options);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        id: generateMockId('order'),
        entity: 'order',
        amount: options.amount,
        amount_paid: 0,
        amount_due: options.amount,
        currency: options.currency,
        receipt: options.receipt || null,
        status: 'created',
        attempts: 0,
        notes: options.notes || {},
        created_at: Math.floor(Date.now() / 1000),
      };
    },

    fetch: async (orderId: string): Promise<Order> => {
      console.log('[Razorpay Stub] Fetching order:', orderId);

      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        id: orderId,
        entity: 'order',
        amount: 100000, // ₹1000
        amount_paid: 100000,
        amount_due: 0,
        currency: 'INR',
        receipt: null,
        status: 'paid',
        attempts: 1,
        notes: {},
        created_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
    },
  };

  // Payments API
  payments = {
    capture: async (paymentId: string, amount: number): Promise<Payment> => {
      console.log('[Razorpay Stub] Capturing payment:', paymentId, amount);

      await new Promise(resolve => setTimeout(resolve, 400));

      if (!this.shouldSucceed()) {
        throw new Error('Payment capture failed: Insufficient funds');
      }

      return {
        id: paymentId,
        entity: 'payment',
        amount,
        currency: 'INR',
        status: 'captured',
        order_id: generateMockId('order'),
        method: 'upi',
        captured: true,
        created_at: Math.floor(Date.now() / 1000),
      };
    },

    fetch: async (paymentId: string): Promise<Payment> => {
      console.log('[Razorpay Stub] Fetching payment:', paymentId);

      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        id: paymentId,
        entity: 'payment',
        amount: 100000,
        currency: 'INR',
        status: 'captured',
        order_id: generateMockId('order'),
        method: 'upi',
        captured: true,
        email: 'customer@example.com',
        contact: '+919876543210',
        created_at: Math.floor(Date.now() / 1000) - 1800, // 30 min ago
      };
    },

    refund: async (paymentId: string, options?: { amount?: number }): Promise<Payment> => {
      console.log('[Razorpay Stub] Refunding payment:', paymentId, options);

      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        id: paymentId,
        entity: 'payment',
        amount: options?.amount || 100000,
        currency: 'INR',
        status: 'refunded',
        order_id: generateMockId('order'),
        method: 'upi',
        captured: true,
        created_at: Math.floor(Date.now() / 1000),
      };
    },
  };

  // Customers API
  customers = {
    create: async (options: {
      name: string;
      email: string;
      contact?: string;
      gstin?: string;
      notes?: Record<string, string>;
    }): Promise<Customer> => {
      console.log('[Razorpay Stub] Creating customer:', options);

      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        id: generateMockId('cust'),
        entity: 'customer',
        name: options.name,
        email: options.email,
        contact: options.contact,
        gstin: options.gstin,
        notes: options.notes || {},
        created_at: Math.floor(Date.now() / 1000),
      };
    },

    fetch: async (customerId: string): Promise<Customer> => {
      console.log('[Razorpay Stub] Fetching customer:', customerId);

      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        id: customerId,
        entity: 'customer',
        name: 'Test Customer',
        email: 'customer@example.com',
        contact: '+919876543210',
        gstin: '27AABCU9603R1ZX',
        notes: {},
        created_at: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      };
    },
  };

  // Subscriptions API
  subscriptions = {
    create: async (options: SubscriptionOptions): Promise<Subscription> => {
      console.log('[Razorpay Stub] Creating subscription:', options);

      await new Promise(resolve => setTimeout(resolve, 400));

      const now = Math.floor(Date.now() / 1000);
      const startAt = options.start_at || now;
      const monthlyDuration = 30 * 24 * 60 * 60; // 30 days in seconds

      return {
        id: generateMockId('sub'),
        entity: 'subscription',
        plan_id: options.plan_id,
        customer_id: generateMockId('cust'),
        status: 'created',
        current_start: startAt,
        current_end: startAt + monthlyDuration,
        ended_at: null,
        quantity: options.quantity || 1,
        notes: options.notes || {},
        charge_at: startAt,
        start_at: startAt,
        end_at: options.total_count ? startAt + (options.total_count * monthlyDuration) : 0,
        auth_attempts: 0,
        total_count: options.total_count || 12,
        paid_count: 0,
        created_at: now,
      };
    },

    fetch: async (subscriptionId: string): Promise<Subscription> => {
      console.log('[Razorpay Stub] Fetching subscription:', subscriptionId);

      await new Promise(resolve => setTimeout(resolve, 200));

      const now = Math.floor(Date.now() / 1000);
      const monthlyDuration = 30 * 24 * 60 * 60;

      return {
        id: subscriptionId,
        entity: 'subscription',
        plan_id: 'plan_pro_monthly',
        customer_id: generateMockId('cust'),
        status: 'active',
        current_start: now - monthlyDuration,
        current_end: now,
        ended_at: null,
        quantity: 1,
        notes: {},
        charge_at: now,
        start_at: now - monthlyDuration,
        end_at: now + (11 * monthlyDuration), // 11 months remaining
        auth_attempts: 0,
        total_count: 12,
        paid_count: 1,
        created_at: now - monthlyDuration,
      };
    },

    cancel: async (subscriptionId: string, cancelAtCycleEnd: boolean = false): Promise<Subscription> => {
      console.log('[Razorpay Stub] Cancelling subscription:', subscriptionId, cancelAtCycleEnd);

      await new Promise(resolve => setTimeout(resolve, 300));

      const now = Math.floor(Date.now() / 1000);
      const monthlyDuration = 30 * 24 * 60 * 60;

      return {
        id: subscriptionId,
        entity: 'subscription',
        plan_id: 'plan_pro_monthly',
        customer_id: generateMockId('cust'),
        status: cancelAtCycleEnd ? 'active' : 'cancelled',
        current_start: now - monthlyDuration,
        current_end: now,
        ended_at: cancelAtCycleEnd ? null : now,
        quantity: 1,
        notes: { cancel_at_cycle_end: cancelAtCycleEnd.toString() },
        charge_at: now,
        start_at: now - monthlyDuration,
        end_at: now,
        auth_attempts: 0,
        total_count: 12,
        paid_count: 1,
        created_at: now - monthlyDuration,
      };
    },
  };

  // Invoices API
  invoices = {
    create: async (options: {
      customer_id: string;
      type: 'invoice' | 'link';
      amount: number;
      currency: Currency;
      description?: string;
      line_items?: Array<{
        name: string;
        amount: number;
        quantity: number;
      }>;
    }): Promise<Invoice> => {
      console.log('[Razorpay Stub] Creating invoice:', options);

      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        id: generateMockId('inv'),
        entity: 'invoice',
        customer_id: options.customer_id,
        line_items: options.line_items || [{
          name: options.description || 'Payment',
          amount: options.amount,
          quantity: 1,
        }],
        amount: options.amount,
        amount_paid: 0,
        amount_due: options.amount,
        currency: options.currency,
        status: 'issued',
        created_at: Math.floor(Date.now() / 1000),
        paid_at: null,
      };
    },

    fetch: async (invoiceId: string): Promise<Invoice> => {
      console.log('[Razorpay Stub] Fetching invoice:', invoiceId);

      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        id: invoiceId,
        entity: 'invoice',
        customer_id: generateMockId('cust'),
        line_items: [{
          name: 'Pro Plan - Monthly',
          amount: 499900, // ₹4,999
          quantity: 1,
        }],
        amount: 589882, // Including 18% GST
        amount_paid: 589882,
        amount_due: 0,
        currency: 'INR',
        status: 'paid',
        created_at: Math.floor(Date.now() / 1000) - 3600,
        paid_at: Math.floor(Date.now() / 1000) - 3500,
      };
    },
  };

  // Utility: Verify webhook signature (stub always returns true)
  webhooks = {
    validateSignature: (body: string, signature: string, secret: string): boolean => {
      console.log('[Razorpay Stub] Validating webhook signature (always returns true in stub)');
      return true; // In production, this would verify HMAC signature
    },
  };
}

// Export singleton instance
export const razorpay = new RazorpayStub();

// Export types for use in other files
export type { Order, Payment, Subscription, Customer, Invoice };

/**
 * PRODUCTION REPLACEMENT GUIDE
 * ============================
 *
 * When you're ready to go live with real Razorpay:
 *
 * 1. Install Razorpay SDK:
 *    npm install razorpay
 *
 * 2. Get your API keys from Razorpay dashboard:
 *    - Test mode: rzp_test_XXXXXXXXXX
 *    - Live mode: rzp_live_XXXXXXXXXX
 *
 * 3. Add to .env:
 *    RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
 *    RAZORPAY_KEY_SECRET=your_secret_key
 *    RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
 *
 * 4. Replace this file's content with:
 *
 *    import Razorpay from 'razorpay';
 *
 *    export const razorpay = new Razorpay({
 *      key_id: process.env.RAZORPAY_KEY_ID!,
 *      key_secret: process.env.RAZORPAY_KEY_SECRET!,
 *    });
 *
 *    export type { ... } // Keep type exports
 *
 * 5. Update webhook signature validation to use real secret
 *
 * That's it! All your payment code will work with real Razorpay.
 */
