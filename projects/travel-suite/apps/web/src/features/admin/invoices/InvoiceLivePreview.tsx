"use client";

import { cn } from "@/lib/utils";
import { Eye, PenLine, Sparkles } from "lucide-react";
import type { InvoiceRecord, InvoiceTemplate, PreviewMode } from "./types";
import { buildAddressLine, formatDate, formatMoney, statusTone } from "./helpers";
import { TEMPLATE_META } from "./constants";

interface InvoiceLivePreviewProps {
  invoice: InvoiceRecord;
  previewTemplate: InvoiceTemplate;
  onTemplateChange: (template: InvoiceTemplate) => void;
  previewMode: PreviewMode;
}

export default function InvoiceLivePreview({
  invoice,
  previewTemplate,
  onTemplateChange,
  previewMode,
}: InvoiceLivePreviewProps) {
  const previewTheme = TEMPLATE_META.find((t) => t.id === previewTemplate) || TEMPLATE_META[0];
  const org = invoice.organization_snapshot;
  const client = invoice.client_snapshot;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {TEMPLATE_META.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onTemplateChange(template.id)}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
              previewTemplate === template.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            )}
          >
            {template.name}
          </button>
        ))}

        <span
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold",
            previewMode === "draft"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          )}
        >
          {previewMode === "draft" ? (
            <PenLine className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
          {previewMode === "draft" ? "Live Draft" : "Saved Invoice"}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className={cn("p-5 bg-gradient-to-br", previewTheme.accentClass)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {org?.logo_url ? (
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/60 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={org.logo_url}
                    alt={org.name || "Company"}
                    className="h-full w-full object-contain p-1.5"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                  <span className="text-xl font-bold text-slate-300">
                    {(org?.name || "T")[0]}
                  </span>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Tax Invoice
                </p>
                <p className="mt-0.5 text-lg font-semibold text-slate-900">
                  {org?.name || "Travel Suite"}
                </p>
                {org?.gstin ? (
                  <p className="text-xs text-slate-600">GSTIN: {org.gstin}</p>
                ) : null}
                {buildAddressLine(org?.billing_address) ? (
                  <p className="max-w-md text-xs text-slate-600">
                    {buildAddressLine(org?.billing_address)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-slate-900">
                {invoice.invoice_number}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Issued {formatDate(invoice.issued_at || invoice.created_at)}
              </p>
              <p className="text-xs text-slate-600">
                Due {formatDate(invoice.due_date)}
              </p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                  statusTone(invoice.status)
                )}
              >
                {invoice.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/70 bg-white/80 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Billed To
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {client?.full_name || client?.email || "Walk-in client"}
            </p>
            {client?.email ? (
              <p className="text-xs text-slate-600">{client.email}</p>
            ) : null}
            {client?.phone ? (
              <p className="text-xs text-slate-600">{client.phone}</p>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-[0.08em]">
                  Description
                </th>
                <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-[0.08em] w-16">
                  Qty
                </th>
                <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-[0.08em] w-28">
                  Rate
                </th>
                <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-[0.08em] w-16">
                  Tax
                </th>
                <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-[0.08em] w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.length === 0 ? (
                <tr className="border-t border-slate-100">
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-400 italic"
                  >
                    Add line items to see them here
                  </td>
                </tr>
              ) : (
                invoice.line_items.map((item, index) => (
                  <tr
                    key={`preview-line-${index}`}
                    className={cn(
                      "border-t border-slate-100 transition-colors",
                      index % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800">
                        {item.description || "Untitled item"}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {formatMoney(item.unit_price, invoice.currency)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600">
                      {item.tax_rate}%
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                      {formatMoney(item.line_total, invoice.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between">
            <div className="min-w-0 flex-1">
              {invoice.notes ? (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <Sparkles className="h-3 w-3" />
                    Notes
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {invoice.notes}
                  </p>
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">
                  No notes added
                </p>
              )}
            </div>

            <div className="w-full shrink-0 space-y-1 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm md:w-64">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>
                  {formatMoney(invoice.subtotal_amount, invoice.currency)}
                </span>
              </div>
              {Number(invoice.cgst || 0) > 0 ? (
                <div className="flex justify-between text-slate-600">
                  <span>CGST</span>
                  <span>
                    {formatMoney(Number(invoice.cgst || 0), invoice.currency)}
                  </span>
                </div>
              ) : null}
              {Number(invoice.sgst || 0) > 0 ? (
                <div className="flex justify-between text-slate-600">
                  <span>SGST</span>
                  <span>
                    {formatMoney(Number(invoice.sgst || 0), invoice.currency)}
                  </span>
                </div>
              ) : null}
              {Number(invoice.igst || 0) > 0 ? (
                <div className="flex justify-between text-slate-600">
                  <span>IGST</span>
                  <span>
                    {formatMoney(Number(invoice.igst || 0), invoice.currency)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>
                  {formatMoney(invoice.tax_amount, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 font-semibold text-slate-900">
                <span>Total</span>
                <span>
                  {formatMoney(invoice.total_amount, invoice.currency)}
                </span>
              </div>
              {previewMode === "saved" ? (
                <>
                  <div className="flex justify-between text-emerald-700">
                    <span>Paid</span>
                    <span>
                      {formatMoney(invoice.paid_amount, invoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-rose-600">
                    <span>Balance</span>
                    <span>
                      {formatMoney(invoice.balance_amount, invoice.currency)}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
