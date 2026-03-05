// StatusDot — green/amber/red health indicator with optional label.

"use client";

import { cn } from "@/lib/utils";

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

interface StatusDotProps {
    status: HealthStatus;
    label?: string;
    size?: "sm" | "md";
}

const STATUS_CONFIG: Record<HealthStatus, { color: string; bg: string; label: string }> = {
    healthy: { color: "bg-emerald-400", bg: "bg-emerald-400/20", label: "Healthy" },
    degraded: { color: "bg-amber-400", bg: "bg-amber-400/20", label: "Degraded" },
    down: { color: "bg-red-500", bg: "bg-red-500/20", label: "Down" },
    unknown: { color: "bg-gray-500", bg: "bg-gray-500/20", label: "Unknown" },
};

export default function StatusDot({ status, label, size = "md" }: StatusDotProps) {
    const cfg = STATUS_CONFIG[status];

    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                "relative rounded-full flex items-center justify-center",
                cfg.bg,
                size === "sm" ? "w-4 h-4" : "w-5 h-5"
            )}>
                <div className={cn(
                    "rounded-full",
                    cfg.color,
                    status === "healthy" && "animate-pulse",
                    size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5"
                )} />
            </div>
            {label !== undefined && (
                <span className="text-sm text-gray-300">{label || cfg.label}</span>
            )}
        </div>
    );
}
