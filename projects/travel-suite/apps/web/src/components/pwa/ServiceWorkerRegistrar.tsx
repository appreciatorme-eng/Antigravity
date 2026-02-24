"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;

        const register = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                    updateViaCache: "none",
                });

                if (registration.waiting) {
                    registration.waiting.postMessage({ type: "SKIP_WAITING" });
                }
            } catch (error) {
                console.error("Service worker registration failed", error);
            }
        };

        void register();
    }, []);

    return null;
}
