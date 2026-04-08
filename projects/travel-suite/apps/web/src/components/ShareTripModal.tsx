"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Copy,
    Check,
    Share2,
    Loader2,
    CreditCard,
    Link2,
    IndianRupee,
} from "lucide-react";
import type { ItineraryResult } from "@/types/itinerary";
import { useToast } from "@/components/ui/toast";
import ClientPicker from "@/components/ClientPicker";
import { authedFetch } from "@/lib/api/authed-fetch";
import {
    SHARE_PAYMENT_DEPOSIT_PRESETS,
    computeDepositAmountPaise,
    type SharePaymentConfig,
    type SharePaymentDefaults,
    type SharePaymentDepositPreset,
    type SharePaymentMode,
} from "@/lib/share/payment-config";

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId?: string;
    itineraryId?: string;
    tripTitle: string;
    isPro?: boolean;
    initialTemplateId?: string;
    rawItineraryData?: ItineraryResult;
}

interface ShareResponseData {
    shareCode?: string;
    shareUrl?: string;
    itineraryId?: string;
    paymentEligible?: boolean;
    paymentDisabledReason?: string | null;
    paymentDefaults?: SharePaymentDefaults | null;
    paymentConfig?: SharePaymentConfig | null;
}

function formatRupeesFromPaise(value: number | null | undefined): string {
    if (!value || value <= 0) return "";
    return String(Math.round(value / 100));
}

function parseRupeesToPaise(value: string): number {
    const normalized = Number(value.replace(/,/g, "").trim());
    if (!Number.isFinite(normalized) || normalized <= 0) return 0;
    return Math.round(normalized * 100);
}

