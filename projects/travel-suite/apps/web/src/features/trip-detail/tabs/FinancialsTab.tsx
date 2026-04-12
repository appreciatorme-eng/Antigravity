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
  RefreshCw,
  FileText,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { TripInvoiceSection } from "@/features/trip-detail/components/TripInvoiceSection";
import { TripAddOnsEditor } from "@/features/trip-detail/components/TripAddOnsEditor";
import { formatINR, formatDate } from "@/features/trip-detail/utils";
import { useToast } from "@/components/ui/toast";
import {
  useTripInvoices,
  useTripInvoiceDetail,
  useTripAddOns,
  useAvailableAddOnsCatalog,
  useCreateTripInvoice,
  useCreateTripAddOn,
  tripDetailKeys,
  useSaveTripItinerary,
  useUpdateTripInvoice,
  useUpdateTripAddOn,
} from "@/lib/queries/trip-detail";
import { authedFetch } from "@/lib/api/authed-fetch";
import { INDIAN_STATES } from "@/lib/tax/gst-calculator";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Trip,
  TripAddOn,
  TripFinancialPaymentSource,
  TripFinancialPaymentStatus,
  TripFinancialSummaryConfig,
  TripInvoice,
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
  onFinancialSummaryChange?: (summary: TripFinancialSummaryConfig) => void;
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

const DEFAULT_GST_RATE = 18;

interface InvoiceEditorSeed {
  lines: readonly InvoiceFormLine[];
  dueDate: string;
  notes: string;
  gstEnabled: boolean;
  placeOfSupply: string;
  sacCode: string;
  currency: string;
}

function buildCreateInvoiceSeed(
  initialLines?: readonly InvoiceFormLine[],
  initialNotes?: string,
): InvoiceEditorSeed {
  return {
    lines: sanitizeInvoiceLines(initialLines),
    dueDate: "",
    notes: initialNotes?.trim() ?? "",
    gstEnabled: false,
    placeOfSupply: "",
    sacCode: "998314",
    currency: "INR",
  };
}

function buildEditInvoiceSeed(invoice: TripInvoice): InvoiceEditorSeed {
  const lines = sanitizeInvoiceLines(
    invoice.line_items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: typeof item.tax_rate === "number" ? item.tax_rate : 0,
    })),
  );
  const gstEnabled =
    lines.some((line) => line.tax_rate > 0) ||
    Boolean(invoice.place_of_supply) ||
    Boolean(invoice.sac_code) ||
    Boolean(invoice.cgst || invoice.sgst || invoice.igst);

  return {
    lines,
    dueDate: invoice.due_date ?? "",
    notes: invoice.notes?.trim() ?? "",
    gstEnabled,
    placeOfSupply: invoice.place_of_supply ?? "",
    sacCode: invoice.sac_code ?? "998314",
    currency: invoice.currency?.trim().toUpperCase() || "INR",
  };
}

