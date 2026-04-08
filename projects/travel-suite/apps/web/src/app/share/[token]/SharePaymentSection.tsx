"use client";
/* eslint-disable no-restricted-syntax -- public share payments intentionally post without authenticated session headers */

import { useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    CreditCard,
    IndianRupee,
    Link2,
} from "lucide-react";
import {
    formatPaymentAmount,
    type PaymentLinkData,
} from "@/lib/payments/payment-links";
import {
    getSharePaymentAmountForOption,
    type SharePaymentConfig,
    type SharePaymentOption,
} from "@/lib/share/payment-config";

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => {
            open: () => void;
        };
    }
}

async function loadRazorpayScript(): Promise<void> {
    if (typeof window === "undefined") return;
    if (window.Razorpay) return;

    const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com"]');
    if (existing) {
        return new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(() => reject(new Error("Razorpay checkout load timed out")), 10_000);
            existing.addEventListener("load", () => {
                window.clearTimeout(timeout);
                resolve();
            }, { once: true });
            existing.addEventListener("error", () => {
                window.clearTimeout(timeout);
                reject(new Error("Failed to load Razorpay checkout"));
            }, { once: true });
        });
    }

    return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
        document.head.appendChild(script);
    });
}

interface SharePaymentSectionProps {
    token: string;
    tripTitle: string;
    paymentConfig: SharePaymentConfig | null;
}

export function SharePaymentSection({
    token,
    tripTitle,
    paymentConfig,
}: SharePaymentSectionProps) {
    const [activeLink, setActiveLink] = useState<PaymentLinkData | null>(null);
    const [submittingOption, setSubmittingOption] = useState<SharePaymentOption | null>(null);
    const [error, setError] = useState<string | null>(null);

    const options = useMemo(() => {
        if (!paymentConfig) return [];
        if (paymentConfig.mode === "full_only") {
            return [{ option: "full" as const, label: "Pay full amount" }];
        }
        if (paymentConfig.mode === "deposit_only") {
            return [{ option: "deposit" as const, label: `Pay ${paymentConfig.deposit_percent}% deposit` }];
        }
        return [
            { option: "deposit" as const, label: `Pay ${paymentConfig.deposit_percent}% deposit` },
            { option: "full" as const, label: "Pay full amount" },
        ];
    }, [paymentConfig]);

    if (!paymentConfig) return null;

    async function openCheckout(link: PaymentLinkData) {
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
            throw new Error("Payment gateway is not configured yet. Please contact the operator.");
        }
        if (!link.razorpayOrderId) {
            throw new Error("This payment link is missing its checkout order.");
        }

        await loadRazorpayScript();
        if (!window.Razorpay) {
            throw new Error("Razorpay checkout is unavailable right now.");
        }

        await fetch(`/api/payments/links/${link.token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "viewed" }),
        }).catch(() => null);

        await new Promise<void>((resolve, reject) => {
            const checkout = new window.Razorpay!({
                key: razorpayKey,
                amount: link.amount,
                currency: link.currency,
                name: link.organizationName || "TripBuilt",
                description: link.description || tripTitle,
                order_id: link.razorpayOrderId,
                handler: async (response: Record<string, unknown>) => {
                    try {
                        const verifyResponse = await fetch("/api/payments/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                token: link.token,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        const payload = await verifyResponse.json().catch(() => null) as
                            | { data?: { link?: PaymentLinkData }; error?: string }
                            | null;

                        if (!verifyResponse.ok || !payload?.data?.link) {
                            throw new Error(payload?.error || "Payment verification failed");
                        }

                        setActiveLink(payload.data.link);
                        resolve();
                    } catch (verifyError) {
                        reject(verifyError);
                    }
                },
                prefill: {
                    name: link.clientName || undefined,
                    email: link.clientEmail || undefined,
                    contact: link.clientPhone?.replace(/\D/g, "") || undefined,
                },
                theme: {
                    color: "#111827",
                },
                modal: {
                    ondismiss: () => resolve(),
                },
            });

            checkout.open();
        });
    }

    async function startPayment(option: SharePaymentOption) {
        setSubmittingOption(option);
        setError(null);

        try {
            const response = await fetch(`/api/share/${token}/payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ option }),
            });

            const payload = await response.json().catch(() => null) as
                | { data?: { link?: PaymentLinkData }; error?: string }
                | null;

            if (!response.ok || !payload?.data?.link) {
                throw new Error(payload?.error || "Unable to start payment");
            }

            const link = payload.data.link;
            setActiveLink(link);

            if (link.status === "paid") {
                return;
            }

            try {
                await openCheckout(link);
            } catch (checkoutError) {
                setError(
                    checkoutError instanceof Error
                        ? `${checkoutError.message} You can continue on the hosted payment page instead.`
                        : "Unable to open Razorpay. You can continue on the hosted payment page instead.",
                );
            }
        } catch (paymentError) {
            setError(
                paymentError instanceof Error
                    ? paymentError.message
                    : "Unable to start payment right now.",
            );
        } finally {
            setSubmittingOption(null);
        }
    }

    const anyPaid = activeLink?.status === "paid";

    return (
        <section className="border-t border-gray-200 bg-white px-6 py-12">
            <div className="mx-auto max-w-5xl">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                                Secure your booking
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm text-gray-600">
                                Pay directly on this share page using Razorpay. Your travel operator can request the full amount, a deposit, or let you choose between both.
                            </p>
                        </div>

                        {paymentConfig.notes ? (
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                {paymentConfig.notes}
                            </div>
                        ) : null}

                        {anyPaid ? (
                            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Payment received</p>
                                    <p className="mt-1 text-sm text-emerald-800">
                                        {activeLink?.paidAt
                                            ? `Paid on ${new Date(activeLink.paidAt).toLocaleString("en-IN")}.`
                                            : "This share already has a completed payment for the selected option."}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {error ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div className="space-y-3">
                                        <p>{error}</p>
                                        {activeLink?.paymentUrl ? (
                                            <a
                                                href={activeLink.paymentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 font-medium text-amber-900 transition hover:bg-amber-100"
                                            >
                                                <Link2 className="h-4 w-4" />
                                                Continue on hosted payment page
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                                    Available payment options
                                </p>
                                <div className="mt-3 space-y-2">
                                    {options.map(({ option, label }) => {
                                        const amount = getSharePaymentAmountForOption(paymentConfig, option);
                                        const isBusy = submittingOption === option;
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => void startPayment(option)}
                                                disabled={submittingOption !== null || anyPaid}
                                                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                        <CreditCard className="h-4 w-4 text-gray-500" />
                                                        {label}
                                                    </div>
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        Pay securely using Razorpay
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatPaymentAmount(amount)}
                                                    </div>
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {isBusy ? "Preparing..." : "INR"}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    <IndianRupee className="h-4 w-4 text-gray-500" />
                                    Payment summary
                                </div>
                                <div className="mt-3 space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center justify-between gap-4">
                                        <span>Full amount</span>
                                        <span className="font-medium text-gray-900">
                                            {formatPaymentAmount(paymentConfig.full_amount_paise)}
                                        </span>
                                    </div>
                                    {paymentConfig.deposit_amount_paise ? (
                                        <div className="flex items-center justify-between gap-4">
                                            <span>Deposit option</span>
                                            <span className="font-medium text-gray-900">
                                                {formatPaymentAmount(paymentConfig.deposit_amount_paise)}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
