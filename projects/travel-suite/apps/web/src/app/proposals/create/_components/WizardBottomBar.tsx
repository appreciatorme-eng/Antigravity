'use client';

import { ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';
import type { WizardStepNumber } from '../_hooks/useWizardStep';

interface WizardBottomBarProps {
  currentStep: WizardStepNumber;
  canProceed: boolean;
  creating: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  onCreateProposal: () => void;
}

export function WizardBottomBar({
  currentStep,
  canProceed,
  creating,
  onNext,
  onBack,
  onSkip,
  onCreateProposal,
}: WizardBottomBarProps) {
  const isFirstStep = currentStep === 1;
  const isFinalStep = currentStep === 4;
  const isExtrasStep = currentStep === 3;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#eadfcd] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
        {/* Left: Back button */}
        <div className="min-w-[80px]">
          {!isFirstStep && (
            <button
              type="button"
              onClick={onBack}
              disabled={creating}
              className="inline-flex items-center gap-1.5 h-12 px-4 text-[#6f5b3e] border border-[#eadfcd] rounded-xl hover:bg-[#f8f1e6] transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}
        </div>

        {/* Center: Skip (only on step 3) */}
        <div className="flex-1 flex justify-center">
          {isExtrasStep && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-[#6f5b3e] hover:text-[#1b140a] underline-offset-2 hover:underline transition-colors h-12 flex items-center"
            >
              Skip extras
            </button>
          )}
        </div>

        {/* Right: Next or Create */}
        <div className="min-w-[80px] flex justify-end">
          {isFinalStep ? (
            <button
              type="button"
              onClick={onCreateProposal}
              disabled={creating || !canProceed}
              className="inline-flex items-center gap-2 h-12 px-6 bg-[#9c7c46] text-white rounded-xl hover:bg-[#8a6d3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Create Proposal
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={!canProceed}
              className="inline-flex items-center gap-1.5 h-12 px-6 bg-[#9c7c46] text-white rounded-xl hover:bg-[#8a6d3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