function calculateInvoiceDraftTotals(
  lines: readonly InvoiceFormLine[],
  gstEnabled: boolean,
): { subtotal: number; tax: number; total: number } {
  let subtotal = 0;
  let tax = 0;

  for (const line of lines) {
    const quantity = Number.isFinite(line.quantity) && line.quantity > 0 ? line.quantity : 0;
    const unitPrice =
      Number.isFinite(line.unit_price) && line.unit_price >= 0 ? line.unit_price : 0;
    const taxRate =
      gstEnabled && Number.isFinite(line.tax_rate) && line.tax_rate >= 0 ? line.tax_rate : 0;

    const lineSubtotal = quantity * unitPrice;
    const lineTax = (lineSubtotal * taxRate) / 100;

    subtotal += lineSubtotal;
    tax += lineTax;
  }

  return {
    subtotal: Math.round((subtotal + Number.EPSILON) * 100) / 100,
    tax: Math.round((tax + Number.EPSILON) * 100) / 100,
    total: Math.round((subtotal + tax + Number.EPSILON) * 100) / 100,
  };
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

interface ResolvedFinancialState {
  paymentStatus: TripFinancialPaymentStatus;
  paymentSource: TripFinancialPaymentSource;
  manualPaidAmount: number;
  linkedInvoiceId: string | null;
  linkedInvoice: TripInvoice | null;
  quotedTotal: number | null;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes: string;
}

interface FinancialSummaryEditorCardProps {
  trip: Trip;
  packagePricing: PackagePricing | null;
  financialSummary: TripFinancialSummaryConfig | null;
  invoiceSummary: TripInvoiceSummaryData | null;
  invoices: readonly TripInvoice[];
  loading: boolean;
  convertingCurrency: boolean;
  savingFinancials: boolean;
  onPackagePricingChange?: (pricing: TripPricing) => void;
  onFinancialSummaryChange?: (summary: TripFinancialSummaryConfig) => void;
  onConvertToINR?: () => void;
  onSaveFinancials: () => void;
  onCreateInvoice: () => void;
}

function coercePositiveNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function deriveQuotedTotal(pricing: PackagePricing | null): number | null {
  if (!pricing) return null;
  if (typeof pricing.total_cost === "number" && pricing.total_cost > 0) {
    return pricing.total_cost;
  }
  if (
    typeof pricing.per_person_cost === "number" &&
    pricing.per_person_cost > 0 &&
    typeof pricing.pax_count === "number" &&
    pricing.pax_count > 0
  ) {
    return pricing.per_person_cost * pricing.pax_count;
  }
  return null;
}

function derivePaymentStatusFromInvoiceStatus(status: string | null | undefined): TripFinancialPaymentStatus {
  const normalized = (status || "").toLowerCase();
  if (normalized === "paid") return "paid";
  if (normalized === "partially_paid") return "partially_paid";
  if (["issued", "overdue", "pending", "sent", "confirmed"].includes(normalized)) {
    return "approved";
  }
  return "unpaid";
}

function derivePaymentStatusFromSummary(summary: TripInvoiceSummaryData | null): TripFinancialPaymentStatus {
  if (!summary) return "unpaid";
  if (summary.total_amount > 0 && summary.balance_amount <= 0) return "paid";
  if (summary.paid_amount > 0) return "partially_paid";
  if (summary.total_amount > 0) return "approved";
  return "unpaid";
}

function derivePaymentStatusFromTripStatus(status: string | null | undefined): TripFinancialPaymentStatus {
  const normalized = (status || "").toLowerCase();
  if (normalized === "paid") return "paid";
  if (normalized === "confirmed") return "approved";
  return "unpaid";
}

function formatFinancialStatusLabel(status: TripFinancialPaymentStatus): string {
  if (status === "approved") return "Approved";
  if (status === "partially_paid") return "Partially Paid";
  if (status === "paid") return "Fully Paid";
  return "Unpaid";
}

function resolveFinancialState(
  trip: Trip,
  packagePricing: PackagePricing | null,
  financialSummary: TripFinancialSummaryConfig | null,
  invoiceSummary: TripInvoiceSummaryData | null,
  invoices: readonly TripInvoice[],
): ResolvedFinancialState {
  const paymentSource = financialSummary?.payment_source ?? (invoices.length > 0 ? "linked_invoice" : "manual_cash");
  const fallbackLinkedInvoiceId =
    financialSummary?.linked_invoice_id ??
    (invoices.length === 1 ? invoices[0]?.id ?? null : null);
  const linkedInvoice =
    invoices.find((invoice) => invoice.id === fallbackLinkedInvoiceId) ??
    (invoices.length === 1 ? invoices[0] : null);
  const linkedInvoiceId = linkedInvoice?.id ?? null;
  const quotedTotal = deriveQuotedTotal(packagePricing);

  if (paymentSource === "linked_invoice") {
    if (linkedInvoice) {
      return {
        paymentStatus: derivePaymentStatusFromInvoiceStatus(linkedInvoice.status),
        paymentSource,
        manualPaidAmount: coercePositiveNumber(financialSummary?.manual_paid_amount),
        linkedInvoiceId,
        linkedInvoice,
        quotedTotal,
        totalAmount: coercePositiveNumber(linkedInvoice.total_amount),
        paidAmount: coercePositiveNumber(linkedInvoice.paid_amount),
        balanceAmount: coercePositiveNumber(linkedInvoice.balance_amount),
        notes: financialSummary?.notes?.trim() ?? "",
      };
    }

    return {
      paymentStatus: derivePaymentStatusFromSummary(invoiceSummary),
      paymentSource,
      manualPaidAmount: coercePositiveNumber(financialSummary?.manual_paid_amount),
      linkedInvoiceId: null,
      linkedInvoice: null,
      quotedTotal,
      totalAmount: coercePositiveNumber(invoiceSummary?.total_amount) || coercePositiveNumber(quotedTotal),
      paidAmount: coercePositiveNumber(invoiceSummary?.paid_amount),
      balanceAmount:
        coercePositiveNumber(invoiceSummary?.balance_amount) ||
        Math.max(
          0,
          (coercePositiveNumber(invoiceSummary?.total_amount) || coercePositiveNumber(quotedTotal)) -
            coercePositiveNumber(invoiceSummary?.paid_amount),
        ),
      notes: financialSummary?.notes?.trim() ?? "",
    };
  }

  const manualPaidAmount = coercePositiveNumber(financialSummary?.manual_paid_amount);
  const paymentStatus =
    financialSummary?.payment_status ??
    derivePaymentStatusFromTripStatus(trip.status) ??
    "unpaid";
  const totalAmount = coercePositiveNumber(quotedTotal);
  let paidAmount = manualPaidAmount;

  if (paymentStatus === "unpaid" || paymentStatus === "approved") {
    paidAmount = 0;
  } else if (paymentStatus === "paid" && totalAmount > 0 && paidAmount <= 0) {
    paidAmount = totalAmount;
  }

  const balanceAmount = totalAmount > 0 ? Math.max(0, totalAmount - paidAmount) : 0;

  return {
    paymentStatus,
    paymentSource,
    manualPaidAmount: paidAmount,
    linkedInvoiceId: null,
    linkedInvoice: null,
    quotedTotal,
    totalAmount,
    paidAmount,
    balanceAmount,
    notes: financialSummary?.notes?.trim() ?? "",
  };
}

function mapFinancialStatusToTripStatus(
  currentStatus: string | null | undefined,
  paymentStatus: TripFinancialPaymentStatus,
): string | null {
  const normalized = (currentStatus || "").toLowerCase();
  if (["active", "in_progress", "completed", "cancelled"].includes(normalized)) {
    return null;
  }
  if (paymentStatus === "approved") return "confirmed";
  if (paymentStatus === "paid") return "confirmed";
  if (paymentStatus === "partially_paid") return "confirmed";
  return "pending";
}

function FinancialSummaryEditorCard({
  trip,
  packagePricing,
  financialSummary,
  invoiceSummary,
  invoices,
  loading,
  convertingCurrency,
  savingFinancials,
  onPackagePricingChange,
  onFinancialSummaryChange,
  onConvertToINR,
  onSaveFinancials,
  onCreateInvoice,
}: FinancialSummaryEditorCardProps) {
  const resolvedPricing = packagePricing ?? {};
  const resolved = resolveFinancialState(
    trip,
    packagePricing,
    financialSummary,
    invoiceSummary,
    invoices,
  );
  const isInvoiceLinked = resolved.paymentSource === "linked_invoice";
  const effectiveStatusLabel = formatFinancialStatusLabel(resolved.paymentStatus);
  const kpis: readonly RevenueKpi[] = [
    {
      label: "Quoted Total",
      value:
        resolved.quotedTotal && resolved.quotedTotal > 0
          ? formatPackageCurrency(resolved.quotedTotal, resolvedPricing.currency)
          : "Not set",
      icon: IndianRupee,
      color: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Amount Paid",
      value: formatPackageCurrency(resolved.paidAmount, resolvedPricing.currency),
      icon: CheckCircle,
      color: "text-sky-600",
      iconBg: "bg-sky-50",
    },
    {
      label: "Balance Due",
      value: formatPackageCurrency(resolved.balanceAmount, resolvedPricing.currency),
      icon: AlertCircle,
      color: resolved.balanceAmount > 0 ? "text-rose-600" : "text-emerald-600",
      iconBg: resolved.balanceAmount > 0 ? "bg-rose-50" : "bg-emerald-50",
    },
    {
      label: "Invoices",
      value: String(invoices.length),
      icon: FileText,
      color: "text-violet-600",
      iconBg: "bg-violet-50",
    },
  ];

  if (loading) {
    return (
      <GlassCard padding="xl">
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-gray-400 animate-pulse">Loading financials...</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="xl">
      <div className="flex items-center gap-2 mb-5">
        <IndianRupee className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
          Financial Summary
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                {kpi.label}
              </p>
              <p className={`text-2xl font-black tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-4 border-t border-white/30 pt-4 dark:border-slate-700/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Payment Tracking
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <GlassBadge
                variant={
                  resolved.paymentStatus === "paid"
                    ? "success"
                    : resolved.paymentStatus === "partially_paid"
                      ? "info"
                      : resolved.paymentStatus === "approved"
                        ? "primary"
                        : "warning"
                }
                size="sm"
              >
                {effectiveStatusLabel}
              </GlassBadge>
              <GlassBadge variant="secondary" size="sm">
                {resolved.paymentSource === "linked_invoice" ? "Linked Invoice" : "Manual Cash"}
              </GlassBadge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {resolvedPricing.currency && resolvedPricing.currency.toUpperCase() !== "INR" ? (
              <GlassButton variant="outline" size="sm" loading={convertingCurrency} onClick={onConvertToINR}>
                <RefreshCw className="w-4 h-4" />
                Convert To INR
              </GlassButton>
            ) : null}
            <GlassButton variant="primary" size="sm" loading={savingFinancials} onClick={onSaveFinancials}>
              Save Financials
            </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Payment Source
            </span>
            <select
              value={resolved.paymentSource}
              onChange={(e) =>
                onFinancialSummaryChange?.({
                  ...financialSummary,
                  payment_source: e.target.value as TripFinancialPaymentSource,
                  linked_invoice_id:
                    e.target.value === "linked_invoice"
                      ? financialSummary?.linked_invoice_id ?? (invoices.length === 1 ? invoices[0]?.id ?? null : null)
                      : null,
                })
              }
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="manual_cash">Manual Cash</option>
              <option value="linked_invoice">Linked Invoice</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Payment Status
            </span>
            <select
              value={resolved.paymentStatus}
              disabled={isInvoiceLinked}
              onChange={(e) =>
                onFinancialSummaryChange?.({
                  ...financialSummary,
                  payment_status: e.target.value as TripFinancialPaymentStatus,
                })
              }
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="unpaid">Unpaid</option>
              <option value="approved">Approved</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Fully Paid</option>
            </select>
          </label>

          {isInvoiceLinked ? (
            <label className="space-y-1 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Linked Invoice
              </span>
              <select
                value={resolved.linkedInvoiceId ?? ""}
                disabled={invoices.length === 0}
                onChange={(e) =>
                  onFinancialSummaryChange?.({
                    ...financialSummary,
                    payment_source: "linked_invoice",
                    linked_invoice_id: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">{invoices.length === 0 ? "No trip invoices available" : "Select invoice"}</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} · {formatINR(invoice.total_amount)} · {invoice.status.replace("_", " ")}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-text-muted">
                  {invoices.length > 0
                    ? "This list is the same trip invoice list shown in the Invoices section below."
                    : "Create a trip invoice below first, then select it here to make the financial summary follow invoice status and payments."}
                </p>
                {invoices.length === 0 ? (
                  <GlassButton variant="outline" size="sm" onClick={onCreateInvoice}>
                    <FileText className="w-4 h-4" />
                    Create Invoice
                  </GlassButton>
                ) : null}
              </div>
            </label>
          ) : (
            <label className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Customer Paid In Cash
              </span>
              <input
                type="number"
                min={0}
                placeholder="Paid amount"
                value={financialSummary?.manual_paid_amount ?? resolved.manualPaidAmount ?? ""}
                onChange={(e) =>
                  onFinancialSummaryChange?.({
                    ...financialSummary,
                    payment_source: "manual_cash",
                    manual_paid_amount: e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          )}

          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Travelers
            </span>
            <input
              type="number"
              min={1}
              placeholder="Travelers"
              value={resolvedPricing.pax_count ?? ""}
              onChange={(e) =>
                onPackagePricingChange?.({
                  ...resolvedPricing,
                  pax_count: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Quoted Total
            </span>
            <input
              type="number"
              min={0}
              placeholder="Quoted total"
              value={resolvedPricing.total_cost ?? ""}
              onChange={(e) =>
                onPackagePricingChange?.({
                  ...resolvedPricing,
                  total_cost: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Per Person
            </span>
            <input
              type="number"
              min={0}
              placeholder="Per person"
              value={resolvedPricing.per_person_cost ?? ""}
              onChange={(e) =>
                onPackagePricingChange?.({
                  ...resolvedPricing,
                  per_person_cost: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Currency
            </span>
            <input
              type="text"
              placeholder="Currency"
              value={resolvedPricing.currency ?? "INR"}
              onChange={(e) =>
                onPackagePricingChange?.({
                  ...resolvedPricing,
                  currency: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </div>

        <label className="space-y-1 block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Pricing Notes
          </span>
          <textarea
            rows={3}
            placeholder="Pricing notes"
            value={resolvedPricing.notes ?? ""}
            onChange={(e) =>
              onPackagePricingChange?.({
                ...resolvedPricing,
                notes: e.target.value,
              })
            }
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Payment Notes
          </span>
          <textarea
            rows={3}
            placeholder={isInvoiceLinked ? "Invoice payment context" : "Cash received or payment remarks"}
            value={financialSummary?.notes ?? resolved.notes}
            onChange={(e) =>
              onFinancialSummaryChange?.({
                ...financialSummary,
                notes: e.target.value,
              })
            }
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 shadow-inner dark:bg-slate-900/60 dark:border-slate-700 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <p className="text-xs text-text-muted">
          {isInvoiceLinked
            ? "Linked invoice mode mirrors the selected invoice status and amounts. Switch to Manual Cash if you want to override it here."
            : "Manual Cash mode lets you save unpaid, approved, partially paid, or fully paid status directly on this trip even before an invoice exists."}
        </p>
      </div>
    </GlassCard>
  );
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

function InvoiceEditorModal({
  isOpen,
  onClose,
  tripId,
  clientId,
  mode,
  invoiceId,
  initialLines,
  initialNotes,
}: {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  clientId: string | null;
  mode: "create" | "edit";
  invoiceId?: string | null;
  initialLines?: readonly InvoiceFormLine[];
  initialNotes?: string;
}) {
  const { toast } = useToast();
  const createInvoice = useCreateTripInvoice();
  const updateInvoice = useUpdateTripInvoice();
  const invoiceDetailQuery = useTripInvoiceDetail(
    isOpen && mode === "edit" ? invoiceId ?? null : null,
  );
  const loadingExistingInvoice = mode === "edit" && invoiceDetailQuery.isLoading;
  const existingInvoice = mode === "edit" ? invoiceDetailQuery.data?.invoice ?? null : null;
  const wasOpenRef = useRef(false);

  const [lines, setLines] = useState<readonly InvoiceFormLine[]>(() => sanitizeInvoiceLines(initialLines));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState(initialNotes?.trim() ?? "");
  const [gstEnabled, setGstEnabled] = useState(false);
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [sacCode, setSacCode] = useState("998314");
  const [currency, setCurrency] = useState("INR");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    if (mode === "edit") {
      if (!existingInvoice || wasOpenRef.current) return;
      const seed = buildEditInvoiceSeed(existingInvoice);
      setLines(seed.lines);
      setNotes(seed.notes);
      setDueDate(seed.dueDate);
      setGstEnabled(seed.gstEnabled);
      setPlaceOfSupply(seed.placeOfSupply);
      setSacCode(seed.sacCode);
      setCurrency(seed.currency);
      wasOpenRef.current = true;
      return;
    }

    if (!wasOpenRef.current) {
      const seed = buildCreateInvoiceSeed(initialLines, initialNotes);
      setLines(seed.lines);
      setNotes(seed.notes);
      setDueDate(seed.dueDate);
      setGstEnabled(seed.gstEnabled);
      setPlaceOfSupply(seed.placeOfSupply);
      setSacCode(seed.sacCode);
      setCurrency(seed.currency);
      wasOpenRef.current = true;
    }
  }, [existingInvoice, initialLines, initialNotes, isOpen, mode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const invoiceTotals = useMemo(
    () => calculateInvoiceDraftTotals(lines, gstEnabled),
    [gstEnabled, lines],
  );

  const handleAddLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      {
        ...createEmptyLine(),
        tax_rate: gstEnabled ? DEFAULT_GST_RATE : 0,
      },
    ]);
  }, [gstEnabled]);

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

  const handleToggleGst = useCallback(() => {
    setGstEnabled((previous) => {
      const next = !previous;
      setLines((current) =>
        current.map((line) => ({
          ...line,
          tax_rate:
            next
              ? line.tax_rate > 0
                ? line.tax_rate
                : DEFAULT_GST_RATE
              : 0,
        })),
      );
      if (next && !sacCode.trim()) {
        setSacCode("998314");
      }
      return next;
    });
  }, [sacCode]);

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
      const normalizedItems = validLines.map((line) => ({
        description: line.description.trim(),
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate: gstEnabled ? Math.max(line.tax_rate, 0) : 0,
      }));

      if (mode === "edit" && invoiceId) {
        await updateInvoice.mutateAsync({
          invoiceId,
          tripId,
          items: normalizedItems,
          dueDate: dueDate || null,
          notes: notes.trim() || null,
          placeOfSupply: gstEnabled ? placeOfSupply || null : null,
          sacCode: gstEnabled ? (sacCode.trim() || "998314") : null,
        });
      } else {
        await createInvoice.mutateAsync({
          tripId,
          clientId,
          items: normalizedItems,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
          placeOfSupply: gstEnabled ? placeOfSupply || null : null,
          sacCode: gstEnabled ? (sacCode.trim() || "998314") : null,
        });
      }

      toast({
        title: mode === "edit" ? "Invoice updated successfully" : "Invoice created successfully",
        variant: "success",
      });
      setLines([createEmptyLine()]);
      setDueDate("");
      setNotes("");
      setGstEnabled(false);
      setPlaceOfSupply("");
      setSacCode("998314");
      onClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : mode === "edit"
            ? "Failed to update invoice"
            : "Failed to create invoice";
      toast({ title: message, variant: "error" });
    }
  }, [
    clientId,
    createInvoice,
    dueDate,
    gstEnabled,
    invoiceId,
    lines,
    mode,
    notes,
    onClose,
    placeOfSupply,
    sacCode,
    toast,
    tripId,
    updateInvoice,
  ]);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Edit Invoice" : "Create Invoice"}
      description={
        mode === "edit"
          ? "Update line items, tax settings, and due date for this invoice."
          : "Review the prefilled trip charges, edit anything you need, then create the invoice."
      }
      size="lg"
    >
      {loadingExistingInvoice ? (
        <div className="flex items-center justify-center py-10">
          <span className="text-sm text-gray-400 animate-pulse">
            Loading invoice details...
          </span>
        </div>
      ) : (
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

        <div className="rounded-xl border border-white/40 bg-white/30 dark:bg-slate-800/30 dark:border-slate-700/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-secondary dark:text-white">GST</p>
              <p className="text-xs text-text-muted">
                Add tax percentage to each invoice line
              </p>
            </div>
            <GlassButton variant={gstEnabled ? "primary" : "ghost"} size="sm" onClick={handleToggleGst}>
              {gstEnabled ? "On" : "Off"}
            </GlassButton>
          </div>

          {gstEnabled ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                  Place of Supply
                </label>
                <select
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                  SAC Code
                </label>
                <input
                  type="text"
                  value={sacCode}
                  onChange={(e) => setSacCode(e.target.value)}
                  placeholder="998314"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ) : null}
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
                <div className="col-span-4">
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
                <div className="col-span-2">
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
                <div className="col-span-2">
                  {idx === 0 && (
                    <span className="text-[10px] text-text-muted">Tax %</span>
                  )}
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.tax_rate}
                    disabled={!gstEnabled}
                    onChange={(e) =>
                      handleLineChange(
                        idx,
                        "tax_rate",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-white/40 bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
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

        <div className="rounded-xl border border-white/40 bg-white/30 dark:bg-slate-800/30 dark:border-slate-700/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>Subtotal</span>
            <span className="font-semibold text-secondary dark:text-white">
              {formatPackageCurrency(invoiceTotals.subtotal, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>Tax</span>
            <span className="font-semibold text-secondary dark:text-white">
              {formatPackageCurrency(invoiceTotals.tax, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-base font-black text-secondary dark:text-white">
            <span>Total</span>
            <span>{formatPackageCurrency(invoiceTotals.total, currency)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/30 dark:border-slate-700/30">
          <GlassButton variant="ghost" size="md" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            loading={createInvoice.isPending || updateInvoice.isPending}
            onClick={handleSubmit}
          >
            {mode === "edit" ? "Save Invoice" : "Create Invoice"}
          </GlassButton>
        </div>
      </div>
      )}
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
  onFinancialSummaryChange,
}: FinancialsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [convertingCurrency, setConvertingCurrency] = useState(false);
  const [savingFinancials, setSavingFinancials] = useState(false);
  const autoConvertedPricingRef = useRef<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invoicesQuery = useTripInvoices(trip.id);
  const addOnsQuery = useTripAddOns(trip.id);
  const catalogQuery = useAvailableAddOnsCatalog();
  const saveItinerary = useSaveTripItinerary();
  const updateAddOn = useUpdateTripAddOn();
  const createAddOn = useCreateTripAddOn();

  const invoices = useMemo(
    () => invoicesQuery.data?.invoices ?? [],
    [invoicesQuery.data?.invoices]
  );
  const addOns = useMemo(
    () => addOnsQuery.data?.addOns ?? [],
    [addOnsQuery.data?.addOns],
  );
  const availableAddOns = useMemo(
    () => catalogQuery.data?.addOns ?? [],
    [catalogQuery.data?.addOns],
  );

  const recentPayments = useMemo(
    () => collectRecentPayments(invoices),
    [invoices]
  );

  const packagePricing = trip.itineraries?.raw_data?.pricing ?? null;
  const financialSummary = trip.itineraries?.raw_data?.financial_summary ?? null;
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

  const handleFinancialSummaryChange = useCallback(
    (summary: TripFinancialSummaryConfig) => {
      onFinancialSummaryChange?.({
        ...summary,
        payment_source: summary.payment_source ?? "manual_cash",
        payment_status: summary.payment_status ?? "unpaid",
        linked_invoice_id: summary.linked_invoice_id ?? null,
      });
    },
    [onFinancialSummaryChange],
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
    setEditingInvoiceId(null);
    setShowCreateModal(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setShowCreateModal(false);
    setEditingInvoiceId(null);
  }, []);

  const handleOpenEditInvoice = useCallback((invoice: TripInvoice) => {
    setShowCreateModal(false);
    setEditingInvoiceId(invoice.id);
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

  const handleSaveFinancials = useCallback(async () => {
    if (!trip.itineraries?.id) {
      toast({
        title: "No itinerary linked",
        description: "Financial summary can only be saved on a trip with an itinerary.",
        variant: "error",
      });
      return;
    }

    const resolved = resolveFinancialState(
      trip,
      packagePricing,
      financialSummary,
      invoiceSummary,
      invoices,
    );

    if (resolved.paymentSource === "linked_invoice" && !resolved.linkedInvoiceId) {
      toast({
        title: "Select an invoice",
        description: "Choose which invoice should drive this payment summary.",
        variant: "warning",
      });
      return;
    }

    if (resolved.paymentSource === "manual_cash") {
      if (resolved.paymentStatus === "partially_paid") {
        if (resolved.paidAmount <= 0) {
          toast({
            title: "Enter the paid amount",
            description: "Partially paid trips need a non-zero cash amount.",
            variant: "warning",
          });
          return;
        }
        if (resolved.totalAmount > 0 && resolved.paidAmount >= resolved.totalAmount) {
          toast({
            title: "Use Paid instead",
            description: "Partial payment must be lower than the quoted total.",
            variant: "warning",
          });
          return;
        }
      }

      if (resolved.paymentStatus === "paid" && resolved.totalAmount > 0 && resolved.paidAmount < resolved.totalAmount) {
        toast({
          title: "Paid amount is too low",
          description: "Paid status requires the full quoted amount in manual cash mode.",
          variant: "warning",
        });
        return;
      }
    }

    const nextRawData = {
      ...(trip.itineraries.raw_data ?? {}),
      pricing: packagePricing ? { ...packagePricing } : undefined,
      financial_summary: {
        payment_source: resolved.paymentSource,
        payment_status: resolved.paymentStatus,
        manual_paid_amount:
          resolved.paymentSource === "manual_cash" ? resolved.paidAmount : undefined,
        linked_invoice_id:
          resolved.paymentSource === "linked_invoice" ? resolved.linkedInvoiceId : null,
        notes: financialSummary?.notes?.trim() || undefined,
      },
    };

    const desiredTripStatus = mapFinancialStatusToTripStatus(trip.status, resolved.paymentStatus);

    setSavingFinancials(true);
    try {
      await saveItinerary.mutateAsync({
        tripId: trip.id,
        itineraryId: trip.itineraries.id,
        days: trip.itineraries.raw_data?.days ?? [],
        rawData: nextRawData,
      });

      if (desiredTripStatus && desiredTripStatus !== trip.status) {
        const response = await authedFetch(`/api/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: desiredTripStatus }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update trip payment status");
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tripDetailKeys.detail(trip.id) }),
        queryClient.invalidateQueries({ queryKey: tripDetailKeys.invoices(trip.id) }),
      ]);

      toast({
        title: "Financial summary saved",
        description: "Pricing and payment tracking were updated for this trip.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Could not save financial summary",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "error",
      });
    } finally {
      setSavingFinancials(false);
    }
  }, [
    financialSummary,
    invoiceSummary,
    invoices,
    packagePricing,
    queryClient,
    saveItinerary,
    toast,
    trip,
  ]);

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <FinancialSummaryEditorCard
            trip={trip}
            packagePricing={packagePricing}
            financialSummary={financialSummary}
            invoiceSummary={invoiceSummary}
            invoices={invoices}
            loading={invoicesQuery.isLoading}
            onPackagePricingChange={onPricingChange ? handlePricingChange : undefined}
            onFinancialSummaryChange={handleFinancialSummaryChange}
            onConvertToINR={handleConvertPricingToINR}
            convertingCurrency={convertingCurrency}
            savingFinancials={savingFinancials || saveItinerary.isPending}
            onSaveFinancials={handleSaveFinancials}
            onCreateInvoice={handleOpenCreate}
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
            onEditInvoice={handleOpenEditInvoice}
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
      <InvoiceEditorModal
        isOpen={showCreateModal || editingInvoiceId !== null}
        onClose={handleCloseCreate}
        tripId={trip.id}
        clientId={trip.client_id ?? null}
        mode={editingInvoiceId ? "edit" : "create"}
        invoiceId={editingInvoiceId}
        initialLines={prefilledInvoiceLines}
        initialNotes={prefilledInvoiceNotes}
      />
    </>
  );
}
