"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Command, HelpCircle } from "lucide-react";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useIsFetching } from "@tanstack/react-query";

// Mock WhatsApp unread count — replace with real Zustand store value later
const MOCK_WHATSAPP_UNREAD = 3;

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

                    {/* Notification Bell with WhatsApp unread badge */}
                    <button className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all relative">
                        <Bell className="w-5 h-5" />
                        {/* Red dot for general notifications */}
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </button>

                    {/* WhatsApp unread badge (standalone pill next to bell) */}
                    {MOCK_WHATSAPP_UNREAD > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#25D366]/15 border border-[#25D366]/30">
                            {/* WhatsApp icon as simple SVG to avoid extra dependency */}
                            <svg
                                viewBox="0 0 24 24"
                                className="w-3.5 h-3.5 fill-[#25D366]"
                                aria-label="WhatsApp"
                            >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span className="text-[11px] font-bold text-[#25D366]">
                                {MOCK_WHATSAPP_UNREAD}
                            </span>
                        </div>
                    )}

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
