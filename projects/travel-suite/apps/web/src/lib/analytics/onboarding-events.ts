"use client";

import { usePostHog } from "posthog-js/react";

export function useOnboardingAnalytics() {
  const posthog = usePostHog();

  return {
    onboardingStepViewed: (step: number, stepName: string) =>
      posthog.capture("onboarding_step_viewed", { step, step_name: stepName }),
    onboardingStepCompleted: (step: number, stepName: string) =>
      posthog.capture("onboarding_step_completed", { step, step_name: stepName }),
    onboardingStepSkipped: (step: number, stepName: string) =>
      posthog.capture("onboarding_step_skipped", { step, step_name: stepName }),
    onboardingWizardCompleted: (
      totalSteps: number,
      completedSteps: number,
      skippedSteps: number
    ) =>
      posthog.capture("onboarding_wizard_completed", {
        total_steps: totalSteps,
        completed_steps: completedSteps,
        skipped_steps: skippedSteps,
      }),
    onboardingSampleDataLoaded: (tripCount: number) =>
      posthog.capture("onboarding_sample_data_loaded", { trip_count: tripCount }),
  };
}
