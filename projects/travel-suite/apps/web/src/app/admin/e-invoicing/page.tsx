"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";
import { RefreshCw, FileCheck, XCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";

type EInvoiceStatus = "pending" | "generated" | "acknowledged" | "failed" | "cancelled" | null;

type InvoiceWithEInvoice = {
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
  } | null;
};

export default function EInvoicingDashboardPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceWithEInvoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<EInvoiceStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const authHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, [supabase]);

  const loadInvoices = useCallback(
    async (showRefreshToast = false) => {
      try {
        setRefreshing(true);
        const headers = await authHeaders();
        const response = await fetch("/api/invoices?limit=100", { headers, cache: "no-store" });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load invoices");
        }

        const list = (payload?.invoices || []) as InvoiceWithEInvoice[];
        setInvoices(list);

        if (showRefreshToast) {
          toast({
            title: "Invoices refreshed",
            description: "E-invoice data is up to date.",
            variant: "success"
          });
        }
      } catch (error) {
        toast({
          title: "Failed to load invoices",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "error",
        });
      } finally {
        setRefreshing(false);
      }
    },
    [authHeaders, toast]
  );

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadInvoices();
      } catch (error) {
        if (mounted) {
          toast({
            title: "Failed to load dashboard",
            description: error instanceof Error ? error.message : "Unknown error",
            variant: "error",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [loadInvoices, toast]);

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

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

    return filtered;
  }, [invoices, statusFilter, searchQuery]);

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
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 bg-gray-900/30 rounded-md">
          <Clock className="w-3 h-3" />
          Not Generated
        </span>
      );
    }

    const badges = {
      pending: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-400 bg-yellow-900/30 rounded-md">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      ),
      generated: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-400 bg-blue-900/30 rounded-md">
          <FileCheck className="w-3 h-3" />
          Generated
        </span>
      ),
      acknowledged: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-400 bg-green-900/30 rounded-md">
          <CheckCircle2 className="w-3 h-3" />
          Acknowledged
        </span>
      ),
      failed: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-400 bg-red-900/30 rounded-md">
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      ),
      cancelled: (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 bg-gray-900/30 rounded-md">
          <XCircle className="w-3 h-3" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading e-invoicing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">E-Invoicing Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage GST e-invoices and IRP compliance
          </p>
        </div>
        <GlassButton
          onClick={() => void loadInvoices(true)}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </GlassButton>
      </div>

      {/* Status Filter Tabs */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter("acknowledged")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === "acknowledged"
                ? "bg-green-600 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            Acknowledged ({statusCounts.acknowledged})
          </button>
          <button
            onClick={() => setStatusFilter("generated")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === "generated"
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            Generated ({statusCounts.generated})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setStatusFilter("failed")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === "failed"
                ? "bg-red-600 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            Failed ({statusCounts.failed})
          </button>
          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === "cancelled"
                ? "bg-gray-600 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            Cancelled ({statusCounts.cancelled})
          </button>
        </div>
      </GlassCard>

      {/* Search */}
      <GlassCard className="p-4">
        <input
          type="text"
          placeholder="Search by invoice number or IRN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 text-sm text-white placeholder-gray-400 bg-transparent border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </GlassCard>

      {/* Invoice List */}
      <GlassCard className="overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-12 text-center">
            <FileCheck className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-sm text-gray-400">
              {searchQuery.trim() || statusFilter !== "all"
                ? "No invoices match your filters"
                : "No invoices found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                    Invoice Number
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                    Client
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-right text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                    E-Invoice Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                    IRN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-4 font-medium text-white whitespace-nowrap">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-4 text-gray-300 whitespace-nowrap">
                      {invoice.client_snapshot?.full_name || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-300 whitespace-nowrap">
                      {formatDate(invoice.issued_at)}
                    </td>
                    <td className="px-4 py-4 font-medium text-right text-white whitespace-nowrap">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.e_invoice_status)}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400 font-mono max-w-[200px] truncate">
                      {invoice.irn || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase">Total Invoices</p>
              <p className="mt-1 text-2xl font-bold text-white">{statusCounts.all}</p>
            </div>
            <FileCheck className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase">Acknowledged</p>
              <p className="mt-1 text-2xl font-bold text-green-400">{statusCounts.acknowledged}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase">Failed</p>
              <p className="mt-1 text-2xl font-bold text-red-400">{statusCounts.failed}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
