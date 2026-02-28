"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";

export default function ClientProfileError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Client profile error:", error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-6 border border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <h2 className="text-2xl font-serif text-secondary dark:text-white mb-3">
                    Couldn't load this client
                </h2>
                <p className="text-sm text-text-muted font-medium mb-8">
                    There was an error loading this client profile. This can happen if the client no longer exists or there's a temporary issue.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => reset()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link
                        href="/clients"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-secondary dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Clients
                    </Link>
                </div>
            </div>
        </div>
    );
}
