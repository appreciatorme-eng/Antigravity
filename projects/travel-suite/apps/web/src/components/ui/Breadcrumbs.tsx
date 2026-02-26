"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ className }: { className?: string }) {
    const pathname = usePathname();
    if (!pathname || pathname === "/") return null;

    const paths = pathname.split("/").filter(Boolean);
    if (paths.length <= 1) return null; // Only show on nested pages

    return (
        <nav className={cn("flex items-center px-4 py-2 mt-2 mb-6 w-max rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-slate-200/50 dark:border-slate-800/50 shadow-sm", className)}>
            <Link href="/" className="hover:text-primary transition-colors flex items-center p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <Home className="w-4 h-4 text-slate-400 group-hover:text-primary" />
            </Link>

            {paths.map((path, idx) => {
                const href = `/${paths.slice(0, idx + 1).join("/")}`;
                const isLast = idx === paths.length - 1;

                // Capitalize and remove hyphens
                const formattedPath = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

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
