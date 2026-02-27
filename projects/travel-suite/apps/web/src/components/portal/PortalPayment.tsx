'use client';

import { useState } from 'react';
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Copy,
  Building2,
} from 'lucide-react';

interface PortalPaymentProps {
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  upiId: string;
  tripName: string;
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Minimal SVG-based QR code visual (decorative pattern representing a QR)
function QRCodeVisual({ value }: { value: string }) {
  // Generate a deterministic-ish grid pattern from the value string
  const cells: boolean[] = [];
  for (let i = 0; i < 196; i++) {
    const charCode = value.charCodeAt(i % value.length) + i;
    cells.push(charCode % 3 !== 0);
  }

  return (
    <div className="inline-block p-3 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
      <div className="text-center mb-2">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Scan to Pay
        </span>
      </div>
      {/* Finder patterns + data cells */}
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 140 140" className="w-full h-full" aria-label="UPI QR Code">
          {/* Background */}
          <rect width="140" height="140" fill="white" />
          {/* Top-left finder */}
          <rect x="8" y="8" width="28" height="28" rx="3" fill="#111" />
          <rect x="13" y="13" width="18" height="18" rx="2" fill="white" />
          <rect x="17" y="17" width="10" height="10" rx="1" fill="#111" />
          {/* Top-right finder */}
          <rect x="104" y="8" width="28" height="28" rx="3" fill="#111" />
          <rect x="109" y="13" width="18" height="18" rx="2" fill="white" />
          <rect x="113" y="17" width="10" height="10" rx="1" fill="#111" />
          {/* Bottom-left finder */}
          <rect x="8" y="104" width="28" height="28" rx="3" fill="#111" />
          <rect x="13" y="109" width="18" height="18" rx="2" fill="white" />
          <rect x="17" y="113" width="10" height="10" rx="1" fill="#111" />
          {/* Data cells (14x14 grid in middle zone) */}
          {cells.map((filled, i) => {
            const col = i % 14;
            const row = Math.floor(i / 14);
            const x = 42 + col * 4;
            const y = 42 + row * 4;
            return filled ? (
              <rect key={i} x={x} y={y} width="3" height="3" fill="#111" />
            ) : null;
          })}
        </svg>
      </div>
      <p className="text-center text-[10px] text-gray-500 mt-2 font-mono break-all max-w-[9rem]">
        {value}
      </p>
    </div>
  );
}

export default function PortalPayment({
  totalAmount,
  paidAmount,
  dueAmount,
  upiId,
  tripName,
}: PortalPaymentProps) {
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const paidPct = Math.round((paidAmount / totalAmount) * 100);
  const fullyPaid = dueAmount <= 0;

  const upiUri = `upi://pay?pa=${upiId}&pn=TourOperator&am=${dueAmount}&cu=INR&tn=${encodeURIComponent(tripName)}`;

  function handleCopyUPI() {
    void navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsAppPayment() {
    const msg = encodeURIComponent(
      `Hi! Please find the payment request for your trip: *${tripName}*\n\n` +
        `Amount Due: *${formatINR(dueAmount)}*\n` +
        `UPI ID: *${upiId}*\n\n` +
        `Please complete the payment at your earliest convenience. Thank you! 🙏`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-800">Payment Summary</h3>
        <p className="text-xs text-gray-400 mt-0.5">{tripName}</p>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              {formatINR(paidAmount)} paid
            </span>
            <span className="text-sm text-gray-400">
              of {formatINR(totalAmount)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${paidPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-right">
            {paidPct}% paid
          </p>
        </div>

        {/* Amount chips */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Total
            </p>
            <p className="text-sm font-bold text-gray-800">{formatINR(totalAmount)}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
              Paid
            </p>
            <p className="text-sm font-bold text-emerald-700">{formatINR(paidAmount)}</p>
          </div>
          <div
            className={[
              'rounded-xl border p-3 text-center',
              fullyPaid
                ? 'border-gray-100 bg-gray-50'
                : 'border-rose-100 bg-rose-50',
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
              {formatINR(dueAmount)}
            </p>
          </div>
        </div>

        {/* Fully paid state */}
        {fullyPaid ? (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Fully Paid!</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                GST Invoice sent to your email.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Pay balance section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Pay Balance {formatINR(dueAmount)}
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {/* QR + app logos */}
              <div className="flex flex-col items-center gap-4">
                <QRCodeVisual value={upiUri} />

                {/* UPI ID copy */}
                <button
                  type="button"
                  onClick={handleCopyUPI}
                  className="inline-flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copied!' : `UPI: ${upiId}`}
                </button>

                {/* App logos */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Pay with:</span>
                  <span className="text-[11px] font-bold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                    PhonePe
                  </span>
                  <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                    GPay
                  </span>
                  <span className="text-[11px] font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full border border-sky-200">
                    Paytm
                  </span>
                </div>
              </div>

              {/* WhatsApp payment request */}
              <button
                type="button"
                onClick={handleWhatsAppPayment}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5a] transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Share Payment Request via WhatsApp
              </button>

              {/* Bank transfer collapsible */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setBankDetailsOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    Bank Transfer Details
                  </div>
                  {bankDetailsOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {bankDetailsOpen && (
                  <div className="px-4 py-3 space-y-2 bg-white">
                    {[
                      { label: 'Account Name', value: 'Rajasthan Heritage Tours Pvt Ltd' },
                      { label: 'Account No.', value: '1234 5678 9012 3456' },
                      { label: 'IFSC Code', value: 'HDFC0001234' },
                      { label: 'Bank', value: 'HDFC Bank, Jaipur Main Branch' },
                      { label: 'Reference', value: 'RHT-KS-2026-0315' },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-gray-400 font-medium">{item.label}</span>
                        <span className="text-gray-700 font-semibold">{item.value}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                      Please use the reference number when making the transfer. Allow 1-2 business days for processing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
