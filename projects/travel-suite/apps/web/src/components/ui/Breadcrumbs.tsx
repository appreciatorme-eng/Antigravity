"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/** Routes that don't have their own page — redirect breadcrumb to a parent. */
const PATH_REDIRECTS: Record<string, string> = {
    "/dashboard": "/",
};

/** UUID v4 pattern — raw IDs are meaningless to users, replace with context-aware labels. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Map parent path segment → friendly label for UUID children. */
const ENTITY_LABELS: Record<string, string> = {
    clients: "Client Details",
    trips: "Trip Details",
    proposals: "Proposal Details",
    bookings: "Booking Details",
    drivers: "Driver Details",
    invoices: "Invoice Details",
};

export function Breadcrumbs({ className }: { className?: string }) {
    const pathname = usePathname();
    if (!pathname || pathname === "/") return null;

    // Dashboard sub-pages have their own "Back to Dashboard" link
    if (pathname.startsWith("/dashboard/")) return null;

    const paths = pathname.split("/").filter(Boolean);
    if (paths.length <= 1) return null; // Only show on nested pages

    return (
        <nav className={cn("flex items-center px-4 py-2 mt-2 mb-6 w-max rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-slate-200/50 dark:border-slate-800/50 shadow-sm", className)}>
            <Link href="/" className="hover:text-primary transition-colors flex items-center p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <Home className="w-4 h-4 text-slate-400 group-hover:text-primary" />
            </Link>

            {paths.map((path, idx) => {
                const rawHref = `/${paths.slice(0, idx + 1).join("/")}`;
                const href = PATH_REDIRECTS[rawHref] ?? rawHref;
                const isLast = idx === paths.length - 1;

                // Replace raw UUIDs with context-aware labels; capitalize others
                const parentSegment = idx > 0 ? paths[idx - 1] : "";
                const formattedPath = UUID_RE.test(path)
                    ? (ENTITY_LABELS[parentSegment] || "Details")
                    : path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

                return (
                    <div key={path} className="flex items-center">
                        <ChevronRight className="w-3.5 h-3.5 mx-1.5 opacity-40 text-slate-400" />
                        {isLast ? (
                            <span className="text-sm text-slate-900 dark:text-slate-100 font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 shadow-inner">
                                {formattedPath}
                            </span>
                        ) : (
                            <Link href={href} className="text-sm font-medium hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                {formattedPath}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
