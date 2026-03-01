"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Download,
  FileText,
  Info,
  Filter,
  IndianRupee,
  Receipt,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { formatINR, formatINRShort } from "@/lib/india/formats";

type InvoiceStatus = "paid" | "pending" | "cancelled";
type StatusFilter = "all" | InvoiceStatus;

interface GSTRow {
  invoiceNo: string;
  date: string;
  client: string;
  trip: string;
  baseAmount: number;
  gst: number;
  total: number;
  status: InvoiceStatus;
}

const MOCK_DATA: GSTRow[] = [
  {
    invoiceNo: "INV-2026-001",
    date: "2026-02-03",
    client: "Sharma Family",
    trip: "Rajasthan Heritage Tour (7N/8D)",
    baseAmount: 142000,
    gst: 7100,
    total: 149100,
    status: "paid",
  },
  {
    invoiceNo: "INV-2026-002",
    date: "2026-02-07",
    client: "Priya Nair",
    trip: "Kerala Backwaters & Munnar (5N/6D)",
    baseAmount: 68500,
    gst: 3425,
    total: 71925,
    status: "paid",
  },
  {
    invoiceNo: "INV-2026-003",
    date: "2026-02-11",
    client: "Kapoor Enterprises (10 pax)",
    trip: "Goa Corporate Retreat (3N/4D)",
    baseAmount: 215000,
    gst: 10750,
    total: 225750,
    status: "pending",
  },
  {
    invoiceNo: "INV-2026-004",
    date: "2026-02-14",
    client: "Mehta & Associates",
    trip: "Himachal Manali Snow Trip (4N/5D)",
    baseAmount: 89600,
    gst: 4480,
    total: 94080,
    status: "paid",
  },
  {
    invoiceNo: "INV-2026-005",
    date: "2026-02-18",
    client: "Gupta Family",
    trip: "Golden Triangle Delhi-Agra-Jaipur (5N/6D)",
    baseAmount: 54200,
    gst: 2710,
    total: 56910,
    status: "cancelled",
  },
  {
    invoiceNo: "INV-2026-006",
    date: "2026-02-22",
    client: "Iyer Wedding Group (22 pax)",
    trip: "Andaman Islands Honeymoon Package (6N/7D)",
    baseAmount: 386000,
    gst: 19300,
    total: 405300,
    status: "pending",
  },
];

const MONTHS = [
  "January 2026",
  "February 2026",
  "March 2026",
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Paid
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs font-bold text-rose-400">
      <XCircle className="h-3 w-3" />
      Cancelled
    </span>
  );
}

