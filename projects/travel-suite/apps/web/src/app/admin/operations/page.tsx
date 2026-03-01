"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import {
  Loader2,
  RefreshCw,
  CalendarClock,
  Wallet,
  AlertTriangle,
  BellRing,
  ArrowUpRight,
  Route,
  TrendingUp,
  Clock3,
  Receipt,
  FileText,
} from "lucide-react";

type CommandTab = "command" | "departures" | "revenue";

type DepartureItem = {
  trip_id: string;
  title: string;
  destination: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  client_name: string;
  days_until_departure: number | null;
};

type PendingPaymentItem = {
  invoice_id: string;
  invoice_number: string;
  status: string;
  due_date: string | null;
  balance_amount: number;
  total_amount: number;
  client_name: string;
  is_overdue: boolean;
};

type ExpiringQuoteItem = {
  proposal_id: string;
  title: string;
  status: string;
  expires_at: string | null;
  total_price: number;
  client_name: string;
  hours_to_expiry: number | null;
};

type FollowUpItem = {
  queue_id: string;
  notification_type: string;
  status: string;
  scheduled_for: string;
  trip_id: string | null;
  recipient: string | null;
  overdue: boolean;
};

type CommandCenterPayload = {
  generated_at: string;
  summary: {
    departures_window: number;
    pending_payments: number;
    expiring_quotes: number;
    follow_ups_due: number;
    overdue_invoices: number;
    urgent_quotes: number;
    overdue_follow_ups: number;
  };
  daily_ops_board: {
    at_risk_departures: number;
    pending_payments: number;
    expiring_quotes_24h: number;
    overdue_follow_ups: number;
  };
  outcome_events: Array<{
    key: "time_saved_hours" | "recovered_revenue_inr" | "response_sla_pct";
    label: string;
    value: number;
    unit: "hours" | "inr" | "percent";
    window: string;
  }>;
  upgrade_prompts: Array<{
    id: string;
    title: string;
    detail: string;
    trigger: string;
    cta_label: string;
    cta_path: string;
    priority: number;
  }>;
  departures: DepartureItem[];
  pending_payments: PendingPaymentItem[];
  expiring_quotes: ExpiringQuoteItem[];
  follow_ups: FollowUpItem[];
};

const TABS: Array<{ id: CommandTab; label: string }> = [
  { id: "command", label: "Command Board" },
  { id: "departures", label: "Departures" },
  { id: "revenue", label: "Revenue Tasks" },
];

function formatCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatOutcomeValue(value: number, unit: "hours" | "inr" | "percent"): string {
  if (unit === "inr") return `₹${Math.round(value).toLocaleString("en-IN")}`;
  if (unit === "percent") return `${value.toFixed(1)}%`;
  return `${value.toFixed(1)}h`;
}

