"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useAvailableAddOnsCatalog,
  useCreateTripInvoice,
  useCreateTripAddOn,
  useUpdateTripAddOn,
} from "@/lib/queries/trip-detail";
import { authedFetch } from "@/lib/api/authed-fetch";
import type {
  Trip,
  TripAddOn,
  TripInvoiceSummaryData,
  TripPayment,
  TripPricing,
} from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FinancialsTabProps {
  trip: Trip;
  invoiceSummary: TripInvoiceSummaryData | null;
  onPricingChange?: (pricing: TripPricing) => void;
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

function sanitizeInvoiceLines(
  lines: readonly InvoiceFormLine[] | undefined,
): readonly InvoiceFormLine[] {
  if (!lines || lines.length === 0) return [createEmptyLine()];

  const normalized = lines
    .map((line) => ({
      description: line.description.trim(),
      quantity: Number.isFinite(line.quantity) && line.quantity > 0 ? line.quantity : 1,
      unit_price:
        Number.isFinite(line.unit_price) && line.unit_price >= 0 ? line.unit_price : 0,
      tax_rate: Number.isFinite(line.tax_rate) && line.tax_rate >= 0 ? line.tax_rate : 0,
    }))
    .filter((line) => line.description !== "" || line.unit_price > 0);

  return normalized.length > 0 ? normalized : [createEmptyLine()];
}

function buildInvoiceDraftLines(
  trip: Trip,
  packagePricing: PackagePricing | null,
  addOns: readonly TripAddOn[],
): readonly InvoiceFormLine[] {
  const title =
    trip.itineraries?.trip_title?.trim() ||
    trip.itineraries?.raw_data?.trip_title?.trim() ||
    trip.destination?.trim() ||
    "Tour package";

  const packageLine =
    typeof packagePricing?.total_cost === "number" && packagePricing.total_cost > 0
      ? {
          description: `${title} package`,
          quantity: 1,
          unit_price: packagePricing.total_cost,
          tax_rate: 0,
        }
      : typeof packagePricing?.per_person_cost === "number" && packagePricing.per_person_cost > 0
        ? {
            description: `${title} package (per traveler)`,
            quantity:
              typeof packagePricing.pax_count === "number" && packagePricing.pax_count > 0
                ? packagePricing.pax_count
                : 1,
            unit_price: packagePricing.per_person_cost,
            tax_rate: 0,
          }
        : null;

  const selectedAddOnLines = addOns
    .filter((addOn) => addOn.is_selected && addOn.unit_price > 0)
    .map((addOn) => ({
      description: addOn.name.trim() || "Add-on",
      quantity: addOn.quantity > 0 ? addOn.quantity : 1,
      unit_price: addOn.unit_price,
      tax_rate: 0,
    }));

  return sanitizeInvoiceLines(
    packageLine ? [packageLine, ...selectedAddOnLines] : selectedAddOnLines,
  );
}

function buildInvoiceDraftNotes(
  packagePricing: PackagePricing | null,
  addOns: readonly TripAddOn[],
): string {
  const notes: string[] = [];
  const packageNotes = packagePricing?.notes?.trim();
  if (packageNotes) notes.push(packageNotes);

  const selectedAddOnDetails = addOns
    .filter((addOn) => addOn.is_selected && addOn.description?.trim())
    .map((addOn) => `${addOn.name}: ${addOn.description?.trim()}`);

  if (selectedAddOnDetails.length > 0) {
    notes.push(`Add-ons:\n${selectedAddOnDetails.join("\n")}`);
  }

  return notes.join("\n\n").trim();
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

interface PackagePricing {
  per_person_cost?: number;
  total_cost?: number;
  currency?: string;
  pax_count?: number;
  notes?: string;
}

function formatPackageCurrency(amount: number, currency?: string): string {
  const code = currency?.toUpperCase() ?? "INR";
  if (code === "INR") return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  if (code === "USD") return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (code === "THB") return `฿${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${code} ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
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

function buildPackageRevenueKpis(pricing: PackagePricing): readonly RevenueKpi[] {
  return [
    {
      label: "Quoted Total",
      value:
        typeof pricing.total_cost === "number"
          ? formatPackageCurrency(pricing.total_cost, pricing.currency)
          : "Not set",
      icon: IndianRupee,
      color: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Per Person",
      value:
        typeof pricing.per_person_cost === "number"
          ? formatPackageCurrency(pricing.per_person_cost, pricing.currency)
          : "Not set",
      icon: CheckCircle,
      color: "text-sky-600",
      iconBg: "bg-sky-50",
    },
    {
      label: "Travelers",
      value:
        typeof pricing.pax_count === "number" ? String(pricing.pax_count) : "Not set",
      icon: TrendingUp,
      color: "text-violet-600",
      iconBg: "bg-violet-50",
    },
    {
      label: "Outstanding Balance",
      value:
        typeof pricing.total_cost === "number"
          ? formatPackageCurrency(pricing.total_cost, pricing.currency)
          : "Not set",
      icon: AlertCircle,
      color: "text-amber-600",
      iconBg: "bg-amber-50",
    },
  ];
}

function RevenueBreakdownCard({
  invoiceSummary,
  packagePricing,
}: {
  invoiceSummary: TripInvoiceSummaryData | null;
  packagePricing?: PackagePricing | null;
}) {
  if (!invoiceSummary && !packagePricing) {
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

  const kpis = invoiceSummary
    ? buildRevenueKpis(invoiceSummary)
    : buildPackageRevenueKpis(packagePricing!);

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
  initialLines,
  initialNotes,
}: {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  clientId: string | null;
  initialLines?: readonly InvoiceFormLine[];
  initialNotes?: string;
}) {
  const { toast } = useToast();
  const createInvoice = useCreateTripInvoice();
  const wasOpenRef = useRef(false);

  const [lines, setLines] = useState<readonly InvoiceFormLine[]>(() =>
    sanitizeInvoiceLines(initialLines),
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState(initialNotes?.trim() ?? "");

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setLines(sanitizeInvoiceLines(initialLines));
      setNotes(initialNotes?.trim() ?? "");
      setDueDate("");
    }

    wasOpenRef.current = isOpen;
  }, [initialLines, initialNotes, isOpen]);

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
        notes: notes.trim() || undefined,
      });

      toast({ title: "Invoice created successfully", variant: "success" });
      setLines([createEmptyLine()]);
      setDueDate("");
      setNotes("");
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create invoice";
      toast({ title: message, variant: "error" });
    }
  }, [clientId, createInvoice, dueDate, lines, notes, onClose, toast, tripId]);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Invoice"
      description="Review the prefilled trip charges, edit anything you need, then create the invoice."
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

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
            Invoice Notes
          </label>
          <textarea
            rows={4}
            placeholder="Add package details or payment notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
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

export function FinancialsTab({
  trip,
  invoiceSummary,
  onPricingChange,
}: FinancialsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [convertingCurrency, setConvertingCurrency] = useState(false);
  const autoConvertedPricingRef = useRef<string | null>(null);
  const { toast } = useToast();

  const invoicesQuery = useTripInvoices(trip.id);
  const addOnsQuery = useTripAddOns(trip.id);
  const catalogQuery = useAvailableAddOnsCatalog();
  const updateAddOn = useUpdateTripAddOn();
  const createAddOn = useCreateTripAddOn();

  const invoices = useMemo(
    () => invoicesQuery.data?.invoices ?? [],
    [invoicesQuery.data?.invoices]
  );
  const addOns = addOnsQuery.data?.addOns ?? [];
  const availableAddOns = catalogQuery.data?.addOns ?? [];

  const recentPayments = useMemo(
    () => collectRecentPayments(invoices),
    [invoices]
  );

  const packagePricing = trip.itineraries?.raw_data?.pricing ?? null;
  const itineraryId = trip.itineraries?.id ?? null;
  const prefilledInvoiceLines = useMemo(
    () => buildInvoiceDraftLines(trip, packagePricing, addOns),
    [addOns, packagePricing, trip],
  );
  const prefilledInvoiceNotes = useMemo(
    () => buildInvoiceDraftNotes(packagePricing, addOns),
    [addOns, packagePricing],
  );

  const handlePricingChange = useCallback(
    (pricing: TripPricing) => {
      onPricingChange?.({
        ...pricing,
        currency: pricing.currency?.trim().toUpperCase() || "INR",
      });
    },
    [onPricingChange],
  );

  const handleConvertPricingToINR = useCallback(async () => {
    if (!packagePricing || !onPricingChange) return;

    const sourceCurrency = packagePricing.currency?.toUpperCase();
    if (!sourceCurrency || sourceCurrency === "INR") return;

    setConvertingCurrency(true);
    try {
      const [totalResponse, perPersonResponse] = await Promise.all([
        typeof packagePricing.total_cost === "number"
          ? authedFetch(
              `/api/currency?amount=${packagePricing.total_cost}&from=${sourceCurrency}&to=INR`,
            ).then((res) => (res.ok ? res.json() : null))
          : Promise.resolve(null),
        typeof packagePricing.per_person_cost === "number"
          ? authedFetch(
              `/api/currency?amount=${packagePricing.per_person_cost}&from=${sourceCurrency}&to=INR`,
            ).then((res) => (res.ok ? res.json() : null))
          : Promise.resolve(null),
      ]);

      onPricingChange({
        ...packagePricing,
        total_cost:
          totalResponse && typeof totalResponse.result === "number"
            ? Math.round(totalResponse.result)
            : packagePricing.total_cost,
        per_person_cost:
          perPersonResponse && typeof perPersonResponse.result === "number"
            ? Math.round(perPersonResponse.result)
            : packagePricing.per_person_cost,
        currency: "INR",
      });

      toast({
        title: "Converted pricing to INR",
        description: "Review the values and click Save Changes to persist them.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Currency conversion failed",
        description: error instanceof Error ? error.message : "Could not convert pricing right now.",
        variant: "error",
      });
    } finally {
      setConvertingCurrency(false);
    }
  }, [onPricingChange, packagePricing, toast]);

  useEffect(() => {
    if (!packagePricing || !onPricingChange || !itineraryId) return;
    if ((packagePricing.currency ?? "INR").toUpperCase() === "INR") return;
    if (autoConvertedPricingRef.current === itineraryId) return;
    autoConvertedPricingRef.current = itineraryId;
    void handleConvertPricingToINR();
  }, [handleConvertPricingToINR, itineraryId, onPricingChange, packagePricing]);

  const handleOpenCreate = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleAddOnToggle = useCallback(
    (addOnId: string, isSelected: boolean) => {
      updateAddOn.mutate(
        { tripId: trip.id, addOnId, is_selected: isSelected },
        {
          onError: (error) =>
            toast({
              title: "Failed to update add-on",
              description: error instanceof Error ? error.message : "Try again.",
              variant: "error",
            }),
        },
      );
    },
    [toast, trip.id, updateAddOn],
  );

  const handleAddOnQuantityChange = useCallback(
    (addOnId: string, quantity: number) => {
      updateAddOn.mutate(
        { tripId: trip.id, addOnId, quantity },
        {
          onError: (error) =>
            toast({
              title: "Failed to update quantity",
              description: error instanceof Error ? error.message : "Try again.",
              variant: "error",
            }),
        },
      );
    },
    [toast, trip.id, updateAddOn],
  );

  const handleAddOnUnitPriceChange = useCallback(
    (addOnId: string, unitPrice: number) => {
      updateAddOn.mutate(
        { tripId: trip.id, addOnId, unit_price: unitPrice },
        {
          onError: (error) =>
            toast({
              title: "Failed to update price",
              description: error instanceof Error ? error.message : "Try again.",
              variant: "error",
            }),
        },
      );
    },
    [toast, trip.id, updateAddOn],
  );

  const handleCreateAddOn = useCallback(
    async (input: {
      name: string;
      category: string;
      unit_price: number;
      quantity: number;
      description?: string;
    }) => {
      try {
        await createAddOn.mutateAsync({
          tripId: trip.id,
          ...input,
          is_selected: true,
        });
        toast({
          title: "Add-on created",
          description: "The extra is now available on this trip.",
          variant: "success",
        });
        return true;
      } catch (error) {
        toast({
          title: "Could not add extra",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "error",
        });
        return false;
      }
    },
    [createAddOn, toast, trip.id],
  );

  const handleAttachCatalogAddOn = useCallback(
    async (input: { addOnId: string; quantity: number }) => {
      try {
        await createAddOn.mutateAsync({
          tripId: trip.id,
          addOnId: input.addOnId,
          quantity: input.quantity,
          is_selected: true,
        });
        toast({
          title: "Add-on attached",
          description: "The catalog add-on is now linked to this trip.",
          variant: "success",
        });
        return true;
      } catch (error) {
        toast({
          title: "Could not attach add-on",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "error",
        });
        return false;
      }
    },
    [createAddOn, toast, trip.id],
  );

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <TripFinancialSummary
            invoiceSummary={invoiceSummary}
            packagePricing={packagePricing}
            loading={invoicesQuery.isLoading}
            onPackagePricingChange={handlePricingChange}
            onConvertToINR={handleConvertPricingToINR}
            convertingCurrency={convertingCurrency}
          />

          <RevenueBreakdownCard
            invoiceSummary={invoiceSummary}
            packagePricing={packagePricing}
          />

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
            availableAddOns={availableAddOns}
            loading={addOnsQuery.isLoading}
            onToggle={handleAddOnToggle}
            onQuantityChange={handleAddOnQuantityChange}
            onUnitPriceChange={handleAddOnUnitPriceChange}
            onCreateAddOn={handleCreateAddOn}
            onAttachCatalogAddOn={handleAttachCatalogAddOn}
            saving={createAddOn.isPending || updateAddOn.isPending || catalogQuery.isLoading}
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
        initialLines={prefilledInvoiceLines}
        initialNotes={prefilledInvoiceNotes}
      />
    </>
  );
}
