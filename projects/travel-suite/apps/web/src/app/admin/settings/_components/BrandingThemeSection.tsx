import {
  ITINERARY_TEMPLATE_OPTIONS,
  type ItineraryTemplateId,
} from '@/components/pdf/itinerary-types';
import { Palette } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassInput } from '@/components/glass/GlassInput';
import type { Organization } from '../shared';

interface BrandingThemeSectionProps {
  organization: Organization;
  setOrganization: React.Dispatch<React.SetStateAction<Organization | null>>;
}

export function BrandingThemeSection({ organization, setOrganization }: BrandingThemeSectionProps) {
  return (
    <GlassCard padding="none" rounded="2xl">
      <div className="flex items-center gap-3 border-b border-white/10 p-6">
        <Palette className="h-5 w-5 text-purple-500" />
        <h2 className="font-bold text-secondary dark:text-white">Branding & Theme</h2>
      </div>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">Primary Brand Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={organization.primary_color || '#00D084'}
                onChange={(event) => setOrganization((prev) => (prev ? { ...prev, primary_color: event.target.value } : null))}
                className="h-10 w-10 cursor-pointer rounded border-none"
              />
              <GlassInput
                type="text"
                value={organization.primary_color || ''}
                onChange={(event) => setOrganization((prev) => (prev ? { ...prev, primary_color: event.target.value } : null))}
                placeholder="#00D084"
              />
            </div>
          </div>
          <div className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/10 p-4 dark:bg-white/5">
            <div className="h-8 w-full rounded shadow-sm" style={{ backgroundColor: organization.primary_color || '#00D084' }} />
            <span className="text-center text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              Primary Color Preview
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-secondary dark:text-white">Default Itinerary PDF Template</label>
          <select
            value={organization.itinerary_template || 'safari_story'}
            onChange={(event) => setOrganization((prev) => (prev ? { ...prev, itinerary_template: event.target.value as ItineraryTemplateId } : null))}
            className="w-full rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary dark:bg-white/5 dark:text-white"
          >
            {ITINERARY_TEMPLATE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary">
            This template is pre-selected for itinerary PDF exports. Users can still switch templates during download.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
