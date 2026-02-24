"use client";

import { useEffect } from "react";
import { triggerOfflineReplay } from "@/lib/pwa/offline-mutations";

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

        await triggerOfflineReplay();
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    const handleOnline = () => {
      void triggerOfflineReplay();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void triggerOfflineReplay();
      }
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);
    void register();

    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
