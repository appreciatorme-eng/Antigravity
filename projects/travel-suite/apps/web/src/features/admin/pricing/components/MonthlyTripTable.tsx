"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { formatINR } from "@/lib/india/formats";
import { cn } from "@/lib/utils";
import { SERVICE_CATEGORIES, CATEGORY_LABELS } from "../types";
import type { TripWithCosts, ServiceCategory, VendorHistoryItem } from "../types";
import { TripCostEditor } from "./TripCostEditor";

interface MonthlyTripTableProps {
  trips: TripWithCosts[];
  onCostSaved: () => void;
  fetchVendorHistory: (vendor: string, category: string) => Promise<VendorHistoryItem[]>;
}

const STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "danger" | "default"> = {
  completed: "success",
  in_progress: "info",
  confirmed: "info",
  planned: "warning",
  pending: "warning",
  cancelled: "danger",
};

export function MonthlyTripTable({ trips, onCostSaved, fetchVendorHistory }: MonthlyTripTableProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editingCostId, setEditingCostId] = useState<string | null>(null);

  const getCategoryCostPrice = (trip: TripWithCosts, category: ServiceCategory) => {
    const items = trip.costs.filter((c) => c.category === category);
    return {
      cost: items.reduce((s, c) => s + Number(c.cost_amount), 0),
      price: items.reduce((s, c) => s + Number(c.price_amount), 0),
    };
  };

  const totals = SERVICE_CATEGORIES.reduce((acc, cat) => {
    let cost = 0, price = 0;
    for (const trip of trips) {
      const cp = getCategoryCostPrice(trip, cat);
      cost += cp.cost;
      price += cp.price;
    }
    acc[cat] = { cost, price };
    return acc;
  }, {} as Record<ServiceCategory, { cost: number; price: number }>);

  const grandTotalCost = trips.reduce((s, t) => s + t.totalCost, 0);
  const grandTotalPrice = trips.reduce((s, t) => s + t.totalPrice, 0);
  const grandProfit = grandTotalPrice - grandTotalCost;
  const grandTotalCommission = trips.reduce((s, t) => s + (t.totalCommission || 0), 0);

  if (trips.length === 0) {
    return (
      <GlassCard padding="xl" className="text-center">
        <p className="text-text-muted text-sm">
          No trips this month. Trips appear here based on their start date.
        </p>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 sticky top-0">
              <tr>
                <th className="sticky left-0 bg-gray-50/95 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                  Trip
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                  Client
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                  Pax
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                  Status
                </th>
                {SERVICE_CATEGORIES.map((cat) => (
                  <th
                    key={cat}
                    colSpan={2}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-primary whitespace-nowrap border-l border-gray-200/50"
                  >
                    {CATEGORY_LABELS[cat]}
                  </th>
                ))}
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-rose-600 whitespace-nowrap border-l border-gray-300/50">
                  Total Cost
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600 whitespace-nowrap">
                  Total Price
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-violet-600 whitespace-nowrap">
                  Profit
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-amber-600 whitespace-nowrap">
                  Commission
                </th>
                <th className="px-3 py-3 w-12" />
              </tr>
              <tr className="bg-gray-50/60">
                <th className="sticky left-0 bg-gray-50/90 z-10" />
                <th />
                <th />
                <th />
                {SERVICE_CATEGORIES.map((cat) => (
                  <Fragment key={cat}>
                    <th className="px-2 py-1 text-center text-[10px] font-bold uppercase text-rose-500 border-l border-gray-200/50">
                      C
                    </th>
                    <th className="px-2 py-1 text-center text-[10px] font-bold uppercase text-emerald-500">
                      P
                    </th>
                  </Fragment>
                ))}
                <th />
                <th />
                <th />
                <th />
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trips.map((trip) => (
                <motion.tr
                  key={trip.id}
                  className="hover:bg-gray-50/50 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td className="sticky left-0 bg-white/90 z-10 px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="text-sm font-semibold text-secondary hover:text-primary transition-colors"
                    >
                      {trip.title || "Untitled"}
                    </Link>
                    {trip.start_date && (
                      <p className="text-[10px] text-text-muted">
                        {new Date(trip.start_date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short",
                        })}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-text-secondary whitespace-nowrap text-xs">
                    {trip.client_name || "\u2014"}
                  </td>
                  <td className="px-3 py-3 text-center text-text-secondary whitespace-nowrap">
                    {trip.pax_count}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <GlassBadge
                      variant={STATUS_VARIANT[trip.status?.toLowerCase()] || "default"}
                      size="sm"
                    >
                      {trip.status?.replace(/_/g, " ") || "\u2014"}
                    </GlassBadge>
                  </td>
                  {SERVICE_CATEGORIES.map((cat) => {
                    const cp = getCategoryCostPrice(trip, cat);
                    return (
                      <Fragment key={cat}>
                        <td
                          className="px-2 py-3 text-right text-xs tabular-nums text-rose-600/80 whitespace-nowrap border-l border-gray-200/30 cursor-pointer hover:bg-rose-50/50"
                          onClick={() => {
                            setEditingTripId(trip.id);
                            setEditingCostId(null);
                            setEditorOpen(true);
                          }}
                        >
                          {cp.cost > 0 ? formatINR(cp.cost) : "\u2014"}
                        </td>
                        <td
                          className="px-2 py-3 text-right text-xs tabular-nums text-emerald-600/80 whitespace-nowrap cursor-pointer hover:bg-emerald-50/50"
                          onClick={() => {
                            setEditingTripId(trip.id);
                            setEditingCostId(null);
                            setEditorOpen(true);
                          }}
                        >
                          {cp.price > 0 ? formatINR(cp.price) : "\u2014"}
                        </td>
                      </Fragment>
                    );
                  })}
                  <td className="px-3 py-3 text-right text-xs font-bold tabular-nums text-rose-600 whitespace-nowrap border-l border-gray-300/50">
                    {formatINR(trip.totalCost)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold tabular-nums text-emerald-600 whitespace-nowrap">
                    {formatINR(trip.totalPrice)}
                  </td>
                  <td className={cn(
                    "px-3 py-3 text-right text-xs font-bold tabular-nums whitespace-nowrap",
                    trip.profit >= 0 ? "text-violet-600" : "text-rose-600"
                  )}>
                    {formatINR(trip.profit)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold tabular-nums text-amber-600 whitespace-nowrap">
                    {(trip.totalCommission || 0) > 0 ? formatINR(trip.totalCommission) : "\u2014"}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <button
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      onClick={() => {
                        setEditingTripId(trip.id);
                        setEditingCostId(null);
                        setEditorOpen(true);
                      }}
                      title="Add/Edit costs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50/90 font-bold">
              <tr>
                <td className="sticky left-0 bg-gray-50/95 z-10 px-4 py-3 text-xs uppercase tracking-wide text-secondary">
                  Totals
                </td>
                <td />
                <td />
                <td />
                {SERVICE_CATEGORIES.map((cat) => (
                  <Fragment key={cat}>
                    <td className="px-2 py-3 text-right text-xs tabular-nums text-rose-600 border-l border-gray-200/30">
                      {totals[cat].cost > 0 ? formatINR(totals[cat].cost) : "\u2014"}
                    </td>
                    <td className="px-2 py-3 text-right text-xs tabular-nums text-emerald-600">
                      {totals[cat].price > 0 ? formatINR(totals[cat].price) : "\u2014"}
                    </td>
                  </Fragment>
                ))}
                <td className="px-3 py-3 text-right text-xs tabular-nums text-rose-600 border-l border-gray-300/50">
                  {formatINR(grandTotalCost)}
                </td>
                <td className="px-3 py-3 text-right text-xs tabular-nums text-emerald-600">
                  {formatINR(grandTotalPrice)}
                </td>
                <td className={cn(
                  "px-3 py-3 text-right text-xs tabular-nums",
                  grandProfit >= 0 ? "text-violet-600" : "text-rose-600"
                )}>
                  {formatINR(grandProfit)}
                </td>
                <td className="px-3 py-3 text-right text-xs tabular-nums text-amber-600">
                  {grandTotalCommission > 0 ? formatINR(grandTotalCommission) : "\u2014"}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>

      {editorOpen && editingTripId && (
        <TripCostEditor
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setEditingTripId(null);
            setEditingCostId(null);
          }}
          tripId={editingTripId}
          costId={editingCostId}
          onSaved={() => {
            setEditorOpen(false);
            setEditingTripId(null);
            setEditingCostId(null);
            onCostSaved();
          }}
          fetchVendorHistory={fetchVendorHistory}
        />
      )}
    </>
  );
}
