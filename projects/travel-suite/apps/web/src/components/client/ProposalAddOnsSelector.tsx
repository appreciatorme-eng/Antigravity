'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Check,
  X,
  DollarSign,
  Package,
  Loader2,
  Info,
  Clock,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassBadge } from '@/components/glass/GlassBadge';

interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  duration: string | null;
}

interface ProposalAddOn {
  id: string;
  addon_id: string;
  is_selected_by_client: boolean;
  is_included_by_default: boolean;
  notes: string | null;
  addon: AddOn;
}

interface ProposalAddOnsSelectorProps {
  proposalId: string;
  onPriceChange?: (newPrice: number) => void;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, 'primary' | 'warning' | 'info' | 'success'> = {
    Activities: 'primary',
    Dining: 'warning',
    Transport: 'info',
    Upgrades: 'success',
  };
  return colors[category] || 'primary';
};

export default function ProposalAddOnsSelector({
  proposalId,
  onPriceChange,
}: ProposalAddOnsSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [proposalAddOns, setProposalAddOns] = useState<ProposalAddOn[]>([]);

  useEffect(() => {
    loadAddOns();
  }, [proposalId]);

  async function loadAddOns() {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data } = await supabase
        .from('proposal_addons')
        .select(
          `
          id,
          addon_id,
          is_selected_by_client,
          is_included_by_default,
          notes,
          addons (
            id,
            name,
            description,
            price,
            category,
            image_url,
            duration
          )
        `
        )
        .eq('proposal_id', proposalId);

      const formattedAddOns: ProposalAddOn[] =
        data?.map((item: any) => ({
          id: item.id,
          addon_id: item.addon_id,
          is_selected_by_client: item.is_selected_by_client,
          is_included_by_default: item.is_included_by_default,
          notes: item.notes,
          addon: item.addons,
        })) || [];

      setProposalAddOns(formattedAddOns);
    } catch (error) {
      console.error('Error loading add-ons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSelection(proposalAddonId: string, currentValue: boolean) {
    setSaving(proposalAddonId);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('proposal_addons')
        .update({ is_selected_by_client: !currentValue })
        .eq('id', proposalAddonId);

      if (!error) {
        await loadAddOns();

        // Calculate new price and notify parent
        const newPrice = proposalAddOns.reduce((sum, pa) => {
          if (pa.id === proposalAddonId) {
            return sum + (currentValue ? 0 : pa.addon.price);
          }
          if (pa.is_selected_by_client || pa.is_included_by_default) {
            return sum + pa.addon.price;
          }
          return sum;
        }, 0);

        onPriceChange?.(newPrice);
      } else {
        console.error('Error updating selection:', error);
        alert('Failed to update selection');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <GlassCard padding="lg" rounded="2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-text-secondary">Loading add-ons...</span>
        </div>
      </GlassCard>
    );
  }

  if (proposalAddOns.length === 0) {
    return null; // Don't show section if no add-ons
  }

  const optionalAddOns = proposalAddOns.filter((pa) => !pa.is_included_by_default);
  const includedAddOns = proposalAddOns.filter((pa) => pa.is_included_by_default);
  const selectedOptionalCount = optionalAddOns.filter((pa) => pa.is_selected_by_client).length;
  const totalOptionalPrice = optionalAddOns.reduce(
    (sum, pa) => (pa.is_selected_by_client ? sum + pa.addon.price : sum),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard padding="lg" rounded="2xl" className="bg-gradient-to-r from-purple-50/90 to-pink-50/90 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold font-serif text-secondary dark:text-white mb-2">
              Customize Your Experience
            </h3>
            <p className="text-sm text-text-secondary">
              Enhance your trip with these optional add-ons. Select the ones you'd like to include!
            </p>
            {selectedOptionalCount > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <GlassBadge variant="success" icon={Check}>
                  {selectedOptionalCount} add-on{selectedOptionalCount !== 1 ? 's' : ''} selected
                </GlassBadge>
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  +${totalOptionalPrice.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Included Add-Ons */}
      {includedAddOns.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-secondary dark:text-white flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            Included in Your Package
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {includedAddOns.map((proposalAddon) => (
              <GlassCard
                key={proposalAddon.id}
                padding="md"
                rounded="xl"
                className="ring-2 ring-green-500 dark:ring-green-400"
              >
                <div className="flex items-start gap-4">
                  {proposalAddon.addon.image_url ? (
                    <img
                      src={proposalAddon.addon.image_url}
                      alt={proposalAddon.addon.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-app flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h5 className="font-semibold text-secondary dark:text-white flex items-center gap-2">
                          {proposalAddon.addon.name}
                          <GlassBadge
                            variant={getCategoryColor(proposalAddon.addon.category)}
                            size="sm"
                          >
                            {proposalAddon.addon.category}
                          </GlassBadge>
                        </h5>
                        {proposalAddon.addon.description && (
                          <p className="text-sm text-text-secondary mt-1">
                            {proposalAddon.addon.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          Included
                        </div>
                        <div className="text-xs text-text-secondary">
                          ${proposalAddon.addon.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {proposalAddon.addon.duration && (
                      <div className="flex items-center gap-1 text-xs text-primary mt-2">
                        <Clock className="w-3 h-3" />
                        {proposalAddon.addon.duration}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Optional Add-Ons */}
      {optionalAddOns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-secondary dark:text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Optional Upgrades
            </h4>
            <div className="text-sm text-text-secondary">
              Click to add or remove
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {optionalAddOns.map((proposalAddon) => {
              const isSelected = proposalAddon.is_selected_by_client;
              const isSaving = saving === proposalAddon.id;

              return (
                <GlassCard
                  key={proposalAddon.id}
                  padding="md"
                  rounded="xl"
                  className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    isSelected
                      ? 'ring-2 ring-primary bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-900/20 dark:to-purple-900/20'
                      : ''
                  }`}
                  onClick={() =>
                    !isSaving && toggleSelection(proposalAddon.id, isSelected)
                  }
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'border-text-secondary/30'
                        }`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : null}
                      </div>
                    </div>

                    {/* Image */}
                    {proposalAddon.addon.image_url ? (
                      <img
                        src={proposalAddon.addon.image_url}
                        alt={proposalAddon.addon.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-app flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h5 className="font-semibold text-secondary dark:text-white flex items-center gap-2">
                            {proposalAddon.addon.name}
                            <GlassBadge
                              variant={getCategoryColor(proposalAddon.addon.category)}
                              size="sm"
                            >
                              {proposalAddon.addon.category}
                            </GlassBadge>
                          </h5>
                          {proposalAddon.addon.description && (
                            <p className="text-sm text-text-secondary mt-1">
                              {proposalAddon.addon.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-primary">
                            ${proposalAddon.addon.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      {proposalAddon.addon.duration && (
                        <div className="flex items-center gap-1 text-xs text-primary mt-2">
                          <Clock className="w-3 h-3" />
                          {proposalAddon.addon.duration}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
