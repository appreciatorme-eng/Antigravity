"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Target,
  ArrowUpRight,
  Activity,
  MapPin,
  Sun,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resolveWindow } from "@/lib/analytics/adapters";
import { resolveAdminDateRange } from "@/lib/admin/date-range";
import type { DrillRow, DrillSummary } from "@/lib/analytics/drill-through-loaders";
import {
  loadBookedValueDrill,
  loadOutstandingDrill,
  loadWonValueDrill,
  loadRevenueDrill,
  loadBookingsDrill,
  loadConversionDrill,
  loadClientsDrill,
  loadDestinationsDrill,
  loadDestinationRevenueDrill,
  loadSeasonDrill,
  loadPipelineDrill,
  loadOperationsDrill,
} from "@/lib/analytics/drill-through-loaders";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";

type DrillType =
  | "booked"
  | "outstanding"
  | "won"
  | "revenue"
  | "bookings"
  | "conversion"
  | "clients"
  | "destinations"
  | "destination-revenue"
  | "season"
  | "pipeline"
  | "operations";

type TimeRange = "1y" | "6m" | "3m" | "1m";

const TYPE_CONFIG: Record<DrillType, { title: string; icon: typeof DollarSign; color: string }> = {
  booked: { title: "Revenue Details", icon: TrendingUp, color: "text-emerald-500" },
  outstanding: { title: "Outstanding Balance Details", icon: DollarSign, color: "text-blue-500" },
  won: { title: "Won Value Details", icon: TrendingUp, color: "text-emerald-500" },
  revenue: { title: "Revenue Breakdown", icon: DollarSign, color: "text-emerald-500" },
  bookings: { title: "Booking Volume Details", icon: Calendar, color: "text-blue-500" },
  clients: { title: "Client Acquisition Details", icon: Users, color: "text-indigo-500" },
  conversion: { title: "Conversion Funnel Details", icon: Target, color: "text-purple-500" },
  destinations: { title: "Destination Breakdown", icon: MapPin, color: "text-teal-500" },
  "destination-revenue": { title: "Revenue by Destination", icon: DollarSign, color: "text-amber-500" },
  season: { title: "Seasonal Performance", icon: Sun, color: "text-orange-500" },
  pipeline: { title: "Proposal Pipeline Details", icon: Target, color: "text-violet-500" },
  operations: { title: "Operations Overview", icon: Activity, color: "text-sky-500" },
};

const VALID_TYPES: ReadonlySet<string> = new Set([
  "revenue", "bookings", "conversion", "clients",
  "destinations", "destination-revenue", "season", "pipeline", "operations", "booked", "won", "outstanding",
]);

function asDrillType(value: string | null): DrillType {
  if (value && VALID_TYPES.has(value)) return value as DrillType;
  return "revenue";
}

function asTimeRange(value: string | null): TimeRange {
  if (value === "1m" || value === "3m" || value === "6m" || value === "1y") return value;
  return "6m";
}

function DrillThroughContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();

  const type = asDrillType(searchParams.get("type"));
  const range = asTimeRange(searchParams.get("range"));
  const month = searchParams.get("month");
  const destination = searchParams.get("destination");
  const status = searchParams.get("status");
  const statusGroup = searchParams.get("status_group");
  const limit = searchParams.get("limit");
  const season = searchParams.get("season");
  const subtype = searchParams.get("subtype");
  const searchParamsString = searchParams.toString();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<DrillRow[]>([]);
  const [summary, setSummary] = useState<DrillSummary | null>(null);

  const activeConfig = TYPE_CONFIG[type];
  const Icon = activeConfig.icon;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) throw new Error("Unauthorized access");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.organization_id) throw new Error("Unable to resolve organization");

        const orgId = profile.organization_id;
        const win = resolveWindow(month, range as "1y" | "6m" | "3m" | "1m");
        const adminRange = resolveAdminDateRange(
          new URLSearchParams(searchParamsString),
          "30d",
        );

        const loaderMap: Record<DrillType, () => ReturnType<typeof loadRevenueDrill>> = {
          booked: () => loadBookedValueDrill(supabase, orgId, adminRange),
          outstanding: () => loadOutstandingDrill(supabase, orgId, adminRange),
          won: () => loadWonValueDrill(supabase, orgId, adminRange),
          revenue: () => loadRevenueDrill(supabase, orgId, win),
          bookings: () => loadBookingsDrill(supabase, orgId, win),
          conversion: () => loadConversionDrill(supabase, orgId, win),
          clients: () => loadClientsDrill(supabase, orgId, win),
          destinations: () => loadDestinationsDrill(supabase, orgId, win, destination),
          "destination-revenue": () => loadDestinationRevenueDrill(supabase, orgId, win, destination),
          season: () => loadSeasonDrill(supabase, orgId, season),
          pipeline: () =>
            loadPipelineDrill(
              supabase,
              orgId,
              win,
              status,
              statusGroup,
              Number.parseInt(limit || "50", 10) || 50,
            ),
          operations: () => loadOperationsDrill(supabase, orgId, subtype),
        };

        const result = await loaderMap[type]();
        setSummary(result.summary);
        setRows(result.rows);
      } catch (err) {
        setRows([]);
        setSummary(null);
        setError(err instanceof Error ? err.message : "Failed to load drill-through data");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [
    destination,
    limit,
    month,
    range,
    season,
    searchParamsString,
    status,
    statusGroup,
    subtype,
    supabase,
    type,
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <motion.div
        className="flex items-end justify-between flex-wrap gap-4 mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl bg-white border border-gray-100 ${activeConfig.color} shadow-sm`}>
              <Icon className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-serif text-secondary tracking-tight">{activeConfig.title}</h1>
          </div>
          <p className="text-text-secondary text-sm">
            Detailed records for {summary?.windowLabel || "selected period"}. Click any row for full context.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/analytics">
            <GlassButton variant="outline" className="h-10 px-4 text-xs">
              <BarChart3 className="w-4 h-4 mr-2" />
              Back to Analytics
            </GlassButton>
          </Link>
          <Link href="/">
            <GlassButton variant="outline" className="h-10 px-4 text-xs">
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </GlassButton>
          </Link>
        </div>
      </motion.div>

      {summary ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }}>
          <GlassCard padding="lg" className="border-gray-100">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{summary.label}</p>
                <h2 className="text-3xl font-black text-secondary mt-2 tabular-nums">{summary.primaryValue}</h2>
                <p className="text-sm text-text-secondary mt-1">{summary.secondaryValue}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                {summary.windowLabel}
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
          </GlassCard>
        </motion.div>
      ) : null}

      <GlassCard padding="none" className="overflow-hidden border-gray-100 shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-text-muted">Loading drill-through records...</div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 text-sm">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm">No records found for this filter window.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {rows.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.2) }}
              >
                <Link href={item.href} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4 group block">
                  <div>
                    <h3 className="font-bold text-secondary text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {item.subtitle}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.dateLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-right min-w-[140px]">
                    <div className="font-bold text-secondary tabular-nums text-lg">{item.amountLabel}</div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-primary mt-1 inline-flex items-center gap-1">
                      {item.status}
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function AnalyticsDrillThroughPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading metrics...</div>}>
      <DrillThroughContent />
    </Suspense>
  );
}
