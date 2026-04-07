"use client";

import { useMemo, useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { formatINR } from "@/features/trip-detail/utils";
import { cn } from "@/lib/utils";
import type { AvailableAddOn, TripAddOn } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripAddOnsEditorProps {
  addOns: TripAddOn[];
  availableAddOns: AvailableAddOn[];
  loading: boolean;
  onToggle: (addOnId: string, isSelected: boolean) => void;
  onQuantityChange: (addOnId: string, quantity: number) => void;
  onUnitPriceChange: (addOnId: string, unitPrice: number) => void;
  onCreateAddOn: (input: {
    name: string;
    category: string;
    unit_price: number;
    quantity: number;
    description?: string;
  }) => Promise<boolean>;
  onAttachCatalogAddOn: (input: {
    addOnId: string;
    quantity: number;
  }) => Promise<boolean>;
  saving?: boolean;
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

function getCatalogCategories(addOns: readonly AvailableAddOn[]): readonly string[] {
  const seen = new Set<string>();
  return addOns.reduce<string[]>((acc, addOn) => {
    if (!seen.has(addOn.category)) {
      seen.add(addOn.category);
      return [...acc, addOn.category];
    }
    return acc;
  }, []);
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
  onUnitPriceChange,
}: {
  addOn: TripAddOn;
  onToggle: (id: string, selected: boolean) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onUnitPriceChange: (id: string, unitPrice: number) => void;
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Unit Price
          </label>
          <input
            type="number"
            min={0}
            value={addOn.unit_price}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              if (!Number.isNaN(parsed) && parsed >= 0) {
                onUnitPriceChange(addOn.id, parsed);
              }
            }}
            className="w-full px-2 py-1.5 text-xs rounded-lg border border-white/40 bg-white/50 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
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

function AddOnComposer({
  onCreateAddOn,
  saving = false,
}: {
  onCreateAddOn: (input: {
    name: string;
    category: string;
    unit_price: number;
    quantity: number;
    description?: string;
  }) => Promise<boolean>;
  saving?: boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("extras");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [description, setDescription] = useState("");

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-primary" />
        <p className="text-sm font-bold text-secondary dark:text-white">
          Add New Extra
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Add-on name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/70 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/70 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="number"
          placeholder="Unit price (INR)"
          min={0}
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/70 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="number"
          placeholder="Qty"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/70 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <textarea
        rows={2}
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/70 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <GlassButton
        variant="primary"
        size="sm"
        loading={saving}
        onClick={async () => {
          const parsedPrice = Number(unitPrice);
          const parsedQuantity = Number(quantity);
          if (!name.trim() || !category.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
            return;
          }
          const created = await onCreateAddOn({
            name: name.trim(),
            category: category.trim(),
            unit_price: parsedPrice,
            quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
            description: description.trim() || undefined,
          });
          if (!created) return;
          setName("");
          setCategory("extras");
          setUnitPrice("");
          setQuantity("1");
          setDescription("");
        }}
      >
        <Plus className="w-4 h-4" />
        Add Extra
      </GlassButton>
    </div>
  );
}

function CatalogPicker({
  availableAddOns,
  linkedAddOns,
  onAttachCatalogAddOn,
  saving = false,
}: {
  availableAddOns: AvailableAddOn[];
  linkedAddOns: TripAddOn[];
  onAttachCatalogAddOn: (input: { addOnId: string; quantity: number }) => Promise<boolean>;
  saving?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => getCatalogCategories(availableAddOns.filter((item) => item.is_active !== false)),
    [availableAddOns],
  );

  const linkedCatalogIds = useMemo(
    () => new Set(linkedAddOns.map((item) => item.add_on_id).filter(Boolean)),
    [linkedAddOns],
  );

  const filteredCatalog = useMemo(() => {
    return availableAddOns
      .filter((item) => item.is_active !== false)
      .filter((item) =>
        activeCategory === null ? true : item.category === activeCategory,
      )
      .filter((item) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      });
  }, [activeCategory, availableAddOns, searchQuery]);

  return (
    <div className="space-y-4 rounded-xl border border-white/40 bg-white/20 p-4 dark:border-slate-700/40 dark:bg-slate-800/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-secondary dark:text-white">
            Add From Catalog
          </p>
          <p className="text-xs text-text-muted">
            Reuse the same add-ons configured on the add-ons page.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search add-ons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-white/40 bg-white/70 dark:bg-slate-800/50 dark:border-slate-700/40 text-secondary dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {categories.length > 1 ? (
        <CategoryPills
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      ) : null}

      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {filteredCatalog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/40 p-4 text-center text-sm text-text-muted">
            No add-ons match the current filters.
          </div>
        ) : (
          filteredCatalog.map((addOn) => {
            const alreadyLinked = linkedCatalogIds.has(addOn.id);
            return (
              <div
                key={addOn.id}
                className="rounded-xl border border-white/40 bg-white/40 p-4 dark:border-slate-700/40 dark:bg-slate-800/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-secondary dark:text-white">
                        {addOn.name}
                      </p>
                      <GlassBadge variant="secondary" size="sm" className="capitalize">
                        {addOn.category}
                      </GlassBadge>
                    </div>
                    {addOn.description ? (
                      <p className="text-xs leading-5 text-text-muted">
                        {addOn.description}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-primary">
                      <span>{formatINR(Number(addOn.price || 0))}</span>
                      {addOn.duration ? <span className="text-text-muted">{addOn.duration}</span> : null}
                    </div>
                  </div>
                  <GlassButton
                    variant={alreadyLinked ? "secondary" : "primary"}
                    size="sm"
                    disabled={alreadyLinked || saving}
                    onClick={() => void onAttachCatalogAddOn({ addOnId: addOn.id, quantity: 1 })}
                  >
                    <Plus className="w-4 h-4" />
                    {alreadyLinked ? "Added" : "Add"}
                  </GlassButton>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TripAddOnsEditor({
  addOns,
  availableAddOns,
  loading,
  onToggle,
  onQuantityChange,
  onUnitPriceChange,
  onCreateAddOn,
  onAttachCatalogAddOn,
  saving = false,
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
        <div className="space-y-5">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Package className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-400">
              No add-ons linked
            </p>
          </div>
          <CatalogPicker
            availableAddOns={availableAddOns}
            linkedAddOns={addOns}
            onAttachCatalogAddOn={onAttachCatalogAddOn}
            saving={saving}
          />
          <AddOnComposer onCreateAddOn={onCreateAddOn} saving={saving} />
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
                onUnitPriceChange={onUnitPriceChange}
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

          <div className="pt-2">
            <CatalogPicker
              availableAddOns={availableAddOns}
              linkedAddOns={addOns}
              onAttachCatalogAddOn={onAttachCatalogAddOn}
              saving={saving}
            />
          </div>

          <div className="pt-2">
            <AddOnComposer onCreateAddOn={onCreateAddOn} saving={saving} />
          </div>
        </>
      )}
    </GlassCard>
  );
}
