'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface TourTemplate {
  id: string;
  name: string;
  destination: string | null;
  duration_days: number | null;
  base_price: number | null;
  hero_image_url: string | null;
}

interface Client {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ProposalGenerationStepProps {
  clientId: string;
  tripStartDate: string;
  tripEndDate: string;
  onProposalCreated?: (proposalId: string) => void;
}

export function ProposalGenerationStep({
  clientId,
  tripStartDate,
  tripEndDate,
  onProposalCreated,
}: ProposalGenerationStepProps) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<TourTemplate[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);
  const [createdProposalUrl, setCreatedProposalUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in');
        setLoading(false);
        return;
      }

      // Load organization ID
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

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('tour_templates')
        .select('id, name, destination, duration_days, base_price, hero_image_url')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (templatesError) {
        console.error('Error loading templates:', templatesError);
        setError('Failed to load templates');
      } else {
        setTemplates(templatesData || []);
        // Auto-select first template if available
        if (templatesData && templatesData.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(templatesData[0].id);
        }
      }

      // Load client details
      if (clientId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const clientsResp = await fetch('/api/admin/clients', { headers });
        if (clientsResp.ok) {
          const payload = await clientsResp.json();
          const clientsData = Array.isArray(payload?.clients) ? payload.clients : [];
          const foundClient = clientsData.find((c: Client) => c.id === clientId);
          if (foundClient) {
            setClient(foundClient);
            // Auto-generate title if we have both client and template
            if (templatesData && templatesData.length > 0 && !proposalTitle) {
              const template = templatesData[0];
              setProposalTitle(`${template.name} - ${foundClient.full_name || 'Client'}`);
            }
          }
        }
      }
    } catch (loadError) {
      console.error('Error loading data:', loadError);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [supabase, clientId, selectedTemplateId, proposalTitle]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Update title when template or client changes
  useEffect(() => {
    if (selectedTemplateId && client && templates.length > 0) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template && !proposalTitle) {
        setProposalTitle(`${template.name} - ${client.full_name || 'Client'}`);
      }
    }
  }, [selectedTemplateId, client, templates, proposalTitle]);

  const handleGenerateProposal = async () => {
    if (!selectedTemplateId || !clientId) {
      setError('Please select a template');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch('/api/proposals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          clientId,
          templateId: selectedTemplateId,
          title: proposalTitle || `Proposal for ${client?.full_name || 'Client'}`,
          expirationDays: 14,
          sendEmail: false,
          vehicleId: null,
          addOnIds: [],
          tripStartDate: tripStartDate || undefined,
          tripEndDate: tripEndDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create proposal');
      }

      const data = await response.json();
      const proposalId = data.proposalId || data.id;

      if (!proposalId) {
        throw new Error('No proposal ID returned');
      }

      setCreatedProposalId(proposalId);
      setCreatedProposalUrl(`/proposals/${proposalId}`);

      if (onProposalCreated) {
        onProposalCreated(proposalId);
      }
    } catch (createError) {
      console.error('Error creating proposal:', createError);
      setError(
        createError instanceof Error ? createError.message : 'Failed to generate proposal'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#9c7c46]" />
          <p className="mt-3 text-sm text-[#6f5b3e]">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (createdProposalId) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-green-900">Proposal Created Successfully!</h3>
              <p className="mt-1 text-sm text-green-700">
                Your first proposal has been generated and is ready to share with your client.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-[#9c7c46]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1b140a]">{proposalTitle}</p>
              <p className="mt-1 text-xs text-[#6f5b3e]">
                Client: {client?.full_name || 'Unknown'}
              </p>
              {tripStartDate && tripEndDate && (
                <p className="mt-1 text-xs text-[#6f5b3e]">
                  Travel dates: {new Date(tripStartDate).toLocaleDateString()} -{' '}
                  {new Date(tripEndDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {createdProposalUrl && (
          <a
            href={createdProposalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#9c7c46] px-4 py-2.5 text-white hover:bg-[#8a6b3d]"
          >
            View Proposal
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
          <p className="text-xs text-[#6f5b3e]">
            <span className="font-medium text-[#1b140a]">Next steps:</span> Review your proposal,
            customize the itinerary, adjust pricing, and share it with your client via email or
            WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-[#9c7c46]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9c7c46]">
              AI-powered proposal
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#1b140a]">
              Generate your first professional proposal
            </h3>
            <p className="mt-1 text-sm text-[#6f5b3e]">
              Select a template and create a polished proposal in seconds. You can customize every
              detail before sharing with your client.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {client && (
        <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[#9c7c46]">Client</p>
          <p className="mt-1 text-sm font-semibold text-[#1b140a]">
            {client.full_name || 'Unknown'}
          </p>
          {client.email && <p className="text-xs text-[#6f5b3e]">{client.email}</p>}
          {tripStartDate && tripEndDate && (
            <p className="mt-2 text-xs text-[#6f5b3e]">
              <span className="font-medium">Travel dates:</span>{' '}
              {new Date(tripStartDate).toLocaleDateString()} -{' '}
              {new Date(tripEndDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-[#6f5b3e]">
          Proposal Title *
        </label>
        <input
          type="text"
          value={proposalTitle}
          onChange={(e) => setProposalTitle(e.target.value)}
          placeholder="e.g. Rajasthan Heritage Tour - John Doe"
          className="w-full rounded-lg border border-[#eadfcd] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/25"
          required
        />
        <p className="mt-1 text-xs text-[#9c7c46]">Give your proposal a descriptive title that includes the destination and client name</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[#6f5b3e]">
          Select Template *
        </label>
        {templates.length === 0 ? (
          <div className="rounded-xl border border-[#eadfcd] bg-[#f8f1e6] p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-[#eadfcd]" />
            <p className="mt-2 text-sm font-medium text-[#6f5b3e]">No templates available</p>
            <p className="mt-1 text-xs text-[#9c7c46]">
              Create tour templates in your dashboard to use them in proposals.
            </p>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#dcc9aa] px-3 py-2 text-sm text-[#6f5b3e] transition hover:bg-[#f8f1e6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedTemplateId === template.id
                    ? 'border-[#9c7c46] bg-[#fcf8f1] ring-1 ring-[#9c7c46]'
                    : 'border-[#eadfcd] bg-white hover:border-[#9c7c46]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1b140a]">{template.name}</p>
                    {template.destination && (
                      <p className="mt-1 text-xs text-[#6f5b3e]">{template.destination}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#9c7c46]">
                      {template.duration_days && (
                        <span className="rounded-full border border-[#eadfcd] bg-white px-2 py-0.5">
                          {template.duration_days} days
                        </span>
                      )}
                      {template.base_price && (
                        <span className="rounded-full border border-[#eadfcd] bg-white px-2 py-0.5">
                          ₹{template.base_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedTemplateId === template.id && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#9c7c46]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={handleGenerateProposal}
          disabled={generating || !selectedTemplateId || !clientId || templates.length === 0}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#9c7c46] px-4 py-2.5 text-white transition hover:bg-[#8a6b3d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate Proposal</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={loadData}
          disabled={loading || generating}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dcc9aa] px-3 py-2.5 text-[#6f5b3e] transition hover:bg-[#f8f1e6] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-xl border border-[#eadfcd] bg-[#fcf8f1] p-4 text-sm text-[#6f5b3e]">
        <p>
          <span className="font-medium text-[#1b140a]">What happens next:</span> The proposal will
          be created with your selected template, automatically populated with the trip dates, and
          ready for you to customize before sending to your client.
        </p>
      </div>
    </div>
  );
}
