'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { ClientSelector } from './_components/ClientSelector';
import { TemplateSelector } from './_components/TemplateSelector';
import { AddOnsGrid } from './_components/AddOnsGrid';
import { ProposalSummary } from './_components/ProposalSummary';
import { WhatsAppDraftBanner } from './_components/WhatsAppDraftBanner';
import { ProposalLimitBanner } from './_components/ProposalLimitBanner';
import { CreateProposalActions } from './_components/CreateProposalActions';
import { useProposalData } from './_hooks/useProposalData';
import { useWhatsAppDraft } from './_hooks/useWhatsAppDraft';
import { useAvailabilityCheck } from './_hooks/useAvailabilityCheck';
import { usePricingSuggestion } from './_hooks/usePricingSuggestion';
import { useCreateProposal } from './_hooks/useCreateProposal';
import type { AddOn } from './_types';

export default function CreateProposalPage() {
  const searchParams = useSearchParams();
  const whatsappDraftId = searchParams.get('whatsappDraft');

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

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [expirationDays, setExpirationDays] = useState(14);
  const [sendEmail, setSendEmail] = useState(true);
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());

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
    proposalTitle,
    expirationDays,
    sendEmail,
    selectedVehicleId,
    selectedAddOnIds,
    tripStartDate,
    tripEndDate,
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

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedExtrasTotal = computeExtrasTotal(addOns, selectedAddOnIds, selectedVehicleId);
  const estimatedTotal = (selectedTemplate?.base_price || 0) + selectedExtrasTotal;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/proposals"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-[var(--font-display)] text-[#1b140a]">
            Create New Proposal
          </h1>
          <p className="text-sm text-[#6f5b3e]">
            Select a client and template to create an interactive proposal
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <ProposalLimitBanner proposalLimit={proposalLimit} />

      <WhatsAppDraftBanner loading={loadingWhatsAppDraft} draft={whatsappDraft} />

      <ClientSelector
        clients={clients}
        selectedClientId={selectedClientId}
        clientsError={clientsError}
        onSelectClient={handleSelectClient}
        onClearClient={() => setSelectedClientId('')}
        onAddClient={handleAddClient}
        onRefresh={loadData}
        initialQuery={clientQueryOverride}
      />

      <TemplateSelector
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        onTripStartDateChange={setTripStartDate}
        onTripEndDateChange={setTripEndDate}
        availabilityConflicts={availability.conflicts}
        availabilityLoading={availability.loading}
        availabilityOverrideAccepted={availability.overrideAccepted}
        onAvailabilityOverride={availability.acceptOverride}
        pricingSuggestion={pricing.suggestion}
        pricingSuggestionLoading={pricing.loading}
      />

      <AddOnsGrid
        addOns={addOns}
        selectedVehicleId={selectedVehicleId}
        selectedAddOnIds={selectedAddOnIds}
        onSelectVehicle={setSelectedVehicleId}
        onToggleAddOn={(id, checked) => {
          setSelectedAddOnIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
          });
        }}
        estimatedTotal={estimatedTotal}
      />

      <ProposalSummary
        proposalTitle={proposalTitle}
        expirationDays={expirationDays}
        sendEmail={sendEmail}
        onTitleChange={setProposalTitle}
        onExpirationChange={setExpirationDays}
        onEmailToggle={setSendEmail}
      />

      <CreateProposalActions
        creating={creating}
        disabled={creating || !selectedClientId || !selectedTemplateId}
        onCreateProposal={handleCreateProposal}
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
