"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassButton } from "@/components/glass/GlassButton";
import { formatINR } from "@/lib/india/formats";
import { SERVICE_CATEGORIES, CATEGORY_LABELS } from "../types";
import type { ServiceCategory, VendorHistoryItem } from "../types";

interface TripCostEditorProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  costId: string | null;
  onSaved: () => void;
  fetchVendorHistory: (vendor: string, category: string) => Promise<VendorHistoryItem[]>;
}

export function TripCostEditor({
  isOpen, onClose, tripId, costId, onSaved, fetchVendorHistory,
}: TripCostEditorProps) {
  const [category, setCategory] = useState<ServiceCategory>("hotels");
  const [vendorName, setVendorName] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [paxCount, setPaxCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorHistory, setVendorHistory] = useState<VendorHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (costId) {
      fetch(`/api/admin/pricing/trip-costs/${costId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.category) setCategory(data.category);
          if (data.vendor_name) setVendorName(data.vendor_name);
          if (data.cost_amount != null) setCostAmount(String(data.cost_amount));
          if (data.price_amount != null) setPriceAmount(String(data.price_amount));
          if (data.pax_count != null) setPaxCount(String(data.pax_count));
          if (data.notes) setNotes(data.notes);
        })
        .catch(() => {});
    }
  }, [costId]);

  useEffect(() => {
    if (vendorName.length < 2) {
      setVendorHistory([]);
      setShowHistory(false);
      return;
    }
    const timer = setTimeout(async () => {
      const history = await fetchVendorHistory(vendorName, category);
      setVendorHistory(history);
      setShowHistory(history.length > 0);
    }, 400);
    return () => clearTimeout(timer);
  }, [vendorName, category, fetchVendorHistory]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        trip_id: tripId,
        category,
        vendor_name: vendorName || null,
        cost_amount: parseFloat(costAmount) || 0,
        price_amount: parseFloat(priceAmount) || 0,
        pax_count: parseInt(paxCount) || 1,
        notes: notes || null,
      };

      const url = costId
        ? `/api/admin/pricing/trip-costs/${costId}`
        : "/api/admin/pricing/trip-costs";
      const method = costId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [tripId, category, vendorName, costAmount, priceAmount, paxCount, notes, costId, onSaved]);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={costId ? "Edit Cost Item" : "Add Cost Item"}
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
            className="w-full px-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
          >
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-secondary mb-1.5">Vendor Name</label>
          <input
            type="text"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            onFocus={() => { if (vendorHistory.length > 0) setShowHistory(true); }}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder="e.g. Hotel Taj Palace"
            className="w-full px-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
          />
          {showHistory && vendorHistory.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
              <div className="p-2 text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-gray-100">
                Vendor History
              </div>
              {vendorHistory.map((h, i) => (
                <button
                  key={i}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setCostAmount(String(h.cost_amount));
                    setShowHistory(false);
                  }}
                >
                  <span className="font-medium text-secondary">
                    Last paid {formatINR(h.cost_amount)}
                  </span>
                  <span className="text-text-muted text-xs ml-2">for {h.trip_title}</span>
                  <span className="text-text-muted text-xs ml-1">
                    ({new Date(h.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "2-digit",
                    })})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Cost Amount (₹) *
            </label>
            <input
              type="number"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-sm"
            />
            <p className="text-[10px] text-text-muted mt-1">Paid to vendor</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Price Amount (₹) *
            </label>
            <input
              type="number"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
            />
            <p className="text-[10px] text-text-muted mt-1">Charged to client</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">Pax Count</label>
          <input
            type="number"
            value={paxCount}
            onChange={(e) => setPaxCount(e.target.value)}
            min="1"
            className="w-full px-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes..."
            className="w-full px-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <GlassButton variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </GlassButton>
          <GlassButton onClick={handleSave} loading={saving}>
            {costId ? "Update" : "Save"}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
