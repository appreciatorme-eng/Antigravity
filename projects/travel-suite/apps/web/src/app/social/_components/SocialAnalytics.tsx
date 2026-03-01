"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Facebook,
  Instagram,
  Megaphone,
  Share2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TrendDirection = "up" | "down";

interface SocialStats {
  totalPosts: number;
  publishedCount: number;
  scheduledCount: number;
  whatsappImages: number;
  platformBreakdown: {
    instagram: number;
    facebook: number;
  };
}

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend: TrendDirection;
  trendValue: string;
}

const DEFAULT_STATS: SocialStats = {
  totalPosts: 0,
  publishedCount: 0,
  scheduledCount: 0,
  whatsappImages: 0,
  platformBreakdown: { instagram: 0, facebook: 0 },
};

export const SocialAnalytics = () => {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<SocialStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data: posts } = await supabase.from("social_posts").select("status, source");
      const { data: queue } = await supabase
        .from("social_post_queue")
        .select("platform, status");
      const { count: whatsappCount } = await supabase
        .from("social_media_library")
        .select("*", { count: "exact", head: true })
        .eq("source", "whatsapp");

      const breakdown = { instagram: 0, facebook: 0 };
      queue?.forEach((item) => {
        if (item.platform === "instagram") breakdown.instagram += 1;
        if (item.platform === "facebook") breakdown.facebook += 1;
      });

      setStats({
        totalPosts: posts?.length || 0,
        publishedCount: queue?.filter((item) => item.status === "sent").length || 0,
        scheduledCount: queue?.filter((item) => item.status === "pending").length || 0,
        whatsappImages: whatsappCount || 0,
        platformBreakdown: breakdown,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: StatCardProps) => (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </CardTitle>
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Icon className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="mt-2 flex items-center gap-1">
          {trend === "up" ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          )}
          <span
            className={`text-xs font-bold ${trend === "up" ? "text-emerald-500" : "text-rose-500"}`}
          >
            {trendValue}
          </span>
          <span className="text-xs text-slate-400 font-medium ml-1">vs last month</span>
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20" />
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse mt-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  const totalPlatformPosts = stats.platformBreakdown.instagram + stats.platformBreakdown.facebook;
  const instagramPct =
    totalPlatformPosts > 0 ? (stats.platformBreakdown.instagram / totalPlatformPosts) * 100 : 0;
  const facebookPct =
    totalPlatformPosts > 0 ? (stats.platformBreakdown.facebook / totalPlatformPosts) * 100 : 0;

  return (
    <div className="space-y-8 mt-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <BarChart3 className="w-6 h-6 text-indigo-500" /> Marketing Analytics
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Track your content performance across social platforms.
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button className="px-4 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 rounded-md shadow-sm">
            30 Days
          </button>
          <button className="px-4 py-1.5 text-xs font-bold text-slate-500">90 Days</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon={Megaphone}
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Total Published"
          value={stats.publishedCount}
          icon={Share2}
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduledCount}
          icon={Calendar}
          trend="down"
          trendValue="-3%"
        />
        <StatCard
          title="WhatsApp Media"
          value={stats.whatsappImages}
          icon={Facebook}
          trend="up"
          trendValue="+24%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Platform Distribution</CardTitle>
            <CardDescription>Breakdown of posts by social network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 font-bold">
                  <Instagram className="w-4 h-4 text-pink-500" /> Instagram
                </span>
                <span className="font-bold">{stats.platformBreakdown.instagram} posts</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000"
                  style={{ width: `${instagramPct}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 font-bold">
                  <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                </span>
                <span className="font-bold">{stats.platformBreakdown.facebook} posts</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000"
                  style={{ width: `${facebookPct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Post Reach Trend</CardTitle>
            <CardDescription>Combined impressions across all channels</CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-end gap-3 pb-2">
            {[40, 65, 45, 80, 55, 90, 75, 60, 85, 95, 100].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-indigo-500/20 hover:bg-indigo-500 rounded-t-md transition-all duration-500 group relative"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {height * 123} views
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono italic">M{index + 1}</span>
              </div>
            ))}
          </CardContent>
          <div className="absolute top-0 right-0 p-4">
            <TrendingUp className="w-12 h-12 text-indigo-500/10" />
          </div>
        </Card>
      </div>
    </div>
  );
};
