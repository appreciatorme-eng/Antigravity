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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";

type DrillType = "revenue" | "bookings" | "conversion" | "clients";
type TimeRange = "1y" | "6m" | "3m" | "1m";

interface DrillRow {
  id: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  status: string;
  dateLabel: string;
  href: string;
}

interface DrillSummary {
  label: string;
  primaryValue: string;
  secondaryValue: string;
  windowLabel: string;
}

interface WindowSelection {
  startISO: string;
  endISO: string;
  label: string;
}

interface ItineraryLite {
  destination: string | null;
  trip_title: string | null;
}

interface InvoiceDrillRow {
  id: string;
  created_at: string | null;
  total_amount: number;
  status: string;
  invoice_number: string;
}

interface TripDrillRow {
  id: string;
  created_at: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  itineraries: ItineraryLite | ItineraryLite[] | null;
}

interface ProposalDrillRow {
  id: string;
  title: string;
  status: string | null;
  total_price: number | null;
  created_at: string | null;
  viewed_at: string | null;
}

const RANGE_MONTHS: Record<TimeRange, number> = {
  "1y": 12,
  "6m": 6,
  "3m": 3,
  "1m": 1,
};

const TYPE_CONFIG: Record<DrillType, { title: string; icon: typeof DollarSign; color: string }> = {
  revenue: { title: "Revenue Breakdown", icon: DollarSign, color: "text-emerald-500" },
  bookings: { title: "Booking Volume Details", icon: Calendar, color: "text-blue-500" },
  clients: { title: "Client Acquisition Details", icon: Users, color: "text-indigo-500" },
  conversion: { title: "Conversion Funnel Details", icon: Target, color: "text-purple-500" },
};

function asDrillType(value: string | null): DrillType {
  if (value === "revenue" || value === "bookings" || value === "clients" || value === "conversion") {
    return value;
  }
  return "revenue";
}

function asTimeRange(value: string | null): TimeRange {
  if (value === "1m" || value === "3m" || value === "6m" || value === "1y") {
    return value;
  }
  return "6m";
}

function parseMonthKey(value: string | null): { year: number; month: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

function resolveWindow(monthKey: string | null, range: TimeRange): WindowSelection {
  const parsedMonth = parseMonthKey(monthKey);
  if (parsedMonth) {
    const start = new Date(Date.UTC(parsedMonth.year, parsedMonth.month - 1, 1));
    const end = new Date(Date.UTC(parsedMonth.year, parsedMonth.month, 1));
    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (RANGE_MONTHS[range] - 1), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    label: `Last ${RANGE_MONTHS[range]} ${RANGE_MONTHS[range] === 1 ? "month" : "months"}`,
  };
}

function formatDate(value: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getItinerary(value: TripDrillRow["itineraries"]): ItineraryLite | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function DrillThroughContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();

  const type = asDrillType(searchParams.get("type"));
  const range = asTimeRange(searchParams.get("range"));
  const month = searchParams.get("month");

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

        if (authError || !user) {
          throw new Error("Unauthorized access");
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.organization_id) {
          throw new Error("Unable to resolve organization");
        }

        const windowSelection = resolveWindow(month, range);
        const orgId = profile.organization_id;

        if (type === "revenue") {
          const { data, error: invoicesError } = await supabase
            .from("invoices")
            .select("id, invoice_number, total_amount, status, created_at")
            .eq("organization_id", orgId)
            .gte("created_at", windowSelection.startISO)
            .lt("created_at", windowSelection.endISO)
            .order("created_at", { ascending: false })
            .limit(100);

          if (invoicesError) throw invoicesError;

          const invoiceRows = (data || []) as InvoiceDrillRow[];
          const paidRows = invoiceRows.filter((invoice) => (invoice.status || "").toLowerCase() === "paid");
          const total = paidRows.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);

          setSummary({
            label: "Paid invoice revenue",
            primaryValue: `₹${total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            secondaryValue: `${paidRows.length} paid invoice${paidRows.length === 1 ? "" : "s"}`,
            windowLabel: windowSelection.label,
          });

          setRows(
            invoiceRows.map((invoice) => ({
              id: invoice.id,
              title: `Invoice ${invoice.invoice_number}`,
              subtitle: `Status: ${(invoice.status || "pending").toUpperCase()}`,
              amountLabel: `₹${Number(invoice.total_amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
              status: invoice.status || "pending",
              dateLabel: formatDate(invoice.created_at),
              href: "/admin/billing",
            }))
          );
        } else if (type === "bookings") {
          const { data, error: tripsError } = await supabase
            .from("trips")
            .select("id, status, start_date, end_date, created_at, itineraries(destination, trip_title)")
            .eq("organization_id", orgId)
            .gte("created_at", windowSelection.startISO)
            .lt("created_at", windowSelection.endISO)
            .order("created_at", { ascending: false })
            .limit(100);

          if (tripsError) throw tripsError;

          const tripRows = (data || []) as TripDrillRow[];

          setSummary({
            label: "Trips created",
            primaryValue: `${tripRows.length}`,
            secondaryValue: "Bookings in selected window",
            windowLabel: windowSelection.label,
          });

          setRows(
            tripRows.map((trip) => {
              const itinerary = getItinerary(trip.itineraries);
              return {
                id: trip.id,
                title: itinerary?.trip_title || itinerary?.destination || "Trip record",
                subtitle: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
                amountLabel: (trip.status || "draft").replace(/_/g, " "),
                status: trip.status || "draft",
                dateLabel: formatDate(trip.created_at),
                href: `/trips/${trip.id}`,
              };
            })
          );
        } else {
          const { data, error: proposalsError } = await supabase
            .from("proposals")
            .select("id, title, status, total_price, created_at, viewed_at")
            .eq("organization_id", orgId)
            .gte("created_at", windowSelection.startISO)
            .lt("created_at", windowSelection.endISO)
            .order("created_at", { ascending: false })
            .limit(100);

          if (proposalsError) throw proposalsError;

          const proposalRows = (data || []) as ProposalDrillRow[];
          const approvedCount = proposalRows.filter((proposal) =>
            ["approved", "accepted", "confirmed"].includes((proposal.status || "").toLowerCase())
          ).length;
          const conversionRate = proposalRows.length > 0 ? (approvedCount / proposalRows.length) * 100 : 0;

          setSummary({
            label: "Proposal conversion",
            primaryValue: `${conversionRate.toFixed(1)}%`,
            secondaryValue: `${approvedCount}/${proposalRows.length} approved`,
            windowLabel: windowSelection.label,
          });

          setRows(
            proposalRows.map((proposal) => ({
              id: proposal.id,
              title: proposal.title,
              subtitle: proposal.viewed_at ? "Viewed by client" : "Awaiting client view",
              amountLabel: `₹${Number(proposal.total_price || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
              status: proposal.status || "draft",
              dateLabel: formatDate(proposal.created_at),
              href: `/proposals/${proposal.id}`,
            }))
          );
        }
      } catch (err) {
        setRows([]);
        setSummary(null);
        setError(err instanceof Error ? err.message : "Failed to load drill-through data");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [month, range, supabase, type]);

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
          <Link href="/admin/analytics">
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
