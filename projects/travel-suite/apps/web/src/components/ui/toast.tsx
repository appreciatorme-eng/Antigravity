"use client";

import { useEffect } from "react";
import { sileo, Toaster as SileoToaster } from "sileo";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
    title: string;
    description?: string;
    variant?: ToastVariant;
    durationMs?: number;
}

interface ToastContextValue {
    toast: (options: ToastOptions) => string;
    dismiss: (id: string) => void;
}

function showSileo({ title, description, variant = "info", durationMs = 5000 }: ToastOptions): string {
    const opts = { title, description, duration: durationMs };
    switch (variant) {
        case "success": return sileo.success(opts);
        case "error":   return sileo.error(opts);
        case "warning": return sileo.warning(opts);
        default:        return sileo.info(opts);
    }
}

export function useToast(): ToastContextValue {
    return {
        toast: showSileo,
        dismiss: (id: string) => sileo.dismiss(id),
    };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <SileoToaster position="top-right" />
        </>
    );
}

function stringifyAlertMessage(message: unknown): string {
    if (message == null) return "Action completed";
    if (typeof message === "string") return message;
    if (typeof message === "number" || typeof message === "boolean") return String(message);
    try {
        return JSON.stringify(message);
    } catch {
        return "Action completed";
    }
}

export function AlertToToastBridge() {
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window === "undefined") return;

        const originalAlert = window.alert.bind(window);
        window.alert = ((message?: unknown) => {
            const text = stringifyAlertMessage(message);
            toast({
                title: text,
                variant: /fail|error|denied|invalid/i.test(text) ? "error" : "info",
                durationMs: 4500,
            });
        }) as typeof window.alert;

        return () => {
            window.alert = originalAlert;
        };
    }, [toast]);

    return null;
}
