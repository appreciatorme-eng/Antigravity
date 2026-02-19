'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Check,
  DollarSign,
  Package,
  Loader2,
  Info,
  Car,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassBadge } from '@/components/glass/GlassBadge';

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

const isTransportCategory = (category: string) => category.trim().toLowerCase() === 'transport';

export default function ProposalAddOnsSelector({
  proposalId,
  onPriceChange,
}: ProposalAddOnsSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [proposalAddOns, setProposalAddOns] = useState<ProposalAddOn[]>([]);

  useEffect(() => {
    void loadAddOns();
  }, [proposalId]);

  async function loadAddOns() {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await (supabase as any)
        .from('proposal_add_ons')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('category', { ascending: true });

      if (error) throw error;

      const formatted: ProposalAddOn[] = (data || []).map((item: any) => ({
        id: item.id,
        proposal_id: item.proposal_id,
        add_on_id: item.add_on_id || null,
        name: item.name,
        description: item.description || null,
        category: item.category,
        image_url: item.image_url || null,
        unit_price: Number(item.unit_price || 0),
        quantity: Number(item.quantity || 1),
        is_selected: item.is_selected !== false,
      }));

      setProposalAddOns(formatted);
    } catch (error) {
      console.error('Error loading add-ons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function syncProposalPrice() {
    const supabase = createClient();
    const { data: newPrice } = await supabase.rpc('calculate_proposal_price', {
      p_proposal_id: proposalId,
    });

    if (newPrice !== null && newPrice !== undefined) {
      const numericPrice = Number(newPrice);
      await supabase
        .from('proposals')
        .update({ client_selected_price: numericPrice })
        .eq('id', proposalId);
      onPriceChange?.(numericPrice);
    }
  }

  async function toggleSelection(addOn: ProposalAddOn) {
    setSavingId(addOn.id);
    try {
      const supabase = createClient();
      const nextSelected = !addOn.is_selected;

      if (isTransportCategory(addOn.category) && nextSelected) {
        await (supabase as any)
          .from('proposal_add_ons')
          .update({ is_selected: false })
          .eq('proposal_id', proposalId)
          .ilike('category', 'transport');
      }

      const { error } = await (supabase as any)
        .from('proposal_add_ons')
        .update({ is_selected: nextSelected })
        .eq('id', addOn.id);

      if (error) {
        console.error('Error updating add-on:', error);
        alert('Failed to update selection');
        return;
      }

      await syncProposalPrice();
      await loadAddOns();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <GlassCard padding="lg" rounded="2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-text-secondary">Loading options...</span>
        </div>
      </GlassCard>
    );
  }

  if (proposalAddOns.length === 0) {
    return null;
  }

  const vehicleOptions = proposalAddOns.filter((item) => isTransportCategory(item.category));
  const optionalAddOns = proposalAddOns.filter((item) => !isTransportCategory(item.category));

  const selectedOptionalPrice = optionalAddOns.reduce((sum, item) => {
    if (!item.is_selected) return sum;
    return sum + item.unit_price * item.quantity;
  }, 0);

  const selectedOptionalCount = optionalAddOns.filter((item) => item.is_selected).length;

  const selectedVehicle = vehicleOptions.find((item) => item.is_selected) || null;

  return (
    <div className="space-y-6">
      <GlassCard
        padding="lg"
        rounded="2xl"
        className="bg-gradient-to-r from-purple-50/90 to-pink-50/90 dark:from-purple-900/20 dark:to-pink-900/20"
      >
        <div className="flex items-start gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold font-serif text-secondary dark:text-white mb-2">
              Customize Your Experience
            </h3>
            <p className="text-sm text-text-secondary">
              Choose your transport option and optional upgrades. Pricing updates instantly.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {selectedVehicle ? (
                <GlassBadge variant="info" icon={Car}>
                  Vehicle: {selectedVehicle.name}
                </GlassBadge>
              ) : null}
              {selectedOptionalCount > 0 ? (
                <GlassBadge variant="success" icon={Check}>
                  {selectedOptionalCount} add-on{selectedOptionalCount !== 1 ? 's' : ''} selected
                </GlassBadge>
              ) : null}
              <div className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {selectedOptionalPrice.toFixed(2)} optional
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {vehicleOptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-secondary dark:text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Vehicle Options
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {vehicleOptions.map((item) => {
              const saving = savingId === item.id;
              return (
                <GlassCard
                  key={item.id}
                  padding="md"
                  rounded="xl"
                  className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    item.is_selected
                      ? 'ring-2 ring-primary bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-900/20 dark:to-purple-900/20'
                      : ''
                  }`}
                  onClick={() => {
                    if (!saving && !item.is_selected) {
                      void toggleSelection(item);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h5 className="font-semibold text-secondary dark:text-white flex items-center gap-2">
                        {item.name}
                        <GlassBadge variant="info" size="sm">
                          Transport
                        </GlassBadge>
                      </h5>
                      {item.description ? (
                        <p className="text-sm text-text-secondary mt-1">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : item.is_selected ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : null}
                      <div className="text-lg font-bold text-primary mt-1">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {optionalAddOns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-secondary dark:text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Optional Upgrades
            </h4>
            <div className="text-sm text-text-secondary">Click to add or remove</div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {optionalAddOns.map((item) => {
              const saving = savingId === item.id;
              return (
                <GlassCard
                  key={item.id}
                  padding="md"
                  rounded="xl"
                  className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    item.is_selected
                      ? 'ring-2 ring-primary bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-900/20 dark:to-purple-900/20'
                      : ''
                  }`}
                  onClick={() => {
                    if (!saving) {
                      void toggleSelection(item);
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          item.is_selected ? 'bg-primary border-primary' : 'border-text-secondary/30'
                        }`}
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : item.is_selected ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : null}
                      </div>
                    </div>

                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-app flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h5 className="font-semibold text-secondary dark:text-white flex items-center gap-2">
                            {item.name}
                            <GlassBadge variant={getCategoryColor(item.category)} size="sm">
                              {item.category}
                            </GlassBadge>
                          </h5>
                          {item.description && <p className="text-sm text-text-secondary mt-1">{item.description}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-primary">
                            ${(item.unit_price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
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
