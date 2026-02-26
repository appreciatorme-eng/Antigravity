"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, CheckCircle2, MessageCircle, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";

interface WhatsAppConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnected: () => void;
}

type ConnectionStep = "initial" | "scanning" | "connected";

export function WhatsAppConnectModal({ isOpen, onClose, onConnected }: WhatsAppConnectModalProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<ConnectionStep>("initial");
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [instanceId, setInstanceId] = useState<string | null>(null);
    const [businessProfile, setBusinessProfile] = useState<{ number: string; name: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [testingMessage, setTestingMessage] = useState(false);

    useEffect(() => {
        if (isOpen && step === "initial") {
            startConnection();
        }

        if (!isOpen) {
            // Reset state when closed
            setTimeout(() => {
                setStep("initial");
                setQrCodeData(null);
                setInstanceId(null);
                setBusinessProfile(null);
            }, 300);
        }
    }, [isOpen]);

    useEffect(() => {
        if (step !== "scanning" || !instanceId) return;

        let interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/whatsapp/status?instanceId=${instanceId}`);
                if (!res.ok) return;
                const data = await res.json();

                if (data.status === "connected") {
                    clearInterval(interval);
                    setBusinessProfile({ number: data.number, name: data.name });
                    setStep("connected");
                    onConnected();
                }
            } catch (error) {
                console.error("Error polling WhatsApp status:", error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [step, instanceId, onConnected]);

    const startConnection = async () => {
        try {
            setLoading(true);
            // Calling a backend API to initialize the WhatsApp instance and generate a QR code.
            const res = await fetch("/api/whatsapp/connect", { method: "POST" });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to generate QR");

            setQrCodeData(data.qrCode);
            setInstanceId(data.instanceId);
            setStep("scanning");
        } catch (error) {
            toast({
                title: "Connection Error",
                description: "Failed to initialize the WhatsApp gateway.",
                variant: "error",
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleTestMessage = async () => {
        try {
            setTestingMessage(true);
            const res = await fetch("/api/whatsapp/test-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instanceId })
            });

            if (!res.ok) throw new Error("Failed to send test message");

            toast({
                title: "Test Message Dispatched! 🚀",
                description: "Check your WhatsApp for the magic link test message.",
                variant: "success",
                durationMs: 4000
            });

            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
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
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Link Device via QR</h3>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Zero-cost dispatching via WhatsApp Web protocol.
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

                            {step === "scanning" && qrCodeData && !loading && (
                                <motion.div
                                    key="scanning"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    className="flex flex-col items-center w-full"
                                >
                                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center relative group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-[#25D366]/20 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl -z-10 blur-xl"></div>
                                        <QRCodeSVG
                                            value={qrCodeData}
                                            size={200}
                                            level="M"
                                            includeMargin={false}
                                            fgColor="#0f172a"
                                        />
                                    </div>

                                    <div className="mt-8 space-y-4 w-full px-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">1</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Open <strong className="text-slate-900 dark:text-white">WhatsApp</strong> on your mobile device.</p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">2</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Tap <strong className="text-slate-900 dark:text-white">Menu</strong> or <strong className="text-slate-900 dark:text-white">Settings</strong> and select <strong className="text-slate-900 dark:text-white">Linked Devices</strong>.</p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">3</div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Tap <strong className="text-slate-900 dark:text-white">Link a Device</strong> and point your camera to the code above.</p>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 right-6 flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full animate-pulse">
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Awaiting linkage...
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
                                        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></div>
                                        <div className="w-20 h-20 rounded-full bg-[#25D366] text-white flex items-center justify-center relative shadow-xl shadow-[#25D366]/30">
                                            <CheckCircle2 className="w-10 h-10" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">System Synced.</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mx-auto max-w-[240px]">
                                            You are now linked as <strong className="text-slate-800 dark:text-slate-200">{businessProfile.name}</strong> ({businessProfile.number}).
                                            You can instantly route messages.
                                        </p>
                                    </div>

                                    <GlassButton
                                        variant="primary"
                                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-[#25D366]/20 group border-transparent mt-4"
                                        onClick={handleTestMessage}
                                        disabled={testingMessage}
                                    >
                                        {testingMessage ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 mr-2 text-white group-hover:scale-110 transition-transform" />
                                        )}
                                        {testingMessage ? "Dispatching test..." : "Send Test Message"}
                                    </GlassButton>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
