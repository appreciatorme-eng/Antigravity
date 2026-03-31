"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Upload, TrendingUp, TrendingDown } from "lucide-react";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassButton } from "@/components/glass/GlassButton";
import { formatINR } from "@/lib/india/formats";
import { cn } from "@/lib/utils";
import { SERVICE_CATEGORIES, CATEGORY_LABELS } from "../types";
import type { ServiceCategory, VendorHistoryItem } from "../types";
import { ReceiptUploader } from "./ReceiptUploader";
import { authedFetch } from "@/lib/api/authed-fetch";
import { useDemoFetch } from "@/lib/demo/use-demo-fetch";
import { createClient } from "@/lib/supabase/client";

interface TripOption {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  pax_count: number;
  client_name: string | null;
}

interface QuickExpenseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedToTrip: boolean) => void;
  fetchVendorHistory: (vendor: string, category: string) => Promise<VendorHistoryItem[]>;
}

export function QuickExpenseEditor({
  isOpen, onClose, onSaved, fetchVendorHistory,
}: QuickExpenseEditorProps) {
  const demoFetch = useDemoFetch();

  // Trip search
  const [tripSearch, setTripSearch] = useState("");
  const [tripOptions, setTripOptions] = useState<TripOption[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripOption | null>(null);
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Form fields
  const [category, setCategory] = useState<ServiceCategory>("hotels");
  const [vendorName, setVendorName] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [commissionPct, setCommissionPct] = useState("0");
  const [paxCount, setPaxCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Vendor history
  const [vendorHistory, setVendorHistory] = useState<VendorHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Receipt
  const [showReceiptUploader, setShowReceiptUploader] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const cost = parseFloat(costAmount) || 0;
  const price = parseFloat(priceAmount) || 0;
  const profit = price - cost;
  const marginPct = price > 0 ? Math.round((profit / price) * 1000) / 10 : 0;
  const commissionAmount = Math.round(cost * (parseFloat(commissionPct) || 0) / 100 * 100) / 100;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTripSearch("");
      setSelectedTrip(null);
      setCategory("hotels");
      setVendorName("");
      setCostAmount("");
      setPriceAmount("");
      setCommissionPct("0");
      setPaxCount("1");
      setNotes("");
      setExpenseDate(new Date().toISOString().slice(0, 10));
      setError(null);
      setReceiptId(null);
      setReceiptUrl(null);
    }
  }, [isOpen]);

  // Search trips
  useEffect(() => {
    if (!isOpen) return;
    const q = tripSearch.trim();
    const timer = setTimeout(async () => {
      setLoadingTrips(true);
      try {
        const params = q.length >= 2 ? `?q=${encodeURIComponent(q)}` : "";
        const res = await demoFetch(`/api/admin/pricing/trips/search${params}`);
        if (res.ok) {
          const json = await res.json();
          setTripOptions(json.trips || []);
        }
      } catch {
        // silently fail search
      } finally {
        setLoadingTrips(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tripSearch, isOpen, demoFetch]);

  // Auto-populate pax from selected trip
  useEffect(() => {
    if (selectedTrip) {
      setPaxCount(String(selectedTrip.pax_count || 1));
    }
  }, [selectedTrip]);

  // Vendor history autocomplete
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

  const handleSelectTrip = useCallback((trip: TripOption) => {
    setSelectedTrip(trip);
    setTripSearch(trip.name);
    setShowTripDropdown(false);
  }, []);

  const handleAmountExtracted = useCallback((amount: number, extractedReceiptId: string, extractedReceiptUrl: string) => {
    setCostAmount(String(amount));
    setReceiptId(extractedReceiptId);
    setReceiptUrl(extractedReceiptUrl);
    setShowReceiptUploader(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!costAmount && !priceAmount) {
      setError("Please enter cost or revenue amount");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (selectedTrip) {
        // Save as trip service cost
        const payload = {
          trip_id: selectedTrip.id,
          category,
          vendor_name: vendorName || null,
          cost_amount: cost,
          price_amount: price,
          commission_pct: parseFloat(commissionPct) || 0,
          commission_amount: commissionAmount,
          pax_count: parseInt(paxCount) || 1,
          notes: notes || null,
        };

        const res = await authedFetch("/api/admin/pricing/trip-costs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }

        const savedData = await res.json();
        const savedCostId = savedData.data?.id || savedData.id;

        // Link receipt if uploaded
        if (receiptId && savedCostId) {
          const supabase = createClient();
          await supabase
            .from("expense_receipts")
            .update({ trip_service_cost_id: savedCostId })
            .eq("id", receiptId);
        }
      } else {
        // No trip selected — save as monthly overhead expense
        const description = [vendorName, notes].filter(Boolean).join(" — ") || undefined;
        const payload = {
          month_start: expenseDate.slice(0, 7) + "-01",
          category: CATEGORY_LABELS[category],
          description,
          amount: cost || price,
        };

        const res = await authedFetch("/api/admin/pricing/overheads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
      }

      onSaved(!!selectedTrip);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [selectedTrip, category, vendorName, cost, price, commissionPct, commissionAmount, paxCount, notes, costAmount, priceAmount, receiptId, expenseDate, onSaved]);

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Expense"
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-600">
            {error}
          </div>
        )}

        {/* Trip Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-secondary mb-1.5">Trip <span className="text-text-muted font-normal">(optional)</span></label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={tripSearch}
              onChange={(e) => {
                setTripSearch(e.target.value);
                setSelectedTrip(null);
                setShowTripDropdown(true);
              }}
              onFocus={() => setShowTripDropdown(true)}
              onBlur={() => setTimeout(() => setShowTripDropdown(false), 200)}
              placeholder="Search trips by name or destination..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
            />
          </div>
          {showTripDropdown && tripOptions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
              {loadingTrips && (
                <div className="px-4 py-2 text-xs text-text-muted">Searching...</div>
              )}
              {tripOptions.map((trip) => (
                <button
                  key={trip.id}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectTrip(trip);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-secondary">{trip.name}</span>
                    {trip.start_date && (
                      <span className="text-[10px] text-text-muted">
                        {new Date(trip.start_date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {trip.destination && (
                      <span className="text-xs text-text-muted">{trip.destination}</span>
                    )}
                    {trip.client_name && (
                      <span className="text-xs text-primary/70">· {trip.client_name}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Client (auto-populated) */}
        {selectedTrip?.client_name && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200/50">
            <span className="text-xs font-medium text-blue-600">Client:</span>
            <span className="text-sm text-blue-800 font-medium">{selectedTrip.client_name}</span>
          </div>
        )}

        {/* Category */}
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

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">Date *</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
          />
        </div>

        {/* Vendor */}
        <div className="relative">
          <label className="block text-sm font-medium text-secondary mb-1.5">Vendor</label>
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
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cost & Revenue */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-secondary">Cost (₹) *</label>
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => setShowReceiptUploader(true)}
                className="text-xs"
              >
                <Upload className="w-3 h-3" />
                Receipt
              </GlassButton>
            </div>
            {receiptUrl && (
              <div className="mb-2 p-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
                ✓ Receipt attached
              </div>
            )}
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
            <label className="block text-sm font-medium text-secondary mb-1.5">Revenue (₹) *</label>
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

        {/* Live Profit & Margin */}
        {(cost > 0 || price > 0) && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/50">
            <div className="flex items-center gap-1.5 flex-1">
              {profit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-violet-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              )}
              <span className="text-sm font-medium text-violet-700">Profit</span>
              <span className={cn(
                "text-sm font-bold tabular-nums ml-1",
                profit >= 0 ? "text-violet-600" : "text-rose-600"
              )}>
                {formatINR(profit)}
              </span>
            </div>
            <span className={cn(
              "inline-block px-2.5 py-1 rounded-full text-xs font-bold",
              marginPct >= 30 ? "bg-emerald-100 text-emerald-700"
                : marginPct >= 15 ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-600"
            )}>
              {marginPct}% margin
            </span>
          </div>
        )}

        {/* Commission */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">
            Commission % (from vendor)
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                step="0.5"
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-white/20 text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-sm whitespace-nowrap min-w-[110px] text-center">
              = {formatINR(commissionAmount)}
            </div>
          </div>
        </div>

        {/* Pax Count */}
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

        {/* Notes */}
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <GlassButton variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </GlassButton>
          <GlassButton onClick={handleSave} loading={saving}>
            Save Expense
          </GlassButton>
        </div>
      </div>

      <ReceiptUploader
        isOpen={showReceiptUploader}
        onClose={() => setShowReceiptUploader(false)}
        onAmountExtracted={handleAmountExtracted}
      />
    </GlassModal>
  );
}
