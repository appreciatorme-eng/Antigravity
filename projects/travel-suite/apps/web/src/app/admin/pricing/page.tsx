"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Coins, ChevronLeft, ChevronRight, RefreshCw, LayoutGrid, Receipt, BarChart3, Database,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import { usePricingDashboard } from "@/features/admin/pricing/usePricingDashboard";
import { useTripCosts } from "@/features/admin/pricing/useTripCosts";
import { useOverheads } from "@/features/admin/pricing/useOverheads";
import { PricingKpiCards } from "@/features/admin/pricing/components/PricingKpiCards";
import { MonthlyTripTable } from "@/features/admin/pricing/components/MonthlyTripTable";
import { OverheadExpensesCard } from "@/features/admin/pricing/components/OverheadExpensesCard";
import { ProfitTrendChart } from "@/features/admin/pricing/components/ProfitTrendChart";
import { CategoryBreakdownChart } from "@/features/admin/pricing/components/CategoryBreakdownChart";
import { TransactionLedger } from "@/features/admin/pricing/components/TransactionLedger";
import { TransactionDetailPanel } from "@/features/admin/pricing/components/TransactionDetailPanel";
import SlideOutPanel from "@/components/god-mode/SlideOutPanel";
import type { TransactionItem } from "@/features/admin/pricing/types";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const TABS = [
  { id: "monthly", label: "Monthly View", icon: LayoutGrid },
  { id: "overheads", label: "Overheads", icon: Receipt },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "ledger", label: "Ledger", icon: Database },
] as const;

type TabId = (typeof TABS)[number]["id"];

function getMonthStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export default function PricingPage() {
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => getMonthStr(now));
  const [activeTab, setActiveTab] = useState<TabId>("monthly");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const monthLabel = getMonthLabel(month);
  const monthStart = `${month}-01`;

  const dashboard = usePricingDashboard(month);
  const tripCosts = useTripCosts(month);
  const overheads = useOverheads(month);

  const handlePrevMonth = useCallback(() => {
    setMonth((prev) => {
      const [y, m] = prev.split("-").map(Number);
      const d = new Date(y, m - 2, 1);
      return getMonthStr(d);
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setMonth((prev) => {
      const [y, m] = prev.split("-").map(Number);
      const d = new Date(y, m, 1);
      return getMonthStr(d);
    });
  }, []);

  const handleReload = useCallback(() => {
    dashboard.reload();
    tripCosts.reload();
    overheads.reload();
  }, [dashboard, tripCosts, overheads]);

  const isLoading = dashboard.loading || tripCosts.loading || overheads.loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200"
            >
              <Coins className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold font-serif text-secondary">
                Pricing & Profit
              </h1>
              <p className="text-sm text-text-muted">
                Track trip-wise costs, pricing, and monthly profitability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Month Picker */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1 shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-semibold text-secondary min-w-[130px] text-center">
                {monthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <GlassButton
              variant="outline"
              onClick={handleReload}
              className="rounded-xl"
              loading={isLoading}
            >
              <RefreshCw className="w-4 h-4" />
            </GlassButton>
          </div>
        </div>

        {/* KPI Cards */}
        {dashboard.data && (
          <PricingKpiCards kpis={dashboard.data.kpis} />
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/80 border border-gray-200/60 rounded-xl p-1 w-fit shadow-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "monthly" && (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tripCosts.loading ? (
              <GlassCard padding="xl" className="text-center">
                <p className="text-text-muted text-sm">Loading trips...</p>
              </GlassCard>
            ) : (
              <MonthlyTripTable
                trips={tripCosts.trips}
                onCostSaved={() => {
                  tripCosts.reload();
                  dashboard.reload();
                }}
                fetchVendorHistory={tripCosts.fetchVendorHistory}
              />
            )}
          </motion.div>
        )}

        {activeTab === "overheads" && (
          <motion.div
            key="overheads"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {overheads.loading ? (
              <GlassCard padding="xl" className="text-center">
                <p className="text-text-muted text-sm">Loading expenses...</p>
              </GlassCard>
            ) : (
              <OverheadExpensesCard
                expenses={overheads.expenses}
                monthLabel={monthLabel}
                monthStart={monthStart}
                totalOverhead={overheads.totalOverhead}
                grossProfit={dashboard.data?.kpis.grossProfit ?? 0}
                onCreateExpense={async (data) => {
                  await overheads.createExpense(data);
                  dashboard.reload();
                }}
                onUpdateExpense={async (id, data) => {
                  await overheads.updateExpense(id, data);
                  dashboard.reload();
                }}
                onDeleteExpense={async (id) => {
                  await overheads.deleteExpense(id);
                  dashboard.reload();
                }}
              />
            )}
          </motion.div>
        )}

        {activeTab === "ledger" && (
          <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TransactionLedger
              onSelectTransaction={(t) => {
                setSelectedTransaction(t);
                setPanelOpen(true);
              }}
            />
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {dashboard.loading ? (
              <GlassCard padding="xl" className="text-center">
                <p className="text-text-muted text-sm">Loading analytics...</p>
              </GlassCard>
            ) : dashboard.data ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProfitTrendChart data={dashboard.data.monthlyTrend} />
                  <CategoryBreakdownChart data={dashboard.data.categoryBreakdown} />
                </div>

                {/* Top Profitable Trips */}
                {dashboard.data.topProfitableTrips.length > 0 && (
                  <GlassCard padding="lg">
                    <h3 className="text-lg font-serif text-secondary mb-1">
                      Top Profitable Trips
                    </h3>
                    <p className="text-xs text-text-muted mb-4">
                      Ranked by profit margin this month
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50/60">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-primary">
                              #
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-primary">
                              Trip
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-primary">
                              Destination
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600">
                              Revenue
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-rose-600">
                              Cost
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-violet-600">
                              Profit
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {dashboard.data.topProfitableTrips.map((trip, i) => (
                            <tr key={trip.tripId} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-secondary">
                                {i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                              </td>
                              <td className="px-4 py-3 font-medium text-secondary">
                                {trip.tripTitle}
                              </td>
                              <td className="px-4 py-3 text-text-secondary">
                                {trip.destination || "\u2014"}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency", currency: "INR",
                                  maximumFractionDigits: 0,
                                }).format(trip.profit + (trip.paxCount * 1000))}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-rose-600">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency", currency: "INR",
                                  maximumFractionDigits: 0,
                                }).format(trip.paxCount * 1000)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-violet-600 font-bold">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency", currency: "INR",
                                  maximumFractionDigits: 0,
                                }).format(trip.profit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                )}

                {/* Least Profitable Trips */}
                {dashboard.data.bottomProfitableTrips.length > 0 && (
                  <GlassCard padding="lg" className="border-red-200 bg-red-50/30">
                    <h3 className="text-lg font-serif text-red-800 mb-1">
                      Least Profitable Trips
                    </h3>
                    <p className="text-xs text-red-600 mb-4">
                      Trips requiring attention — lowest profit margin this month
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-red-100/60">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-red-800">
                              #
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-red-800">
                              Trip
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-red-800">
                              Destination
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600">
                              Revenue
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-rose-600">
                              Cost
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-red-700">
                              Profit
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {dashboard.data.bottomProfitableTrips.map((trip, i) => (
                            <tr key={trip.tripId} className="hover:bg-red-100/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-red-800">
                                {i + 1}
                              </td>
                              <td className="px-4 py-3 font-medium text-red-900">
                                {trip.tripTitle}
                              </td>
                              <td className="px-4 py-3 text-red-700">
                                {trip.destination || "\u2014"}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency", currency: "INR",
                                  maximumFractionDigits: 0,
                                }).format(trip.revenue)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-rose-600">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency", currency: "INR",
                                  maximumFractionDigits: 0,
                                }).format(trip.cost)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-red-700 font-bold">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency", currency: "INR",
                                  maximumFractionDigits: 0,
                                }).format(trip.profit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                )}
              </>
            ) : (
              <GlassCard padding="xl" className="text-center">
                <p className="text-text-muted text-sm">No analytics data available.</p>
              </GlassCard>
            )}
          </motion.div>
        )}
      </div>

      {/* Transaction Detail Panel */}
      <SlideOutPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Transaction Detail"
        width="lg"
      >
        {selectedTransaction && (
          <TransactionDetailPanel
            transaction={selectedTransaction}
            fetchVendorHistory={tripCosts.fetchVendorHistory}
            onEdited={() => {
              setPanelOpen(false);
              tripCosts.reload();
              dashboard.reload();
            }}
            onDeleted={() => {
              setPanelOpen(false);
              tripCosts.reload();
              dashboard.reload();
            }}
          />
        )}
      </SlideOutPanel>
    </div>
  );
}
