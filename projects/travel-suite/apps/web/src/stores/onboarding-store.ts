import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
    hasCompletedOnboarding: boolean;
    isDismissed: boolean;
    currentStep: number;
    totalSteps: number;
    version: number;
    completedSteps: string[];
    skippedSteps: string[];
    completeStep: (stepId: string) => void;
    skipStep: (stepId: string) => void;
    setCurrentStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    dismissWizard: () => void;
    resumeWizard: () => void;
    finishOnboarding: () => void;
    resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            hasCompletedOnboarding: false,
            isDismissed: false,
            currentStep: 1,
            totalSteps: 2,
            version: 2,
            completedSteps: [],
            skippedSteps: [],
            completeStep: (stepId) => set((state) => ({
                completedSteps: state.completedSteps.includes(stepId)
                    ? state.completedSteps
                    : [...state.completedSteps, stepId]
            })),
            skipStep: (stepId) => set((state) => ({
                skippedSteps: state.skippedSteps.includes(stepId)
                    ? state.skippedSteps
                    : [...state.skippedSteps, stepId]
            })),
            setCurrentStep: (step) => set({ currentStep: step }),
            nextStep: () => set((state) => ({
                currentStep: Math.min(state.currentStep + 1, state.totalSteps)
            })),
            prevStep: () => set((state) => ({
                currentStep: Math.max(state.currentStep - 1, 1)
            })),
            dismissWizard: () => set({ isDismissed: true }),
            resumeWizard: () => set({ isDismissed: false }),
            finishOnboarding: () => set({
                hasCompletedOnboarding: true,
                isDismissed: false,
            }),
            resetOnboarding: () => set({
                hasCompletedOnboarding: false,
                isDismissed: false,
                currentStep: 1,
                completedSteps: [],
                skippedSteps: []
            }),
        }),
        {
            name: 'onboarding-storage',
        }
    )
);
