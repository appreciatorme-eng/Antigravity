'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Building2, CheckCircle2 } from 'lucide-react';
import {
  ITINERARY_TEMPLATE_OPTIONS,
  type ItineraryTemplateId,
} from '@/components/pdf/itinerary-types';
import SearchableCreatableMultiSelect from '@/components/forms/SearchableCreatableMultiSelect';
import {
  fetchMarketplaceOptionCatalog,
  mergeMarketplaceOptions,
  SERVICE_REGION_OPTIONS,
  SPECIALTY_OPTIONS,
} from '@/lib/marketplace-options';

interface OnboardingPayload {
  onboardingComplete: boolean;
  profile: {
    full_name: string;
    email: string;
    phone: string;
    phone_whatsapp: string;
    bio: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    itinerary_template: ItineraryTemplateId;
  } | null;
  marketplace: {
    description: string;
    service_regions: string[];
    specialties: string[];
    verification_status: string;
    is_verified: boolean;
  } | null;
}

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const requested = searchParams.get('next');
    if (requested && requested.startsWith('/')) return requested;
    return '/admin';
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [operatorName, setOperatorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f26430');
  const [itineraryTemplate, setItineraryTemplate] = useState<ItineraryTemplateId>('safari_story');
  const [bio, setBio] = useState('');
  const [marketplaceDescription, setMarketplaceDescription] = useState('');
  const [serviceRegions, setServiceRegions] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [marketplaceRegionCatalog, setMarketplaceRegionCatalog] = useState<string[]>(
    SERVICE_REGION_OPTIONS
  );
  const [marketplaceSpecialtyCatalog, setMarketplaceSpecialtyCatalog] = useState<string[]>(
    SPECIALTY_OPTIONS
  );

  const serviceRegionOptions = useMemo(
    () => mergeMarketplaceOptions(marketplaceRegionCatalog, serviceRegions),
    [marketplaceRegionCatalog, serviceRegions]
  );
  const specialtyOptions = useMemo(
    () => mergeMarketplaceOptions(marketplaceSpecialtyCatalog, specialties),
    [marketplaceSpecialtyCatalog, specialties]
  );

  useEffect(() => {
    void loadOnboardingData();
    void loadMarketplaceOptions();
  }, []);

  async function loadMarketplaceOptions() {
    const payload = await fetchMarketplaceOptionCatalog();
    if (!payload) return;

    if (payload.service_regions.length > 0) {
      setMarketplaceRegionCatalog(payload.service_regions);
    }
    if (payload.specialties.length > 0) {
      setMarketplaceSpecialtyCatalog(payload.specialties);
    }
  }

  async function loadOnboardingData() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/setup', { cache: 'no-store' });
      if (response.status === 401) {
        router.replace(`/auth?next=${encodeURIComponent('/onboarding')}`);
        return;
      }

      const payload = (await response.json()) as OnboardingPayload | { error: string };
      if (!response.ok) {
        throw new Error('error' in payload ? payload.error : 'Failed to load onboarding data');
      }

      const data = payload as OnboardingPayload;
      if (data.onboardingComplete) {
        router.replace(nextPath);
        return;
      }

      setOperatorName(data.profile.full_name || '');
      setPhone(data.profile.phone || '');
      setWhatsappPhone(data.profile.phone_whatsapp || '');
      setBio(data.profile.bio || '');

      if (data.organization) {
        setCompanyName(data.organization.name || '');
        setLogoUrl(data.organization.logo_url || '');
        setPrimaryColor(data.organization.primary_color || '#f26430');
        setItineraryTemplate(data.organization.itinerary_template || 'safari_story');
      }

      if (data.marketplace) {
        setMarketplaceDescription(data.marketplace.description || '');
        setServiceRegions(data.marketplace.service_regions || []);
        setSpecialties(data.marketplace.specialties || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorName: operatorName.trim(),
          companyName: companyName.trim(),
          phone: phone.trim(),
          whatsappPhone: whatsappPhone.trim(),
          logoUrl: logoUrl.trim(),
          primaryColor: primaryColor.trim(),
          itineraryTemplate,
          bio: bio.trim(),
          marketplaceDescription: marketplaceDescription.trim(),
          serviceRegions,
          specialties,
        }),
      });

      const payload = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to save onboarding details');
      }

      setSuccess('Profile setup complete. Redirecting...');
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save onboarding details');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f5ef] to-[#efe4d2]">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-[#eadfcd]">
          <Loader2 className="w-5 h-5 animate-spin text-[#9c7c46]" />
          <span className="text-sm text-[#6f5b3e]">Loading setup...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f5ef] to-[#efe4d2] px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-[#eadfcd] rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-[#f8f1e6] border border-[#eadfcd] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#9c7c46]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#1b140a]">Set Up Your Operator Profile</h1>
              <p className="text-sm text-[#6f5b3e] mt-1">
                This setup creates your tour operator account, enables the admin workspace, and prepares your marketplace profile.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="bg-white border border-[#eadfcd] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6f5b3e] mb-1.5">Operator Name</label>
              <input
                value={operatorName}
                onChange={(event) => setOperatorName(event.target.value)}
                placeholder="e.g. Nidhi Salgame"
                className="w-full px-3 py-2.5 rounded-lg border border-[#eadfcd] focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6f5b3e] mb-1.5">Company Name *</label>
              <input
                required
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="e.g. Wander Beyond Boundaries"
                className="w-full px-3 py-2.5 rounded-lg border border-[#eadfcd] focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6f5b3e] mb-1.5">Phone</label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+254..."
                className="w-full px-3 py-2.5 rounded-lg border border-[#eadfcd] focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6f5b3e] mb-1.5">WhatsApp</label>
              <input
                value={whatsappPhone}
                onChange={(event) => setWhatsappPhone(event.target.value)}
                placeholder="+91..."
                className="w-full px-3 py-2.5 rounded-lg border border-[#eadfcd] focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6f5b3e] mb-1.5">Logo URL</label>
              <input
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-lg border border-[#eadfcd] focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6f5b3e] mb-1.5">Primary Color</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                className="w-full h-11 p-1 rounded-lg border border-[#eadfcd] bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#6f5b3e] mb-1.5">Default Itinerary PDF Template</label>
              <select
                value={itineraryTemplate}
                onChange={(event) => setItineraryTemplate(event.target.value as ItineraryTemplateId)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#eadfcd] focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              >
                {ITINERARY_TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} — {option.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6f5b3e] mb-1.5">Operator Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Tell clients about your expertise and team."
                className="w-full px-3 py-2.5 rounded-lg border border-[#eadfcd] focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6f5b3e] mb-1.5">Marketplace Description</label>
              <textarea
                rows={4}
                value={marketplaceDescription}
                onChange={(event) => setMarketplaceDescription(event.target.value)}
                placeholder="What makes your tours unique?"
                className="w-full px-3 py-2.5 rounded-lg border border-[#eadfcd] focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
              />
            </div>
            <div>
              <SearchableCreatableMultiSelect
                label="Area of Operations"
                selectedValues={serviceRegions}
                onChange={setServiceRegions}
                options={serviceRegionOptions}
                placeholder="Search places (e.g. Kenya, Dubai, Bali) or add new..."
                helperText="Start typing to autofill from the global destination list. If missing, add custom."
              />
            </div>
            <div>
              <SearchableCreatableMultiSelect
                label="Specialties"
                selectedValues={specialties}
                onChange={setSpecialties}
                options={specialtyOptions}
                placeholder="Search specialties or add new..."
                helperText="Select from common tour specialties, or add your own niche offerings."
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#9c7c46] text-white hover:bg-[#8a6d3e] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OnboardingPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f5ef] to-[#efe4d2]">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm border border-[#eadfcd]">
        <Loader2 className="w-5 h-5 animate-spin text-[#9c7c46]" />
        <span className="text-sm text-[#6f5b3e]">Loading setup...</span>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingPageFallback />}>
      <OnboardingPageContent />
    </Suspense>
  );
}
