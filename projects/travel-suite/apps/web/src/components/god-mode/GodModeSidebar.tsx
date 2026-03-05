// God Mode sidebar — fixed left nav with amber accent and super_admin links.
// Visually distinct from regular admin sidebar with dark theme + amber accent.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    UserPlus,
    Users,
    BarChart3,
    DollarSign,
    Share2,
    LifeBuoy,
    Megaphone,
    Power,
    Activity,
    ScrollText,
    Shield,
    ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
    dangerous?: boolean;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        title: "OVERVIEW",
        items: [
            { icon: LayoutDashboard, label: "Command Center", href: "/god" },
        ],
    },
    {
        title: "USERS & ORGS",
        items: [
            { icon: UserPlus, label: "Signups", href: "/god/signups" },
            { icon: Users, label: "Directory", href: "/god/directory" },
        ],
    },
    {
        title: "ANALYTICS",
        items: [
            { icon: BarChart3, label: "Feature Usage", href: "/god/analytics" },
            { icon: DollarSign, label: "API Costs", href: "/god/costs" },
        ],
    },
    {
        title: "GROWTH",
        items: [
            { icon: Share2, label: "Referrals", href: "/god/referrals" },
        ],
    },
    {
        title: "OPERATIONS",
        items: [
            { icon: LifeBuoy, label: "Support Tickets", href: "/god/support" },
            { icon: Megaphone, label: "Announcements", href: "/god/announcements" },
        ],
    },
    {
        title: "SYSTEM",
        items: [
            { icon: Power, label: "Kill Switch", href: "/god/kill-switch", dangerous: true },
            { icon: Activity, label: "Health Monitor", href: "/god/monitoring" },
            { icon: ScrollText, label: "Audit Log", href: "/god/audit-log" },
        ],
    },
];

function NavItemRow({ item, active }: { item: NavItem; active: boolean }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                active
                    ? item.dangerous
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : item.dangerous
                        ? "text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
        >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
        </Link>
    );
}

export default function GodModeSidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/god") return pathname === "/god";
        return pathname.startsWith(href);
    };

    return (
        <div className="fixed left-0 top-0 h-full w-60 bg-gray-900 border-r border-gray-800 flex flex-col z-50">
            {/* Header */}
            <div className="px-4 py-5 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
                        <Shield className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-400 tracking-widest uppercase">God Mode</p>
                        <p className="text-xs text-gray-500">Platform Control</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto">
                {NAV_GROUPS.map((group) => (
                    <div key={group.title}>
                        <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                            {group.title}
                        </p>
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <NavItemRow
                                    key={item.href}
                                    item={item}
                                    active={isActive(item.href)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-2 py-4 border-t border-gray-800">
                <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Admin Panel
                </Link>
            </div>
        </div>
    );
}
