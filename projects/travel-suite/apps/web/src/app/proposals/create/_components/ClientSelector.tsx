'use client';

import { useState } from 'react';
import {
  RefreshCw,
  UserPlus,
  X,
  Search,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { Client } from '../_types';

function getClientLabel(c: Client) {
  const name = c.full_name || 'Unnamed Client';
  const email = c.email ? ` (${c.email})` : '';
  return `${name}${email}`;
}

export type ClientSelectorProps = {
  clients: Client[];
  selectedClientId: string;
  clientsError: string | null;
  onSelectClient: (id: string) => void;
  onClearClient: () => void;
  onAddClient: (name: string, email: string, phone: string) => Promise<void>;
  onRefresh: () => void;
  /** Pre-fill the search query (e.g. from WhatsApp draft) */
  initialQuery?: string;
};

export function ClientSelector({
  clients,
  selectedClientId,
  clientsError,
  onSelectClient,
  onClearClient,
  onAddClient,
  onRefresh,
  initialQuery = '',
}: ClientSelectorProps) {
  const [clientQuery, setClientQuery] = useState(initialQuery);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

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

  function clearClientSelection() {
    onClearClient();
    setClientQuery('');
  }

  async function handleQuickCreateClient() {
    const fullName = newClient.full_name.trim();
    const email = newClient.email.trim().toLowerCase();
    const phone = newClient.phone.trim();

    if (!fullName || !email) {
      return;
    }

    setCreatingClient(true);
    try {
      await onAddClient(fullName, email, phone);
      setNewClient({ full_name: '', email: '', phone: '' });
      setShowCreateClient(false);
      setClientPickerOpen(false);
    } finally {
      setCreatingClient(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[#1b140a]">Select Client</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRefresh()}
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
                        onSelectClient(c.id);
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
                          {[c.email, c.phone].filter(Boolean).join(' . ') || 'No contact details'}
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
                href="/clients"
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
  );
}
