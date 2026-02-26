"use client";

import { usePathname } from "next/navigation";
import NavHeader from "./NavHeader";

export function ClientHeader() {
    const pathname = usePathname();
    const isAdminPath = pathname?.startsWith("/admin");
    const isTripPath = pathname?.startsWith("/trips");
    const isAuthPath = pathname === "/auth";

    // Routes that should use the new premium shell (Sidebar/TopBar)
    // These routes will handle their own layout.
    const useNewShell = isAdminPath || isTripPath;

    if (useNewShell || isAuthPath) {
        return null;
    }

    return <NavHeader />;
}
