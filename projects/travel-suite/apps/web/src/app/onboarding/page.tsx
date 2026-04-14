'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/lib/analytics/events';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { OnboardingDetailsSteps } from './_components/OnboardingDetailsSteps';
import { OnboardingFormShell } from './_components/OnboardingFormShell';
import type { OnboardingPayload } from './_components/types';
import { SUBMIT_STEP, WIZARD_STEPS } from './_components/types';

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useAnalytics();
  const setStoreStep = useOnboardingStore((s) => s.setCurrentStep);

  const nextPath = useMemo(() => {
    const requested = searchParams.get('next');
    if (requested && requested.startsWith('/')) return requested;
    return '/admin';
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [operatorName, setOperatorName] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    void loadOnboardingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const activeStep = WIZARD_STEPS[currentStep - 1];
    if (!loading && activeStep) {
      analytics.stepViewed(currentStep, activeStep.title);
    }
  }, [currentStep, loading, analytics]);

  useEffect(() => {
    setStoreStep(currentStep);
  }, [currentStep, setStoreStep]);

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
      if (data.organization) {
        setCompanyName(data.organization.name || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    const activeStep = WIZARD_STEPS[0];
    if (activeStep) {
      analytics.stepCompleted(1, activeStep.title);
    }

    setError(null);
    setCurrentStep(SUBMIT_STEP);
  }

  async function handleEnterWorkspace() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/setup', {
        // eslint-disable-next-line no-restricted-syntax -- pre-auth route, no Bearer token available
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorName: operatorName.trim(),
          companyName: companyName.trim(),
        }),
      });

      const payload = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to save onboarding details');
      }

      const activeStep = WIZARD_STEPS[1];
      if (activeStep) {
        analytics.stepCompleted(SUBMIT_STEP, activeStep.title);
      }
      analytics.wizardCompleted();

      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save onboarding details');
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentStep === 1) {
      handleContinue();
    } else {
      void handleEnterWorkspace();
    }
  }

  if (loading) {
    return <OnboardingPageFallback />;
  }

  return (
    <OnboardingFormShell
      currentStep={currentStep}
      error={error}
      saving={saving}
      onSubmit={handleSubmit}
    >
      <OnboardingDetailsSteps
        currentStep={currentStep}
        operatorName={operatorName}
        companyName={companyName}
        setOperatorName={setOperatorName}
        setCompanyName={setCompanyName}
        onContinue={handleContinue}
        onEnterWorkspace={() => void handleEnterWorkspace()}
        saving={saving}
      />
    </OnboardingFormShell>
  );
}

function OnboardingPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1628]">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-[#00d084]" />
        <span className="text-sm text-white/60">Loading setup...</span>
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
