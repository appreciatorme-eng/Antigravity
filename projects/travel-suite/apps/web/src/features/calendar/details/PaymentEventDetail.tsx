"use client";

import { FileText, CreditCard, Hash } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import type { PaymentEventData, CalendarEvent } from "../types";

interface PaymentEventDetailProps {
  data: PaymentEventData;
  event: CalendarEvent;
}

export function PaymentEventDetail({ data }: PaymentEventDetailProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DetailRow
          icon={FileText}
          label="Invoice #"
          value={data.invoiceNumber}
        />
        <DetailRow
          icon={CreditCard}
          label="Method"
          value={data.method ?? "N/A"}
        />
        <DetailRow
          icon={Hash}
          label="Reference"
          value={data.reference ?? "N/A"}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <GlassButton
          size="sm"
          variant="outline"
          onClick={() => {
            window.location.href = `/invoices/${data.invoiceId}`;
          }}
        >
          View Invoice
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
