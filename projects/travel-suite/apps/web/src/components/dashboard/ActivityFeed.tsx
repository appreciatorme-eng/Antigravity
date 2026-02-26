"use client";

import Link from "next/link";
import { ChevronRight, MapPin, Bell } from "lucide-react";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { cn } from "@/lib/utils";

interface ActivityItem {
    id: string;
    type: "trip" | "notification" | "inquiry";
    title: string;
    description: string;
    timestamp: string;
    status: string;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    loading?: boolean;
}

export function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Recent Activity</h3>
                <Link href="/trips" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                    ))
                ) : activities.length > 0 ? (
                    activities.map((activity) => (
                        <ActivityRow key={activity.id} activity={activity} />
                    ))
                ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-slate-400 font-medium">No recent activity.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
    const isTrip = activity.type === "trip";
    const isInquiry = activity.type === "inquiry";

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 hover:border-primary/30 transition-all group">
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                isTrip ? "bg-primary/5 border-primary/20 text-primary" :
                    isInquiry ? "bg-amber-500/5 border-amber-500/20 text-amber-500" :
                        "bg-blue-500/5 border-blue-500/20 text-blue-500"
            )}>
                {isTrip ? <MapPin className="w-5 h-5" /> :
                    isInquiry ? <Bell className="w-5 h-5 animate-pulse" /> :
                        <Bell className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{activity.title}</h4>
                    <GlassBadge variant={activity.status === "active" || activity.status === "sent" || activity.status === "new" ? "success" : "secondary"} className="text-[8px] px-1.5 py-0">
                        {activity.status}
                    </GlassBadge>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">{activity.description}</p>
            </div>

            <div className="text-right shrink-0">
                <div className="text-[10px] font-bold text-slate-400 mb-1">
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <Link href={isTrip ? `/trips/${activity.id}` : isInquiry ? "/marketplace" : "#"}>
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Details</button>
                </Link>
            </div>
        </div>
    );
}
