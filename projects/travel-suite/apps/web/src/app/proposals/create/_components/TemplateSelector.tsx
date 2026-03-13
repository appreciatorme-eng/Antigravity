'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { OperatorUnavailability } from '@/features/calendar/availability';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassCard } from '@/components/glass/GlassCard';
import type { TourTemplate, PricingSuggestion } from '../_types';

export type TemplateSelectorProps = {
  templates: TourTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  tripStartDate: string;
  tripEndDate: string;
  onTripStartDateChange: (date: string) => void;
  onTripEndDateChange: (date: string) => void;
  availabilityConflicts: OperatorUnavailability[];
  availabilityLoading: boolean;
  availabilityOverrideAccepted: boolean;
  onAvailabilityOverride: () => void;
  pricingSuggestion: PricingSuggestion | null;
  pricingSuggestionLoading: boolean;
};

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  tripStartDate,
  tripEndDate,
  onTripStartDateChange,
  onTripEndDateChange,
  availabilityConflicts,
  availabilityLoading,
  availabilityOverrideAccepted,
  onAvailabilityOverride,
  pricingSuggestion,
  pricingSuggestionLoading,
}: TemplateSelectorProps) {
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
      <h2 className="text-lg font-semibold text-[#1b140a] mb-4">Select Template</h2>

      {templates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#6f5b3e] mb-4">No templates found</p>
          <Link
            href="/admin/tour-templates/create"
            className="inline-flex items-center px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
          >
            Create Template First
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <select
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="w-full px-4 py-3 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          >
            <option value="">-- Choose a template --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.destination && `- ${template.destination}`} (
                {template.duration_days} days)
              </option>
            ))}
          </select>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="mt-4 p-4 bg-[#f8f1e6] rounded-lg">
              <h3 className="font-semibold text-[#1b140a] mb-2">Template Preview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#bda87f]">Destination:</span>
                  <div className="text-[#1b140a] font-medium">
                    {selectedTemplate.destination || 'Not specified'}
                  </div>
                </div>
                <div>
                  <span className="text-[#bda87f]">Duration:</span>
                  <div className="text-[#1b140a] font-medium">
                    {selectedTemplate.duration_days} days
                  </div>
                </div>
                <div>
                  <span className="text-[#bda87f]">Base Price:</span>
                  <div className="text-[#1b140a] font-medium">
                    ${(selectedTemplate.base_price || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="proposal-start-date"
                className="block text-sm font-medium text-[#6f5b3e] mb-2"
              >
                Trip start date
              </label>
              <input
                id="proposal-start-date"
                type="date"
                value={tripStartDate}
                onChange={(e) => onTripStartDateChange(e.target.value)}
                className="w-full px-4 py-3 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
              />
            </div>
            <div>
              <label
                htmlFor="proposal-end-date"
                className="block text-sm font-medium text-[#6f5b3e] mb-2"
              >
                Trip end date
              </label>
              <input
                id="proposal-end-date"
                type="date"
                min={tripStartDate || undefined}
                value={tripEndDate}
                onChange={(e) => onTripEndDateChange(e.target.value)}
                className="w-full px-4 py-3 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
              />
            </div>
          </div>

          {availabilityLoading && (
            <p className="text-sm text-[#6f5b3e]">Checking operator availability...</p>
          )}

          {!availabilityLoading &&
            tripStartDate &&
            tripEndDate &&
            availabilityConflicts.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  You are marked unavailable during part of this trip.
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {availabilityConflicts.map((slot) => (
                    <li key={slot.id}>
                      {(slot.reason || 'Unavailable')} · {slot.startDate} to {slot.endDate}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href="/calendar"
                    className="text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
                  >
                    Unblock dates
                  </Link>
                  <button
                    type="button"
                    onClick={() => onAvailabilityOverride()}
                    className="text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
                  >
                    Continue anyway
                  </button>
                  {availabilityOverrideAccepted && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Override acknowledged
                    </span>
                  )}
                </div>
              </div>
            )}

          {selectedTemplate && (pricingSuggestionLoading || pricingSuggestion) && (
            <GlassCard
              padding="md"
              rounded="xl"
              opacity="high"
              className="border-[#eadfcd] bg-[#fffdf8]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[#1b140a]">
                    <Sparkles className="h-4 w-4 text-[#9c7c46]" />
                    <p className="text-sm font-semibold">Pricing guidance</p>
                  </div>
                  {pricingSuggestionLoading ? (
                    <p className="mt-2 text-sm text-[#6f5b3e]">Finding similar trips...</p>
                  ) : pricingSuggestion ? (
                    <p className="mt-2 text-sm text-[#6f5b3e]">
                      Similar trips: &#8377;{pricingSuggestion.min.toLocaleString('en-IN')} &ndash; &#8377;{pricingSuggestion.max.toLocaleString('en-IN')}
                    </p>
                  ) : null}
                </div>

                {pricingSuggestion && (
                  <GlassBadge variant={pricingSuggestion.confidence === 'data' ? 'success' : 'info'}>
                    {pricingSuggestion.confidence === 'data'
                      ? `Based on ${pricingSuggestion.sampleSize} bookings`
                      : 'AI estimate'}
                  </GlassBadge>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
