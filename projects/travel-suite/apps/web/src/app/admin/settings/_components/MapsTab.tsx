"use client";

import { Globe } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";

interface MapsTabProps {
    isPlacesEnabled: boolean;
    isPlacesActivating: boolean;
    handleActivatePlaces: () => Promise<void>;
}

export function MapsTab({
    isPlacesEnabled,
    isPlacesActivating,
    handleActivatePlaces,
}: MapsTabProps) {
    return (
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
                    {isPlacesActivating ? "Activating\u2026" : isPlacesEnabled ? "Active \u2713" : "Activate"}
                </GlassButton>
            </div>
        </div>
    );
}
