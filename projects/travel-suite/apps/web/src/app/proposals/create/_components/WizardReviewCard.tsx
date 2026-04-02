'use client';

import { Pencil, User, Map, Package, Calendar, FileText, Clock } from 'lucide-react';
import type { Client, TourTemplate, AddOn } from '../_types';
import type { WizardStepNumber } from '../_hooks/useWizardStep';

interface WizardReviewCardProps {
  client: Client | null;
  template: TourTemplate | null;
  selectedAddOnIds: ReadonlySet<string>;
  addOns: readonly AddOn[];
  selectedVehicleId: string;
  tripStartDate: string;
  tripEndDate: string;
  proposalTitle: string;
  expirationDays: number;
  estimatedTotal: number;
  onEditStep: (step: WizardStepNumber) => void;
}

function ReviewSection({
  icon: Icon,
  label,
  step,
  onEdit,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  step: WizardStepNumber;
  onEdit: (step: WizardStepNumber) => void;
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
          <button
            type="button"
            onClick={() => onEdit(step)}
            className="inline-flex items-center gap-1 text-xs text-[#9c7c46] hover:text-[#8a6d3e] transition-colors h-7 px-2 rounded-md hover:bg-white/60"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function WizardReviewCard({
  client,
  template,
  selectedAddOnIds,
  addOns,
  selectedVehicleId,
  tripStartDate,
  tripEndDate,
  proposalTitle,
  expirationDays,
  estimatedTotal,
  onEditStep,
}: WizardReviewCardProps) {
  const selectedExtras = addOns.filter(
    (a) => selectedAddOnIds.has(a.id) || a.id === selectedVehicleId,
  );
  const extrasTotal = selectedExtras.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const hasDates = tripStartDate && tripEndDate;

  return (
    <div className="space-y-3">
      {/* Client */}
      <ReviewSection icon={User} label="Client" step={1} onEdit={onEditStep}>
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

      {/* Template */}
      <ReviewSection icon={Map} label="Template" step={2} onEdit={onEditStep}>
        {template ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#1b140a]">{template.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6f5b3e]">
              {template.destination && <span>{template.destination}</span>}
              {template.duration_days && <span>{template.duration_days} days</span>}
              {template.base_price != null && (
                <span>
                  {Number(template.base_price).toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  })}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6f5b3e]">No template selected</p>
        )}
      </ReviewSection>

      {/* Travel dates */}
      {hasDates && (
        <ReviewSection icon={Calendar} label="Travel Dates" step={2} onEdit={onEditStep}>
          <p className="text-sm text-[#1b140a]">
            {tripStartDate} to {tripEndDate}
          </p>
        </ReviewSection>
      )}

      {/* Extras */}
      <ReviewSection icon={Package} label="Extras" step={3} onEdit={onEditStep}>
        {selectedExtras.length > 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-[#1b140a]">
              {selectedExtras.length} item{selectedExtras.length !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-[#6f5b3e]">
              +{extrasTotal.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#6f5b3e]">No extras selected</p>
        )}
      </ReviewSection>

      {/* Proposal settings */}
      <ReviewSection icon={FileText} label="Proposal" step={4} onEdit={onEditStep}>
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
            {estimatedTotal.toLocaleString('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
