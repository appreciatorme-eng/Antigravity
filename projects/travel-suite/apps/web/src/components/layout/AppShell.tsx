"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import CommandPalette from "./CommandPalette";
import FloatingActionButton from "./FloatingActionButton";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Avoid double shelling for admin routes because /admin has its own layout shell.
    const isAdminPage = pathname?.startsWith("/admin");
    // If it's the welcome or auth page, don't show the shell
    const isPublicPage = pathname === "/welcome" || pathname === "/auth";

    if (!isMounted) return null;

    if (isPublicPage || isAdminPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-[#0a1628] bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0a1628] dark:via-[#0c1b30] dark:to-[#0f2440] transition-colors duration-500">
            <Sidebar className="hidden md:flex shrink-0" />
            <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden relative">
                {/* Subtle background decorative bloom */}
                <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px]" />
                <TopBar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24 md:pb-8 relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 15, scale: 0.995 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.995 }}
                            transition={{
                                duration: 0.4,
                                ease: [0.175, 0.885, 0.32, 1.05],
                            }}
                            className="max-w-7xl mx-auto w-full"
                        >
                            <Breadcrumbs />
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
                <MobileNav />
            </div>
            <CommandPalette />
            {/* FAB: mobile-only circular button (fixed bottom-right, above MobileNav) */}
            <FloatingActionButton variant="mobile" />
        </div>
    );
}
