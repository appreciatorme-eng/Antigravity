"use client";

import {
  IndianRupee,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import type { TripInvoiceSummaryData } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripFinancialSummaryProps {
  invoiceSummary: TripInvoiceSummaryData | null;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return `\u20B9${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripFinancialSummary({
  invoiceSummary,
  loading = false,
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

  if (!invoiceSummary) {
    return (
      <GlassCard padding="xl">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">No invoices yet</p>
        </div>
      </GlassCard>
    );
  }

  const kpis = buildKpis(invoiceSummary);

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
    </GlassCard>
  );
}
