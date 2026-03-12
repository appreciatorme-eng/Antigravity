"use client";

import {
    Building2,
    Globe,
    IndianRupee,
    Instagram,
    Link2,
    Linkedin,
    Mail,
    MapPin,
    MessageCircle,
} from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import type { WhatsAppProfile } from "./shared";

interface SettingsIntegrationsSectionProps {
    handleActivatePlaces: () => Promise<void>;
    handleConnectTripAdvisor: () => Promise<void>;
    handleDisconnectWhatsApp: () => Promise<void>;
    handleSaveUpi: () => Promise<void>;
    isGmailConnected: boolean;
    isInstagramConnected: boolean;
    isLinkedInConnected: boolean;
    isPlacesActivating: boolean;
    isPlacesEnabled: boolean;
    isTripAdvisorConnected: boolean;
    isTripAdvisorConnecting: boolean;
    isUpiSaved: boolean;
    isUpiSaving: boolean;
    isWhatsAppConnected: boolean;
    setIsWhatsAppConnectOpen: (isOpen: boolean) => void;
    setShowTripAdvisorInput: (isVisible: boolean) => void;
    setTripAdvisorLocationInput: (value: string) => void;
    setUpiId: (value: string) => void;
    showTripAdvisorInput: boolean;
    tripAdvisorLocationInput: string;
    tripAdvisorName: string;
    upiId: string;
    whatsAppProfile: WhatsAppProfile | null;
}

