// StatCard — simple metric card for sub-pages with label, value, subtitle.

"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    accent?: "amber" | "emerald" | "red" | "blue" | "purple";
    className?: string;
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
    amber: "border-amber-500/20 text-amber-400",
    emerald: "border-emerald-500/20 text-emerald-400",
    red: "border-red-500/20 text-red-400",
    blue: "border-blue-500/20 text-blue-400",
    purple: "border-purple-500/20 text-purple-400",
};

export default function StatCard({ label, value, subtitle, accent = "amber", className }: StatCardProps) {
    const accentClass = ACCENT_CLASSES[accent];

    return (
        <div className={cn(
            "bg-gray-900 border rounded-xl p-5",
            accentClass.split(" ")[0],
            className
        )}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", accentClass.split(" ")[1])}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}
