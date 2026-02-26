"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    FileText,
    Map,
    Plane,
    Store,
    Calendar,
    Truck,
    CreditCard,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User as UserIcon,
    Globe,
    HelpCircle
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SidebarProps {
    className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const supabase = createClient();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();
                setProfile(profile);
            }
        };
        getUser();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const navGroups = [
        {
            label: "OPERATE",
            items: [
                { icon: LayoutDashboard, label: "Dashboard", href: "/" },
                { icon: Briefcase, label: "Trips", href: "/trips" },
                { icon: Users, label: "Clients", href: "/clients" },
                { icon: FileText, label: "Proposals", href: "/proposals" },
            ]
        },
        {
            label: "TOOLS",
            items: [
                { icon: Map, label: "Planner", href: "/planner" },
                { icon: Plane, label: "Bookings", href: "/bookings" },
                { icon: Calendar, label: "Calendar", href: "/calendar" },
                { icon: Store, label: "Tour Marketplace", href: "/admin/marketplace" },
                { icon: Truck, label: "Drivers", href: "/admin/drivers" },
            ]
        },
        {
            label: "BUSINESS",
            items: [
                { icon: BarChart3, label: "Analytics", href: "/admin/revenue" },
                { icon: CreditCard, label: "Billing", href: "/admin/billing" },
                { icon: Settings, label: "Settings", href: "/admin/settings" },
            ]
        }
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 64 : 256 }}
            className={cn(
                "h-screen flex flex-col bg-[#0a1628] text-slate-300 border-r border-slate-800/50 sticky top-0 overflow-hidden z-40",
                className
            )}
        >
            {/* Header / Org Switcher */}
            <div className="h-16 flex items-center px-4 border-b border-slate-800/50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <Globe className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col"
                        >
                            <span className="font-bold text-white text-sm truncate">GoBuddy Adventures</span>
                            <span className="text-[10px] text-slate-500 font-medium">PREMIUM SAAS</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-8 custom-scrollbar">
                {navGroups.map((group, idx) => (
                    <div key={group.label} className="space-y-2">
                        {!isCollapsed && (
                            <motion.h3
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="px-3 text-[10px] font-bold tracking-widest text-slate-500 mb-2"
                            >
                                {group.label}
                            </motion.h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative group",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
                                        )}
                                    >
                                        <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                                        {!isCollapsed && (
                                            <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                                        )}
                                        {isActive && !isCollapsed && (
                                            <motion.div
                                                layoutId="active-indicator"
                                                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        {isCollapsed && (
                                            <div className="absolute left-14 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                                {item.label}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-slate-800/50 bg-[#0a1628]/50 backdrop-blur-sm">
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 text-slate-400 transition-all w-full md:flex hidden"
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
                    </button>

                    <div className="relative group">
                        <div className={cn(
                            "flex items-center gap-3 p-2 rounded-xl transition-all",
                            isCollapsed ? "justify-center" : "bg-slate-800/30 border border-slate-700/50"
                        )}>
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0 border border-primary/20">
                                <UserIcon className="w-6 h-6 text-primary" />
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-bold text-white truncate">
                                        {profile?.full_name || user?.email?.split("@")[0] || "User"}
                                    </span>
                                    <span className="text-[10px] text-slate-500 truncate">
                                        {profile?.role === "admin" ? "Administrator" : "Tour Operator"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Profile Menu Popover (Simplified) */}
                        <div className="absolute bottom-full left-0 mb-2 w-full hidden group-hover:block animate-in slide-in-from-bottom-2 duration-200">
                            <div className="bg-[#111e35] border border-slate-700/50 rounded-xl shadow-2xl p-2 space-y-1">
                                <Link href="/admin/settings/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-300">
                                    <UserIcon className="w-4 h-4" />
                                    Profile Settings
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-xs text-red-400 w-full text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
}
