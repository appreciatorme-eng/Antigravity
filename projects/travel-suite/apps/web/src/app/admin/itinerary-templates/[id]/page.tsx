"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    MapPin,
    Calendar,
    Star,
    Users,
    DollarSign,
    Sparkles,
    ArrowLeft,
    GitBranch,
    Clock,
    Loader2,
    ChevronRight
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassListSkeleton } from "@/components/glass/GlassSkeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useDemoFetch } from "@/lib/demo/use-demo-fetch";

interface DayActivity {
    time?: string;
    location: string;
    description?: string;
    duration?: string;
}

interface DayPlan {
    day_number: number;
    title?: string;
    activities: DayActivity[];
}

interface Template {
    id: string;
    title: string;
    destination: string;
    duration_days: number;
    budget_range: string;
    theme: string;
    description?: string | null;
    template_data: {
        days?: DayPlan[];
    } | null;
    usage_count: number;
    rating_avg: number;
    rating_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
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

export default function TemplateDetailPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [forking, setForking] = useState(false);

    const { toast } = useToast();
    const supabase = createClient();
    const demoFetch = useDemoFetch();

    const fetchTemplate = useCallback(async () => {
        if (!templateId) return;

        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();

        const response = await demoFetch(`/api/admin/templates/${templateId}`, {
            headers: {
                "Authorization": `Bearer ${session?.access_token}`,
            },
        });

        if (!response.ok) {
            let error = { error: `HTTP ${response.status}` };
            try {
                error = await response.json();
            } catch {
                // Ignore parse error
            }
            toast({
                title: "Error loading template",
                description: error.error || "Failed to load template",
                variant: "error",
            });
            setLoading(false);
            return;
        }

        const payload = await response.json();
        setTemplate(payload.template);
        setLoading(false);
    }, [templateId, supabase.auth, demoFetch, toast]);

    useEffect(() => {
        fetchTemplate().catch(err => {
            console.error('Failed to fetch template:', err);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    const handleFork = async () => {
        if (!template) return;

        setForking(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const response = await demoFetch(`/api/admin/templates/${template.id}/fork`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                let error = { error: `HTTP ${response.status}` };
                try {
                    error = await response.json();
                } catch {
                    // Ignore parse error
                }
                toast({
                    title: "Fork failed",
                    description: error.error || "Failed to fork template",
                    variant: "error",
                });
                setForking(false);
                return;
            }

            const payload = await response.json();
            toast({
                title: "Template forked successfully",
                description: "Redirecting to your new trip...",
                variant: "success",
            });

            setTimeout(() => {
                router.push(`/admin/trips/${payload.trip.id}`);
            }, 1000);
        } catch (error) {
            toast({
                title: "Fork failed",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "error",
            });
            setForking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
                <div className="max-w-6xl mx-auto">
                    <GlassListSkeleton />
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
                <div className="max-w-6xl mx-auto">
                    <GlassCard padding="lg">
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-bold text-secondary dark:text-white mb-2">
                                Template not found
                            </h2>
                            <p className="text-text-muted mb-6">
                                The template you&apos;re looking for doesn&apos;t exist or has been removed.
                            </p>
                            <Link href="/admin/itinerary-templates">
                                <GlassButton variant="primary">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Templates
                                </GlassButton>
                            </Link>
                        </div>
                    </GlassCard>
                </div>
            </div>
        );
    }

    const budgetStyles = getBudgetStyles(template.budget_range);
    const BudgetIcon = budgetStyles.icon;
    const days = template.template_data?.days || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/admin/itinerary-templates">
                        <GlassButton variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Templates
                        </GlassButton>
                    </Link>
                </div>

                <GlassCard padding="lg" className="space-y-6">
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-secondary dark:text-white leading-tight">
                                        {template.title}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <GlassBadge className={cn("text-[8px] font-black uppercase tracking-widest h-6 px-2", getThemeStyles(template.theme))}>
                                            {template.theme}
                                        </GlassBadge>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest",
                                            budgetStyles.color
                                        )}>
                                            <BudgetIcon className="w-3 h-3" />
                                            {budgetStyles.label}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {template.description && (
                                <p className="text-base text-text-muted leading-relaxed mb-6">
                                    {template.description}
                                </p>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-text-muted">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Destination</span>
                                    </div>
                                    <p className="text-base font-bold text-secondary dark:text-white">
                                        {template.destination}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-text-muted">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
                                    </div>
                                    <p className="text-base font-bold text-secondary dark:text-white">
                                        {template.duration_days} Days
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-text-muted">
                                        <Star className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Rating</span>
                                    </div>
                                    <p className="text-base font-bold text-secondary dark:text-white">
                                        {template.rating_avg > 0 ? `${template.rating_avg.toFixed(1)} / 5.0` : "New Template"}
                                        {template.rating_count > 0 && (
                                            <span className="text-xs text-text-muted ml-1">({template.rating_count})</span>
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-text-muted">
                                        <Users className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Usage</span>
                                    </div>
                                    <p className="text-base font-bold text-secondary dark:text-white">
                                        {template.usage_count} {template.usage_count === 1 ? 'Fork' : 'Forks'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <GlassButton
                                variant="primary"
                                size="lg"
                                onClick={handleFork}
                                disabled={forking}
                                className="whitespace-nowrap"
                            >
                                {forking ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Forking...
                                    </>
                                ) : (
                                    <>
                                        <GitBranch className="w-5 h-5 mr-2" />
                                        Fork Template
                                    </>
                                )}
                            </GlassButton>
                        </div>
                    </div>
                </GlassCard>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-secondary dark:text-white">Daily Itinerary</h2>
                    </div>

                    {days.length === 0 ? (
                        <GlassCard padding="lg">
                            <div className="text-center py-8">
                                <p className="text-text-muted">No daily itinerary available for this template.</p>
                            </div>
                        </GlassCard>
                    ) : (
                        <div className="space-y-4">
                            {days.map((day) => (
                                <GlassCard key={day.day_number} padding="lg" className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-primary">
                                                {day.day_number}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-secondary dark:text-white">
                                            {day.title || `Day ${day.day_number}`}
                                        </h3>
                                    </div>

                                    <div className="space-y-3 ml-13">
                                        {day.activities && day.activities.length > 0 ? (
                                            day.activities.map((activity, idx) => (
                                                <div key={idx} className="flex items-start gap-3 group">
                                                    <div className="mt-1">
                                                        <ChevronRight className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            {activity.time && (
                                                                <div className="flex items-center gap-1.5 text-text-muted">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span className="text-xs font-bold">{activity.time}</span>
                                                                </div>
                                                            )}
                                                            <h4 className="text-sm font-bold text-secondary dark:text-white">
                                                                {activity.location}
                                                            </h4>
                                                            {activity.duration && (
                                                                <span className="text-xs text-text-muted">
                                                                    ({activity.duration})
                                                                </span>
                                                            )}
                                                        </div>
                                                        {activity.description && (
                                                            <p className="text-sm text-text-muted leading-relaxed">
                                                                {activity.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-text-muted">No activities listed for this day.</p>
                                        )}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-slate-800">
                    <p className="text-xs text-text-muted">
                        Last updated: {new Date(template.updated_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                    <GlassButton
                        variant="primary"
                        onClick={handleFork}
                        disabled={forking}
                    >
                        {forking ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Forking...
                            </>
                        ) : (
                            <>
                                <GitBranch className="w-4 h-4 mr-2" />
                                Fork This Template
                            </>
                        )}
                    </GlassButton>
                </div>
            </div>
        </div>
    );
}
