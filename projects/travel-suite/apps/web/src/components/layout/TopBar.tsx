"use client";

import { useState } from "react";
import { Search, Bell, Command, HelpCircle, Plus, Activity } from "lucide-react";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useIsFetching } from "@tanstack/react-query";

interface TopBarProps {
    className?: string;
}

export default function TopBar({ className }: TopBarProps) {
    const [searchFocused, setSearchFocused] = useState(false);
    const isFetching = useIsFetching();

    return (
        <header className={cn(
            "h-16 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6",
            className
        )}>
            <div className="h-full flex items-center justify-between gap-4">
                {/* Search / Command Palette Trigger */}
                <div className="flex-1 max-w-xl">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-text group bg-gray-50/50 dark:bg-slate-800/50",
                        searchFocused
                            ? "border-primary ring-2 ring-primary/20 bg-white dark:bg-slate-900"
                            : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                    )}>
                        <Search className={cn(
                            "w-4 h-4 transition-colors",
                            searchFocused ? "text-primary" : "text-gray-400"
                        )} />
                        <input
                            type="text"
                            placeholder="Search everything..."
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
                    {/* Live Data Pulse */}
                    <div className="flex items-center gap-1.5 px-2 py-1 mr-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition-opacity duration-300" style={{ opacity: isFetching ? 1 : 0.4 }}>
                        <div className={cn("w-2 h-2 rounded-full", isFetching ? "bg-primary animate-pulse" : "bg-slate-400")} />
                        <span className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Live</span>
                    </div>

                    <button className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    </button>

                    <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 text-sm font-medium">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Project</span>
                    </button>

                    <div className="w-px h-6 bg-gray-200 dark:bg-slate-800 mx-1"></div>

                    <ThemeToggleButton />

                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
