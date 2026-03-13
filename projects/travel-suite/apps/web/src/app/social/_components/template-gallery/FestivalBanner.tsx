"use client";

import { Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FestivalInfo {
    readonly name: string;
    readonly date: string;
}

export interface FestivalBannerProps {
    readonly festivals: readonly FestivalInfo[];
    readonly searchQuery: string;
    readonly onFilterFestival: () => void;
}

function computeDaysLabel(festival: FestivalInfo): string {
    const days = Math.ceil(
        (new Date(festival.date).getTime() - Date.now()) / 86400000
    );
    return days > 0
        ? ` is in ${days} day${days !== 1 ? "s" : ""}`
        : " is today!";
}

export function FestivalBanner({
    festivals,
    searchQuery,
    onFilterFestival,
}: FestivalBannerProps) {
    if (festivals.length === 0 || searchQuery) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl cursor-pointer hover:border-amber-400 transition-colors group"
                onClick={onFilterFestival}
            >
                <span className="text-2xl shrink-0">{"\uD83C\uDF89"}</span>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-amber-800 dark:text-amber-300 text-sm truncate">
                        {festivals[0].name}
                        {computeDaysLabel(festivals[0])}
                        {festivals.length > 1 &&
                            ` (+${festivals.length - 1} more upcoming)`}
                    </p>
                    <p className="text-amber-600 dark:text-amber-400 text-xs font-medium mt-0.5">
                        {"Festival templates are ready \u2014 tap to filter \u2192"}
                    </p>
                </div>
                <Zap className="w-5 h-5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
            </motion.div>
        </AnimatePresence>
    );
}
