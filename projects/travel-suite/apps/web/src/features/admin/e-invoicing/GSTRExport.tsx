"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  IndianRupee,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/india/formats";
import { cn } from "@/lib/utils";

type ExportFormat = "json" | "csv";
type PeriodType = "monthly" | "quarterly";

interface GSTR1Summary {
  period: string;
  gstin: string;
  total_b2b_invoices: number;
  total_b2c_large_invoices: number;
  total_b2c_small_entries: number;
  total_hsn_entries: number;
  total_tax_collected: number;
  total_taxable_value: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
}

interface GSTRExportProps {
  /** Organization GSTIN - if not provided, will fetch from settings */
  gstin?: string;
  /** Default selected month (YYYY-MM format) */
  defaultMonth?: string;
  /** Callback when export is initiated */
  onExportStart?: (month: string, format: ExportFormat) => void;
  /** Callback when export completes successfully */
  onExportComplete?: (month: string, format: ExportFormat) => void;
  /** Callback when export fails */
  onExportError?: (error: Error) => void;
}

export function GSTRExport({
  gstin,
  defaultMonth,
  onExportStart,
  onExportComplete,
  onExportError,
}: GSTRExportProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<GSTR1Summary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    defaultMonth || getCurrentMonth()
  );
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");

  const handleExport = useCallback(async () => {
    try {
      setLoading(true);
      onExportStart?.(selectedMonth, selectedFormat);

      const params = new URLSearchParams({
        month: selectedMonth,
        format: selectedFormat,
      });

      const response = await fetch(`/api/admin/reports/gstr-1?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Export failed: ${response.statusText}`);
      }

      // Handle CSV download
      if (selectedFormat === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GSTR-1_${selectedMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle JSON download
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GSTR-1_${selectedMonth}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Update summary from response
        if (data.summary) {
          setSummary(data.summary);
        }
      }

      toast({
        title: "Export successful",
        description: `GSTR-1 data for ${formatMonthDisplay(selectedMonth)} has been downloaded.`,
        variant: "success",
      });

      onExportComplete?.(selectedMonth, selectedFormat);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to export GSTR-1 data";
      toast({
        title: "Export failed",
        description: errorMessage,
        variant: "error",
      });
      onExportError?.(
        error instanceof Error ? error : new Error(errorMessage)
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedFormat, onExportStart, onExportComplete, onExportError, toast]);

  const monthOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    const today = new Date();

    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
      options.push({ value, label });
    }

    return options;
  }, []);

  const quarterOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    const today = new Date();
    const currentYear = today.getFullYear();

    // Generate last 4 quarters
    for (let year = currentYear; year >= currentYear - 1; year--) {
      for (let q = 4; q >= 1; q--) {
        const quarterStart = new Date(year, (q - 1) * 3, 1);
        if (quarterStart <= today) {
          const value = `${year}-Q${q}`;
          const label = `Q${q} ${year} (${getQuarterMonths(q)})`;
          options.push({ value, label });
        }
      }
    }

    return options;
  }, []);

  const kpis = useMemo(() => {
    if (!summary) {
      return [
        {
          label: "B2B Invoices",
          value: "—",
          icon: FileText,
          color: "text-blue-600",
          bg: "bg-blue-500/10",
        },
        {
          label: "B2C Invoices",
          value: "—",
          icon: FileText,
          color: "text-violet-600",
          bg: "bg-violet-500/10",
        },
        {
          label: "Tax Collected",
          value: "—",
          icon: IndianRupee,
          color: "text-emerald-600",
          bg: "bg-emerald-500/10",
        },
      ];
    }

    return [
      {
        label: "B2B Invoices",
        value: summary.total_b2b_invoices.toString(),
        sub: "With buyer GSTIN",
        icon: FileText,
        color: "text-blue-600",
        bg: "bg-blue-500/10",
      },
      {
        label: "B2C Invoices",
        value: (summary.total_b2c_large_invoices + summary.total_b2c_small_entries).toString(),
        sub: `${summary.total_b2c_large_invoices} large, ${summary.total_b2c_small_entries} small`,
        icon: FileText,
        color: "text-violet-600",
        bg: "bg-violet-500/10",
      },
      {
        label: "Tax Collected",
        value: formatINR(summary.total_tax_collected),
        sub: `On ${formatINR(summary.total_taxable_value)} taxable`,
        icon: IndianRupee,
        color: "text-emerald-600",
        bg: "bg-emerald-500/10",
      },
    ];
  }, [summary]);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-secondary tracking-tight">
              GSTR-1 Export
            </h2>
          </div>
          <p className="text-sm text-secondary/60 ml-[52px]">
            Download GST filing data in JSON or CSV format
          </p>
        </div>
      </div>

      {/* Export Controls */}
      <GlassCard className="p-6">
        <div className="space-y-6">
          {/* Period Type Selector */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Period Type
            </label>
            <div className="flex gap-2">
              <GlassButton
                variant={periodType === "monthly" ? "primary" : "secondary"}
                onClick={() => setPeriodType("monthly")}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Monthly
              </GlassButton>
              <GlassButton
                variant={periodType === "quarterly" ? "primary" : "secondary"}
                onClick={() => setPeriodType("quarterly")}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Quarterly
              </GlassButton>
            </div>
          </div>

          {/* Period Selector */}
          <div>
            <label htmlFor="month-select" className="block text-sm font-medium text-secondary mb-2">
              {periodType === "monthly" ? "Select Month" : "Select Quarter"}
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-secondary focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              {(periodType === "monthly" ? monthOptions : quarterOptions).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Export Format
            </label>
            <div className="flex gap-2">
              <GlassButton
                variant={selectedFormat === "csv" ? "primary" : "secondary"}
                onClick={() => setSelectedFormat("csv")}
                className="flex-1"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </GlassButton>
              <GlassButton
                variant={selectedFormat === "json" ? "primary" : "secondary"}
                onClick={() => setSelectedFormat("json")}
                className="flex-1"
              >
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </GlassButton>
            </div>
          </div>

          {/* GSTIN Display */}
          {gstin && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary/60 uppercase tracking-wide mb-1">
                    Organization GSTIN
                  </p>
                  <p className="text-sm font-mono font-medium text-secondary">
                    {gstin}
                  </p>
                </div>
                <GlassBadge variant="success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Configured
                </GlassBadge>
              </div>
            </div>
          )}

          {/* Export Button */}
          <GlassButton
            onClick={() => void handleExport()}
            disabled={loading}
            className={cn(
              "w-full py-3 font-medium",
              loading && "opacity-50 cursor-not-allowed"
            )}
            variant="primary"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Export...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download GSTR-1 ({selectedFormat.toUpperCase()})
              </>
            )}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Summary Stats */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {kpis.map((kpi) => (
              <GlassCard
                key={kpi.label}
                className="p-5 hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("p-2 rounded-lg", kpi.bg)}>
                        <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                      </div>
                      <p className="text-xs font-medium text-secondary/60 uppercase tracking-wide">
                        {kpi.label}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-secondary mt-2 mb-1">
                      {kpi.value}
                    </p>
                    {kpi.sub && (
                      <p className="text-xs text-secondary/50">{kpi.sub}</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Tax Breakdown */}
          <GlassCard className="p-6 mt-4">
            <h3 className="text-sm font-semibold text-secondary mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Tax Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-xs text-emerald-600/80 font-medium mb-1">
                  CGST
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatINR(summary.cgst_total)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-600/80 font-medium mb-1">
                  SGST
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {formatINR(summary.sgst_total)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg">
                <p className="text-xs text-violet-600/80 font-medium mb-1">
                  IGST
                </p>
                <p className="text-xl font-bold text-violet-600">
                  {formatINR(summary.igst_total)}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Help Text */}
      <GlassCard className="p-4 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-secondary/70 space-y-1">
            <p className="font-medium text-secondary">
              About GSTR-1 Export
            </p>
            <p>
              GSTR-1 is a monthly/quarterly return of outward supplies (sales). This export includes:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>B2B invoices (with buyer GSTIN)</li>
              <li>B2CL invoices (B2C transactions &gt; ₹2.5L)</li>
              <li>B2CS entries (aggregated B2C ≤ ₹2.5L)</li>
              <li>HSN/SAC summary with tax details</li>
            </ul>
            <p className="mt-2 text-xs">
              Cancelled e-invoices are automatically excluded from the export.
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Helper functions
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthDisplay(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getQuarterMonths(quarter: number): string {
  const months = [
    "Apr-Jun",
    "Jul-Sep",
    "Oct-Dec",
    "Jan-Mar",
  ];
  return months[quarter - 1] || "";
}
