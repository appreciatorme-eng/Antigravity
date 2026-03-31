"use client";

// TransactionLedger — searchable, filterable ledger of all pricing cost entries.
// Shows every vendor transaction across all trips with search, category chips, sort.

import { useState, useMemo, useCallback } from "react";
import {
  Search, SlidersHorizontal, ArrowUpDown, Building2, Car, Plane, FileCheck,
  Shield, Train, Bus, Package, ChevronRight, TrendingUp, TrendingDown,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import { formatINR, formatINRShort } from "@/lib/india/formats";
import { CATEGORY_LABELS, type ServiceCategory, type TransactionItem, type TransactionSort } from "../types";
import { useTransactions } from "../useTransactions";

const CATEGORY_META: Record<ServiceCategory, { icon: React.ElementType; color: string; bg: string; chip: string }> = {
  hotels:    { icon: Building2, color: "text-rose-600",   bg: "bg-rose-50",    chip: "bg-rose-100 text-rose-700 border-rose-200" },
  vehicle:   { icon: Car,       color: "text-amber-600",  bg: "bg-amber-50",   chip: "bg-amber-100 text-amber-700 border-amber-200" },
  flights:   { icon: Plane,     color: "text-sky-600",    bg: "bg-sky-50",     chip: "bg-sky-100 text-sky-700 border-sky-200" },
  visa:      { icon: FileCheck, color: "text-purple-600", bg: "bg-purple-50",  chip: "bg-purple-100 text-purple-700 border-purple-200" },
  insurance: { icon: Shield,    color: "text-emerald-600",bg: "bg-emerald-50", chip: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  train:     { icon: Train,     color: "text-orange-600", bg: "bg-orange-50",  chip: "bg-orange-100 text-orange-700 border-orange-200" },
  bus:       { icon: Bus,       color: "text-teal-600",   bg: "bg-teal-50",    chip: "bg-teal-100 text-teal-700 border-teal-200" },
  other:     { icon: Package,   color: "text-gray-600",   bg: "bg-gray-50",    chip: "bg-gray-100 text-gray-700 border-gray-200" },
};

const SORT_OPTIONS: { value: TransactionSort; label: string }[] = [
  { value: "date",   label: "Date" },
  { value: "profit", label: "Profit" },
  { value: "cost",   label: "Cost" },
  { value: "price",  label: "Revenue" },
];

const ALL_CATEGORIES: Array<ServiceCategory | "all"> = [
  "all", "hotels", "vehicle", "flights", "visa", "insurance", "train", "bus", "other",
];

interface Props {
  onSelectTransaction: (t: TransactionItem) => void;
  refreshKey?: number;
}

export function TransactionLedger({ onSelectTransaction, refreshKey }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [vendor, setVendor] = useState("");
  const [sort, setSort] = useState<TransactionSort>("date");

  const filters = useMemo(
    () => ({ search, category, vendor, sort }),
    [search, category, vendor, sort]
  );

  const { transactions, summary, loading, error } = useTransactions(filters, refreshKey);

  const uniqueVendors = useMemo(() => {
    const vendors = transactions.map((t) => t.vendor_name).filter(Boolean) as string[];
    return [...new Set(vendors)].sort();
  }, [transactions]);

  const handleCategoryClick = useCallback((cat: ServiceCategory | "all") => {
    setCategory(cat);
    setVendor("");
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Search + Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <GlassCard padding="none" className="flex-1">
          <div className="flex items-center px-4 py-2.5 gap-3">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
            <input
              type="text"
              placeholder="Search trips, vendors, destinations, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-secondary placeholder:text-text-muted"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-text-muted hover:text-secondary text-xs transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </GlassCard>

        <div className="flex items-center gap-2">
          {vendor && (
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-secondary outline-none focus:border-primary transition-colors"
            >
              <option value="">All Vendors</option>
              {uniqueVendors.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}

          {!vendor && uniqueVendors.length > 0 && (
            <button
              onClick={() => setVendor(uniqueVendors[0] ?? "")}
              className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-text-muted hover:text-secondary hover:border-gray-300 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Vendor
            </button>
          )}

          <div className="flex items-center gap-1 border border-gray-200 rounded-lg bg-white px-1 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted ml-1.5" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as TransactionSort)}
              className="text-sm bg-transparent outline-none text-text-muted pr-1 py-0.5 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const isActive = category === cat;
          const meta = cat !== "all" ? CATEGORY_META[cat] : null;
          const Icon = meta?.icon;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                isActive
                  ? cat === "all"
                    ? "bg-primary text-white border-primary shadow-sm"
                    : `${meta?.chip} border font-semibold shadow-sm`
                  : "bg-white text-text-muted border-gray-200 hover:border-gray-300 hover:text-secondary"
              )}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Summary Strip */}
      {!loading && transactions.length > 0 && (
        <div className="flex flex-wrap gap-4 px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border border-gray-100 rounded-xl text-xs font-medium">
          <span className="text-text-muted">
            <span className="text-secondary font-semibold">{summary.count}</span> entries
          </span>
          <span className="text-text-muted hidden sm:inline">·</span>
          <span className="text-text-muted">
            Cost: <span className="text-rose-600 font-semibold">{formatINRShort(summary.totalCost)}</span>
          </span>
          <span className="text-text-muted hidden sm:inline">·</span>
          <span className="text-text-muted">
            Revenue: <span className="text-emerald-600 font-semibold">{formatINRShort(summary.totalRevenue)}</span>
          </span>
          <span className="text-text-muted hidden sm:inline">·</span>
          <span className="text-text-muted">
            Profit: <span className={cn("font-semibold", summary.totalProfit >= 0 ? "text-violet-600" : "text-red-600")}>
              {formatINRShort(summary.totalProfit)}
            </span>
          </span>
          <span className="text-text-muted hidden sm:inline">·</span>
          <span className="text-text-muted">
            Commission: <span className="text-amber-600 font-semibold">{formatINRShort(summary.totalCommission)}</span>
          </span>
        </div>
      )}

      {/* Table */}
      <GlassCard padding="none" className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-text-muted">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-secondary mb-1">No transactions found</p>
            <p className="text-sm text-text-muted">
              {search || category !== "all" || vendor
                ? "Try adjusting your search or filters"
                : "Add cost entries to trips to see them here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1050px]">
              <thead className="border-b border-gray-100 bg-gray-50/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted w-24">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Trip</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted w-28">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Vendor</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-muted w-12">Pax</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-rose-600">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-violet-600">Profit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted w-16">Margin</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-amber-600 whitespace-nowrap">Commission</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t) => {
                  const meta = CATEGORY_META[t.category as ServiceCategory] ?? CATEGORY_META.other;
                  const Icon = meta.icon;
                  const isProfit = t.profit >= 0;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTransaction(t)}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                        {formatDate(t.start_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-secondary leading-tight">{t.trip_name}</div>
                        {t.destination && (
                          <div className="text-xs text-text-muted mt-0.5">{t.destination}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border", meta.chip)}>
                          <Icon className="w-3 h-3" />
                          {CATEGORY_LABELS[t.category as ServiceCategory] ?? t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        <div className="font-medium">{t.vendor_name || "—"}</div>
                        {t.description && (
                          <div className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">{t.description}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center text-text-muted text-xs">{t.pax_count}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-rose-600 font-medium whitespace-nowrap">
                        {formatINR(t.cost_amount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium whitespace-nowrap">
                        {formatINR(t.price_amount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold whitespace-nowrap">
                        <span className={cn("flex items-center justify-end gap-1", isProfit ? "text-violet-600" : "text-red-500")}>
                          {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatINR(Math.abs(t.profit))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-xs font-semibold",
                          t.margin_pct >= 30 ? "bg-emerald-100 text-emerald-700"
                            : t.margin_pct >= 15 ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-600"
                        )}>
                          {t.margin_pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-medium whitespace-nowrap">
                        {t.commission_amount > 0 ? formatINR(t.commission_amount) : "—"}
                      </td>
                      <td className="pr-3 py-3">
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
