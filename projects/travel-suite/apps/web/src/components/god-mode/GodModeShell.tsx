// God Mode shell — dark sidebar + main content area wrapper.
// Uses amber/red accent palette to distinguish from /admin panel.

"use client";

import { ReactNode } from "react";
import GodModeSidebar from "@/components/god-mode/GodModeSidebar";

interface GodModeShellProps {
    children: ReactNode;
}

export default function GodModeShell({ children }: GodModeShellProps) {
    return (
        <div className="flex min-h-screen bg-gray-950 text-white">
            <GodModeSidebar />

            <div className="flex-1 flex flex-col min-w-0 ml-60">
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
