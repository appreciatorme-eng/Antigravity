'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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

export default function CreateProposalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [expirationDays, setExpirationDays] = useState(14);
  const [sendEmail, setSendEmail] = useState(true);

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<TourTemplate[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, profiles(full_name, email, phone)')
        .eq('organization_id', profile.organization_id);

      if (clientsError) {
        console.error('Error loading clients:', clientsError);
      } else {
        const formattedClients = (clientsData || [])
          .map((client: any) => ({
            ...client,
            full_name: client.profiles?.full_name || 'Unknown',
            email: client.profiles?.email || '',
            phone: client.profiles?.phone || '',
          }))
          .sort((a: any, b: any) => (a.full_name || '').localeCompare(b.full_name || ''));
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
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProposal() {
    if (!selectedClientId || !selectedTemplateId) {
      alert('Please select both a client and a template');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        setError('Organization not found');
        return;
      }

      // Use the clone_template_to_proposal RPC function
      const { data: proposalId, error: cloneError } = await supabase.rpc(
        'clone_template_to_proposal',
        {
          p_template_id: selectedTemplateId,
          p_client_id: selectedClientId,
          p_created_by: user.id,
        }
      );

      if (cloneError) {
        console.error('Error cloning template:', cloneError);
        setError('Failed to create proposal. Please try again.');
        return;
      }

      // Update proposal title if custom title was provided
      if (proposalTitle && proposalId) {
        const { error: updateError } = await supabase
          .from('proposals')
          .update({ title: proposalTitle })
          .eq('id', proposalId);

        if (updateError) {
          console.error('Error updating proposal title:', updateError);
        }
      }

      // Set expiration date if specified
      if (expirationDays > 0 && proposalId) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + expirationDays);

        const { error: expirationError } = await supabase
          .from('proposals')
          .update({ expires_at: expirationDate.toISOString() })
          .eq('id', proposalId);

        if (expirationError) {
          console.error('Error setting expiration:', expirationError);
        }
      }

      // TODO: Send email notification if sendEmail is true
      // This would integrate with your existing email system

      // Redirect to the proposal view
      router.push(`/admin/proposals/${proposalId}`);
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/proposals"
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

      {/* Client Selection */}
      <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
        <h2 className="text-lg font-semibold text-[#1b140a] mb-4">Select Client</h2>

        {clients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#6f5b3e] mb-4">No clients found</p>
            <Link
              href="/admin/clients"
              className="inline-flex items-center px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
            >
              Add Client First
            </Link>
          </div>
        ) : (
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-4 py-3 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          >
            <option value="">-- Choose a client --</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name || 'Unnamed Client'} {client.email && `(${client.email})`}
              </option>
            ))}
          </select>
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
              Send email notification to client (Coming soon)
            </label>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/proposals"
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
          <li>You'll be able to customize activities and pricing</li>
          <li>A unique shareable link will be generated</li>
          <li>The client can view, comment, and approve the proposal</li>
          <li>You'll get real-time notifications when the client interacts</li>
        </ul>
      </div>
    </div>
  );
}
