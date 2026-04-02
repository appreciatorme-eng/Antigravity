'use client';

import { Check } from 'lucide-react';
import type { WizardStepNumber } from '../_hooks/useWizardStep';

const STEPS: { label: string; step: WizardStepNumber }[] = [
  { label: 'Client', step: 1 },
  { label: 'Template', step: 2 },
  { label: 'Extras', step: 3 },
  { label: 'Review', step: 4 },
];

interface WizardProgressBarProps {
  currentStep: WizardStepNumber;
  onStepClick?: (step: WizardStepNumber) => void;
}

export function WizardProgressBar({ currentStep, onStepClick }: WizardProgressBarProps) {
  return (
    <div className="w-full px-2">
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {STEPS.map(({ label, step }, idx) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step)}
                disabled={!isClickable}
                className={`flex flex-col items-center gap-1.5 min-w-0 ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
                aria-label={`Step ${step}: ${label}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors shrink-0 ${
                    isCompleted
                      ? 'bg-[#9c7c46] text-white'
                      : isCurrent
                        ? 'bg-[#9c7c46] text-white ring-2 ring-[#9c7c46]/30 ring-offset-2 ring-offset-white'
                        : 'bg-[#eadfcd] text-[#6f5b3e]'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step}
                </div>
                <span
                  className={`text-xs font-medium truncate max-w-[60px] text-center ${
                    isCurrent
                      ? 'text-[#1b140a]'
                      : isCompleted
                        ? 'text-[#9c7c46]'
                        : 'text-[#bda87f]'
                  }`}
                >
                  {label}
                </span>
              </button>

              {/* Connector line (not after last step) */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-2 mt-[-18px]">
                  <div
                    className={`h-0.5 w-full rounded-full transition-colors ${
                      step < currentStep ? 'bg-[#9c7c46]' : 'bg-[#eadfcd]'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
