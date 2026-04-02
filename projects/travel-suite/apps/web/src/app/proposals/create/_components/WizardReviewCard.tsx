'use client';

import { useState } from 'react';
import { Pencil, User, Map, Package, Calendar, FileText, Clock, IndianRupee, Check, X } from 'lucide-react';
import type { Client, TourTemplate, AddOn } from '../_types';
import type { WizardStepNumber } from '../_hooks/useWizardStep';
import type { ItineraryInfo } from './WizardShell';

interface WizardReviewCardProps {
  client: Client | null;
  template: TourTemplate | null;
  itineraryInfo?: ItineraryInfo | null;
  selectedAddOnIds: ReadonlySet<string>;
  addOns: readonly AddOn[];
  selectedVehicleId: string;
  tripStartDate: string;
  tripEndDate: string;
  proposalTitle: string;
  expirationDays: number;
  estimatedTotal: number;
  basePrice: number;
  onBasePriceChange: (price: number) => void;
  onEditStep: (step: WizardStepNumber) => void;
}

function ReviewSection({
  icon: Icon,
  label,
  editLabel,
  onEdit,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  editLabel?: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f8f1e6] border border-[#eadfcd]">
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#9c7c46]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider text-[#bda87f]">
            {label}
          </span>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 text-xs text-[#9c7c46] hover:text-[#8a6d3e] transition-colors h-7 px-2 rounded-md hover:bg-white/60"
            >
              <Pencil className="w-3 h-3" />
              {editLabel || 'Edit'}
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

export function WizardReviewCard({
  client,
  template,
  itineraryInfo,
  selectedAddOnIds,
  addOns,
  selectedVehicleId,
  tripStartDate,
  tripEndDate,
  proposalTitle,
  expirationDays,
  estimatedTotal,
  basePrice,
  onBasePriceChange,
  onEditStep,
}: WizardReviewCardProps) {
  const selectedExtras = addOns.filter(
    (a) => selectedAddOnIds.has(a.id) || a.id === selectedVehicleId,
  );
  const extrasTotal = selectedExtras.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const hasDates = tripStartDate && tripEndDate;

  // Inline editing states
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(basePrice || ''));

  const handleSavePrice = () => {
    const parsed = parseInt(priceInput.replace(/[^0-9]/g, ''), 10);
    onBasePriceChange(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
    setEditingPrice(false);
  };

  const handleCancelPrice = () => {
    setPriceInput(String(basePrice || ''));
    setEditingPrice(false);
  };

  return (
    <div className="space-y-3">
      {/* Client */}
      <ReviewSection icon={User} label="Client" onEdit={() => onEditStep(1)}>
        {client ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#9c7c46] flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {(client.full_name || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1b140a] truncate">
                {client.full_name || 'Unnamed Client'}
              </p>
              {client.email && (
                <p className="text-xs text-[#6f5b3e] truncate">{client.email}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6f5b3e]">No client selected</p>
        )}
      </ReviewSection>

      {/* Template / Itinerary */}
      <ReviewSection
        icon={Map}
        label={itineraryInfo ? 'Itinerary' : 'Template'}
        onEdit={itineraryInfo ? undefined : () => onEditStep(2)}
      >
        {template ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#1b140a]">{template.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6f5b3e]">
              {template.destination && <span>{template.destination}</span>}
              {template.duration_days && <span>{template.duration_days} days</span>}
            </div>
          </div>
        ) : itineraryInfo ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#1b140a]">{itineraryInfo.title}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6f5b3e]">
              {itineraryInfo.destination && <span>{itineraryInfo.destination}</span>}
              {itineraryInfo.duration_days && <span>{itineraryInfo.duration_days} days</span>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6f5b3e]">No template selected</p>
        )}
      </ReviewSection>

      {/* Base Price — inline editable */}
      <ReviewSection
        icon={IndianRupee}
        label="Base Price"
        editLabel={editingPrice ? undefined : 'Set Price'}
        onEdit={editingPrice ? undefined : () => { setPriceInput(String(basePrice || '')); setEditingPrice(true); }}
      >
        {editingPrice ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6f5b3e]">₹</span>
              <input
                type="text"
                inputMode="numeric"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSavePrice(); if (e.key === 'Escape') handleCancelPrice(); }}
                className="w-full bg-white border border-[#eadfcd] rounded-lg pl-7 pr-3 py-2 text-sm text-[#1b140a] focus:outline-none focus:border-[#9c7c46] focus:ring-1 focus:ring-[#9c7c46]"
                placeholder="Enter base price"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={handleSavePrice}
              className="w-8 h-8 rounded-lg bg-[#9c7c46] text-white flex items-center justify-center hover:bg-[#8a6d3e] transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelPrice}
              className="w-8 h-8 rounded-lg bg-white border border-[#eadfcd] text-[#6f5b3e] flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium text-[#1b140a]">
            {basePrice > 0 ? formatINR(basePrice) : (
              <span className="text-[#9c7c46] italic">Tap &quot;Set Price&quot; to add base price</span>
            )}
          </p>
        )}
      </ReviewSection>

      {/* Travel dates */}
      {hasDates && (
        <ReviewSection icon={Calendar} label="Travel Dates" onEdit={() => onEditStep(2)}>
          <p className="text-sm text-[#1b140a]">
            {tripStartDate} to {tripEndDate}
          </p>
        </ReviewSection>
      )}

      {/* Extras */}
      <ReviewSection icon={Package} label="Extras" onEdit={() => onEditStep(3)}>
        {selectedExtras.length > 0 ? (
          <div className="space-y-1.5">
            {selectedExtras.map((addon) => (
              <div key={addon.id} className="flex items-center justify-between text-xs">
                <span className="text-[#1b140a]">{addon.name}</span>
                <span className="text-[#6f5b3e] tabular-nums">{formatINR(Number(addon.price) || 0)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs font-medium pt-1 border-t border-[#eadfcd]">
              <span className="text-[#6f5b3e]">Extras subtotal</span>
              <span className="text-[#1b140a]">{formatINR(extrasTotal)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6f5b3e]">No extras selected</p>
        )}
      </ReviewSection>

      {/* Proposal settings */}
      <ReviewSection icon={FileText} label="Proposal">
        <div className="space-y-1">
          {proposalTitle && (
            <p className="text-sm font-medium text-[#1b140a] truncate">{proposalTitle}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-[#6f5b3e]">
            <Clock className="w-3 h-3" />
            <span>
              {expirationDays > 0 ? `Expires in ${expirationDays} days` : 'No expiry'}
            </span>
          </div>
        </div>
      </ReviewSection>

      {/* Estimated total */}
      <div className="p-4 rounded-xl bg-white border-2 border-[#9c7c46]/30">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#6f5b3e]">Estimated Total</span>
          <span className="text-xl font-bold text-[#1b140a]">
            {formatINR(estimatedTotal)}
          </span>
        </div>
        {basePrice > 0 && extrasTotal > 0 && (
          <p className="text-[10px] text-[#bda87f] text-right mt-1">
            Base {formatINR(basePrice)} + Extras {formatINR(extrasTotal)}
          </p>
        )}
      </div>
    </div>
  );
}
