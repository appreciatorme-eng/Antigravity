"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Briefcase, Users, TrendingUp, MoreHorizontal, X, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Mock notification counts — replace with real store values later
const MOCK_WHATSAPP_UNREAD = 3;
const MOCK_DRIVER_UNASSIGNED = 2;
const MOCK_NEW_LEADS_TODAY = 1;

interface PrimaryNavItem {
    icon: React.ElementType;
    label: string;
    href: string;
    badge?: number;
    badgeColor?: string;
    isMore?: boolean;
}

const PRIMARY_ITEMS: PrimaryNavItem[] = [
    {
        icon: Home,
        label: "Home",
        href: "/",
    },
    {
        icon: MessageCircle,
        label: "Inbox",
        href: "/inbox",
        badge: MOCK_WHATSAPP_UNREAD,
        badgeColor: "#25D366",
    },
    {
        icon: Briefcase,
        label: "Trips",
        href: "/trips",
        badge: MOCK_DRIVER_UNASSIGNED,
        badgeColor: "#f97316",
    },
    {
        icon: Users,
        label: "Clients",
        href: "/clients",
        badge: MOCK_NEW_LEADS_TODAY,
        badgeColor: "#3b82f6",
    },
    {
        icon: TrendingUp,
        label: "Revenue",
        href: "/admin/revenue",
    },
];

interface SecondaryDrawerItem {
    emoji: string;
    label: string;
    href: string;
}

const SECONDARY_ITEMS: SecondaryDrawerItem[] = [
    { emoji: "🏪", label: "Marketplace", href: "/marketplace" },
    { emoji: "✨", label: "AI Insights", href: "/admin/insights" },
    { emoji: "🧭", label: "Command", href: "/admin/operations" },
    { emoji: "💵", label: "Cost", href: "/admin/cost" },
    { emoji: "📣", label: "Social Studio", href: "/social" },
    { emoji: "📅", label: "Calendar", href: "/calendar" },
    { emoji: "🚗", label: "Drivers", href: "/drivers" },
    { emoji: "🗺️", label: "Planner", href: "/planner" },
    { emoji: "✈️", label: "Add-ons", href: "/add-ons" },
    { emoji: "🛟", label: "Support", href: "/support" },
    { emoji: "🎁", label: "Refer & Earn", href: "/admin/referrals" },
    { emoji: "⚙️", label: "Settings", href: "/admin/settings" },
];

function BadgeDot({
    count,
    color,
}: {
    count: number;
    color: string;
}) {
    if (count <= 0) return null;
    return (
        <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full text-white text-[9px] font-bold border-2 border-white dark:border-slate-900"
            style={{ backgroundColor: color }}
        >
            {count > 9 ? "9+" : count}
        </motion.span>
    );
}

export default function MobileNav() {
    const pathname = usePathname();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Close drawer on route change
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [pathname]);

    // Close drawer on ESC
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsDrawerOpen(false);
        },
        []
    );
    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const isActivePath = (href: string) =>
        pathname === href || (href !== "/" && pathname?.startsWith(href));

    return (
        <>
            {/* "More" Secondary Drawer */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="drawer-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[48]"
                            onClick={() => setIsDrawerOpen(false)}
                        />

                        {/* Drawer panel (slides up from bottom) */}
                        <motion.div
                            key="drawer-panel"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 380, damping: 40 }}
                            className="md:hidden fixed bottom-[72px] left-0 right-0 z-[49] bg-white/95 dark:bg-slate-900/98 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/60 rounded-t-3xl shadow-2xl px-5 pt-5 pb-6"
                        >
                            {/* Drag handle */}
                            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-5" />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    More
                                </span>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                    aria-label="Close drawer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Grid of secondary items */}
                            <div className="grid grid-cols-4 gap-3">
                                {SECONDARY_ITEMS.map((item) => {
                                    const isActive = isActivePath(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95",
                                                isActive
                                                    ? "bg-primary/10 dark:bg-primary/15"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-800/70"
                                            )}
                                        >
                                            <span className="text-2xl leading-none" role="img">
                                                {item.emoji}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[10px] font-semibold text-center leading-tight",
                                                    isActive
                                                        ? "text-primary"
                                                        : "text-slate-600 dark:text-slate-400"
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 px-2 pt-2 pb-safe z-50 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.15)] transition-colors duration-300">
                <div className="flex items-stretch justify-around gap-1 max-w-lg mx-auto">
                    {/* Primary items */}
                    {PRIMARY_ITEMS.map((item) => {
                        const isActive = isActivePath(item.href);
                        const Icon = item.icon;
                        const badgeCount = item.badge ?? 0;
                        const badgeColor = item.badgeColor ?? "#00d084";

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={(e) => {
                                    if (item.href === "/") {
                                        e.preventDefault();
                                        window.location.href = "/";
                                    }
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-all active:scale-95",
                                    isActive
                                        ? item.href === "/inbox"
                                            ? "text-[#25D366]"
                                            : "text-primary"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                            >
                                <div className="relative">
                                    <Icon
                                        className={cn(
                                            "w-6 h-6 transition-all duration-200",
                                            isActive && "-translate-y-0.5"
                                        )}
                                    />
                                    {isActive && (
                                        <motion.span
                                            layoutId="mobile-active-dot"
                                            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current shadow-[0_0_6px_currentColor]"
                                        />
                                    )}
                                    <BadgeDot count={badgeCount} color={badgeColor} />
                                </div>
                                <span
                                    className={cn(
                                        "text-[10px] font-semibold transition-all",
                                        isActive ? "opacity-100" : "opacity-70"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* "More" button */}
                    <button
                        onClick={() => setIsDrawerOpen((o) => !o)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-all active:scale-95",
                            isDrawerOpen
                                ? "text-primary"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                        aria-label="More navigation options"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: isDrawerOpen ? 90 : 0 }}
                                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                            >
                                <MoreHorizontal className="w-6 h-6" />
                            </motion.div>
                        </div>
                        <span className="text-[10px] font-semibold opacity-70">More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
