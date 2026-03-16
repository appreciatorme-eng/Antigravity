'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ITINERARY_TEMPLATE_OPTIONS,
  type ItineraryTemplateId,
} from '@/components/pdf/itinerary-types';
import {
  fetchMarketplaceOptionCatalog,
  mergeMarketplaceOptions,
  SERVICE_REGION_OPTIONS,
  SPECIALTY_OPTIONS,
} from '@/lib/marketplace-options';
import { FirstValueSprintStep } from './_components/FirstValueSprintStep';
import { OnboardingDetailsSteps } from './_components/OnboardingDetailsSteps';
import { OnboardingFormShell } from './_components/OnboardingFormShell';
import { ProposalGenerationStep } from './_components/ProposalGenerationStep';
import { SampleDataLoader } from './_components/SampleDataLoader';
import { TripCreationStep } from './_components/TripCreationStep';
import type { ItineraryResult } from '@/types/itinerary';
import {
  FIRST_VALUE_STEP,
  OnboardingPayload,
  FirstValuePayload,
  PROPOSAL_GENERATION_STEP,
  REVIEW_STEP,
  TOTAL_WIZARD_STEPS,
  TRIP_CREATION_STEP,
  WIZARD_STEPS,
} from './_components/types';

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
  const [marketplaceRegionCatalog, setMarketplaceRegionCatalog] = useState<string[]>(SERVICE_REGION_OPTIONS);
  const [marketplaceSpecialtyCatalog, setMarketplaceSpecialtyCatalog] = useState<string[]>(SPECIALTY_OPTIONS);

  const [firstValue, setFirstValue] = useState<FirstValuePayload | null>(null);
  const [firstValueLoading, setFirstValueLoading] = useState(false);
  const [firstValueRefreshing, setFirstValueRefreshing] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  const [tripClientId, setTripClientId] = useState('');
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [tripAiPrompt, setTripAiPrompt] = useState('');
  const [tripSelectedItineraryId, setTripSelectedItineraryId] = useState<string | null>(null);
  const [tripGeneratedItinerary, setTripGeneratedItinerary] = useState<ItineraryResult | null>(null);

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
        throw new Error(
          'error' in payload ? payload.error || 'Failed to load milestones' : 'Failed to load milestones'
        );
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

  async function handleSampleDataLoaded() {
    await loadOnboardingData();
    if (currentStep === FIRST_VALUE_STEP) {
      await loadFirstValueProgress(true);
    }
  }

  if (loading) {
    return <OnboardingPageFallback />;
  }

  return (
    <OnboardingFormShell
      currentStep={currentStep}
      stepProgress={stepProgress}
      activeStep={activeStep}
      error={error}
      success={success}
      saving={saving}
      firstValueLoading={firstValueLoading}
      onSubmit={handleSubmit}
      onPrevious={handlePreviousStep}
      onNext={handleNextStep}
      extraActions={<SampleDataLoader onDataLoaded={handleSampleDataLoaded} />}
    >
      {currentStep === FIRST_VALUE_STEP ? (
        <FirstValueSprintStep
          firstValue={firstValue}
          firstValueLoading={firstValueLoading}
          firstValueRefreshing={firstValueRefreshing}
          shareLinkCopied={shareLinkCopied}
          onRefresh={() => void loadFirstValueProgress(false)}
          onCopyShareLink={() => void handleCopyShareLink()}
        />
      ) : currentStep === TRIP_CREATION_STEP ? (
        <TripCreationStep
          clientId={tripClientId}
          startDate={tripStartDate}
          endDate={tripEndDate}
          aiPrompt={tripAiPrompt}
          selectedItineraryId={tripSelectedItineraryId}
          generatedItinerary={tripGeneratedItinerary}
          setClientId={setTripClientId}
          setStartDate={setTripStartDate}
          setEndDate={setTripEndDate}
          setAiPrompt={setTripAiPrompt}
          setSelectedItineraryId={setTripSelectedItineraryId}
          setGeneratedItinerary={setTripGeneratedItinerary}
        />
      ) : currentStep === PROPOSAL_GENERATION_STEP ? (
        <ProposalGenerationStep
          clientId={tripClientId}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
        />
      ) : (
        <OnboardingDetailsSteps
          currentStep={currentStep}
          operatorName={operatorName}
          companyName={companyName}
          phone={phone}
          whatsappPhone={whatsappPhone}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          bio={bio}
          marketplaceDescription={marketplaceDescription}
          serviceRegions={serviceRegions}
          specialties={specialties}
          serviceRegionOptions={serviceRegionOptions}
          specialtyOptions={specialtyOptions}
          itineraryTemplate={itineraryTemplate}
          selectedTemplateLabel={selectedTemplateMeta.label}
          selectedTemplateDescription={selectedTemplateMeta.description}
          setOperatorName={setOperatorName}
          setCompanyName={setCompanyName}
          setPhone={setPhone}
          setWhatsappPhone={setWhatsappPhone}
          setLogoUrl={setLogoUrl}
          setPrimaryColor={setPrimaryColor}
          setBio={setBio}
          setMarketplaceDescription={setMarketplaceDescription}
          setServiceRegions={setServiceRegions}
          setSpecialties={setSpecialties}
          setItineraryTemplate={setItineraryTemplate}
        />
      )}
    </OnboardingFormShell>
  );
}

function OnboardingPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f8f5ef] to-[#efe4d2]">
      <div className="flex items-center gap-3 rounded-2xl border border-[#eadfcd] bg-white px-6 py-4 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-[#9c7c46]" />
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
