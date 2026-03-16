'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface PaymentSetupStepProps {
  onSaved?: () => void;
}

export function PaymentSetupStep({ onSaved }: PaymentSetupStepProps) {
  const [upiId, setUpiId] = useState('');
  const [isUpiSaved, setIsUpiSaved] = useState(false);
  const [isUpiSaving, setIsUpiSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUpiStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/upi');
      if (res.ok) {
        const data = (await res.json()) as { upiId?: string | null };
        if (data.upiId) {
          setUpiId(data.upiId);
          setIsUpiSaved(true);
        }
      }
    } catch (checkError) {
      console.error('Error checking UPI status:', checkError);
      setError('Failed to check UPI status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkUpiStatus();
  }, [checkUpiStatus]);

  const handleSaveUpi = async () => {
    if (!upiId.trim()) {
      setError('Please enter a valid UPI ID');
      return;
    }
    setIsUpiSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upiId: upiId.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to save UPI ID');
        return;
      }
      setIsUpiSaved(true);
      if (onSaved) {
        onSaved();
      }
    } catch (saveError) {
      console.error('Error saving UPI ID:', saveError);
      setError('Failed to save UPI ID');
    } finally {
      setIsUpiSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#9c7c46]" />
          <p className="mt-3 text-sm text-[#6f5b3e]">Checking payment settings...</p>
        </div>
      </div>
    );
  }

  if (isUpiSaved && upiId) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-green-900">Payment Link Setup Complete!</h3>
              <p className="mt-1 text-sm text-green-700">
                Your UPI ID has been saved and is ready to use for payment links.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
          <div className="flex items-start gap-3">
            <IndianRupee className="mt-0.5 h-5 w-5 text-[#9c7c46]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1b140a]">UPI ID</p>
              <p className="mt-1 text-xs text-[#6f5b3e]">{upiId}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
          <p className="text-xs text-[#6f5b3e]">
            <span className="font-medium text-[#1b140a]">What you can do now:</span> Include payment
            links in your proposals and WhatsApp messages. Clients can pay you directly using UPI,
            making it easy to collect advance payments and final settlements.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsUpiSaved(false);
              setUpiId('');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#dcc9aa] px-3 py-2.5 text-[#6f5b3e] hover:bg-[#f8f1e6]"
          >
            Change UPI ID
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
        <div className="flex items-start gap-3">
          <IndianRupee className="mt-0.5 h-5 w-5 text-[#9c7c46]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9c7c46]">
              Payment Integration
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#1b140a]">
              Set Up Payment Links
            </h3>
            <p className="mt-1 text-sm text-[#6f5b3e]">
              Add your UPI ID to include payment links in proposals and WhatsApp messages. This
              makes it easy for clients to pay you directly. This step is optional but highly
              recommended for faster payments.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#eadfcd] bg-white p-6">
        <h4 className="text-sm font-semibold text-[#1b140a]">Benefits of Payment Links:</h4>
        <ul className="mt-3 space-y-2 text-sm text-[#6f5b3e]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7c46]" />
            <span>Accept payments directly via UPI (Google Pay, PhonePe, Paytm, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7c46]" />
            <span>Include payment links in proposals and WhatsApp messages</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7c46]" />
            <span>Get instant payment confirmations</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9c7c46]" />
            <span>No payment gateway fees or setup required</span>
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-[#1b140a]">Enter Your UPI ID:</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi or yourname@bank"
            className="flex-1 rounded-xl border border-[#dcc9aa] bg-white px-4 py-2.5 text-sm focus:border-[#9c7c46] focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <button
            type="button"
            onClick={() => {
              void handleSaveUpi();
            }}
            disabled={isUpiSaving || !upiId.trim()}
            className="rounded-lg bg-[#9c7c46] px-5 py-2.5 text-sm text-white transition hover:bg-[#8a6b3d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpiSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <a
          href="https://razorpay.com/docs/payments/payment-links/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-[#dcc9aa] px-3 py-2.5 text-[#6f5b3e] hover:bg-[#f8f1e6]"
        >
          Learn About Razorpay Payment Links
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4 text-sm text-[#6f5b3e]">
        <p>
          <span className="font-medium text-[#1b140a]">Note:</span> Your UPI ID is typically in the
          format <code className="rounded bg-[#eadfcd] px-1">yourname@upi</code> or{' '}
          <code className="rounded bg-[#eadfcd] px-1">yourname@bankname</code>. You can skip this
          step and set it up later from Settings.
        </p>
      </div>
    </div>
  );
}
