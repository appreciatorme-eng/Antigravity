'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '@/lib/api/authed-fetch';
import { useAnalytics } from '@/lib/analytics/events';
import { useToast } from '@/components/ui/toast';
import type { FeatureLimitSnapshot } from '../_types';
import { formatFeatureLimitError } from './useProposalData';

export interface CreateProposalParams {
  readonly selectedClientId: string;
  readonly selectedTemplateId: string;
  readonly itineraryId?: string;
  readonly proposalTitle: string;
  readonly expirationDays: number;
  readonly sendEmail: boolean;
  readonly selectedVehicleId: string;
  readonly selectedAddOnIds: ReadonlySet<string>;
  readonly tripStartDate: string;
  readonly tripEndDate: string;
  readonly availabilityConflicts: readonly { id: string }[];
  readonly availabilityOverrideAccepted: boolean;
  readonly proposalLimit: FeatureLimitSnapshot | null;
  readonly loadProposalLimit: () => Promise<FeatureLimitSnapshot | null>;
  readonly setError: (error: string | null) => void;
  readonly setProposalLimit: React.Dispatch<React.SetStateAction<FeatureLimitSnapshot | null>>;
}

export interface UseCreateProposalReturn {
  readonly creating: boolean;
  readonly handleCreateProposal: () => Promise<void>;
}

export function useCreateProposal(params: CreateProposalParams): UseCreateProposalReturn {
  const router = useRouter();
  const { toast } = useToast();
  const analytics = useAnalytics();
  const [creating, setCreating] = useState(false);

  async function handleCreateProposal() {
    const {
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
      availabilityConflicts,
      availabilityOverrideAccepted,
      proposalLimit,
      loadProposalLimit,
      setError,
      setProposalLimit,
    } = params;

    const hasTemplate = selectedTemplateId.length > 0;
    const hasItinerary = Boolean(itineraryId);

    if (!selectedClientId || (!hasTemplate && !hasItinerary)) {
      toast({
        title: 'Selection required',
        description: hasItinerary
          ? 'Please select a client.'
          : 'Please select both a client and a template.',
        variant: 'warning',
      });
      return;
    }

    if (
      tripStartDate &&
      tripEndDate &&
      availabilityConflicts.length > 0 &&
      !availabilityOverrideAccepted
    ) {
      const message =
        'These dates overlap with a blocked period. Unblock them or continue with an explicit override.';
      setError(message);
      toast({
        title: 'Blocked dates detected',
        description: message,
        variant: 'warning',
      });
      return;
    }

    const freshLimit = await loadProposalLimit();
    const effectiveLimit = freshLimit || proposalLimit;
    if (effectiveLimit && !effectiveLimit.allowed) {
      const limitText =
        effectiveLimit.limit !== null
          ? `${effectiveLimit.used}/${effectiveLimit.limit}`
          : `${effectiveLimit.used}`;
      const message = `Proposal limit reached (${limitText}). Upgrade in Billing to continue creating proposals.`;
      setError(message);
      toast({
        title: 'Limit reached',
        description: message,
        variant: 'warning',
      });
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      const useItineraryPath = hasItinerary;
      const endpoint = useItineraryPath
        ? '/api/admin/proposals/create-from-itinerary'
        : '/api/proposals/create';

      const requestBody = useItineraryPath
        ? {
            itineraryId,
            clientId: selectedClientId,
            proposalTitle: proposalTitle || undefined,
            expirationDays,
            selectedVehicleId: selectedVehicleId || null,
            selectedAddOnIds: Array.from(selectedAddOnIds),
          }
        : {
            templateId: selectedTemplateId,
            clientId: selectedClientId,
            proposalTitle: proposalTitle || undefined,
            expirationDays,
            selectedVehicleId: selectedVehicleId || null,
            selectedAddOnIds: Array.from(selectedAddOnIds),
          };

      let response: Response;
      try {
        response = await authedFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(requestBody),
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const payload = await response.json().catch((parseError: unknown) => {
        console.error(`Failed to parse JSON response from ${endpoint}`, parseError);
        return {};
      });
      const payloadData = payload?.data ?? null;
      if (!response.ok) {
        const message = formatFeatureLimitError(
          payload,
          payload?.error || 'Failed to create proposal. Please try again.'
        );
        setError(message);
        if (payload?.code === 'FEATURE_LIMIT_EXCEEDED') {
          setProposalLimit((prev) => ({
            allowed: false,
            used: Number(payload?.used || prev?.used || 0),
            limit: payload?.limit === null ? null : Number(payload?.limit || prev?.limit || 0),
            remaining:
              payload?.remaining === null
                ? null
                : Number(payload?.remaining || prev?.remaining || 0),
            resetAt: payload?.reset_at || prev?.resetAt || null,
            tier: String(payload?.tier || prev?.tier || 'free'),
            upgradePlan: payload?.upgrade_plan ? String(payload.upgrade_plan) : prev?.upgradePlan || null,
          }));
        }
        return;
      }

      if (payloadData?.limit) {
        setProposalLimit({
          allowed: Boolean(payloadData.limit.allowed),
          used: Number(payloadData.limit.used || 0),
          limit:
            payloadData.limit.limit === null
              ? null
              : Number(payloadData.limit.limit || 0),
          remaining:
            payloadData.limit.remaining === null
              ? null
              : Number(payloadData.limit.remaining || 0),
          resetAt: payloadData.limit.resetAt || null,
          tier: String(payloadData.limit.tier || 'free'),
          upgradePlan: payloadData.limit.upgradePlan
            ? String(payloadData.limit.upgradePlan)
            : null,
        });
      }

      const proposalId = String(payloadData?.proposalId || '').trim();
      if (!proposalId) {
        setError('Proposal created but no proposal id was returned.');
        return;
      }

      analytics.proposalCreated(proposalId, Number(payloadData?.amount || 0));

      if (sendEmail) {
        const sendResponse = await authedFetch(`/api/proposals/${proposalId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!sendResponse.ok) {
          const sendPayload = await sendResponse.json().catch((parseError: unknown) => {
            console.error('Failed to parse JSON response from proposal send endpoint', parseError);
            return {};
          });
          console.warn('Proposal created but notification failed:', sendPayload?.error || sendPayload);
        }
      }

      toast({ title: 'Success', description: 'Proposal initialized successfully.', variant: 'success' });
      router.push(`/proposals/${proposalId}`);
    } catch (error) {
      console.error('Error creating proposal:', error);
      setError('An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  }

  return { creating, handleCreateProposal };
}
