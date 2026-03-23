"use client";

import { MessageCircle, Mail } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { WhatsAppProfile } from "../shared";

async function checkOAuthAndRedirect(
    provider: string,
    url: string,
    toast: ReturnType<typeof useToast>["toast"],
) {
    try {
        const res = await fetch(`/api/social/oauth/status?provider=${provider}`);
        const data = await res.json();
        if (!data.configured) {
            toast({
                title: "Not configured yet",
                description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} integration hasn't been set up. Please configure OAuth credentials first.`,
                variant: "error",
            });
            return;
        }
        window.location.href = url;
    } catch {
        toast({ title: "Connection check failed", variant: "error" });
    }
}

interface MessagingTabProps {
    isWhatsAppConnected: boolean;
    isGmailConnected: boolean;
    whatsAppProfile: WhatsAppProfile | null;
    setIsWhatsAppConnectOpen: (open: boolean) => void;
    handleDisconnectWhatsApp: () => Promise<void>;
}

export function MessagingTab({
    isWhatsAppConnected,
    isGmailConnected,
    whatsAppProfile,
    setIsWhatsAppConnectOpen,
    handleDisconnectWhatsApp,
}: MessagingTabProps) {
    const { toast } = useToast();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-secondary dark:text-white">Messaging</h2>
                <p className="text-sm text-text-secondary mt-1">Connect WhatsApp and Gmail to communicate with clients directly from TripBuilt.</p>
            </div>

            <div data-tour="whatsapp-card" className="p-5 border-2 border-[#25D366]/30 bg-[#25D366]/5 rounded-2xl flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-lg shadow-[#25D366]/30">
                    <MessageCircle className="w-6 h-6 text-white fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-secondary dark:text-white">WhatsApp</h4>
                        <span className="text-[9px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Recommended</span>
                        {isWhatsAppConnected && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                        )}
                    </div>
                    {isWhatsAppConnected && whatsAppProfile ? (
                        <p className="text-xs text-[#1da650] font-semibold leading-relaxed">
                            {whatsAppProfile.name} · {whatsAppProfile.number}
                        </p>
                    ) : (
                        <p className="text-xs text-text-muted leading-relaxed">Use your current WhatsApp number — scan a QR code to link your device. No Meta Business API or approval required.</p>
                    )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                    <GlassButton
                        data-tour="whatsapp-connect-btn"
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setIsWhatsAppConnectOpen(true)}
                        className={cn(
                            "text-xs font-bold",
                            isWhatsAppConnected
                                ? "border-[#25D366]/30 text-[#1da650] bg-[#25D366]/10 border"
                                : "bg-[#25D366] text-white border-transparent hover:bg-[#20bd5a]",
                        )}
                    >
                        {isWhatsAppConnected ? "Manage" : "Scan QR Code"}
                    </GlassButton>
                    {isWhatsAppConnected && (
                        <button
                            type="button"
                            onClick={() => { void handleDisconnectWhatsApp(); }}
                            className="text-[10px] text-red-500 hover:text-red-700 transition-colors font-medium"
                        >
                            Disconnect
                        </button>
                    )}
                </div>
            </div>

            <div className="p-5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-white/5">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-secondary dark:text-white">Gmail</h4>
                        {isGmailConnected && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                        )}
                    </div>
                    <p className="text-xs text-text-muted">Manage email enquiries and send confirmations directly from the unified inbox.</p>
                </div>
                <GlassButton
                    type="button"
                    variant={isGmailConnected ? "outline" : "primary"}
                    size="sm"
                    onClick={() => { if (!isGmailConnected) checkOAuthAndRedirect("google", "/api/social/oauth/google", toast); }}
                    className={cn("text-xs shrink-0", isGmailConnected ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "")}
                >
                    {isGmailConnected ? "Connected ✓" : "Connect Google"}
                </GlassButton>
            </div>
        </div>
    );
}
