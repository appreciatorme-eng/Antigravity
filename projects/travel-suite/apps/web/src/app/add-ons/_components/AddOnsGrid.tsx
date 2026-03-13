"use client";

import {
  Plus,
  Package,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import type { AddOn } from "./types";
import { getCategoryColor } from "./types";

interface AddOnsGridProps {
  readonly addOns: readonly AddOn[];
  readonly searchQuery: string;
  readonly onCreateClick: () => void;
  readonly onEditClick: (addon: AddOn) => void;
  readonly onDeleteClick: (addon: AddOn) => void;
  readonly onToggleActive: (addon: AddOn) => void;
}

export function AddOnsGrid({
  addOns,
  searchQuery,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onToggleActive,
}: AddOnsGridProps) {
  if (addOns.length === 0) {
    return (
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
          <GlassButton variant="primary" onClick={onCreateClick}>
            <Plus className="w-4 h-4" />
            Create Add-on
          </GlassButton>
        )}
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {addOns.map((addon) => (
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
                onClick={() => onEditClick(addon)}
              >
                <Edit className="w-4 h-4" />
                Edit
              </GlassButton>

              <GlassButton
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => onToggleActive(addon)}
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
                onClick={() => onDeleteClick(addon)}
              >
                <Trash2 className="w-4 h-4" />
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
