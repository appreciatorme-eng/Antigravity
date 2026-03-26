'use client';

import { useState, useMemo } from 'react';
import { Search, X, Mail, MessageCircle, Building2 } from 'lucide-react';
import type { ChannelConversation } from './inbox-mock-data';
import { ErrorSection } from '@/components/ui/ErrorSection';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  type ChannelFilter,
  type FilterTab,
  type SortMode,
  UnifiedInboxConversationItem,
} from './unified-inbox-shared';

interface ConversationListPanelProps {
  conversations: ChannelConversation[];
  selectedId: string | null;
  isLoadingConvs: boolean;
  conversationsError: string | null;
  isDemoMode: boolean;
  isDisconnected: boolean;
  businessOnly: boolean;
  onBusinessOnlyChange: (value: boolean) => void;
  onSelect: (id: string) => void;
  onRetry: () => void;
  onConnectWhatsApp: () => void;
}

export function ConversationListPanel({
  conversations,
  selectedId,
  isLoadingConvs,
  conversationsError,
  isDemoMode,
  isDisconnected,
  businessOnly,
  onBusinessOnlyChange,
  onSelect,
  onRetry,
  onConnectWhatsApp,
}: ConversationListPanelProps) {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const filteredAndSorted = useMemo(() => {
    let list = conversations;

    // Filter by channel
    if (channelFilter === 'whatsapp') list = list.filter((c) => c.channel === 'whatsapp');
    else if (channelFilter === 'email') list = list.filter((c) => c.channel === 'email');

    // Filter by tab
    if (filterTab === 'clients') list = list.filter((c) => c.contact.type === 'client');
    else if (filterTab === 'drivers') list = list.filter((c) => c.contact.type === 'driver');
    else if (filterTab === 'leads') list = list.filter((c) => c.contact.type === 'lead');
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contact.name.toLowerCase().includes(q) ||
          c.contact.phone.includes(q) ||
          (c.contact.email?.toLowerCase().includes(q) ?? false) ||
          c.messages.some((m) => m.body?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortMode === 'unread') list = [...list].sort((a, b) => b.unreadCount - a.unreadCount);
    else if (sortMode === 'priority') {
      list = [...list].sort((a, b) => {
        const score = (c: ChannelConversation) => (c.unreadCount > 0 ? 10 : 0) + (c.contact.label === 'payment' ? 5 : 0);
        return score(b) - score(a);
      });
    }

    return list;
  }, [conversations, channelFilter, filterTab, search, sortMode]);

  const FILTER_TABS: Array<{ key: FilterTab; label: string; count?: number }> = [
    { key: 'all', label: 'All', count: conversations.length },
    { key: 'clients', label: 'Clients', count: conversations.filter((c) => c.contact.type === 'client').length },
    { key: 'drivers', label: 'Drivers', count: conversations.filter((c) => c.contact.type === 'driver').length },
    { key: 'leads', label: 'Leads', count: conversations.filter((c) => c.contact.type === 'lead').length },
  ];

  return (
    <div
      className={`w-[280px] shrink-0 flex flex-col border-r border-white/10 overflow-hidden ${
        isDisconnected ? 'pt-20' : ''
      }`}
      style={{ background: 'rgba(10,22,40,0.6)' }}
    >
      {/* Search */}
      <div className="shrink-0 p-3 border-b border-white/10">
        <div className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="w-3 h-3 text-slate-500 hover:text-white transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Business only toggle */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] font-semibold text-slate-400">Business Only</span>
        </div>
        <button
          onClick={() => onBusinessOnlyChange(!businessOnly)}
          className={`relative w-8 h-4 rounded-full transition-colors ${
            businessOnly ? 'bg-[#25D366]' : 'bg-white/15'
          }`}
          role="switch"
          aria-checked={businessOnly}
          aria-label="Show only business conversations"
        >
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
              businessOnly ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Channel filter */}
      <div className="shrink-0 flex gap-1 px-3 py-2 border-b border-white/10" role="tablist" aria-label="Conversation channel filter">
        {([
          { key: 'all' as ChannelFilter, label: 'All', icon: null },
          { key: 'whatsapp' as ChannelFilter, label: 'WhatsApp', icon: <MessageCircle className="w-3 h-3" /> },
          { key: 'email' as ChannelFilter, label: 'Email', icon: <Mail className="w-3 h-3" /> },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setChannelFilter(key)}
            role="tab"
            aria-selected={channelFilter === key}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              channelFilter === key
                ? key === 'email'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/8'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 flex gap-1 px-3 py-2 overflow-x-auto border-b border-white/10" role="tablist" aria-label="Conversation type filter">
        {FILTER_TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterTab(key)}
            role="tab"
            aria-selected={filterTab === key}
            className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              filterTab === key
                ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/8'
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                  filterTab === key ? 'bg-[#25D366] text-white' : 'bg-white/10 text-slate-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sort row */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5">
        <p className="text-[10px] text-slate-300 font-medium">{filteredAndSorted.length} conversations</p>
        <div className="flex gap-1">
          {(['recent', 'unread', 'priority'] as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortMode(s)}
              className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-colors ${
                sortMode === s ? 'bg-white/15 text-white' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ErrorSection label="Inbox conversation list">
          {isLoadingConvs && conversations.length === 0 ? null : filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 py-8 text-center">
            {isDemoMode ? (
              <>
                <EmptyState
                  icon="💬"
                  title="No conversations match your filter"
                  description="Try a different search or switch back to all channels."
                />
              </>
            ) : conversationsError ? (
              <EmptyState
                icon="⚠️"
                title="Inbox unavailable"
                description={conversationsError}
                action={{ label: 'Retry', onClick: onRetry }}
                className="py-8"
              />
            ) : channelFilter === 'email' ? (
              <EmptyState
                icon="📧"
                title="No emails yet"
                description="Email integration coming soon. Connect Gmail or Outlook to manage client emails here."
                className="py-8"
              />
            ) : (
              <EmptyState
                icon="💬"
                title="No conversations yet"
                description="Connect WhatsApp or wait for the first inbound message to turn this inbox live."
                action={{
                  label: 'Scan QR to Link WhatsApp',
                  onClick: onConnectWhatsApp,
                }}
                className="py-8"
              />
            )}
          </div>
        ) : (
          filteredAndSorted.map((conv) => (
            <UnifiedInboxConversationItem
              key={conv.id}
              conv={conv}
              selected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))
          )}
        </ErrorSection>
      </div>
    </div>
  );
}
