// ToggleSwitch — large toggle for kill-switch controls with dangerous mode styling.

"use client";

import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
    enabled: boolean;
    onToggle: (next: boolean) => void;
    label: string;
    description?: string;
    dangerous?: boolean;
    disabled?: boolean;
    lastChanged?: string;
}

export default function ToggleSwitch({
    enabled,
    onToggle,
    label,
    description,
    dangerous = false,
    disabled = false,
    lastChanged,
}: ToggleSwitchProps) {
    const activeColor = dangerous
        ? enabled ? "bg-red-500" : "bg-gray-700"
        : enabled ? "bg-amber-500" : "bg-gray-700";

    return (
        <div className={cn(
            "bg-gray-900 border rounded-xl p-5 flex items-center justify-between gap-4",
            dangerous
                ? enabled ? "border-red-500/40" : "border-gray-800"
                : "border-gray-800"
        )}>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {dangerous && enabled && (
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    )}
                    <p className={cn(
                        "text-sm font-semibold",
                        dangerous && enabled ? "text-red-300" : "text-white"
                    )}>
                        {label}
                    </p>
                </div>
                {description && (
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                )}
                {lastChanged && (
                    <p className="text-xs text-gray-600 mt-1">Last changed: {lastChanged}</p>
                )}
            </div>
            <button
                onClick={() => !disabled && onToggle(!enabled)}
                disabled={disabled}
                className={cn(
                    "relative inline-flex w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0",
                    activeColor,
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                )}
            >
                <span className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                    enabled && "translate-x-6"
                )} />
            </button>
        </div>
    );
}
