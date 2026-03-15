"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import {
    CheckCircle2,
    MessageCircle,
    RefreshCw,
    Loader2,
    Sparkles,
    Calendar,
    ShieldCheck,
    Zap,
} from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import { useDemoMode } from "@/lib/demo/demo-mode-context";
import { logError } from "@/lib/observability/logger";

// Demo-only: realistic-looking QR payload that renders a visible code without real WA auth
const DEMO_QR_PAYLOAD =
    "2@GkT8mXpL1qBn7cJe4sWrY0vZhOi9FdAu=,H3NkRpSv6bQcMwUlKz+XoYtGfEeDb/JmIn2=,demo-gobuddy-qr-preview-only";

interface WhatsAppConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnected: () => void;
}

type ConnectionStep = "initial" | "scanning" | "connected" | "setup_required";

export function WhatsAppConnectModal({
    isOpen,
    onClose,
    onConnected,
}: WhatsAppConnectModalProps) {
    const { toast } = useToast();
    const { isDemoMode } = useDemoMode();
    const [step, setStep] = useState<ConnectionStep>("initial");
    const [sessionName, setSessionName] = useState<string | null>(null);
    const [qrBase64, setQrBase64] = useState<string | null>(null);
    const [businessProfile, setBusinessProfile] = useState<{
        number: string;
        name: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [testingMessage, setTestingMessage] = useState(false);

    const startDemoConnection = useCallback(async () => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSessionName("demo_" + Date.now());
        setStep("scanning");
        setLoading(false);
    }, []);

    const startRealConnection = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/whatsapp/connect", { method: "POST" });
            const data = await res.json() as {
                sessionName?: string;
                qrBase64?: string;
                error?: string;
            };

            if (!res.ok) throw new Error(data.error ?? "Failed to generate QR");

            setSessionName(data.sessionName ?? null);
            setQrBase64(data.qrBase64 ?? null);
            setStep("scanning");
        } catch {
            setStep("setup_required");
        } finally {
            setLoading(false);
        }
    }, []);

    const startConnection = useCallback(() => {
        if (isDemoMode) {
            void startDemoConnection();
        } else {
            void startRealConnection();
        }
    }, [isDemoMode, startDemoConnection, startRealConnection]);

    useEffect(() => {
        if (isOpen && step === "initial") {
            startConnection();
        }

        if (!isOpen) {
            setTimeout(() => {
                setStep("initial");
                setSessionName(null);
                setQrBase64(null);
                setBusinessProfile(null);
            }, 300);
        }
    }, [isOpen, step, startConnection]);

    // Demo mode: auto-connect after 6 seconds of showing QR
    useEffect(() => {
        if (!isDemoMode || step !== "scanning") return;

        const timer = setTimeout(() => {
            setBusinessProfile({
                number: "+91 98765 43210",
                name: "GoBuddy Adventures",
            });
            setStep("connected");
            onConnected();
        }, 6000);

        return () => clearTimeout(timer);
    }, [isDemoMode, step, onConnected]);

    // Real mode: poll for QR every 5 s until received (Chrome needs ~20-30 s to boot)
    useEffect(() => {
        if (isDemoMode || step !== "scanning" || !sessionName) return;

        const controller = new AbortController();
        const interval = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/whatsapp/qr?sessionName=${sessionName}`,
                    { signal: controller.signal },
                );
                if (!res.ok) return;
                const data = await res.json() as { qrBase64?: string };
                if (data.qrBase64) setQrBase64(data.qrBase64);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                logError("Error refreshing WhatsApp QR", err);
            }
        }, 5000);

        return () => {
            controller.abort();
            clearInterval(interval);
        };
    }, [isDemoMode, step, sessionName]);

    // Real mode: poll the API for connection status every 2 s
    useEffect(() => {
        if (isDemoMode || step !== "scanning" || !sessionName) return;

        const controller = new AbortController();
        const interval = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/whatsapp/status?sessionName=${sessionName}`,
                    { signal: controller.signal },
                );
                if (!res.ok) return;
                const data = await res.json() as { status: string; number?: string; name?: string };

                if (data.status === "connected") {
                    clearInterval(interval);
                    setBusinessProfile({
                        number: data.number ?? "",
                        name: data.name ?? "",
                    });
                    setStep("connected");
                    onConnected();
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                logError("Error polling WhatsApp status", error);
            }
        }, 2000);

        return () => {
            controller.abort();
            clearInterval(interval);
        };
    }, [isDemoMode, step, sessionName, onConnected]);

    const handleTestMessage = async () => {
        if (isDemoMode) {
            setTestingMessage(true);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            toast({
                title: "Test Message Dispatched! 🚀",
                description: "Check your WhatsApp for the magic link test message.",
                variant: "success",
                durationMs: 4000,
            });
            setTestingMessage(false);
            setTimeout(() => onClose(), 2000);
            return;
        }

        try {
            setTestingMessage(true);
            const res = await fetch("/api/whatsapp/test-message", {
                method: "POST",
            });

            if (!res.ok) throw new Error("Failed to send test message");

            toast({
                title: "Test Message Dispatched! 🚀",
                description: "Check your WhatsApp for the magic link test message.",
                variant: "success",
                durationMs: 4000,
            });

            setTimeout(() => onClose(), 2000);
        } catch {
            toast({
                title: "Message Error",
                description: "Failed to dispatch the test message.",
                variant: "error",
            });
        } finally {
            setTestingMessage(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-slate-200/50 dark:border-slate-800/50">
                <div className="relative">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-xl flex items-center justify-center shrink-0">
                                <MessageCircle className="w-5 h-5 fill-current" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {step === "setup_required"
                                        ? "WhatsApp Setup"
                                        : "Link Device via QR"}
                                </h3>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {step === "setup_required"
                                        ? "One-time activation for your WhatsApp inbox"
                                        : "Zero-cost dispatching via WhatsApp Web protocol."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 relative min-h-[360px] flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            {(step === "initial" || loading) && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    className="flex flex-col items-center justify-center space-y-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-[#25D366] animate-spin" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        Generating secure payload...
                                    </p>
                                </motion.div>
                            )}

                            {step === "scanning" && !loading && (
                                <motion.div
                                    key="scanning"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    className="flex flex-col items-center w-full"
                                >
                                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center relative group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-[#25D366]/20 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl -z-10 blur-xl" />
                                        {isDemoMode ? (
                                            <QRCodeSVG
                                                value={DEMO_QR_PAYLOAD}
                                                size={200}
                                                level="M"
                                                includeMargin={false}
                                                fgColor="#0f172a"
                                            />
                                        ) : qrBase64 ? (
                                            <Image
                                                src={`data:image/png;base64,${qrBase64}`}
                                                width={200}
                                                height={200}
                                                alt="WhatsApp QR code — scan with your phone"
                                                className="rounded-sm"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-[200px] h-[200px] bg-slate-100 dark:bg-slate-800 rounded-sm flex flex-col items-center justify-center gap-3 px-4 text-center">
                                                <Loader2 className="w-8 h-8 text-[#25D366] animate-spin shrink-0" />
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                                                    Starting WhatsApp bridge…<br />
                                                    <span className="text-slate-400 dark:text-slate-500">First load takes ~60–90 s</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 space-y-4 w-full px-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                                1
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                Open{" "}
                                                <strong className="text-slate-900 dark:text-white">
                                                    WhatsApp
                                                </strong>{" "}
                                                on your mobile device.
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                                2
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                Tap{" "}
                                                <strong className="text-slate-900 dark:text-white">
                                                    Menu
                                                </strong>{" "}
                                                or{" "}
                                                <strong className="text-slate-900 dark:text-white">
                                                    Settings
                                                </strong>{" "}
                                                and select{" "}
                                                <strong className="text-slate-900 dark:text-white">
                                                    Linked Devices
                                                </strong>
                                                .
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                                3
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                Tap{" "}
                                                <strong className="text-slate-900 dark:text-white">
                                                    Link a Device
                                                </strong>{" "}
                                                and point your camera to the code above.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 right-6 flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full animate-pulse">
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />{" "}
                                        Awaiting linkage...
                                    </div>
                                </motion.div>
                            )}

                            {step === "connected" && businessProfile && (
                                <motion.div
                                    key="connected"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center space-y-6 w-full py-4 text-center"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
                                        <div className="w-20 h-20 rounded-full bg-[#25D366] text-white flex items-center justify-center relative shadow-xl shadow-[#25D366]/30">
                                            <CheckCircle2 className="w-10 h-10" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                            System Synced.
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mx-auto max-w-[240px]">
                                            You are now linked as{" "}
                                            <strong className="text-slate-800 dark:text-slate-200">
                                                {businessProfile.name}
                                            </strong>{" "}
                                            ({businessProfile.number}). You can instantly route
                                            messages.
                                        </p>
                                    </div>

                                    <GlassButton
                                        variant="primary"
                                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-[#25D366]/20 group border-transparent mt-4"
                                        onClick={() => { void handleTestMessage(); }}
                                        disabled={testingMessage}
                                    >
                                        {testingMessage ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 mr-2 text-white group-hover:scale-110 transition-transform" />
                                        )}
                                        {testingMessage
                                            ? "Dispatching test..."
                                            : "Send Test Message"}
                                    </GlassButton>
                                </motion.div>
                            )}

                            {step === "setup_required" && (
                                <motion.div
                                    key="setup_required"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center w-full space-y-5 py-2"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center">
                                        <MessageCircle className="w-8 h-8 text-[#25D366]" />
                                    </div>

                                    <div className="text-center">
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                                            One-Time Activation Required
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                                            WhatsApp QR linking runs on a persistent session
                                            server. Our team will activate it for your account
                                            within 24 hours.
                                        </p>
                                    </div>

                                    {/* How it works */}
                                    <div className="w-full space-y-3 px-1">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Secure & Private
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    Your WhatsApp stays on your number — no Meta
                                                    API or approval needed.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Instant After Setup
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    Once active, all client messages appear in
                                                    your TravelSuite inbox automatically.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <Calendar className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Ready in 24 Hours
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    Schedule a 10-min call and we&apos;ll walk you
                                                    through the QR scan live.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full flex flex-col gap-2 pt-1">
                                        <GlassButton
                                            variant="primary"
                                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-transparent shadow-lg shadow-[#25D366]/20"
                                            onClick={() => {
                                                window.open(
                                                    "mailto:support@gobuddytravel.com?subject=WhatsApp%20QR%20Setup%20Request",
                                                    "_blank"
                                                );
                                            }}
                                        >
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Request WhatsApp Setup
                                        </GlassButton>
                                        <button
                                            onClick={onClose}
                                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
                                        >
                                            I&apos;ll do this later
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