export default function AdminOperationsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CommandTab>("command");
  const [data, setData] = useState<CommandCenterPayload | null>(null);

  const loadData = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Unauthorized");
        }

        const response = await fetch("/api/admin/operations/command-center", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const payload = (await response.json()) as CommandCenterPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load command center data");
        }

        setData(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load command center data");
      } finally {
        if (showRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [supabase]
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const urgentItems = useMemo(() => {
    if (!data) return [];

    return [
      {
        id: "overdue-followups",
        label: "Overdue follow-ups",
        value: data.summary.overdue_follow_ups,
        detail: "Send pending client updates first.",
      },
      {
        id: "urgent-quotes",
        label: "Quotes expiring in 24h",
        value: data.summary.urgent_quotes,
        detail: "Close these before they lapse.",
      },
      {
        id: "overdue-invoices",
        label: "Overdue invoices",
        value: data.summary.overdue_invoices,
        detail: "Collect payments to prevent cash leak.",
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-[45vh] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-text-muted">Loading operator command center...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <GlassCard padding="lg" className="border-rose-200 bg-rose-50/60">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
          <div>
            <h1 className="text-lg font-serif text-rose-700">Unable to load command center</h1>
            <p className="text-sm text-rose-700/90 mt-1">{error || "No data returned"}</p>
            <GlassButton className="mt-4 rounded-xl" onClick={() => void loadData(true)}>
              Retry
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-[0.16em] font-black text-primary">
            <Route className="w-3.5 h-3.5" />
            Operator daily command center
          </span>
          <h1 className="text-4xl font-serif text-secondary dark:text-white mt-2">Operations in Three Screens</h1>
          <p className="text-sm text-text-muted mt-1">
            Departures, pending payments, expiring quotes, and follow-ups in one mobile-first control flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton variant="outline" className="h-9 rounded-lg" onClick={() => void loadData(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </GlassButton>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard padding="md" className="border-primary/20">
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Departures (48h)</p>
          <p className="text-3xl font-black text-secondary mt-2">{data.summary.departures_window}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Pending payments</p>
          <p className="text-3xl font-black text-secondary mt-2">{data.summary.pending_payments}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Expiring quotes</p>
          <p className="text-3xl font-black text-secondary mt-2">{data.summary.expiring_quotes}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Follow-ups due</p>
          <p className="text-3xl font-black text-secondary mt-2">{data.summary.follow_ups_due}</p>
        </GlassCard>
      </div>

      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Route className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-serif text-secondary dark:text-white">Daily Ops Board</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">At-risk departures</p>
            <p className="text-2xl font-black text-secondary mt-1">{data.daily_ops_board.at_risk_departures}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Pending payments</p>
            <p className="text-2xl font-black text-secondary mt-1">{data.daily_ops_board.pending_payments}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Quotes expiring in 24h</p>
            <p className="text-2xl font-black text-secondary mt-1">{data.daily_ops_board.expiring_quotes_24h}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Overdue follow-ups</p>
            <p className="text-2xl font-black text-secondary mt-1">{data.daily_ops_board.overdue_follow_ups}</p>
          </div>
        </div>
      </GlassCard>

      <div className="rounded-2xl border border-gray-200 bg-white p-2 grid grid-cols-1 md:grid-cols-3 gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`h-10 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-white"
                : "text-text-muted hover:text-primary hover:bg-primary/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "command" ? (
        <div className="space-y-4">
          <GlassCard padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-serif text-secondary dark:text-white">Outcome Events</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.outcome_events.map((event) => (
                <div key={event.key} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted font-black">{event.label}</p>
                  <p className="text-2xl font-black text-secondary mt-1">{formatOutcomeValue(event.value, event.unit)}</p>
                  <p className="text-xs text-text-muted mt-1">{event.window}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {data.upgrade_prompts.length > 0 ? (
            <GlassCard padding="lg" className="border-indigo-200/70 bg-indigo-50/40">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h2 className="text-lg font-serif text-secondary dark:text-white">Upgrade Triggers (Outcome-Linked)</h2>
              </div>
              <div className="space-y-2">
                {data.upgrade_prompts.map((prompt) => (
                  <div key={prompt.id} className="rounded-xl border border-indigo-100 bg-white p-3">
                    <p className="text-sm font-semibold text-secondary">{prompt.title}</p>
                    <p className="text-xs text-text-muted mt-1">{prompt.detail}</p>
                    <p className="text-[11px] text-text-muted mt-1">Trigger: {prompt.trigger}</p>
                    <Link href={prompt.cta_path} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900">
                      {prompt.cta_label}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : null}

          <GlassCard padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <BellRing className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-serif text-secondary dark:text-white">Priority Queue</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {urgentItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted font-black">{item.label}</p>
                  <p className="text-2xl font-black text-secondary mt-1">{item.value}</p>
                  <p className="text-xs text-text-muted mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Clock3 className="w-4 h-4 text-primary" />
              <h3 className="text-lg font-serif text-secondary dark:text-white">Follow-up Timeline</h3>
            </div>

            {data.follow_ups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-text-muted">
                No follow-up actions scheduled in the current window.
              </div>
            ) : (
              <div className="space-y-2">
                {data.follow_ups.slice(0, 12).map((item) => (
                  <div key={item.queue_id} className="rounded-xl border border-gray-200 bg-white p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-secondary">{item.notification_type}</p>
                      <p className="text-xs text-text-muted mt-1">
                        Recipient: {item.recipient || "Not set"} · Scheduled: {formatDate(item.scheduled_for)}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${
                        item.overdue
                          ? "text-rose-700 bg-rose-50 border-rose-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}
                    >
                      {item.overdue ? "Overdue" : "Due"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      ) : null}

      {activeTab === "departures" ? (
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-serif text-secondary dark:text-white">Departures Board</h2>
          </div>

          {data.departures.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-text-muted">
              No departures in the next 48 hours.
            </div>
          ) : (
            <div className="space-y-3">
              {data.departures.map((departure) => (
                <div key={departure.trip_id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-secondary">{departure.title}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {departure.destination} · Client: {departure.client_name}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Starts: {formatDate(departure.start_date)}
                        {departure.end_date ? ` · Ends: ${formatDate(departure.end_date)}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-text-muted">
                        {departure.days_until_departure === null
                          ? "Date pending"
                          : departure.days_until_departure <= 0
                          ? "Departing today"
                          : `D-${departure.days_until_departure}`}
                      </span>
                      <p className="text-[11px] text-text-muted mt-1">Status: {departure.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <Link href="/admin/trips" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Open trip management
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </GlassCard>
      ) : null}

      {activeTab === "revenue" ? (
        <div className="space-y-4">
          <GlassCard padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-serif text-secondary dark:text-white">Pending Payments</h2>
            </div>
            {data.pending_payments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-text-muted">
                No pending invoices.
              </div>
            ) : (
              <div className="space-y-2">
                {data.pending_payments.slice(0, 12).map((payment) => (
                  <div key={payment.invoice_id} className="rounded-xl border border-gray-200 bg-white p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-secondary">{payment.invoice_number}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {payment.client_name} · Due {formatDate(payment.due_date)}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Balance {formatCurrency(payment.balance_amount)} / {formatCurrency(payment.total_amount)}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${
                        payment.is_overdue
                          ? "text-rose-700 bg-rose-50 border-rose-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}
                    >
                      {payment.is_overdue ? "Overdue" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-serif text-secondary dark:text-white">Expiring Quotes</h2>
            </div>
            {data.expiring_quotes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-text-muted">
                No quotes expiring in the next 7 days.
              </div>
            ) : (
              <div className="space-y-2">
                {data.expiring_quotes.slice(0, 12).map((quote) => (
                  <div key={quote.proposal_id} className="rounded-xl border border-gray-200 bg-white p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-secondary">{quote.title}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {quote.client_name} · Expires {formatDate(quote.expires_at)}
                      </p>
                      <p className="text-xs text-text-muted mt-1">Quote value {formatCurrency(quote.total_price)}</p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${
                        typeof quote.hours_to_expiry === "number" && quote.hours_to_expiry <= 24
                          ? "text-rose-700 bg-rose-50 border-rose-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}
                    >
                      {typeof quote.hours_to_expiry === "number"
                        ? quote.hours_to_expiry <= 0
                          ? "Expired"
                          : `${quote.hours_to_expiry}h left`
                        : "Active"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/invoices" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Open invoices
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link href="/proposals" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Open proposals
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-3">
        <Wallet className="w-4 h-4 text-primary mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-secondary">Execution path with &lt;= 3 primary screens</p>
          <p className="text-xs text-text-muted mt-1">
            Screen 1: Command Board for urgent follow-ups. Screen 2: Departures. Screen 3: Revenue Tasks.
            This keeps daily operator flow tight on both desktop and mobile.
          </p>
        </div>
      </div>
    </div>
  );
}
