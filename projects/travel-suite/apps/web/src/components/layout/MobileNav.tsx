"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
    Compass,
    MoreHorizontal,
    Plus,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavCounts } from "@/components/layout/useNavCounts";
import { getSecondaryGrouped, FAB_ACTIONS, type NavItemConfig } from "@/lib/nav/nav-config";
import { resolveIcon } from "@/lib/nav/icon-map";
import { cn } from "@/lib/utils";
import { useTourToggle } from "@/lib/tour/tour-toggle-context";

// ---------------------------------------------------------------------------
// Bottom tab bar items (hardcoded — see CLAUDE.md "Mobile Bottom Tabs")
// Changes here MUST be reflected in CLAUDE.md + docs/MOBILE_NAV.md
// ---------------------------------------------------------------------------

interface TabItem {
    icon: React.ElementType;
    label: string;
    href: string;
    badgeKey?: keyof ReturnType<typeof useNavCounts>;
    badgeColor?: string;
}

const TAB_ITEMS: TabItem[] = [
    { icon: resolveIcon("Home"), label: "Home", href: "/" },
    { icon: resolveIcon("MessageCircle"), label: "Inbox", href: "/inbox", badgeKey: "inboxUnread", badgeColor: "#25D366" },
    // Slot 3 = Center FAB (rendered separately)
    { icon: resolveIcon("Briefcase"), label: "Trips", href: "/trips", badgeKey: "bookingsToday", badgeColor: "#f97316" },
    { icon: resolveIcon("Users"), label: "Clients", href: "/clients", badgeKey: "reviewsNeedingResponse", badgeColor: "#3b82f6" },
];

// ---------------------------------------------------------------------------
// Secondary items for "More" drawer (from shared config)
// ---------------------------------------------------------------------------

interface SecondaryDrawerItem {
    icon: React.ElementType;
    label: string;
    href: string;
}

// Tell getSecondaryGrouped which primary items are in the tab bar,
// so overflow primary items (Proposals) appear in the "More" drawer
const MOBILE_TAB_HREFS = TAB_ITEMS.map((t) => t.href);

