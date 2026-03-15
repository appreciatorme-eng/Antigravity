'use client';

import { useEffect, useMemo, useState } from 'react';
import { logError } from "@/lib/observability/logger";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type BroadcastTarget = 'all_clients' | 'all_drivers' | 'active_trips' | 'custom';

export interface BroadcastContact {
  id: string;
  name: string;
  phone: string;
  lastSeenAt: string | null;
}

interface AudiencePayload {
  data?: {
    counts?: Partial<Record<BroadcastTarget, number>>;
    contacts?: BroadcastContact[];
    canSend?: boolean;
    connectionStatus?: string;
  };
  error?: string;
}

const EMPTY_COUNTS: Record<BroadcastTarget, number> = {
  all_clients: 0,
  all_drivers: 0,
  active_trips: 0,
  custom: 0,
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export interface UseBroadcastAudienceResult {
  contacts: BroadcastContact[];
  audienceCounts: Record<BroadcastTarget, number>;
  broadcastReady: boolean;
  audiencesLoading: boolean;
  audienceError: string | null;
  recipientSearch: string;
  setRecipientSearch: (value: string) => void;
  selectedRecipients: string[];
  setSelectedRecipients: React.Dispatch<React.SetStateAction<string[]>>;
  filteredContacts: BroadcastContact[];
}

export function useBroadcastAudience(): UseBroadcastAudienceResult {
  const [contacts, setContacts] = useState<BroadcastContact[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [audienceCounts, setAudienceCounts] = useState<Record<BroadcastTarget, number>>(EMPTY_COUNTS);
  const [broadcastReady, setBroadcastReady] = useState(false);
  const [audiencesLoading, setAudiencesLoading] = useState(true);
  const [audienceError, setAudienceError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAudiences = async () => {
      try {
        setAudiencesLoading(true);
        const response = await fetch('/api/whatsapp/broadcast', {
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as AudiencePayload | null;

        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error || 'Unable to load WhatsApp audiences');
        }

        if (!isMounted) return;

        setAudienceCounts({
          all_clients: payload.data.counts?.all_clients ?? 0,
          all_drivers: payload.data.counts?.all_drivers ?? 0,
          active_trips: payload.data.counts?.active_trips ?? 0,
          custom: payload.data.counts?.custom ?? 0,
        });
        setContacts(payload.data.contacts ?? []);
        setBroadcastReady(Boolean(payload.data.canSend));
        setAudienceError(
          payload.data.canSend
            ? null
            : 'WhatsApp is not connected. Reconnect the session in Settings before sending a broadcast.',
        );
      } catch (error) {
        logError('Failed to load broadcast audiences', error);
        if (!isMounted) return;
        setAudienceError(
          error instanceof Error ? error.message : 'Unable to load WhatsApp audiences',
        );
      } finally {
        if (isMounted) {
          setAudiencesLoading(false);
        }
      }
    };

    void loadAudiences();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const query = recipientSearch.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) || contact.phone.includes(query),
    );
  }, [contacts, recipientSearch]);

  return {
    contacts,
    audienceCounts,
    broadcastReady,
    audiencesLoading,
    audienceError,
    recipientSearch,
    setRecipientSearch,
    selectedRecipients,
    setSelectedRecipients,
    filteredContacts,
  };
}
