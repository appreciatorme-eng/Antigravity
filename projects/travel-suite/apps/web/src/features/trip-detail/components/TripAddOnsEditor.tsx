"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { formatINR } from "@/features/trip-detail/utils";
import { cn } from "@/lib/utils";
import type { TripAddOn } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripAddOnsEditorProps {
  addOns: TripAddOn[];
  loading: boolean;
  onToggle: (addOnId: string, isSelected: boolean) => void;
  onQuantityChange: (addOnId: string, quantity: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUniqueCategories(addOns: readonly TripAddOn[]): readonly string[] {
  const seen = new Set<string>();
  return addOns.reduce<string[]>((acc, addOn) => {
    if (!seen.has(addOn.category)) {
      seen.add(addOn.category);
      return [...acc, addOn.category];
    }
    return acc;
  }, []);
}

function computeSelectedTotal(addOns: readonly TripAddOn[]): number {
  return addOns
    .filter((a) => a.is_selected)
    .reduce((sum, a) => sum + a.quantity * a.unit_price, 0);
}

// ---------------------------------------------------------------------------
// Category Pills
// ---------------------------------------------------------------------------

function CategoryPills({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: readonly string[];
  activeCategory: string | null;
  onSelect: (category: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-3 py-1.5 text-xs font-bold rounded-full border transition-colors",
          activeCategory === null
            ? "bg-primary text-white border-primary"
            : "bg-white/40 text-text-muted border-white/40 hover:bg-white/60 dark:bg-slate-800/40 dark:border-slate-700/40"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            "px-3 py-1.5 text-xs font-bold rounded-full border transition-colors capitalize",
            activeCategory === cat
              ? "bg-primary text-white border-primary"
              : "bg-white/40 text-text-muted border-white/40 hover:bg-white/60 dark:bg-slate-800/40 dark:border-slate-700/40"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-gray-300 dark:bg-slate-600"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Add-On Card
// ---------------------------------------------------------------------------

function AddOnCard({
  addOn,
  onToggle,
  onQuantityChange,
}: {
  addOn: TripAddOn;
  onToggle: (id: string, selected: boolean) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}) {
  const lineTotal = addOn.quantity * addOn.unit_price;

  return (
    <div className="rounded-xl border border-white/40 bg-white/30 dark:bg-slate-800/30 dark:border-slate-700/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-secondary dark:text-white truncate">
            {addOn.name}
          </p>
          <GlassBadge variant="secondary" size="sm" className="mt-1 capitalize">
            {addOn.category}
          </GlassBadge>
        </div>
        <ToggleSwitch
          checked={addOn.is_selected}
          onChange={(val) => onToggle(addOn.id, val)}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {formatINR(addOn.unit_price)} / unit
        </span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted" htmlFor={`qty-${addOn.id}`}>
            Qty
          </label>
          <input
            id={`qty-${addOn.id}`}
            type="number"
            min={1}
            max={99}
            value={addOn.quantity}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              if (!Number.isNaN(parsed) && parsed >= 1) {
                onQuantityChange(addOn.id, parsed);
              }
            }}
            className="w-14 px-2 py-1 text-xs text-center rounded-lg border border-white/40 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/30 dark:border-slate-700/30">
        <span className="text-xs text-text-muted">Line Total</span>
        <span className="text-sm font-black text-secondary dark:text-white tabular-nums">
          {formatINR(lineTotal)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TripAddOnsEditor({
  addOns,
  loading,
  onToggle,
  onQuantityChange,
}: TripAddOnsEditorProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => getUniqueCategories(addOns), [addOns]);

  const filteredAddOns = useMemo(
    () =>
      activeCategory === null
        ? addOns
        : addOns.filter((a) => a.category === activeCategory),
    [addOns, activeCategory]
  );

  const selectedTotal = useMemo(() => computeSelectedTotal(addOns), [addOns]);

  if (loading) {
    return (
      <GlassCard padding="xl">
        <div className="flex items-center gap-2 mb-5">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Add-Ons & Extras
          </span>
        </div>
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-gray-400 animate-pulse">
            Loading add-ons...
          </span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Package className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
          Add-Ons & Extras
        </span>
      </div>

      {addOns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Package className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">
            No add-ons linked
          </p>
        </div>
      ) : (
        <>
          {categories.length > 1 && (
            <CategoryPills
              categories={categories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAddOns.map((addOn) => (
              <AddOnCard
                key={addOn.id}
                addOn={addOn}
                onToggle={onToggle}
                onQuantityChange={onQuantityChange}
              />
            ))}
          </div>

          {/* Footer total */}
          <div className="mt-4 pt-4 border-t border-white/30 dark:border-slate-700/30 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Selected Add-Ons Total
            </span>
            <span className="text-lg font-black text-primary tabular-nums">
              {formatINR(selectedTotal)}
            </span>
          </div>
        </>
      )}
    </GlassCard>
  );
}
