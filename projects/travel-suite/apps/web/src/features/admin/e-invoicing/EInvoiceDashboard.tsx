"use client";

import { cn } from "@/lib/utils";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassCard } from "@/components/glass/GlassCard";
import {
  FileCheck,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Ban,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { useState, useMemo } from "react";

type EInvoiceStatus = "pending" | "generated" | "acknowledged" | "failed" | "cancelled" | null;

export interface EInvoiceData {
  id: string;
  invoice_number: string;
  issued_at: string | null;
  total_amount: number;
  currency: string;
  status: string;
  irn: string | null;
  e_invoice_status: EInvoiceStatus;
  e_invoice_error: string | null;
  e_invoice_generated_at: string | null;
  e_invoice_acknowledged_at: string | null;
  e_invoice_cancelled_at: string | null;
  client_snapshot: {
    full_name: string | null;
    email?: string | null;
  } | null;
}

interface EInvoiceDashboardProps {
  invoices: EInvoiceData[];
  loading?: boolean;
  onGenerateEInvoice?: (invoiceId: string) => void;
  onCancelEInvoice?: (invoiceId: string) => void;
  onRefresh?: () => void;
  generatingId?: string | null;
  cancellingId?: string | null;
}

export function EInvoiceDashboard({
  invoices,
  loading = false,
  onGenerateEInvoice,
  onCancelEInvoice,
  onRefresh,
  generatingId = null,
  cancellingId = null,
}: EInvoiceDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<EInvoiceStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter invoices based on all filters
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Filter by e-invoice status
    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.e_invoice_status === statusFilter);
    }

    // Filter by search query (invoice number or IRN)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(query) ||
          (inv.irn && inv.irn.toLowerCase().includes(query))
      );
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((inv) => {
        if (!inv.issued_at) return false;
        return new Date(inv.issued_at) >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((inv) => {
        if (!inv.issued_at) return false;
        return new Date(inv.issued_at) <= toDate;
      });
    }

    return filtered;
  }, [invoices, statusFilter, searchQuery, dateFrom, dateTo]);

  // Calculate status counts for filter tabs
  const statusCounts = useMemo(() => {
    const counts = {
      all: invoices.length,
      pending: 0,
      generated: 0,
      acknowledged: 0,
      failed: 0,
      cancelled: 0,
      none: 0,
    };

    invoices.forEach((inv) => {
      if (inv.e_invoice_status) {
        counts[inv.e_invoice_status] += 1;
      } else {
        counts.none += 1;
      }
    });

    return counts;
  }, [invoices]);

  const getStatusBadge = (status: EInvoiceStatus) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-600">
          <Clock className="h-3 w-3" />
          Not Generated
        </span>
      );
    }

    const badges = {
      pending: (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-yellow-700">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      ),
      generated: (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-blue-700">
          <FileCheck className="h-3 w-3" />
          Generated
        </span>
      ),
      acknowledged: (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-green-700">
          <CheckCircle2 className="h-3 w-3" />
          Acknowledged
        </span>
      ),
      failed: (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-red-700">
          <AlertCircle className="h-3 w-3" />
          Failed
        </span>
      ),
      cancelled: (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-600">
          <XCircle className="h-3 w-3" />
          Cancelled
        </span>
      ),
    };

    return badges[status] || null;
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const canGenerate = (invoice: EInvoiceData) => {
    return (
      !invoice.irn &&
      (!invoice.e_invoice_status || invoice.e_invoice_status === "failed")
    );
  };

  const canCancel = (invoice: EInvoiceData) => {
    return (
      invoice.irn &&
      invoice.e_invoice_status &&
      ["generated", "acknowledged"].includes(invoice.e_invoice_status)
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-[120px] animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
            statusFilter === "all"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          All ({statusCounts.all})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("acknowledged")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
            statusFilter === "acknowledged"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          Acknowledged ({statusCounts.acknowledged})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("generated")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
            statusFilter === "generated"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          Generated ({statusCounts.generated})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
            statusFilter === "pending"
              ? "border-yellow-200 bg-yellow-50 text-yellow-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          Pending ({statusCounts.pending})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("failed")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
            statusFilter === "failed"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          Failed ({statusCounts.failed})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("cancelled")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
            statusFilter === "cancelled"
              ? "border-slate-300 bg-slate-100 text-slate-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          Cancelled ({statusCounts.cancelled})
        </button>
      </div>

      {/* Search and Date Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <GlassInput
              type="text"
              placeholder="Search by invoice number or IRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <GlassButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "More Filters"}
          </GlassButton>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Date From
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-10 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Date To
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-10 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            {(dateFrom || dateTo || searchQuery) && (
              <div className="md:col-span-2">
                <GlassButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setSearchQuery("");
                  }}
                  className="w-full"
                >
                  Clear Filters
                </GlassButton>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <GlassCard className="p-8">
          <div className="text-center">
            <FileCheck className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No invoices found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {searchQuery.trim() || statusFilter !== "all" || dateFrom || dateTo
                ? "Try adjusting your filters"
                : "Create your first e-invoice to get started"}
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filteredInvoices.map((invoice) => (
            <GlassCard key={invoice.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {invoice.invoice_number}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {invoice.client_snapshot?.full_name ||
                          invoice.client_snapshot?.email ||
                          "Walk-in"}
                      </p>
                    </div>
                    <div className="shrink-0">{getStatusBadge(invoice.e_invoice_status)}</div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(invoice.issued_at)}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </span>
                  </div>

                  {invoice.irn && (
                    <div className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        IRN
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-700">
                        {invoice.irn}
                      </p>
                    </div>
                  )}

                  {invoice.e_invoice_error && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                        Error
                      </p>
                      <p className="mt-0.5 text-xs text-red-700">
                        {invoice.e_invoice_error}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex shrink-0 flex-col gap-2">
                  {canGenerate(invoice) && onGenerateEInvoice && (
                    <GlassButton
                      type="button"
                      size="sm"
                      onClick={() => onGenerateEInvoice(invoice.id)}
                      disabled={generatingId === invoice.id}
                      className="whitespace-nowrap"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {generatingId === invoice.id ? "Generating..." : "Generate"}
                    </GlassButton>
                  )}

                  {canCancel(invoice) && onCancelEInvoice && (
                    <GlassButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelEInvoice(invoice.id)}
                      disabled={cancellingId === invoice.id}
                      className="whitespace-nowrap"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      {cancellingId === invoice.id ? "Cancelling..." : "Cancel"}
                    </GlassButton>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {filteredInvoices.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Showing {filteredInvoices.length} of {invoices.length} invoice
              {invoices.length === 1 ? "" : "s"}
            </span>
            {statusFilter !== "all" && (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                View all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
