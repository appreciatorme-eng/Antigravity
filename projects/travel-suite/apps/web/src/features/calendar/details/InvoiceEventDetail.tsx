"use client";

import { FileText, DollarSign, CreditCard } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { formatAmount } from "../utils";
import type { InvoiceEventData, CalendarEvent } from "../types";
import type { useCalendarActions } from "../useCalendarActions";

interface InvoiceEventDetailProps {
  data: InvoiceEventData;
  event: CalendarEvent;
  actions: ReturnType<typeof useCalendarActions>;
  onClose: () => void;
}

export function InvoiceEventDetail({
  data,
  event,
  actions,
}: InvoiceEventDetailProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailRow
          icon={FileText}
          label="Invoice #"
          value={data.invoiceNumber}
        />
        <DetailRow
          icon={DollarSign}
          label="Total"
          value={formatAmount(data.totalAmount, event.currency)}
        />
        <DetailRow
          icon={CreditCard}
          label="Paid"
          value={formatAmount(data.paidAmount, event.currency)}
        />
        <DetailRow
          icon={DollarSign}
          label="Balance"
          value={formatAmount(data.balanceAmount, event.currency)}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <GlassButton
          size="sm"
          variant="primary"
          onClick={() => actions.sendInvoice.mutate(event.id)}
        >
          Send Invoice
        </GlassButton>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          {label}
        </p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
