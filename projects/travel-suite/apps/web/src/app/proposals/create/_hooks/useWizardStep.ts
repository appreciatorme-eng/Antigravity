'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type WizardStepNumber = 1 | 2 | 3 | 4;

const MIN_STEP: WizardStepNumber = 1;
const MAX_STEP: WizardStepNumber = 4;

interface UseWizardStepOptions {
  selectedClientId: string;
  selectedTemplateId: string;
  initialStep?: WizardStepNumber;
}

interface UseWizardStepReturn {
  currentStep: WizardStepNumber;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: WizardStepNumber) => void;
  canProceed: (step: WizardStepNumber) => boolean;
}

function clampStep(n: number): WizardStepNumber {
  if (n < MIN_STEP) return MIN_STEP;
  if (n > MAX_STEP) return MAX_STEP;
  return n as WizardStepNumber;
}

export function useWizardStep({
  selectedClientId,
  selectedTemplateId,
  initialStep = 1,
}: UseWizardStepOptions): UseWizardStepReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStep: WizardStepNumber = useMemo(() => {
    const urlStep = searchParams.get('step');
    if (urlStep) {
      const parsed = parseInt(urlStep, 10);
      if (parsed >= MIN_STEP && parsed <= MAX_STEP) {
        return parsed as WizardStepNumber;
      }
    }
    return initialStep;
  }, [searchParams, initialStep]);

  const pushStep = useCallback(
    (step: WizardStepNumber) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('step', String(step));
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const canProceed = useCallback(
    (step: WizardStepNumber): boolean => {
      switch (step) {
        case 1:
          return selectedClientId.length > 0;
        case 2:
          return selectedTemplateId.length > 0;
        case 3:
          return true; // add-ons are optional
        case 4:
          return true; // review always passes
        default:
          return false;
      }
    },
    [selectedClientId, selectedTemplateId],
  );

  const nextStep = useCallback(() => {
    if (!canProceed(currentStep)) return;
    const next = clampStep(currentStep + 1);
    pushStep(next);
  }, [currentStep, canProceed, pushStep]);

  const prevStep = useCallback(() => {
    const prev = clampStep(currentStep - 1);
    pushStep(prev);
  }, [currentStep, pushStep]);

  const goToStep = useCallback(
    (step: WizardStepNumber) => {
      pushStep(clampStep(step));
    },
    [pushStep],
  );

  return { currentStep, nextStep, prevStep, goToStep, canProceed };
}
