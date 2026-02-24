"use client";

import { AlertToToastBridge, ToastProvider } from "@/components/ui/toast";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <ServiceWorkerRegistrar />
            {children}
            <AlertToToastBridge />
        </ToastProvider>
    );
}