export function SettingsIntegrationsSection({
    handleActivatePlaces,
    handleConnectTripAdvisor,
    handleDisconnectWhatsApp,
    handleSaveUpi,
    isGmailConnected,
    isInstagramConnected,
    isLinkedInConnected,
    isPlacesActivating,
    isPlacesEnabled,
    isTripAdvisorConnected,
    isTripAdvisorConnecting,
    isUpiSaved,
    isUpiSaving,
    isWhatsAppConnected,
    setIsWhatsAppConnectOpen,
    setShowTripAdvisorInput,
    setTripAdvisorLocationInput,
    setUpiId,
    showTripAdvisorInput,
    tripAdvisorLocationInput,
    tripAdvisorName,
    upiId,
    whatsAppProfile,
}: SettingsIntegrationsSectionProps) {
    return (
        <GlassCard padding="none" rounded="2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link2 className="w-5 h-5 text-emerald-500" />
                    <div>
                        <h2 className="font-bold text-secondary dark:text-white">Service Integrations</h2>
                        <p className="text-xs text-text-muted mt-0.5">Connect your existing tools. Get the inbox working in minutes — no API approvals needed.</p>
                    </div>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold border border-primary/20">Premium Add-ons</span>
            </div>
            <div className="p-6 space-y-8">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Messaging</p>
                    <div className="space-y-3">
                        <div className="p-5 border-2 border-[#25D366]/30 bg-[#25D366]/5 rounded-2xl flex items-start gap-4">
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
                                variant={isGmailConnected ? "outline" : "secondary"}
                                size="sm"
                                onClick={() => { if (!isGmailConnected) window.location.href = "/api/social/oauth/google"; }}
                                className={cn("text-xs shrink-0", isGmailConnected ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "")}
                            >
                                {isGmailConnected ? "Connected ✓" : "Connect Google"}
                            </GlassButton>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Payments</p>
                    <div className="p-5 border border-white/10 rounded-2xl bg-white/5">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <IndianRupee className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="font-bold text-secondary dark:text-white">UPI</h4>
                                    {isUpiSaved && (
                                        <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Saved</span>
                                    )}
                                </div>
                                <p className="text-xs text-text-muted">Add your UPI ID to include payment links in WhatsApp messages and proposals.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={upiId}
                                onChange={(event) => setUpiId(event.target.value)}
                                placeholder="yourname@upi or yourname@bank"
                                className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                            />
                            <GlassButton
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => { void handleSaveUpi(); }}
                                disabled={isUpiSaving || !upiId.trim()}
                                className="text-xs px-5"
                            >
                                {isUpiSaving ? "Saving…" : "Save"}
                            </GlassButton>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Reviews & Discovery</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 border border-white/10 rounded-2xl hover:border-primary/30 transition-colors bg-white/5 flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-secondary dark:text-white text-sm">Google Business</h4>
                                <p className="text-xs text-text-muted mt-1">Respond to reviews and manage your listing from the dashboard.</p>
                            </div>
                            <GlassButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => { window.location.href = "/api/social/oauth/google"; }}
                                className="text-xs w-full mt-auto"
                            >
                                Connect
                            </GlassButton>
                        </div>
                        <div className="p-4 border border-white/10 rounded-2xl hover:border-primary/30 transition-colors bg-white/5 flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-secondary dark:text-white text-sm">
                                    TripAdvisor
                                    {isTripAdvisorConnected && (
                                        <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                    )}
                                </h4>
                                <p className="text-xs text-text-muted mt-1">
                                    {isTripAdvisorConnected && tripAdvisorName ? tripAdvisorName : "Sync your listing and pull review data into the reputation tab."}
                                </p>
                            </div>
                            {!isTripAdvisorConnected && showTripAdvisorInput ? (
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={tripAdvisorLocationInput}
                                        onChange={(event) => setTripAdvisorLocationInput(event.target.value)}
                                        placeholder="Location ID (e.g. 297606)"
                                        className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <GlassButton
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={() => { void handleConnectTripAdvisor(); }}
                                        disabled={isTripAdvisorConnecting || !tripAdvisorLocationInput.trim()}
                                        className="text-xs w-full"
                                    >
                                        {isTripAdvisorConnecting ? "Connecting…" : "Save Location ID"}
                                    </GlassButton>
                                </div>
                            ) : (
                                <GlassButton
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { if (!isTripAdvisorConnected) setShowTripAdvisorInput(true); }}
                                    className={cn("text-xs w-full mt-auto", isTripAdvisorConnected ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "")}
                                >
                                    {isTripAdvisorConnected ? "Connected ✓" : "Connect"}
                                </GlassButton>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Social Media</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 border border-white/10 rounded-2xl hover:border-primary/30 transition-colors bg-white/5 flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                <Instagram className="w-4 h-4 text-pink-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-secondary dark:text-white text-sm">
                                    Instagram
                                    {isInstagramConnected && (
                                        <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                    )}
                                </h4>
                                <p className="text-xs text-text-muted mt-1">Import leads from DMs and comments into the CRM automatically.</p>
                            </div>
                            <GlassButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => { if (!isInstagramConnected) window.location.href = "/api/social/oauth/facebook"; }}
                                className={cn("text-xs w-full mt-auto", isInstagramConnected ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "")}
                            >
                                {isInstagramConnected ? "Connected ✓" : "Connect"}
                            </GlassButton>
                        </div>
                        <div className="p-4 border border-white/10 rounded-2xl hover:border-primary/30 transition-colors bg-white/5 flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Linkedin className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-secondary dark:text-white text-sm">
                                    LinkedIn
                                    {isLinkedInConnected && (
                                        <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                    )}
                                </h4>
                                <p className="text-xs text-text-muted mt-1">Sync corporate travel enquiries and company contacts.</p>
                            </div>
                            <GlassButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => { if (!isLinkedInConnected) window.location.href = "/api/social/oauth/linkedin"; }}
                                className={cn("text-xs w-full mt-auto", isLinkedInConnected ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "")}
                            >
                                {isLinkedInConnected ? "Connected ✓" : "Connect"}
                            </GlassButton>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Maps & Data</p>
                    <div className="p-4 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-white/5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-secondary dark:text-white text-sm">
                                Google Places & Maps
                                {isPlacesEnabled && (
                                    <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Active</span>
                                )}
                            </h4>
                            <p className="text-xs text-text-muted mt-0.5">Geospatial mapping and point-of-interest data for itinerary building.</p>
                        </div>
                        <GlassButton
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { if (!isPlacesEnabled) void handleActivatePlaces(); }}
                            disabled={isPlacesActivating || isPlacesEnabled}
                            className={cn("text-xs shrink-0", isPlacesEnabled ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "")}
                        >
                            {isPlacesActivating ? "Activating…" : isPlacesEnabled ? "Active ✓" : "Activate"}
                        </GlassButton>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
