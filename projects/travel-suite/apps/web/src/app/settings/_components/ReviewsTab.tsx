"use client";

import { Building2, MapPin } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

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

interface ReviewsTabProps {
    isTripAdvisorConnected: boolean;
    isTripAdvisorConnecting: boolean;
    tripAdvisorName: string;
    tripAdvisorLocationInput: string;
    showTripAdvisorInput: boolean;
    setShowTripAdvisorInput: (v: boolean) => void;
    setTripAdvisorLocationInput: (v: string) => void;
    handleConnectTripAdvisor: () => Promise<void>;
}

export function ReviewsTab({
    isTripAdvisorConnected,
    isTripAdvisorConnecting,
    tripAdvisorName,
    tripAdvisorLocationInput,
    showTripAdvisorInput,
    setShowTripAdvisorInput,
    setTripAdvisorLocationInput,
    handleConnectTripAdvisor,
}: ReviewsTabProps) {
    const { toast } = useToast();
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Reviews & Discovery</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        onClick={() => { checkOAuthAndRedirect("google", "/api/social/oauth/google", toast); }}
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
                                <span className="ml-2 text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
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
                                {isTripAdvisorConnecting ? "Connecting\u2026" : "Save Location ID"}
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
                            {isTripAdvisorConnected ? "Connected \u2713" : "Connect"}
                        </GlassButton>
                    )}
                </div>
            </div>
        </div>
    );
}
