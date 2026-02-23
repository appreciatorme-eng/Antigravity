'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
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
import { useToast } from '@/components/ui/toast';

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
  proposal_id: string;
  add_on_id: string | null;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  is_selected: boolean;
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

const isTransportCategory = (category: string) => category.trim().toLowerCase() === 'transport';

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
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: proposalRows, error: proposalRowsError } = await (supabase as any)
        .from('proposal_add_ons')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('category', { ascending: true });

      if (proposalRowsError) {
        throw proposalRowsError;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedProposalRows: ProposalAddOn[] = (proposalRows || []).map((row: any) => ({
        id: row.id,
        proposal_id: row.proposal_id,
        add_on_id: row.add_on_id || null,
        name: row.name,
        description: row.description || null,
        category: row.category,
        image_url: row.image_url || null,
        unit_price: Number(row.unit_price || 0),
        quantity: Number(row.quantity || 1),
        is_selected: row.is_selected !== false,
      }));
      setProposalAddOns(formattedProposalRows);

      const { data: addOnsData, error: addOnsError } = await supabase
        .from('add_ons')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (addOnsError) {
        throw addOnsError;
      }

      const formattedAvailable: AddOn[] = (addOnsData || []).map((addon) => ({
        id: addon.id,
        name: addon.name,
        description: addon.description,
        price: Number(addon.price || 0),
        category: addon.category,
        image_url: addon.image_url,
        duration: addon.duration,
        is_active: addon.is_active ?? false,
      }));

      setAvailableAddOns(formattedAvailable);
    } catch (error) {
      console.error('Error loading add-ons:', error);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function syncProposalPrice() {
    const supabase = createClient();
    const { data: newPrice } = await supabase.rpc('calculate_proposal_price', {
      p_proposal_id: proposalId,
    });

    if (newPrice !== null && newPrice !== undefined) {
      await supabase
        .from('proposals')
        .update({ client_selected_price: Number(newPrice) })
        .eq('id', proposalId);
    }
  }

  async function addAddOnToProposal(addon: AddOn) {
    setSaving(true);
    try {
      const supabase = createClient();
      const transport = isTransportCategory(addon.category);
      const selectedTransportExists = proposalAddOns.some(
        (item) => isTransportCategory(item.category) && item.is_selected
      );

      const shouldSelect = transport ? !selectedTransportExists : false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('proposal_add_ons').insert({
        proposal_id: proposalId,
        add_on_id: addon.id,
        name: addon.name,
        description: addon.description || null,
        category: addon.category,
        image_url: addon.image_url || null,
        unit_price: Number(addon.price || 0),
        quantity: 1,
        is_selected: shouldSelect,
      });

      if (error) {
        console.error('Error adding add-on:', error);
        toast({
          title: 'Add-on add failed',
          description: 'Failed to add add-on',
          variant: 'error',
        });
        return;
      }

      await syncProposalPrice();
      await loadData();
      setModalOpen(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function removeAddOn(proposalAddOnId: string) {
    if (!confirm('Remove this add-on from the proposal?')) return;

    setSaving(true);
    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('proposal_add_ons')
        .delete()
        .eq('id', proposalAddOnId);

      if (error) {
        console.error('Error removing add-on:', error);
        toast({
          title: 'Add-on removal failed',
          description: 'Failed to remove add-on',
          variant: 'error',
        });
        return;
      }

      await syncProposalPrice();
      await loadData();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function toggleSelection(proposalAddOn: ProposalAddOn) {
    setSaving(true);
    try {
      const supabase = createClient();
      const nextValue = !proposalAddOn.is_selected;

      if (isTransportCategory(proposalAddOn.category) && nextValue) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('proposal_add_ons')
          .update({ is_selected: false })
          .eq('proposal_id', proposalId)
          .ilike('category', 'transport');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('proposal_add_ons')
        .update({ is_selected: nextValue })
        .eq('id', proposalAddOn.id);

      if (error) {
        console.error('Error updating add-on:', error);
        toast({
          title: 'Selection update failed',
          description: 'Failed to update add-on selection',
          variant: 'error',
        });
        return;
      }

      await syncProposalPrice();
      await loadData();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  }

  const categories = useMemo(
    () => ['All', ...new Set(availableAddOns.map((item) => item.category))],
    [availableAddOns]
  );

  const filteredAvailableAddOns = availableAddOns.filter((addon) => {
    const alreadyAdded = proposalAddOns.some((item) => item.add_on_id === addon.id);
    if (alreadyAdded) return false;

    if (selectedCategory !== 'All' && addon.category !== selectedCategory) {
      return false;
    }

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      addon.name.toLowerCase().includes(query) ||
      addon.description?.toLowerCase().includes(query) ||
      addon.category.toLowerCase().includes(query)
    );
  });

  const totalSelectedValue = proposalAddOns.reduce((sum, item) => {
    if (!item.is_selected) return sum;
    return sum + item.unit_price * item.quantity;
  }, 0);

  const selectedCount = proposalAddOns.filter((item) => item.is_selected).length;
  const transportOptions = proposalAddOns.filter((item) => isTransportCategory(item.category));

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
      <GlassCard padding="lg" rounded="2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold font-serif text-secondary dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Add-Ons & Options
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {proposalAddOns.length} options • {selectedCount} currently selected • {transportOptions.length} vehicle choices
            </p>
          </div>
          {!readonly && (
            <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Option
            </GlassButton>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/90 to-emerald-50/90 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm font-medium text-secondary dark:text-white">Selected Add-On Value</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
            <DollarSign className="w-5 h-5" />
            {totalSelectedValue.toFixed(2)}
          </div>
        </div>
      </GlassCard>

      {proposalAddOns.length === 0 ? (
        <GlassCard padding="lg" rounded="2xl">
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-semibold text-secondary dark:text-white mb-2">No Add-Ons Yet</h4>
            <p className="text-sm text-text-secondary mb-4">Add vehicle classes and optional upgrades to this proposal.</p>
            {!readonly && (
              <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add First Option
              </GlassButton>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {proposalAddOns.map((proposalAddOn) => (
            <GlassCard key={proposalAddOn.id} padding="lg" rounded="xl">
              <div className="flex items-start gap-4">
                {proposalAddOn.image_url ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden relative">
                    <Image
                      src={proposalAddOn.image_url}
                      alt={proposalAddOn.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-app flex items-center justify-center">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-secondary dark:text-white">{proposalAddOn.name}</h4>
                        <GlassBadge variant={getCategoryColor(proposalAddOn.category)} size="sm">
                          {proposalAddOn.category}
                        </GlassBadge>
                      </div>
                      {proposalAddOn.description && (
                        <p className="text-sm text-text-secondary line-clamp-2">{proposalAddOn.description}</p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-primary">
                        ${(proposalAddOn.unit_price * proposalAddOn.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {proposalAddOn.is_selected ? (
                      <GlassBadge variant="success" size="sm" icon={Check}>
                        Selected in Quote
                      </GlassBadge>
                    ) : (
                      <GlassBadge variant="default" size="sm">
                        Optional
                      </GlassBadge>
                    )}
                    {isTransportCategory(proposalAddOn.category) ? (
                      <GlassBadge variant="info" size="sm">Vehicle</GlassBadge>
                    ) : null}
                  </div>

                  {!readonly && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => void toggleSelection(proposalAddOn)}
                        disabled={saving}
                      >
                        {proposalAddOn.is_selected ? (
                          <>
                            <X className="w-3 h-3" />
                            Mark Optional
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Select
                          </>
                        )}
                      </GlassButton>

                      <GlassButton
                        variant="danger"
                        size="sm"
                        onClick={() => void removeAddOn(proposalAddOn.id)}
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

      <GlassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Options to Proposal"
        description="Select add-ons and vehicle options to offer your client"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <GlassInput
                type="text"
                placeholder="Search add-ons..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="px-4 py-2 bg-white/50 dark:bg-white/5 border border-white/20 rounded-lg text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

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
                        <h5 className="font-semibold text-secondary dark:text-white">{addon.name}</h5>
                        <GlassBadge variant={getCategoryColor(addon.category)} size="sm">
                          {addon.category}
                        </GlassBadge>
                      </div>
                      {addon.description && (
                        <p className="text-sm text-text-secondary line-clamp-2">{addon.description}</p>
                      )}
                      <div className="text-sm font-bold text-primary mt-2">
                        ${Number(addon.price || 0).toFixed(2)}
                        {addon.duration && (
                          <span className="text-xs text-text-secondary ml-2">• {addon.duration}</span>
                        )}
                      </div>
                    </div>
                    <GlassButton
                      variant="primary"
                      size="sm"
                      onClick={() => void addAddOnToProposal(addon)}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
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
