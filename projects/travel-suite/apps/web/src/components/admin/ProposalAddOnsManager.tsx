'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  X,
  Check,
  DollarSign,
  Package,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassInput } from '@/components/glass/GlassInput';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassModal } from '@/components/glass/GlassModal';

interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  duration: string | null;
  is_active: boolean;
}

interface ProposalAddOn {
  id: string;
  addon_id: string;
  is_selected_by_client: boolean;
  is_included_by_default: boolean;
  notes: string | null;
  // Joined data
  addon: AddOn;
}

interface ProposalAddOnsManagerProps {
  proposalId: string;
  readonly?: boolean;
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

export default function ProposalAddOnsManager({
  proposalId,
  readonly = false,
}: ProposalAddOnsManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proposalAddOns, setProposalAddOns] = useState<ProposalAddOn[]>([]);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadData();
  }, [proposalId]);

  async function loadData() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Load proposal add-ons
      const { data: proposalAddOnsData } = await supabase
        .from('proposal_addons')
        .select(
          `
          id,
          addon_id,
          is_selected_by_client,
          is_included_by_default,
          notes,
          add_ons (
            id,
            name,
            description,
            price,
            category,
            image_url,
            duration,
            is_active
          )
        `
        )
        .eq('proposal_id', proposalId);

      const formattedProposalAddOns: ProposalAddOn[] =
        proposalAddOnsData?.map((item: any) => ({
          id: item.id,
          addon_id: item.addon_id,
          is_selected_by_client: item.is_selected_by_client,
          is_included_by_default: item.is_included_by_default,
          notes: item.notes,
          addon: item.add_ons,
        })) || [];

      setProposalAddOns(formattedProposalAddOns);

      // Load all available add-ons for adding
      const { data: addOnsData } = await supabase
        .from('add_ons')
        .select('*')
        .eq('is_active', true)
        .order('name');

      const formattedAvailableAddOns: AddOn[] = (addOnsData || []).map((addon) => ({
        id: addon.id,
        name: addon.name,
        description: addon.description,
        price: addon.price,
        category: addon.category,
        image_url: addon.image_url,
        duration: addon.duration,
        is_active: addon.is_active ?? false,
      }));

      setAvailableAddOns(formattedAvailableAddOns);
    } catch (error) {
      console.error('Error loading add-ons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addAddOnToProposal(addon: AddOn) {
    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.from('proposal_addons').insert({
        proposal_id: proposalId,
        addon_id: addon.id,
        is_selected_by_client: false,
        is_included_by_default: false,
      });

      if (!error) {
        await loadData();
        setModalOpen(false);
        setSearchQuery('');
      } else {
        console.error('Error adding add-on:', error);
        alert('Failed to add add-on');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function removeAddOn(proposalAddonId: string) {
    if (!confirm('Remove this add-on from the proposal?')) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('proposal_addons')
        .delete()
        .eq('id', proposalAddonId);

      if (!error) {
        await loadData();
      } else {
        console.error('Error removing add-on:', error);
        alert('Failed to remove add-on');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function toggleDefaultInclusion(proposalAddonId: string, currentValue: boolean) {
    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('proposal_addons')
        .update({ is_included_by_default: !currentValue })
        .eq('id', proposalAddonId);

      if (!error) {
        await loadData();
      } else {
        console.error('Error updating add-on:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  }

  const filteredAvailableAddOns = availableAddOns.filter((addon) => {
    // Filter out already added add-ons
    const alreadyAdded = proposalAddOns.some((pa) => pa.addon_id === addon.id);
    if (alreadyAdded) return false;

    // Category filter
    if (selectedCategory !== 'All' && addon.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        addon.name.toLowerCase().includes(query) ||
        addon.description?.toLowerCase().includes(query) ||
        addon.category.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const categories = ['All', ...new Set(availableAddOns.map((a) => a.category))];

  const totalAddOnsPrice = proposalAddOns.reduce((sum, pa) => {
    if (pa.is_included_by_default || pa.is_selected_by_client) {
      return sum + pa.addon.price;
    }
    return sum;
  }, 0);

  const selectedCount = proposalAddOns.filter(
    (pa) => pa.is_selected_by_client
  ).length;

  const includedCount = proposalAddOns.filter(
    (pa) => pa.is_included_by_default
  ).length;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard padding="lg" rounded="2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold font-serif text-secondary dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Add-Ons & Upgrades
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {proposalAddOns.length} add-ons •{' '}
              {includedCount} included by default •{' '}
              {selectedCount} selected by client
            </p>
          </div>
          {!readonly && (
            <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Add-On
            </GlassButton>
          )}
        </div>

        {/* Total Price */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/90 to-emerald-50/90 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm font-medium text-secondary dark:text-white">
            Total Add-Ons Value
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
            <DollarSign className="w-5 h-5" />
            {totalAddOnsPrice.toFixed(2)}
          </div>
        </div>
      </GlassCard>

      {/* Add-Ons List */}
      {proposalAddOns.length === 0 ? (
        <GlassCard padding="lg" rounded="2xl">
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-semibold text-secondary dark:text-white mb-2">
              No Add-Ons Yet
            </h4>
            <p className="text-sm text-text-secondary mb-4">
              Add optional extras and upgrades to your proposal
            </p>
            {!readonly && (
              <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Your First Add-On
              </GlassButton>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {proposalAddOns.map((proposalAddon) => (
            <GlassCard
              key={proposalAddon.id}
              padding="lg"
              rounded="xl"
              className={`transition-all ${proposalAddon.is_selected_by_client
                ? 'ring-2 ring-green-500 dark:ring-green-400'
                : proposalAddon.is_included_by_default
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                  : ''
                }`}
            >
              <div className="flex items-start gap-4">
                {/* Image */}
                {proposalAddon.addon.image_url ? (
                  <img
                    src={proposalAddon.addon.image_url}
                    alt={proposalAddon.addon.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-app flex items-center justify-center">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-secondary dark:text-white">
                          {proposalAddon.addon.name}
                        </h4>
                        <GlassBadge
                          variant={getCategoryColor(proposalAddon.addon.category)}
                          size="sm"
                        >
                          {proposalAddon.addon.category}
                        </GlassBadge>
                      </div>
                      {proposalAddon.addon.description && (
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {proposalAddon.addon.description}
                        </p>
                      )}
                      {proposalAddon.addon.duration && (
                        <p className="text-xs text-primary mt-1">
                          Duration: {proposalAddon.addon.duration}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-primary">
                        ${proposalAddon.addon.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    {proposalAddon.is_included_by_default && (
                      <GlassBadge variant="info" size="sm" icon={Check}>
                        Included by Default
                      </GlassBadge>
                    )}
                    {proposalAddon.is_selected_by_client && (
                      <GlassBadge variant="success" size="sm" icon={Check}>
                        Selected by Client
                      </GlassBadge>
                    )}
                    {!proposalAddon.is_included_by_default &&
                      !proposalAddon.is_selected_by_client && (
                        <GlassBadge variant="default" size="sm">
                          Optional
                        </GlassBadge>
                      )}
                  </div>

                  {/* Admin Actions */}
                  {!readonly && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          toggleDefaultInclusion(
                            proposalAddon.id,
                            proposalAddon.is_included_by_default
                          )
                        }
                        disabled={saving}
                      >
                        {proposalAddon.is_included_by_default ? (
                          <>
                            <X className="w-3 h-3" />
                            Remove from Default
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Include by Default
                          </>
                        )}
                      </GlassButton>

                      <GlassButton
                        variant="danger"
                        size="sm"
                        onClick={() => removeAddOn(proposalAddon.id)}
                        disabled={saving}
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </GlassButton>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add Add-On Modal */}
      <GlassModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add Add-Ons to Proposal"
        description="Select add-ons to offer to your client"
      >
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <GlassInput
                type="text"
                placeholder="Search add-ons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white/50 dark:bg-white/5 border border-white/20 rounded-lg text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Available Add-Ons */}
          <div className="max-h-[500px] overflow-y-auto space-y-3">
            {filteredAvailableAddOns.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-text-secondary mx-auto mb-2 opacity-50" />
                <p className="text-sm text-text-secondary">
                  {searchQuery || selectedCategory !== 'All'
                    ? 'No add-ons match your filters'
                    : 'All available add-ons have been added'}
                </p>
              </div>
            ) : (
              filteredAvailableAddOns.map((addon) => (
                <div
                  key={addon.id}
                  className="p-4 bg-white/50 dark:bg-white/5 border border-white/20 rounded-lg hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-secondary dark:text-white">
                          {addon.name}
                        </h5>
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
                      <div className="text-sm font-bold text-primary mt-2">
                        ${addon.price.toFixed(2)}
                        {addon.duration && (
                          <span className="text-xs text-text-secondary ml-2">
                            • {addon.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    <GlassButton
                      variant="primary"
                      size="sm"
                      onClick={() => addAddOnToProposal(addon)}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </GlassButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
