import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
    hasCompletedOnboarding: boolean;
    currentStep: number;
    totalSteps: number;
    completedSteps: string[];
    completeStep: (stepId: string) => void;
    nextStep: () => void;
    prevStep: () => void;
    finishOnboarding: () => void;
    resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            hasCompletedOnboarding: false,
            currentStep: 0,
            totalSteps: 4,
            completedSteps: [],
            completeStep: (stepId) => set((state) => ({
                completedSteps: state.completedSteps.includes(stepId)
                    ? state.completedSteps
                    : [...state.completedSteps, stepId]
            })),
            nextStep: () => set((state) => ({
                currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1)
            })),
            prevStep: () => set((state) => ({
                currentStep: Math.max(state.currentStep - 1, 0)
            })),
            finishOnboarding: () => set({ hasCompletedOnboarding: true }),
            resetOnboarding: () => set({
                hasCompletedOnboarding: false,
                currentStep: 0,
                completedSteps: []
            }),
        }),
        {
            name: 'onboarding-storage',
        }
    )
);
