/**
 * Admin Panel Layout
 *
 * Updated to match GoBuddy Adventures design system
 * Features glassmorphism, unified colors (#00d084, #124ea2)
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    Users,
    Car,
    MapPin,
    Bell,
    Settings,
    ChevronLeft,
    Loader2,
    ShieldAlert,
    BarChart3,
    FileText,
    Inbox,
    Wand2,
    ClipboardList,
    Compass,
    Columns3,
    Globe,
    FileSpreadsheet,
    Plane,
    ShoppingBag,
    Store,
    Building2,
} from "lucide-react";
import { ThemeToggleButton } from "@/components/ThemeToggle";

// Sidebar navigation links - includes marketplace (verified 2026-02-18)
const sidebarLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/marketplace", label: "Tour Marketplace", icon: Building2 },
    { href: "/admin/planner", label: "Planner", icon: Compass },
    { href: "/admin/drivers", label: "Drivers", icon: Car },
    { href: "/admin/trips", label: "Trips", icon: MapPin },
    { href: "/admin/clients", label: "Clients", icon: Users },
    { href: "/admin/tour-templates", label: "Tour Templates", icon: Globe },
    { href: "/admin/proposals", label: "Proposals", icon: FileSpreadsheet },
    { href: "/admin/add-ons", label: "Add-ons", icon: ShoppingBag },
    { href: "/admin/kanban", label: "Kanban", icon: Columns3 },
    { href: "/admin/activity", label: "Activity", icon: ClipboardList },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/templates", label: "Email Templates", icon: Wand2 },
    { href: "/admin/billing", label: "Billing", icon: FileText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/support", label: "Support", icon: Inbox },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const useMockAdmin = process.env.NEXT_PUBLIC_MOCK_ADMIN === "true";

    useEffect(() => {
        const supabase = createClient();

        const checkAuth = async () => {
            if (useMockAdmin) {
                setAuthorized(true);
                setLoading(false);
                return;
            }

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/auth");
                return;
            }

            // Check if user is admin
            const { data: profile } = await supabase
                .from("profiles")
                .select("role, organization_id")
                .eq("id", user.id)
                .single();

            if (!profile || profile.role !== "admin") {
                setAuthorized(false);
                setLoading(false);
                return;
            }

            setAuthorized(true);
            setLoading(false);
        };

        checkAuth();
    }, [router, useMockAdmin]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-app">
                <div className="glass-card p-8 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-app p-4">
                <div className="glass-card p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-serif text-secondary mb-2">
                        Access Denied
                    </h1>
                    <p className="text-text-secondary mb-6">
                        You don&apos;t have permission to access the admin panel. Please
                        contact your administrator if you believe this is an error.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-smooth shadow-button"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gradient-app">
            {/* Sidebar */}
            <aside className={`${collapsed ? 'w-20' : 'w-64'} glass-nav border-r border-white/20 flex flex-col transition-all duration-300 sticky top-0 h-screen`}>
                {/* Logo */}
                <div className="p-5 border-b border-white/20">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-button">
                            <Plane className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="leading-tight">
                                <span className="block text-xs uppercase tracking-widest text-primary font-bold">GoBuddy</span>
                                <span className="block text-base font-serif text-secondary">Admin Panel</span>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {/* Debug: Show link count */}
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {sidebarLinks.length} menu items
                    </div>
                    {sidebarLinks.map((link) => {
                        // Debug: Log marketplace link
                        if (link.label === "Tour Marketplace") {
                            console.log("✅ Marketplace link found in sidebar:", link);
                        }
                        const isActive = pathname === link.href ||
                            (link.href !== "/admin" && pathname.startsWith(link.href));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                title={link.label}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-smooth ${isActive
                                    ? "bg-primary text-white shadow-button"
                                    : "text-secondary hover:bg-white/40"
                                    }`}
                            >
                                <link.icon className="w-5 h-5 shrink-0" />
                                {!collapsed && <span>{link.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/20 space-y-2">
                    {/* Theme Toggle */}
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                        {!collapsed && <span className="text-sm font-medium text-secondary">Theme</span>}
                        <ThemeToggleButton />
                    </div>

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-secondary hover:text-primary transition-colors py-2"
                    >
                        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                        {!collapsed && 'Collapse'}
                    </button>

                    {/* Back to site */}
                    {!collapsed && (
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to site
                        </Link>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto p-4 md:p-8">
                {useMockAdmin && (
                    <div className="glass-card mb-6 px-4 py-3 border-l-4 border-warning">
                        <p className="text-sm text-secondary font-medium">
                            <strong>Mock Mode:</strong> Admin access and data are simulated for demo purposes.
                        </p>
                    </div>
                )}
                <div className="glass-card p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
