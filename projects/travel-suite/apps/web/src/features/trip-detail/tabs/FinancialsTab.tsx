"use client";

import { useCallback, useMemo, useState } from "react";
import {
  IndianRupee,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Calendar,
  PieChart,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { TripFinancialSummary } from "@/features/trip-detail/components/TripFinancialSummary";
import { TripInvoiceSection } from "@/features/trip-detail/components/TripInvoiceSection";
import { TripAddOnsEditor } from "@/features/trip-detail/components/TripAddOnsEditor";
import { formatINR, formatDate } from "@/features/trip-detail/utils";
import { useToast } from "@/components/ui/toast";
import {
  useTripInvoices,
  useTripAddOns,
  useCreateTripInvoice,
} from "@/lib/queries/trip-detail";
import type { Trip, TripInvoiceSummaryData, TripPayment } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FinancialsTabProps {
  trip: Trip;
  invoiceSummary: TripInvoiceSummaryData | null;
}

// ---------------------------------------------------------------------------
// Create Invoice Form State
// ---------------------------------------------------------------------------

interface InvoiceFormLine {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

const EMPTY_LINE: InvoiceFormLine = {
  description: "",
  quantity: 1,
  unit_price: 0,
  tax_rate: 0,
};

function createEmptyLine(): InvoiceFormLine {
  return { ...EMPTY_LINE };
}

// ---------------------------------------------------------------------------
// Section Header (local helper)
// ---------------------------------------------------------------------------

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: typeof IndianRupee;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Breakdown Card
// ---------------------------------------------------------------------------

interface RevenueKpi {
  label: string;
  value: string;
  icon: typeof IndianRupee;
  color: string;
  iconBg: string;
}

function buildRevenueKpis(summary: TripInvoiceSummaryData): readonly RevenueKpi[] {
  const collectionRate =
    summary.total_amount > 0
      ? Math.round((summary.paid_amount / summary.total_amount) * 100)
      : 0;

  return [
    {
      label: "Total Invoiced",
      value: formatINR(summary.total_amount),
      icon: IndianRupee,
      color: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Amount Collected",
      value: formatINR(summary.paid_amount),
      icon: CheckCircle,
      color: "text-sky-600",
      iconBg: "bg-sky-50",
    },
    {
      label: "Outstanding Balance",
      value: formatINR(summary.balance_amount),
      icon: AlertCircle,
      color: "text-rose-600",
      iconBg: "bg-rose-50",
    },
    {
      label: "Collection Rate",
      value: `${collectionRate}%`,
      icon: TrendingUp,
      color: collectionRate >= 75 ? "text-emerald-600" : "text-amber-600",
      iconBg: collectionRate >= 75 ? "bg-emerald-50" : "bg-amber-50",
    },
  ];
}

function RevenueBreakdownCard({
  invoiceSummary,
}: {
  invoiceSummary: TripInvoiceSummaryData | null;
}) {
  if (!invoiceSummary) {
    return (
      <GlassCard padding="xl">
        <SectionHeader icon={PieChart} label="Revenue Breakdown" />
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <PieChart className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">
            No revenue data yet
          </p>
        </div>
      </GlassCard>
    );
  }

  const kpis = buildRevenueKpis(invoiceSummary);

  return (
    <GlassCard padding="xl">
      <SectionHeader icon={PieChart} label="Revenue Breakdown" />
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

// ---------------------------------------------------------------------------
// Payment Summary Card
// ---------------------------------------------------------------------------

function PaymentSummaryCard({ payments }: { payments: readonly TripPayment[] }) {
  const recentPayments = payments.slice(0, 5);

  return (
    <GlassCard padding="xl">
      <SectionHeader icon={CreditCard} label="Recent Payments" />
      {recentPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CreditCard className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">
            No payments recorded
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-xl border border-white/40 bg-white/30 dark:bg-slate-800/30 dark:border-slate-700/40 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-secondary dark:text-white tabular-nums">
                  {formatINR(payment.amount)}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(payment.payment_date)}</span>
                  {payment.method && (
                    <GlassBadge variant="secondary" size="sm">
                      {payment.method}
                    </GlassBadge>
                  )}
                </div>
              </div>
              <GlassBadge
                variant={payment.status === "completed" ? "success" : "warning"}
                size="sm"
              >
                {payment.status}
              </GlassBadge>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Create Invoice Modal
// ---------------------------------------------------------------------------

function CreateInvoiceModal({
  isOpen,
  onClose,
  tripId,
  clientId,
}: {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  clientId: string | null;
}) {
  const { toast } = useToast();
  const createInvoice = useCreateTripInvoice();

  const [lines, setLines] = useState<readonly InvoiceFormLine[]>([
    createEmptyLine(),
  ]);
  const [dueDate, setDueDate] = useState("");

  const handleAddLine = useCallback(() => {
    setLines((prev) => [...prev, createEmptyLine()]);
  }, []);

  const handleRemoveLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleLineChange = useCallback(
    (index: number, field: keyof InvoiceFormLine, value: string | number) => {
      setLines((prev) =>
        prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    const validLines = lines.filter(
      (l) => l.description.trim() !== "" && l.unit_price > 0
    );

    if (validLines.length === 0) {
      toast({
        title: "Please add at least one line item",
        variant: "warning",
      });
      return;
    }

    try {
      await createInvoice.mutateAsync({
        tripId,
        clientId,
        items: validLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate > 0 ? l.tax_rate : undefined,
        })),
        dueDate: dueDate || undefined,
      });

      toast({ title: "Invoice created successfully", variant: "success" });
      setLines([createEmptyLine()]);
      setDueDate("");
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create invoice";
      toast({ title: message, variant: "error" });
    }
  }, [lines, dueDate, tripId, clientId, createInvoice, toast, onClose]);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Invoice"
      description="Add line items for this trip invoice."
      size="lg"
    >
      <div className="space-y-4">
        {/* Due date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Line items */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Line Items
          </label>
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-end"
              >
                <div className="col-span-5">
                  {idx === 0 && (
                    <span className="text-[10px] text-text-muted">
                      Description
                    </span>
                  )}
                  <input
                    type="text"
                    placeholder="Item description"
                    value={line.description}
                    onChange={(e) =>
                      handleLineChange(idx, "description", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-white/40 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2">
                  {idx === 0 && (
                    <span className="text-[10px] text-text-muted">Qty</span>
                  )}
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      handleLineChange(
                        idx,
                        "quantity",
                        parseInt(e.target.value, 10) || 1
                      )
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-white/40 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-3">
                  {idx === 0 && (
                    <span className="text-[10px] text-text-muted">
                      Unit Price
                    </span>
                  )}
                  <input
                    type="number"
                    min={0}
                    value={line.unit_price}
                    onChange={(e) =>
                      handleLineChange(
                        idx,
                        "unit_price",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-white/40 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="col-span-2 flex gap-1">
                  {lines.length > 1 && (
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-xs px-2"
                    >
                      Remove
                    </GlassButton>
                  )}
                </div>
              </div>
            ))}
          </div>
          <GlassButton
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleAddLine}
          >
            + Add Line
          </GlassButton>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/30 dark:border-slate-700/30">
          <GlassButton variant="ghost" size="md" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            loading={createInvoice.isPending}
            onClick={handleSubmit}
          >
            Create Invoice
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}

// ---------------------------------------------------------------------------
// Collect all payments from invoices
// ---------------------------------------------------------------------------

function collectRecentPayments(
  invoices: readonly { payments: readonly TripPayment[] }[]
): readonly TripPayment[] {
  return [...invoices.flatMap((inv) => inv.payments)].sort(
    (a, b) =>
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function FinancialsTab({ trip, invoiceSummary }: FinancialsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const invoicesQuery = useTripInvoices(trip.id);
  const addOnsQuery = useTripAddOns(trip.id);

  const invoices = useMemo(
    () => invoicesQuery.data?.invoices ?? [],
    [invoicesQuery.data?.invoices]
  );
  const addOns = addOnsQuery.data?.addOns ?? [];

  const recentPayments = useMemo(
    () => collectRecentPayments(invoices),
    [invoices]
  );

  const handleOpenCreate = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  // Add-on handlers (optimistic local state is not needed since these
  // are informational toggles; the parent or API would persist changes)
  const handleAddOnToggle = useCallback(
    (_addOnId: string, _isSelected: boolean) => {
      // Future: call mutation to toggle add-on selection
    },
    []
  );

  const handleAddOnQuantityChange = useCallback(
    (_addOnId: string, _quantity: number) => {
      // Future: call mutation to update add-on quantity
    },
    []
  );

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <TripFinancialSummary
            invoiceSummary={invoiceSummary}
            loading={invoicesQuery.isLoading}
          />

          <RevenueBreakdownCard invoiceSummary={invoiceSummary} />

          <TripInvoiceSection
            tripId={trip.id}
            clientId={trip.client_id ?? null}
            invoices={invoices}
            loading={invoicesQuery.isLoading}
            onCreateInvoice={handleOpenCreate}
          />
        </div>

        {/* Right column */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <TripAddOnsEditor
            addOns={addOns}
            loading={addOnsQuery.isLoading}
            onToggle={handleAddOnToggle}
            onQuantityChange={handleAddOnQuantityChange}
          />

          <PaymentSummaryCard payments={recentPayments} />
        </div>
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={handleCloseCreate}
        tripId={trip.id}
        clientId={trip.client_id ?? null}
      />
    </>
  );
}
