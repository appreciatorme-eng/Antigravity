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

const PAYMENT_MODE_OPTIONS: Array<{
    value: SharePaymentMode;
    label: string;
    hint: string;
    selectedClassName: string;
    iconClassName: string;
}> = [
    {
        value: "full_only",
        label: "Full amount only",
        hint: "Single checkout for the entire trip amount.",
        selectedClassName: "border-emerald-300 bg-emerald-50 text-emerald-950 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.16)]",
        iconClassName: "bg-emerald-500/12 text-emerald-700",
    },
    {
        value: "deposit_only",
        label: "Deposit only",
        hint: "Collect a booking deposit before confirmations.",
        selectedClassName: "border-amber-300 bg-amber-50 text-amber-950 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.16)]",
        iconClassName: "bg-amber-500/12 text-amber-700",
    },
    {
        value: "client_choice",
        label: "Client chooses full or deposit",
        hint: "Offer both options directly on the share page.",
        selectedClassName: "border-sky-300 bg-sky-50 text-sky-950 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.16)]",
        iconClassName: "bg-sky-500/12 text-sky-700",
    },
];

const DEPOSIT_PRESET_STYLES: Record<SharePaymentDepositPreset, { selectedClassName: string; idleClassName: string }> = {
    25: {
        selectedClassName: "border-violet-300 bg-violet-50 text-violet-950 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.16)]",
        idleClassName: "border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50/60",
    },
    30: {
        selectedClassName: "border-cyan-300 bg-cyan-50 text-cyan-950 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.16)]",
        idleClassName: "border-gray-200 bg-white text-gray-700 hover:border-cyan-200 hover:bg-cyan-50/60",
    },
    50: {
        selectedClassName: "border-rose-300 bg-rose-50 text-rose-950 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.16)]",
        idleClassName: "border-gray-200 bg-white text-gray-700 hover:border-rose-200 hover:bg-rose-50/60",
    },
};

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
                const resolvedItineraryId = resolvedIdRef.current ?? itineraryId ?? undefined;
                body.itineraryId = resolvedItineraryId;
                body.rawItineraryData = !resolvedItineraryId && rawItineraryData ? rawItineraryData : undefined;
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
                                <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-5 py-4">
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
                                                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                                                        Payment mode
                                                    </label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {PAYMENT_MODE_OPTIONS.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setPaymentMode(option.value)}
                                                                className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                                                                    paymentMode === option.value
                                                                        ? option.selectedClassName
                                                                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${paymentMode === option.value ? option.iconClassName : "bg-gray-100 text-gray-500"}`}>
                                                                        {option.value === "full_only" ? "F" : option.value === "deposit_only" ? "D" : "C"}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="font-semibold">{option.label}</div>
                                                                        <div className={`text-xs ${paymentMode === option.value ? "text-current/80" : "text-gray-500"}`}>
                                                                            {option.hint}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
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
                                                    <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-2">
                                                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                                            Live summary
                                                        </div>
                                                        <div className="mt-1 text-lg font-semibold text-emerald-950">
                                                            {parseRupeesToPaise(fullAmountInput) > 0
                                                                ? `₹${Math.round(parseRupeesToPaise(fullAmountInput) / 100).toLocaleString("en-IN")}`
                                                                : "Enter amount"}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-600">
                                                        Confirm the final INR amount the client should see on the share page.
                                                    </p>
                                                </div>
                                            </div>

                                            {(paymentMode === "deposit_only" || paymentMode === "client_choice") ? (
                                                <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/55 p-4">
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
                                                                        ? DEPOSIT_PRESET_STYLES[preset].selectedClassName
                                                                        : DEPOSIT_PRESET_STYLES[preset].idleClassName
                                                                }`}
                                                            >
                                                                {preset}% deposit
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-indigo-900 shadow-sm">
                                                            Deposit amount: {depositAmountPaise > 0 ? `₹${Math.round(depositAmountPaise / 100).toLocaleString("en-IN")}` : "Enter the full amount first"}
                                                        </span>
                                                        <span className="text-indigo-700">
                                                            The selected preset will appear as the quick-pay option on the client share page.
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : null}

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
                                                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                                                        Payment title
                                                    </label>
                                                    <Input
                                                        value={paymentTitle}
                                                        onChange={(event) => setPaymentTitle(event.target.value)}
                                                        placeholder={paymentDefaults?.title || `${tripTitle} payment`}
                                                    />
                                                </div>
                                                <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
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
