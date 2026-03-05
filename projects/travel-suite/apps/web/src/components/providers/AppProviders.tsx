"use client";

import { AlertToToastBridge, ToastProvider } from "@/components/ui/toast";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { QueryProvider } from "./query-provider";
import { DemoModeProvider } from "@/lib/demo/demo-mode-context";

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <DemoModeProvider>
            <ToastProvider>
                <ServiceWorkerRegistrar />
                <QueryProvider>
                    {children}
                </QueryProvider>
                <AlertToToastBridge />
            </ToastProvider>
        </DemoModeProvider>
    );
}
