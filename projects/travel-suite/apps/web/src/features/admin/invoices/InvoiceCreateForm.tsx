"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import { INDIAN_STATES } from "@/lib/tax/gst-calculator";
import { AlertTriangle, Check, Loader2, Plus, Receipt, RefreshCw, UserPlus } from "lucide-react";
import type { ClientOption, DraftLineItem, DraftTotals, OrganizationSnapshot } from "./types";
import { formatMoney } from "./helpers";
import { LINE_ITEM_PRESETS } from "./constants";

interface InvoiceCreateFormProps {
  clients: ClientOption[];
  clientId: string;
  onClientIdChange: (id: string) => void;
  selectedClient: ClientOption | null;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  dueDate: string;
  onDueDateChange: (date: string) => void;
  gstEnabled: boolean;
  onGstToggle: () => void;
  placeOfSupply: string;
  onPlaceOfSupplyChange: (state: string) => void;
  sacCode: string;
  onSacCodeChange: (code: string) => void;
  organizationBillingState: string | null;
  draftItems: DraftLineItem[];
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onUpdateLine: (index: number, field: keyof DraftLineItem, value: string) => void;
  onApplyPreset: (preset: DraftLineItem) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  draftTotals: DraftTotals;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onAddClient: (client: { full_name: string; email: string; phone?: string }) => Promise<string | null>;
  orgSnapshot: OrganizationSnapshot | null;
}

function isOrgBrandingIncomplete(org: OrganizationSnapshot | null): boolean {
  if (!org) return true;
  if (!org.logo_url) return true;
  if (!org.gstin) return true;
  const addr = org.billing_address;
  if (!addr || (!addr.line1 && !addr.city)) return true;
  return false;
}

