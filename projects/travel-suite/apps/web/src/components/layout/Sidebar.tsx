"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Globe,
    ChevronRight,
    ChevronDown,
    LogOut,
    User as UserIcon,
    Compass,
} from "lucide-react";
import { getPrimaryItems, getSecondaryGrouped, type NavItemConfig } from "@/lib/nav/nav-config";
import { useTourToggle } from "@/lib/tour/tour-toggle-context";
import { resolveIcon } from "@/lib/nav/icon-map";

const SIDEBAR_PROFILE_SELECT = "full_name, role";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { useNavCounts } from "@/components/layout/useNavCounts";
import { cn } from "@/lib/utils";

interface SidebarProps {
    className?: string;
}

interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
    badge?: number;
    badgeKey?: keyof ReturnType<typeof useNavCounts>;
    badgeColor?: string;
}

/** Convert shared NavItemConfig to Sidebar's internal NavItem format */
function toNavItem(config: NavItemConfig): NavItem {
    return {
        icon: resolveIcon(config.icon),
        label: config.label,
        href: config.href,
        badgeKey: config.badgeKey,
        badgeColor: config.badgeColor,
    };
}

const PRIMARY_ITEMS: NavItem[] = getPrimaryItems().map(toNavItem);

interface BadgeProps {
    count: number;
    color: string;
    collapsed?: boolean;
}

function NotificationBadge({ count, color, collapsed }: BadgeProps) {
    if (count <= 0) return null;

    return (
        <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
                "flex items-center justify-center rounded-full text-white font-bold leading-none shrink-0",
                collapsed
                    ? "absolute -top-1 -right-1 w-4 h-4 text-[9px]"
                    : "min-w-[18px] h-[18px] px-1 text-[10px] ml-auto"
            )}
            style={{ backgroundColor: color }}
        >
            <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
                {count > 99 ? "99+" : count}
            </motion.span>
        </motion.span>
    );
}

function NavItemRow({
    item,
    isActive,
    isCollapsed,
}: {
    item: NavItem;
    isActive: boolean;
    isCollapsed: boolean;
}) {
    const Icon = item.icon;
    const badgeCount = item.badge ?? 0;
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group",
                isCollapsed ? "justify-center" : "",
                isActive
                    ? item.href === "/inbox"
                        ? "bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/25 shadow-[0_0_12px_rgba(37,211,102,0.1)]"
                        : "bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-primary/10"
                    : "hover:bg-slate-800/70 text-slate-400 hover:text-slate-100 border border-transparent"
            )}
        >
            {/* Active left-bar indicator */}
            {isActive && !isCollapsed && (
                <motion.div
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 w-1 h-6 rounded-r-full"
                    style={{
                        backgroundColor:
                            item.href === "/inbox" ? "#25D366" : "var(--primary, #00d084)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 35 }}
                />
            )}

            {/* Icon wrapper — relative for collapsed badge */}
            <div className="relative shrink-0">
                <Icon
                    className={cn(
                        "w-5 h-5 transition-transform group-hover:scale-110",
                        isActive
                            ? item.href === "/inbox"
                                ? "text-[#25D366]"
                                : "text-primary"
                            : "text-slate-400"
                    )}
                />
                {isCollapsed && badgeCount > 0 && (
                    <NotificationBadge count={badgeCount} color={badgeColor} collapsed />
                )}
            </div>

            {/* Label + badge (expanded) */}
            {!isCollapsed && (
                <>
                    <span className="text-sm font-medium whitespace-nowrap flex-1">
                        {item.label}
                    </span>
                    {badgeCount > 0 && (
                        <NotificationBadge count={badgeCount} color={badgeColor} collapsed={false} />
                    )}
                </>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
                <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 border border-slate-700/60 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                    {badgeCount > 0 && (
                        <span
                            className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                            style={{ backgroundColor: badgeColor }}
                        >
                            {badgeCount}
                        </span>
                    )}
                </div>
            )}
        </Link>
    );
}

