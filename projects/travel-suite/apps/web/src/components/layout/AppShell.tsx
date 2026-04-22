"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import CommandPalette from "./CommandPalette";
import TourAssistantChat from "@/components/assistant/TourAssistantChat";
import { QuickQuoteModal } from "@/components/glass/QuickQuoteModal";
import DemoTour from "@/components/demo/DemoTour";
import { TourToggleProvider } from "@/lib/tour/tour-toggle-context";
import { ConnectedTourCompletePrompt } from "@/components/tour/ConnectedTourCompletePrompt";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const [isQuickQuoteOpen, setIsQuickQuoteOpen] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    // Listen for the open-quick-quote custom event dispatched by FAB actions
    useEffect(() => {
        const handler = () => setIsQuickQuoteOpen(true);
        window.addEventListener("open-quick-quote", handler);
        return () => window.removeEventListener("open-quick-quote", handler);
    }, []);

    // Avoid double shelling for admin routes because /admin has its own layout shell.
    const isAdminPage = pathname?.startsWith("/admin");
    const isGodPage = pathname?.startsWith("/god");
    const isPlannerPage = pathname?.startsWith("/planner");
    const isFullBleedPage =
        pathname?.startsWith("/inbox") ||
        pathname?.startsWith("/calendar");
    // Marketing, auth, and welcome pages bypass the SaaS shell entirely.
    const MARKETING_PATHS = ["/", "/pricing", "/about", "/blog", "/demo", "/solutions", "/bones"];
    const isMarketingPage = MARKETING_PATHS.some(
        (p) => pathname === p || pathname?.startsWith(p + "/")
    );
    const isTripRequestPublicPage =
        pathname === "/trip-request" ||
        pathname?.startsWith("/trip-request/");
    const isPublicPage =
        pathname === "/welcome" ||
        pathname === "/auth" ||
        pathname === "/offline" ||
        pathname?.startsWith("/onboarding") ||
        isTripRequestPublicPage ||
        pathname?.startsWith("/share") ||
        pathname?.startsWith("/portal") ||
        pathname?.startsWith("/pay") ||
        pathname?.startsWith("/live") ||
        pathname?.startsWith("/p/") ||
        isMarketingPage;

    if (!isMounted) return null;

    if (isPublicPage || isAdminPage || isGodPage) {
        return <>{children}</>;
    }

    return (
        <TourToggleProvider>
            <div className="flex min-h-screen bg-slate-50 dark:bg-[#0a1628] bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0a1628] dark:via-[#0c1b30] dark:to-[#0f2440] transition-colors duration-500">
                <Sidebar className="hidden md:flex shrink-0" />
                <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden relative">
                    {/* Subtle background decorative bloom */}
                    <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px]" />
                    <TopBar />
                    <main
                        id="main-content"
                        className={cn(
                            "flex-1 relative z-10",
                            isFullBleedPage
                                ? "overflow-hidden flex flex-col"
                                : isPlannerPage
                                    ? "overflow-y-auto flex min-h-0 flex-col custom-scrollbar pb-24 md:pb-8"
                                : "overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24 md:pb-8",
                        )}
                    >
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
                                className={cn(
                                    "w-full",
                                    isFullBleedPage || isPlannerPage
                                        ? "flex min-h-0 flex-col"
                                        : !isGodPage && "max-w-7xl mx-auto",
                                )}
                            >
                                {!isGodPage && !isFullBleedPage && !isPlannerPage && <Breadcrumbs />}
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                    <MobileNav />
                </div>
                <CommandPalette />
                <TourAssistantChat />
                <QuickQuoteModal
                    isOpen={isQuickQuoteOpen}
                    onClose={() => setIsQuickQuoteOpen(false)}
                />
                <DemoTour />
                <ConnectedTourCompletePrompt />
            </div>
        </TourToggleProvider>
    );
}
