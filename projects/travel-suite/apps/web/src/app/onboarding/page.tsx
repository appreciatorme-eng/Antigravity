'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Building2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Copy,
  Clock3,
} from 'lucide-react';
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

interface FirstValueMilestone {
  id: 'setup' | 'itinerary' | 'share';
  title: string;
  description: string;
  completed: boolean;
  target_minute: number;
}

interface FirstValuePayload {
  completion_pct: number;
  completed_milestones: number;
  total_milestones: number;
  setup_complete: boolean;
  itinerary_count: number;
  shared_itinerary_count: number;
  first_itinerary_created_at: string | null;
  first_shared_at: string | null;
  latest_share_url: string | null;
  milestones: FirstValueMilestone[];
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Business Basics',
    description: 'Set your operator identity and visual branding.',
  },
  {
    id: 2,
    title: 'Services & Market',
    description: 'Define regions, specialties, and your marketplace pitch.',
  },
  {
    id: 3,
    title: 'Proposal Style',
    description: 'Choose the default itinerary template your clients will see.',
  },
  {
    id: 4,
    title: 'Review & Launch',
    description: 'Confirm details and save your workspace setup.',
  },
  {
    id: 5,
    title: 'First-Value Sprint',
    description: 'Create and share your first itinerary inside 10 minutes.',
  },
] as const;

const TOTAL_WIZARD_STEPS = WIZARD_STEPS.length;
const REVIEW_STEP = 4;
const FIRST_VALUE_STEP = 5;

