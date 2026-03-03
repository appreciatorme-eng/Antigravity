"use client";

import { useState } from "react";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  CreditCard,
  Hash,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { formatINR, formatDate } from "@/features/trip-detail/utils";
import type { TripInvoice } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripInvoiceSectionProps {
  tripId: string;
  clientId: string | null;
  invoices: TripInvoice[];
  loading: boolean;
  onCreateInvoice: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type BadgeVariant = "info" | "success" | "warning" | "danger" | "secondary";

function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "paid":
      return "success";
    case "partially_paid":
      return "info";
    case "overdue":
      return "danger";
    case "draft":
      return "secondary";
    case "cancelled":
      return "secondary";
    default:
      return "warning";
  }
}

function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ onCreateInvoice }: { onCreateInvoice: () => void }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
          Invoices
        </span>
      </div>
      <GlassButton variant="primary" size="sm" onClick={onCreateInvoice}>
        <FileText className="w-3.5 h-3.5" />
        Create Invoice
      </GlassButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onCreateInvoice }: { onCreateInvoice: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <FileText className="w-10 h-10 text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-400 mb-4">
        No invoices yet
      </p>
      <GlassButton variant="primary" size="sm" onClick={onCreateInvoice}>
        Create First Invoice
      </GlassButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoice Row
// ---------------------------------------------------------------------------

function InvoiceRow({
  invoice,
  isExpanded,
  onToggle,
}: {
  invoice: TripInvoice;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/40 bg-white/30 dark:bg-slate-800/30 dark:border-slate-700/40 p-4">
      {/* Main row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-secondary dark:text-white">
              {invoice.invoice_number}
            </span>
            <GlassBadge variant={getStatusVariant(invoice.status)} size="sm">
              {formatStatusLabel(invoice.status)}
            </GlassBadge>
          </div>

          <p className="text-lg font-black text-secondary dark:text-white mt-1 tabular-nums">
            {formatINR(invoice.total_amount)}
          </p>

          <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-text-muted">
            {invoice.issued_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Issued {formatDate(invoice.issued_at)}
              </span>
            )}
            {invoice.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due {formatDate(invoice.due_date)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {invoice.line_items.length} item
              {invoice.line_items.length !== 1 ? "s" : ""}
            </span>
            {invoice.payments.length > 0 && (
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {invoice.payments.length} payment
                {invoice.payments.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {invoice.line_items.length > 0 && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-white/40 dark:hover:bg-slate-700/40 transition-colors"
            aria-label={isExpanded ? "Collapse line items" : "Expand line items"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </button>
        )}
      </div>

      {/* Expanded line items */}
      {isExpanded && invoice.line_items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/30 dark:border-slate-700/30 space-y-2">
          {invoice.line_items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-text-muted flex-1 min-w-0 truncate">
                {item.description}
              </span>
              <span className="text-text-muted mx-2">
                {item.quantity} x {formatINR(item.unit_price)}
              </span>
              <span className="font-bold text-secondary dark:text-white tabular-nums">
                {formatINR(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TripInvoiceSection({
  invoices,
  loading,
  onCreateInvoice,
}: TripInvoiceSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (invoiceId: string) => {
    setExpandedId((prev) => (prev === invoiceId ? null : invoiceId));
  };

  if (loading) {
    return (
      <GlassCard padding="xl">
        <SectionHeader onCreateInvoice={onCreateInvoice} />
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-gray-400 animate-pulse">
            Loading invoices...
          </span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="xl">
      <SectionHeader onCreateInvoice={onCreateInvoice} />
      {invoices.length === 0 ? (
        <EmptyState onCreateInvoice={onCreateInvoice} />
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              isExpanded={expandedId === invoice.id}
              onToggle={() => handleToggle(invoice.id)}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
