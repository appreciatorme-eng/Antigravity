"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import {
  formatPaymentAmount,
  type PaymentLinkData,
} from "@/lib/payments/payment-links";
import { recordEvent } from "@/lib/payments/link-tracker";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

async function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.Razorpay) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

interface PaymentCheckoutClientProps {
  initialLink: PaymentLinkData;
}

export function PaymentCheckoutClient({ initialLink }: PaymentCheckoutClientProps) {
  const [link, setLink] = useState(initialLink);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (link.status !== "pending" || link.viewedAt) return;

    void recordEvent(link.token, {
      type: "viewed",
      timestamp: new Date().toISOString(),
    }).then((updated) => {
      if (updated) {
        setLink(updated);
      }
    }).catch(() => {
      // Non-blocking analytics event.
    });
  }, [link.status, link.token, link.viewedAt]);

  async function handleCheckout() {
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      setError("Payment gateway is not configured yet. Please contact the operator.");
      return;
    }
    if (!link.razorpayOrderId) {
      setError("This payment link is missing its checkout order. Please request a new link.");
      return;
    }

    setError(null);
    setIsLaunching(true);

    try {
      await loadRazorpayCheckoutScript();
      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is unavailable");
      }

      const checkout = new window.Razorpay({
        key: razorpayKey,
        amount: link.amount,
        currency: link.currency,
        name: link.organizationName || "Travel Suite",
        description: link.description || link.proposalTitle || "Trip payment",
        order_id: link.razorpayOrderId,
        handler: async (response: Record<string, unknown>) => {
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                token: link.token,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const payload = (await verifyResponse.json().catch(() => null)) as
              | { data?: { link?: PaymentLinkData }; error?: string }
              | null;

            if (!verifyResponse.ok || !payload?.data?.link) {
              throw new Error(payload?.error || "Payment verification failed");
            }

            setLink(payload.data.link);
            setIsLaunching(false);
          } catch (verifyError) {
            console.error("[pay] verification failed:", verifyError);
            setError(
              verifyError instanceof Error
                ? verifyError.message
                : "Payment verification failed",
            );
            setIsLaunching(false);
          }
        },
        prefill: {
          name: link.clientName || undefined,
          email: link.clientEmail || undefined,
          contact: link.clientPhone?.replace(/\D/g, "") || undefined,
        },
        theme: {
          color: "#00d084",
        },
        modal: {
          ondismiss: () => {
            setIsLaunching(false);
          },
        },
      });

      checkout.open();
    } catch (checkoutError) {
      console.error("[pay] checkout failed:", checkoutError);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to launch payment checkout",
      );
      setIsLaunching(false);
    }
  }

  const isClosed = link.status === "paid" || link.status === "expired" || link.status === "cancelled";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00d084]">
          Secure payment
        </p>
        <h1 className="text-3xl font-bold text-white">
          {link.proposalTitle || link.description || "Travel payment"}
        </h1>
        <p className="text-sm text-white/60">
          {link.organizationName
            ? `Hosted by ${link.organizationName}`
            : "Pay this booking securely through Razorpay."}
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#081220]/70 p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-white/40">Amount due</p>
          <p className="mt-1 text-3xl font-semibold text-white">
            {formatPaymentAmount(link.amount)}
          </p>
        </div>
        <div className="space-y-2 text-sm text-white/70">
          <div className="flex items-center justify-between gap-4">
            <span>Status</span>
            <span className="font-medium capitalize">{link.status}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Customer</span>
            <span className="font-medium text-white">{link.clientName || "Traveler"}</span>
          </div>
          {link.expiresAt && (
            <div className="flex items-center justify-between gap-4">
              <span>Expires</span>
              <span className="font-medium text-white">
                {new Date(link.expiresAt).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>
      </div>

      {link.status === "paid" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Payment received</p>
            <p className="text-sm text-emerald-100/80">
              This link has already been paid{link.paidAt ? ` on ${new Date(link.paidAt).toLocaleString("en-IN")}` : ""}.
            </p>
          </div>
        </div>
      ) : link.status === "expired" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">This payment link has expired</p>
            <p className="text-sm text-red-100/80">
              Request a fresh link from the travel operator to continue.
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            void handleCheckout();
          }}
          disabled={isLaunching || isClosed}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00d084] px-5 py-4 text-sm font-semibold text-black transition hover:bg-[#00b873] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLaunching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Launching Razorpay...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay now
            </>
          )}
        </button>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
