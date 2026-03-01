"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  DollarSign,
  Package,
  TrendingUp,
  Activity,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import {
  GlassBadge,
  type GlassBadgeProps,
} from "@/components/glass/GlassBadge";
import { GlassModal, GlassConfirmModal } from "@/components/glass/GlassModal";
import { GlassTextarea, GlassSelect } from "@/components/glass/GlassInput";
import { useToast } from "@/components/ui/toast";

/**
 * Add-ons Management Page (Upsell Engine)
 *
 * Admin UI for tour operators to:
 * - Create and manage add-ons (activities, dining, transport, upgrades)
 * - Track revenue and sales
 * - View popular add-ons
 * - Toggle active/inactive status
 */

interface AddOn {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  duration: string | null;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  totalRevenue: number;
  totalSales: number;
  topAddOn: string;
  totalAddOns: number;
  activeAddOns: number;
}

type BadgeVariant = NonNullable<GlassBadgeProps["variant"]>;

const CATEGORY_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  Activities: "primary",
  Dining: "warning",
  Transport: "info",
  Upgrades: "success",
};

const getCategoryColor = (category: string): BadgeVariant =>
  CATEGORY_BADGE_VARIANTS[category] || "default";

const PACKAGE_TEMPLATES: Record<
  string,
  {
    name: string;
    description: string;
    price: string;
    category: string;
    duration: string;
  }
> = {
  ai_credits: {
    name: "AI Credits Pack",
    description: "Prepaid AI generation capacity for peak proposal workflows.",
    price: "2999",
    category: "Upgrades",
    duration: "Monthly",
  },
  whatsapp_volume: {
    name: "WhatsApp Volume Pack",
    description:
      "Higher reminder volume for collections and quote follow-up automation.",
    price: "1999",
    category: "Upgrades",
    duration: "Monthly",
  },
  premium_templates: {
    name: "Premium Templates Pack",
    description:
      "High-conversion proposal templates designed for upsell moments.",
    price: "1499",
    category: "Upgrades",
    duration: "Monthly",
  },
  ai_credits_starter: {
    name: "AI Starter Credits",
    description: "1,000 prepaid AI requests for controlled overage spending.",
    price: "2999",
    category: "Upgrades",
    duration: "Monthly",
  },
  ai_credits_growth: {
    name: "AI Growth Credits",
    description: "5,000 prepaid AI requests for high-volume teams.",
    price: "11999",
    category: "Upgrades",
    duration: "Monthly",
  },
  media_credits_growth: {
    name: "Media Search Credits",
    description:
      "Prepaid credits for stock discovery and media lookup operations.",
    price: "2499",
    category: "Upgrades",
    duration: "Monthly",
  },
  automation_recovery: {
    name: "Collections Automation Pack",
    description:
      "Outcome-focused automation actions for payment and quote recovery.",
    price: "4999",
    category: "Upgrades",
    duration: "Monthly",
  },
};

