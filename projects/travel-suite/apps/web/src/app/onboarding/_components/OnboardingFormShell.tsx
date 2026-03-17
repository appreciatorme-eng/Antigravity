import type { FormEvent, ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  SkipForward,
  X,
} from 'lucide-react';
import {
  FIRST_VALUE_STEP,
  REVIEW_STEP,
  TOTAL_WIZARD_STEPS,
  WIZARD_STEPS,
} from './types';
import { StepTooltip } from './StepTooltip';
import { VideoHelpButton } from './VideoHelpButton';

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
  onSkip?: () => void;
  onDismiss?: () => void;
  extraActions?: ReactNode;
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
  onSkip,
  onDismiss,
  extraActions,
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
        <div className="rounded-2xl border border-[#eadfcd] bg-white p-4 shadow-sm sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#eadfcd] bg-[#f8f1e6] sm:h-11 sm:w-11">
                <Building2 className="h-5 w-5 text-[#9c7c46]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-[#1b140a] sm:text-2xl">Set Up Your Operator Workspace</h1>
                <p className="mt-1 text-sm text-[#6f5b3e]">
                  Finish setup, generate your first itinerary, and share it with a client in the first 10 minutes.
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-auto">
              {extraActions ? <div>{extraActions}</div> : null}
              {onDismiss ? (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dcc9aa] text-[#6f5b3e] transition hover:bg-[#f8f1e6]"
                  title="Dismiss wizard and return later"
                  aria-label="Dismiss wizard"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="mt-1 text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        ) : null}

        {success ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-[#eadfcd] bg-white p-4 shadow-sm sm:p-6 md:p-8">
          <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9c7c46]">
                    Step {currentStep} of {TOTAL_WIZARD_STEPS}
                  </p>
                  {activeStep.helpText && <StepTooltip content={activeStep.helpText} />}
                </div>
                <h2 className="mt-1 text-base font-semibold text-[#1b140a] sm:text-lg">{activeStep.title}</h2>
                <p className="mt-1 text-sm text-[#6f5b3e]">{activeStep.description}</p>
                {activeStep.videoUrl && (
                  <div className="mt-3">
                    <VideoHelpButton videoUrl={activeStep.videoUrl} title={`${activeStep.title} Tutorial`} />
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-[#9c7c46] sm:mt-0">{stepProgress}%</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#f1e6d5]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9c7c46] to-[#c89d54] transition-all duration-300"
                style={{ width: `${stepProgress}%` }}
                role="progressbar"
                aria-valuenow={stepProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress: ${stepProgress}%`}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
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

          {firstValueLoading && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-900">Processing...</p>
                  <p className="mt-1 text-sm text-blue-700">Please wait while we complete your setup.</p>
                </div>
              </div>
            </div>
          )}

          {children}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onPrevious}
              disabled={currentStep === 1 || saving || currentStep === FIRST_VALUE_STEP}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dcc9aa] px-4 py-2.5 text-[#6f5b3e] transition hover:bg-[#f8f1e6] disabled:cursor-not-allowed disabled:opacity-50 sm:justify-start"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {activeStep.skippable && onSkip && currentStep < REVIEW_STEP ? (
                <button
                  type="button"
                  onClick={onSkip}
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#dcc9aa] px-3 py-2.5 text-[#9c7c46] transition hover:bg-[#f8f1e6] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-4"
                >
                  <SkipForward className="h-4 w-4" />
                  <span className="hidden sm:inline">Skip</span>
                </button>
              ) : null}

              {currentStep < REVIEW_STEP ? (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#9c7c46] px-5 py-2.5 text-white transition hover:bg-[#8a6d3e] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving || firstValueLoading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#9c7c46] px-5 py-2.5 text-white transition hover:bg-[#8a6d3e] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {saving || firstValueLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>{submitLabel}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
