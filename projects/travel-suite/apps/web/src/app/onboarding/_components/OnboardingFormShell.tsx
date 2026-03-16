import type { FormEvent, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  FIRST_VALUE_STEP,
  REVIEW_STEP,
  TOTAL_WIZARD_STEPS,
  WIZARD_STEPS,
} from './types';

interface OnboardingFormShellProps {
  currentStep: number;
  stepProgress: number;
  activeStep: (typeof WIZARD_STEPS)[number];
  error: string | null;
  success: string | null;
  saving: boolean;
  firstValueLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPrevious: () => void;
  onNext: () => void;
  children: ReactNode;
}

export function OnboardingFormShell({
  currentStep,
  stepProgress,
  activeStep,
  error,
  success,
  saving,
  firstValueLoading,
  onSubmit,
  onPrevious,
  onNext,
  children,
}: OnboardingFormShellProps) {
  const submitLabel =
    currentStep === REVIEW_STEP
      ? saving
        ? 'Saving...'
        : 'Save & Continue'
      : 'Enter Admin Workspace';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f5ef] to-[#efe4d2] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-[#eadfcd] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#eadfcd] bg-[#f8f1e6]">
                <Building2 className="h-5 w-5 text-[#9c7c46]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#1b140a]">Set Up Your Operator Workspace</h1>
                <p className="mt-1 text-sm text-[#6f5b3e]">
                  Finish setup, generate your first itinerary, and share it with a client in the first 10 minutes.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}

        {success ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-[#eadfcd] bg-white p-6 shadow-sm md:p-8">
          <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9c7c46]">
                  Step {currentStep} of {TOTAL_WIZARD_STEPS}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#1b140a]">{activeStep.title}</h2>
                <p className="mt-1 text-sm text-[#6f5b3e]">{activeStep.description}</p>
              </div>
              <span className="text-sm font-semibold text-[#9c7c46]">{stepProgress}%</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f1e6d5]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9c7c46] to-[#c89d54] transition-all duration-300"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
              {WIZARD_STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`rounded-lg border px-2 py-1.5 text-center text-[11px] transition-colors ${
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

          {children}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrevious}
              disabled={currentStep === 1 || saving || currentStep === FIRST_VALUE_STEP}
              className="inline-flex items-center gap-2 rounded-lg border border-[#dcc9aa] px-4 py-2 text-[#6f5b3e] hover:bg-[#f8f1e6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {currentStep < REVIEW_STEP ? (
              <button
                type="button"
                onClick={onNext}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#9c7c46] px-5 py-2.5 text-white hover:bg-[#8a6d3e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving || firstValueLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#9c7c46] px-5 py-2.5 text-white hover:bg-[#8a6d3e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving || firstValueLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
