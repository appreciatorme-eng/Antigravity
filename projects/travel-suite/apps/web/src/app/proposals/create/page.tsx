'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { WizardShell } from './_components/WizardShell';
import { WhatsAppDraftBanner } from './_components/WhatsAppDraftBanner';
import { ProposalLimitBanner } from './_components/ProposalLimitBanner';
import { useProposalData } from './_hooks/useProposalData';
import { useWhatsAppDraft } from './_hooks/useWhatsAppDraft';
import { useAvailabilityCheck } from './_hooks/useAvailabilityCheck';
import { usePricingSuggestion } from './_hooks/usePricingSuggestion';
import { useCreateProposal } from './_hooks/useCreateProposal';
import { useWizardStep } from './_hooks/useWizardStep';
import type { WizardStepNumber } from './_hooks/useWizardStep';
import type { AddOn } from './_types';
import type { ItineraryInfo } from './_components/WizardShell';
import { authedFetch } from '@/lib/api/authed-fetch';

export default function CreateProposalPage() {
  const searchParams = useSearchParams();
  const whatsappDraftId = searchParams.get('whatsappDraft');
  const prefilledClientId = searchParams.get('clientId');
  const prefilledTitle = searchParams.get('title');
  const itineraryId = searchParams.get('itineraryId') || undefined;
  const [itineraryInfo, setItineraryInfo] = useState<ItineraryInfo | null>(null);

  // Load itinerary metadata when itineraryId is present
  useEffect(() => {
    if (!itineraryId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`/api/itineraries/${itineraryId}`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const d = json?.itinerary ?? json?.data ?? json;
        if (!cancelled) {
          setItineraryInfo({
            title: d.trip_title || d.title || prefilledTitle || 'Untitled',
            destination: d.destination || null,
            duration_days: d.duration_days || null,
          });
        }
      } catch {
        // Best-effort — itinerary info is for display only
      }
    })();
    return () => { cancelled = true; };
  }, [itineraryId, prefilledTitle]);

  const {
    loading,
    error,
    clientsError,
    clients,
    templates,
    addOns,
    proposalLimit,
    setError,
    setProposalLimit,
    loadData,
    loadProposalLimit,
    addClient,
  } = useProposalData();

  const [selectedClientId, setSelectedClientId] = useState<string>(prefilledClientId || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [proposalTitle, setProposalTitle] = useState(prefilledTitle || '');
  const [expirationDays, setExpirationDays] = useState(14);
  const [sendEmail, setSendEmail] = useState(true);
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());
  const [basePrice, setBasePrice] = useState<number>(0);

  // Direction tracking for slide animations
  const directionRef = useRef<1 | -1>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Wizard step hook — start at step 3 if itinerary flow, step 2 if client pre-filled
  const initialStep: WizardStepNumber = itineraryId && prefilledClientId ? 3 : prefilledClientId ? 2 : 1;
  const {
    currentStep,
    nextStep: rawNextStep,
    prevStep: rawPrevStep,
    goToStep: rawGoToStep,
    canProceed,
  } = useWizardStep({
    selectedClientId,
    selectedTemplateId,
    itineraryId,
    initialStep,
  });

  // Wrap step navigation to track direction
  const nextStep = useCallback(() => {
    directionRef.current = 1;
    setDirection(1);
    rawNextStep();
  }, [rawNextStep]);

  const prevStep = useCallback(() => {
    directionRef.current = -1;
    setDirection(-1);
    rawPrevStep();
  }, [rawPrevStep]);

  const goToStep = useCallback(
    (step: WizardStepNumber) => {
      directionRef.current = step > currentStep ? 1 : -1;
      setDirection(directionRef.current);
      rawGoToStep(step);
    },
    [rawGoToStep, currentStep],
  );

  const handleApplyDraft = useCallback(
    (updates: { clientId?: string; templateId?: string; title?: string; tripStartDate?: string; tripEndDate?: string }) => {
      if (updates.clientId) setSelectedClientId(updates.clientId);
      if (updates.templateId) setSelectedTemplateId((current) => current || updates.templateId || '');
      if (updates.title) setProposalTitle((current) => current || updates.title || '');
      if (updates.tripStartDate) setTripStartDate((current) => current || updates.tripStartDate || '');
      if (updates.tripEndDate) setTripEndDate((current) => current || updates.tripEndDate || '');
    },
    [],
  );

  const {
    loading: loadingWhatsAppDraft,
    draft: whatsappDraft,
    clientQueryOverride,
  } = useWhatsAppDraft({
    whatsappDraftId,
    clients,
    onApplyDraft: handleApplyDraft,
  });

  const availability = useAvailabilityCheck(tripStartDate, tripEndDate);
  const pricing = usePricingSuggestion(selectedTemplateId, templates);

  const { creating, handleCreateProposal } = useCreateProposal({
    selectedClientId,
    selectedTemplateId,
    itineraryId,
    proposalTitle,
    expirationDays,
    sendEmail,
    selectedVehicleId,
    selectedAddOnIds,
    tripStartDate,
    tripEndDate,
    basePrice,
    availabilityConflicts: availability.conflicts,
    availabilityOverrideAccepted: availability.overrideAccepted,
    proposalLimit,
    loadProposalLimit,
    setError,
    setProposalLimit,
  });

  // Auto-generate title when both client and template are selected
  const maybeAutoTitle = useCallback(
    (clientId: string, templateId: string) => {
      if (!clientId || !templateId) return;
      setProposalTitle((current) => {
        if (current) return current;
        const client = clients.find((c) => c.id === clientId);
        const template = templates.find((t) => t.id === templateId);
        if (!client || !template) return current;
        return `${template.name} - ${client.full_name || 'Client'}`;
      });
    },
    [clients, templates],
  );

  const handleSelectClient = useCallback(
    (clientId: string) => {
      setSelectedClientId(clientId);
      maybeAutoTitle(clientId, selectedTemplateId);
    },
    [selectedTemplateId, maybeAutoTitle],
  );

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
      maybeAutoTitle(selectedClientId, templateId);
    },
    [selectedClientId, maybeAutoTitle],
  );

  async function handleAddClient(fullName: string, email: string, phone: string) {
    const userId = await addClient(fullName, email, phone);
    if (userId) {
      setSelectedClientId(userId);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#9c7c46] animate-spin mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const selectedExtrasTotal = computeExtrasTotal(addOns, selectedAddOnIds, selectedVehicleId);
  const templateBasePrice = selectedTemplate?.base_price || 0;
  const effectiveBasePrice = basePrice || templateBasePrice;
  const estimatedTotal = effectiveBasePrice + selectedExtrasTotal;

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <ProposalLimitBanner proposalLimit={proposalLimit} />

      <WhatsAppDraftBanner loading={loadingWhatsAppDraft} draft={whatsappDraft} />

      <WizardShell
        currentStep={currentStep}
        canProceed={canProceed}
        nextStep={nextStep}
        prevStep={prevStep}
        goToStep={goToStep}
        direction={direction}
        creating={creating}
        onCreateProposal={handleCreateProposal}
        itineraryInfo={itineraryInfo}
        clientSelectorProps={{
          clients,
          selectedClientId,
          clientsError,
          onSelectClient: handleSelectClient,
          onClearClient: () => setSelectedClientId(''),
          onAddClient: handleAddClient,
          onRefresh: loadData,
          initialQuery: clientQueryOverride,
        }}
        templateSelectorProps={{
          templates,
          selectedTemplateId,
          onSelectTemplate: handleSelectTemplate,
          tripStartDate,
          tripEndDate,
          onTripStartDateChange: setTripStartDate,
          onTripEndDateChange: setTripEndDate,
          availabilityConflicts: availability.conflicts,
          availabilityLoading: availability.loading,
          availabilityOverrideAccepted: availability.overrideAccepted,
          onAvailabilityOverride: availability.acceptOverride,
          pricingSuggestion: pricing.suggestion,
          pricingSuggestionLoading: pricing.loading,
        }}
        addOnsGridProps={{
          addOns,
          selectedVehicleId,
          selectedAddOnIds,
          onSelectVehicle: setSelectedVehicleId,
          onToggleAddOn: (id, checked) => {
            setSelectedAddOnIds((prev) => {
              const next = new Set(prev);
              if (checked) next.add(id);
              else next.delete(id);
              return next;
            });
          },
          estimatedTotal,
        }}
        proposalSummaryProps={{
          proposalTitle,
          expirationDays,
          sendEmail,
          onTitleChange: setProposalTitle,
          onExpirationChange: setExpirationDays,
          onEmailToggle: setSendEmail,
        }}
        selectedClient={selectedClient}
        selectedTemplate={selectedTemplate}
        selectedAddOnIds={selectedAddOnIds}
        addOns={addOns}
        selectedVehicleId={selectedVehicleId}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        proposalTitle={proposalTitle}
        expirationDays={expirationDays}
        estimatedTotal={estimatedTotal}
        hasAddOns={addOns.length > 0}
        basePrice={basePrice}
        onBasePriceChange={setBasePrice}
      />
    </div>
  );
}

/** Compute the total price of selected extras (vehicle + add-ons). */
function computeExtrasTotal(
  addOns: readonly Pick<AddOn, 'id' | 'price'>[],
  selectedAddOnIds: ReadonlySet<string>,
  selectedVehicleId: string,
): number {
  const ids = new Set<string>(selectedAddOnIds);
  if (selectedVehicleId) ids.add(selectedVehicleId);
  let total = 0;
  for (const id of ids) {
    const addon = addOns.find((x) => x.id === id);
    if (addon) total += Number(addon.price) || 0;
  }
  return total;
}