export default function AddOnsPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [filteredAddOns, setFilteredAddOns] = useState<AddOn[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalSales: 0,
    topAddOn: "None",
    totalAddOns: 0,
    activeAddOns: 0,
  });

  const [categories, setCategories] = useState<string[]>([
    "All",
    "Activities",
    "Dining",
    "Transport",
    "Upgrades",
  ]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addOnToDelete, setAddOnToDelete] = useState<AddOn | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Activities",
    image_url: "",
    duration: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const autoTemplateLoaded = useRef(false);

  useEffect(() => {
    if (autoTemplateLoaded.current) return;
    const packageKey = searchParams.get("package");
    if (!packageKey) return;

    const template = PACKAGE_TEMPLATES[packageKey];
    if (!template) return;

    setEditingAddOn(null);
    setFormData({
      name: template.name,
      description: template.description,
      price: template.price,
      category: template.category,
      image_url: "",
      duration: template.duration,
    });
    setIsCustomCategory(false);
    setFormErrors({});
    setModalOpen(true);
    autoTemplateLoaded.current = true;
  }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get session for Auth header
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      // Load add-ons
      const response = await fetch("/api/add-ons", { headers });
      const data = await response.json();

      if (data.addOns) {
        setAddOns(data.addOns);

        // Extract unique categories
        const unique = Array.from(
          new Set(data.addOns.map((a: AddOn) => a.category)),
        );
        const defaultCats = ["Activities", "Dining", "Transport", "Upgrades"];
        const allCats = Array.from(
          new Set([...defaultCats, ...(unique as string[])]),
        ).sort();
        setCategories(["All", ...allCats]);
      }

      // Load stats
      const statsResponse = await fetch("/api/add-ons/stats", { headers });
      const statsData = await statsResponse.json();

      if (statsData) {
        setStats({
          totalRevenue: statsData.totalRevenue || 0,
          totalSales: statsData.totalSales || 0,
          topAddOn: statsData.topAddOn || "None",
          totalAddOns: statsData.totalAddOns || 0,
          activeAddOns: statsData.activeAddOns || 0,
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterAddOns = useCallback(() => {
    let filtered = [...addOns];

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (addon) => addon.category === selectedCategory,
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (addon) =>
          addon.name.toLowerCase().includes(query) ||
          addon.description?.toLowerCase().includes(query),
      );
    }

    setFilteredAddOns(filtered);
  }, [addOns, searchQuery, selectedCategory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    filterAddOns();
  }, [filterAddOns]);

  function openCreateModal() {
    setEditingAddOn(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Activities",
      image_url: "",
      duration: "",
    });
    setIsCustomCategory(false);
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(addon: AddOn) {
    setEditingAddOn(addon);

    const defaultCats = ["Activities", "Dining", "Transport", "Upgrades"];
    setIsCustomCategory(!defaultCats.includes(addon.category));

    setFormData({
      name: addon.name,
      description: addon.description || "",
      price: addon.price.toString(),
      category: addon.category,
      image_url: addon.image_url || "",
      duration: addon.duration || "",
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingAddOn(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Activities",
      image_url: "",
      duration: "",
    });
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.price.trim()) {
      errors.price = "Price is required";
    } else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) <= 0
    ) {
      errors.price = "Price must be a positive number";
    }

    if (!formData.category) {
      errors.category = "Category is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function saveAddOn() {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const url = editingAddOn
        ? `/api/add-ons/${editingAddOn.id}`
        : "/api/add-ons";

      const method = editingAddOn ? "PUT" : "POST";

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save add-on");
      }

      // Reload data
      await loadData();
      closeModal();
    } catch (error) {
      console.error("Error saving add-on:", error);
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Failed to save add-on",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function openDeleteConfirm(addon: AddOn) {
    setAddOnToDelete(addon);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!addOnToDelete) return;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/add-ons/${addOnToDelete.id}`, {
        method: "DELETE",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete add-on");
      }

      // Reload data
      await loadData();
      setDeleteConfirmOpen(false);
      setAddOnToDelete(null);
    } catch (error) {
      console.error("Error deleting add-on:", error);
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Failed to delete add-on",
        variant: "error",
      });
    }
  }

  async function toggleActive(addon: AddOn) {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/add-ons/${addon.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          ...addon,
          is_active: !addon.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update add-on status");
      }

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast({
        title: "Status update failed",
        description: "Failed to update add-on status",
        variant: "error",
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-white/40 rounded-2xl" />
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/40 rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-white/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-xs uppercase tracking-widest text-primary font-bold">
            Upsell Engine
          </span>
          <h1 className="text-3xl font-serif text-secondary dark:text-white">
            Add-ons Management
          </h1>
          <p className="text-text-secondary mt-1">
            Create and manage upsell products for your tours
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-primary">
              Total Add-ons
            </div>
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalAddOns}
          </div>
          <div className="text-xs text-text-secondary mt-2">
            {stats.activeAddOns} active
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-primary">
              Revenue (Month)
            </div>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-text-secondary mt-2">
            From {stats.totalSales} sales
          </div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-primary">
              Most Popular
            </div>
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 truncate">
            {stats.topAddOn}
          </div>
          <div className="text-xs text-text-secondary mt-2">Top seller</div>
        </GlassCard>

        <GlassCard padding="lg" rounded="2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-primary">
              Active Sales
            </div>
            <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {stats.totalSales}
          </div>
          <div className="text-xs text-text-secondary mt-2">This month</div>
        </GlassCard>
      </div>

      {/* Category Tabs + Create Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <GlassButton
              key={category}
              variant={selectedCategory === category ? "primary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </GlassButton>
          ))}
        </div>

        <GlassButton variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Add New Add-on
        </GlassButton>
      </div>

      {/* Search */}
      <GlassInput
        placeholder="Search add-ons..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        icon={Search}
      />

      {/* Add-ons Grid */}
      {filteredAddOns.length === 0 ? (
        <GlassCard padding="lg" rounded="2xl" className="text-center py-12">
          <Package className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-serif text-secondary dark:text-white mb-2">
            No add-ons found
          </h3>
          <p className="text-text-secondary mb-6">
            {searchQuery
              ? "Try adjusting your search or filters"
              : "Create your first add-on to start upselling"}
          </p>
          {!searchQuery && (
            <GlassButton variant="primary" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              Create Add-on
            </GlassButton>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddOns.map((addon) => (
            <GlassCard key={addon.id} padding="none" rounded="2xl">
              {/* Image */}
              {addon.image_url ? (
                <div
                  className="h-48 bg-cover bg-center rounded-t-2xl"
                  style={{ backgroundImage: `url(${addon.image_url})` }}
                />
              ) : (
                <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-2xl flex items-center justify-center">
                  <Package className="w-12 h-12 text-primary/50" />
                </div>
              )}

              {/* Content */}
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-serif text-secondary dark:text-white">
                      {addon.name}
                    </h3>
                    <GlassBadge
                      variant={getCategoryColor(addon.category)}
                      size="sm"
                    >
                      {addon.category}
                    </GlassBadge>
                  </div>

                  {addon.description && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {addon.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      ${addon.price.toFixed(2)}
                    </div>
                    {addon.duration && (
                      <div className="text-xs text-text-secondary">
                        {addon.duration}
                      </div>
                    )}
                  </div>

                  <GlassBadge
                    variant={addon.is_active ? "success" : "default"}
                    size="sm"
                  >
                    {addon.is_active ? "Active" : "Inactive"}
                  </GlassBadge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => openEditModal(addon)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </GlassButton>

                  <GlassButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => toggleActive(addon)}
                  >
                    {addon.is_active ? (
                      <>
                        <PowerOff className="w-4 h-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4" />
                        Activate
                      </>
                    )}
                  </GlassButton>

                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteConfirm(addon)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <GlassModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingAddOn ? "Edit Add-on" : "Create New Add-on"}
        size="lg"
      >
        <div className="space-y-4">
          <GlassInput
            label="Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            placeholder="e.g., Wine Tasting Tour"
          />

          <GlassTextarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe the add-on..."
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Price"
              type="number"
              required
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              error={formErrors.price}
              placeholder="0.00"
            />

            {!isCustomCategory ? (
              <GlassSelect
                label="Category"
                required
                options={[
                  ...categories
                    .filter((c) => c !== "All")
                    .map((c) => ({ value: c, label: c })),
                  { value: "custom", label: "Other..." },
                ]}
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomCategory(true);
                    setFormData({ ...formData, category: "" });
                  } else {
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
              />
            ) : (
              <div className="space-y-1">
                <GlassInput
                  label="Custom Category"
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g. VIP Service"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setFormData({ ...formData, category: "Activities" });
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Back to list
                </button>
              </div>
            )}
          </div>

          <GlassInput
            label="Duration"
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: e.target.value })
            }
            placeholder="e.g., 2 hours"
            helperText="Optional - How long is this experience?"
          />

          <GlassInput
            label="Image URL"
            value={formData.image_url}
            onChange={(e) =>
              setFormData({ ...formData, image_url: e.target.value })
            }
            placeholder="https://example.com/image.jpg"
            helperText="Optional - Provide a URL to an image"
          />

          <div className="flex gap-3 pt-4">
            <GlassButton variant="ghost" onClick={closeModal} fullWidth>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={saveAddOn}
              loading={saving}
              fullWidth
            >
              {editingAddOn ? "Update Add-on" : "Create Add-on"}
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Delete Confirmation Modal */}
      <GlassConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Add-on"
        message={`Are you sure you want to delete "${addOnToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
