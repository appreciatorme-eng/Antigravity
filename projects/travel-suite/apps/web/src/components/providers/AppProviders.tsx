"use client";

import { AlertToToastBridge, ToastProvider } from "@/components/ui/toast";

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            {children}
            <AlertToToastBridge />
        </ToastProvider>
    );
}
