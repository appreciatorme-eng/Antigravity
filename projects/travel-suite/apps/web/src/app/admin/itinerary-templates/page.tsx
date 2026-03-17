"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
    Search,
    Filter,
    MapPin,
    Calendar,
    Star,
    TrendingUp,
    Library,
    Sparkles,
    ArrowUpRight,
    LayoutGrid,
    List as ListIcon,
    Clock,
    DollarSign,
    Users
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassListSkeleton } from "@/components/glass/GlassSkeleton";
import { cn } from "@/lib/utils";
import { useDemoFetch } from "@/lib/demo/use-demo-fetch";

interface Template {
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
}

const THEME_OPTIONS = [
    { value: "all", label: "All Themes" },
    { value: "adventure", label: "Adventure" },
    { value: "cultural", label: "Cultural" },
    { value: "honeymoon", label: "Honeymoon" },
    { value: "family", label: "Family" },
    { value: "general", label: "General" },
];

const BUDGET_OPTIONS = [
    { value: "all", label: "All Budgets" },
    { value: "budget", label: "Budget" },
    { value: "medium", label: "Medium" },
    { value: "luxury", label: "Luxury" },
];

const DURATION_OPTIONS = [
    { value: "all", label: "Any Duration" },
    { value: "3", label: "3 Days" },
    { value: "4", label: "4 Days" },
    { value: "5", label: "5 Days" },
    { value: "7", label: "7 Days" },
    { value: "10", label: "10 Days" },
    { value: "14", label: "14+ Days" },
];

export default function ItineraryTemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [destinationFilter, setDestinationFilter] = useState("");
    const [themeFilter, setThemeFilter] = useState<string>("all");
    const [budgetFilter, setBudgetFilter] = useState<string>("all");
    const [durationFilter, setDurationFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const supabase = createClient();
    const demoFetch = useDemoFetch();

    const fetchTemplates = useCallback(async () => {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();

        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (destinationFilter) params.set("destination", destinationFilter);
        if (themeFilter && themeFilter !== "all") params.set("theme", themeFilter);
        if (budgetFilter && budgetFilter !== "all") params.set("budget_range", budgetFilter);
        if (durationFilter && durationFilter !== "all") params.set("duration_days", durationFilter);

        const response = await demoFetch(`/api/admin/templates?${params.toString()}`, {
            headers: {
                "Authorization": `Bearer ${session?.access_token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Failed to fetch templates:", error);
            setLoading(false);
            return;
        }

        const payload = await response.json();
        setTemplates(payload.templates || []);
        setLoading(false);
    }, [supabase, demoFetch, searchQuery, destinationFilter, themeFilter, budgetFilter, durationFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchTemplates();
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchTemplates]);

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

    const stats = [
        {
            label: "Total Templates",
            value: templates.length,
            icon: Library,
            color: "text-blue-600",
            bg: "bg-blue-100/50",
            trend: "Curated"
        },
        {
            label: "Most Popular",
            value: templates.length > 0 ? templates[0]?.destination || "-" : "-",
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-100/50",
            trend: "Trending"
        },
        {
            label: "Avg. Rating",
            value: templates.length > 0
                ? (templates.reduce((sum, t) => sum + t.rating_avg, 0) / templates.length).toFixed(1)
                : "0.0",
            icon: Star,
            color: "text-amber-600",
            bg: "bg-amber-100/50",
            trend: "Quality"
        },
        {
            label: "Total Usage",
            value: templates.reduce((sum, t) => sum + t.usage_count, 0),
            icon: Users,
            color: "text-violet-600",
            bg: "bg-violet-100/50",
            trend: "Community"
        },
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Template Library
                        </div>
                    </div>
                    <h1 className="text-5xl font-serif text-secondary dark:text-white tracking-tight leading-none">
                        Discover Templates
                    </h1>
                    <p className="text-text-muted text-lg font-medium max-w-2xl">
                        Browse field-tested itineraries from experienced operators and kickstart your next adventure.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <GlassCard key={stat.label} padding="lg" className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                <p className="text-4xl font-black text-secondary dark:text-white tracking-tighter tabular-nums">
                                    {loading ? "---" : stat.value}
                                </p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className={cn("text-[10px] font-bold uppercase tracking-tight", stat.color)}>{stat.trend}</span>
                                </div>
                            </div>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
                <GlassCard padding="none" className="w-full overflow-hidden border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center px-6 py-1">
                        <Search className="w-5 h-5 text-text-muted mr-4" />
                        <input
                            type="text"
                            placeholder="Search templates by title, destination, or description..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-secondary dark:text-white placeholder:text-text-muted/50 text-sm h-12 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </GlassCard>

                <div className="flex flex-col lg:flex-row gap-3 items-center">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 h-14 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm w-full lg:w-auto min-w-[200px]">
                        <MapPin className="w-4 h-4 text-primary" />
                        <input
                            type="text"
                            placeholder="Destination"
                            className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-secondary dark:text-white flex-1"
                            value={destinationFilter}
                            onChange={(e) => setDestinationFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 h-14 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm w-full lg:w-auto min-w-[180px]">
                        <Filter className="w-4 h-4 text-primary" />
                        <select
                            value={themeFilter}
                            onChange={(e) => setThemeFilter(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-secondary dark:text-white flex-1 cursor-pointer"
                        >
                            {THEME_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 h-14 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm w-full lg:w-auto min-w-[180px]">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <select
                            value={budgetFilter}
                            onChange={(e) => setBudgetFilter(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-secondary dark:text-white flex-1 cursor-pointer"
                        >
                            {BUDGET_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 h-14 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm w-full lg:w-auto min-w-[180px]">
                        <Clock className="w-4 h-4 text-primary" />
                        <select
                            value={durationFilter}
                            onChange={(e) => setDurationFilter(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-secondary dark:text-white flex-1 cursor-pointer"
                        >
                            {DURATION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-gray-100 dark:border-slate-800 ml-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2.5 rounded-lg transition-all",
                                viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-text-muted"
                            )}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2.5 rounded-lg transition-all",
                                viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-text-muted"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Template List */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    <GlassListSkeleton items={6} />
                </div>
            ) : templates.length === 0 ? (
                <GlassCard padding="none" className="overflow-hidden border-gray-100 dark:border-slate-800 bg-gray-50/30">
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-slate-700 shadow-2xl shadow-gray-200/50">
                            <Library className="w-10 h-10 text-gray-200 animate-pulse" />
                        </div>
                        <h3 className="text-3xl font-serif text-secondary dark:text-white tracking-tight">No Templates Found</h3>
                        <p className="text-text-muted mt-4 max-w-sm mx-auto font-medium">
                            No templates match your current filters. Try adjusting your search criteria.
                        </p>
                    </div>
                </GlassCard>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => {
                        const budgetStyles = getBudgetStyles(template.budget_range);
                        const BudgetIcon = budgetStyles.icon;

                        return (
                            <Link key={template.id} href={`/admin/itinerary-templates/${template.id}`} className="group">
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
                    })}
                </div>
            ) : (
                <GlassCard padding="none" className="overflow-hidden border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1">
                        {templates.map((template) => {
                            const budgetStyles = getBudgetStyles(template.budget_range);
                            const BudgetIcon = budgetStyles.icon;

                            return (
                                <Link
                                    key={template.id}
                                    href={`/admin/itinerary-templates/${template.id}`}
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

                                    {/* Hover interaction strip */}
                                    <div className="absolute left-0 top-0 w-1.5 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                                </Link>
                            );
                        })}
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
