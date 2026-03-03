"use client";

import { cn } from "@/lib/utils";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import {
  ArrowDownRight,
  Download,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  PenLine,
  Printer,
  RefreshCw,
  Wallet,
} from "lucide-react";
import type { InvoiceRecord } from "./types";
import { formatDate, formatMoney, statusTone } from "./helpers";

interface InvoiceListPanelProps {
  invoices: InvoiceRecord[];
  selectedInvoiceId: string | null;
  loading: boolean;
  onSelectInvoice: (id: string) => void;
  onSwitchToDraft: () => void;
  previewMode: "draft" | "saved";
  selectedInvoice: InvoiceRecord | null;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onEmailPdf: () => void;
  onWhatsApp: () => void;
  downloadingPdf: boolean;
  emailingPdf: boolean;
  paymentAmount: string;
  paymentMethod: string;
  paymentReference: string;
  paymentNotes: string;
  onPaymentAmountChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onPaymentReferenceChange: (value: string) => void;
  onPaymentNotesChange: (value: string) => void;
  onRecordPayment: (e: React.FormEvent) => void;
  paying: boolean;
}

export default function InvoiceListPanel({
  invoices,
  selectedInvoiceId,
  loading,
  onSelectInvoice,
  onSwitchToDraft,
  previewMode,
  selectedInvoice,
  onPrint,
  onDownloadPdf,
  onEmailPdf,
  onWhatsApp,
  downloadingPdf,
  emailingPdf,
  paymentAmount,
  paymentMethod,
  paymentReference,
  paymentNotes,
  onPaymentAmountChange,
  onPaymentMethodChange,
  onPaymentReferenceChange,
  onPaymentNotesChange,
  onRecordPayment,
  paying,
}: InvoiceListPanelProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onSwitchToDraft}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
          previewMode === "draft"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        <PenLine className="h-4 w-4" />
        New Invoice Preview
      </button>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">
            Recent Invoices
          </h3>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {invoices.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[72px] animate-pulse rounded-xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
            <p className="text-sm font-semibold text-slate-700">No invoices yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Create your first invoice using the form.
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
            {invoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => onSelectInvoice(invoice.id)}
                className={cn(
                  "w-full rounded-xl border p-2.5 text-left transition",
                  selectedInvoiceId === invoice.id && previewMode === "saved"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {invoice.invoice_number}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 truncate text-[11px]",
                        selectedInvoiceId === invoice.id && previewMode === "saved"
                          ? "text-slate-300"
                          : "text-slate-500"
                      )}
                    >
                      {invoice.client_snapshot?.full_name ||
                        invoice.client_snapshot?.email ||
                        "Walk-in"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase",
                      selectedInvoiceId === invoice.id && previewMode === "saved"
                        ? "border-white/25 bg-white/10 text-white"
                        : statusTone(invoice.status)
                    )}
                  >
                    {invoice.status.replace("_", " ")}
                  </span>
                </div>
                <div
                  className={cn(
                    "mt-1.5 flex items-center justify-between text-[11px]",
                    selectedInvoiceId === invoice.id && previewMode === "saved"
                      ? "text-slate-300"
                      : "text-slate-500"
                  )}
                >
                  <span>{formatDate(invoice.issued_at || invoice.created_at)}</span>
                  <span className="font-semibold">
                    {formatMoney(invoice.total_amount, invoice.currency)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {previewMode === "saved" && selectedInvoice ? (
        <>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Share & Export
            </p>
            <div className="grid grid-cols-2 gap-2">
              <GlassButton
                type="button"
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="justify-center text-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </GlassButton>
              <GlassButton
                type="button"
                variant="outline"
                size="sm"
                onClick={onDownloadPdf}
                disabled={downloadingPdf}
                className="justify-center text-xs"
              >
                {downloadingPdf ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                PDF
              </GlassButton>
              <GlassButton
                type="button"
                variant="outline"
                size="sm"
                onClick={onEmailPdf}
                disabled={emailingPdf}
                className="justify-center text-xs"
              >
                {emailingPdf ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                Email
              </GlassButton>
              <GlassButton
                type="button"
                variant="outline"
                size="sm"
                onClick={onWhatsApp}
                className="justify-center text-xs"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp
              </GlassButton>
            </div>
          </div>

          <form onSubmit={onRecordPayment} className="space-y-2">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <Wallet className="h-3.5 w-3.5" />
              Record Payment
            </p>
            <div className="grid grid-cols-2 gap-2">
              <GlassInput
                type="number"
                min="0.01"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => onPaymentAmountChange(e.target.value)}
                placeholder="Amount"
                required
              />
              <GlassInput
                type="text"
                value={paymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
                placeholder="Method"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <GlassInput
                type="text"
                value={paymentReference}
                onChange={(e) => onPaymentReferenceChange(e.target.value)}
                placeholder="Reference"
              />
              <GlassInput
                type="text"
                value={paymentNotes}
                onChange={(e) => onPaymentNotesChange(e.target.value)}
                placeholder="Notes"
              />
            </div>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={paying}
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              size="sm"
            >
              {paying ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  Record Payment
                </>
              )}
            </GlassButton>
          </form>
        </>
      ) : null}
    </div>
  );
}
