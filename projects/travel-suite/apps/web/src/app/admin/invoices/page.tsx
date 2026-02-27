"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { FileText, Plus, RefreshCw, Receipt, Wallet } from "lucide-react";

type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_subtotal: number;
  line_tax: number;
  line_total: number;
};

type OrganizationSnapshot = {
  id: string;
  name: string;
  logo_url: string | null;
  gstin: string | null;
  billing_state: string | null;
  billing_address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  primary_color: string | null;
};

type ClientSnapshot = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type InvoicePayment = {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  reference: string | null;
  payment_date: string;
};

type InvoiceRecord = {
  id: string;
  invoice_number: string;
  status: string;
  currency: string;
  due_date: string | null;
  issued_at: string | null;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  amount: number;
  created_at: string;
  line_items: InvoiceLineItem[];
  notes: string | null;
  organization_snapshot: OrganizationSnapshot | null;
  client_snapshot: ClientSnapshot | null;
  invoice_payments?: InvoicePayment[];
};

type ClientOption = {
  id: string;
  full_name: string | null;
  email: string;
};

type DraftLineItem = {
  description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
};

const EMPTY_DRAFT_LINE_ITEM: DraftLineItem = {
  description: "",
  quantity: "1",
  unit_price: "0",
  tax_rate: "18",
};

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value: number, currency = "INR"): string {
  const safe = Number.isFinite(value) ? value : 0;
  if (currency.toUpperCase() === "INR") {
    return `₹${safe.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency.toUpperCase()} ${safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

function statusTone(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "partially_paid":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "overdue":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "draft":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

function buildInvoiceMarkup(invoice: InvoiceRecord): string {
  const org = invoice.organization_snapshot;
  const client = invoice.client_snapshot;
  const address = org?.billing_address || {};
  const addressLines = [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
    .filter((line) => Boolean(line))
    .join(", ");

  const rows = invoice.line_items
    .map(
      (item) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatMoney(item.unit_price, invoice.currency)}</td>
          <td>${item.tax_rate}%</td>
          <td>${formatMoney(item.line_total, invoice.currency)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
          .logo { max-height: 64px; max-width: 160px; object-fit: contain; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }
          .totals { margin-top: 20px; width: 320px; margin-left: auto; }
          .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
          .totals-row.total { font-weight: 700; border-top: 1px solid #cbd5e1; margin-top: 4px; padding-top: 8px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            ${org?.logo_url ? `<img class="logo" src="${org.logo_url}" alt="Logo" />` : ""}
            <h2>${org?.name || "Tour Operator"}</h2>
            ${org?.gstin ? `<div>GSTIN: ${org.gstin}</div>` : ""}
            ${addressLines ? `<div>${addressLines}</div>` : ""}
            ${address.phone ? `<div>Phone: ${address.phone}</div>` : ""}
            ${address.email ? `<div>Email: ${address.email}</div>` : ""}
          </div>
          <div>
            <h1>Invoice</h1>
            <div><strong>${invoice.invoice_number}</strong></div>
            <div>Issued: ${formatDate(invoice.issued_at || invoice.created_at)}</div>
            <div>Due: ${formatDate(invoice.due_date)}</div>
            <div>Status: ${invoice.status}</div>
          </div>
        </div>
        <div>
          <h3>Billed To</h3>
          <div>${client?.full_name || "—"}</div>
          ${client?.email ? `<div>${client.email}</div>` : ""}
          ${client?.phone ? `<div>${client.phone}</div>` : ""}
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Tax</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>${formatMoney(invoice.subtotal_amount, invoice.currency)}</span></div>
          <div class="totals-row"><span>Tax</span><span>${formatMoney(invoice.tax_amount, invoice.currency)}</span></div>
          <div class="totals-row total"><span>Total</span><span>${formatMoney(invoice.total_amount, invoice.currency)}</span></div>
          <div class="totals-row"><span>Paid</span><span>${formatMoney(invoice.paid_amount, invoice.currency)}</span></div>
          <div class="totals-row"><span>Balance</span><span>${formatMoney(invoice.balance_amount, invoice.currency)}</span></div>
        </div>
        ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ""}
      </body>
    </html>
  `;
}

export default function AdminInvoicesPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const [clientId, setClientId] = useState<string>("");
  const [currency, setCurrency] = useState("INR");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<DraftLineItem[]>([{ ...EMPTY_DRAFT_LINE_ITEM }]);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const authHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${session?.access_token || ""}`,
    };
  }, [supabase]);

  const loadInvoices = useCallback(async () => {
    const headers = await authHeaders();
    const response = await fetch("/api/invoices?limit=50", { headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || "Failed to load invoices");
    }

    const list = (payload?.invoices || []) as InvoiceRecord[];
    setInvoices(list);
    setSelectedInvoiceId((previous) => previous || list[0]?.id || null);
  }, [authHeaders]);

  const loadClients = useCallback(async () => {
    const headers = await authHeaders();
    const response = await fetch("/api/admin/clients", { headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || "Failed to load clients");
    }

    const list = ((payload?.clients || []) as ClientOption[]).map((client) => ({
      id: client.id,
      full_name: client.full_name,
      email: client.email,
    }));
    setClients(list);
  }, [authHeaders]);

  const loadInvoiceDetails = useCallback(
    async (invoiceId: string) => {
      const headers = await authHeaders();
      const response = await fetch(`/api/invoices/${invoiceId}`, { headers });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load invoice details");
      }
      setSelectedInvoice(payload.invoice as InvoiceRecord);
    },
    [authHeaders]
  );

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      setLoading(true);
      try {
        await Promise.all([loadClients(), loadInvoices()]);
      } catch (error) {
        toast({
          title: "Failed to load invoices",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "error",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [loadClients, loadInvoices, toast]);

  useEffect(() => {
    if (!selectedInvoiceId) {
      setSelectedInvoice(null);
      return;
    }
    void loadInvoiceDetails(selectedInvoiceId).catch((error) => {
      toast({
        title: "Failed to load invoice",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    });
  }, [loadInvoiceDetails, selectedInvoiceId, toast]);

  const draftTotals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const item of draftItems) {
      const qty = Number.parseFloat(item.quantity || "0");
      const rate = Number.parseFloat(item.unit_price || "0");
      const taxRate = Number.parseFloat(item.tax_rate || "0");
      if (!Number.isFinite(qty) || !Number.isFinite(rate) || qty <= 0) continue;
      const lineSubtotal = roundCurrency(qty * rate);
      subtotal += lineSubtotal;
      tax += roundCurrency((lineSubtotal * Math.max(taxRate, 0)) / 100);
    }
    const subtotalSafe = roundCurrency(subtotal);
    const taxSafe = roundCurrency(tax);
    return {
      subtotal: subtotalSafe,
      tax: taxSafe,
      total: roundCurrency(subtotalSafe + taxSafe),
    };
  }, [draftItems]);

  const resetDraft = () => {
    setClientId("");
    setCurrency("INR");
    setDueDate("");
    setNotes("");
    setDraftItems([{ ...EMPTY_DRAFT_LINE_ITEM }]);
  };

  const addDraftLine = () => setDraftItems((prev) => [...prev, { ...EMPTY_DRAFT_LINE_ITEM }]);

  const removeDraftLine = (index: number) => {
    setDraftItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const updateDraftLine = (index: number, field: keyof DraftLineItem, value: string) => {
    setDraftItems((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleCreateInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const items = draftItems.map((item) => ({
        description: item.description,
        quantity: Number.parseFloat(item.quantity || "0"),
        unit_price: Number.parseFloat(item.unit_price || "0"),
        tax_rate: Number.parseFloat(item.tax_rate || "0"),
      }));

      const headers = await authHeaders();
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          client_id: clientId || undefined,
          currency,
          due_date: dueDate || undefined,
          notes: notes || undefined,
          items,
          status: "issued",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create invoice");
      }

      toast({
        title: "Invoice created",
        description: `Created ${payload?.invoice?.invoice_number || "new invoice"}.`,
        variant: "success",
      });

      const invoice = payload.invoice as InvoiceRecord;
      await loadInvoices();
      setSelectedInvoiceId(invoice.id);
      resetDraft();
    } catch (error) {
      toast({
        title: "Invoice creation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedInvoice) return;
    setPaying(true);
    try {
      const amount = Number.parseFloat(paymentAmount || "0");
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid payment amount.");
      }

      const headers = await authHeaders();
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          amount,
          method: paymentMethod,
          reference: paymentReference || undefined,
          notes: paymentNotes || undefined,
          status: "completed",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to record payment");
      }

      toast({
        title: "Payment recorded",
        description: `Payment captured for ${selectedInvoice.invoice_number}.`,
        variant: "success",
      });

      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      await loadInvoices();
      await loadInvoiceDetails(selectedInvoice.id);
    } catch (error) {
      toast({
        title: "Payment recording failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setPaying(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!selectedInvoice) return;
    const popup = window.open("", "_blank", "width=980,height=900");
    if (!popup) return;
    popup.document.write(buildInvoiceMarkup(selectedInvoice));
    popup.document.close();
    popup.focus();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-black">Finance</p>
          <h1 className="text-3xl font-serif text-secondary dark:text-white">Invoices</h1>
          <p className="text-sm text-text-secondary mt-1">
            Generate organization-branded invoices with tenant-specific GST and billing details.
          </p>
        </div>
        <GlassButton
          type="button"
          variant="secondary"
          onClick={() => {
            void loadInvoices();
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard padding="lg" className="xl:col-span-1 border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-secondary dark:text-white">Create Invoice</h2>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Client</label>
              <select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/15 dark:bg-white/5 px-3 py-2 text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Walk-in / Manual</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name || client.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Currency</label>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/15 dark:bg-white/5 px-3 py-2 text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Due Date</label>
                <GlassInput
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Line Items</label>
              <div className="space-y-3">
                {draftItems.map((item, index) => (
                  <div key={`draft-item-${index}`} className="rounded-xl border border-white/20 p-3 space-y-2 bg-white/5">
                    <GlassInput
                      type="text"
                      value={item.description}
                      onChange={(event) => updateDraftLine(index, "description", event.target.value)}
                      placeholder="Description"
                      required
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <GlassInput
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) => updateDraftLine(index, "quantity", event.target.value)}
                        placeholder="Qty"
                        required
                      />
                      <GlassInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(event) => updateDraftLine(index, "unit_price", event.target.value)}
                        placeholder="Rate"
                        required
                      />
                      <GlassInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.tax_rate}
                        onChange={(event) => updateDraftLine(index, "tax_rate", event.target.value)}
                        placeholder="Tax %"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-600 hover:text-rose-500 disabled:opacity-40"
                        disabled={draftItems.length === 1}
                        onClick={() => removeDraftLine(index)}
                      >
                        Remove line
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="text-xs font-bold text-primary hover:text-primary/80 mt-2"
                onClick={addDraftLine}
              >
                + Add line item
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Notes</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/20 bg-white/15 dark:bg-white/5 px-3 py-2 text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Payment terms or additional note..."
              />
            </div>

            <div className="rounded-xl border border-white/20 bg-white/5 p-3 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{formatMoney(draftTotals.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-text-secondary mt-1">
                <span>Tax</span>
                <span>{formatMoney(draftTotals.tax, currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-secondary dark:text-white mt-2 pt-2 border-t border-white/20">
                <span>Total</span>
                <span>{formatMoney(draftTotals.total, currency)}</span>
              </div>
            </div>

            <GlassButton type="submit" variant="primary" disabled={saving} className="w-full">
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  Create Invoice
                </>
              )}
            </GlassButton>
          </form>
        </GlassCard>

        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard padding="lg" className="border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-secondary dark:text-white">Recent Invoices</h2>
            </div>

            {loading ? (
              <p className="text-sm text-text-secondary">Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-text-secondary">No invoices yet. Create your first invoice.</p>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {invoices.map((invoice) => (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3 transition-colors",
                      selectedInvoiceId === invoice.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-white/20 bg-white/5 hover:border-primary/25"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-secondary dark:text-white">{invoice.invoice_number}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {invoice.client_snapshot?.full_name || invoice.client_snapshot?.email || "Walk-in client"}
                        </p>
                      </div>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase", statusTone(invoice.status))}>
                        {invoice.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
                      <span>Issued {formatDate(invoice.issued_at || invoice.created_at)}</span>
                      <span className="font-bold text-secondary dark:text-white">
                        {formatMoney(invoice.total_amount, invoice.currency)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard padding="lg" className="border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-secondary dark:text-white">Invoice Preview</h2>
              <GlassButton type="button" variant="secondary" size="sm" onClick={handlePrintInvoice} disabled={!selectedInvoice}>
                Print
              </GlassButton>
            </div>

            {!selectedInvoice ? (
              <p className="text-sm text-text-secondary">Select an invoice to view details.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      {selectedInvoice.organization_snapshot?.logo_url ? (
                        <img
                          src={selectedInvoice.organization_snapshot.logo_url}
                          alt="Organization logo"
                          className="h-10 object-contain mb-2"
                        />
                      ) : null}
                      <p className="font-bold text-secondary dark:text-white">
                        {selectedInvoice.organization_snapshot?.name || "Tour Operator"}
                      </p>
                      {selectedInvoice.organization_snapshot?.gstin ? (
                        <p className="text-xs text-text-secondary">
                          GSTIN: {selectedInvoice.organization_snapshot.gstin}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-secondary dark:text-white">{selectedInvoice.invoice_number}</p>
                      <p className="text-xs text-text-secondary">Due {formatDate(selectedInvoice.due_date)}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-text-secondary">
                    Client:{" "}
                    <span className="font-semibold text-secondary dark:text-white">
                      {selectedInvoice.client_snapshot?.full_name ||
                        selectedInvoice.client_snapshot?.email ||
                        "Walk-in client"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold uppercase tracking-widest text-text-secondary">Item</th>
                        <th className="px-3 py-2 text-right font-bold uppercase tracking-widest text-text-secondary">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.line_items.map((item, index) => (
                        <tr key={`${selectedInvoice.id}-line-${index}`} className="border-t border-white/10">
                          <td className="px-3 py-2">
                            <p className="font-semibold text-secondary dark:text-white">{item.description}</p>
                            <p className="text-[11px] text-text-secondary">
                              {item.quantity} × {formatMoney(item.unit_price, selectedInvoice.currency)} • {item.tax_rate}% tax
                            </p>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-secondary dark:text-white">
                            {formatMoney(item.line_total, selectedInvoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/5 p-3 text-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span>{formatMoney(selectedInvoice.subtotal_amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary mt-1">
                    <span>Tax</span>
                    <span>{formatMoney(selectedInvoice.tax_amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-secondary dark:text-white mt-2 pt-2 border-t border-white/20">
                    <span>Total</span>
                    <span>{formatMoney(selectedInvoice.total_amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 mt-2">
                    <span>Paid</span>
                    <span>{formatMoney(selectedInvoice.paid_amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 mt-1">
                    <span>Balance</span>
                    <span>{formatMoney(selectedInvoice.balance_amount, selectedInvoice.currency)}</span>
                  </div>
                </div>

                <form onSubmit={handleRecordPayment} className="rounded-xl border border-white/20 bg-white/5 p-3 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5" />
                    Record Payment
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <GlassInput
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                      placeholder="Amount"
                      required
                    />
                    <GlassInput
                      type="text"
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      placeholder="Method"
                    />
                  </div>
                  <GlassInput
                    type="text"
                    value={paymentReference}
                    onChange={(event) => setPaymentReference(event.target.value)}
                    placeholder="Reference (optional)"
                  />
                  <GlassInput
                    type="text"
                    value={paymentNotes}
                    onChange={(event) => setPaymentNotes(event.target.value)}
                    placeholder="Notes (optional)"
                  />
                  <GlassButton type="submit" variant="primary" disabled={paying} className="w-full">
                    {paying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Record Payment"
                    )}
                  </GlassButton>
                </form>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

