'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  X,
  Search,
  ChevronDown,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

interface Client {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface TourTemplate {
  id: string;
  name: string;
  destination: string | null;
  duration_days: number | null;
  base_price: number | null;
  hero_image_url: string | null;
}

interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: 'Activities' | 'Dining' | 'Transport' | 'Upgrades' | string;
  image_url: string | null;
  duration: string | null;
  is_active: boolean;
}

interface FeatureLimitSnapshot {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
  tier: string;
  upgradePlan: string | null;
}

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [expirationDays, setExpirationDays] = useState(14);
  const [sendEmail, setSendEmail] = useState(true);

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<TourTemplate[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);

  // Client picker state
  const [clientQuery, setClientQuery] = useState('');
  const [clientPickerOpen, setClientPickerOpen] = useState(false);

  // Quick-create client state
  const [creatingClient, setCreatingClient] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClient, setNewClient] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  // Proposal options state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());
  const [proposalLimit, setProposalLimit] = useState<FeatureLimitSnapshot | null>(null);

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

  function filteredClientsForQuery() {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 50);
    return clients
      .filter((c) => {
        const name = (c.full_name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      })
      .slice(0, 50);
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;

  function getClientLabel(c: Client) {
    const name = c.full_name || 'Unnamed Client';
    const email = c.email ? ` (${c.email})` : '';
    return `${name}${email}`;
  }

  function clearClientSelection() {
    setSelectedClientId('');
    setClientQuery('');
  }

  async function handleQuickCreateClient() {
    const fullName = newClient.full_name.trim();
    const email = newClient.email.trim().toLowerCase();
    const phone = newClient.phone.trim();

    if (!fullName || !email) {
      toast({
        title: 'Missing client details',
        description: 'Name and email are required.',
        variant: 'warning',
      });
      return;
    }

    setCreatingClient(true);
    setError(null);
    setClientsError(null);

    try {
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
        return;
      }

      const userId = String(payload?.userId || '').trim();
      await loadData();

      if (userId) {
        setSelectedClientId(userId);
        setClientQuery(getClientLabel({ id: userId, full_name: fullName, email, phone }));
      }

      setNewClient({ full_name: '', email: '', phone: '' });
      setShowCreateClient(false);
      setClientPickerOpen(false);
    } catch (e) {
      console.error('Create client failed:', e);
      setError('Failed to create client');
    } finally {
      setCreatingClient(false);
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

      if (payload?.limit) {
        setProposalLimit({
          allowed: Boolean(payload.limit.allowed),
          used: Number(payload.limit.used || 0),
          limit: payload.limit.limit === null ? null : Number(payload.limit.limit || 0),
          remaining:
            payload.limit.remaining === null ? null : Number(payload.limit.remaining || 0),
          resetAt: payload.limit.resetAt || null,
          tier: String(payload.limit.tier || 'free'),
          upgradePlan: payload.limit.upgradePlan ? String(payload.limit.upgradePlan) : null,
        });
      }

      const proposalId = String(payload?.proposalId || '').trim();
      if (!proposalId) {
        setError('Proposal created but no proposal id was returned.');
        return;
      }

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
const vehicles = addOns.filter((a) => a.category === 'Transport');
const optionalAddOns = addOns.filter((a) => a.category !== 'Transport');
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

    {/* Client Selection */}
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[#1b140a]">Select Client</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 px-3 py-2 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh clients"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreateClient((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
            title="Create a client without leaving this page"
          >
            <UserPlus className="w-4 h-4" />
            New Client
          </button>
        </div>
      </div>

      {clientsError && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
          {clientsError}
        </div>
      )}

      <div className="relative">
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#bda87f] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={clientQuery}
              onChange={(e) => {
                setClientQuery(e.target.value);
                setClientPickerOpen(true);
              }}
              onFocus={() => setClientPickerOpen(true)}
              placeholder={clients.length ? 'Search client by name, email, or phone...' : 'No clients loaded yet'}
              className="w-full pl-10 pr-10 py-3 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
              aria-label="Search and select client"
            />
            <button
              type="button"
              onClick={() => setClientPickerOpen((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-50"
              aria-label="Toggle client list"
            >
              <ChevronDown className="w-4 h-4 text-[#6f5b3e]" />
            </button>
          </div>

          {selectedClientId ? (
            <button
              type="button"
              onClick={clearClientSelection}
              className="inline-flex items-center gap-2 px-3 py-3 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-gray-50 transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          ) : null}
        </div>

        {selectedClient && (
          <div className="mt-2 text-sm text-[#6f5b3e]">
            Selected: <span className="font-medium text-[#1b140a]">{getClientLabel(selectedClient)}</span>
          </div>
        )}

        {clientPickerOpen && (
          <div className="absolute z-20 mt-2 w-full bg-white border border-[#eadfcd] rounded-xl shadow-lg overflow-hidden">
            <div className="max-h-64 overflow-auto">
              {filteredClientsForQuery().length === 0 ? (
                <div className="p-4 text-sm text-[#6f5b3e]">No matching clients</div>
              ) : (
                filteredClientsForQuery().map((c) => {
                  const isSelected = c.id === selectedClientId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setClientQuery(getClientLabel(c));
                        setClientPickerOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#f8f1e6] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-[#1b140a] truncate">
                          {c.full_name || 'Unnamed Client'}
                        </div>
                        <div className="text-xs text-[#6f5b3e] truncate">
                          {[c.email, c.phone].filter(Boolean).join(' • ') || 'No contact details'}
                        </div>
                      </div>
                      {isSelected ? <Check className="w-4 h-4 text-[#9c7c46]" /> : null}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-[#eadfcd] p-3 flex items-center justify-between gap-2 bg-[#fffdf8]">
              <Link
                href="/admin/clients"
                target="_blank"
                className="text-sm text-[#6f5b3e] hover:underline"
              >
                Manage clients (opens new tab)
              </Link>
              <button
                type="button"
                onClick={() => setClientPickerOpen(false)}
                className="text-sm text-[#6f5b3e] hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateClient && (
        <div className="mt-6 p-4 rounded-xl border border-[#eadfcd] bg-[#fffdf8]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1b140a]">Create Client</h3>
              <p className="text-xs text-[#6f5b3e]">Creates the client and makes them selectable here.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateClient(false)}
              className="p-2 rounded-lg hover:bg-gray-50"
              aria-label="Close create client"
            >
              <X className="w-4 h-4 text-[#6f5b3e]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6f5b3e] mb-1">Full name</label>
              <input
                type="text"
                value={newClient.full_name}
                onChange={(e) => setNewClient((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
                placeholder="e.g., John Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6f5b3e] mb-1">Email</label>
              <input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
                placeholder="e.g., john@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6f5b3e] mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
                placeholder="e.g., +1 555 123 4567"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateClient(false)}
              className="px-4 py-2 border border-[#eadfcd] text-[#6f5b3e] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleQuickCreateClient}
              disabled={creatingClient}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Client
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Template Selection */}
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
      <h2 className="text-lg font-semibold text-[#1b140a] mb-4">Select Template</h2>

      {templates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#6f5b3e] mb-4">No templates found</p>
          <Link
            href="/admin/tour-templates/create"
            className="inline-flex items-center px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
          >
            Create Template First
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-4 py-3 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          >
            <option value="">-- Choose a template --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.destination && `- ${template.destination}`} (
                {template.duration_days} days)
              </option>
            ))}
          </select>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="mt-4 p-4 bg-[#f8f1e6] rounded-lg">
              <h3 className="font-semibold text-[#1b140a] mb-2">Template Preview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#bda87f]">Destination:</span>
                  <div className="text-[#1b140a] font-medium">
                    {selectedTemplate.destination || 'Not specified'}
                  </div>
                </div>
                <div>
                  <span className="text-[#bda87f]">Duration:</span>
                  <div className="text-[#1b140a] font-medium">
                    {selectedTemplate.duration_days} days
                  </div>
                </div>
                <div>
                  <span className="text-[#bda87f]">Base Price:</span>
                  <div className="text-[#1b140a] font-medium">
                    ${(selectedTemplate.base_price || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Options & Add-ons */}
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
      <h2 className="text-lg font-semibold text-[#1b140a] mb-2">Options & Add-ons</h2>
      <p className="text-sm text-[#6f5b3e] mb-4">
        Choose a vehicle type and optional add-ons. These will appear on the proposal and update pricing dynamically.
      </p>

      {addOns.length === 0 ? (
        <div className="text-sm text-[#6f5b3e]">
          No add-ons found. Create them in{' '}
          <Link href="/admin/add-ons" target="_blank" className="text-[#9c7c46] hover:underline">
            Admin → Add-ons
          </Link>{' '}
          (opens new tab). Use category <span className="font-medium">Transport</span> for vehicle types.
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h3 className="text-sm font-semibold text-[#1b140a]">Vehicle Type</h3>
              {selectedVehicleId ? (
                <button
                  type="button"
                  onClick={() => setSelectedVehicleId('')}
                  className="text-xs text-[#6f5b3e] hover:underline"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {vehicles.length === 0 ? (
              <div className="text-sm text-[#6f5b3e]">
                No Transport add-ons found. Add vehicle options under category <span className="font-medium">Transport</span>.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`p-4 rounded-xl border text-left transition-colors ${selectedVehicleId === v.id
                      ? 'border-[#9c7c46] bg-[#f8f1e6]'
                      : 'border-[#eadfcd] hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-[#1b140a] truncate">{v.name}</div>
                        {v.description ? (
                          <div className="text-xs text-[#6f5b3e] mt-1">{v.description}</div>
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold text-[#1b140a] whitespace-nowrap">
                        ${Number(v.price || 0).toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#1b140a] mb-2">Optional Add-ons</h3>
            {optionalAddOns.length === 0 ? (
              <div className="text-sm text-[#6f5b3e]">No optional add-ons available.</div>
            ) : (
              <div className="space-y-2">
                {optionalAddOns.slice(0, 30).map((a) => {
                  const checked = selectedAddOnIds.has(a.id);
                  return (
                    <label
                      key={a.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-[#eadfcd] hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedAddOnIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(a.id);
                            else next.delete(a.id);
                            return next;
                          });
                        }}
                        className="mt-1 w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-[#1b140a] truncate">{a.name}</div>
                          <div className="text-sm font-semibold text-[#1b140a] whitespace-nowrap">
                            ${Number(a.price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-xs text-[#6f5b3e] mt-0.5 truncate">
                          {[a.category, a.duration].filter(Boolean).join(' • ')}
                        </div>
                        {a.description ? (
                          <div className="text-xs text-[#6f5b3e] mt-1">{a.description}</div>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
                {optionalAddOns.length > 30 ? (
                  <div className="text-xs text-[#6f5b3e]">
                    Showing first 30 add-ons. Manage full list in{' '}
                    <Link href="/admin/add-ons" target="_blank" className="text-[#9c7c46] hover:underline">
                      Add-ons
                    </Link>
                    .
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-[#eadfcd] bg-[#fffdf8]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#1b140a]">Estimated Total</div>
                <div className="text-xs text-[#6f5b3e]">
                  Base template + selected options (final price also includes selected activities/hotels).
                </div>
              </div>
              <div className="text-xl font-semibold text-[#1b140a]">
                ${Number(estimatedTotal || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Proposal Settings */}
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
      <h2 className="text-lg font-semibold text-[#1b140a] mb-4">Proposal Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Proposal Title
          </label>
          <input
            type="text"
            value={proposalTitle}
            onChange={(e) => setProposalTitle(e.target.value)}
            placeholder="e.g., Classic Dubai - John Smith"
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <p className="text-xs text-[#bda87f] mt-1">
            Auto-generated from template and client name
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Expiration (Days)
          </label>
          <input
            type="number"
            value={expirationDays}
            onChange={(e) => setExpirationDays(parseInt(e.target.value) || 0)}
            min="0"
            max="90"
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <p className="text-xs text-[#bda87f] mt-1">
            Proposal will expire in {expirationDays} days (0 = never expires)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sendEmail"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
          />
          <label htmlFor="sendEmail" className="text-sm text-[#6f5b3e]">
            Send email notification to client after proposal creation
          </label>
        </div>
      </div>
    </div>

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
      <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 What happens next?</h3>
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
