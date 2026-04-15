// ConfirmActionButton — inline "are you sure?" button for non-destructive operations.
// For destructive/dangerous operations, use ConfirmDangerModal instead.

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ConfirmActionButtonProps {
    label: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
    icon?: React.ReactNode;
    variant?: "default" | "danger" | "success";
    disabled?: boolean;
    className?: string;
}

export default function ConfirmActionButton({
    label,
    confirmLabel,
    onConfirm,
    icon,
    variant = "default",
    disabled = false,
    className,
}: ConfirmActionButtonProps) {
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
            setConfirming(false);
        }
    }

    function handleCancel() {
        setConfirming(false);
    }

    const baseClasses = "rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50";

    const variantClasses = {
        default: "border border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:text-white",
        danger: "border border-red-800/60 bg-red-950/30 text-red-300 hover:border-red-700 hover:bg-red-950/50",
        success: "border border-emerald-800/60 bg-emerald-950/30 text-emerald-300 hover:border-emerald-700 hover:bg-emerald-950/50",
    };

    if (confirming) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className={cn(
                        baseClasses,
                        variant === "danger"
                            ? "border border-red-600 bg-red-600/20 text-red-200 hover:bg-red-600/30"
                            : "border border-amber-600 bg-amber-600/20 text-amber-200 hover:bg-amber-600/30",
                    )}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        confirmLabel ?? "Confirm"
                    )}
                </button>
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className={cn(baseClasses, "border border-gray-700 bg-gray-800 text-gray-400 hover:text-white")}
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            disabled={disabled}
            className={cn(baseClasses, variantClasses[variant], "inline-flex items-center gap-2", className)}
        >
            {icon}
            {label}
        </button>
    );
}
