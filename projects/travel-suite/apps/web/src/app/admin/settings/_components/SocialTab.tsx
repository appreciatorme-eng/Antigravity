"use client";

import { Instagram, Linkedin } from "lucide-react";
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

interface SocialTabProps {
    isInstagramConnected: boolean;
    isLinkedInConnected: boolean;
}

export function SocialTab({
    isInstagramConnected,
    isLinkedInConnected,
}: SocialTabProps) {
    const { toast } = useToast();
    return (
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
                        onClick={() => { if (!isInstagramConnected) checkOAuthAndRedirect("facebook", "/api/social/oauth/facebook", toast); }}
                        className={cn("text-xs w-full mt-auto", isInstagramConnected ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "")}
                    >
                        {isInstagramConnected ? "Connected \u2713" : "Connect"}
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
                        onClick={() => { if (!isLinkedInConnected) checkOAuthAndRedirect("linkedin", "/api/social/oauth/linkedin", toast); }}
                        className={cn("text-xs w-full mt-auto", isLinkedInConnected ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "")}
                    >
                        {isLinkedInConnected ? "Connected \u2713" : "Connect"}
                    </GlassButton>
                </div>
            </div>
        </div>
    );
}
