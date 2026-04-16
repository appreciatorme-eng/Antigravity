// ConfirmDangerModal — red-accented confirmation dialog for destructive actions.

"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDangerModalProps {
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
    children?: React.ReactNode;
}

export default function ConfirmDangerModal({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    loading = false,
    children,
}: ConfirmDangerModalProps) {
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <>
            <button
                type="button"
                className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm cursor-default"
                onClick={onCancel}
                aria-label="Close dialog"
                tabIndex={-1}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-danger-title"
                aria-describedby="confirm-danger-desc"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h3 id="confirm-danger-title" className="text-base font-bold text-white">{title}</h3>
                            {message && <p id="confirm-danger-desc" className="text-sm text-gray-400 mt-1">{message}</p>}
                        </div>
                    </div>
                    {children && <div className="mt-4">{children}</div>}
                    <div className="flex gap-3 mt-6 justify-end">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50",
                                "bg-red-500 hover:bg-red-400 text-white"
                            )}
                        >
                            {loading ? "Processing..." : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
