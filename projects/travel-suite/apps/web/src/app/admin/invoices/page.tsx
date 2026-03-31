"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";
import { RefreshCw } from "lucide-react";

import type {
  ClientOption,
  InvoiceRecord,
  InvoiceTemplate,
  OrganizationSnapshot,
  PreviewMode,
} from "@/features/admin/invoices/types";
import { buildInvoiceMarkup, formatMoney, roundCurrency } from "@/features/admin/invoices/helpers";
import { useInvoiceDraft } from "@/features/admin/invoices/useInvoiceDraft";
import InvoiceCreateForm from "@/features/admin/invoices/InvoiceCreateForm";
import InvoiceLivePreview from "@/features/admin/invoices/InvoiceLivePreview";
import InvoiceListPanel from "@/features/admin/invoices/InvoiceListPanel";
import { GuidedTour } from '@/components/tour/GuidedTour';

export default function AdminInvoicesPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailingPdf, setEmailingPdf] = useState(false);
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [orgSnapshot, setOrgSnapshot] = useState<OrganizationSnapshot | null>(null);

  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate>("executive");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("draft");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const organizationBillingState = useMemo(
    () =>
      orgSnapshot?.billing_state ||
      selectedInvoice?.organization_snapshot?.billing_state ||
      invoices.find((inv) => inv.organization_snapshot?.billing_state)?.organization_snapshot?.billing_state ||
      null,
    [invoices, orgSnapshot, selectedInvoice]
  );

  const draft = useInvoiceDraft(organizationBillingState);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === draft.clientId) || null,
    [clients, draft.clientId]
  );

  useEffect(() => {
    draft.autoFillForClient(selectedClient);
  }, [selectedClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const authHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  }, [supabase]);

  const loadOrganization = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      if (!profile?.organization_id) return;
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, logo_url, gstin, billing_state, billing_address, primary_color")
        .eq("id", profile.organization_id)
        .single();
      if (org) {
        const billingAddr = typeof org.billing_address === "object" && org.billing_address !== null
          ? (org.billing_address as OrganizationSnapshot["billing_address"])
          : null;
        setOrgSnapshot({
          id: org.id,
          name: org.name,
          logo_url: org.logo_url,
          gstin: org.gstin,
          billing_state: org.billing_state,
          billing_address: billingAddr,
          primary_color: org.primary_color,
        });
      }
    } catch {
      // Org fetch is non-critical; logo just won't appear for draft preview
    }
  }, [supabase]);

  const loadInvoices = useCallback(
    async (showRefreshToast = false) => {
      const headers = await authHeaders();
      const response = await fetch("/api/invoices?limit=50", { headers, cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to load invoices");

      const list = (payload?.invoices || []) as InvoiceRecord[];
      setInvoices(list);
      setSelectedInvoiceId((prev) => {
        if (prev && list.some((inv) => inv.id === prev)) return prev;
        return list[0]?.id || null;
      });

      if (showRefreshToast) {
        toast({ title: "Invoices refreshed", description: "Data is up to date.", variant: "success" });
      }
    },
    [authHeaders, toast]
  );

  const loadClients = useCallback(async () => {
    const headers = await authHeaders();
    const response = await fetch("/api/admin/clients", { headers, cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || "Failed to load clients");

    setClients(
      ((payload?.clients || []) as ClientOption[]).map((c) => ({
        id: c.id,
        full_name: c.full_name,
        email: c.email || null,
        phone: c.phone,
        travel_style: c.travel_style,
        client_tag: c.client_tag,
      }))
    );
  }, [authHeaders]);

  const loadInvoiceDetails = useCallback(
    async (invoiceId: string) => {
      const headers = await authHeaders();
      const response = await fetch(`/api/invoices/${invoiceId}`, { headers, cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to load invoice details");
      setSelectedInvoice(payload.invoice as InvoiceRecord);
    },
    [authHeaders]
  );

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      setLoading(true);
      try {
        await Promise.all([loadClients(), loadInvoices(), loadOrganization()]);
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
  }, [loadClients, loadInvoices, loadOrganization, toast]);

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

  const draftAsInvoice: InvoiceRecord = useMemo(() => ({
    id: "draft",
    invoice_number: "DRAFT",
    status: "draft",
    currency: draft.currency,
    due_date: draft.dueDate || null,
    issued_at: new Date().toISOString(),
    subtotal_amount: draft.draftTotals.subtotal,
    tax_amount: draft.draftTotals.tax,
    total_amount: draft.draftTotals.total,
    paid_amount: 0,
    balance_amount: draft.draftTotals.total,
    amount: draft.draftTotals.total,
    cgst: draft.draftTotals.split.cgst,
    sgst: draft.draftTotals.split.sgst,
    igst: draft.draftTotals.split.igst,
    place_of_supply: draft.placeOfSupply || null,
    sac_code: draft.sacCode || null,
    created_at: new Date().toISOString(),
    line_items: draft.computedLineItems,
    notes: draft.notes || null,
    organization_snapshot: orgSnapshot ||
      invoices[0]?.organization_snapshot ||
      null,
    client_snapshot: selectedClient
      ? {
          id: selectedClient.id,
          full_name: selectedClient.full_name,
          email: selectedClient.email,
          phone: selectedClient.phone || null,
        }
      : null,
  }), [draft, orgSnapshot, invoices, selectedClient]);

  const previewInvoice = previewMode === "draft" ? draftAsInvoice : (selectedInvoice || draftAsInvoice);

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setPreviewMode("saved");
    setPaymentLinkUrl(null);
  };

  const handleSwitchToDraft = () => {
    setPreviewMode("draft");
  };

  const handleCreateInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const items = draft.draftItems.map((item) => ({
        description: item.description,
        quantity: Number.parseFloat(item.quantity || "0"),
        unit_price: Number.parseFloat(item.unit_price || "0"),
        tax_rate: draft.gstEnabled ? Number.parseFloat(item.tax_rate || "0") : 0,
      }));

      const headers = await authHeaders();
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          client_id: draft.clientId || undefined,
          currency: draft.currency,
          due_date: draft.dueDate || undefined,
          notes: draft.notes || undefined,
          items,
          status: "issued",
          place_of_supply: draft.gstEnabled
            ? draft.placeOfSupply || organizationBillingState || undefined
            : null,
          sac_code: draft.gstEnabled ? draft.sacCode || "998314" : null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to create invoice");

      toast({
        title: "Invoice created",
        description: `Created ${payload?.invoice?.invoice_number || "new invoice"}.`,
        variant: "success",
      });

      const invoice = payload.invoice as InvoiceRecord;
      await loadInvoices();
      setSelectedInvoiceId(invoice.id);
      setPreviewMode("saved");
      draft.resetDraft();
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
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid payment amount.");

      const headers = await authHeaders();
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          amount,
          method: paymentMethod,
          reference: paymentReference || undefined,
          notes: paymentNotes || undefined,
          status: "completed",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to record payment");

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

  const handleSendPaymentLink = useCallback(async () => {
    if (!selectedInvoice) return;
    const balance = Number(selectedInvoice.balance_amount || 0);
    if (balance <= 0) {
      toast({ title: "No balance due", description: "This invoice is already paid.", variant: "warning" });
      return;
    }

    setSendingPaymentLink(true);
    setPaymentLinkUrl(null);
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/payments/links", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          amount: Math.round(balance * 100),
          currency: selectedInvoice.currency || "INR",
          description: `Invoice ${selectedInvoice.invoice_number}`,
          clientName: selectedInvoice.client_snapshot?.full_name || undefined,
          clientEmail: selectedInvoice.client_snapshot?.email || undefined,
          clientPhone: selectedInvoice.client_snapshot?.phone || undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to create payment link");

      const token = payload?.data?.token || payload?.token;
      if (!token) throw new Error("No payment token returned");

      const linkUrl = `${window.location.origin}/pay/${token}`;
      setPaymentLinkUrl(linkUrl);
      toast({ title: "Payment link created", description: "Copy and share with the client.", variant: "success" });
    } catch (error) {
      toast({
        title: "Payment link failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setSendingPaymentLink(false);
    }
  }, [authHeaders, selectedInvoice, toast]);

  const handleAddClient = useCallback(async (client: { full_name: string; email: string; phone?: string }): Promise<string | null> => {
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          full_name: client.full_name,
          email: client.email,
          phone: client.phone,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Failed to create client");

      const newClientId = payload?.client?.user_id || payload?.client?.id || payload?.id;
      if (!newClientId) throw new Error("No client ID returned");

      toast({ title: "Client added", description: `${client.full_name} created.`, variant: "success" });
      // Immediately add to local list so the dropdown shows the new client
      setClients((prev) => [
        ...prev,
        { id: newClientId, full_name: client.full_name, email: client.email, phone: client.phone || null },
      ]);
      // Also do a full reload in the background
      void loadClients();
      return newClientId;
    } catch (error) {
      toast({
        title: "Failed to add client",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
      return null;
    }
  }, [authHeaders, loadClients, toast]);

  const buildInvoicePdfBlob = useCallback(
    async (invoice: InvoiceRecord) => {
      const [{ pdf }, { InvoiceDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf/InvoiceDocument"),
      ]);
      return pdf(<InvoiceDocument invoice={invoice} template={previewTemplate} />).toBlob();
    },
    [previewTemplate]
  );

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
        description: error instanceof Error ? error.message : "Failed to generate PDF.",
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
      toast({ title: "Client email unavailable", description: "Add a client email to send.", variant: "warning" });
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
          if (!encoded) { reject(new Error("Failed to encode PDF data")); return; }
          resolve(encoded);
        };
        reader.onerror = () => reject(new Error("Failed to read PDF file"));
      });

      const headers = await authHeaders();
      const response = await fetch("/api/invoices/send-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          client_email: clientEmail,
          pdf_base64: base64,
          invoice_number: selectedInvoice.invoice_number,
          organization_name: selectedInvoice.organization_snapshot?.name || "TripBuilt",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (response.status === 202 && payload?.disabled) {
        toast({ title: "Email integration disabled", description: payload?.error || "Not configured.", variant: "warning" });
        return;
      }
      if (!response.ok) throw new Error(payload?.error || "Failed to send invoice email");

      toast({ title: "Invoice emailed", description: `Sent to ${clientEmail}.`, variant: "success" });
    } catch (error) {
      toast({
        title: "Invoice email failed",
        description: error instanceof Error ? error.message : "Failed to send.",
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
      `Invoice ${selectedInvoice.invoice_number}\nTotal: ${formatMoney(selectedInvoice.total_amount, selectedInvoice.currency)}\nBalance: ${formatMoney(selectedInvoice.balance_amount, selectedInvoice.currency)}\nDue: ${new Date(selectedInvoice.due_date || "").toLocaleDateString("en-IN")}\n\nDear ${clientName}, please find your invoice details attached.`;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [selectedInvoice]);

  const handlePrintInvoice = useCallback(() => {
    if (!selectedInvoice) return;
    const popup = window.open("", "_blank", "width=980,height=900");
    if (!popup) return;
    popup.document.write(buildInvoiceMarkup(selectedInvoice, previewTemplate));
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
  }, [previewTemplate, selectedInvoice]);

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadInvoices(true), loadClients(), loadOrganization()]);
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
    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0);
    const paidCount = invoices.filter((inv) => inv.status === "paid").length;
    const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;
    return {
      totalInvoiced: roundCurrency(totalInvoiced),
      totalOutstanding: roundCurrency(totalOutstanding),
      paidCount,
      overdueCount,
      total: invoices.length,
    };
  }, [invoices]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <GuidedTour />
      <section className="rounded-2xl md:rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-4 md:p-6 shadow-[0_14px_45px_-24px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Finance Workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Invoice Studio
            </h1>
            <p className="max-w-xl text-sm text-slate-600">
              Create GST-ready invoices with live preview, share via email or WhatsApp, and track payments.
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

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Total Invoiced
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatMoney(totalsOverview.totalInvoiced, "INR")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Outstanding
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-700">
              {formatMoney(totalsOverview.totalOutstanding, "INR")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Paid
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-700">
              {totalsOverview.paidCount}
              <span className="ml-1.5 text-xs font-normal text-slate-500">
                of {totalsOverview.total}
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Overdue
            </p>
            <p className="mt-1 text-lg font-semibold text-rose-600">
              {totalsOverview.overdueCount}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)_300px]">
        <GlassCard padding="lg" className="border-slate-200 xl:max-h-[calc(100vh-220px)] xl:overflow-y-auto" data-tour="invoice-create-form">
          <InvoiceCreateForm
            clients={clients}
            clientId={draft.clientId}
            onClientIdChange={(id) => {
              draft.setClientId(id);
              setPreviewMode("draft");
            }}
            selectedClient={selectedClient}
            currency={draft.currency}
            onCurrencyChange={(v) => {
              draft.setCurrency(v);
              setPreviewMode("draft");
            }}
            dueDate={draft.dueDate}
            onDueDateChange={(v) => {
              draft.setDueDate(v);
              setPreviewMode("draft");
            }}
            gstEnabled={draft.gstEnabled}
            onGstToggle={() => {
              draft.setGstEnabled((prev) => !prev);
              setPreviewMode("draft");
            }}
            placeOfSupply={draft.placeOfSupply}
            onPlaceOfSupplyChange={(v) => {
              draft.setPlaceOfSupply(v);
              setPreviewMode("draft");
            }}
            tripDates={draft.tripDates}
            onTripDatesChange={(v) => {
              draft.setTripDates(v);
              setPreviewMode("draft");
            }}
            organizationBillingState={organizationBillingState}
            draftItems={draft.draftItems}
            onAddLine={() => {
              draft.addDraftLine();
              setPreviewMode("draft");
            }}
            onRemoveLine={(i) => {
              draft.removeDraftLine(i);
              setPreviewMode("draft");
            }}
            onUpdateLine={(i, field, value) => {
              draft.updateDraftLine(i, field, value);
              setPreviewMode("draft");
            }}
            onApplyPreset={(preset) => {
              draft.applyPreset(preset);
              setPreviewMode("draft");
            }}
            notes={draft.notes}
            onNotesChange={(v) => {
              draft.setNotes(v);
              setPreviewMode("draft");
            }}
            draftTotals={draft.draftTotals}
            saving={saving}
            onSubmit={handleCreateInvoice}
            onAddClient={handleAddClient}
            orgSnapshot={orgSnapshot}
          />
        </GlassCard>

        <div className="min-w-0" data-tour="invoice-preview">
          <InvoiceLivePreview
            invoice={previewInvoice}
            previewTemplate={previewTemplate}
            onTemplateChange={setPreviewTemplate}
            previewMode={previewMode}
          />
        </div>

        <GlassCard padding="md" className="border-slate-200 xl:max-h-[calc(100vh-220px)] xl:overflow-y-auto" data-tour="invoice-list">
          <InvoiceListPanel
            invoices={invoices}
            selectedInvoiceId={selectedInvoiceId}
            loading={loading}
            onSelectInvoice={handleSelectInvoice}
            onSwitchToDraft={handleSwitchToDraft}
            previewMode={previewMode}
            selectedInvoice={selectedInvoice}
            onPrint={handlePrintInvoice}
            onDownloadPdf={() => void handleDownloadPdf()}
            onEmailPdf={() => void handleEmailPdf()}
            onWhatsApp={handleWhatsAppShare}
            downloadingPdf={downloadingPdf}
            emailingPdf={emailingPdf}
            paymentAmount={paymentAmount}
            paymentMethod={paymentMethod}
            paymentReference={paymentReference}
            paymentNotes={paymentNotes}
            onPaymentAmountChange={setPaymentAmount}
            onPaymentMethodChange={setPaymentMethod}
            onPaymentReferenceChange={setPaymentReference}
            onPaymentNotesChange={setPaymentNotes}
            onRecordPayment={handleRecordPayment}
            paying={paying}
            onSendPaymentLink={() => void handleSendPaymentLink()}
            sendingPaymentLink={sendingPaymentLink}
            paymentLinkUrl={paymentLinkUrl}
          />
        </GlassCard>
      </div>
    </div>
  );
}
