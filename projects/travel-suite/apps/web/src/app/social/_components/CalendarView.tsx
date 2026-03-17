"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar as CalendarIcon, Clock, Instagram, Facebook, Linkedin, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import { format, parseISO, startOfDay } from "date-fns";
import "react-day-picker/dist/style.css";

interface ScheduledPost {
    id: string;
    platform: string;
    scheduled_for: string;
    status: string;
    post_id: string;
    social_posts: {
        id: string;
        template_id: string;
        template_data: Record<string, unknown> | null;
        caption_instagram: string | null;
        rendered_image_url: string | null;
    };
}

type LucideIconComponent = React.ComponentType<{ className?: string }>;

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: LucideIconComponent; gradient: string }> = {
    instagram: {
        label: "Instagram",
        color: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300",
        icon: Instagram,
        gradient: "from-pink-500 to-rose-500",
    },
    facebook: {
        label: "Facebook",
        color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
        icon: Facebook,
        gradient: "from-blue-600 to-indigo-600",
    },
    linkedin: {
        label: "LinkedIn",
        color: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300",
        icon: Linkedin,
        gradient: "from-sky-500 to-blue-600",
    },
};

export const CalendarView = () => {
    const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const fetchScheduled = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/social/calendar");
            const data = await res.json();
            setScheduled(data.scheduled || []);
        } catch {
            toast.error("Failed to load scheduled posts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScheduled();
    }, [fetchScheduled]);

    const postsByDate = useMemo(() => {
        const grouped = new Map<string, ScheduledPost[]>();
        scheduled.forEach(post => {
            const dateKey = format(parseISO(post.scheduled_for), "yyyy-MM-dd");
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey)!.push(post);
        });
        return grouped;
    }, [scheduled]);

    const datesWithPosts = useMemo(() => {
        return Array.from(postsByDate.keys()).map(dateStr => parseISO(dateStr));
    }, [postsByDate]);

    const selectedDatePosts = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = format(startOfDay(selectedDate), "yyyy-MM-dd");
        return postsByDate.get(dateKey) || [];
    }, [selectedDate, postsByDate]);

    const modifiers = {
        hasPost: datesWithPosts,
    };

    const modifiersStyles = {
        hasPost: {
            fontWeight: "bold",
            backgroundColor: "rgb(99 102 241 / 0.1)",
            color: "rgb(99 102 241)",
            borderRadius: "0.5rem",
        },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <CalendarIcon className="w-6 h-6 text-indigo-500" /> Scheduled Posts
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        {scheduled.length} post{scheduled.length !== 1 ? "s" : ""} scheduled
                    </p>
                </div>
                <Button variant="outline" onClick={fetchScheduled} className="gap-2 self-start sm:self-auto">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                </div>
            ) : scheduled.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarIcon className="w-9 h-9 text-indigo-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-200">No scheduled posts</p>
                    <p className="text-slate-400 mt-2 max-w-xs mx-auto font-medium">
                        Schedule a post from Marketing Studio to see it here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            modifiers={modifiers}
                            modifiersStyles={modifiersStyles}
                            fromDate={new Date()}
                            className="rdp-custom"
                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center",
                                caption_label: "text-sm font-bold text-slate-700 dark:text-slate-200",
                                nav: "space-x-1 flex items-center",
                                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
                                row: "flex w-full mt-2",
                                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-100 dark:[&:has([aria-selected])]:bg-slate-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors",
                                day_selected: "bg-indigo-500 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-500 focus:text-white",
                                day_today: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold",
                                day_outside: "text-slate-400 opacity-50",
                                day_disabled: "text-slate-400 opacity-50",
                                day_hidden: "invisible",
                            }}
                        />
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span className="inline-block w-3 h-3 rounded bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700" />
                                Dates with scheduled posts
                            </p>
                        </div>
                    </div>

                    {/* Selected Date Posts */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        {selectedDate ? (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
                                    {format(selectedDate, "MMMM d, yyyy")}
                                </h3>
                                {selectedDatePosts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            No posts scheduled for this date
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                        {selectedDatePosts.map((post, i) => {
                                            const platformConfig = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.instagram;
                                            const PlatformIcon = platformConfig.icon;
                                            const scheduledTime = format(parseISO(post.scheduled_for), "h:mm a");

                                            return (
                                                <motion.div
                                                    key={post.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group"
                                                >
                                                    <div className="flex gap-3">
                                                        {/* Thumbnail */}
                                                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 overflow-hidden flex-shrink-0">
                                                            {post.social_posts.rendered_image_url ? (
                                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                                <img
                                                                    src={post.social_posts.rendered_image_url}
                                                                    alt="Post preview"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <FileText className="w-6 h-6 text-slate-400" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                                                                    {(post.social_posts.template_data?.destination as string) || "Untitled Post"}
                                                                </p>
                                                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${platformConfig.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                                                    <PlatformIcon className="w-4 h-4 text-white" />
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>{scheduledTime}</span>
                                                            </div>

                                                            {post.social_posts.caption_instagram && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                                                                    {post.social_posts.caption_instagram}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Select a date to view scheduled posts
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
