'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAnalytics } from '@/lib/analytics/events';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getOverlappingAvailability,
  type OperatorUnavailability,
} from '@/features/calendar/availability';
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassCard } from '@/components/glass/GlassCard';
import type {
  Client,
  TourTemplate,
  AddOn,
  FeatureLimitSnapshot,
  PricingSuggestion,
  WhatsAppProposalDraft,
} from './_types';
import { ClientSelector } from './_components/ClientSelector';
import { TemplateSelector } from './_components/TemplateSelector';
import { AddOnsGrid } from './_components/AddOnsGrid';
import { ProposalSummary } from './_components/ProposalSummary';

function formatFeatureLimitError(payload: any, fallback: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (payload?.code !== 'FEATURE_LIMIT_EXCEEDED') {
    return fallback;
  }

  const limit = Number(payload?.limit || 0);
  const used = Number(payload?.used || 0);
  const feature = String(payload?.feature || 'usage');
  if (limit > 0) {
    return `Limit reached for ${feature}: ${used}/${limit}. Upgrade in Billing to continue.`;
  }
  return payload?.error || fallback;
}

export default function CreateProposalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const analytics = useAnalytics();
  const whatsappDraftId = searchParams.get('whatsappDraft');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [loadingWhatsAppDraft, setLoadingWhatsAppDraft] = useState(false);
  const [whatsappDraft, setWhatsAppDraft] = useState<WhatsAppProposalDraft | null>(null);
  const appliedWhatsAppDraftRef = useRef<string | null>(null);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [expirationDays, setExpirationDays] = useState(14);
  const [sendEmail, setSendEmail] = useState(true);
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [availabilityConflicts, setAvailabilityConflicts] = useState<OperatorUnavailability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityOverrideAccepted, setAvailabilityOverrideAccepted] = useState(false);

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<TourTemplate[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);

  // Client picker query (for WhatsApp draft pre-fill)
  const [clientQueryOverride, setClientQueryOverride] = useState('');

  // Proposal options state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());
  const [proposalLimit, setProposalLimit] = useState<FeatureLimitSnapshot | null>(null);
  const [pricingSuggestion, setPricingSuggestion] = useState<PricingSuggestion | null>(null);
  const [pricingSuggestionLoading, setPricingSuggestionLoading] = useState(false);

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

      // Load clients (admin API avoids RLS join edge cases)
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

      // Load templates
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

      // Load add-ons (vehicle + upgrades)
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
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!whatsappDraftId) {
      setWhatsAppDraft(null);
      appliedWhatsAppDraftRef.current = null;
      return;
    }

    const controller = new AbortController();
    setLoadingWhatsAppDraft(true);

    fetch(`/api/whatsapp/proposal-drafts/${encodeURIComponent(whatsappDraftId)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((response) =>
        response.json().then((payload) => ({ ok: response.ok, payload })),
      )
      .then(({ ok, payload }) => {
        if (!ok || !payload?.data?.draft) {
          throw new Error(payload?.error || 'Failed to load WhatsApp proposal draft');
        }
        setWhatsAppDraft(payload.data.draft as WhatsAppProposalDraft);
      })
      .catch((draftError) => {
        if (draftError instanceof Error && draftError.name === 'AbortError') {
          return;
        }
        setWhatsAppDraft(null);
        setError(
          draftError instanceof Error
            ? draftError.message
            : 'Failed to load WhatsApp proposal draft',
        );
      })
      .finally(() => setLoadingWhatsAppDraft(false));

    return () => controller.abort();
  }, [whatsappDraftId]);

  useEffect(() => {
    if (!whatsappDraft || appliedWhatsAppDraftRef.current === whatsappDraft.id) {
      return;
    }

    if (whatsappDraft.clientId) {
      setSelectedClientId(whatsappDraft.clientId);
    }
    if (whatsappDraft.templateId) {
      setSelectedTemplateId((current) => current || whatsappDraft.templateId || '');
    }
    if (whatsappDraft.title) {
      setProposalTitle((current) => current || whatsappDraft.title);
    }
    if (whatsappDraft.tripStartDate) {
      setTripStartDate((current) => current || whatsappDraft.tripStartDate || '');
    }
    if (whatsappDraft.tripEndDate) {
      setTripEndDate((current) => current || whatsappDraft.tripEndDate || '');
    }

    appliedWhatsAppDraftRef.current = whatsappDraft.id;
  }, [whatsappDraft]);

  useEffect(() => {
    if (!whatsappDraft?.clientId) {
      return;
    }

    const draftClient = clients.find((client) => client.id === whatsappDraft.clientId);
    if (!draftClient) {
      return;
    }

    const name = draftClient.full_name || 'Unnamed Client';
    const email = draftClient.email ? ` (${draftClient.email})` : '';
    setClientQueryOverride((current) => current || `${name}${email}`);
  }, [clients, whatsappDraft?.clientId]);

  useEffect(() => {
    const template = templates.find((item) => item.id === selectedTemplateId);

    if (!template?.destination || !template.duration_days) {
      setPricingSuggestion(null);
      setPricingSuggestionLoading(false);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      destination: template.destination,
      durationDays: String(template.duration_days),
      pax: "2",
    });

    setPricingSuggestionLoading(true);

    fetch(`/api/ai/pricing-suggestion?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((response) => response.json().then((payload) => ({ ok: response.ok, payload })))
      .then(({ ok, payload }) => {
        if (!ok) {
          throw new Error(payload?.error || 'Failed to load pricing guidance');
        }
        setPricingSuggestion(payload?.data ?? null);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        setPricingSuggestion(null);
      })
      .finally(() => setPricingSuggestionLoading(false));

    return () => controller.abort();
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (!tripStartDate || !tripEndDate) {
      setAvailabilityConflicts([]);
      setAvailabilityLoading(false);
      setAvailabilityOverrideAccepted(false);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      from: tripStartDate,
      to: tripEndDate,
    });

    setAvailabilityLoading(true);
    setAvailabilityOverrideAccepted(false);

    fetch(`/api/availability?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((response) =>
        response.json().then((payload) => ({ ok: response.ok, payload })),
      )
      .then(({ ok, payload }) => {
        if (!ok) {
          throw new Error(payload?.error || 'Failed to check availability');
        }
        const rows = Array.isArray(payload?.data)
          ? (payload.data as OperatorUnavailability[])
          : [];
        setAvailabilityConflicts(
          getOverlappingAvailability(rows, tripStartDate, tripEndDate),
        );
      })
      .catch((fetchError) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return;
        }
        console.error('Availability check failed:', fetchError);
        setAvailabilityConflicts([]);
      })
      .finally(() => setAvailabilityLoading(false));

    return () => controller.abort();
  }, [tripStartDate, tripEndDate]);

  async function loadProposalLimit(headers?: Record<string, string>) {
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

  async function handleAddClient(fullName: string, email: string, phone: string) {
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

    if (userId) {
      setSelectedClientId(userId);
    }
  }

  async function handleCreateProposal() {
    if (!selectedClientId || !selectedTemplateId) {
      toast({
        title: 'Selection required',
        description: 'Please select both a client and a template.',
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
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/proposals/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateId: selectedTemplateId,
          clientId: selectedClientId,
          proposalTitle: proposalTitle || undefined,
          expirationDays,
          selectedVehicleId: selectedVehicleId || null,
          selectedAddOnIds: Array.from(selectedAddOnIds),
        }),
      });

      const payload = await response.json().catch(() => ({}));
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
        const sendResponse = await fetch(`/api/proposals/${proposalId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!sendResponse.ok) {
          const sendPayload = await sendResponse.json().catch(() => ({}));
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

  // Auto-generate title when client and template are selected
  useEffect(() => {
    if (selectedClientId && selectedTemplateId && !proposalTitle) {
      const client = clients.find((c) => c.id === selectedClientId);
      const template = templates.find((t) => t.id === selectedTemplateId);

      if (client && template) {
        const generatedTitle = `${template.name} - ${client.full_name || 'Client'}`;
        setProposalTitle(generatedTitle);
      }
    }
  }, [selectedClientId, selectedTemplateId, clients, templates, proposalTitle]);

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
  const selectedExtrasTotal = (() => {
    const ids = new Set<string>(selectedAddOnIds);
    if (selectedVehicleId) ids.add(selectedVehicleId);
    let total = 0;
    for (const id of ids) {
      const a = addOns.find((x) => x.id === id);
      if (a) total += Number(a.price) || 0;
    }
    return total;
  })();
  const estimatedTotal = (selectedTemplate?.base_price || 0) + selectedExtrasTotal;
  const visibleProposalLimit =
    proposalLimit && proposalLimit.limit !== null ? proposalLimit : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {visibleProposalLimit && (
        <div
          className={`rounded-lg border p-4 flex items-center justify-between gap-3 ${visibleProposalLimit.allowed
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
            }`}
        >
          <div>
            <p
              className={`text-sm font-medium ${visibleProposalLimit.allowed ? 'text-emerald-900' : 'text-amber-900'
                }`}
            >
              Proposal usage this month: {visibleProposalLimit.used}/{visibleProposalLimit.limit}
            </p>
            <p
              className={`text-xs mt-1 ${visibleProposalLimit.allowed ? 'text-emerald-700' : 'text-amber-700'
                }`}
            >
              {visibleProposalLimit.allowed
                ? `${visibleProposalLimit.remaining ?? 0} proposals remaining on your ${visibleProposalLimit.tier} plan.`
                : 'Limit reached. Upgrade your plan to continue creating proposals.'}
            </p>
          </div>
          <Link
            href="/admin/billing"
            className={`text-sm font-medium underline-offset-2 hover:underline ${visibleProposalLimit.allowed ? 'text-emerald-800' : 'text-amber-800'
              }`}
          >
            Open Billing
          </Link>
        </div>
      )}

      {loadingWhatsAppDraft && (
        <GlassCard padding="md" rounded="xl" opacity="high" className="border-[#eadfcd] bg-[#fffdf8]">
          <p className="text-sm text-[#6f5b3e]">Loading WhatsApp lead context...</p>
        </GlassCard>
      )}

      {whatsappDraft && (
        <GlassCard padding="md" rounded="xl" opacity="high" className="border-[#eadfcd] bg-[#fffdf8]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <GlassBadge variant="secondary">Prefilled from WhatsApp</GlassBadge>
                <span className="text-xs uppercase tracking-wide text-[#6f5b3e]">
                  Draft status: {whatsappDraft.status}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#1b140a]">{whatsappDraft.title}</p>
              <p className="mt-1 text-sm text-[#6f5b3e]">
                {[
                  whatsappDraft.destination,
                  whatsappDraft.travelDates,
                  whatsappDraft.groupSize ? `${whatsappDraft.groupSize} travellers` : null,
                  whatsappDraft.budgetInr
                    ? `Budget \u20B9${whatsappDraft.budgetInr.toLocaleString('en-IN')}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' \u2022 ')}
              </p>
            </div>
            <div className="rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#6f5b3e]">
              <p className="font-medium text-[#1b140a]">
                {whatsappDraft.travelerName || 'WhatsApp lead'}
              </p>
              <p>{whatsappDraft.travelerPhone}</p>
              {whatsappDraft.travelerEmail ? <p>{whatsappDraft.travelerEmail}</p> : null}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Client Selection */}
      <ClientSelector
        clients={clients}
        selectedClientId={selectedClientId}
        clientsError={clientsError}
        onSelectClient={setSelectedClientId}
        onClearClient={() => setSelectedClientId('')}
        onAddClient={handleAddClient}
        onRefresh={loadData}
        initialQuery={clientQueryOverride}
      />

      {/* Template Selection */}
      <TemplateSelector
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
        onTripStartDateChange={setTripStartDate}
        onTripEndDateChange={setTripEndDate}
        availabilityConflicts={availabilityConflicts}
        availabilityLoading={availabilityLoading}
        availabilityOverrideAccepted={availabilityOverrideAccepted}
        onAvailabilityOverride={() => setAvailabilityOverrideAccepted(true)}
        pricingSuggestion={pricingSuggestion}
        pricingSuggestionLoading={pricingSuggestionLoading}
      />

      {/* Options & Add-ons */}
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

      {/* Proposal Settings */}
      <ProposalSummary
        proposalTitle={proposalTitle}
        expirationDays={expirationDays}
        sendEmail={sendEmail}
        onTitleChange={setProposalTitle}
        onExpirationChange={setExpirationDays}
        onEmailToggle={setSendEmail}
      />

      {/* Create Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/proposals"
          className="px-6 py-3 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleCreateProposal}
          disabled={creating || !selectedClientId || !selectedTemplateId}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Proposal...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Create Proposal
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>A proposal will be created from the selected template</li>
          <li>You&apos;ll be able to customize activities and pricing</li>
          <li>A unique shareable link will be generated</li>
          <li>The client can view, comment, and approve the proposal</li>
          <li>You&apos;ll get real-time notifications when the client interacts</li>
        </ul>
      </div>
    </div>
  );
}
