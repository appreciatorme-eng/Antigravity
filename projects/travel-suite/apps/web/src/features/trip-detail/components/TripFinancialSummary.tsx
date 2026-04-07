"use client";

import {
  IndianRupee,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  RefreshCw,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import type { TripInvoiceSummaryData, TripPricing } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripFinancialSummaryProps {
  invoiceSummary: TripInvoiceSummaryData | null;
  packagePricing?: TripPricing | null;
  loading?: boolean;
  onPackagePricingChange?: (pricing: TripPricing) => void;
  onConvertToINR?: () => void;
  convertingCurrency?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return `\u20B9${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatPackageCurrency(amount: number, currency?: string): string {
  const code = currency?.toUpperCase() ?? "INR";
  if (code === "INR") return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  if (code === "USD") return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (code === "THB") return `฿${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${code} ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Mini KPI data
// ---------------------------------------------------------------------------

interface MiniKpi {
  label: string;
  value: string;
  icon: typeof IndianRupee;
  color: string;
  iconBg: string;
}

function buildKpis(summary: TripInvoiceSummaryData): readonly MiniKpi[] {
  return [
    {
      label: "Total Invoiced",
      value: formatCurrency(summary.total_amount),
      icon: IndianRupee,
      color: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Amount Paid",
      value: formatCurrency(summary.paid_amount),
      icon: CheckCircle,
      color: "text-sky-600",
      iconBg: "bg-sky-50",
    },
    {
      label: "Balance Due",
      value: formatCurrency(summary.balance_amount),
      icon: AlertCircle,
      color: "text-rose-600",
      iconBg: "bg-rose-50",
    },
    {
      label: "Invoices",
      value: String(summary.invoice_count),
      icon: FileText,
      color: "text-violet-600",
      iconBg: "bg-violet-50",
    },
  ] as const;
}

function buildPackageKpis(pricing: NonNullable<TripFinancialSummaryProps["packagePricing"]>): readonly MiniKpi[] {
  return [
    {
      label: "Quoted Total",
      value: pricing.total_cost ? formatPackageCurrency(pricing.total_cost, pricing.currency) : "Not set",
      icon: IndianRupee,
      color: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Per Person",
      value: pricing.per_person_cost ? formatPackageCurrency(pricing.per_person_cost, pricing.currency) : "Not set",
      icon: CheckCircle,
      color: "text-sky-600",
      iconBg: "bg-sky-50",
    },
    {
      label: "Travelers",
      value: pricing.pax_count ? String(pricing.pax_count) : "Not set",
      icon: Users,
      color: "text-violet-600",
      iconBg: "bg-violet-50",
    },
    {
      label: "Invoices",
      value: "0",
      icon: FileText,
      color: "text-amber-600",
      iconBg: "bg-amber-50",
    },
  ] as const;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripFinancialSummary({
  invoiceSummary,
  packagePricing = null,
  loading = false,
  onPackagePricingChange,
  onConvertToINR,
  convertingCurrency = false,
}: TripFinancialSummaryProps) {
  if (loading) {
    return (
      <GlassCard padding="xl">
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-gray-400 animate-pulse">
            Loading financials...
          </span>
        </div>
      </GlassCard>
    );
  }

  if (!invoiceSummary && !packagePricing) {
    return (
      <GlassCard padding="xl">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">No invoices yet</p>
        </div>
      </GlassCard>
    );
  }

  const kpis = invoiceSummary ? buildKpis(invoiceSummary) : buildPackageKpis(packagePricing!);
  const isEditable = !invoiceSummary && !!onPackagePricingChange;
  const resolvedPricing = packagePricing ?? {};

  return (
    <GlassCard padding="xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <IndianRupee className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
          Financial Summary
        </span>
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg ${kpi.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                {kpi.label}
              </p>
              <p className={`text-2xl font-black tabular-nums ${kpi.color}`}>
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {isEditable ? (
        <div className="mt-6 space-y-4 border-t border-white/30 pt-4 dark:border-slate-700/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Edit Package Pricing
            </p>
            {resolvedPricing.currency && resolvedPricing.currency.toUpperCase() !== "INR" ? (
              <GlassButton
                variant="outline"
                size="sm"
                loading={convertingCurrency}
                onClick={onConvertToINR}
              >
                <RefreshCw className="w-4 h-4" />
                Convert To INR
              </GlassButton>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              min={0}
              placeholder="Quoted total"
              value={resolvedPricing.total_cost ?? ""}
              onChange={(e) =>
                onPackagePricingChange({
                  ...resolvedPricing,
                  total_cost: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              min={0}
              placeholder="Per person"
              value={resolvedPricing.per_person_cost ?? ""}
              onChange={(e) =>
                onPackagePricingChange({
                  ...resolvedPricing,
                  per_person_cost: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Currency"
              value={resolvedPricing.currency ?? "INR"}
              onChange={(e) =>
                onPackagePricingChange({
                  ...resolvedPricing,
                  currency: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              min={1}
              placeholder="Travelers"
              value={resolvedPricing.pax_count ?? ""}
              onChange={(e) =>
                onPackagePricingChange({
                  ...resolvedPricing,
                  pax_count: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <textarea
            rows={2}
            placeholder="Pricing notes"
            value={resolvedPricing.notes ?? ""}
            onChange={(e) =>
              onPackagePricingChange({
                ...resolvedPricing,
                notes: e.target.value,
              })
            }
            className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      ) : null}

      {!invoiceSummary && !isEditable && packagePricing?.notes ? (
        <p className="mt-4 text-xs italic text-text-muted">{packagePricing.notes}</p>
      ) : null}
    </GlassCard>
  );
}
