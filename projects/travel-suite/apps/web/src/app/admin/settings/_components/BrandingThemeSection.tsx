import { Palette } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassInput } from '@/components/glass/GlassInput';
import { LogoUpload } from './LogoUpload';
import type { Organization } from '../shared';

interface BrandingThemeSectionProps {
  organization: Organization;
  setOrganization: React.Dispatch<React.SetStateAction<Organization | null>>;
}

export function BrandingThemeSection({ organization, setOrganization }: BrandingThemeSectionProps) {
  return (
    <GlassCard padding="none" rounded="2xl" data-tour="branding-section">
      <div className="flex items-center gap-3 border-b border-white/10 p-6">
        <Palette className="h-5 w-5 text-purple-500" />
        <h2 className="font-bold text-secondary dark:text-white">Branding & Theme</h2>
      </div>
      <div className="space-y-6 p-6">
        <LogoUpload
          currentUrl={organization.logo_url}
          organizationId={organization.id}
          onUploaded={(url) => setOrganization((prev) => (prev ? { ...prev, logo_url: url } : null))}
          onRemoved={() => setOrganization((prev) => (prev ? { ...prev, logo_url: null } : null))}
        />
        <div className="flex items-center gap-6">
          <div className="flex-1 space-y-2" data-tour="color-picker">
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
          <div className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/10 p-3 dark:bg-white/5">
            <div className="h-6 w-full rounded shadow-sm" style={{ backgroundColor: organization.primary_color || '#00D084' }} />
            <span className="text-center text-[9px] font-bold uppercase tracking-widest text-text-secondary">
              Preview
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
