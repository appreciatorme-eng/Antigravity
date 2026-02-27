"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { INDIAN_STATES } from "@/lib/tax/gst-calculator";
import {
  ArrowDownRight,
  Building2,
  Download,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";

type InvoiceTemplate = "executive" | "obsidian" | "heritage";

const TEMPLATE_META: Array<{
  id: InvoiceTemplate;
  name: string;
  description: string;
  accentClass: string;
  pillClass: string;
}> = [
  {
    id: "executive",
    name: "Executive",
    description: "Crisp premium layout for enterprise billing",
    accentClass: "from-emerald-600/20 to-teal-500/10",
    pillClass: "text-emerald-700 bg-emerald-100 border-emerald-200",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Dark-ink finance style with high contrast",
    accentClass: "from-slate-700/20 to-slate-900/5",
    pillClass: "text-slate-700 bg-slate-100 border-slate-200",
  },
  {
    id: "heritage",
    name: "Heritage",
    description: "Warm signature style for luxury operators",
    accentClass: "from-amber-600/20 to-orange-500/10",
    pillClass: "text-amber-700 bg-amber-100 border-amber-200",
  },
];

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
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  place_of_supply: string | null;
  sac_code: string | null;
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
  email: string | null;
  phone?: string | null;
  travel_style?: string | null;
  client_tag?: string | null;
};

type DraftLineItem = {
  description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
};

const DEFAULT_GST_RATE = "18";

const EMPTY_DRAFT_LINE_ITEM: DraftLineItem = {
  description: "",
  quantity: "1",
  unit_price: "0",
  tax_rate: DEFAULT_GST_RATE,
};

const LINE_ITEM_PRESETS: Array<{ label: string; item: DraftLineItem }> = [
  {
    label: "Trip Planning Fee",
    item: { description: "Trip planning and concierge coordination", quantity: "1", unit_price: "12500", tax_rate: "18" },
  },
  {
    label: "Accommodation Block",
    item: { description: "Accommodation booking and supplier handling", quantity: "1", unit_price: "32500", tax_rate: "18" },
  },
  {
    label: "Transfers",
    item: { description: "Airport and intercity transfer arrangements", quantity: "1", unit_price: "6500", tax_rate: "18" },
  },
  {
    label: "Visa Support",
    item: { description: "Visa documentation and support assistance", quantity: "1", unit_price: "4500", tax_rate: "18" },
  },
  {
    label: "Premium Add-on",
    item: { description: "Premium add-on package", quantity: "1", unit_price: "9800", tax_rate: "18" },
  },
];

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
  if (!value) return "-";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "-";
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
      return "bg-teal-100 text-teal-700 border-teal-200";
  }
}

