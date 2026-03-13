"use client";

import { FileText, Download } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import type { Invoice } from "./useBillingData";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface BillingHistorySectionProps {
  invoices: Invoice[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency = "INR") {
  if (currency === "INR") return `\u20B9${amount.toLocaleString("en-IN")}`;
  return `$${amount.toLocaleString("en-US")}`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function BillingHistorySection({ invoices }: BillingHistorySectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-secondary dark:text-white">Billing History</h2>
        <GlassButton variant="ghost" size="sm" className="rounded-xl h-9">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </GlassButton>
      </div>

      <GlassCard padding="none" className="overflow-hidden border-gray-100">
        {invoices.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-100">
              <FileText className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-serif text-secondary">No Invoices Yet</h3>
            <p className="text-text-secondary mt-2 text-sm max-w-xs mx-auto">Your invoice history will appear here once you make a payment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Timestamp</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="group hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-secondary">INV-{invoice.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-[10px] text-text-muted font-medium">{invoice.clients?.email || "System Payment"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-text-secondary">{formatDate(invoice.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-secondary">{formatCurrency(invoice.amount, invoice.currency)}</span>
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-tighter">
                          {invoice.cgst > 0 || invoice.sgst > 0 || invoice.igst > 0
                            ? `CGST: \u20B9${invoice.cgst} | SGST: \u20B9${invoice.sgst}${invoice.igst > 0 ? ` | IGST: \u20B9${invoice.igst}` : ""}`
                            : "Incl. GST"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.status === "paid" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-600">Verified</span>
                      ) : invoice.status === "pending" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-600">Pending</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-100 text-[9px] font-black uppercase tracking-widest text-rose-600">Overdue</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-xl bg-white border border-gray-100 hover:border-primary hover:text-primary transition-all shadow-sm">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
