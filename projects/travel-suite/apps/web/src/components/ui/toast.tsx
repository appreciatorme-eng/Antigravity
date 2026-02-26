"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
    title: string;
    description?: string;
    variant?: ToastVariant;
    durationMs?: number;
}

interface ToastEntry extends ToastOptions {
    id: string;
}

interface ToastContextValue {
    toast: (options: ToastOptions) => string;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION_MS = 5000;

const variantMeta: Record<
    ToastVariant,
    {
        container: string;
        icon: typeof CheckCircle2;
        iconClass: string;
    }
> = {
    success: {
        container: "border-emerald-200/70 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-900/30",
        icon: CheckCircle2,
        iconClass: "text-emerald-600 dark:text-emerald-300",
    },
    error: {
        container: "border-rose-200/70 bg-rose-50/90 dark:border-rose-900/50 dark:bg-rose-900/30",
        icon: AlertCircle,
        iconClass: "text-rose-600 dark:text-rose-300",
    },
    info: {
        container: "border-primary/30 bg-primary/10 dark:border-primary/50 dark:bg-primary/20",
        icon: Info,
        iconClass: "text-primary",
    },
    warning: {
        container: "border-amber-200/70 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-900/30",
        icon: AlertTriangle,
        iconClass: "text-amber-600 dark:text-amber-300",
    },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastEntry[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    const toast = useCallback(
        ({ title, description, variant = "info", durationMs = DEFAULT_DURATION_MS }: ToastOptions) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            setToasts((prev) => [...prev, { id, title, description, variant, durationMs }]);

            if (durationMs > 0) {
                const timer = setTimeout(() => dismiss(id), durationMs);
                timers.current.set(id, timer);
            }

            return id;
        },
        [dismiss]
    );

    useEffect(() => {
        const timerMap = timers.current;
        return () => {
            timerMap.forEach((timer) => clearTimeout(timer));
            timerMap.clear();
        };
    }, []);

    const value = useMemo<ToastContextValue>(
        () => ({
            toast,
            dismiss,
        }),
        [toast, dismiss]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="pointer-events-none fixed right-4 top-20 z-[120] flex w-[min(100vw-2rem,28rem)] flex-col gap-2"
                aria-live="polite"
                aria-atomic="true"
            >
                <AnimatePresence>
                    {toasts.map((item) => {
                        const meta = variantMeta[item.variant || "info"];
                        const Icon = meta.icon;

                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                className={cn(
                                    "pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-md shadow-[0_8px_32px_rgba(31,38,135,0.15)]",
                                    meta.container
                                )}
                                role="status"
                            >
                                <div className="flex items-start gap-3 p-3">
                                    <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", meta.iconClass)} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-secondary dark:text-white">{item.title}</p>
                                        {item.description ? (
                                            <p className="mt-1 text-xs text-text-secondary dark:text-slate-200">{item.description}</p>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => dismiss(item.id)}
                                        className="relative z-10 rounded-lg p-1 text-text-secondary hover:bg-black/5 hover:text-secondary dark:hover:bg-white/10 dark:hover:text-white"
                                        aria-label="Dismiss notification"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                {item.durationMs && item.durationMs > 0 && (
                                    <motion.div
                                        initial={{ width: "100%" }}
                                        animate={{ width: "0%" }}
                                        transition={{ duration: item.durationMs / 1000, ease: "linear" }}
                                        className={cn("absolute bottom-0 left-0 h-1 bg-current opacity-20", meta.iconClass)}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
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
