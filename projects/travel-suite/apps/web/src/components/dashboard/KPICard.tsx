"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";

interface KPICardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string;
    bg?: string;
    loading?: boolean;
}

export function KPICard({
    label,
    value,
    icon: Icon,
    trend,
    trendUp = true,
    color = "text-primary",
    bg = "bg-primary/10",
    loading = false
}: KPICardProps) {
    return (
        <GlassCard
            padding="lg"
            className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500", bg)}>
                        <Icon className={cn("w-6 h-6", color)} />
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                            trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        )}>
                            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {trend}
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter"
                    >
                        {loading ? "..." : value}
                    </motion.h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
                </div>
            </div>
            {/* Decorative background element */}
            <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-20", bg)} />
        </GlassCard>
    );
}
