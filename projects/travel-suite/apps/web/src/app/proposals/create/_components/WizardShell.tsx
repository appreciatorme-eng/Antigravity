'use client';

import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { WizardProgressBar } from './WizardProgressBar';
import { WizardBottomBar } from './WizardBottomBar';
import { WizardReviewCard } from './WizardReviewCard';
import { ClientSelector } from './ClientSelector';
import type { ClientSelectorProps } from './ClientSelector';
import { TemplateSelector } from './TemplateSelector';
import type { TemplateSelectorProps } from './TemplateSelector';
import { AddOnsGrid } from './AddOnsGrid';
import type { AddOnsGridProps } from './AddOnsGrid';
import { ProposalSummary } from './ProposalSummary';
import type { ProposalSummaryProps } from './ProposalSummary';
import type { WizardStepNumber } from '../_hooks/useWizardStep';
import type { Client, TourTemplate, AddOn } from '../_types';

const STEP_HELP: Record<WizardStepNumber, string> = {
  1: 'Choose the client who will receive this proposal.',
  2: 'Pick a tour template and set travel dates.',
  3: 'Add optional extras like vehicles and activities.',
  4: 'Review everything before creating your proposal.',
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction * 200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -200, opacity: 0 }),
};

const slideTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };

interface WizardShellProps {
  // Step state
  currentStep: WizardStepNumber;
  canProceed: (step: WizardStepNumber) => boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: WizardStepNumber) => void;
  // Direction tracking for animations
  direction: 1 | -1;
  // Creating state
  creating: boolean;
  onCreateProposal: () => void;
  // Client step props
  clientSelectorProps: ClientSelectorProps;
  // Template step props
  templateSelectorProps: TemplateSelectorProps;
  // AddOns step props
  addOnsGridProps: AddOnsGridProps;
  // Summary step props
  proposalSummaryProps: ProposalSummaryProps;
  // Review card data
  selectedClient: Client | null;
  selectedTemplate: TourTemplate | null;
  selectedAddOnIds: ReadonlySet<string>;
  addOns: readonly AddOn[];
  selectedVehicleId: string;
  tripStartDate: string;
  tripEndDate: string;
  proposalTitle: string;
  expirationDays: number;
  estimatedTotal: number;
  // Whether add-ons exist (for auto-skip)
  hasAddOns: boolean;
}

export function WizardShell({
  currentStep,
  canProceed,
  nextStep,
  prevStep,
  goToStep,
  direction,
  creating,
  onCreateProposal,
  clientSelectorProps,
  templateSelectorProps,
  addOnsGridProps,
  proposalSummaryProps,
  selectedClient,
  selectedTemplate,
  selectedAddOnIds,
  addOns,
  selectedVehicleId,
  tripStartDate,
  tripEndDate,
  proposalTitle,
  expirationDays,
  estimatedTotal,
  hasAddOns,
}: WizardShellProps) {
  const handleSkipExtras = useCallback(() => {
    goToStep(4);
  }, [goToStep]);

  const handleEditStep = useCallback(
    (step: WizardStepNumber) => {
      goToStep(step);
    },
    [goToStep],
  );

  const canProceedCurrent = useMemo(
    () => canProceed(currentStep),
    [canProceed, currentStep],
  );

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/proposals"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          aria-label="Back to proposals"
        >
          <ArrowLeft className="w-5 h-5 text-[#6f5b3e]" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-[var(--font-display)] text-[#1b140a] truncate">
            New Proposal
          </h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <WizardProgressBar currentStep={currentStep} onStepClick={goToStep} />
      </div>

      {/* Contextual help */}
      <p className="text-sm text-[#6f5b3e] mb-6 px-1">
        {STEP_HELP[currentStep]}
      </p>

      {/* Step content with slide transitions */}
      <div className="relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
          >
            {currentStep === 1 && <ClientSelector {...clientSelectorProps} />}
            {currentStep === 2 && <TemplateSelector {...templateSelectorProps} />}
            {currentStep === 3 && <AddOnsGrid {...addOnsGridProps} />}
            {currentStep === 4 && (
              <div className="space-y-6">
                <ProposalSummary {...proposalSummaryProps} />
                <WizardReviewCard
                  client={selectedClient}
                  template={selectedTemplate}
                  selectedAddOnIds={selectedAddOnIds}
                  addOns={addOns as AddOn[]}
                  selectedVehicleId={selectedVehicleId}
                  tripStartDate={tripStartDate}
                  tripEndDate={tripEndDate}
                  proposalTitle={proposalTitle}
                  expirationDays={expirationDays}
                  estimatedTotal={estimatedTotal}
                  onEditStep={handleEditStep}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <WizardBottomBar
        currentStep={currentStep}
        canProceed={canProceedCurrent}
        creating={creating}
        onNext={nextStep}
        onBack={prevStep}
        onSkip={currentStep === 3 && hasAddOns ? handleSkipExtras : undefined}
        onCreateProposal={onCreateProposal}
      />
    </div>
  );
}
