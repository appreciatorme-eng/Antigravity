/**
 * Intelligent Dashboard - Enterprise Overview
 */

"use client";

import { useDashboardStats } from "@/lib/queries/dashboard";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { QuickQuoteModal } from "@/components/glass/QuickQuoteModal";
import {
  Car,
  Users,
  Bell,
  Plus,
  History,
  Zap,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Calculator,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import RevenueChart from "@/components/analytics/RevenueChart";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { InfrastructureHealth } from "@/components/dashboard/InfrastructureHealth";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalDrivers: number;
  totalClients: number;
  activeTrips: number;
  pendingNotifications: number;
  marketplaceViews?: number;
  marketplaceInquiries?: number;
  conversionRate?: string;
}

interface ActivityItem {
  id: string;
  type: "trip" | "notification" | "inquiry";
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const { data, isLoading: loading } = useDashboardStats();

  const stats = data?.stats || {
    totalDrivers: 0,
    totalClients: 0,
    activeTrips: 0,
    pendingNotifications: 0,
    marketplaceViews: 0,
    marketplaceInquiries: 0,
    conversionRate: "0.0",
  };
  const activities = data?.activities || [];
  const [health, setHealth] = useState<any>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/admin/health");
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch (e) {
        console.error("Health check failed");
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="space-y-10 pb-20">
      {/* Command Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">System Live</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Strategic <span className="text-primary">Overview</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Real-time operational intelligence and fleet telemetry.</p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton variant="outline" className="h-12 px-6" onClick={() => setQuoteOpen(true)}>
            <Calculator className="w-4 h-4 mr-2" />
            Quick Quote
          </GlassButton>
          <Link href="/trips">
            <GlassButton variant="primary" className="h-12 px-6 shadow-xl shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              New Deployment
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Strategic Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Mission Load" value={stats.activeTrips} icon={Zap} trend="+12%" color="text-emerald-500" bg="bg-emerald-500/10" loading={loading} />
        <KPICard label="Strategic Partners" value={stats.totalClients} icon={Users} trend="+3" color="text-blue-500" bg="bg-blue-500/10" loading={loading} />
        <KPICard label="Marketplace Intel" value={(stats.marketplaceViews || 0) + " / " + (stats.marketplaceInquiries || 0)} icon={Plus} trend={(stats.conversionRate || "0.0") + "% CR"} color="text-amber-500" bg="bg-amber-500/10" loading={loading} />
        <KPICard label="Signal Queue" value={stats.pendingNotifications} icon={Bell} trend="-5%" trendUp={false} color="text-rose-500" bg="bg-rose-500/10" loading={loading} />
      </div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2" padding="xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Financial Trajectory</h3>
              <p className="text-sm text-slate-500 font-medium">Revenue and mission conversion vs target</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 shadow-sm">Revenue</button>
              <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Volume</button>
            </div>
          </div>
          <div className="w-full aspect-[21/9]">
            <RevenueChart />
          </div>
        </GlassCard>

        <div className="space-y-6">
          <QuickActions />
          <InfrastructureHealth health={health} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} loading={loading} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Sub-System Telemetry</h3>
          </div>
          <GlassCard padding="lg" className="border-gray-100 divide-y divide-gray-100 dark:divide-slate-800">
            <TelemetryItem icon={ShieldCheck} label="Identity Filter" status="Active" color="text-emerald-500" />
            <TelemetryItem icon={MessageSquare} label="Signal Intercept" status="Operational" color="text-emerald-500" />
            <TelemetryItem icon={Zap} label="Edge Processing" status="Healthy" color="text-emerald-500" />
            <TelemetryItem icon={History} label="Audit Archiving" status="Syncing" color="text-blue-500" />
          </GlassCard>

          <GlassCard padding="none" className="overflow-hidden group">
            <div className="p-6 bg-gradient-to-br from-primary to-emerald-600">
              <h4 className="text-white font-black text-lg mb-2">Upgrade Protocol</h4>
              <p className="text-white/80 text-xs font-medium leading-relaxed">
                Unlock advanced analytics, team collaboration, and automated reporting by upgrading your tier.
              </p>
            </div>
            <Link href="/admin/billing" className="block w-full text-center py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Initialize Upgrade
            </Link>
          </GlassCard>
        </div>
      </div>

      <QuickQuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </div>
  );
}

function TelemetryItem({ icon: Icon, label, status, color }: any) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <span className={cn("text-[10px] font-black uppercase tracking-widest", color)}>{status}</span>
    </div>
  );
}
