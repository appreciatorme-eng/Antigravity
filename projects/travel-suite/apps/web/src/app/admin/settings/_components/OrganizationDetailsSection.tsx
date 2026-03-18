import { Building2 } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassInput } from '@/components/glass/GlassInput';
import { LogoUpload } from './LogoUpload';
import type { Organization } from '../shared';

interface OrganizationDetailsSectionProps {
  organization: Organization;
  setOrganization: React.Dispatch<React.SetStateAction<Organization | null>>;
  updateBillingAddressField: (field: keyof Organization['billing_address'], value: string) => void;
}

export function OrganizationDetailsSection({
  organization,
  setOrganization,
  updateBillingAddressField,
}: OrganizationDetailsSectionProps) {
  return (
    <GlassCard padding="none" rounded="2xl">
      <div className="flex items-center gap-3 border-b border-white/10 p-6">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-secondary dark:text-white">Organization Details</h2>
      </div>
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">Company Name</label>
            <GlassInput
              type="text"
              value={organization.name || ''}
              onChange={(event) => setOrganization((prev) => (prev ? { ...prev, name: event.target.value } : null))}
              placeholder="Enter company name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">Organization Slug</label>
            <GlassInput type="text" value={organization.slug || ''} disabled />
          </div>
        </div>
        <LogoUpload
          currentUrl={organization.logo_url}
          organizationId={organization.id}
          onUploaded={(url) => setOrganization((prev) => (prev ? { ...prev, logo_url: url } : null))}
          onRemoved={() => setOrganization((prev) => (prev ? { ...prev, logo_url: null } : null))}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">GSTIN</label>
            <GlassInput
              type="text"
              value={organization.gstin || ''}
              onChange={(event) => setOrganization((prev) => (prev ? { ...prev, gstin: event.target.value.toUpperCase() } : null))}
              placeholder="27ABCDE1234F1Z5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">Billing State</label>
            <GlassInput
              type="text"
              value={organization.billing_state || ''}
              onChange={(event) => setOrganization((prev) => (prev ? { ...prev, billing_state: event.target.value } : null))}
              placeholder="Maharashtra"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-secondary dark:text-white">Billing Address Line 1</label>
          <GlassInput
            type="text"
            value={organization.billing_address.line1 || ''}
            onChange={(event) => updateBillingAddressField('line1', event.target.value)}
            placeholder="Street, Area, Building"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-secondary dark:text-white">Billing Address Line 2</label>
          <GlassInput
            type="text"
            value={organization.billing_address.line2 || ''}
            onChange={(event) => updateBillingAddressField('line2', event.target.value)}
            placeholder="Landmark (optional)"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">City</label>
            <GlassInput
              type="text"
              value={organization.billing_address.city || ''}
              onChange={(event) => updateBillingAddressField('city', event.target.value)}
              placeholder="Mumbai"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">Postal Code</label>
            <GlassInput
              type="text"
              value={organization.billing_address.postal_code || ''}
              onChange={(event) => updateBillingAddressField('postal_code', event.target.value)}
              placeholder="400001"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">Country</label>
            <GlassInput
              type="text"
              value={organization.billing_address.country || ''}
              onChange={(event) => updateBillingAddressField('country', event.target.value)}
              placeholder="India"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">Billing Contact Email</label>
            <GlassInput
              type="email"
              value={organization.billing_address.email || ''}
              onChange={(event) => updateBillingAddressField('email', event.target.value)}
              placeholder="billing@yourcompany.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-secondary dark:text-white">Billing Contact Phone</label>
            <GlassInput
              type="text"
              value={organization.billing_address.phone || ''}
              onChange={(event) => updateBillingAddressField('phone', event.target.value)}
              placeholder="+91 9876543210"
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