function buildAddressLine(address?: OrganizationSnapshot["billing_address"] | null): string {
  if (!address) return "";
  return [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
    .filter(Boolean)
    .join(", ");
}

function buildInvoiceMarkup(invoice: InvoiceRecord, template: InvoiceTemplate): string {
  const org = invoice.organization_snapshot;
  const client = invoice.client_snapshot;
  const theme = {
    executive: { accent: "#0f766e", secondary: "#ecfeff", heading: "#0f172a" },
    obsidian: { accent: "#111827", secondary: "#f8fafc", heading: "#020617" },
    heritage: { accent: "#9a3412", secondary: "#fff7ed", heading: "#292524" },
  }[template];

  const rows = invoice.line_items
    .map(
      (item) => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatMoney(item.unit_price, invoice.currency)}</td>
        <td style="text-align:center">${item.tax_rate}%</td>
        <td style="text-align:right">${formatMoney(item.line_total, invoice.currency)}</td>
      </tr>
    `
    )
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${invoice.invoice_number}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; margin: 26px; }
        .paper { border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
        .header { display:flex; justify-content:space-between; gap:24px; padding:20px; background:${theme.secondary}; border-bottom:1px solid #e2e8f0; }
        .kicker { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:${theme.accent}; font-weight:700; margin-bottom:6px; }
        .org-name { font-size:24px; font-weight:700; color:${theme.heading}; margin:0 0 4px; }
        .meta { font-size:12px; color:#475569; margin:2px 0; }
        table { width:100%; border-collapse: collapse; }
        th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; font-size: 12px; text-align:left; }
        th { background: #f8fafc; text-transform: uppercase; letter-spacing: .06em; font-size: 10px; color: #475569; }
        .totals { margin:16px 20px 18px auto; width:340px; border:1px solid #e2e8f0; border-radius:12px; padding:12px; }
        .totals-row { display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#475569; }
        .totals-row.total { color:${theme.heading}; font-weight:700; border-top:1px solid #cbd5e1; margin-top:4px; padding-top:8px; }
        .notes { margin:0 20px 18px; border-top:1px solid #e2e8f0; padding-top:10px; font-size:12px; color:#475569; }
      </style>
    </head>
    <body>
      <div class="paper">
        <div class="header">
          <div>
            <div class="kicker">Tax Invoice</div>
            <h1 class="org-name">${org?.name || "Travel Suite"}</h1>
            ${org?.gstin ? `<div class="meta">GSTIN: ${org.gstin}</div>` : ""}
            ${buildAddressLine(org?.billing_address) ? `<div class="meta">${buildAddressLine(org?.billing_address)}</div>` : ""}
            ${org?.billing_address?.phone ? `<div class="meta">Phone: ${org.billing_address.phone}</div>` : ""}
            ${org?.billing_address?.email ? `<div class="meta">Email: ${org.billing_address.email}</div>` : ""}
          </div>
          <div style="text-align:right">
            <div class="kicker">Invoice #</div>
            <div style="font-size:18px; font-weight:700; color:${theme.heading}">${invoice.invoice_number}</div>
            <div class="meta">Issued: ${formatDate(invoice.issued_at || invoice.created_at)}</div>
            <div class="meta">Due: ${formatDate(invoice.due_date)}</div>
            <div class="meta">Status: ${invoice.status.replace(/_/g, " ")}</div>
            ${invoice.place_of_supply ? `<div class="meta">Place of Supply: ${invoice.place_of_supply}</div>` : ""}
            ${invoice.sac_code ? `<div class="meta">SAC: ${invoice.sac_code}</div>` : ""}
          </div>
        </div>
        <div style="padding:14px 20px 8px; font-size:12px; color:#475569">
          <strong style="display:block; color:${theme.heading}; margin-bottom:4px">Billed To</strong>
          ${client?.full_name || "Walk-in client"}
          ${client?.email ? `<div>${client.email}</div>` : ""}
          ${client?.phone ? `<div>${client.phone}</div>` : ""}
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Rate</th>
              <th style="text-align:center">Tax</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>${formatMoney(invoice.subtotal_amount, invoice.currency)}</span></div>
          ${Number(invoice.cgst || 0) > 0 ? `<div class="totals-row"><span>CGST</span><span>${formatMoney(Number(invoice.cgst || 0), invoice.currency)}</span></div>` : ""}
          ${Number(invoice.sgst || 0) > 0 ? `<div class="totals-row"><span>SGST</span><span>${formatMoney(Number(invoice.sgst || 0), invoice.currency)}</span></div>` : ""}
          ${Number(invoice.igst || 0) > 0 ? `<div class="totals-row"><span>IGST</span><span>${formatMoney(Number(invoice.igst || 0), invoice.currency)}</span></div>` : ""}
          <div class="totals-row"><span>Tax</span><span>${formatMoney(invoice.tax_amount, invoice.currency)}</span></div>
          <div class="totals-row total"><span>Total</span><span>${formatMoney(invoice.total_amount, invoice.currency)}</span></div>
          <div class="totals-row"><span>Paid</span><span>${formatMoney(invoice.paid_amount, invoice.currency)}</span></div>
          <div class="totals-row"><span>Balance</span><span>${formatMoney(invoice.balance_amount, invoice.currency)}</span></div>
        </div>
        ${invoice.notes ? `<div class="notes"><strong>Notes:</strong><div style="margin-top:4px">${invoice.notes}</div></div>` : ""}
      </div>
    </body>
  </html>`;
}

function computeTaxSplit(totalTax: number, billingState: string | null, placeOfSupply: string): { cgst: number; sgst: number; igst: number } {
  const normalizedTax = roundCurrency(Math.max(totalTax, 0));
  if (!normalizedTax) return { cgst: 0, sgst: 0, igst: 0 };

  const billing = (billingState || "").trim().toUpperCase();
  const place = (placeOfSupply || "").trim().toUpperCase();
  if (billing && place && billing === place) {
    const half = roundCurrency(normalizedTax / 2);
    return { cgst: half, sgst: roundCurrency(normalizedTax - half), igst: 0 };
  }
  return { cgst: 0, sgst: 0, igst: normalizedTax };
}

export default function AdminInvoicesPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailingPdf, setEmailingPdf] = useState(false);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const [clientId, setClientId] = useState<string>("");
  const [currency, setCurrency] = useState("INR");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [draftItems, setDraftItems] = useState<DraftLineItem[]>([{ ...EMPTY_DRAFT_LINE_ITEM }]);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [sacCode, setSacCode] = useState("998314");
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate>("executive");

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

  const loadInvoices = useCallback(
    async (showRefreshToast = false) => {
      const headers = await authHeaders();
      const response = await fetch("/api/invoices?limit=50", { headers, cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load invoices");
      }

      const list = (payload?.invoices || []) as InvoiceRecord[];
      setInvoices(list);
      setSelectedInvoiceId((previous) => {
        if (previous && list.some((invoice) => invoice.id === previous)) return previous;
        return list[0]?.id || null;
      });

      if (showRefreshToast) {
        toast({ title: "Invoices refreshed", description: "Invoice data is up to date.", variant: "success" });
      }
    },
    [authHeaders, toast]
  );

  const loadClients = useCallback(async () => {
    const headers = await authHeaders();
    const response = await fetch("/api/admin/clients", { headers, cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || "Failed to load clients");
    }

    const list = ((payload?.clients || []) as ClientOption[]).map((client) => ({
      id: client.id,
      full_name: client.full_name,
      email: client.email || null,
      phone: client.phone,
      travel_style: client.travel_style,
      client_tag: client.client_tag,
    }));
    setClients(list);
  }, [authHeaders]);

  const loadInvoiceDetails = useCallback(
    async (invoiceId: string) => {
      const headers = await authHeaders();
      const response = await fetch(`/api/invoices/${invoiceId}`, { headers, cache: "no-store" });
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

  const organizationBillingState = useMemo(
    () =>
      selectedInvoice?.organization_snapshot?.billing_state ||
      invoices.find((invoice) => invoice.organization_snapshot?.billing_state)?.organization_snapshot?.billing_state ||
      null,
    [invoices, selectedInvoice]
  );

  useEffect(() => {
    if (gstEnabled) {
      setDraftItems((previous) =>
        previous.map((item) => {
          const numericTax = Number.parseFloat(item.tax_rate || "0");
          if (!Number.isFinite(numericTax) || numericTax <= 0) {
            return { ...item, tax_rate: DEFAULT_GST_RATE };
          }
          return item;
        })
      );
      return;
    }

    setDraftItems((previous) => previous.map((item) => ({ ...item, tax_rate: "0" })));
  }, [gstEnabled]);

  const selectedClient = useMemo(() => clients.find((client) => client.id === clientId) || null, [clientId, clients]);

  useEffect(() => {
    if (!selectedClient) return;

    setDraftItems((previous) => {
      if (previous.length !== 1 || previous[0].description.trim().length > 0) return previous;
      return [
        {
          description: `Travel operations for ${selectedClient.full_name || selectedClient.email || "client"}`,
          quantity: "1",
          unit_price: "0",
          tax_rate: gstEnabled ? DEFAULT_GST_RATE : "0",
        },
      ];
    });
  }, [gstEnabled, selectedClient]);

  const draftTotals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;

    for (const item of draftItems) {
      const qty = Number.parseFloat(item.quantity || "0");
      const rate = Number.parseFloat(item.unit_price || "0");
      const taxRate = gstEnabled ? Number.parseFloat(item.tax_rate || "0") : 0;
      if (!Number.isFinite(qty) || !Number.isFinite(rate) || qty <= 0 || rate < 0) continue;
      const lineSubtotal = roundCurrency(qty * rate);
      const lineTax = roundCurrency((lineSubtotal * Math.max(taxRate, 0)) / 100);
      subtotal += lineSubtotal;
      tax += lineTax;
    }

    const subtotalSafe = roundCurrency(subtotal);
    const taxSafe = roundCurrency(tax);
    const split = computeTaxSplit(taxSafe, organizationBillingState, placeOfSupply || organizationBillingState || "");

    return {
      subtotal: subtotalSafe,
      tax: taxSafe,
      total: roundCurrency(subtotalSafe + taxSafe),
      split,
    };
  }, [draftItems, gstEnabled, organizationBillingState, placeOfSupply]);

  const resetDraft = () => {
    setClientId("");
    setCurrency("INR");
    setDueDate("");
    setNotes("");
    setGstEnabled(true);
    setPlaceOfSupply(organizationBillingState || "");
    setSacCode("998314");
    setDraftItems([{ ...EMPTY_DRAFT_LINE_ITEM }]);
  };

  const addDraftLine = () => setDraftItems((prev) => [...prev, { ...EMPTY_DRAFT_LINE_ITEM, tax_rate: gstEnabled ? DEFAULT_GST_RATE : "0" }]);

  const applyPreset = (preset: DraftLineItem) => {
    setDraftItems((previous) => [
      ...previous,
      {
        ...preset,
        tax_rate: gstEnabled ? preset.tax_rate : "0",
      },
    ]);
  };

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
        tax_rate: gstEnabled ? Number.parseFloat(item.tax_rate || "0") : 0,
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
          place_of_supply: gstEnabled ? placeOfSupply || organizationBillingState || undefined : null,
          sac_code: gstEnabled ? sacCode || "998314" : null,
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

  const buildInvoicePdfBlob = useCallback(async (invoice: InvoiceRecord) => {
    const [{ pdf }, { InvoiceDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/pdf/InvoiceDocument"),
    ]);

    return pdf(
      <InvoiceDocument
        invoice={invoice}
        template={previewTemplate}
      />
    ).toBlob();
  }, [previewTemplate]);

  const handleDownloadPdf = useCallback(async () => {
    if (!selectedInvoice) return;
    setDownloadingPdf(true);
    try {
      const blob = await buildInvoicePdfBlob(selectedInvoice);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedInvoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "PDF generation failed",
        description: error instanceof Error ? error.message : "Failed to generate invoice PDF.",
        variant: "error",
      });
    } finally {
      setDownloadingPdf(false);
    }
  }, [buildInvoicePdfBlob, selectedInvoice, toast]);

  const handleEmailPdf = useCallback(async () => {
    if (!selectedInvoice) return;

    const clientEmail = selectedInvoice.client_snapshot?.email;
    if (!clientEmail) {
      toast({
        title: "Client email unavailable",
        description: "Add a client email to send invoice directly.",
        variant: "warning",
      });
      return;
    }

    setEmailingPdf(true);
    try {
      const blob = await buildInvoicePdfBlob(selectedInvoice);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const dataUri = reader.result as string;
          const encoded = dataUri.split(",")[1];
          if (!encoded) {
            reject(new Error("Failed to encode PDF data"));
            return;
          }
          resolve(encoded);
        };
        reader.onerror = () => reject(new Error("Failed to read PDF file"));
      });

      const headers = await authHeaders();
      const response = await fetch("/api/invoices/send-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          client_email: clientEmail,
          pdf_base64: base64,
          invoice_number: selectedInvoice.invoice_number,
          organization_name: selectedInvoice.organization_snapshot?.name || "Travel Suite",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (response.status === 202 && payload?.disabled) {
        toast({
          title: "Email integration disabled",
          description: payload?.error || "Email provider is not configured.",
          variant: "warning",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to send invoice email");
      }

      toast({
        title: "Invoice emailed",
        description: `Invoice sent to ${clientEmail}.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Invoice email failed",
        description: error instanceof Error ? error.message : "Failed to send invoice email.",
        variant: "error",
      });
    } finally {
      setEmailingPdf(false);
    }
  }, [authHeaders, buildInvoicePdfBlob, selectedInvoice, toast]);

  const handleWhatsAppShare = useCallback(() => {
    if (!selectedInvoice) return;

    const clientName = selectedInvoice.client_snapshot?.full_name || "Customer";
    const phone = (selectedInvoice.client_snapshot?.phone || "").replace(/\D/g, "");
    const message =
      `Invoice ${selectedInvoice.invoice_number}\n` +
      `Total: ${formatMoney(selectedInvoice.total_amount, selectedInvoice.currency)}\n` +
      `Balance: ${formatMoney(selectedInvoice.balance_amount, selectedInvoice.currency)}\n` +
      `Due: ${formatDate(selectedInvoice.due_date)}\n\n` +
      `Dear ${clientName}, please find your invoice details attached.`;

    const encoded = encodeURIComponent(message);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [selectedInvoice]);

  const handlePrintInvoice = useCallback(() => {
    if (!selectedInvoice) return;
    const popup = window.open("", "_blank", "width=980,height=900");
    if (!popup) return;
    popup.document.write(buildInvoiceMarkup(selectedInvoice, previewTemplate));
    popup.document.close();
    popup.focus();
    setTimeout(() => {
      popup.print();
    }, 250);
  }, [previewTemplate, selectedInvoice]);

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadInvoices(true), loadClients()]);
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const totalsOverview = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
    const totalOutstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balance_amount || 0), 0);
    const paidInvoices = invoices.filter((invoice) => invoice.status === "paid").length;

    return {
      totalInvoiced: roundCurrency(totalInvoiced),
      totalOutstanding: roundCurrency(totalOutstanding),
      paidInvoices,
    };
  }, [invoices]);

  const previewTheme = TEMPLATE_META.find((item) => item.id === previewTemplate) || TEMPLATE_META[0];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_14px_45px_-24px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Finance Workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Invoice Studio</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Generate polished GST-ready invoices, preview in premium templates, and share instantly over email, WhatsApp, or PDF export.
            </p>
          </div>

          <GlassButton
            type="button"
            variant="outline"
            size="sm"
            loading={refreshing}
            onClick={() => void refreshAll()}
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </GlassButton>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Invoiced</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{formatMoney(totalsOverview.totalInvoiced, "INR")}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding</p>
            <p className="mt-1 text-xl font-semibold text-amber-700">{formatMoney(totalsOverview.totalOutstanding, "INR")}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Paid Invoices</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">{totalsOverview.paidInvoices}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
        <GlassCard padding="lg" className="border-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Create Invoice</h2>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Client</label>
              <select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-teal-500/30 transition focus:ring-2"
              >
                <option value="">Walk-in / Manual</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name || client.email || "Unnamed client"}
                  </option>
                ))}
              </select>
              {selectedClient ? (
                <p className="text-xs text-slate-500">
                  {selectedClient.email || "No email"}
                  {selectedClient.phone ? ` • ${selectedClient.phone}` : ""}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Currency</label>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-teal-500/30 transition focus:ring-2"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Due Date</label>
                <GlassInput type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">GST Auto Calculation</p>
                  <p className="text-xs text-slate-500">Enable to apply tax rates and GST split automatically.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setGstEnabled((value) => !value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition",
                    gstEnabled
                      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-600"
                  )}
                >
                  {gstEnabled ? "GST On" : "GST Off"}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Place of Supply</label>
                  <select
                    value={placeOfSupply}
                    onChange={(event) => setPlaceOfSupply(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-teal-500/30 transition focus:ring-2"
                    disabled={!gstEnabled}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">SAC Code</label>
                  <GlassInput
                    value={sacCode}
                    onChange={(event) => setSacCode(event.target.value)}
                    placeholder="998314"
                    disabled={!gstEnabled}
                  />
                </div>
              </div>

              {organizationBillingState ? (
                <p className="mt-2 text-xs text-slate-500">
                  Billing State: <span className="font-medium text-slate-700">{organizationBillingState}</span>
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Quick Line Item Presets</label>
              <div className="flex flex-wrap gap-2">
                {LINE_ITEM_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.item)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Line Items</label>
              <div className="space-y-3">
                {draftItems.map((item, index) => (
                  <div key={`draft-item-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <GlassInput
                      type="text"
                      value={item.description}
                      onChange={(event) => updateDraftLine(index, "description", event.target.value)}
                      placeholder="Description"
                      required
                    />

                    <div className="mt-2 grid grid-cols-3 gap-2">
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
                        disabled={!gstEnabled}
                      />
                    </div>

                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-600 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="mt-2 text-xs font-semibold text-teal-700 transition hover:text-teal-600"
                onClick={addDraftLine}
              >
                + Add line item
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Notes</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-teal-500/30 transition focus:ring-2"
                placeholder="Payment terms, itinerary references, or additional note..."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatMoney(draftTotals.subtotal, currency)}</span>
              </div>
              <div className="mt-1 flex justify-between text-slate-600">
                <span>Tax</span>
                <span>{formatMoney(draftTotals.tax, currency)}</span>
              </div>

              {gstEnabled ? (
                <>
                  <div className="mt-1 flex justify-between text-slate-600">
                    <span>CGST</span>
                    <span>{formatMoney(draftTotals.split.cgst, currency)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-slate-600">
                    <span>SGST</span>
                    <span>{formatMoney(draftTotals.split.sgst, currency)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-slate-600">
                    <span>IGST</span>
                    <span>{formatMoney(draftTotals.split.igst, currency)}</span>
                  </div>
                </>
              ) : null}

              <div className="mt-2 flex justify-between border-t border-slate-300 pt-2 font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatMoney(draftTotals.total, currency)}</span>
              </div>
            </div>

            <GlassButton type="submit" variant="primary" disabled={saving} className="w-full bg-slate-900 text-white hover:bg-slate-800">
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  Create Invoice
                </>
              )}
            </GlassButton>
          </form>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard padding="lg" className="border-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Template Selection</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">Invoice Preview Styles</h2>
              </div>

              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", previewTheme.pillClass)}>
                Active: {previewTheme.name}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {TEMPLATE_META.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setPreviewTemplate(template.id)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition",
                    previewTemplate === template.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "mb-2 h-16 rounded-xl border border-slate-200 bg-gradient-to-br",
                      template.accentClass,
                      previewTemplate === template.id ? "border-white/20" : ""
                    )}
                  />
                  <p className="text-sm font-semibold">{template.name}</p>
                  <p className={cn("mt-1 text-xs", previewTemplate === template.id ? "text-slate-200" : "text-slate-500")}>{template.description}</p>
                </button>
              ))}
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
            <GlassCard padding="lg" className="border-slate-200">
              <div className="mb-4 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Recent Invoices</h2>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-700">No invoices yet</p>
                  <p className="mt-1 text-xs text-slate-500">Create your first invoice from the panel on the left.</p>
                </div>
              ) : (
                <div className="max-h-[780px] space-y-3 overflow-y-auto pr-1">
                  {invoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      type="button"
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      className={cn(
                        "w-full rounded-2xl border p-3 text-left transition",
                        selectedInvoiceId === invoice.id
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{invoice.invoice_number}</p>
                          <p className={cn("mt-1 text-xs", selectedInvoiceId === invoice.id ? "text-slate-200" : "text-slate-500")}>
                            {invoice.client_snapshot?.full_name || invoice.client_snapshot?.email || "Walk-in client"}
                          </p>
                        </div>

                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                            selectedInvoiceId === invoice.id ? "border-white/25 bg-white/10 text-white" : statusTone(invoice.status)
                          )}
                        >
                          {invoice.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className={cn("mt-2 flex items-center justify-between text-xs", selectedInvoiceId === invoice.id ? "text-slate-200" : "text-slate-500")}>
                        <span>Issued {formatDate(invoice.issued_at || invoice.created_at)}</span>
                        <span className="font-semibold">{formatMoney(invoice.total_amount, invoice.currency)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard padding="lg" className="border-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Invoice Preview</h2>
                  <p className="text-xs text-slate-500">Template-aware preview and share actions</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <GlassButton type="button" variant="outline" size="sm" onClick={handlePrintInvoice} disabled={!selectedInvoice}>
                    <Printer className="h-4 w-4" />
                    Print
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownloadPdf()}
                    disabled={!selectedInvoice || downloadingPdf}
                  >
                    {downloadingPdf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleEmailPdf()}
                    disabled={!selectedInvoice || emailingPdf}
                  >
                    {emailingPdf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Email
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleWhatsAppShare}
                    disabled={!selectedInvoice}
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </GlassButton>
                </div>
              </div>

              {!selectedInvoice ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <Building2 className="mx-auto h-7 w-7 text-slate-400" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">Select an invoice to preview</p>
                  <p className="mt-1 text-xs text-slate-500">Use the list on the left to open invoice details and sharing actions.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className={cn("rounded-2xl border border-slate-200 bg-gradient-to-br p-4", previewTheme.accentClass)}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tax Invoice</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          {selectedInvoice.organization_snapshot?.name || "Travel Suite"}
                        </p>
                        {selectedInvoice.organization_snapshot?.gstin ? (
                          <p className="mt-1 text-xs text-slate-600">GSTIN: {selectedInvoice.organization_snapshot.gstin}</p>
                        ) : null}
                        {buildAddressLine(selectedInvoice.organization_snapshot?.billing_address) ? (
                          <p className="mt-1 max-w-lg text-xs text-slate-600">
                            {buildAddressLine(selectedInvoice.organization_snapshot?.billing_address)}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{selectedInvoice.invoice_number}</p>
                        <p className="mt-1 text-xs text-slate-600">Issued {formatDate(selectedInvoice.issued_at || selectedInvoice.created_at)}</p>
                        <p className="text-xs text-slate-600">Due {formatDate(selectedInvoice.due_date)}</p>
                        <span className={cn("mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", statusTone(selectedInvoice.status))}>
                          {selectedInvoice.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-white/70 bg-white/80 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Billed To</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedInvoice.client_snapshot?.full_name || selectedInvoice.client_snapshot?.email || "Walk-in client"}
                      </p>
                      {selectedInvoice.client_snapshot?.email ? (
                        <p className="mt-1 text-xs text-slate-600">{selectedInvoice.client_snapshot.email}</p>
                      ) : null}
                      {selectedInvoice.client_snapshot?.phone ? (
                        <p className="text-xs text-slate-600">{selectedInvoice.client_snapshot.phone}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold uppercase tracking-[0.08em]">Description</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-[0.08em]">Qty</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-[0.08em]">Rate</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-[0.08em]">Tax</th>
                          <th className="px-3 py-2 text-right font-semibold uppercase tracking-[0.08em]">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.line_items.map((item, index) => (
                          <tr key={`${selectedInvoice.id}-line-${index}`} className="border-t border-slate-200 bg-white">
                            <td className="px-3 py-2">
                              <p className="font-medium text-slate-800">{item.description}</p>
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{formatMoney(item.unit_price, selectedInvoice.currency)}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{item.tax_rate}%</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-800">{formatMoney(item.line_total, selectedInvoice.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <Sparkles className="h-3.5 w-3.5" />
                        Notes
                      </p>
                      <p className="text-sm text-slate-600">{selectedInvoice.notes || "No additional notes."}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>{formatMoney(selectedInvoice.subtotal_amount, selectedInvoice.currency)}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-slate-600">
                        <span>Tax</span>
                        <span>{formatMoney(selectedInvoice.tax_amount, selectedInvoice.currency)}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-slate-600">
                        <span>CGST</span>
                        <span>{formatMoney(Number(selectedInvoice.cgst || 0), selectedInvoice.currency)}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-slate-600">
                        <span>SGST</span>
                        <span>{formatMoney(Number(selectedInvoice.sgst || 0), selectedInvoice.currency)}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-slate-600">
                        <span>IGST</span>
                        <span>{formatMoney(Number(selectedInvoice.igst || 0), selectedInvoice.currency)}</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t border-slate-300 pt-2 font-semibold text-slate-900">
                        <span>Total</span>
                        <span>{formatMoney(selectedInvoice.total_amount, selectedInvoice.currency)}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-emerald-700">
                        <span>Paid</span>
                        <span>{formatMoney(selectedInvoice.paid_amount, selectedInvoice.currency)}</span>
                      </div>
                      <div className="mt-1 flex justify-between text-rose-600">
                        <span>Balance</span>
                        <span>{formatMoney(selectedInvoice.balance_amount, selectedInvoice.currency)}</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleRecordPayment} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <Wallet className="h-3.5 w-3.5" />
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

                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <GlassInput
                        type="text"
                        value={paymentReference}
                        onChange={(event) => setPaymentReference(event.target.value)}
                        placeholder="Reference"
                      />
                      <GlassInput
                        type="text"
                        value={paymentNotes}
                        onChange={(event) => setPaymentNotes(event.target.value)}
                        placeholder="Notes"
                      />
                    </div>

                    <GlassButton type="submit" variant="primary" disabled={paying} className="mt-3 w-full bg-slate-900 text-white hover:bg-slate-800">
                      {paying ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-4 w-4" />
                          Record Payment
                        </>
                      )}
                    </GlassButton>
                  </form>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