export default function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const supabase = createClient();
    const counts = useNavCounts();
    const { isTourActive, startPageTour, stopTour, hasCurrentPageTour, progress } = useTourToggle();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(
        () =>
            getSecondaryGrouped().some((group) =>
                group.items.some(
                    (item) =>
                        pathname === item.href ||
                        (item.href !== "/" && pathname?.startsWith(item.href))
                )
            )
    );
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<{
        full_name?: string | null;
        role?: string | null;
    } | null>(null);
    const secondaryGroups = getSecondaryGrouped([], {
        includeGodMode: profile?.role === "super_admin",
    }).map((group) => ({
        ...group,
        items: group.items.map(toNavItem),
    }));

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select(SIDEBAR_PROFILE_SELECT)
                    .eq("id", user.id)
                    .single();
                setProfile(profileData);
            }
        };
        getUser();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const isActivePath = (href: string) =>
        pathname === href || (href !== "/" && pathname?.startsWith(href));

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 72 : 256 }}
            transition={{ type: "spring", stiffness: 320, damping: 35 }}
            className={cn(
                "min-h-[100dvh] flex flex-col bg-slate-900/95 backdrop-blur text-slate-300 border-r border-white/10 sticky top-0 overflow-hidden z-40",
                className
            )}
        >
            {/* ── Logo / Org Header ── */}
            <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden w-full">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <Globe className="w-5 h-5 text-white" />
                    </div>
                    <AnimatePresence initial={false}>
                        {!isCollapsed && (
                            <motion.div
                                key="logo-text"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col overflow-hidden"
                            >
                                <span className="font-bold text-white text-sm truncate leading-tight">
                                    TripBuilt
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                                    PREMIUM SAAS
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Scrollable Nav Body ── */}
            <nav aria-label="Main navigation" className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 custom-scrollbar">
                {/* PRIMARY NAV */}
                <div className="space-y-1">
                    {!isCollapsed && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-3 text-[9px] font-bold tracking-widest text-slate-600 uppercase mb-2 mt-1"
                        >
                            Main
                        </motion.p>
                    )}
                    {PRIMARY_ITEMS.map((item) => (
                        <NavItemRow
                            key={item.href}
                            item={{
                                ...item,
                                badge: item.badgeKey ? counts[item.badgeKey] : 0,
                            }}
                            isActive={isActivePath(item.href)}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                </div>

                {/* DIVIDER */}
                <div className="my-3 border-t border-white/5" />

                {/* MORE / SECONDARY SECTION */}
                <div className="space-y-1">
                    {/* More toggle button */}
                    <button
                        onClick={() => setIsMoreOpen((prev) => !prev)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 group",
                            isCollapsed ? "justify-center" : ""
                        )}
                    >
                        <div className="relative shrink-0">
                            <motion.div
                                animate={{ rotate: isMoreOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isCollapsed ? (
                                    <ChevronDown className="w-5 h-5" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </motion.div>
                        </div>
                        {!isCollapsed && (
                            <span className="text-xs font-semibold tracking-widest uppercase">
                                More
                            </span>
                        )}
                        {isCollapsed && (
                            <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 border border-slate-700/60 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                                More
                            </div>
                        )}
                    </button>

                    {/* Secondary items — animated collapse */}
                    <AnimatePresence initial={false}>
                        {isMoreOpen && (
                            <motion.div
                                key="more-section"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="overflow-hidden space-y-1"
                            >
                                {!isCollapsed && (
                                    <div className="pl-3 border-l border-white/10 ml-4 space-y-3 py-1">
                                        {secondaryGroups.map((group) => (
                                            <div key={group.section} className="space-y-1">
                                                <p className="px-3 text-[9px] font-bold tracking-widest text-slate-600 uppercase pt-1">
                                                    {group.label}
                                                </p>
                                                {group.items.map((item) => (
                                                    <NavItemRow
                                                        key={item.href}
                                                        item={item}
                                                        isActive={isActivePath(item.href)}
                                                        isCollapsed={false}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {isCollapsed && (
                                    <div className="space-y-3">
                                        {secondaryGroups.map((group) => (
                                            <div key={group.section} className="space-y-1">
                                                {group.items.map((item) => (
                                                    <NavItemRow
                                                        key={item.href}
                                                        item={item}
                                                        isActive={isActivePath(item.href)}
                                                        isCollapsed={true}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            {/* ── Footer: Tour + User Profile ── */}
            <div className="p-3 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm shrink-0">
                {/* Page Tour toggle */}
                <button
                    onClick={() => isTourActive ? stopTour() : startPageTour()}
                    disabled={!hasCurrentPageTour && !isTourActive}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all w-full mb-2 group",
                        isCollapsed ? "justify-center" : "",
                        isTourActive
                            ? "text-primary bg-primary/10 border border-primary/20"
                            : hasCurrentPageTour
                                ? "text-primary/80 hover:text-primary hover:bg-primary/10 border border-transparent"
                                : "text-slate-500/50 border border-transparent cursor-not-allowed"
                    )}
                >
                    <div className="relative shrink-0">
                        <Compass className={cn(
                            "w-4 h-4 transition-transform",
                            isTourActive ? "animate-[spin_4s_linear_infinite] text-primary" : "group-hover:rotate-45"
                        )} />
                        {isCollapsed && isTourActive && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                        )}
                    </div>
                    {!isCollapsed && (
                        <>
                            <div className="flex-1 text-left">
                                <span className="text-xs font-medium block">Page Tour</span>
                                {progress.total > 0 && (
                                    <span className="text-[10px] text-slate-500">
                                        {progress.visited}/{progress.total} explored
                                    </span>
                                )}
                            </div>
                            <div className={cn(
                                "w-7 h-4 rounded-full transition-colors flex items-center px-0.5",
                                isTourActive ? "bg-primary" : "bg-slate-600"
                            )}>
                                <motion.div
                                    animate={{ x: isTourActive ? 12 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="w-3 h-3 rounded-full bg-white shadow-sm"
                                />
                            </div>
                        </>
                    )}
                    {isCollapsed && (
                        <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 border border-slate-700/60 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                            Page Tour {isTourActive ? "(On)" : "(Off)"}
                        </div>
                    )}
                </button>

                {/* Collapse toggle (desktop) */}
                <button
                    onClick={() => setIsCollapsed((c) => !c)}
                    className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800/50 text-slate-500 hover:text-slate-300 transition-all w-full mb-2"
                >
                    <motion.div
                        animate={{ rotate: isCollapsed ? 0 : 180 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </motion.div>
                    {!isCollapsed && (
                        <span className="text-xs font-medium">Collapse sidebar</span>
                    )}
                </button>

                {/* User card */}
                <div className="relative group">
                    <div
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer",
                            isCollapsed
                                ? "justify-center"
                                : "bg-slate-800/40 border border-white/8 hover:bg-slate-800/60"
                        )}
                    >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0 border border-primary/20">
                            <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <AnimatePresence initial={false}>
                            {!isCollapsed && (
                                <motion.div
                                    key="user-text"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col overflow-hidden flex-1 min-w-0"
                                >
                                    <span className="text-sm font-bold text-white truncate">
                                        {profile?.full_name || user?.email?.split("@")[0] || "User"}
                                    </span>
                                    <span className="text-[10px] text-slate-500 truncate">
                                        {profile?.role === "super_admin"
                                            ? "Super Admin"
                                            : profile?.role === "admin"
                                                ? "Administrator"
                                                : "Tour Operator"}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Hover popover menu */}
                    <div className="absolute bottom-full left-0 mb-2 w-52 hidden group-hover:block z-50">
                        <div className="bg-[#111e35] border border-slate-700/50 rounded-xl shadow-2xl p-2 space-y-1">
                            <Link
                                href="/settings?tab=profile"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-300 transition-colors"
                            >
                                <UserIcon className="w-4 h-4" />
                                Profile Settings
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-xs text-red-400 w-full text-left transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
}
