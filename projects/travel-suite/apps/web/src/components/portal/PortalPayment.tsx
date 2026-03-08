'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  CreditCard,
  ExternalLink,
  Phone,
} from 'lucide-react';
import { formatPaymentAmount, type PaymentLinkData } from '@/lib/payments/payment-links';

interface PortalPaymentProps {
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  tripName: string;
  paymentLink?: PaymentLinkData | null;
  operatorName: string;
  operatorPhone?: string | null;
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function PortalPayment({
  totalAmount,
  paidAmount,
  dueAmount,
  tripName,
  paymentLink,
  operatorName,
  operatorPhone,
}: PortalPaymentProps) {
  const [copied, setCopied] = useState(false);

  const safeTotalAmount = Math.max(totalAmount, 0);
  const safePaidAmount = Math.max(paidAmount, 0);
  const safeDueAmount = Math.max(dueAmount, 0);
  const paidPct = safeTotalAmount > 0 ? Math.round((safePaidAmount / safeTotalAmount) * 100) : 0;
  const fullyPaid = safeDueAmount <= 0;
  const paymentUrl = paymentLink?.paymentUrl || null;
  const paymentStatusLabel = paymentLink
    ? paymentLink.status.replace(/_/g, ' ')
    : fullyPaid
      ? 'paid'
      : 'pending';

  async function handleCopyLink() {
    if (!paymentUrl) return;
    await navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-800">Payment Summary</h3>
        <p className="text-xs text-gray-400 mt-0.5">{tripName}</p>
      </div>

      <div className="px-5 py-4 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              {formatINR(safePaidAmount)} paid
            </span>
            <span className="text-sm text-gray-400">of {formatINR(safeTotalAmount)}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(paidPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-right">{paidPct}% paid</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Total
            </p>
            <p className="text-sm font-bold text-gray-800">{formatINR(safeTotalAmount)}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
              Paid
            </p>
            <p className="text-sm font-bold text-emerald-700">{formatINR(safePaidAmount)}</p>
          </div>
          <div
            className={[
              'rounded-xl border p-3 text-center',
              fullyPaid ? 'border-gray-100 bg-gray-50' : 'border-rose-100 bg-rose-50',
            ].join(' ')}
          >
            <p
              className={[
                'text-[10px] font-semibold uppercase tracking-wide mb-1',
                fullyPaid ? 'text-gray-400' : 'text-rose-500',
              ].join(' ')}
            >
              Due
            </p>
            <p
              className={[
                'text-sm font-bold',
                fullyPaid ? 'text-gray-400' : 'text-rose-600',
              ].join(' ')}
            >
              {formatINR(safeDueAmount)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Latest checkout status
              </p>
              <p className="text-sm font-semibold text-gray-800 capitalize">
                {paymentStatusLabel}
              </p>
            </div>
            {paymentLink?.createdAt && (
              <p className="text-xs text-gray-500 text-right">
                Issued {new Date(paymentLink.createdAt).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>

        {fullyPaid ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Payment received</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                This trip has been fully paid{paymentLink?.paidAt ? ` on ${new Date(paymentLink.paidAt).toLocaleString('en-IN')}` : ''}.
              </p>
            </div>
          </div>
        ) : paymentLink ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Secure checkout ready</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Pay {formatPaymentAmount(paymentLink.amount)} through the secure Razorpay page.
                  </p>
                  {paymentLink.expiresAt && (
                    <p className="text-[11px] text-blue-700 mt-2">
                      Expires on {new Date(paymentLink.expiresAt).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={paymentUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
              >
                <CreditCard className="w-4 h-4" />
                Open Secure Payment Page
              </Link>

              <button
                type="button"
                onClick={() => {
                  void handleCopyLink();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-500" />
                {copied ? 'Copied' : 'Copy Payment Link'}
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center">
              Opens the hosted payment page in a new tab. Payment status updates after verification.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">Payment link pending</p>
                <p className="text-xs text-amber-700 mt-1">
                  The operator has not issued a live checkout link yet. Contact {operatorName} to complete the payment.
                </p>
              </div>
            </div>

            {operatorPhone && (
              <a
                href={`tel:${operatorPhone}`}
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-amber-200 bg-white text-sm font-semibold text-amber-800 hover:bg-amber-100/60 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call {operatorName}
              </a>
            )}
          </div>
        )}

        {paymentLink?.status === 'expired' && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">This payment link has expired.</p>
            <p className="text-xs text-red-600 mt-1">
              Request a fresh link from {operatorName} before attempting payment.
            </p>
          </div>
        )}

        {paymentUrl && (
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="text-xs text-gray-500 truncate pr-3">Hosted checkout</span>
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Open
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
