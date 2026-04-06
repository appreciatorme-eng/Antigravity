"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDemoMode } from "@/lib/demo/demo-mode-context";
import { Search, Command, HelpCircle, X } from "lucide-react";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import DemoModeToggle from "@/components/demo/DemoModeToggle";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { GlobalSearchResults } from "@/components/layout/GlobalSearchResults";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { cn } from "@/lib/utils";
import { useIsFetching } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

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
            setTime(ist.replace(/\s?(am|pm)/i, (m) => " " + m.trim().toUpperCase()));
        };

        fmt();
        const id = setInterval(fmt, 30_000);
        return () => clearInterval(id);
    }, []);

    return time;
}

interface TopBarProps {
    className?: string;
}

export default function TopBar({ className }: TopBarProps) {
    const [searchFocused, setSearchFocused] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const mobileInputRef = useRef<HTMLInputElement>(null);
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const desktopContainerRef = useRef<HTMLDivElement>(null);
    const isFetching = useIsFetching();
    const istTime = useISTClock();
    const search = useGlobalSearch();
    const { isDemoMode } = useDemoMode();
    const showDesktopResults = searchFocused && search.query.trim().length > 0;

    // Focus mobile search input when overlay opens
    useEffect(() => {
        if (mobileSearchOpen) {
            // Small delay to let the animation start
            const t = setTimeout(() => mobileInputRef.current?.focus(), 100);
            return () => clearTimeout(t);
        }
    }, [mobileSearchOpen]);

    const closeMobileSearch = useCallback(() => {
        setMobileSearchOpen(false);
        search.reset();
    }, [search.reset]);

    // Close mobile search on ESC
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") {
            closeMobileSearch();
            if (desktopInputRef.current) {
                desktopInputRef.current.blur();
            }
        }
    }, [closeMobileSearch]);
    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Click outside to close desktop dropdown
    useEffect(() => {
        if (!showDesktopResults) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                desktopContainerRef.current &&
                !desktopContainerRef.current.contains(e.target as Node)
            ) {
                setSearchFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showDesktopResults]);

    return (
        <>
            <header
                className={cn(
                    "h-12 md:h-16 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-3 md:px-6",
                    className
                )}
            >
                <div className="h-full flex items-center justify-between gap-2 md:gap-4">
                    {/* ── Desktop search bar (hidden on mobile) ── */}
                    <div ref={desktopContainerRef} className="hidden md:flex flex-1 max-w-xl relative">
                        <div
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-text group bg-gray-50/50 dark:bg-slate-800/50 w-full",
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
                                ref={desktopInputRef}
                                type="text"
                                value={search.query}
                                onChange={(e) => search.setQuery(e.target.value)}
                                placeholder="Search PNR, Client, Itinerary (⌘K)..."
                                onFocus={() => setSearchFocused(true)}
                                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 dark:text-slate-200"
                            />
                            {search.query && (
                                <button
                                    onClick={() => {
                                        search.reset();
                                        desktopInputRef.current?.focus();
                                    }}
                                    className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                                <Command className="w-2.5 h-2.5" />
                                <span>K</span>
                            </div>
                        </div>

                        {/* Desktop search results dropdown */}
                        {showDesktopResults && (
                            <div
                                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl max-h-[60vh] overflow-y-auto z-50"
                            >
                                <GlobalSearchResults
                                    query={search.query}
                                    results={search.results}
                                    isLoading={search.isLoading}
                                    error={search.error}
                                    onSelect={() => {
                                        setSearchFocused(false);
                                        search.reset();
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* ── Mobile search button (visible on mobile only) ── */}
                    <button
                        onClick={() => setMobileSearchOpen(true)}
                        className="md:hidden flex items-center gap-2 flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 text-gray-400 text-sm"
                    >
                        <Search className="w-4 h-4 shrink-0" />
                        <span className="truncate">Search...</span>
                    </button>

                    {/* ── Actions ── */}
                    <div className="flex items-center gap-1 md:gap-2">
                        {/* Demo Mode Toggle — always visible when demo is ON (escape hatch), desktop-only otherwise */}
                        <div className={isDemoMode ? "block" : "hidden md:block"}>
                            <DemoModeToggle />
                        </div>

                        <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-slate-800 mx-0.5" />

                        {/* Live Data Pulse — desktop only */}
                        <div
                            className="hidden md:flex items-center gap-1.5 px-2 py-1 mr-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition-opacity duration-300"
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

                        {/* IST Clock — desktop only */}
                        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                            <span className="text-base leading-none" role="img" aria-label="India flag">
                                🇮🇳
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                {istTime}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                                IST
                            </span>
                        </div>

                        <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-slate-800 mx-1" />

                        {/* Notification Bell — visible on ALL viewports */}
                        <NotificationBell />

                        {/* Theme toggle — desktop only */}
                        <div className="hidden md:block">
                            <ThemeToggleButton />
                        </div>

                        {/* Help — desktop only */}
                        <button className="hidden md:block p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Mobile search overlay ── */}
            <AnimatePresence>
                {mobileSearchOpen && (
                    <motion.div
                        key="mobile-search-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="md:hidden fixed inset-0 z-[60] bg-white dark:bg-slate-900 flex flex-col"
                    >
                        {/* Search header */}
                        <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 dark:border-slate-800">
                            <Search className="w-5 h-5 text-gray-400 shrink-0" />
                            <input
                                ref={mobileInputRef}
                                type="text"
                                value={search.query}
                                onChange={(e) => search.setQuery(e.target.value)}
                                placeholder="Search PNR, Client, Itinerary..."
                                className="flex-1 bg-transparent border-none outline-none text-base text-slate-900 dark:text-slate-100 placeholder:text-gray-400"
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") closeMobileSearch();
                                }}
                            />
                            <button
                                onClick={closeMobileSearch}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"
                                aria-label="Close search"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search results area */}
                        <div className="flex-1 overflow-y-auto">
                            <GlobalSearchResults
                                query={search.query}
                                results={search.results}
                                isLoading={search.isLoading}
                                error={search.error}
                                onSelect={closeMobileSearch}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