function formatDateTime(input: string | null): string {
  if (!input) return 'Not completed';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Not completed';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  const [currentStep, setCurrentStep] = useState<number>(1);

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

  const [firstValue, setFirstValue] = useState<FirstValuePayload | null>(null);
  const [firstValueLoading, setFirstValueLoading] = useState(false);
  const [firstValueRefreshing, setFirstValueRefreshing] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  const serviceRegionOptions = useMemo(
    () => mergeMarketplaceOptions(marketplaceRegionCatalog, serviceRegions),
    [marketplaceRegionCatalog, serviceRegions]
  );
  const specialtyOptions = useMemo(
    () => mergeMarketplaceOptions(marketplaceSpecialtyCatalog, specialties),
    [marketplaceSpecialtyCatalog, specialties]
  );
  const stepProgress = useMemo(
    () => Math.round((currentStep / TOTAL_WIZARD_STEPS) * 100),
    [currentStep]
  );
  const activeStep = WIZARD_STEPS[currentStep - 1];
  const selectedTemplateMeta = useMemo(
    () =>
      ITINERARY_TEMPLATE_OPTIONS.find((option) => option.id === itineraryTemplate) ||
      ITINERARY_TEMPLATE_OPTIONS[0],
    [itineraryTemplate]
  );

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    void loadOnboardingData();
    void loadMarketplaceOptions();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (currentStep !== FIRST_VALUE_STEP) return undefined;

    let cancelled = false;

    const poll = async () => {
      if (!cancelled) {
        await loadFirstValueProgress(false);
      }
    };

    void poll();
    const intervalId = setInterval(() => {
      void poll();
    }, 15_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [currentStep]);

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

  async function loadFirstValueProgress(showSpinner = true) {
    if (showSpinner) {
      setFirstValueLoading(true);
    } else {
      setFirstValueRefreshing(true);
    }

    try {
      const response = await fetch('/api/onboarding/first-value', { cache: 'no-store' });
      const payload = (await response.json()) as FirstValuePayload | { error?: string };

      if (!response.ok) {
        throw new Error('error' in payload ? payload.error || 'Failed to load milestones' : 'Failed to load milestones');
      }

      setFirstValue(payload as FirstValuePayload);
      if (showSpinner) {
        setError(null);
      }
    } catch (err) {
      if (showSpinner) {
        setError(err instanceof Error ? err.message : 'Failed to load first-value milestones');
      }
    } finally {
      if (showSpinner) {
        setFirstValueLoading(false);
      } else {
        setFirstValueRefreshing(false);
      }
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (currentStep < REVIEW_STEP) {
      handleNextStep();
      return;
    }

    if (currentStep === FIRST_VALUE_STEP) {
      router.replace(nextPath);
      return;
    }

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

      setSuccess('Workspace setup saved. Complete the first-value sprint below.');
      setCurrentStep(FIRST_VALUE_STEP);
      await loadFirstValueProgress(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save onboarding details');
    } finally {
      setSaving(false);
    }
  }

  function validateCurrentStep(): boolean {
    if (currentStep === 1 && !companyName.trim()) {
      setError('Company name is required to continue.');
      return false;
    }

    return true;
  }

  function handleNextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    setError(null);
    setCurrentStep((previous) => Math.min(REVIEW_STEP, previous + 1));
  }

  function handlePreviousStep() {
    setError(null);
    setCurrentStep((previous) => Math.max(1, previous - 1));
  }

  async function handleCopyShareLink() {
    if (!firstValue?.latest_share_url) return;
    try {
      await navigator.clipboard.writeText(firstValue.latest_share_url);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 1600);
    } catch {
      setError('Unable to copy share link. Please copy it manually from the milestone card.');
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
              <h1 className="text-2xl font-semibold text-[#1b140a]">Set Up Your Operator Workspace</h1>
              <p className="text-sm text-[#6f5b3e] mt-1">
                Finish setup, generate your first itinerary, and share it with a client in the first 10 minutes.
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
          <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9c7c46] font-semibold">
                  Step {currentStep} of {TOTAL_WIZARD_STEPS}
                </p>
                <h2 className="text-lg font-semibold text-[#1b140a] mt-1">{activeStep.title}</h2>
                <p className="text-sm text-[#6f5b3e] mt-1">{activeStep.description}</p>
              </div>
              <span className="text-sm font-semibold text-[#9c7c46]">{stepProgress}%</span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-[#f1e6d5] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9c7c46] to-[#c89d54] transition-all duration-300"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
              {WIZARD_STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] text-center transition-colors ${
                    step.id === currentStep
                      ? 'border-[#c89d54] bg-[#fff7ea] text-[#7c6032]'
                      : step.id < currentStep
                      ? 'border-[#d9c7aa] bg-white text-[#7c6032]'
                      : 'border-[#eadfcd] bg-white text-[#a18a66]'
                  }`}
                >
                  {step.title}
                </div>
              ))}
            </div>
          </div>

          {currentStep === 1 ? (
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
            </div>
          ) : null}

          {currentStep === 2 ? (
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
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-4">
              <div>
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
              <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#9c7c46] font-semibold">
                  Selected Template
                </p>
                <h3 className="text-lg font-semibold text-[#1b140a] mt-1">{selectedTemplateMeta.label}</h3>
                <p className="text-sm text-[#6f5b3e] mt-1">{selectedTemplateMeta.description}</p>
              </div>
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#eadfcd] p-4">
                <h3 className="text-sm font-semibold text-[#1b140a] mb-3">Business Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[#6f5b3e]">
                  <p><span className="font-medium text-[#1b140a]">Operator:</span> {operatorName || 'Not set'}</p>
                  <p><span className="font-medium text-[#1b140a]">Company:</span> {companyName || 'Not set'}</p>
                  <p><span className="font-medium text-[#1b140a]">Phone:</span> {phone || 'Not set'}</p>
                  <p><span className="font-medium text-[#1b140a]">WhatsApp:</span> {whatsappPhone || 'Not set'}</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#eadfcd] p-4">
                <h3 className="text-sm font-semibold text-[#1b140a] mb-3">Marketplace</h3>
                <p className="text-sm text-[#6f5b3e]">
                  <span className="font-medium text-[#1b140a]">Regions:</span>{' '}
                  {serviceRegions.length ? serviceRegions.join(', ') : 'Not set'}
                </p>
                <p className="text-sm text-[#6f5b3e] mt-1">
                  <span className="font-medium text-[#1b140a]">Specialties:</span>{' '}
                  {specialties.length ? specialties.join(', ') : 'Not set'}
                </p>
              </div>
              <div className="rounded-xl border border-[#eadfcd] p-4">
                <h3 className="text-sm font-semibold text-[#1b140a] mb-3">Template & Branding</h3>
                <p className="text-sm text-[#6f5b3e]">
                  <span className="font-medium text-[#1b140a]">Template:</span> {selectedTemplateMeta.label}
                </p>
                <p className="text-sm text-[#6f5b3e] mt-1">
                  <span className="font-medium text-[#1b140a]">Primary color:</span> {primaryColor}
                </p>
              </div>
            </div>
          ) : null}

          {currentStep === FIRST_VALUE_STEP ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#9c7c46] font-semibold">10-minute first value</p>
                    <h3 className="text-lg font-semibold text-[#1b140a] mt-1">Reach first client share quickly</h3>
                    <p className="text-sm text-[#6f5b3e] mt-1">
                      Complete all milestones to validate activation: setup, itinerary creation, and first share.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6f5b3e]">Progress</p>
                    <p className="text-2xl font-semibold text-[#1b140a]">{firstValue?.completion_pct ?? 0}%</p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-[#f1e6d5] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#9c7c46] to-[#c89d54] transition-all duration-300"
                    style={{ width: `${firstValue?.completion_pct ?? 0}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg bg-white border border-[#eadfcd] px-3 py-2">
                    <p className="text-[#6f5b3e]">Itineraries created</p>
                    <p className="text-[#1b140a] font-semibold mt-1">{firstValue?.itinerary_count ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-[#eadfcd] px-3 py-2">
                    <p className="text-[#6f5b3e]">Shared itineraries</p>
                    <p className="text-[#1b140a] font-semibold mt-1">{firstValue?.shared_itinerary_count ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-[#eadfcd] px-3 py-2">
                    <p className="text-[#6f5b3e]">Milestones complete</p>
                    <p className="text-[#1b140a] font-semibold mt-1">
                      {firstValue?.completed_milestones ?? 0}/{firstValue?.total_milestones ?? 3}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {(firstValue?.milestones || []).map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`rounded-xl border p-4 ${
                      milestone.completed
                        ? 'border-green-200 bg-green-50'
                        : 'border-[#eadfcd] bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center border ${
                          milestone.completed
                            ? 'bg-green-100 border-green-200 text-green-700'
                            : 'bg-[#fcf8f1] border-[#eadfcd] text-[#9c7c46]'
                        }`}
                      >
                        {milestone.completed ? <CheckCircle2 className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[#1b140a]">{milestone.title}</p>
                          <span className="text-[11px] text-[#6f5b3e]">Target: {milestone.target_minute} min</span>
                        </div>
                        <p className="text-sm text-[#6f5b3e] mt-1">{milestone.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href="/planner"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#dcc9aa] text-[#6f5b3e] hover:bg-[#f8f1e6]"
                >
                  Open Planner
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="/trips"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#dcc9aa] text-[#6f5b3e] hover:bg-[#f8f1e6]"
                >
                  Open Trips
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadFirstValueProgress(false)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#dcc9aa] text-[#6f5b3e] hover:bg-[#f8f1e6]"
                  disabled={firstValueRefreshing || firstValueLoading}
                >
                  {firstValueRefreshing || firstValueLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh milestones
                </button>

                {firstValue?.latest_share_url ? (
                  <button
                    type="button"
                    onClick={() => void handleCopyShareLink()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#dcc9aa] text-[#6f5b3e] hover:bg-[#f8f1e6]"
                  >
                    {shareLinkCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {shareLinkCopied ? 'Copied share link' : 'Copy latest share link'}
                  </button>
                ) : null}
              </div>

              <div className="rounded-xl border border-[#eadfcd] p-4 text-sm text-[#6f5b3e]">
                <p>
                  <span className="font-medium text-[#1b140a]">First itinerary:</span>{' '}
                  {formatDateTime(firstValue?.first_itinerary_created_at || null)}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-[#1b140a]">First share:</span>{' '}
                  {formatDateTime(firstValue?.first_shared_at || null)}
                </p>
                {firstValueLoading ? (
                  <p className="mt-2 text-xs text-[#9c7c46]">Checking latest milestone activity...</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={currentStep === 1 || saving || currentStep === FIRST_VALUE_STEP}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#dcc9aa] text-[#6f5b3e] hover:bg-[#f8f1e6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < REVIEW_STEP ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#9c7c46] text-white hover:bg-[#8a6d3e] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving || firstValueLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#9c7c46] text-white hover:bg-[#8a6d3e] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving || firstValueLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {currentStep === REVIEW_STEP
                  ? saving
                    ? 'Saving...'
                    : 'Save & Continue'
                  : 'Enter Admin Workspace'}
              </button>
            )}
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
