'use client';

import { useEffect, useRef, useState } from 'react';
import type { Client, WhatsAppProposalDraft } from '../_types';

export interface WhatsAppDraftFormUpdates {
  clientId?: string;
  templateId?: string;
  title?: string;
  tripStartDate?: string;
  tripEndDate?: string;
}

export interface UseWhatsAppDraftOptions {
  whatsappDraftId: string | null;
  clients: Client[];
  onApplyDraft: (updates: WhatsAppDraftFormUpdates) => void;
}

export interface UseWhatsAppDraftReturn {
  loading: boolean;
  draft: WhatsAppProposalDraft | null;
  error: string | null;
  clientQueryOverride: string;
}

export function useWhatsAppDraft({
  whatsappDraftId,
  clients,
  onApplyDraft,
}: UseWhatsAppDraftOptions): UseWhatsAppDraftReturn {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<WhatsAppProposalDraft | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const appliedRef = useRef<string | null>(null);

  const hasDraftId = Boolean(whatsappDraftId);

  // Fetch WhatsApp draft
  useEffect(() => {
    if (!hasDraftId || !whatsappDraftId) {
      return;
    }

    const controller = new AbortController();

    void Promise.resolve()
      .then(() => {
        setLoading(true);
        setFetchError(null);
        return fetch(`/api/whatsapp/proposal-drafts/${encodeURIComponent(whatsappDraftId)}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
      })
      .then((response) =>
        response.json().then((payload) => ({ ok: response.ok, payload })),
      )
      .then(({ ok, payload }) => {
        if (!ok || !payload?.data?.draft) {
          throw new Error(payload?.error || 'Failed to load WhatsApp proposal draft');
        }
        setDraft(payload.data.draft as WhatsAppProposalDraft);
      })
      .catch((draftError) => {
        if (draftError instanceof Error && draftError.name === 'AbortError') {
          return;
        }
        setDraft(null);
        setFetchError(
          draftError instanceof Error
            ? draftError.message
            : 'Failed to load WhatsApp proposal draft',
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [hasDraftId, whatsappDraftId]);

  // Apply draft to form (once per draft)
  useEffect(() => {
    if (!draft || appliedRef.current === draft.id) {
      return;
    }

    const updates: WhatsAppDraftFormUpdates = {};
    if (draft.clientId) updates.clientId = draft.clientId;
    if (draft.templateId) updates.templateId = draft.templateId;
    if (draft.title) updates.title = draft.title;
    if (draft.tripStartDate) updates.tripStartDate = draft.tripStartDate;
    if (draft.tripEndDate) updates.tripEndDate = draft.tripEndDate;

    onApplyDraft(updates);
    appliedRef.current = draft.id;
  }, [draft, onApplyDraft]);

  // Derive client query override from draft + clients (no effect needed)
  const derivedClientQuery = (() => {
    if (!draft?.clientId) return '';
    const draftClient = clients.find((client) => client.id === draft.clientId);
    if (!draftClient) return '';
    const name = draftClient.full_name || 'Unnamed Client';
    const email = draftClient.email ? ` (${draftClient.email})` : '';
    return `${name}${email}`;
  })();

  return {
    loading,
    draft,
    error: fetchError,
    clientQueryOverride: derivedClientQuery,
  };
}