export default function ShareTripModal({
    isOpen,
    onClose,
    tripId,
    itineraryId,
    tripTitle,
    initialTemplateId = "safari_story",
    rawItineraryData,
}: ShareTripModalProps) {
    const { toast } = useToast();
    const resolvedIdRef = useRef<string | undefined>(itineraryId);

    const [loading, setLoading] = useState(false);
    const [savingPayment, setSavingPayment] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [shareData, setShareData] = useState<ShareResponseData | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const [paymentEnabled, setPaymentEnabled] = useState(false);
    const [paymentMode, setPaymentMode] = useState<SharePaymentMode>("client_choice");
    const [fullAmountInput, setFullAmountInput] = useState("");
    const [depositPercent, setDepositPercent] = useState<SharePaymentDepositPreset>(30);
    const [paymentTitle, setPaymentTitle] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");

    const routePath = tripId
        ? `/api/admin/trips/${tripId}/share-link`
        : "/api/admin/share/create";

    const paymentDefaults = shareData?.paymentDefaults ?? null;
    const paymentEligible = shareData?.paymentEligible === true;
    const paymentDisabledReason = shareData?.paymentDisabledReason ?? null;

    useEffect(() => {
        if (!isOpen) return;
        setError("");
        if (shareLink || loading) return;
        void generateShareLink();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (!shareData) return;
        const config = shareData.paymentConfig;
        if (config) {
            setPaymentEnabled(true);
            setPaymentMode(config.mode);
            setFullAmountInput(formatRupeesFromPaise(config.full_amount_paise));
            setDepositPercent(config.deposit_percent || 30);
            setPaymentTitle(config.title || shareData.paymentDefaults?.title || "");
            setPaymentNotes(config.notes || "");
            return;
        }

        setPaymentEnabled(false);
        setPaymentMode("client_choice");
        setFullAmountInput(formatRupeesFromPaise(shareData.paymentDefaults?.full_amount_paise));
        setDepositPercent(30);
        setPaymentTitle(shareData.paymentDefaults?.title || "");
        setPaymentNotes(shareData.paymentDefaults?.notes || "");
    }, [shareData]);

    const depositAmountPaise = useMemo(() => {
        const fullAmountPaise = parseRupeesToPaise(fullAmountInput);
        if (!fullAmountPaise || !depositPercent) return 0;
        return computeDepositAmountPaise(fullAmountPaise, depositPercent);
    }, [depositPercent, fullAmountInput]);

    const buildPaymentConfig = (): SharePaymentConfig | null => {
        if (!paymentEnabled || !paymentEligible) return null;
        const fullAmountPaise = parseRupeesToPaise(fullAmountInput);
        if (!fullAmountPaise) {
            throw new Error("Enter the payable INR amount before saving payment options.");
        }

        const config: SharePaymentConfig = {
            enabled: true,
            mode: paymentMode,
            currency: "INR",
            full_amount_paise: fullAmountPaise,
            title: paymentTitle.trim() || undefined,
            notes: paymentNotes.trim() || undefined,
        };

        if (paymentMode === "deposit_only" || paymentMode === "client_choice") {
            config.deposit_percent = depositPercent;
            config.deposit_amount_paise = depositAmountPaise;
        }

        return config;
    };

    const generateShareLink = async (overridePaymentConfig?: SharePaymentConfig | null) => {
        setLoading(true);
        setError("");
        try {
            const body: Record<string, unknown> = {
                templateId: initialTemplateId,
            };

            if (tripId) {
                if (overridePaymentConfig !== undefined) {
                    body.paymentConfig = overridePaymentConfig;
                }
            } else {
                body.itineraryId = itineraryId ?? undefined;
                body.rawItineraryData = !itineraryId && rawItineraryData ? rawItineraryData : undefined;
                if (overridePaymentConfig !== undefined) {
                    body.paymentConfig = overridePaymentConfig;
                }
            }

            const response = await authedFetch(routePath, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-requested-with": "XMLHttpRequest",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || "Failed to generate share link");
            }

            const payload = await response.json();
            const data = payload.data as ShareResponseData;
            resolvedIdRef.current = data.itineraryId ?? itineraryId;
            setShareData(data);
            setShareLink(
                typeof data.shareUrl === "string"
                    ? data.shareUrl.replace(/^https?:\/\/tripbuilt\.com/i, window.location.origin)
                    : `${window.location.origin}/share/${data.shareCode}`,
            );
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to generate share link");
        } finally {
            setLoading(false);
        }
    };

    const savePaymentSettings = async () => {
        setSavingPayment(true);
        setError("");
        try {
            const nextConfig = buildPaymentConfig();
            await generateShareLink(nextConfig);
            toast({
                title: paymentEnabled ? "Payment options saved" : "Share updated",
                description: paymentEnabled
                    ? "Clients will now see the configured Razorpay payment options on the share page."
                    : "Payment collection is disabled for this share.",
                variant: "success",
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to save payment settings";
            setError(message);
            toast({
                title: "Save failed",
                description: message,
                variant: "error",
            });
        } finally {
            setSavingPayment(false);
        }
    };

    const copyToClipboard = () => {
        if (!shareLink) return;
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: "Client share link copied",
            description: "Share this live preview directly with your traveler.",
            durationMs: 3000,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        Share {tripTitle}
                    </DialogTitle>
                    <DialogDescription>
                        Create the client share link, then optionally turn on Razorpay collection for full or deposit payments.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {!shareLink ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-10">
                            {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                            <p className="text-sm text-gray-500">
                                {error || "Generating your client share..."}
                            </p>
                            {error ? (
                                <Button size="sm" variant="outline" onClick={() => void generateShareLink()}>
                                    Try again
                                </Button>
                            ) : null}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                Client share is live. Copy the link below or send it directly after assigning the traveler.
                            </div>

                            <div className="flex gap-2">
                                <Input value={shareLink} readOnly className="font-mono text-sm bg-gray-50" />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={copyToClipboard}
                                    className={copied ? "border-emerald-600 bg-emerald-50 text-emerald-600" : ""}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>

                            <ClientPicker
                                shareLink={shareLink}
                                itineraryId={resolvedIdRef.current}
                                tripId={tripId}
                                onAssigned={() => {
                                    void generateShareLink();
                                }}
                            />

                            <section className="rounded-2xl border border-gray-200 bg-white">
                                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <CreditCard className="h-4 w-4 text-primary" />
                                            Share page payment
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Let the client pay on the shared itinerary using your existing Razorpay integration.
                                        </p>
                                    </div>
                                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={paymentEnabled}
                                            disabled={!paymentEligible}
                                            onChange={(event) => setPaymentEnabled(event.target.checked)}
                                        />
                                        Enable
                                    </label>
                                </div>

                                <div className="space-y-4 px-5 py-4">
                                    {!paymentEligible ? (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                            {paymentDisabledReason || "Payment setup is only available for linked trips with an assigned client."}
                                        </div>
                                    ) : paymentEnabled ? (
                                        <>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                                                        Payment mode
                                                    </label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {[
                                                            { value: "full_only", label: "Full amount only" },
                                                            { value: "deposit_only", label: "Deposit only" },
                                                            { value: "client_choice", label: "Client chooses full or deposit" },
                                                        ].map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setPaymentMode(option.value as SharePaymentMode)}
                                                                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                                                                    paymentMode === option.value
                                                                        ? "border-slate-900 bg-slate-900 text-white"
                                                                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                                                }`}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                                                        Full amount (INR)
                                                    </label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                        <Input
                                                            value={fullAmountInput}
                                                            onChange={(event) => setFullAmountInput(event.target.value)}
                                                            className="pl-9"
                                                            inputMode="decimal"
                                                            placeholder={formatRupeesFromPaise(paymentDefaults?.full_amount_paise)}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        Confirm the final INR amount the client should see on the share page.
                                                    </p>
                                                </div>
                                            </div>

                                            {(paymentMode === "deposit_only" || paymentMode === "client_choice") ? (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                                                        Deposit preset
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {SHARE_PAYMENT_DEPOSIT_PRESETS.map((preset) => (
                                                            <button
                                                                key={preset}
                                                                type="button"
                                                                onClick={() => setDepositPercent(preset)}
                                                                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                                                    depositPercent === preset
                                                                        ? "border-slate-900 bg-slate-900 text-white"
                                                                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                                                }`}
                                                            >
                                                                {preset}% deposit
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        Deposit amount: {depositAmountPaise > 0 ? `₹${Math.round(depositAmountPaise / 100).toLocaleString("en-IN")}` : "Enter the full amount first"}
                                                    </p>
                                                </div>
                                            ) : null}

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                                                        Payment title
                                                    </label>
                                                    <Input
                                                        value={paymentTitle}
                                                        onChange={(event) => setPaymentTitle(event.target.value)}
                                                        placeholder={paymentDefaults?.title || `${tripTitle} payment`}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                                                        Notes for client
                                                    </label>
                                                    <textarea
                                                        value={paymentNotes}
                                                        onChange={(event) => setPaymentNotes(event.target.value)}
                                                        placeholder="Optional notes shown with the payment section"
                                                        className="min-h-[96px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                            Payment collection is off for this share. Travelers will see the itinerary and approval tools, but no Razorpay payment button.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {error ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {error}
                                </div>
                            ) : null}

                            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Link2 className="h-3.5 w-3.5" />
                                    This link expires in 30 days and always opens the live client share page.
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => void savePaymentSettings()}
                                    disabled={savingPayment || loading || (!paymentEligible && paymentEnabled)}
                                >
                                    {savingPayment ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving
                                        </>
                                    ) : (
                                        "Save share settings"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