export default function InvoiceCreateForm({
  clients,
  clientId,
  onClientIdChange,
  selectedClient,
  currency,
  onCurrencyChange,
  dueDate,
  onDueDateChange,
  gstEnabled,
  onGstToggle,
  placeOfSupply,
  onPlaceOfSupplyChange,
  sacCode,
  onSacCodeChange,
  organizationBillingState,
  draftItems,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
  onApplyPreset,
  notes,
  onNotesChange,
  draftTotals,
  saving,
  onSubmit,
  onAddClient,
  orgSnapshot,
}: InvoiceCreateFormProps) {
  const [showInlineClient, setShowInlineClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [addingClient, setAddingClient] = useState(false);

  const handleClientSelectChange = (value: string) => {
    if (value === "__new__") {
      setShowInlineClient(true);
      onClientIdChange("");
    } else {
      setShowInlineClient(false);
      onClientIdChange(value);
    }
  };

  const handleSaveNewClient = async () => {
    if (!newClientName.trim()) return;
    setAddingClient(true);
    try {
      const newId = await onAddClient({
        full_name: newClientName.trim(),
        email: newClientEmail.trim(),
        phone: newClientPhone.trim() || undefined,
      });
      if (newId) {
        onClientIdChange(newId);
        setShowInlineClient(false);
        setNewClientName("");
        setNewClientEmail("");
        setNewClientPhone("");
      }
    } finally {
      setAddingClient(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
          <Plus className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Create Invoice</h2>
      </div>

      {isOrgBrandingIncomplete(orgSnapshot) && (
        <Link
          href="/settings"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 transition hover:bg-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Complete your branding</p>
            <p className="mt-0.5 text-[11px] text-amber-700">
              Add logo, GSTIN, and address in Settings to brand your invoices.
            </p>
          </div>
        </Link>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Client
          </label>
          <select
            value={showInlineClient ? "__new__" : clientId}
            onChange={(e) => handleClientSelectChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-teal-500/30 transition focus:ring-2"
          >
            <option value="">Walk-in / Manual</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name || client.email || "Unnamed client"}
              </option>
            ))}
            <option value="__new__">+ Add New Client</option>
          </select>

          {showInlineClient && (
            <div className="space-y-2 rounded-xl border border-teal-200 bg-teal-50/50 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                <UserPlus className="h-3.5 w-3.5" />
                New Client
              </p>
              <GlassInput
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Full name *"
                required
              />
              <GlassInput
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="Email *"
                required
              />
              <GlassInput
                type="tel"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Phone (optional)"
              />
              <div className="flex gap-2">
                <GlassButton
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={addingClient || !newClientName.trim() || !newClientEmail.trim()}
                  onClick={() => void handleSaveNewClient()}
                  className="flex-1 bg-teal-700 text-white hover:bg-teal-600"
                >
                  {addingClient ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...</>
                  ) : (
                    <><Check className="h-3.5 w-3.5" /> Add Client</>
                  )}
                </GlassButton>
                <GlassButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowInlineClient(false);
                    setNewClientName("");
                    setNewClientEmail("");
                    setNewClientPhone("");
                  }}
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          )}

          {!showInlineClient && selectedClient ? (
            <p className="text-[11px] text-slate-500">
              {selectedClient.email || "No email"}
              {selectedClient.phone ? ` \u2022 ${selectedClient.phone}` : ""}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-teal-500/30 transition focus:ring-2"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <GlassInput
              type="date"
              value={dueDate}
              onChange={(e) => onDueDateChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">GST</p>
              <p className="text-[11px] text-slate-500">Auto tax split</p>
            </div>
            <button
              type="button"
              onClick={onGstToggle}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                gstEnabled
                  ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                  : "border-slate-300 bg-white text-slate-600"
              )}
            >
              {gstEnabled ? "On" : "Off"}
            </button>
          </div>

          {gstEnabled ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Place of Supply
                </label>
                <select
                  value={placeOfSupply}
                  onChange={(e) => onPlaceOfSupplyChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm outline-none ring-teal-500/30 transition focus:ring-2"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  SAC Code
                </label>
                <GlassInput
                  value={sacCode}
                  onChange={(e) => onSacCodeChange(e.target.value)}
                  placeholder="998314"
                />
              </div>
            </div>
          ) : null}

          {organizationBillingState ? (
            <p className="mt-2 text-[10px] text-slate-500">
              Billing State:{" "}
              <span className="font-medium text-slate-700">
                {organizationBillingState}
              </span>
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {LINE_ITEM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onApplyPreset(preset.item)}
                className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Line Items
          </label>
          <div className="space-y-2.5">
            {draftItems.map((item, index) => (
              <div
                key={`draft-item-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <GlassInput
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        onUpdateLine(index, "description", e.target.value)
                      }
                      placeholder="What is this item for?"
                      required
                      className="text-sm font-medium"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-0.5 block text-[9px] font-semibold uppercase text-slate-400">
                          Qty
                        </label>
                        <GlassInput
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            onUpdateLine(index, "quantity", e.target.value)
                          }
                          placeholder="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[9px] font-semibold uppercase text-slate-400">
                          Rate
                        </label>
                        <GlassInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            onUpdateLine(index, "unit_price", e.target.value)
                          }
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[9px] font-semibold uppercase text-slate-400">
                          Tax %
                        </label>
                        <GlassInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.tax_rate}
                          onChange={(e) =>
                            onUpdateLine(index, "tax_rate", e.target.value)
                          }
                          placeholder="18"
                          required
                          disabled={!gstEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 flex justify-end">
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-rose-600 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={draftItems.length === 1}
                    onClick={() => onRemoveLine(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-teal-700 transition hover:text-teal-600"
            onClick={onAddLine}
          >
            + Add line item
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-teal-500/30 transition focus:ring-2"
            placeholder="Payment terms, references..."
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
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

        <GlassButton
          type="submit"
          variant="primary"
          disabled={saving}
          className="w-full bg-slate-900 text-white hover:bg-slate-800"
        >
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
    </div>
  );
}
