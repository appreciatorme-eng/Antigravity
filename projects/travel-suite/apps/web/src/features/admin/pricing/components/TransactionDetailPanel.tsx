"use client";

// TransactionDetailPanel — full detail view for a single pricing transaction.
// Rendered inside SlideOutPanel. Shows trip context, financials, vendor history, actions.

import { useState, useEffect } from "react";
import {
  Building2, Car, Plane, FileCheck, Shield, Train, Bus, Package,
  MapPin, Users, Calendar, Tag, FileText, History, Pencil, Trash2, AlertCircle,
} from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/india/formats";
import { CATEGORY_LABELS, type ServiceCategory, type TransactionItem, type VendorHistoryItem } from "../types";
import { TripCostEditor } from "./TripCostEditor";

const CATEGORY_META: Record<ServiceCategory, { icon: React.ElementType; color: string; bg: string }> = {
  hotels:    { icon: Building2, color: "text-rose-600",    bg: "bg-rose-100" },
  vehicle:   { icon: Car,       color: "text-amber-600",   bg: "bg-amber-100" },
  flights:   { icon: Plane,     color: "text-sky-600",     bg: "bg-sky-100" },
  visa:      { icon: FileCheck, color: "text-purple-600",  bg: "bg-purple-100" },
  insurance: { icon: Shield,    color: "text-emerald-600", bg: "bg-emerald-100" },
  train:     { icon: Train,     color: "text-orange-600",  bg: "bg-orange-100" },
  bus:       { icon: Bus,       color: "text-teal-600",    bg: "bg-teal-100" },
  other:     { icon: Package,   color: "text-gray-600",    bg: "bg-gray-100" },
};

interface Props {
  transaction: TransactionItem;
  fetchVendorHistory: (vendor: string, category: string) => Promise<VendorHistoryItem[]>;
  onEdited: () => void;
  onDeleted: () => void;
}

export function TransactionDetailPanel({ transaction: t, fetchVendorHistory, onEdited, onDeleted }: Props) {
  const [history, setHistory] = useState<VendorHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const meta = CATEGORY_META[t.category as ServiceCategory] ?? CATEGORY_META.other;
  const Icon = meta.icon;
  const isProfit = t.profit >= 0;

  useEffect(() => {
    if (!t.vendor_name) return;
    setHistoryLoading(true);
    void fetchVendorHistory(t.vendor_name, t.category)
      .then((h) => setHistory(h.filter((item) => item.cost_amount !== t.cost_amount || item.created_at !== t.created_at)))
      .finally(() => setHistoryLoading(false));
  }, [t.vendor_name, t.category, fetchVendorHistory, t.cost_amount, t.created_at]);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/pricing/trip-costs/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Delete failed");
      }
      onDeleted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-5">
      {/* Category + Vendor Header */}
      <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", meta.bg)}>
          <Icon className={cn("w-6 h-6", meta.color)} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full", meta.bg, meta.color)}>
              {CATEGORY_LABELS[t.category as ServiceCategory] ?? t.category}
            </span>
          </div>
          <p className="text-base font-semibold text-secondary mt-1 leading-tight">
            {t.vendor_name || "No vendor specified"}
          </p>
          {t.description && (
            <p className="text-sm text-text-muted mt-0.5 leading-snug">{t.description}</p>
          )}
        </div>
      </div>

      {/* Trip Context */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Trip</h4>
        <div className="bg-gray-50/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Tag className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
            <span className="text-sm font-semibold text-secondary leading-snug">{t.trip_name}</span>
          </div>
          {t.destination && (
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
              <span className="text-sm text-secondary">{t.destination}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="text-sm text-secondary">{formatDate(t.start_date)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="text-sm text-secondary">{t.pax_count} {t.pax_count === 1 ? "person" : "people"}</span>
          </div>
          {t.client_name && (
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 flex items-center justify-center text-xs text-text-muted flex-shrink-0">👤</span>
              <span className="text-sm text-secondary">{t.client_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Financials */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Financials</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-rose-50 rounded-xl p-3 text-center">
            <p className="text-xs text-rose-500 font-medium mb-1">Cost Paid</p>
            <p className="text-base font-bold text-rose-600 tabular-nums">{formatINR(t.cost_amount)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 font-medium mb-1">Revenue</p>
            <p className="text-base font-bold text-emerald-600 tabular-nums">{formatINR(t.price_amount)}</p>
          </div>
          <div className={cn("rounded-xl p-3 text-center", isProfit ? "bg-violet-50" : "bg-red-50")}>
            <p className={cn("text-xs font-medium mb-1", isProfit ? "text-violet-600" : "text-red-500")}>Profit</p>
            <p className={cn("text-base font-bold tabular-nums", isProfit ? "text-violet-600" : "text-red-600")}>
              {isProfit ? "" : "−"}{formatINR(Math.abs(t.profit))}
            </p>
          </div>
          <div className={cn("rounded-xl p-3 text-center", t.margin_pct >= 30 ? "bg-emerald-50" : t.margin_pct >= 15 ? "bg-yellow-50" : "bg-red-50")}>
            <p className={cn("text-xs font-medium mb-1", t.margin_pct >= 30 ? "text-emerald-600" : t.margin_pct >= 15 ? "text-yellow-600" : "text-red-500")}>
              Margin
            </p>
            <p className={cn("text-base font-bold", t.margin_pct >= 30 ? "text-emerald-600" : t.margin_pct >= 15 ? "text-yellow-600" : "text-red-600")}>
              {t.margin_pct}%
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {t.notes && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Notes</h4>
          <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3">
            <FileText className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
            <p className="text-sm text-secondary leading-relaxed">{t.notes}</p>
          </div>
        </div>
      )}

      {/* Vendor History */}
      {t.vendor_name && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-text-muted" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Past prices — {t.vendor_name}</h4>
          </div>
          {historyLoading ? (
            <p className="text-xs text-text-muted pl-6">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-text-muted pl-6">No other transactions with this vendor</p>
          ) : (
            <div className="space-y-1.5">
              {history.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-secondary truncate">{h.trip_title}</p>
                    <p className="text-xs text-text-muted">{formatShortDate(h.created_at)}</p>
                  </div>
                  <span className="text-sm font-semibold text-rose-600 tabular-nums ml-3 flex-shrink-0">
                    {formatINR(h.cost_amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t border-gray-100 space-y-2">
        {deleteError && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {deleteError}
          </div>
        )}

        <div className="flex gap-2">
          <GlassButton
            variant="outline"
            className="flex-1"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="w-4 h-4 mr-1.5" />
            Edit
          </GlassButton>

          {!confirmDelete ? (
            <GlassButton
              variant="ghost"
              className="flex-1 text-red-500 hover:bg-red-50"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </GlassButton>
          ) : (
            <GlassButton
              variant="danger"
              className="flex-1"
              loading={deleting}
              onClick={handleDelete}
            >
              Confirm Delete
            </GlassButton>
          )}
        </div>

        {confirmDelete && !deleting && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="w-full text-xs text-text-muted hover:text-secondary text-center py-1 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <TripCostEditor
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          tripId={t.trip_id}
          costId={t.id}
          onSaved={() => {
            setEditOpen(false);
            onEdited();
          }}
          fetchVendorHistory={fetchVendorHistory}
        />
      )}
    </div>
  );
}
