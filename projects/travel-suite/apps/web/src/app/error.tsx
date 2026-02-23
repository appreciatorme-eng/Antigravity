"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("App segment error:", error);
    }, [error]);

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-app px-4 py-10">
            <div className="mx-auto max-w-xl">
                <GlassCard padding="xl" rounded="2xl" className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40">
                        <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-300" />
                    </div>
                    <h1 className="text-2xl font-serif text-secondary dark:text-white">Something went wrong</h1>
                    <p className="mt-2 text-sm text-text-secondary">
                        The page hit an unexpected error. You can retry now or return to the home page.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <GlassButton onClick={reset} variant="primary">
                            <RefreshCw className="h-4 w-4" />
                            Try again
                        </GlassButton>
                        <Link
                            href="/"
                            className="inline-flex items-center rounded-xl border border-white/40 bg-white/60 px-4 py-2.5 text-sm font-semibold text-secondary transition-smooth hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                        >
                            Back to home
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
