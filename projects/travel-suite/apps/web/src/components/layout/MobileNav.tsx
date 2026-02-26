"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Plus, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
    const pathname = usePathname();

    const items = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: Map, label: "Trips", href: "/admin/trips" },
        { icon: Plus, label: "Create", href: "/planner", isSpecial: true },
        { icon: Bell, label: "Alerts", href: "/notifications" },
        { icon: User, label: "Profile", href: "/admin/settings" },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-6 py-2 z-50 safe-area-bottom">
            <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.isSpecial) {
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex flex-col items-center justify-center -mt-8"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 text-white ring-4 ring-white dark:ring-slate-900 transition-transform active:scale-90">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-bold mt-1 text-primary">
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
                                "flex flex-col items-center justify-center gap-1 p-2 transition-all active:scale-95",
                                isActive ? "text-primary" : "text-gray-400"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "fill-primary/10")} />
                            <span className="text-[10px] font-medium tracking-tight">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