const SECONDARY_GROUPS = getSecondaryGrouped(MOBILE_TAB_HREFS).map((group) => ({
    ...group,
    items: group.items.map((config: NavItemConfig): SecondaryDrawerItem => ({
        icon: resolveIcon(config.icon),
        label: config.label,
        href: config.href,
    })),
}));

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BadgeDot({ count, color }: { count: number; color: string }) {
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const counts = useNavCounts();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isFabOpen, setIsFabOpen] = useState(false);
    const { isTourActive, startPageTour, stopTour, hasCurrentPageTour } = useTourToggle();

    // Close drawers on route change
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- intentional: close drawers on route change */
        setIsDrawerOpen(false);
        setIsFabOpen(false);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [pathname]);

    // Close on ESC
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsDrawerOpen(false);
            setIsFabOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const isActivePath = (href: string) =>
        pathname === href || (href !== "/" && pathname?.startsWith(href));

    return (
        <>
            {/* ── FAB Action Sheet ──────────────────────────────────────── */}
            <AnimatePresence>
                {isFabOpen && (
                    <>
                        <motion.div
                            key="fab-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[48]"
                            onClick={() => setIsFabOpen(false)}
                        />
                        <motion.div
                            key="fab-sheet"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 380, damping: 40 }}
                            className="md:hidden fixed bottom-[72px] left-0 right-0 z-[49] bg-white/95 dark:bg-slate-900/98 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/60 rounded-t-3xl shadow-2xl px-5 pt-5 pb-6"
                        >
                            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    Quick Actions
                                </span>
                                <button
                                    onClick={() => setIsFabOpen(false)}
                                    className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                    aria-label="Close quick actions"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {FAB_ACTIONS.map((action) => (
                                    <motion.button
                                        key={action.label}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 }}
                                        onClick={() => {
                                            if (action.route) {
                                                router.push(action.route);
                                            } else if (action.event) {
                                                window.dispatchEvent(new CustomEvent(action.event));
                                            }
                                            setIsFabOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all active:scale-[0.98]",
                                            action.bgColor
                                        )}
                                    >
                                        <span className="text-xl leading-none" role="img" aria-label={action.label}>
                                            {action.emoji}
                                        </span>
                                        <div className="text-left">
                                            <p className="font-bold">{action.label}</p>
                                            <p className="text-xs font-normal opacity-80">{action.description}</p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── "More" Secondary Drawer ───────────────────────────────── */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        <motion.div
                            key="drawer-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[48]"
                            onClick={() => setIsDrawerOpen(false)}
                        />
                        <motion.div
                            key="drawer-panel"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 380, damping: 40 }}
                            className="md:hidden fixed bottom-[72px] left-0 right-0 z-[49] bg-white/95 dark:bg-slate-900/98 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/60 rounded-t-3xl shadow-2xl px-5 pt-5 pb-6"
                        >
                            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-5" />
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    More
                                </span>
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                    aria-label="Close drawer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {/* Page Tour toggle */}
                                {hasCurrentPageTour && (
                                    <button
                                        onClick={() => {
                                            if (isTourActive) {
                                                stopTour();
                                            } else {
                                                startPageTour();
                                            }
                                            setIsDrawerOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all mb-2",
                                            isTourActive
                                                ? "bg-primary/10 border border-primary/20"
                                                : "bg-slate-50 dark:bg-slate-800/50 border border-transparent"
                                        )}
                                    >
                                        <Compass className={cn(
                                            "w-5 h-5",
                                            isTourActive ? "text-primary animate-[spin_4s_linear_infinite]" : "text-primary/70"
                                        )} />
                                        <span className={cn(
                                            "text-sm font-semibold flex-1 text-left",
                                            isTourActive ? "text-primary" : "text-slate-700 dark:text-slate-300"
                                        )}>
                                            Page Tour
                                        </span>
                                        <div className={cn(
                                            "w-8 h-5 rounded-full transition-colors flex items-center px-0.5",
                                            isTourActive ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"
                                        )}>
                                            <motion.div
                                                animate={{ x: isTourActive ? 14 : 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                className="w-3.5 h-3.5 rounded-full bg-white shadow-sm"
                                            />
                                        </div>
                                    </button>
                                )}
                                {SECONDARY_GROUPS.map((group) => (
                                    <div key={group.section}>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
                                            {group.label}
                                        </p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {group.items.map((item) => {
                                                const isActive = isActivePath(item.href);
                                                const Icon = item.icon;
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        className={cn(
                                                            "flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all active:scale-95",
                                                            isActive
                                                                ? "bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/30 dark:ring-primary/40"
                                                                : "hover:bg-slate-100 dark:hover:bg-slate-800/70"
                                                        )}
                                                    >
                                                        <Icon
                                                            className={cn(
                                                                "w-5 h-5",
                                                                isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
                                                            )}
                                                        />
                                                        <span
                                                            className={cn(
                                                                "text-[10px] text-center leading-tight",
                                                                isActive ? "text-primary font-bold" : "text-slate-600 dark:text-slate-400 font-semibold"
                                                            )}
                                                        >
                                                            {item.label}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Bottom Navigation Bar ─────────────────────────────────── */}
            <nav aria-label="Bottom navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 px-2 pt-2 pb-safe z-50 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.15)] transition-colors duration-300">
                <div className="flex items-stretch justify-around gap-0.5 max-w-lg mx-auto">
                    {/* Left tabs: Home, Inbox */}
                    {TAB_ITEMS.slice(0, 2).map((item) => (
                        <TabButton key={item.href} item={item} isActive={isActivePath(item.href)} counts={counts} />
                    ))}

                    {/* Center FAB button */}
                    <button
                        onClick={() => { setIsFabOpen((o) => !o); setIsDrawerOpen(false); }}
                        className="flex flex-col items-center justify-center -mt-5 px-1"
                        aria-label={isFabOpen ? "Close quick actions" : "Quick actions"}
                    >
                        <motion.div
                            animate={{ rotate: isFabOpen ? 45 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-colors",
                                isFabOpen
                                    ? "bg-slate-600 shadow-slate-600/30"
                                    : "bg-[#25D366] shadow-[0_4px_16px_rgba(37,211,102,0.4)]"
                            )}
                        >
                            <Plus className="w-6 h-6" />
                        </motion.div>
                    </button>

                    {/* Right tabs: Trips, Clients */}
                    {TAB_ITEMS.slice(2).map((item) => (
                        <TabButton key={item.href} item={item} isActive={isActivePath(item.href)} counts={counts} />
                    ))}

                    {/* "More" button */}
                    <button
                        onClick={() => { setIsDrawerOpen((o) => !o); setIsFabOpen(false); }}
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

// ---------------------------------------------------------------------------
// Tab button (extracted to reduce duplication)
// ---------------------------------------------------------------------------

function TabButton({
    item,
    isActive,
    counts,
}: {
    item: TabItem;
    isActive: boolean;
    counts: ReturnType<typeof useNavCounts>;
}) {
    const Icon = item.icon;
    const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;
    const badgeColor = item.badgeColor ?? "#00d084";

    return (
        <Link
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
}