function generateCSV(rows: GSTRow[], month: string): void {
  const headers = ["Invoice No", "Date", "Client", "Trip", "Base Amount (₹)", "GST 5% (₹)", "Total (₹)", "Status"];
  const csvRows = rows.map((r) => [
    r.invoiceNo,
    r.date,
    `"${r.client}"`,
    `"${r.trip}"`,
    r.baseAmount,
    r.gst,
    r.total,
    r.status,
  ]);
  const totals = rows.reduce(
    (acc, r) => {
      acc.base += r.baseAmount;
      acc.gst += r.gst;
      acc.total += r.total;
      return acc;
    },
    { base: 0, gst: 0, total: 0 }
  );
  csvRows.push(["TOTAL", "", "", "", totals.base, totals.gst, totals.total, ""]);

  const csvContent =
    `GST Report - ${month}\nSAC: 998552 | GST Rate: 5% on packaged tours\n\n` +
    headers.join(",") +
    "\n" +
    csvRows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GST_Report_${month.replace(" ", "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function generatePDF(rows: GSTRow[], month: string): void {
  const totals = rows.reduce(
    (acc, r) => {
      acc.base += r.baseAmount;
      acc.gst += r.gst;
      acc.total += r.total;
      return acc;
    },
    { base: 0, gst: 0, total: 0 }
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>GST Report ${month}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a2e; font-size: 12px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .sub { color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #0a1628; color: white; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
        td { padding: 7px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) td { background: #f8f9fa; }
        .total-row td { font-weight: bold; background: #e8f5e9; border-top: 2px solid #00d084; }
        .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #eee; color: #888; font-size: 11px; }
        .badge-paid { color: #16a34a; font-weight: bold; }
        .badge-pending { color: #d97706; font-weight: bold; }
        .badge-cancelled { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>GST Monthly Report — ${month}</h1>
      <div class="sub">SAC: 998552 | GST Rate: 5% on Packaged Tours | GSTR-1 due by 11th of next month</div>
      <table>
        <thead>
          <tr>
            <th>Invoice No</th><th>Date</th><th>Client</th><th>Trip</th>
            <th>Base Amt</th><th>GST 5%</th><th>Total</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              <td>${r.invoiceNo}</td>
              <td>${formatDate(r.date)}</td>
              <td>${r.client}</td>
              <td>${r.trip}</td>
              <td>₹${r.baseAmount.toLocaleString("en-IN")}</td>
              <td>₹${r.gst.toLocaleString("en-IN")}</td>
              <td>₹${r.total.toLocaleString("en-IN")}</td>
              <td class="badge-${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</td>
            </tr>`
            )
            .join("")}
          <tr class="total-row">
            <td colspan="4"><strong>TOTAL (${rows.length} invoices)</strong></td>
            <td>₹${totals.base.toLocaleString("en-IN")}</td>
            <td>₹${totals.gst.toLocaleString("en-IN")}</td>
            <td>₹${totals.total.toLocaleString("en-IN")}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="footer">
        Generated on ${new Date().toLocaleDateString("en-IN")} | TravelSuite — Built for Indian Tour Operators
      </div>
    </body>
    </html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

export default function GSTReportPage() {
  const [selectedMonth, setSelectedMonth] = useState("February 2026");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return MOCK_DATA;
    return MOCK_DATA.filter((r) => r.status === statusFilter);
  }, [statusFilter]);

  const summary = useMemo(() => {
    const paid = MOCK_DATA.filter((r) => r.status === "paid");
    const allActive = MOCK_DATA.filter((r) => r.status !== "cancelled");
    return {
      totalSales: allActive.reduce((s, r) => s + r.total, 0),
      gstCollected: paid.reduce((s, r) => s + r.gst, 0),
      netRevenue: paid.reduce((s, r) => s + r.baseAmount, 0),
      invoiceCount: MOCK_DATA.length,
    };
  }, []);

  const totals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, r) => {
          acc.base += r.baseAmount;
          acc.gst += r.gst;
          acc.total += r.total;
          return acc;
        },
        { base: 0, gst: 0, total: 0 }
      ),
    [filteredRows]
  );

  const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const summaryCards = [
    {
      label: "Total Sales",
      value: formatINR(summary.totalSales),
      short: formatINRShort(summary.totalSales),
      icon: IndianRupee,
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-400",
    },
    {
      label: "GST Collected (5%)",
      value: formatINR(summary.gstCollected),
      short: formatINRShort(summary.gstCollected),
      icon: Receipt,
      color: "from-blue-500 to-indigo-600",
      textColor: "text-blue-400",
    },
    {
      label: "Net Revenue",
      value: formatINR(summary.netRevenue),
      short: formatINRShort(summary.netRevenue),
      icon: TrendingUp,
      color: "from-violet-500 to-purple-600",
      textColor: "text-violet-400",
    },
    {
      label: "Invoice Count",
      value: String(summary.invoiceCount),
      short: `${summary.invoiceCount} invoices`,
      icon: FileText,
      color: "from-amber-500 to-orange-600",
      textColor: "text-amber-400",
    },
  ];

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 60%, #0a1628 100%)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Header */}
        <motion.div
          className="mb-8 flex flex-wrap items-start justify-between gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15">
              <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Admin</p>
              <h1 className="text-3xl font-bold text-white">GST Monthly Report</h1>
              <p className="mt-1 text-sm text-white/40">SAC 998552 · Packaged Tours · 5% GST</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Month selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 appearance-none rounded-xl border border-white/10 bg-white/5 pl-4 pr-10 text-sm font-semibold text-white backdrop-blur-xl focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m} className="bg-[#0a1628] text-white">
                    {m}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            </div>

            {/* Download CSV */}
            <button
              onClick={() => generateCSV(filteredRows, selectedMonth)}
              className="flex h-10 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/25"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>

            {/* Download PDF */}
            <button
              onClick={() => generatePDF(filteredRows, selectedMonth)}
              className="flex h-10 items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/15 px-4 text-sm font-bold text-blue-400 transition-all hover:bg-blue-500/25"
            >
              <FileText className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </motion.div>

        {/* GST notice */}
        <motion.div
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300/80">
            <strong className="text-amber-400">GST rate: 5%</strong> on packaged tours (SAC 998552).
            File <strong className="text-amber-400">GSTR-1</strong> by{" "}
            <strong className="text-amber-400">11th of next month</strong>. Ensure GSTIN is on all invoices for ITC eligibility.
          </p>
        </motion.div>

        {/* Summary cards */}
        <motion.div
          className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                    {card.label}
                  </span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className={`text-2xl font-extrabold ${card.textColor}`}>{card.short}</p>
                <p className="mt-1 text-xs text-white/30">{card.value}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Table card */}
        <motion.div
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
        >
          {/* Table header toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
            <h2 className="font-bold text-white">
              Invoice Line Items
              <span className="ml-2 text-sm font-normal text-white/40">
                {selectedMonth}
              </span>
            </h2>
            {/* Status filter */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    statusFilter === opt.value
                      ? "bg-[#00d084] text-[#0a1628] shadow"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-white/3 border-b border-white/10">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/40">Invoice No</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/40">Date</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/40">Client</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/40">Trip</th>
                  <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/40">Base Amt</th>
                  <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/40">GST 5%</th>
                  <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/40">Total</th>
                  <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-white/30">
                      No invoices match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr
                      key={row.invoiceNo}
                      className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                        idx % 2 === 1 ? "bg-white/2" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-[#00d084]">{row.invoiceNo}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/60">{formatDate(row.date)}</td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-white">{row.client}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-white/50 leading-snug">{row.trip}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm text-white/70">
                        ₹{row.baseAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm text-blue-400">
                        ₹{row.gst.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm font-bold text-white">
                        ₹{row.total.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Totals row */}
              {filteredRows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-[#00d084]/30 bg-[#00d084]/5">
                    <td className="px-5 py-4 text-xs font-black uppercase tracking-widest text-[#00d084]" colSpan={4}>
                      Total ({filteredRows.length} invoice{filteredRows.length !== 1 ? "s" : ""})
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm font-bold text-white">
                      ₹{totals.base.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm font-bold text-blue-400">
                      ₹{totals.gst.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm font-bold text-emerald-400">
                      ₹{totals.total.toLocaleString("en-IN")}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </motion.div>

        {/* Footer note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center">
          <Info className="h-3.5 w-3.5 text-white/20" />
          <p className="text-xs text-white/25">
            Share this report with your CA. GST figures rounded to nearest rupee. For queries:{" "}
            <a href="mailto:support@travelsuite.in" className="text-[#00d084]/60 hover:text-[#00d084]">
              support@travelsuite.in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
