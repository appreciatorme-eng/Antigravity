"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Plus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
    const pathname = usePathname();

    const items = [
        { icon: LayoutDashboard, label: "Home", href: "/" },
        { icon: Briefcase, label: "Leads", href: "/trips" },
        { icon: Plus, label: "Quote", href: "/planner", isSpecial: true },
        { icon: MessageCircle, label: "Inbox", href: "/inbox", isWhatsApp: true },
        { icon: User, label: "Profile", href: "/admin/settings" },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 px-6 py-2 z-50 safe-area-bottom shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-colors duration-300">
            <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    if (item.isSpecial) {
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex flex-col items-center justify-center -mt-8 px-2 group"
                            >
                                <div className="w-14 h-14 rounded-full bg-gradient-premium flex items-center justify-center shadow-lg shadow-blue-500/30 text-white ring-4 ring-white dark:ring-slate-900 transition-all duration-300 group-active:scale-95 group-hover:-translate-y-1">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="text-[11px] font-bold mt-1 text-slate-700 dark:text-slate-300 tracking-tight">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 p-2 transition-all active:scale-95",
                                isActive ? (item.isWhatsApp ? "text-whatsapp" : "text-primary") : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                        >
                            <Icon className={cn("w-6 h-6 transition-all duration-300", isActive && "fill-current/10 -translate-y-1")} />
                            {isActive && (
                                <span className="absolute -top-1 w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                            )}
                            {item.isWhatsApp && (
                                <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                            )}
                            <span className={cn(
                                "text-[10px] font-medium tracking-tight transition-all",
                                isActive ? "opacity-100" : "opacity-80"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
