"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import DemoModeBanner from "@/components/demo/DemoModeBanner";
import DemoTour from "@/components/demo/DemoTour";
import WelcomeModal from "@/components/demo/WelcomeModal";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
    children: ReactNode;
    className?: string;
}

export default function AdminLayout({ children, className }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Navigational Sidebar — hidden on mobile */}
            <Sidebar className="hidden md:flex shrink-0" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <DemoModeBanner />

                <main id="main-content" className={cn(
                    "flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-500",
                    className
                )}>
                    {children}
                </main>

                {/* Mobile bottom navigation */}
                <MobileNav />
            </div>

            {/* Demo onboarding overlays */}
            <DemoTour />
            <WelcomeModal />
        </div>
    );
}
