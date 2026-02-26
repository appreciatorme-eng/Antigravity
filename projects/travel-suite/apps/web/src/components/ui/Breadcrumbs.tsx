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
        <nav className={cn("flex items-center text-sm text-slate-500 mb-6", className)}>
            <Link href="/" className="hover:text-primary transition-colors flex items-center">
                <Home className="w-4 h-4" />
            </Link>

            {paths.map((path, idx) => {
                const href = `/${paths.slice(0, idx + 1).join("/")}`;
                const isLast = idx === paths.length - 1;

                // Capitalize and remove hyphens
                const formattedPath = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

                return (
                    <div key={path} className="flex items-center">
                        <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
                        {isLast ? (
                            <span className="text-slate-900 dark:text-slate-100 font-medium">{formattedPath}</span>
                        ) : (
                            <Link href={href} className="hover:text-primary transition-colors">
                                {formattedPath}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
