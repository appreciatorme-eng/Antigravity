// ActionToast — lightweight success/error notification for god-mode mutations.

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionToastProps {
    message: string;
    type: "success" | "error";
    visible: boolean;
    onDismiss: () => void;
    durationMs?: number;
}

export default function ActionToast({
    message,
    type,
    visible,
    onDismiss,
    durationMs = 4000,
}: ActionToastProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onDismiss, 300); // wait for exit animation
            }, durationMs);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [visible, durationMs, onDismiss]);

    if (!visible && !show) return null;

    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300",
                show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                type === "success"
                    ? "border-emerald-800/60 bg-emerald-950/90 text-emerald-200"
                    : "border-red-800/60 bg-red-950/90 text-red-200",
            )}
        >
            {type === "success" ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
            ) : (
                <XCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
            )}
            <p className="text-sm font-medium">{message}</p>
            <button
                onClick={() => {
                    setShow(false);
                    setTimeout(onDismiss, 300);
                }}
                className="ml-2 rounded p-0.5 text-gray-400 transition-colors hover:text-white"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// Hook for convenient toast state management.
export function useActionToast() {
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
        visible: boolean;
    }>({ message: "", type: "success", visible: false });

    function showSuccess(message: string) {
        setToast({ message, type: "success", visible: true });
    }

    function showError(message: string) {
        setToast({ message, type: "error", visible: true });
    }

    function dismiss() {
        setToast((prev) => ({ ...prev, visible: false }));
    }

    return { toast, showSuccess, showError, dismiss };
}
