"use client";

import { useState, useEffect } from "react";
import { Search, Command, HelpCircle } from "lucide-react";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import DemoModeToggle from "@/components/demo/DemoModeToggle";
import { cn } from "@/lib/utils";
import { useIsFetching } from "@tanstack/react-query";

/** Returns the current time formatted in IST (Indian Standard Time) */
function useISTClock() {
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        const fmt = () => {
            const now = new Date();
            const ist = new Intl.DateTimeFormat("en-IN", {
                timeZone: "Asia/Kolkata",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }).format(now);
            // Normalise: "2:30 pm" → "2:30 PM"
            setTime(ist.replace(/\s?(am|pm)/i, (m) => " " + m.trim().toUpperCase()));
        };

        fmt();
        const id = setInterval(fmt, 30_000); // update every 30 s
        return () => clearInterval(id);
    }, []);

    return time;
}

interface TopBarProps {
    className?: string;
}

export default function TopBar({ className }: TopBarProps) {
    const [searchFocused, setSearchFocused] = useState(false);
    const isFetching = useIsFetching();
    const istTime = useISTClock();

    return (
        <header
            className={cn(
                "h-16 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6",
                className
            )}
        >
            <div className="h-full flex items-center justify-between gap-4">
                {/* Search / Command Palette Trigger */}
                <div className="flex-1 max-w-xl">
                    <div
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-text group bg-gray-50/50 dark:bg-slate-800/50",
                            searchFocused
                                ? "border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-900"
                                : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                        )}
                    >
                        <Search
                            className={cn(
                                "w-4 h-4 transition-colors",
                                searchFocused ? "text-primary" : "text-gray-400"
                            )}
                        />
                        <input
                            type="text"
                            placeholder="Search PNR, Client, Itinerary (⌘K)..."
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 dark:text-slate-200"
                        />
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                            <Command className="w-2.5 h-2.5" />
                            <span>K</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Demo Mode Toggle */}
                    <DemoModeToggle />

                    <div className="w-px h-6 bg-gray-200 dark:bg-slate-800 mx-0.5" />

                    {/* Live Data Pulse */}
                    <div
                        className="flex items-center gap-1.5 px-2 py-1 mr-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition-opacity duration-300"
                        style={{ opacity: isFetching ? 1 : 0.4 }}
                    >
                        <div
                            className={cn(
                                "w-2 h-2 rounded-full",
                                isFetching ? "bg-primary animate-pulse" : "bg-slate-400"
                            )}
                        />
                        <span className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                            Live
                        </span>
                    </div>

                    {/* IST Clock */}
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                        <span
                            className="text-base leading-none"
                            role="img"
                            aria-label="India flag"
                        >
                            🇮🇳
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                            {istTime}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                            IST
                        </span>
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-slate-800 mx-1" />

                    <ThemeToggleButton />

                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
