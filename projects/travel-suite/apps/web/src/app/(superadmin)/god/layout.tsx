// God Mode layout — super_admin gate using same pattern as /admin layout.
// Distinct amber/red accent to visually separate from per-org admin panel.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldAlert, ChevronLeft } from "lucide-react";
import GodModeShell from "@/components/god-mode/GodModeShell";

export default function GodModeLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/superadmin/me", { credentials: "include" });
                if (res.status === 401) {
                    router.push("/auth");
                    return;
                }
                if (!res.ok) {
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }
                const data = await res.json() as { role: string };
                if (data.role !== "super_admin") {
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }
                setAuthorized(true);
                setLoading(false);
            } catch {
                setAuthorized(false);
                setLoading(false);
            }
        };

        void checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-8 text-center shadow-2xl">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Verifying super_admin access...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
                <div className="bg-gray-900 border border-red-500/20 rounded-xl p-8 text-center max-w-md shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-gray-400 mb-6">
                        This panel requires <code className="text-amber-400 bg-gray-800 px-1.5 py-0.5 rounded text-sm">super_admin</code> role.
                    </p>
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-gray-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Admin
                    </Link>
                </div>
            </div>
        );
    }

    return <GodModeShell>{children}</GodModeShell>;
}
