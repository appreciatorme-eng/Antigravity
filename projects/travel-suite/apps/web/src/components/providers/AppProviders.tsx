"use client";

import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { AlertToToastBridge, ToastProvider } from "@/components/ui/toast";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { QueryProvider } from "./query-provider";
import { DemoModeProvider } from "@/lib/demo/demo-mode-context";
import { SessionRefreshGuard } from "./SessionRefreshGuard";
import { SentryUserContext } from "./SentryUserContext";

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <PostHogProvider>
            <DemoModeProvider>
                <ToastProvider>
                    <ServiceWorkerRegistrar />
                    <QueryProvider>
                        <SessionRefreshGuard />
                        <SentryUserContext />
                        {children}
                    </QueryProvider>
                    <AlertToToastBridge />
                </ToastProvider>
            </DemoModeProvider>
        </PostHogProvider>
    );
}
