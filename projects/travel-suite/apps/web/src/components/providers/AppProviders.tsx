"use client";

import { AlertToToastBridge, ToastProvider } from "@/components/ui/toast";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { QueryProvider } from "./query-provider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <ServiceWorkerRegistrar />
            <QueryProvider>
                {children}
            </QueryProvider>
            <AlertToToastBridge />
        </ToastProvider>
    );
}
