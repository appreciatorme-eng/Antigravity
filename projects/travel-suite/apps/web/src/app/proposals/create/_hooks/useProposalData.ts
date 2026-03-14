'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Client, TourTemplate, AddOn, FeatureLimitSnapshot } from '../_types';

import { formatFeatureLimitError } from '@/lib/subscriptions/feature-limit-error';
export { formatFeatureLimitError } from '@/lib/subscriptions/feature-limit-error';

export interface UseProposalDataReturn {
  loading: boolean;
  error: string | null;
  clientsError: string | null;
  clients: Client[];
  templates: TourTemplate[];
  addOns: AddOn[];
  proposalLimit: FeatureLimitSnapshot | null;
  setError: (error: string | null) => void;
  setClientsError: (error: string | null) => void;
  setProposalLimit: React.Dispatch<React.SetStateAction<FeatureLimitSnapshot | null>>;
  loadData: () => Promise<void>;
  loadProposalLimit: (headers?: Record<string, string>) => Promise<FeatureLimitSnapshot | null>;
  addClient: (fullName: string, email: string, phone: string) => Promise<string>;
}

export function useProposalData(): UseProposalDataReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<TourTemplate[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [proposalLimit, setProposalLimit] = useState<FeatureLimitSnapshot | null>(null);

  async function loadProposalLimit(headers?: Record<string, string>): Promise<FeatureLimitSnapshot | null> {
    try {
      const limitsResp = await fetch('/api/subscriptions/limits', {
        headers,
        cache: 'no-store',
      });

      if (!limitsResp.ok) {
        return null;
      }

      const payload = await limitsResp.json();
      const proposals = payload?.limits?.proposals;
      if (!proposals) {
        return null;
      }

      const normalized: FeatureLimitSnapshot = {
        allowed: Boolean(proposals.allowed),
        used: Number(proposals.used || 0),
        limit: proposals.limit === null ? null : Number(proposals.limit || 0),
        remaining: proposals.remaining === null ? null : Number(proposals.remaining || 0),
        resetAt: proposals.resetAt || null,
        tier: String(proposals.tier || 'free'),
        upgradePlan: proposals.upgradePlan ? String(proposals.upgradePlan) : null,
      };
      setProposalLimit(normalized);
      return normalized;
    } catch {
      return null;
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        setError('Organization not found');
        setLoading(false);
        return;
      }

      setClientsError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      await loadProposalLimit(headers);
      const clientsResp = await fetch('/api/admin/clients', { headers });
      if (!clientsResp.ok) {
        const payload = await clientsResp.json().catch(() => ({}));
        console.error('Error loading clients:', payload);
        setClientsError(payload?.error || 'Failed to load clients (check admin permissions)');
        setClients([]);
      } else {
        const payload = await clientsResp.json();
        const clientsData = Array.isArray(payload?.clients)
          ? (payload.clients as Client[])
          : [];
        const formattedClients = clientsData
          .map((client) => ({
            id: client.id,
            full_name: client.full_name || 'Unknown',
            email: client.email || '',
            phone: client.phone || '',
          }))
          .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
        setClients(formattedClients);
      }

      const { data: templatesData, error: templatesError } = await supabase
        .from('tour_templates')
        .select('id, name, destination, duration_days, base_price, hero_image_url')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (templatesError) {
        console.error('Error loading templates:', templatesError);
      } else {
        setTemplates(templatesData || []);
      }

      try {
        const addOnsResp = await fetch('/api/add-ons');
        if (addOnsResp.ok) {
          const payload = await addOnsResp.json();
          const list = Array.isArray(payload?.addOns)
            ? (payload.addOns as AddOn[])
            : [];
          const active = list.filter((a) => a?.is_active !== false);
          setAddOns(active);
        } else {
          console.warn('Add-ons failed to load:', await addOnsResp.text().catch(() => ''));
          setAddOns([]);
        }
      } catch (e) {
        console.warn('Add-ons failed to load:', e);
        setAddOns([]);
      }
    } catch (loadError) {
      console.error('Error loading data:', loadError);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /**
   * Creates a new client and reloads the client list.
   * Returns the new client's userId (or empty string if not returned by API).
   */
  async function addClient(fullName: string, email: string, phone: string): Promise<string> {
    setError(null);
    setClientsError(null);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    const resp = await fetch('/api/admin/clients', {
      method: 'POST',
      headers,
      body: JSON.stringify({ full_name: fullName, email, phone }),
    });

    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('Create client failed:', payload);
      setError(formatFeatureLimitError(payload, payload?.error || 'Failed to create client'));
      throw new Error(payload?.error || 'Failed to create client');
    }

    const userId = String(payload?.userId || '').trim();
    await loadData();
    return userId;
  }

  return {
    loading,
    error,
    clientsError,
    clients,
    templates,
    addOns,
    proposalLimit,
    setError,
    setClientsError,
    setProposalLimit,
    loadData,
    loadProposalLimit,
    addClient,
  };
}
