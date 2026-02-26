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
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Loader2, ShieldAlert } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

// Sidebar navigation links - moved to SideBar.tsx but keeping types if needed or just removing

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

    useEffect(() => {
        const supabase = createClient();

        const checkAuth = async () => {
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
    }, [router]);

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
        <AdminLayout>
            {children}
        </AdminLayout>
    );
}
