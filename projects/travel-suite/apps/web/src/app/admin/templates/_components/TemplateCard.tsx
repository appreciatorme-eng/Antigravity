"use client";

import Link from "next/link";
import {
    MapPin,
    Calendar,
    Star,
    Users,
    DollarSign,
    Sparkles,
    ArrowUpRight
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
    template: {
        id: string;
        title: string;
        destination: string;
        duration_days: number;
        budget_range: string;
        theme: string;
        description?: string | null;
        usage_count: number;
        rating_avg: number;
        rating_count: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
    };
    viewMode?: 'grid' | 'list';
    basePath?: string;
}

const getBudgetStyles = (budgetRange: string) => {
    switch (budgetRange.toLowerCase()) {
        case "budget":
            return {
                color: "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
                icon: DollarSign,
                label: "Budget"
            };
        case "medium":
            return {
                color: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                icon: DollarSign,
                label: "Medium"
            };
        case "luxury":
            return {
                color: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
                icon: Sparkles,
                label: "Luxury"
            };
        default:
            return {
                color: "bg-gray-50 text-gray-500 border-gray-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800",
                icon: DollarSign,
                label: "Standard"
            };
    }
};

const getThemeStyles = (theme: string) => {
    switch (theme.toLowerCase()) {
        case "adventure":
            return "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400";
        case "cultural":
            return "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400";
        case "honeymoon":
            return "bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/20 dark:text-pink-400";
        case "family":
            return "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400";
        default:
            return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-900/20 dark:text-gray-400";
    }
};

export function TemplateCard({ template, viewMode = 'grid', basePath = '/admin/itinerary-templates' }: TemplateCardProps) {
    const budgetStyles = getBudgetStyles(template.budget_range);
    const BudgetIcon = budgetStyles.icon;

    if (viewMode === 'list') {
        return (
            <Link
                href={`${basePath}/${template.id}`}
                className="group flex items-center justify-between px-8 py-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 border-b border-gray-50 dark:border-slate-800 last:border-none relative overflow-hidden"
            >
                <div className="flex items-center gap-8 relative z-10 w-full max-w-3xl">
                    <div className="w-16 h-16 shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/5">
                        <MapPin className="h-8 w-8 text-primary group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-xl font-bold text-secondary dark:text-white truncate tracking-tight">
                                {template.title}
                            </h3>
                            <GlassBadge className={cn("text-[8px] font-black uppercase tracking-widest h-5 px-1.5", getThemeStyles(template.theme))}>
                                {template.theme}
                            </GlassBadge>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <div className="flex items-center gap-2 text-text-muted">
                                <MapPin className="h-4 w-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{template.destination}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-muted">
                                <Calendar className="h-4 w-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{template.duration_days} Days</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-[11px] font-black uppercase tracking-widest">
                                    {template.rating_avg > 0 ? template.rating_avg.toFixed(1) : "New"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-text-muted">
                                <Users className="h-4 w-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{template.usage_count} Uses</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 relative z-10">
                    <div className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                        budgetStyles.color
                    )}>
                        <BudgetIcon className="w-4 h-4" />
                        <span>{budgetStyles.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-700 flex items-center justify-center transition-all group-hover:bg-secondary group-hover:text-white">
                            <ArrowUpRight className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="absolute left-0 top-0 w-1.5 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            </Link>
        );
    }

    return (
        <Link href={`${basePath}/${template.id}`} className="group">
            <GlassCard padding="lg" className="h-full flex flex-col border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group-hover:-translate-y-2">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest",
                        budgetStyles.color
                    )}>
                        <BudgetIcon className="w-3 h-3" />
                        {budgetStyles.label}
                    </div>
                </div>

                <div className="flex-1">
                    <h3 className="text-xl font-bold text-secondary dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {template.title}
                    </h3>
                    <p className="text-sm text-text-muted mb-4 line-clamp-2">
                        {template.description || "Explore this curated itinerary template"}
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-text-muted">
                            <MapPin className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{template.destination}</span>
                        </div>
                        <div className="flex items-center gap-3 text-text-muted">
                            <Calendar className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{template.duration_days} Days</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <GlassBadge className={cn("text-[8px] font-black uppercase tracking-widest h-6 px-2", getThemeStyles(template.theme))}>
                                {template.theme}
                            </GlassBadge>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold text-secondary dark:text-white">
                                {template.rating_avg > 0 ? template.rating_avg.toFixed(1) : "New"}
                            </span>
                            {template.rating_count > 0 && (
                                <span className="text-[9px] text-text-muted">({template.rating_count})</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-text-muted" />
                            <span className="text-xs font-bold text-secondary dark:text-white">{template.usage_count}</span>
                        </div>
                    </div>
                    <div className="text-primary group-hover:translate-x-1 transition-transform">
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                </div>
            </GlassCard>
        </Link>
    );
}
