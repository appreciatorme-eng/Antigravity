"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Package } from "lucide-react";
import { GlassConfirmModal } from "@/components/glass/GlassModal";
import { useToast } from "@/components/ui/toast";
import { logError } from "@/lib/observability/logger";

import type { AddOn, AddOnFormData, Stats } from "./_components/types";
import { EMPTY_FORM_DATA, PACKAGE_TEMPLATES } from "./_components/types";
import { StatsHeader } from "./_components/StatsHeader";
import { CategoryFilter } from "./_components/CategoryFilter";
import { AddOnsGrid } from "./_components/AddOnsGrid";
import { AddOnFormModal } from "./_components/AddOnFormModal";

/**
 * Add-ons Management Page (Upsell Engine)
 *
 * Admin UI for tour operators to:
 * - Create and manage add-ons (activities, dining, transport, upgrades)
 * - Track revenue and sales
 * - View popular add-ons
 * - Toggle active/inactive status
 */

const DEFAULT_STATS: Stats = {
  totalRevenue: 0,
  totalSales: 0,
  topAddOn: "None",
  totalAddOns: 0,
  activeAddOns: 0,
};

const DEFAULT_CATEGORIES = ["All", "Activities", "Dining", "Transport", "Upgrades"];

async function getAuthHeaders(): Promise<Record<string, string>> {
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
  return headers;
}

export default function AddOnsPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [filteredAddOns, setFilteredAddOns] = useState<AddOn[]>([]);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addOnToDelete, setAddOnToDelete] = useState<AddOn | null>(null);

  // Form state
  const [formData, setFormData] = useState<AddOnFormData>(EMPTY_FORM_DATA);
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
    setModalOpen(true);
    autoTemplateLoaded.current = true;
  }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();

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
      logError("Error loading data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterAddOns = useCallback(() => {
    let filtered = [...addOns];

    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (addon) => addon.category === selectedCategory,
      );
    }

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

  const openCreateModal = useCallback(() => {
    setEditingAddOn(null);
    setFormData(EMPTY_FORM_DATA);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((addon: AddOn) => {
    setEditingAddOn(addon);
    setFormData({
      name: addon.name,
      description: addon.description || "",
      price: addon.price.toString(),
      category: addon.category,
      image_url: addon.image_url || "",
      duration: addon.duration || "",
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingAddOn(null);
    setFormData(EMPTY_FORM_DATA);
  }, []);

  const saveAddOn = useCallback(
    async (data: AddOnFormData) => {
      const url = editingAddOn
        ? `/api/add-ons/${editingAddOn.id}`
        : "/api/add-ons";
      const method = editingAddOn ? "PUT" : "POST";

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to save add-on");
        }

        await loadData();
        closeModal();
      } catch (error) {
        logError("Error saving add-on", error);
        toast({
          title: "Save failed",
          description:
            error instanceof Error ? error.message : "Failed to save add-on",
          variant: "error",
        });
      }
    },
    [editingAddOn, loadData, closeModal, toast],
  );

  const openDeleteConfirm = useCallback((addon: AddOn) => {
    setAddOnToDelete(addon);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!addOnToDelete) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/add-ons/${addOnToDelete.id}`, {
        method: "DELETE",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete add-on");
      }

      await loadData();
      setDeleteConfirmOpen(false);
      setAddOnToDelete(null);
    } catch (error) {
      logError("Error deleting add-on", error);
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Failed to delete add-on",
        variant: "error",
      });
    }
  }, [addOnToDelete, loadData, toast]);

  const toggleActive = useCallback(
    async (addon: AddOn) => {
      try {
        const headers = await getAuthHeaders();
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

        await loadData();
      } catch (error) {
        logError("Error toggling active status", error);
        toast({
          title: "Status update failed",
          description: "Failed to update add-on status",
          variant: "error",
        });
      }
    },
    [loadData, toast],
  );

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

      <StatsHeader stats={stats} />

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateClick={openCreateModal}
      />

      <AddOnsGrid
        addOns={filteredAddOns}
        searchQuery={searchQuery}
        onCreateClick={openCreateModal}
        onEditClick={openEditModal}
        onDeleteClick={openDeleteConfirm}
        onToggleActive={toggleActive}
      />

      <AddOnFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={saveAddOn}
        editingAddOn={editingAddOn}
        initialFormData={formData}
        categories={categories}
      />

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
