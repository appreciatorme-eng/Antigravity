"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import CommandPalette from "./CommandPalette";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // If it's the welcome or auth page, don't show the shell
    const isPublicPage = pathname === "/welcome" || pathname === "/auth";

    if (!isMounted) return null;

    if (isPublicPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-[#0a1628]">
            <Sidebar className="hidden md:flex shrink-0" />
            <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24 md:pb-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, scale: 0.99 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.99 }}
                            transition={{ duration: 0.15 }}
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
        </div>
    );
}
