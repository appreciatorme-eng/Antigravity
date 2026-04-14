"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Superadmin Collections error:", error);
    }, [error]);

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
            <div className="w-full max-w-xl rounded-xl border border-red-900/40 bg-red-950/10 p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-950/30">
                    <AlertTriangle className="h-6 w-6 text-red-300" />
                </div>
                <h1 className="text-xl font-semibold text-white">Collections failed to load</h1>
                <p className="mt-2 text-sm text-gray-400">
                    The collections workspace hit an unexpected error. Retry to continue.
                </p>
                <button
                    onClick={reset}
                    className="mx-auto mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 transition-colors hover:border-gray-600"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </button>
            </div>
        </div>
    );
}
