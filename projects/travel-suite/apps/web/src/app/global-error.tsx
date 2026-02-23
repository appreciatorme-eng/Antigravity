"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global app error:", error);
    }, [error]);

    return (
        <html lang="en">
            <body className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
                <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
                    <div className="w-full rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <h1 className="text-3xl font-serif text-secondary dark:text-white">Critical application error</h1>
                        <p className="mt-3 text-sm text-text-secondary dark:text-slate-200">
                            The app encountered an unexpected issue while rendering. Please retry.
                        </p>
                        <button
                            type="button"
                            onClick={reset}
                            className="mt-6 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            Reload app
                        </button>
                    </div>
                </main>
            </body>
        </html>
    );
}
