"use client";

import { ReactNode, useState, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import DemoModeBanner from "@/components/demo/DemoModeBanner";
import DemoTour from "@/components/demo/DemoTour";
import WelcomeModal from "@/components/demo/WelcomeModal";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
    children: ReactNode;
    className?: string;
}

export default function AdminLayout({ children, className }: AdminLayoutProps) {
    const [tourTrigger, setTourTrigger] = useState(false);
    const handleTourStart = useCallback(() => setTourTrigger(true), []);
    const handleTourStartHandled = useCallback(() => setTourTrigger(false), []);

    return (
        <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Navigational Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <DemoModeBanner onStartTour={handleTourStart} />

                <main className={cn(
                    "flex-1 p-6 md:p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-500",
                    className
                )}>
                    {children}
                </main>
            </div>

            {/* Demo onboarding overlays */}
            <DemoTour forceStart={tourTrigger} onForceStartHandled={handleTourStartHandled} />
            <WelcomeModal />
        </div>
    );
}
